import { CONSUMABLE_TYPES, EQUIPMENT_TIERS, REFINERY_TYPES, UPGRADE_TYPES, getConsumableSpriteFrame, getRefinerySpriteFrame, getUpgradeSpriteFrame } from '../src/config/content';
import { createNewGame, openShop } from '../src/game/logic';
import { renderGameplayUi, renderTitleScreen } from '../src/ui/renderers';

describe('ui rendering', () => {
  test('title screen disables load when no save exists', () => {
    const root = document.createElement('div');

    renderTitleScreen(
      root,
      { hasSave: false, showHowTo: false },
      {
        onNewGame: vi.fn(),
        onTestingGame: vi.fn(),
        onLoadGame: vi.fn(),
        onToggleHowTo: vi.fn(),
      },
    );

    const loadButton = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'Load Game');
    expect(loadButton).toBeTruthy();
    expect((loadButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('title screen exposes a testing mode entry point', () => {
    const root = document.createElement('div');

    renderTitleScreen(
      root,
      { hasSave: false, showHowTo: false },
      {
        onNewGame: vi.fn(),
        onTestingGame: vi.fn(),
        onLoadGame: vi.fn(),
        onToggleHowTo: vi.fn(),
      },
    );

    const testingButton = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'Testing Mode');
    expect(testingButton).toBeTruthy();
  });

  test('game HUD renders the key player metrics', () => {
    const root = document.createElement('div');
    const state = createNewGame(2020);
    state.player.cash = 345;
    state.player.totalEarnings = 780;

    renderGameplayUi(root, state, emptyHandlers());

    expect(root.textContent).toContain('Cash');
    expect(root.textContent).toContain('$345');
    expect(root.textContent).toContain('Total Earnings');
    expect(root.textContent).toContain('780');
  });

  test('upgrade modal disables purchase when funds are insufficient', () => {
    const root = document.createElement('div');
    const state = createNewGame(2021);
    state.player.cash = 0;
    openShop(state, 'upgrades');

    renderGameplayUi(root, state, emptyHandlers());

    const buyButton = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'Buy Upgrade');
    expect(buyButton).toBeTruthy();
    expect((buyButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('upgrade sprite frame helper covers all upgrade and tier combinations', () => {
    const frames = new Set<number>();

    for (const category of UPGRADE_TYPES) {
      for (const tier of EQUIPMENT_TIERS) {
        frames.add(getUpgradeSpriteFrame(category, tier));
      }
    }

    expect(frames).toHaveLength(36);
    expect(Math.min(...frames)).toBe(0);
    expect(Math.max(...frames)).toBe(35);
  });

  test('upgrade modal renders icon-only upgrade choice buttons', () => {
    const root = document.createElement('div');
    const state = createNewGame(2029);
    openShop(state, 'upgrades');

    renderGameplayUi(root, state, emptyHandlers());

    const choiceButtons = Array.from(root.querySelectorAll('[data-upgrade-choice="true"]'));
    expect(choiceButtons.length).toBeGreaterThan(0);
    expect(choiceButtons.every((button) => (button as HTMLButtonElement).textContent?.trim() === '')).toBe(true);
    expect(choiceButtons.every((button) => button.querySelector('.upgrade-icon-sprite'))).toBe(true);
  });

  test('consumable sprite frame helper covers all consumable combinations', () => {
    const frames = new Set<number>();

    for (const type of CONSUMABLE_TYPES) {
      frames.add(getConsumableSpriteFrame(type));
    }

    expect(frames).toHaveLength(8);
    expect(Math.min(...frames)).toBe(0);
    expect(Math.max(...frames)).toBe(7);
  });

  test('refinery sprite frame helper covers all sellable cargo types', () => {
    const frames = new Set<number>();

    for (const type of REFINERY_TYPES) {
      frames.add(getRefinerySpriteFrame(type));
    }

    expect(frames).toHaveLength(9);
    expect(Math.min(...frames)).toBe(0);
    expect(Math.max(...frames)).toBe(8);
  });

  test('consumable modal renders icon-only choice buttons and no quick-reference panel', () => {
    const root = document.createElement('div');
    const state = createNewGame(2032);
    openShop(state, 'consumables');

    renderGameplayUi(root, state, emptyHandlers());

    const choiceButtons = Array.from(root.querySelectorAll('[data-consumable-choice="true"]'));
    expect(choiceButtons.length).toBe(CONSUMABLE_TYPES.length);
    expect(choiceButtons.every((button) => (button as HTMLButtonElement).textContent?.includes('Quick Reference') === false)).toBe(true);
    expect(choiceButtons.every((button) => button.querySelector('.consumable-icon-sprite'))).toBe(true);
    expect(choiceButtons.every((button) => button.querySelector('.choice-badge--hotkey'))).toBe(true);
    expect(root.textContent).not.toContain('Quick Reference');
  });

  test('consumable icon selection state and detail panel stay in sync', () => {
    const root = document.createElement('div');
    const state = createNewGame(2033);
    state.mode = 'modal';
    state.modal = { type: 'consumables', selectedId: 'large_tnt' };
    state.player.inventory.large_tnt = 2;

    renderGameplayUi(root, state, emptyHandlers());

    const selectedButton = root.querySelector('[data-consumable-choice="true"].is-selected') as HTMLButtonElement | null;
    expect(selectedButton?.dataset.consumableType).toBe('large_tnt');
    expect(root.textContent).toContain('Large TNT');
    expect(root.textContent).toContain('$125');
    expect(root.textContent).toContain('Owned');
    expect(root.textContent).toContain('2');
  });

  test('clicking a consumable icon fires the selection handler', () => {
    const root = document.createElement('div');
    const state = createNewGame(2034);
    openShop(state, 'consumables');
    const handlers = emptyHandlers();

    renderGameplayUi(root, state, handlers);

    const spriteButton = root.querySelector('[data-consumable-choice="true"]') as HTMLButtonElement | null;
    spriteButton?.click();

    expect(handlers.onSelectConsumable).toHaveBeenCalledTimes(1);
  });

  test('upgrade icon selection state and detail panel stay in sync', () => {
    const root = document.createElement('div');
    const state = createNewGame(2030);
    state.mode = 'modal';
    state.modal = { type: 'upgrades', selectedCategory: 'fuel_tank', selectedId: 'fuel_tank:goldium' };

    renderGameplayUi(root, state, emptyHandlers());

    const selectedButton = root.querySelector('[data-upgrade-choice="true"].is-selected') as HTMLButtonElement | null;
    expect(selectedButton?.dataset.upgradeType).toBe('fuel_tank');
    expect(selectedButton?.dataset.upgradeTier).toBe('goldium');
    expect(root.textContent).toContain('Goldium Fuel Tank');
    expect(root.textContent).toContain('$300');
  });

  test('clicking an upgrade icon fires the tier selection handler', () => {
    const root = document.createElement('div');
    const state = createNewGame(2031);
    openShop(state, 'upgrades');
    const handlers = emptyHandlers();

    renderGameplayUi(root, state, handlers);

    const spriteButton = root.querySelector('[data-upgrade-choice="true"]') as HTMLButtonElement | null;
    spriteButton?.click();

    expect(handlers.onSelectUpgradeTier).toHaveBeenCalledTimes(1);
  });

  test('refinery modal shows totals and enables sell all when cargo exists', () => {
    const root = document.createElement('div');
    const state = createNewGame(2022);
    state.player.cargo.tinnite = 2;
    state.player.cargo.silverium = 1;
    state.player.cargoUsed = 3;
    openShop(state, 'refinery');

    renderGameplayUi(root, state, emptyHandlers());

    expect(root.textContent).toContain('Grand Total');
    expect(root.querySelectorAll('[data-refinery-entry="true"]')).toHaveLength(2);
    expect(Array.from(root.querySelectorAll('[data-refinery-entry="true"]')).every((node) => node.querySelector('.refinery-icon-sprite'))).toBe(true);
    const sellAll = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'Sell All');
    expect(sellAll).toBeTruthy();
    expect((sellAll as HTMLButtonElement).disabled).toBe(false);
  });

  test('close button dismiss handler fires for shop modals', () => {
    const root = document.createElement('div');
    const state = createNewGame(2024);
    openShop(state, 'consumables');
    const handlers = emptyHandlers();

    renderGameplayUi(root, state, handlers);

    const closeButton = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'X');
    closeButton?.click();

    expect(handlers.onCloseModal).toHaveBeenCalledTimes(1);
  });

  test('inventory modal lists only owned consumables', () => {
    const root = document.createElement('div');
    const state = createNewGame(2026);
    state.mode = 'modal';
    state.modal = { type: 'inventory' };
    state.player.inventory.small_tnt = 3;
    state.player.inventory.repair_microbot = 1;

    renderGameplayUi(root, state, emptyHandlers());

    expect(root.textContent).toContain('Small TNT ..... x3');
    expect(root.textContent).toContain('Repair Microbot ..... x1');
    expect(root.textContent).not.toContain('Large TNT');
    expect(root.textContent).not.toContain('Matter Transporter');
  });

  test('close button dismiss handler fires for inventory modal', () => {
    const root = document.createElement('div');
    const state = createNewGame(2027);
    state.mode = 'modal';
    state.modal = { type: 'inventory' };
    const handlers = emptyHandlers();

    renderGameplayUi(root, state, handlers);

    const closeButton = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'X');
    closeButton?.click();

    expect(handlers.onCloseModal).toHaveBeenCalledTimes(1);
  });

  test('sell all button fires its handler', () => {
    const root = document.createElement('div');
    const state = createNewGame(2025);
    state.player.cargo.tinnite = 2;
    state.player.cargoUsed = 2;
    openShop(state, 'refinery');
    const handlers = emptyHandlers();

    renderGameplayUi(root, state, handlers);

    const sellAll = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'Sell All');
    sellAll?.click();

    expect(handlers.onSellAllCargo).toHaveBeenCalledTimes(1);
  });

  test('save modal shows a single save action and fires its handler', () => {
    const root = document.createElement('div');
    const state = createNewGame(2028);
    state.mode = 'modal';
    state.modal = { type: 'save' };
    const handlers = emptyHandlers();

    renderGameplayUi(root, state, handlers);

    const buttons = Array.from(root.querySelectorAll('button'));
    const saveButton = buttons.find((button) => button.textContent === 'Save');
    saveButton?.click();

    expect(saveButton).toBeTruthy();
    expect(buttons.filter((button) => button.textContent === 'Save')).toHaveLength(1);
    expect(handlers.onSaveGame).toHaveBeenCalledTimes(1);
  });

  test('game over modal exposes restart and title actions', () => {
    const root = document.createElement('div');
    const state = createNewGame(2023);
    state.status = 'game_over';
    state.mode = 'modal';
    state.modal = { type: 'game_over', message: 'Fuel depleted.' };

    const handlers = emptyHandlers();
    renderGameplayUi(root, state, handlers);

    const restart = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'Restart');
    const title = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'Back To Title');

    restart?.click();
    title?.click();

    expect(handlers.onRestart).toHaveBeenCalledTimes(1);
    expect(handlers.onBackToTitle).toHaveBeenCalledTimes(1);
  });
});

function emptyHandlers() {
  return {
    onCloseModal: vi.fn(),
    onSelectUpgradeCategory: vi.fn(),
    onSelectUpgradeTier: vi.fn(),
    onBuySelectedUpgrade: vi.fn(),
    onSelectConsumable: vi.fn(),
    onBuySelectedConsumable: vi.fn(),
    onSellAllCargo: vi.fn(),
    onRepairAndRefuel: vi.fn(),
    onSaveGame: vi.fn(),
    onRestart: vi.fn(),
    onBackToTitle: vi.fn(),
  };
}
