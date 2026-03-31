import { PLAYER_HALF_HEIGHT, SAVE_VERSION, STORAGE_KEY, SURFACE_PADS } from '../config/content';
import type { GameState, SaveData } from '../types';

export const AUDIO_ENABLED_STORAGE_KEY = 'diggr-audio-enabled';

export function hasSaveGame(): boolean {
  return Boolean(loadSaveGame());
}

export function loadSaveGame(): SaveData | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== SAVE_VERSION) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function loadState(): GameState | null {
  return loadSaveGame()?.state ?? null;
}

export function persistState(state: GameState): SaveData | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const payload: SaveData = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: buildPersistedState(state),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

function buildPersistedState(state: GameState): GameState {
  const normalizedState: GameState = {
    ...state,
    meta: {
      ...state.meta,
      updatedAt: new Date().toISOString(),
    },
  };

  if (state.modal.type !== 'save' && state.blockedShopUntilExit !== 'save') {
    return normalizedState;
  }

  const savePad = SURFACE_PADS.find((pad) => pad.shop === 'save');
  const safeSurfaceX = savePad?.x ?? state.player.position.x;
  const safeSurfaceY = -PLAYER_HALF_HEIGHT - 0.02;

  return {
    ...normalizedState,
    mode: 'gameplay',
    modal: { type: 'none' },
    modalDismissGraceRemaining: 0,
    blockedShopUntilExit: 'save',
    player: {
      ...normalizedState.player,
      position: { x: safeSurfaceX, y: safeSurfaceY },
      velocity: { x: 0, y: 0 },
      lastSurfaceZone: null,
    },
  };
}

export function clearSaveGame(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

export function loadAudioEnabledPreference(): boolean {
  if (typeof localStorage === 'undefined') {
    return true;
  }

  const raw = localStorage.getItem(AUDIO_ENABLED_STORAGE_KEY);
  if (raw === null) {
    return true;
  }

  return raw !== '0';
}

export function persistAudioEnabledPreference(enabled: boolean): boolean {
  if (typeof localStorage === 'undefined') {
    return enabled;
  }

  localStorage.setItem(AUDIO_ENABLED_STORAGE_KEY, enabled ? '1' : '0');
  return enabled;
}
