import { CONSUMABLE_DEFS, UPGRADE_TYPES } from '../config/content';
import {
  computeServiceCost,
  getCargoEntries,
  getCurrentDepth,
  getHowToCopy,
  getPlayerCargoRatio,
  getSelectedUpgrade,
  getUpgradeChoices,
} from '../game/logic';
import type {
  ConsumableType,
  EquipmentTier,
  GameState,
  ShopType,
  UpgradeType,
} from '../types';

interface TitleHandlers {
  onNewGame: () => void;
  onLoadGame: () => void;
  onToggleHowTo: () => void;
}

interface GameplayHandlers {
  onCloseModal: () => void;
  onSelectUpgradeCategory: (category: UpgradeType) => void;
  onSelectUpgradeTier: (category: UpgradeType, tier: EquipmentTier) => void;
  onBuySelectedUpgrade: () => void;
  onSelectConsumable: (type: ConsumableType) => void;
  onBuySelectedConsumable: () => void;
  onSellAllCargo: () => void;
  onRepairAndRefuel: () => void;
  onRestart: () => void;
  onBackToTitle: () => void;
}

export function renderTitleScreen(
  root: HTMLElement,
  options: { hasSave: boolean; showHowTo: boolean },
  handlers: TitleHandlers,
): void {
  root.innerHTML = '';

  const wrapper = div('title-screen');
  const card = div('panel title-card');
  card.append(
    element('h1', 'title-heading', 'DIGGR'),
    element(
      'p',
      'title-tagline',
      'Single-player digging RPG. Mine deeper, haul ore back to the surface, and upgrade the rig before lava, gravity, or fuel loss end the run.',
    ),
  );

  const actions = div('title-actions');
  actions.append(
    button('New Game', handlers.onNewGame),
    button('Load Game', handlers.onLoadGame, { disabled: !options.hasSave }),
    button(options.showHowTo ? 'Hide How To Play' : 'How To Play', handlers.onToggleHowTo),
  );

  card.append(actions, element('div', 'title-footer', 'By Pwner Studios'));
  wrapper.append(card);
  root.append(wrapper);

  if (options.showHowTo) {
    root.append(renderHowToModal(handlers.onToggleHowTo));
  }
}

export function renderGameplayUi(root: HTMLElement, state: GameState, handlers: GameplayHandlers): void {
  root.innerHTML = '';
  root.append(renderHud(state));

  if (state.modal.type !== 'none') {
    root.append(renderModalForState(state, handlers));
  }

  if (state.toast) {
    const toast = div('panel toast');
    toast.textContent = state.toast;
    root.append(toast);
  }
}

function renderHud(state: GameState): HTMLElement {
  const hud = div('hud');
  const leftPanel = div('panel hud-panel');
  const rightPanel = div('panel hud-panel');

  const depth = getCurrentDepth(state.player.position);
  const cargoPercent = Math.round(getPlayerCargoRatio(state.player) * 100);

  leftPanel.append(
    statLine('Cash', `$${state.player.cash.toFixed(0)}`),
    statLine('Total Earnings', `$${state.player.totalEarnings.toFixed(0)}`),
    statLine('Zone', state.player.lastSurfaceZone ?? (depth > 0 ? 'Underground' : 'Surface')),
  );

  rightPanel.append(
    statLine('Health', `${Math.ceil(state.player.health)} / ${state.player.maxHealth}`),
    statLine('Fuel', `${Math.ceil(state.player.fuel)} / ${state.player.maxFuel}`),
    statLine('Depth', `${depth} m`),
    statLine('Cargo', `${cargoPercent}% (${state.player.cargoUsed}/${state.player.cargoCapacity})`),
  );

  hud.append(leftPanel, rightPanel);
  return hud;
}

function renderModalForState(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const scrim = div('modal-scrim');
  const card = div('panel modal-card');
  const title = getModalTitle(state.modal.type);
  const header = div('modal-header');
  header.append(element('h2', 'modal-title', title));

  if (state.modal.type !== 'game_over') {
    header.append(button('X', handlers.onCloseModal, { className: 'modal-close' }));
  }

  card.append(header);

  switch (state.modal.type) {
    case 'inventory':
      card.append(renderInventoryModal(state));
      break;
    case 'upgrades':
      card.append(renderUpgradeModal(state, handlers));
      break;
    case 'consumables':
      card.append(renderConsumableModal(state, handlers));
      break;
    case 'refinery':
      card.append(renderRefineryModal(state, handlers));
      break;
    case 'service':
      card.append(renderServiceModal(state, handlers));
      break;
    case 'game_over':
      card.append(renderGameOverModal(state, handlers));
      break;
    default:
      card.append(renderHowToBody());
      break;
  }

  scrim.append(card);
  return scrim;
}

