import { SAVE_VERSION, STORAGE_KEY } from '../config/content';
import type { GameState, SaveData } from '../types';

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
    state: {
      ...state,
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
      },
    },
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function clearSaveGame(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
