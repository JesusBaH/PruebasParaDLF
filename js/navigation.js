const menuButtons  = document.querySelectorAll('.menu-btn');
const crudSections = document.querySelectorAll('.crud-section');
const navIndicator = document.querySelector('.nav-indicator');
const sidebarMenu  = document.querySelector('.sidebar-menu');
const panelsOrder  = ['panel-catalog', 'panel-categories', 'panel-occasions'];

function setIndicatorIndex(index, animate = true) {
  if (!sidebarMenu || window.innerWidth > 860) return;
  if (!animate) navIndicator.style.transition = 'none';
  else navIndicator.style.transition = 'transform 0.42s cubic-bezier(0.25, 1, 0.5, 1)';
  sidebarMenu.style.setProperty('--indicator-index', index);
}

function setActiveBtn(index) {
  menuButtons.forEach((btn, i) => btn.classList.toggle('active', i === index));
}

function getActivePanelIndex() {
  const active = Array.from(crudSections).find(s => s.classList.contains('active'));
  return active ? panelsOrder.indexOf(active.id) : 0;
}

function switchPanel(panelId, animate = true) {
  const index = panelsOrder.indexOf(panelId);
  if (index === -1) return;

  setActiveBtn(index);
  setIndicatorIndex(index, animate);

  crudSections.forEach(s => s.classList.toggle('active', s.id === panelId));
}

menuButtons.forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    switchPanel(btn.getAttribute('data-target'));
  });
});

setTimeout(() => {
  const idx = getActivePanelIndex();
  setIndicatorIndex(idx, false);
  requestAnimationFrame(() => {
    navIndicator.style.transition = 'transform 0.42s cubic-bezier(0.25, 1, 0.5, 1)';
  });
}, 80);

window.addEventListener('resize', () => {
  setIndicatorIndex(getActivePanelIndex(), false);
});

if (sidebarMenu && navIndicator) {
  let dragging        = false;
  let startX          = 0;
  let startIndex      = 0;
  let dragCurrentIdx  = -1;
  const STEP          = () => sidebarMenu.offsetWidth / 3;

  sidebarMenu.addEventListener('touchstart', e => {
    if (window.innerWidth > 860) return;
    dragging       = true;
    startX         = e.touches[0].clientX;
    startIndex     = getActivePanelIndex();
    dragCurrentIdx = startIndex;
    navIndicator.style.transition = 'none';
  }, { passive: true });

  sidebarMenu.addEventListener('touchmove', e => {
    if (!dragging || window.innerWidth > 860) return;

    const dx       = e.touches[0].clientX - startX;
    const step     = STEP();
    const rawIndex = startIndex + dx / step;
    const clamped  = Math.min(Math.max(rawIndex, 0), panelsOrder.length - 1);

    sidebarMenu.style.setProperty('--indicator-index', clamped);

    const snapped = Math.round(clamped);
    if (snapped !== dragCurrentIdx) {
      dragCurrentIdx = snapped;
      setActiveBtn(snapped);
    }
  }, { passive: true });

  sidebarMenu.addEventListener('touchend', () => {
    if (!dragging || window.innerWidth > 860) return;
    dragging = false;
    const finalIdx = Math.min(Math.max(Math.round(dragCurrentIdx), 0), panelsOrder.length - 1);
    switchPanel(panelsOrder[finalIdx]);
  }, { passive: true });
}

let swipeStartX = 0;
let swipeStartY = 0;
let swipeOnNav  = false;

window.addEventListener('touchstart', e => {
  if (window.innerWidth > 860) return;
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
  swipeOnNav  = sidebarMenu?.contains(e.target) ?? false;
}, { passive: true });

window.addEventListener('touchend', e => {
  if (window.innerWidth > 860 || swipeOnNav) return;
  const dx = swipeStartX - e.changedTouches[0].clientX;
  const dy = swipeStartY - e.changedTouches[0].clientY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
    const cur = getActivePanelIndex();
    if (dx > 0 && cur < panelsOrder.length - 1) switchPanel(panelsOrder[cur + 1]);
    else if (dx < 0 && cur > 0) switchPanel(panelsOrder[cur - 1]);
  }
}, { passive: true });