function renderInventoryModal(state: GameState): HTMLElement {
  const body = div('modal-body');
  const list = div('inventory-list-centered');
  const entries = (Object.entries(CONSUMABLE_DEFS) as [ConsumableType, typeof CONSUMABLE_DEFS[ConsumableType]][])
    .filter(([type]) => state.player.inventory[type] > 0);

  if (entries.length === 0) {
    list.append(element('div', 'inventory-row', 'No consumables in inventory.'));
  } else {
    for (const [type, def] of entries) {
      list.append(element('div', 'inventory-row', `${def.label} ..... x${state.player.inventory[type]}`));
    }
  }

  body.append(list, element('p', 'status-line', 'Press Q or X to close.'));
  return body;
}

function renderUpgradeModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const layout = div('shop-layout');
  const categories = div('shop-category-list');

  for (const category of UPGRADE_TYPES) {
    const selected = state.modal.selectedCategory === category;
    categories.append(
      button(prettyUpgradeType(category), () => handlers.onSelectUpgradeCategory(category), {
        className: selected ? 'choice-button is-selected' : 'choice-button',
      }),
    );
  }

  const choicesWrap = div('choice-grid');
  const category = state.modal.selectedCategory ?? 'hull';
  const choices = getUpgradeChoices(state, category);
  if (choices.length === 0) {
    choicesWrap.append(element('div', 'metric', 'Max tier reached.'));
  } else {
    for (const choice of choices) {
      const selected = state.modal.selectedId === `${category}:${choice.tier}`;
      choicesWrap.append(
        button(`${choice.label}  $${choice.price}`, () => handlers.onSelectUpgradeTier(category, choice.tier), {
          className: selected ? 'choice-button is-selected' : 'choice-button',
        }),
      );
    }
  }

  const detailPanel = renderUpgradeDetail(state, handlers);
  layout.append(categories, choicesWrap, detailPanel);
  body.append(layout);
  return body;
}

function renderUpgradeDetail(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const detail = div('panel detail-panel');
  const selected = getSelectedUpgrade(state);
  if (!selected) {
    detail.append(element('p', 'detail-copy', 'Choose an upgrade to inspect pricing and effects.'));
    return detail;
  }

  detail.append(
    element('h3', 'detail-title', selected.label),
    element('p', 'detail-copy', selected.description),
    statLine('Current Tier', prettyTier(state.player.equipment[state.modal.selectedCategory ?? 'hull'])),
    statLine('Target Tier', prettyTier(selected.tier)),
    statLine('Price', `$${selected.price}`),
  );

  detail.append(
    button('Buy Upgrade', handlers.onBuySelectedUpgrade, {
      disabled: state.player.cash < selected.price,
    }),
  );
  return detail;
}

function renderConsumableModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const layout = div('shop-layout');
  const inventoryGrid = div('inventory-grid');

  for (const [type, def] of Object.entries(CONSUMABLE_DEFS) as [ConsumableType, typeof CONSUMABLE_DEFS[ConsumableType]][]) {
    const selected = state.modal.selectedId === type;
    const owned = state.player.inventory[type];
    inventoryGrid.append(
      button(`${def.label} (${def.hotkey}) x${owned}`, () => handlers.onSelectConsumable(type), {
        className: selected ? 'choice-button is-selected' : 'choice-button',
      }),
    );
  }

  const selectedType = (state.modal.selectedId as ConsumableType | undefined) ?? 'repair_nanobot';
  const selectedDef = CONSUMABLE_DEFS[selectedType];
  const detail = div('panel detail-panel');
  detail.append(
    element('h3', 'detail-title', selectedDef.label),
    element('p', 'detail-copy', selectedDef.description),
    statLine('Hotkey', selectedDef.hotkey),
    statLine('Owned', String(state.player.inventory[selectedType])),
    statLine('Price', `$${selectedDef.price}`),
    button('Buy Item', handlers.onBuySelectedConsumable, {
      disabled: state.player.cash < selectedDef.price || state.player.inventory[selectedType] >= 99,
    }),
  );

  const quickRef = div('panel detail-panel');
  quickRef.append(element('h3', 'detail-title', 'Quick Reference'));
  for (const [type, count] of Object.entries(state.player.inventory)) {
    quickRef.append(element('div', 'metric', `${CONSUMABLE_DEFS[type as ConsumableType].hotkey}  ${CONSUMABLE_DEFS[type as ConsumableType].label} x${count}`));
  }

  layout.append(inventoryGrid, detail, quickRef);
  body.append(layout);
  return body;
}

function renderRefineryModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const entries = getCargoEntries(state);
  const total = entries.reduce((sum, entry) => sum + entry.subtotal, 0);
  const layout = div('shop-layout');
  const list = div('sell-list');

  if (entries.length === 0) {
    list.append(element('div', 'metric', 'No ore or treasure in cargo.'));
  } else {
    for (const entry of entries) {
      list.append(element('div', 'metric', `${entry.label} x${entry.amount} ...... $${entry.subtotal}`));
    }
    list.append(element('div', 'metric', `Grand Total ...... $${total}`));
  }

  const detail = div('panel detail-panel');
  detail.append(
    element('h3', 'detail-title', 'Sell All Cargo'),
    element('p', 'detail-copy', 'Refine and sell every ore and treasure stack in the hold in one action.'),
    statLine('Total', `$${total}`),
    button('Sell All', handlers.onSellAllCargo, { disabled: total <= 0 }),
  );

  layout.append(list, detail);
  body.append(layout);
  return body;
}

function renderServiceModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const panel = div('panel detail-panel');
  const cost = computeServiceCost(state);
  panel.append(
    element('h3', 'detail-title', 'Repair And Refuel'),
    element('p', 'detail-copy', 'Restore the hull and refill the tank in one service action.'),
    statLine('Cost', cost <= 0 ? 'No service needed' : `$${cost}`),
    button('Repair And Refuel', handlers.onRepairAndRefuel, {
      disabled: cost <= 0 || state.player.cash < cost,
    }),
  );
  body.append(panel);
  return body;
}

function renderGameOverModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  body.append(
    element('p', 'detail-copy', state.modal.message ?? 'The digger was lost.'),
    element(
      'p',
      'detail-copy',
      `Run summary: depth ${getCurrentDepth(state.player.position)}m, total earnings $${state.player.totalEarnings.toFixed(0)}.`,
    ),
  );

  const actions = div('modal-actions');
  actions.append(button('Restart', handlers.onRestart), button('Back To Title', handlers.onBackToTitle));
  body.append(actions);
  return body;
}

function renderHowToModal(onClose: () => void): HTMLElement {
  const scrim = div('modal-scrim');
  const card = div('panel modal-card');
  const header = div('modal-header');
  header.append(element('h2', 'modal-title', 'How To Play'), button('X', onClose, { className: 'modal-close' }));
  card.append(header, renderHowToBody());
  scrim.append(card);
  return scrim;
}

function renderHowToBody(): HTMLElement {
  const body = div('modal-body');
  body.append(element('p', 'status-line', 'Goal: dig, refine, upgrade, and survive deeper runs.'));
  const list = div('copy-list');
  for (const line of getHowToCopy()) {
    list.append(element('div', '', line));
  }
  body.append(list);
  return body;
}

function getModalTitle(type: ShopType | GameState['modal']['type']): string {
  switch (type) {
    case 'upgrades':
      return 'Upgrades Shop';
    case 'inventory':
      return 'Inventory';
    case 'consumables':
      return 'Consumables Shop';
    case 'refinery':
      return 'Ore Refinery';
    case 'service':
      return 'Repair + Refuel';
    case 'game_over':
      return 'Game Over';
    default:
      return 'How To Play';
  }
}

function statLine(label: string, value: string): HTMLElement {
  const wrapper = div('metric');
  wrapper.append(element('span', 'hud-label', label), element('span', '', value));
  return wrapper;
}

function prettyUpgradeType(type: UpgradeType): string {
  switch (type) {
    case 'cargo_hold':
      return 'Cargo Hold';
    case 'fuel_tank':
      return 'Fuel Tank';
    default:
      return capitalize(type);
  }
}

function prettyTier(tier: EquipmentTier): string {
  return capitalize(tier);
}

function capitalize(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function div(className: string): HTMLDivElement {
  const node = document.createElement('div');
  node.className = className;
  return node;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function button(
  text: string,
  onClick: () => void,
  options: { disabled?: boolean; className?: string } = {},
): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `diggr-button ${options.className ?? ''}`.trim();
  node.textContent = text;
  node.disabled = Boolean(options.disabled);
  node.addEventListener('click', onClick);
  return node;
}
