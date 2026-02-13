import { levelToBitsMap, defaultControls } from './config.js';
import {
  buildSelectors,
  renderTaxonomy,
  renderAtlas,
  loadPresetsFromStorage,
  refreshPresetDropdown,
  applyControlState,
  bindEvents,
  render,
  initGsapAnimations,
} from './ui.js';

function init() {
  buildSelectors();
  renderTaxonomy();
  renderAtlas();
  loadPresetsFromStorage();
  refreshPresetDropdown();
  applyControlState(defaultControls, true, levelToBitsMap);
  bindEvents(levelToBitsMap);
  render(levelToBitsMap);
  initGsapAnimations();
}

init();
