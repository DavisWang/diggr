import Phaser from 'phaser';
import { AudioManager } from '../audio/engine';
import { BLOCK_DEFS, CONSUMABLE_TYPES } from '../config/content';
import { clearSaveGame, hasSaveGame, loadState, persistState } from '../lib/storage';
import {
  buyConsumable,
  buyUpgrade,
  closeModal,
  createNewGame,
  openShop,
  repairAndRefuel,
  restoreGame,
  sellAllCargo,
  setConsumableSelection,
  setUpgradeSelection,
  tickGame,
} from '../game/logic';
import { getCell } from '../game/world';
import { applyDocumentLocale, getLocale, setLocale, t } from '../i18n';
import type { ConsumableType, ControlState, EquipmentTier, GameState, ScreenType, TickResult, UpgradeType } from '../types';
import { renderChromeBar, renderGameplayUi, renderTitleScreen } from './renderers';
import { GameScene } from '../phaser/GameScene';
import { TitleScene } from '../phaser/TitleScene';
import { matchesInventoryCloseKey, shouldHandleInventoryToggleHotkey } from '../phaser/keyboard';

// DiggrApp is the browser shell around the pure gameplay rules. It owns scene
// bootstrapping, DOM overlays, save persistence, and app-level hotkeys that
// must survive Phaser scene resets.
export class DiggrApp {
  private readonly root: HTMLElement;
  private readonly shell: HTMLDivElement;
  private readonly gameRoot: HTMLDivElement;
  private readonly overlayRoot: HTMLDivElement;
  private readonly chromeRoot: HTMLDivElement;
  private readonly audio = new AudioManager();
  private game: Phaser.Game | null = null;
  private screen: ScreenType = 'title';
  private gameState: GameState | null = null;
  private showHowTo = false;
  private uiAccumulator = 0;
  private uiDirty = true;

  constructor(root: HTMLElement) {
    this.root = root;
    this.shell = document.createElement('div');
    this.shell.className = 'diggr-shell';
    this.gameRoot = document.createElement('div');
    this.gameRoot.className = 'diggr-game-root';
    this.overlayRoot = document.createElement('div');
    this.overlayRoot.className = 'diggr-overlay-root';
    this.chromeRoot = document.createElement('div');
    this.chromeRoot.className = 'diggr-chrome-root';
  }

