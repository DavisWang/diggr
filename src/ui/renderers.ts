import {
  CONSUMABLE_ICON_FRAME_SIZE,
  CONSUMABLE_ICON_SHEET_COLUMNS,
  CONSUMABLE_ICON_SHEET_ROWS,
  CONSUMABLE_DEFS,
  REFINERY_ICON_FRAME_SIZE,
  REFINERY_ICON_SHEET_COLUMNS,
  REFINERY_ICON_SHEET_ROWS,
  SURFACE_PADS,
  UPGRADE_ICON_FRAME_SIZE,
  UPGRADE_ICON_SHEET_COLUMNS,
  UPGRADE_ICON_SHEET_ROWS,
  UPGRADE_TYPES,
  getConsumableSpriteFrame,
  getRefinerySpriteFrame,
  getUpgradeSpriteFrame,
} from '../config/content';
import {
  computeServiceCost,
  getCargoEntries,
  getCurrentDepth,
  getPlayerCargoRatio,
  getSelectedUpgrade,
  getUpgradeChoices,
} from '../game/logic';
import {
  blockLabel,
  consumableDescription,
  consumableLabel,
  formatToast,
  getHowToFooterLines,
  surfaceShopLabel,
  t,
  tierPrettyName,
  upgradeCategoryLabel,
  upgradeDescription,
  upgradeLabel,
  type Locale,
} from '../i18n';
import type {
  ConsumableType,
  EquipmentTier,
  GameState,
  SellableMaterial,
  ShopType,
  UpgradeType,
} from '../types';

const UPGRADE_ICON_SHEET_URL = new URL('../assets/sprites/upgrade-shop-icons.png', import.meta.url).href;
const CONSUMABLE_ICON_SHEET_URL = new URL('../assets/sprites/consumable-shop-icons.png', import.meta.url).href;
const REFINERY_ICON_SHEET_URL = new URL('../assets/sprites/refinery-shop-icons.png', import.meta.url).href;
const DIGGER_SHEET_URL = new URL('../assets/sprites/digger-sheet.png', import.meta.url).href;
const TERRAIN_SHEET_URL = new URL('../assets/sprites/terrain-sheet.png', import.meta.url).href;
const SHOP_SHEET_URL = new URL('../assets/sprites/surface-shops.png', import.meta.url).href;

const DIGGER_SHEET_COLUMNS = 5;
const TERRAIN_SHEET_COLUMNS = 4;
const SHOP_SHEET_COLUMNS = 4;

interface TitleHandlers {
  onNewGame: () => void;
  onTestingGame: () => void;
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
  onSaveGame: () => void;
  onRestart: () => void;
  onBackToTitle: () => void;
}

const SVG_SPEAKER_ON = `<svg class="chrome-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/></svg>`;

const SVG_SPEAKER_OFF = `<svg class="chrome-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

const SVG_GLOBE = `<svg class="chrome-tool-icon chrome-tool-icon--globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;

export interface ChromeBarHandlers {
  locale: Locale;
  audioEnabled: boolean;
  onLocaleToggle: () => void;
  onAudioToggle: () => void;
}

/** Bottom-right chrome: language (single toggle) + icon audio control. */
export function renderChromeBar(handlers: ChromeBarHandlers): HTMLElement {
  const bar = div('diggr-chrome-bar');
  bar.dataset.chromeBar = 'true';

  const localeBtn = document.createElement('button');
  localeBtn.type = 'button';
  localeBtn.className = 'chrome-tool-btn chrome-tool-btn--locale';
  localeBtn.dataset.localeToggle = 'true';
  localeBtn.dataset.locale = handlers.locale;
  localeBtn.setAttribute('aria-label', handlers.locale === 'en' ? t('lang.aria_to_zh') : t('lang.aria_to_en'));
  localeBtn.innerHTML = `${SVG_GLOBE}<span class="chrome-locale-badge" aria-hidden="true">${handlers.locale === 'en' ? 'EN' : '中'}</span>`;
  localeBtn.addEventListener('click', handlers.onLocaleToggle);

  const audioBtn = document.createElement('button');
  audioBtn.type = 'button';
  audioBtn.className = `chrome-tool-btn chrome-tool-btn--audio${handlers.audioEnabled ? '' : ' is-muted'}`;
  audioBtn.dataset.audioToggle = 'true';
  audioBtn.setAttribute('aria-pressed', String(handlers.audioEnabled));
  audioBtn.setAttribute('aria-label', handlers.audioEnabled ? t('audio.aria_on') : t('audio.aria_off'));
  audioBtn.innerHTML = handlers.audioEnabled ? SVG_SPEAKER_ON : SVG_SPEAKER_OFF;
  audioBtn.addEventListener('click', handlers.onAudioToggle);

  bar.append(localeBtn, audioBtn);
  return bar;
}

