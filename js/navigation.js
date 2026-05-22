const menuButtons   = document.querySelectorAll('.menu-btn');
const crudSections  = document.querySelectorAll('.crud-section');
const navIndicator  = document.querySelector('.nav-indicator');
const sidebarMenu   = document.querySelector('.sidebar-menu');
const panelsOrder   = ['panel-catalog', 'panel-categories', 'panel-occasions'];

function getActivePanelIndex() {
  const active = Array.from(crudSections).find(s => s.classList.contains('active'));
  return active ? panelsOrder.indexOf(active.id) : 0;
}

function snapIndicatorToBtn(btn, animate = true) {
  if (!navIndicator || !btn) return;
  const menuRect = sidebarMenu.getBoundingClientRect();
  const btnRect  = btn.getBoundingClientRect();
  const x = btnRect.left - menuRect.left + (btnRect.width - (btnRect.width - 8)) / 2 - 4;

  navIndicator.style.transition = animate
    ? 'transform 0.42s cubic-bezier(0.25, 1, 0.5, 1), width 0.42s cubic-bezier(0.25, 1, 0.5, 1)'
    : 'none';
  navIndicator.style.width     = `${btnRect.width - 8}px`;
  navIndicator.style.transform = `translateX(${btnRect.left - menuRect.left + 4}px)`;
}

function setActiveBtn(index) {
  menuButtons.forEach((btn, i) => btn.classList.toggle('active', i === index));
}

function switchPanel(panelId) {
  const index = panelsOrder.indexOf(panelId);
  setActiveBtn(index);

  crudSections.forEach(s => {
    s.classList.toggle('active', s.id === panelId);
  });

  const targetBtn = Array.from(menuButtons).find(b => b.getAttribute('data-target') === panelId);
  snapIndicatorToBtn(targetBtn, true);
}

menuButtons.forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    switchPanel(btn.getAttribute('data-target'));
  });
});

setTimeout(() => {
  const activeBtn = document.querySelector('.menu-btn.active');
  snapIndicatorToBtn(activeBtn, false);
}, 120);

window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.menu-btn.active');
  snapIndicatorToBtn(activeBtn, false);
});

if (sidebarMenu && navIndicator) {
  let dragging       = false;
  let startX         = 0;
  let startTranslate = 0;
  let currentHoverIdx = -1;

  function getTranslateX() {
    const t = navIndicator.style.transform;
    const m = t.match(/translateX\(([^)]+)px\)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function getBtnAtClientX(clientX) {
    return Array.from(menuButtons).findIndex(btn => {
      const r = btn.getBoundingClientRect();
      return clientX >= r.left && clientX <= r.right;
    });
  }

  sidebarMenu.addEventListener('touchstart', e => {
    if (window.innerWidth > 860) return;
    dragging        = true;
    startX          = e.touches[0].clientX;
    startTranslate  = getTranslateX();
    currentHoverIdx = -1;
    navIndicator.style.transition = 'none';
  }, { passive: true });

  sidebarMenu.addEventListener('touchmove', e => {
    if (!dragging || window.innerWidth > 860) return;

    const dx      = e.touches[0].clientX - startX;
    const menuRect = sidebarMenu.getBoundingClientRect();
    const btns    = Array.from(menuButtons);
    const firstX  = btns[0].getBoundingClientRect().left  - menuRect.left + 4;
    const lastBtn = btns[btns.length - 1].getBoundingClientRect();
    const lastX   = lastBtn.left - menuRect.left + 4;

    const newX = Math.min(Math.max(startTranslate + dx, firstX), lastX);
    navIndicator.style.transform = `translateX(${newX}px)`;

    const idx = getBtnAtClientX(e.touches[0].clientX);
    if (idx !== -1 && idx !== currentHoverIdx) {
      currentHoverIdx = idx;
      setActiveBtn(idx);
    }
  }, { passive: true });

  sidebarMenu.addEventListener('touchend', e => {
    if (!dragging || window.innerWidth > 860) return;
    dragging = false;

    const idx     = getBtnAtClientX(e.changedTouches[0].clientX);
    const finalIdx = idx !== -1 ? idx : getActivePanelIndex();
    switchPanel(panelsOrder[Math.min(Math.max(finalIdx, 0), panelsOrder.length - 1)]);
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