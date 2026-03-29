const gameInstances: Array<{ destroy: ReturnType<typeof vi.fn>; registry: { set: ReturnType<typeof vi.fn> } }> = [];

vi.mock('phaser', () => {
  class Scene {
    game = { registry: { get: vi.fn() } };
    cameras = { main: { setBackgroundColor: vi.fn(), startFollow: vi.fn(), setBounds: vi.fn(), worldView: { y: 0 }, height: 720 } };
    add = {
      graphics: vi.fn(() => ({
        clear: vi.fn(),
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        lineStyle: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn(),
      })),
      rectangle: vi.fn(() => ({
        setStrokeStyle: vi.fn(),
        setSize: vi.fn(),
        setDisplaySize: vi.fn(),
        setPosition: vi.fn(),
      })),
      text: vi.fn(() => ({
        setOrigin: vi.fn(),
        setPosition: vi.fn(),
        setFontSize: vi.fn(),
        setAlpha: vi.fn(),
      })),
    };
    input = { keyboard: { createCursorKeys: vi.fn(), addKeys: vi.fn() } };
    scale = { on: vi.fn(), width: 1280, height: 720 };

    constructor(_key?: string) {}
  }

  const Game = vi.fn().mockImplementation(() => {
    const instance = {
      registry: { set: vi.fn() },
      destroy: vi.fn(),
    };
    gameInstances.push(instance);
    return instance;
  });

  return {
    default: {
      AUTO: 0,
      Scale: {
        RESIZE: 0,
        CENTER_BOTH: 0,
      },
      Scene,
      Game,
      Input: {
        Keyboard: {
          JustDown: (key: { justDown?: boolean } | undefined) => Boolean(key?.justDown),
          KeyCodes: {
            Z: 90,
            A: 65,
            X: 88,
            S: 83,
            C: 67,
            D: 68,
            F: 70,
            V: 86,
            Q: 81,
          },
        },
      },
      Display: {
        Color: {
          HexStringToColor: () => ({ color: 0 }),
        },
      },
    },
  };
});

import { createNewGame } from '../src/game/logic';
import { DiggrApp } from '../src/ui/DiggrApp';