export function renderTitleScreen(
  root: HTMLElement,
  options: { hasSave: boolean; showHowTo: boolean },
  handlers: TitleHandlers,
): void {
  root.innerHTML = '';

  const wrapper = div('title-screen');
  const card = div('panel title-card');
  const hero = div('title-hero');
  const copy = div('title-copy');
  const heading = renderPixelTitleLogo();
  heading.dataset.titleHeading = 'true';
  copy.append(
    element('p', 'title-tagline', t('title.tagline')),
  );

  const actions = div('title-actions');
  actions.append(
    button(t('title.new_game'), handlers.onNewGame),
    button(t('title.testing'), handlers.onTestingGame),
    button(t('title.load'), handlers.onLoadGame, { disabled: !options.hasSave }),
    button(options.showHowTo ? t('title.howto_hide') : t('title.howto_show'), handlers.onToggleHowTo),
  );

  copy.append(actions);
  hero.append(copy, renderTitleArtPanel());
  card.append(heading, hero, element('div', 'title-footer', t('title.footer')));
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

  const toastText = formatToast(state.toast);
  if (toastText) {
    const toast = div('panel toast');
    toast.textContent = toastText;
    root.append(toast);
  }
}

function renderHud(state: GameState): HTMLElement {
  const hud = div('hud');
  const leftPanel = div('panel hud-panel');
  const rightPanel = div('panel hud-panel');

  const depth = getCurrentDepth(state.player.position);
  const cargoPercent = Math.round(getPlayerCargoRatio(state.player) * 100);

  const zoneLabel = state.player.lastSurfaceZone
    ? surfaceShopLabel(state.player.lastSurfaceZone)
    : depth > 0
      ? t('hud.zone_underground')
      : t('hud.zone_surface');

  leftPanel.append(
    statLine(t('hud.cash'), `$${state.player.cash.toFixed(0)}`),
    statLine(t('hud.total_earnings'), `$${state.player.totalEarnings.toFixed(0)}`),
    statLine(t('hud.mode'), state.meta.testingMode ? t('hud.mode_testing') : t('hud.mode_standard')),
    statLine(t('hud.zone'), zoneLabel),
  );

  rightPanel.append(
    statLine(t('hud.health'), `${Math.ceil(state.player.health)} / ${state.player.maxHealth}`),
    statLine(t('hud.fuel'), `${Math.ceil(state.player.fuel)} / ${state.player.maxFuel}`),
    statLine(t('hud.depth'), `${depth} ${t('hud.depth_suffix')}`),
    statLine(t('hud.cargo'), `${cargoPercent}% (${state.player.cargoUsed}/${state.player.cargoCapacity})`),
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
    header.append(button(t('modal.close'), handlers.onCloseModal, { className: 'modal-close' }));
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
    case 'save':
      card.append(renderSaveModal(handlers));
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
    list.append(element('div', 'inventory-row', t('inventory.empty')));
  } else {
    for (const [type] of entries) {
      list.append(
        element('div', 'inventory-row', `${consumableLabel(type as ConsumableType)} ..... x${state.player.inventory[type as ConsumableType]}`),
      );
    }
  }

  body.append(list, element('p', 'status-line', t('inventory.close')));
  return body;
}

function renderUpgradeModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const layout = div('shop-layout');
  const categories = div('shop-category-list');

  for (const category of UPGRADE_TYPES) {
    const selected = state.modal.selectedCategory === category;
    categories.append(
      button(upgradeCategoryLabel(category), () => handlers.onSelectUpgradeCategory(category), {
        className: selected ? 'choice-button is-selected' : 'choice-button',
      }),
    );
  }

  const choicesWrap = div('choice-grid upgrade-choice-grid');
  const category = state.modal.selectedCategory ?? 'hull';
  const choices = getUpgradeChoices(state, category);
  if (choices.length === 0) {
    choicesWrap.append(element('div', 'metric', t('upgrade.max_tier')));
  } else {
    for (const choice of choices) {
      const selected = state.modal.selectedId === `${category}:${choice.tier}`;
      choicesWrap.append(
        createUpgradeIconButton(
          category,
          choice.tier,
          upgradeLabel(category, choice.tier),
          selected,
          () => handlers.onSelectUpgradeTier(category, choice.tier),
        ),
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
    detail.append(element('p', 'detail-copy', t('upgrade.choose')));
    return detail;
  }

  const cat = state.modal.selectedCategory ?? 'hull';
  detail.append(
    element('h3', 'detail-title', upgradeLabel(cat, selected.tier)),
    element('p', 'detail-copy', upgradeDescription(cat, selected.tier)),
    statLine(t('upgrade.current_tier'), tierPrettyName(state.player.equipment[cat])),
    statLine(t('upgrade.target_tier'), tierPrettyName(selected.tier)),
    statLine(t('upgrade.price'), `$${selected.price}`),
  );

  detail.append(
    button(t('upgrade.buy'), handlers.onBuySelectedUpgrade, {
      disabled: state.player.cash < selected.price,
    }),
  );
  return detail;
}

function createUpgradeIconButton(
  category: UpgradeType,
  tier: EquipmentTier,
  label: string,
  selected: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const frame = getUpgradeSpriteFrame(category, tier);
  const buttonNode = document.createElement('button');
  buttonNode.type = 'button';
  buttonNode.className = `diggr-button choice-button upgrade-icon-button${selected ? ' is-selected' : ''}`;
  buttonNode.setAttribute('aria-label', label);
  buttonNode.dataset.upgradeChoice = 'true';
  buttonNode.dataset.upgradeType = category;
  buttonNode.dataset.upgradeTier = tier;
  buttonNode.dataset.spriteFrame = String(frame);
  buttonNode.addEventListener('click', onClick);

  const sprite = document.createElement('span');
  sprite.className = 'upgrade-icon-sprite';
  const frameColumn = frame % UPGRADE_ICON_SHEET_COLUMNS;
  const frameRow = Math.floor(frame / UPGRADE_ICON_SHEET_COLUMNS);
  const displaySize = 56;
  sprite.style.backgroundImage = `url(${UPGRADE_ICON_SHEET_URL})`;
  sprite.style.backgroundSize = `${UPGRADE_ICON_SHEET_COLUMNS * displaySize}px ${UPGRADE_ICON_SHEET_ROWS * displaySize}px`;
  sprite.style.backgroundPosition = `${-frameColumn * displaySize}px ${-frameRow * displaySize}px`;
  sprite.style.width = `${displaySize}px`;
  sprite.style.height = `${displaySize}px`;
  sprite.style.setProperty('--upgrade-frame-size', `${UPGRADE_ICON_FRAME_SIZE}px`);
  buttonNode.append(sprite);

  return buttonNode;
}

function renderConsumableModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const layout = div('shop-layout shop-layout--two-column');
  const inventoryGrid = div('inventory-grid');

  for (const [type, def] of Object.entries(CONSUMABLE_DEFS) as [ConsumableType, typeof CONSUMABLE_DEFS[ConsumableType]][]) {
    const selected = state.modal.selectedId === type;
    const owned = state.player.inventory[type];
    inventoryGrid.append(
      createConsumableIconButton(type, consumableLabel(type), def.hotkey, owned, selected, () => handlers.onSelectConsumable(type)),
    );
  }

  const selectedType = (state.modal.selectedId as ConsumableType | undefined) ?? 'repair_nanobot';
  const selectedDef = CONSUMABLE_DEFS[selectedType];
  const detail = div('panel detail-panel');
  detail.append(
    element('h3', 'detail-title', consumableLabel(selectedType)),
    element('p', 'detail-copy', consumableDescription(selectedType)),
    statLine(t('consumable.hotkey'), selectedDef.hotkey),
    statLine(t('consumable.owned'), String(state.player.inventory[selectedType])),
    statLine(t('upgrade.price'), `$${selectedDef.price}`),
    button(t('consumable.buy'), handlers.onBuySelectedConsumable, {
      disabled: state.player.cash < selectedDef.price || state.player.inventory[selectedType] >= 99,
    }),
  );

  layout.append(inventoryGrid, detail);
  body.append(layout);
  return body;
}

