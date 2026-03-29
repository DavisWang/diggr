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
        onLoadGame: vi.fn(),
        onToggleHowTo: vi.fn(),
      },
    );

    const loadButton = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'Load Game');
    expect(loadButton).toBeTruthy();
    expect((loadButton as HTMLButtonElement).disabled).toBe(true);
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

  test('refinery modal shows totals and enables sell all when cargo exists', () => {
    const root = document.createElement('div');
    const state = createNewGame(2022);
    state.player.cargo.tinnite = 2;
    state.player.cargo.silverium = 1;
    state.player.cargoUsed = 3;
    openShop(state, 'refinery');

    renderGameplayUi(root, state, emptyHandlers());

    expect(root.textContent).toContain('Grand Total');
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
    onRestart: vi.fn(),
    onBackToTitle: vi.fn(),
  };
}
