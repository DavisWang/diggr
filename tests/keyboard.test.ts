import { shouldHandleInventoryToggleHotkey } from '../src/phaser/keyboard';

describe('inventory hotkey capture', () => {
  test('accepts a plain q press', () => {
    expect(shouldHandleInventoryToggleHotkey({ code: 'KeyQ', key: 'q' })).toBe(true);
  });

  test('ignores repeated and modified q presses', () => {
    expect(shouldHandleInventoryToggleHotkey({ code: 'KeyQ', key: 'q', repeat: true })).toBe(false);
    expect(shouldHandleInventoryToggleHotkey({ code: 'KeyQ', key: 'q', ctrlKey: true })).toBe(false);
    expect(shouldHandleInventoryToggleHotkey({ code: 'KeyQ', key: 'q', metaKey: true })).toBe(false);
    expect(shouldHandleInventoryToggleHotkey({ code: 'KeyQ', key: 'q', altKey: true })).toBe(false);
  });

  test('ignores q when typing into editable controls', () => {
    expect(
      shouldHandleInventoryToggleHotkey({
        code: 'KeyQ',
        key: 'q',
        target: { tagName: 'INPUT', isContentEditable: false } as unknown as EventTarget,
      }),
    ).toBe(false);

    expect(
      shouldHandleInventoryToggleHotkey({
        code: 'KeyQ',
        key: 'q',
        target: { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget,
      }),
    ).toBe(false);
  });
});