describe('app shell', () => {
  const mountedApps: DiggrApp[] = [];

  beforeEach(() => {
    gameInstances.length = 0;
  });

  afterEach(() => {
    while (mountedApps.length > 0) {
      mountedApps.pop()?.destroy();
    }
  });

  test('q toggles inventory through the app-level browser hotkey path', () => {
    const { app } = createMountedTestApp();
    mountedApps.push(app);

    app.startNewGame();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true }));

    expect(app.getState()?.mode).toBe('modal');
    expect(app.getState()?.modal.type).toBe('inventory');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true }));

    expect(app.getState()?.mode).toBe('gameplay');
    expect(app.getState()?.modal.type).toBe('none');
  });

  test('testing mode boots a boosted sandbox state', () => {
    const { app } = createMountedTestApp();
    mountedApps.push(app);

    app.startTestingGame();

    expect(app.getState()?.meta.testingMode).toBe(true);
    expect(app.getState()?.player.maxHealth).toBe(10000);
    expect(app.getState()?.player.maxFuel).toBe(10000);
    expect(app.getState()?.player.cash).toBeGreaterThanOrEqual(999999);
  });

  test('q hotkey still toggles inventory when bubbling listeners stop propagation', () => {
    const { app } = createMountedTestApp();
    mountedApps.push(app);

    app.startNewGame();

    const stopAtBubble = (event: KeyboardEvent) => {
      event.stopPropagation();
    };
    document.body.addEventListener('keydown', stopAtBubble);

    const hotkey = new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true, cancelable: true });
    document.body.dispatchEvent(hotkey);

    document.body.removeEventListener('keydown', stopAtBubble);

    expect(hotkey.defaultPrevented).toBe(true);
    expect(app.getState()?.mode).toBe('modal');
    expect(app.getState()?.modal.type).toBe('inventory');
  });

  test('x hotkey closes inventory through the app-level browser path', () => {
    const { app } = createMountedTestApp();
    mountedApps.push(app);

    app.startNewGame();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true }));
    expect(app.getState()?.modal.type).toBe('inventory');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', bubbles: true }));

    expect(app.getState()?.mode).toBe('gameplay');
    expect(app.getState()?.modal.type).toBe('none');
  });

  test('modal DOM stays stable across idle gameplay ticks while inventory is open', () => {
    const { app, overlayRoot } = createMountedTestApp();
    mountedApps.push(app);

    app.startNewGame();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true }));
    const initialModal = overlayRoot.querySelector('.modal-scrim');

    app.tick({ left: false, right: false, up: false, down: false, consume: [] }, 0.016);

    expect(overlayRoot.querySelector('.modal-scrim')).toBe(initialModal);
    expect(app.getState()?.modal.type).toBe('inventory');
  });

  test('save modal persists the game and returns to gameplay', () => {
    const { app, overlayRoot } = createMountedTestApp();
    mountedApps.push(app);

    app.startNewGame();
    app.getState()!.player.cash = 432;
    app.openShop('save');

    const saveButton = Array.from(overlayRoot.querySelectorAll('button')).find((button) => button.textContent === 'Save');
    saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const persisted = localStorage.getItem('diggr-save-slot') ?? '';
    expect(persisted).toContain('"cash":432');
    expect(persisted).toContain('"mode":"gameplay"');
    expect(persisted).toContain('"modal":{"type":"none"}');
    expect(app.getState()?.mode).toBe('gameplay');
    expect(app.getState()?.modal.type).toBe('none');
    expect(app.getState()?.toast).toBe('Game saved.');
  });

  test('loading a save created at the save balloon starts on the ground without reopening the modal', () => {
    const { app } = createMountedTestApp();
    mountedApps.push(app);

    app.startNewGame();
    app.openShop('save');
    app.getState()!.player.position = { x: 6.35, y: -2.4 };
    localStorage.setItem(
      'diggr-save-slot',
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        state: app.getState(),
      }),
    );

    app.showTitle();
    app.loadSavedGame();

    expect(app.getState()?.mode).toBe('gameplay');
    expect(app.getState()?.modal.type).toBe('none');
    expect(app.getState()?.player.position.y).toBeCloseTo(-0.44, 4);
    expect(app.getState()?.player.position.x).toBeCloseTo(6.35, 4);
  });

  test('restart button transitions to a fresh gameplay state from game over', () => {
    const { app, overlayRoot } = createMountedTestApp();
    mountedApps.push(app);
    const state = createNewGame(3030);
    state.status = 'game_over';
    state.mode = 'modal';
    state.modal = { type: 'game_over', message: 'Fuel depleted.' };
    state.player.cash = 0;
    (app as unknown as { gameState: typeof state | null }).gameState = state;
    (app as unknown as { screen: 'gameplay' }).screen = 'gameplay';
    (app as unknown as { render: () => void }).render();

    const restartButton = Array.from(overlayRoot.querySelectorAll('button')).find((button) => button.textContent === 'Restart');
    restartButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(app.getScreen()).toBe('gameplay');
    expect(app.getState()).not.toBeNull();
    expect(app.getState()?.status).toBe('active');
    expect(app.getState()?.player.cash).toBeGreaterThan(0);
    expect(gameInstances).toHaveLength(2);
    expect(gameInstances[0].destroy).toHaveBeenCalledWith(true);
  });

  test('restart still works after idle game-over ticks', () => {
    const { app, overlayRoot } = createMountedTestApp();
    mountedApps.push(app);
    const state = createNewGame(4040);
    state.status = 'game_over';
    state.mode = 'modal';
    state.modal = { type: 'game_over', message: 'Fuel depleted.' };
    (app as unknown as { gameState: typeof state | null }).gameState = state;
    (app as unknown as { screen: 'gameplay' }).screen = 'gameplay';
    (app as unknown as { render: () => void }).render();

    const initialModal = overlayRoot.querySelector('.modal-scrim');
    app.tick({ left: false, right: false, up: false, down: false, consume: [] }, 0.016);
    app.tick({ left: false, right: false, up: false, down: false, consume: [] }, 0.016);

    expect(overlayRoot.querySelector('.modal-scrim')).toBe(initialModal);

    const restartButton = Array.from(overlayRoot.querySelectorAll('button')).find((button) => button.textContent === 'Restart');
    restartButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(app.getScreen()).toBe('gameplay');
    expect(app.getState()?.status).toBe('active');
  });

  test('back to title button returns to the title scene from game over', () => {
    const { app, overlayRoot } = createMountedTestApp();
    mountedApps.push(app);
    const state = createNewGame(3031);
    state.status = 'game_over';
    state.mode = 'modal';
    state.modal = { type: 'game_over', message: 'Hull integrity failed.' };
    (app as unknown as { gameState: typeof state | null }).gameState = state;
    (app as unknown as { screen: 'gameplay' }).screen = 'gameplay';
    (app as unknown as { render: () => void }).render();

    const titleButton = Array.from(overlayRoot.querySelectorAll('button')).find((button) => button.textContent === 'Back To Title');
    titleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(app.getScreen()).toBe('title');
    expect(app.getState()).toBeNull();
    expect(overlayRoot.textContent).toContain('New Game');
    expect(gameInstances).toHaveLength(2);
    expect(gameInstances[0].destroy).toHaveBeenCalledWith(true);
  });

  test('back to title still works after idle game-over ticks', () => {
    const { app, overlayRoot } = createMountedTestApp();
    mountedApps.push(app);
    const state = createNewGame(4041);
    state.status = 'game_over';
    state.mode = 'modal';
    state.modal = { type: 'game_over', message: 'Hull integrity failed.' };
    (app as unknown as { gameState: typeof state | null }).gameState = state;
    (app as unknown as { screen: 'gameplay' }).screen = 'gameplay';
    (app as unknown as { render: () => void }).render();

    const initialModal = overlayRoot.querySelector('.modal-scrim');
    app.tick({ left: false, right: false, up: false, down: false, consume: [] }, 0.016);
    app.tick({ left: false, right: false, up: false, down: false, consume: [] }, 0.016);

    expect(overlayRoot.querySelector('.modal-scrim')).toBe(initialModal);

    const titleButton = Array.from(overlayRoot.querySelectorAll('button')).find((button) => button.textContent === 'Back To Title');
    titleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(app.getScreen()).toBe('title');
    expect(app.getState()).toBeNull();
  });
});

function createMountedTestApp() {
  const app = new DiggrApp(document.createElement('div'));
  app.mount();

  return {
    app,
    overlayRoot: app.getOverlayRoot(),
  };
}