function createConsumableIconButton(
  type: ConsumableType,
  label: string,
  hotkey: string,
  owned: number,
  selected: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const frame = getConsumableSpriteFrame(type);
  const buttonNode = document.createElement('button');
  buttonNode.type = 'button';
  buttonNode.className = `diggr-button choice-button consumable-icon-button${selected ? ' is-selected' : ''}`;
  buttonNode.setAttribute('aria-label', `${label} (${hotkey}) x${owned}`);
  buttonNode.dataset.consumableChoice = 'true';
  buttonNode.dataset.consumableType = type;
  buttonNode.dataset.spriteFrame = String(frame);
  buttonNode.addEventListener('click', onClick);

  const hotkeyBadge = element('span', 'choice-badge choice-badge--hotkey', hotkey);
  const ownedBadge = element('span', 'choice-badge choice-badge--owned', `x${owned}`);

  const sprite = document.createElement('span');
  sprite.className = 'consumable-icon-sprite';
  const frameColumn = frame % CONSUMABLE_ICON_SHEET_COLUMNS;
  const frameRow = Math.floor(frame / CONSUMABLE_ICON_SHEET_COLUMNS);
  const displaySize = 52;
  sprite.style.backgroundImage = `url(${CONSUMABLE_ICON_SHEET_URL})`;
  sprite.style.backgroundSize = `${CONSUMABLE_ICON_SHEET_COLUMNS * displaySize}px ${CONSUMABLE_ICON_SHEET_ROWS * displaySize}px`;
  sprite.style.backgroundPosition = `${-frameColumn * displaySize}px ${-frameRow * displaySize}px`;
  sprite.style.width = `${displaySize}px`;
  sprite.style.height = `${displaySize}px`;
  sprite.style.setProperty('--consumable-frame-size', `${CONSUMABLE_ICON_FRAME_SIZE}px`);

  buttonNode.append(hotkeyBadge, sprite, ownedBadge);
  return buttonNode;
}

function renderRefineryModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const entries = getCargoEntries(state);
  const total = entries.reduce((sum, entry) => sum + entry.subtotal, 0);
  const layout = div('shop-layout shop-layout--two-column');
  const list = div('refinery-grid');

  if (entries.length === 0) {
    list.append(element('div', 'metric', t('refinery.empty')));
  } else {
    for (const entry of entries) {
      list.append(createRefineryEntryCard(entry.type, entry.label, entry.amount, entry.subtotal));
    }
  }

  const detail = div('panel detail-panel');
  detail.append(
    element('h3', 'detail-title', t('refinery.panel_title')),
    element('p', 'detail-copy', t('refinery.panel_copy')),
    statLine(t('refinery.grand_total'), `$${total}`),
    button(t('refinery.sell_all'), handlers.onSellAllCargo, { disabled: total <= 0 }),
  );

  layout.append(list, detail);
  body.append(layout);
  return body;
}

