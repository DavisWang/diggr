import Phaser from 'phaser';
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
import type { ConsumableType, ControlState, EquipmentTier, GameState, ScreenType, TickResult, UpgradeType } from '../types';
import { renderGameplayUi, renderTitleScreen } from './renderers';
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
  }

  mount(): void {
    this.shell.append(this.gameRoot, this.overlayRoot);
    this.root.append(this.shell);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleWindowKeydown, true);
      document.addEventListener('keydown', this.handleWindowKeydown, true);
    }
    this.showTitle();
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleWindowKeydown, true);
      document.removeEventListener('keydown', this.handleWindowKeydown, true);
    }

    this.game?.destroy(true);
    this.game = null;
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
    this.render();
  }

  startNewGame(): void {
    this.screen = 'gameplay';
    this.gameState = createNewGame();
    this.showHowTo = false;
    this.uiAccumulator = 1;
    this.uiDirty = true;
    this.overlayRoot.innerHTML = '';
    this.bootGame('gameplay');
    this.render();
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
    this.render();
  }

  restartGame(): void {
    clearSaveGame();
    this.startNewGame();
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

  sceneDidRender(): void {
    // Scenes only use this to request a UI sync after major transitions such as
    // boot. Continuous per-frame modal rerenders would make browser clicks flaky.
    this.uiDirty = true;
    this.render();
  }

  tick(controls: ControlState, dtSeconds: number): TickResult | null {
    if (!this.gameState || this.screen !== 'gameplay') {
      return null;
    }

    const previousUiState = {
      mode: this.gameState.mode,
      modalType: this.gameState.modal.type,
      status: this.gameState.status,
    };
    const result = tickGame(this.gameState, controls, dtSeconds);
    this.applyTickResult(result, dtSeconds, previousUiState);
    return result;
  }

  openShop(shop: 'upgrades' | 'consumables' | 'refinery' | 'service'): void {
    if (!this.gameState) {
      return;
    }

    openShop(this.gameState, shop);
    this.uiDirty = true;
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

    const previousUiState = {
      mode: this.gameState.mode,
      modalType: this.gameState.modal.type,
      status: this.gameState.status,
    };
    const result = tickGame(
      this.gameState,
      { left: false, right: false, up: false, down: false, consume: [], toggleInventory: true },
      0,
    );
    this.applyTickResult(result, 0, previousUiState);
  };

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
          onNewGame: () => this.startNewGame(),
          onLoadGame: () => this.loadSavedGame(),
          onToggleHowTo: () => {
            this.showHowTo = !this.showHowTo;
            this.uiDirty = true;
            this.render();
          },
        },
      );
      return;
    }

    if (!this.gameState) {
      return;
    }

    this.uiDirty = false;
    renderGameplayUi(this.overlayRoot, this.gameState, {
      onCloseModal: () => {
        if (!this.gameState) {
          return;
        }

        closeModal(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onSelectUpgradeCategory: (category) => {
        if (!this.gameState) {
          return;
        }

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

        setUpgradeSelection(this.gameState, category, tier);
        this.uiDirty = true;
        this.render();
      },
      onBuySelectedUpgrade: () => {
        if (!this.gameState || !this.gameState.modal.selectedCategory || !this.gameState.modal.selectedId) {
          return;
        }

        const [category, tier] = this.gameState.modal.selectedId.split(':') as [UpgradeType, EquipmentTier];
        buyUpgrade(this.gameState, category, tier);
        persistState(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onSelectConsumable: (type) => {
        if (!this.gameState) {
          return;
        }

        setConsumableSelection(this.gameState, type);
        this.uiDirty = true;
        this.render();
      },
      onBuySelectedConsumable: () => {
        if (!this.gameState || !this.gameState.modal.selectedId) {
          return;
        }

        buyConsumable(this.gameState, this.gameState.modal.selectedId as ConsumableType);
        persistState(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onSellAllCargo: () => {
        if (!this.gameState) {
          return;
        }

        sellAllCargo(this.gameState);
        persistState(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onRepairAndRefuel: () => {
        if (!this.gameState) {
          return;
        }

        repairAndRefuel(this.gameState);
        persistState(this.gameState);
        this.uiDirty = true;
        this.render();
      },
      onRestart: () => this.restartGame(),
      onBackToTitle: () => this.showTitle(),
    });
  }
}

function getNextTier(current: EquipmentTier): EquipmentTier | null {
  const tiers: EquipmentTier[] = ['bronzium', 'silverium', 'goldium', 'mithrium', 'adamantium', 'runite'];
  const index = tiers.indexOf(current);
  return tiers[index + 1] ?? null;
}