  mount(): void {
    this.shell.append(this.gameRoot, this.overlayRoot, this.chromeRoot);
    this.root.append(this.shell);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleWindowKeydown, true);
      document.addEventListener('keydown', this.handleWindowKeydown, true);
    }
    this.shell.addEventListener('pointerdown', this.handleShellPointerDown, true);
    applyDocumentLocale();
    this.showTitle();
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleWindowKeydown, true);
      document.removeEventListener('keydown', this.handleWindowKeydown, true);
    }

    this.shell.removeEventListener('pointerdown', this.handleShellPointerDown, true);
    this.game?.destroy(true);
    this.game = null;
    this.audio.dispose();
    this.root.innerHTML = '';
  }

  showTitle(): void {
    this.screen = 'title';
    this.gameState = null;
    this.showHowTo = false;
    this.uiAccumulator = 0;
    this.uiDirty = true;
    this.overlayRoot.innerHTML = '';
    this.bootGame('title');
    this.syncPersistentAudioState();
    this.render();
  }

  startNewGame(): void {
    this.startGame(false);
  }

  startTestingGame(): void {
    this.startGame(true);
  }

  loadSavedGame(): void {
    const loaded = loadState();
    if (!loaded) {
      return;
    }

    this.screen = 'gameplay';
    this.gameState = restoreGame(loaded);
    this.uiAccumulator = 1;
    this.uiDirty = true;
    this.overlayRoot.innerHTML = '';
    this.bootGame('gameplay');
    this.syncPersistentAudioState();
    this.render();
  }

  restartGame(): void {
    const testingMode = Boolean(this.gameState?.meta.testingMode);
    clearSaveGame();
    this.startGame(testingMode);
  }

  getState(): GameState | null {
    return this.gameState;
  }

  getScreen(): ScreenType {
    return this.screen;
  }

  getOverlayRoot(): HTMLDivElement {
    return this.overlayRoot;
  }

  getChromeRoot(): HTMLDivElement {
    return this.chromeRoot;
  }

  isAudioEnabled(): boolean {
    return this.audio.isEnabled();
  }

  sceneDidRender(): void {
    // Scenes only use this to request a UI sync after major transitions such as
    // boot. Continuous per-frame modal rerenders would make browser clicks flaky.
    this.uiDirty = true;
    this.render();
  }

  tick(controls: ControlState, dtSeconds: number): TickResult | null {
    return this.runGameplayTick(controls, dtSeconds);
  }

  openShop(shop: 'upgrades' | 'consumables' | 'refinery' | 'service' | 'save'): void {
    if (!this.gameState) {
      return;
    }

    const previousModalType = this.gameState.modal.type;
    openShop(this.gameState, shop);
    if (previousModalType !== this.gameState.modal.type) {
      this.audio.playCue('shop_open');
    }
    this.syncPersistentAudioState();
    this.uiDirty = true;
    this.render();
  }

  private startGame(testingMode: boolean): void {
    this.screen = 'gameplay';
    this.gameState = createNewGame(undefined, { testingMode });
    this.showHowTo = false;
    this.uiAccumulator = 1;
    this.uiDirty = true;
    this.overlayRoot.innerHTML = '';
    this.bootGame('gameplay');
    this.syncPersistentAudioState();
    this.render();
  }

  private bootGame(screen: ScreenType): void {
    this.game?.destroy(true);
    this.gameRoot.innerHTML = '';
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: this.gameRoot,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#070b11',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: screen === 'title' ? [TitleScene, GameScene] : [GameScene, TitleScene],
    });
    this.game.registry.set('app', this);
  }

  private handleWindowKeydown = (event: KeyboardEvent): void => {
    if (this.screen !== 'gameplay' || !this.gameState) {
      return;
    }

    const wantsInventoryToggle = shouldHandleInventoryToggleHotkey(event);
    const wantsInventoryClose = this.gameState.mode === 'modal' && this.gameState.modal.type === 'inventory' && matchesInventoryCloseKey(event);
    if (!wantsInventoryToggle && !wantsInventoryClose) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.handleUserGesture();
    this.runGameplayTick({ left: false, right: false, up: false, down: false, consume: [], toggleInventory: true }, 0);
  };

  private handleShellPointerDown = (): void => {
    this.handleUserGesture();
  };

  private runGameplayTick(controls: ControlState, dtSeconds: number): TickResult | null {
    if (!this.gameState || this.screen !== 'gameplay') {
      return null;
    }

    const previousUiState = {
      mode: this.gameState.mode,
      modalType: this.gameState.modal.type,
      status: this.gameState.status,
    };
    const audioSnapshot = captureAudioSnapshot(this.gameState);
    const result = tickGame(this.gameState, controls, dtSeconds);
    this.applyTickResult(result, dtSeconds, previousUiState);
    this.syncAudioAfterTick(audioSnapshot, controls, result);
    return result;
  }

  private applyTickResult(
    result: TickResult,
    dtSeconds: number,
    previousUiState: { mode: GameState['mode']; modalType: GameState['modal']['type']; status: GameState['status'] },
  ): void {
    if (!this.gameState) {
      return;
    }

    this.uiAccumulator += dtSeconds;
    const modalChanged =
      previousUiState.mode !== this.gameState.mode || previousUiState.modalType !== this.gameState.modal.type;
    const statusChanged = previousUiState.status !== this.gameState.status;

    // These are discrete events that justify a save and immediate UI refresh.
    // Steady-state modal screens are handled by modalChanged/statusChanged below.
    if (result.surfaceReturn || result.gameOver || result.openedShop) {
      persistState(this.gameState);
      this.uiAccumulator = 1;
      this.uiDirty = true;
    }

    if (modalChanged || statusChanged) {
      this.uiAccumulator = 0;
      this.uiDirty = true;
    }

    if (this.uiDirty || (this.gameState.mode !== 'modal' && this.uiAccumulator >= 0.1)) {
      this.uiAccumulator = 0;
      this.render();
    }
  }

  private render(): void {
    if (this.screen === 'title') {
      this.uiDirty = false;
      renderTitleScreen(
        this.overlayRoot,
        {
          hasSave: hasSaveGame(),
          showHowTo: this.showHowTo,
        },
        {
          onNewGame: () => {
            this.handleUserGesture();
            this.startNewGame();
          },
          onTestingGame: () => {
            this.handleUserGesture();
            this.startTestingGame();
          },
          onLoadGame: () => {
            this.handleUserGesture();
            this.loadSavedGame();
          },
          onToggleHowTo: () => {
            this.handleUserGesture();
            this.showHowTo = !this.showHowTo;
            this.uiDirty = true;
            this.render();
          },
        },
      );
      this.renderChrome();
      return;
    }

    if (!this.gameState) {
      this.renderChrome();
      return;
    }

    this.uiDirty = false;
    renderGameplayUi(this.overlayRoot, this.gameState, {
      onCloseModal: () => {
        if (!this.gameState) {
          return;
        }

        this.handleUserGesture();
        closeModal(this.gameState);
        this.syncPersistentAudioState();
        this.uiDirty = true;
        this.render();
      },
      onSelectUpgradeCategory: (category) => {
        if (!this.gameState) {
          return;
        }

        this.handleUserGesture();
        const nextTier = getNextTier(this.gameState.player.equipment[category]);
        if (nextTier) {
          setUpgradeSelection(this.gameState, category, nextTier);
        } else {
          this.gameState.modal.selectedCategory = category;
          this.gameState.modal.selectedId = undefined;
        }
        this.uiDirty = true;
        this.render();
      },
      onSelectUpgradeTier: (category, tier) => {
        if (!this.gameState) {
          return;
        }

        this.handleUserGesture();
        setUpgradeSelection(this.gameState, category, tier);
        this.uiDirty = true;
        this.render();
      },
      onBuySelectedUpgrade: () => {
        if (!this.gameState || !this.gameState.modal.selectedCategory || !this.gameState.modal.selectedId) {
          return;
        }

        this.handleUserGesture();
        const previousCash = this.gameState.player.cash;
        const selectedCategory = this.gameState.modal.selectedCategory;
        const previousTier = this.gameState.player.equipment[selectedCategory];
        const [category, tier] = this.gameState.modal.selectedId.split(':') as [UpgradeType, EquipmentTier];
        buyUpgrade(this.gameState, category, tier);
        if (previousTier !== this.gameState.player.equipment[category] || previousCash !== this.gameState.player.cash) {
          this.audio.playCue('buy_success_upgrade');
        }
        persistState(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onSelectConsumable: (type) => {
        if (!this.gameState) {
          return;
        }

        this.handleUserGesture();
        setConsumableSelection(this.gameState, type);
        this.uiDirty = true;
        this.render();
      },
      onBuySelectedConsumable: () => {
        if (!this.gameState || !this.gameState.modal.selectedId) {
          return;
        }

        this.handleUserGesture();
        const selectedId = this.gameState.modal.selectedId as ConsumableType;
        const previousOwned = this.gameState.player.inventory[selectedId];
        const previousCash = this.gameState.player.cash;
        buyConsumable(this.gameState, selectedId);
        if (previousOwned !== this.gameState.player.inventory[selectedId] || previousCash !== this.gameState.player.cash) {
          this.audio.playCue('buy_success_consumable');
        }
        persistState(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onSellAllCargo: () => {
        if (!this.gameState) {
          return;
        }

        this.handleUserGesture();
        const sold = sellAllCargo(this.gameState);
        if (sold) {
          this.audio.playCue('sell_cargo');
        }
        persistState(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onRepairAndRefuel: () => {
        if (!this.gameState) {
          return;
        }

        this.handleUserGesture();
        const previousHealth = this.gameState.player.health;
        const previousFuel = this.gameState.player.fuel;
        const previousCash = this.gameState.player.cash;
        repairAndRefuel(this.gameState);
        if (
          previousHealth !== this.gameState.player.health ||
          previousFuel !== this.gameState.player.fuel ||
          previousCash !== this.gameState.player.cash
        ) {
          this.audio.playCue('service');
        }
        persistState(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onSaveGame: () => {
        if (!this.gameState) {
          return;
        }

        this.handleUserGesture();
        closeModal(this.gameState);
        persistState(this.gameState);
        this.gameState.toast = t('toast.game_saved');
        this.audio.playCue('save');
        this.syncPersistentAudioState();
        this.uiDirty = true;
        this.render();
      },
      onRestart: () => {
        this.handleUserGesture();
        this.restartGame();
      },
      onBackToTitle: () => {
        this.handleUserGesture();
        this.showTitle();
      },
    });
    this.renderChrome();
  }

  private handleUserGesture(): void {
    this.audio.registerUserGesture();
  }

  private renderChrome(): void {
    const enabled = this.audio.isEnabled();
    const locale = getLocale();
    const existingBar = this.chromeRoot.querySelector('[data-chrome-bar="true"]');
    const existingLocaleBtn = this.chromeRoot.querySelector('[data-locale-toggle="true"]') as HTMLButtonElement | null;
    const existingAudio = this.chromeRoot.querySelector('[data-audio-toggle="true"]') as HTMLButtonElement | null;
    if (
      existingBar &&
      existingLocaleBtn?.dataset.locale === locale &&
      existingAudio?.getAttribute('aria-pressed') === String(enabled)
    ) {
      return;
    }
    this.chromeRoot.innerHTML = '';
    this.chromeRoot.append(
      renderChromeBar({
        locale,
        audioEnabled: enabled,
        onLocaleToggle: () => {
          this.handleUserGesture();
          const next = getLocale() === 'en' ? 'zh-CN' : 'en';
          setLocale(next);
          this.uiDirty = true;
          this.render();
          this.renderChrome();
        },
        onAudioToggle: () => {
          this.handleUserGesture();
          this.audio.toggleEnabled();
          this.syncPersistentAudioState();
          this.renderChrome();
        },
      }),
    );
  }

  private syncPersistentAudioState(): void {
    const state = this.gameState;
    if (!state || this.screen !== 'gameplay') {
      this.audio.setLoopActive('drill', false);
      this.audio.setLoopActive('thruster', false);
      this.audio.setLoopActive('earthquake', false);
      return;
    }

    this.audio.setLoopActive('drill', Boolean(state.player.activeDrill) && state.status === 'active' && state.mode === 'gameplay');
    this.audio.setLoopActive('thruster', false);
    this.audio.setLoopActive('earthquake', Boolean(state.activeEarthquake));
  }

  private syncAudioAfterTick(previous: AudioSnapshot, controls: ControlState, result: TickResult): void {
    if (!this.gameState) {
      return;
    }

    const state = this.gameState;
    const thrusterActive =
      state.status === 'active' &&
      state.mode === 'gameplay' &&
      controls.up &&
      !state.player.activeDrill &&
      state.player.fuel < previous.fuel - 0.001;

    this.audio.setLoopActive('drill', Boolean(state.player.activeDrill) && state.status === 'active' && state.mode === 'gameplay');
    this.audio.setLoopActive('thruster', thrusterActive);
    this.audio.setLoopActive('earthquake', Boolean(state.activeEarthquake));

    if (!previous.activeDrill && state.player.activeDrill) {
      this.audio.playCue('drill_start');
    }

    if (previous.activeDrill && !state.player.activeDrill) {
      const resolvedCell = getCell(state.world, previous.activeDrill.x, previous.activeDrill.row);
      if (resolvedCell.type === 'air') {
        const block = BLOCK_DEFS[previous.activeDrill.blockType];
        this.audio.playCue('drill_break');
        if (previous.activeDrill.blockType === 'lava' || previous.activeDrill.blockType === 'hidden_lava') {
          this.audio.playCue('lava_burn');
        }
        if (block.immediateCash && state.player.totalEarnings > previous.totalEarnings) {
          this.audio.playCue('ore_treasure');
        } else if (state.player.cargoUsed > previous.cargoUsed) {
          this.audio.playCue('ore_gain');
        } else if (block.cargo > 0) {
          this.audio.playCue('cargo_discard');
        }
      }
    }

    for (const type of CONSUMABLE_TYPES) {
      if (state.player.inventory[type] < previous.inventory[type]) {
        this.audio.playCue(getConsumableCue(type));
      }
    }

    if (state.player.health < previous.health) {
      const fallLike = previous.airborne && !state.player.airborne && previous.velocityY > 0.9;
      if (fallLike) {
        this.audio.playCue('fall_impact');
      }
    }

    if (!previous.activeEarthquakeId && state.activeEarthquake) {
      this.audio.playCue('earthquake_start');
    }

    if (previous.activeEarthquakeId && !state.activeEarthquake) {
      this.audio.playCue('earthquake_settle');
    }

    if (result.openedShop) {
      this.audio.playCue('shop_open');
    }

    if (previous.status === 'active' && state.status === 'game_over') {
      this.audio.playCue('game_over');
    }
  }
}

function getNextTier(current: EquipmentTier): EquipmentTier | null {
  const tiers: EquipmentTier[] = ['bronzium', 'silverium', 'goldium', 'mithrium', 'adamantium', 'runite'];
  const index = tiers.indexOf(current);
  return tiers[index + 1] ?? null;
}

interface AudioSnapshot {
  status: GameState['status'];
  health: number;
  fuel: number;
  cargoUsed: number;
  totalEarnings: number;
  inventory: GameState['player']['inventory'];
  activeDrill: NonNullable<GameState['player']['activeDrill']> | null;
  airborne: boolean;
  velocityY: number;
  activeEarthquakeId: number | null;
}

function captureAudioSnapshot(state: GameState): AudioSnapshot {
  return {
    status: state.status,
    health: state.player.health,
    fuel: state.player.fuel,
    cargoUsed: state.player.cargoUsed,
    totalEarnings: state.player.totalEarnings,
    inventory: { ...state.player.inventory },
    activeDrill: state.player.activeDrill ? { ...state.player.activeDrill } : null,
    airborne: state.player.airborne,
    velocityY: state.player.velocity.y,
    activeEarthquakeId: state.activeEarthquake?.id ?? null,
  };
}

function getConsumableCue(type: ConsumableType) {
  switch (type) {
    case 'repair_nanobot':
    case 'repair_microbot':
      return 'repair_use' as const;
    case 'small_fuel_tank':
    case 'large_fuel_tank':
      return 'fuel_use' as const;
    case 'small_tnt':
      return 'explosive_small' as const;
    case 'large_tnt':
      return 'explosive_large' as const;
    case 'matter_transporter':
      return 'teleport_use' as const;
    case 'quantum_fissurizer':
      return 'fissurizer_launch' as const;
    default:
      return 'repair_use' as const;
  }
}
