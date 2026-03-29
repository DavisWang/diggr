export interface InventoryHotkeyEventLike {
  code?: string;
  key?: string;
  repeat?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  target?: EventTarget | null;
}

export function shouldHandleInventoryToggleHotkey(event: InventoryHotkeyEventLike): boolean {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
    return false;
  }

  if (!matchesInventoryToggleKey(event)) {
    return false;
  }

  if (isTextEntryTarget(event.target)) {
    return false;
  }

  return true;
}

export function matchesInventoryToggleKey(event: Pick<InventoryHotkeyEventLike, 'code' | 'key'>): boolean {
  return event.code === 'KeyQ' || event.key === 'q' || event.key === 'Q';
}

export function matchesInventoryCloseKey(event: Pick<InventoryHotkeyEventLike, 'code' | 'key'>): boolean {
  return event.code === 'KeyX' || event.key === 'x' || event.key === 'X';
}

function isTextEntryTarget(target: EventTarget | null | undefined): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const maybeElement = target as {
    tagName?: string;
    isContentEditable?: boolean;
  };

  if (maybeElement.isContentEditable) {
    return true;
  }

  return maybeElement.tagName === 'INPUT' || maybeElement.tagName === 'TEXTAREA' || maybeElement.tagName === 'SELECT';
}