function createRefineryEntryCard(
  type: SellableMaterial,
  label: string,
  amount: number,
  subtotal: number,
): HTMLElement {
  const frame = getRefinerySpriteFrame(type);
  const card = div('panel refinery-entry-card');
  card.dataset.refineryEntry = 'true';
  card.dataset.refineryType = type;
  card.dataset.spriteFrame = String(frame);

  const sprite = document.createElement('span');
  sprite.className = 'refinery-icon-sprite';
  const frameColumn = frame % REFINERY_ICON_SHEET_COLUMNS;
  const frameRow = Math.floor(frame / REFINERY_ICON_SHEET_COLUMNS);
  const displaySize = 48;
  sprite.style.backgroundImage = `url(${REFINERY_ICON_SHEET_URL})`;
  sprite.style.backgroundSize = `${REFINERY_ICON_SHEET_COLUMNS * displaySize}px ${REFINERY_ICON_SHEET_ROWS * displaySize}px`;
  sprite.style.backgroundPosition = `${-frameColumn * displaySize}px ${-frameRow * displaySize}px`;
  sprite.style.width = `${displaySize}px`;
  sprite.style.height = `${displaySize}px`;
  sprite.style.setProperty('--refinery-frame-size', `${REFINERY_ICON_FRAME_SIZE}px`);

  const labelNode = element('div', 'refinery-card-label', label);
  const badges = div('refinery-card-badges');
  badges.append(
    element('span', 'choice-badge choice-badge--owned', `x${amount}`),
    element('span', 'choice-badge choice-badge--value', `$${subtotal}`),
  );

  card.append(sprite, labelNode, badges);
  return card;
}

function renderServiceModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const panel = div('panel detail-panel');
  const cost = computeServiceCost(state);
  panel.append(
    element('h3', 'detail-title', t('service.title')),
    element('p', 'detail-copy', t('service.copy')),
    statLine(t('service.cost'), cost <= 0 ? t('service.no_needed') : `$${cost}`),
    button(t('service.action'), handlers.onRepairAndRefuel, {
      disabled: cost <= 0 || state.player.cash < cost,
    }),
  );
  body.append(panel);
  return body;
}

function renderSaveModal(handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  const panel = div('panel detail-panel');
  panel.append(
    element('h3', 'detail-title', t('save.title')),
    element('p', 'detail-copy', t('save.copy')),
    button(t('save.action'), handlers.onSaveGame),
  );
  body.append(panel);
  return body;
}

function renderGameOverModal(state: GameState, handlers: GameplayHandlers): HTMLElement {
  const body = div('modal-body');
  body.append(
    element('p', 'detail-copy', t(state.modal.message ?? 'game_over.generic')),
    element(
      'p',
      'detail-copy',
      t('game_over.summary', {
        depth: getCurrentDepth(state.player.position),
        earnings: state.player.totalEarnings.toFixed(0),
      }),
    ),
  );

  const actions = div('modal-actions');
  actions.append(button(t('game_over.restart'), handlers.onRestart), button(t('game_over.back'), handlers.onBackToTitle));
  body.append(actions);
  return body;
}

function renderHowToModal(onClose: () => void): HTMLElement {
  const scrim = div('modal-scrim');
  const card = div('panel modal-card');
  const header = div('modal-header');
  header.append(element('h2', 'modal-title', t('modal.howto')), button(t('modal.close'), onClose, { className: 'modal-close' }));
  card.append(header, renderHowToBody());
  scrim.append(card);
  return scrim;
}

