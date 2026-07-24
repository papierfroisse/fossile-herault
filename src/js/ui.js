// General Layout & Modal UI Event Handlers
import { map } from './map.js';
import { currentMapColorMode, switchMapColorMode } from './geology.js';

export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const icon = document.getElementById('toggleIcon');
  if (!sidebar) return;
  
  sidebar.classList.toggle('collapsed');
  if (icon) {
    if (sidebar.classList.contains('collapsed')) {
      icon.className = 'fa-solid fa-angles-right';
    } else {
      icon.className = 'fa-solid fa-angles-left';
    }
  }
  setTimeout(() => { if (map) map.invalidateSize(); }, 350);
}

export function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('mobile-open');
}

export function toggleMobileMapMode() {
  const newMode = (currentMapColorMode === 'score') ? 'period' : 'score';
  const modeSelect = document.getElementById('mapModeSelect');
  if (modeSelect) modeSelect.value = newMode;
  switchMapColorMode(newMode);
}

export function openGearModal() {
  const modal = document.getElementById('gearModal');
  if (modal) modal.style.display = 'flex';
}

export function closeGearModal() {
  const modal = document.getElementById('gearModal');
  if (modal) modal.style.display = 'none';
}

export function openGuideModal() {
  const modal = document.getElementById('guideModal');
  if (modal) modal.style.display = 'flex';
}

export function closeGuideModal() {
  const modal = document.getElementById('guideModal');
  if (modal) modal.style.display = 'none';
}