function renderHowToBody(): HTMLElement {
  const body = div('modal-body');
  body.append(element('p', 'status-line', t('howto.goal')));

  const grid = div('howto-grid');
  grid.append(
    createHowToCard(
      t('howto.card.move_title'),
      t('howto.card.move_body'),
      [
        sheetSprite(DIGGER_SHEET_URL, 0, DIGGER_SHEET_COLUMNS, 56, 'howto-sprite howto-sprite--hero', t('sprite.digger')),
        sheetSprite(TERRAIN_SHEET_URL, 0, TERRAIN_SHEET_COLUMNS, 40, 'howto-sprite', t('sprite.dirt')),
        sheetSprite(TERRAIN_SHEET_URL, 3, TERRAIN_SHEET_COLUMNS, 40, 'howto-sprite', t('sprite.ore')),
      ],
    ),
    createHowToCard(
      t('howto.card.surface_title'),
      t('howto.card.surface_body'),
      SURFACE_PADS.map((pad) =>
        sheetSprite(
          SHOP_SHEET_URL,
          pad.spriteFrame,
          SHOP_SHEET_COLUMNS,
          pad.shop === 'save' ? 46 : 42,
          'howto-sprite',
          surfaceShopLabel(pad.shop),
        ),
      ),
    ),
    createHowToCard(
      t('howto.card.cons_title'),
      t('howto.card.cons_body'),
      [
        labeledSprite(
          'Z',
          sheetSprite(
            CONSUMABLE_ICON_SHEET_URL,
            getConsumableSpriteFrame('repair_nanobot'),
            CONSUMABLE_ICON_SHEET_COLUMNS,
            38,
            'howto-sprite',
            consumableLabel('repair_nanobot'),
          ),
        ),
        labeledSprite(
          'C',
          sheetSprite(
            CONSUMABLE_ICON_SHEET_URL,
            getConsumableSpriteFrame('small_tnt'),
            CONSUMABLE_ICON_SHEET_COLUMNS,
            38,
            'howto-sprite',
            consumableLabel('small_tnt'),
          ),
        ),
        labeledSprite(
          'F',
          sheetSprite(
            CONSUMABLE_ICON_SHEET_URL,
            getConsumableSpriteFrame('matter_transporter'),
            CONSUMABLE_ICON_SHEET_COLUMNS,
            38,
            'howto-sprite',
            consumableLabel('matter_transporter'),
          ),
        ),
      ],
    ),
    createHowToCard(
      t('howto.card.hazard_title'),
      t('howto.card.hazard_body'),
      [
        sheetSprite(TERRAIN_SHEET_URL, 1, TERRAIN_SHEET_COLUMNS, 40, 'howto-sprite', t('sprite.rock')),
        sheetSprite(TERRAIN_SHEET_URL, 2, TERRAIN_SHEET_COLUMNS, 40, 'howto-sprite', t('sprite.lava')),
        sheetSprite(DIGGER_SHEET_URL, 15, DIGGER_SHEET_COLUMNS, 56, 'howto-sprite howto-sprite--hero', t('sprite.damaged')),
      ],
    ),
  );

  body.append(grid);

  const list = div('copy-list');
  for (const line of getHowToFooterLines()) {
    list.append(element('div', 'howto-footnote', line));
  }
  body.append(list);
  return body;
}

function renderTitleArtPanel(): HTMLElement {
  const panel = div('title-art-panel');
  panel.dataset.titleArt = 'true';

  const skyline = div('title-skyline');
  skyline.append(
    sheetSprite(
      SHOP_SHEET_URL,
      SURFACE_PADS[0].spriteFrame,
      SHOP_SHEET_COLUMNS,
      56,
      'title-art-sprite title-art-sprite--shop',
      surfaceShopLabel(SURFACE_PADS[0].shop),
    ),
    sheetSprite(
      SHOP_SHEET_URL,
      SURFACE_PADS[1].spriteFrame,
      SHOP_SHEET_COLUMNS,
      56,
      'title-art-sprite title-art-sprite--shop',
      surfaceShopLabel(SURFACE_PADS[1].shop),
    ),
    sheetSprite(
      SHOP_SHEET_URL,
      SURFACE_PADS[2].spriteFrame,
      SHOP_SHEET_COLUMNS,
      56,
      'title-art-sprite title-art-sprite--shop',
      surfaceShopLabel(SURFACE_PADS[2].shop),
    ),
    sheetSprite(
      SHOP_SHEET_URL,
      SURFACE_PADS[4].spriteFrame,
      SHOP_SHEET_COLUMNS,
      58,
      'title-art-sprite title-art-sprite--balloon',
      surfaceShopLabel(SURFACE_PADS[4].shop),
    ),
  );

  const stage = div('title-stage');
  const stageSky = div('title-stage-sky');
  stageSky.append(
    sheetSprite(
      DIGGER_SHEET_URL,
      10,
      DIGGER_SHEET_COLUMNS,
      104,
      'title-art-sprite title-art-sprite--digger',
      t('sprite.flying_digger'),
    ),
    sheetSprite(TERRAIN_SHEET_URL, 2, TERRAIN_SHEET_COLUMNS, 52, 'title-art-sprite title-art-sprite--lava', t('sprite.lava')),
  );
  const stageGround = div('title-stage-ground');
  const oreCluster = div('title-ore-cluster');
  oreCluster.append(
    sheetSprite(TERRAIN_SHEET_URL, 3, TERRAIN_SHEET_COLUMNS, 40, 'title-art-sprite', blockLabel('tinnite')),
    sheetSprite(TERRAIN_SHEET_URL, 6, TERRAIN_SHEET_COLUMNS, 40, 'title-art-sprite', blockLabel('goldium_ore')),
    sheetSprite(TERRAIN_SHEET_URL, 9, TERRAIN_SHEET_COLUMNS, 40, 'title-art-sprite', blockLabel('runite_ore')),
  );
  stageGround.append(oreCluster);
  stage.append(stageSky, skyline, stageGround);

  panel.append(stage, element('div', 'title-art-caption', t('title.caption')));
  return panel;
}

function createHowToCard(title: string, copy: string, sprites: HTMLElement[]): HTMLElement {
  const card = div('panel howto-card');
  card.dataset.howtoCard = 'true';
  const spriteRow = div('howto-sprite-row');
  spriteRow.append(...sprites);
  card.append(element('h3', 'howto-card-title', title), spriteRow, element('p', 'detail-copy', copy));
  return card;
}

function labeledSprite(label: string, sprite: HTMLElement): HTMLElement {
  const wrap = div('howto-labeled-sprite');
  wrap.append(element('span', 'choice-badge choice-badge--hotkey', label), sprite);
  return wrap;
}

function getModalTitle(type: ShopType | GameState['modal']['type']): string {
  switch (type) {
    case 'upgrades':
      return t('modal.upgrades');
    case 'inventory':
      return t('modal.inventory');
    case 'consumables':
      return t('modal.consumables');
    case 'refinery':
      return t('modal.refinery');
    case 'service':
      return t('modal.service');
    case 'save':
      return t('modal.save');
    case 'game_over':
      return t('modal.game_over');
    default:
      return t('modal.howto');
  }
}

function statLine(label: string, value: string): HTMLElement {
  const wrapper = div('metric stat-line');
  wrapper.append(element('span', 'hud-label stat-line-label', label), element('span', 'stat-line-value', value));
  return wrapper;
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

function renderPixelTitleLogo(): HTMLHeadingElement {
  const heading = document.createElement('h1');
  heading.className = 'title-heading title-heading--pixel';
  heading.setAttribute('aria-label', 'DIGGR');

  const text = document.createElement('span');
  text.className = 'sr-only';
  text.textContent = 'DIGGR';
  heading.append(text, createPixelWord('DIGGR'));
  return heading;
}

function createPixelWord(word: string): HTMLElement {
  const glyphs: Record<string, string[]> = {
    D: ['11110', '10001', '10001', '10001', '11110'],
    I: ['11111', '00100', '00100', '00100', '11111'],
    G: ['11111', '10000', '10111', '10001', '11111'],
    R: ['11110', '10001', '11110', '10010', '10001'],
  };

  const layout = document.createElement('span');
  layout.className = 'pixel-word';

  let columnOffset = 0;
  for (const character of word) {
    const glyph = glyphs[character];
    if (!glyph) {
      columnOffset += 6;
      continue;
    }

    glyph.forEach((row, rowIndex) => {
      row.split('').forEach((value, columnIndex) => {
        if (value !== '1') {
          return;
        }

        const pixel = document.createElement('span');
        pixel.className = 'pixel-word__pixel';
        pixel.style.gridColumn = String(columnOffset + columnIndex + 1);
        pixel.style.gridRow = String(rowIndex + 1);
        layout.append(pixel);
      });
    });

    columnOffset += glyph[0].length + 1;
  }

  layout.style.setProperty('--pixel-word-columns', String(columnOffset));
  return layout;
}

function sheetSprite(
  url: string,
  frame: number,
  columns: number,
  displaySize: number,
  className: string,
  label: string,
): HTMLSpanElement {
  const node = document.createElement('span');
  node.className = className;
  node.setAttribute('aria-label', label);
  node.setAttribute('role', 'img');
  const frameColumn = frame % columns;
  const frameRow = Math.floor(frame / columns);
  node.style.backgroundImage = `url(${url})`;
  node.style.backgroundSize = `${columns * displaySize}px auto`;
  node.style.backgroundPosition = `${-frameColumn * displaySize}px ${-frameRow * displaySize}px`;
  node.style.width = `${displaySize}px`;
  node.style.height = `${displaySize}px`;
  return node;
}
