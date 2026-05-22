const menuButtons = document.querySelectorAll('.menu-btn');
const crudSections = document.querySelectorAll('.crud-section');
const navIndicator = document.querySelector('.nav-indicator');
const panelsOrder = ['panel-catalog', 'panel-categories', 'panel-occasions'];

function moveIndicator(activeBtn, instant = false) {
  if (!navIndicator || window.innerWidth > 860) return;
  const btnWidth = activeBtn.offsetWidth;
  const btnLeft  = activeBtn.offsetLeft;

  if (instant) {
    navIndicator.style.transition = 'none';
  } else {
    navIndicator.style.transition = 'transform 0.38s cubic-bezier(0.25, 1, 0.5, 1), width 0.38s cubic-bezier(0.25, 1, 0.5, 1)';
  }

  navIndicator.style.width     = `${btnWidth - 8}px`;
  navIndicator.style.transform = `translateX(${btnLeft - 4}px)`;
}

function switchPanel(panelId) {
  let targetBtn = null;

  menuButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-target') === panelId) {
      btn.classList.add('active');
      targetBtn = btn;
    }
  });

  crudSections.forEach(section => {
    section.classList.remove('active');
    if (section.id === panelId) section.classList.add('active');
  });

  if (targetBtn) moveIndicator(targetBtn);
}

menuButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    switchPanel(btn.getAttribute('data-target'));
  });
});

setTimeout(() => {
  const activeBtn = document.querySelector('.menu-btn.active');
  if (activeBtn) moveIndicator(activeBtn, true);
}, 100);

window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.menu-btn.active');
  if (activeBtn) moveIndicator(activeBtn, true);
});

const sidebarMenu = document.querySelector('.sidebar-menu');
let isDraggingNav  = false;
let navDragStartX  = 0;
let navDragStartIndicatorX = 0;
let navBtnWidth    = 0;
let navMenuLeft    = 0;
let confirmedSwipe = false;

function getIndicatorCurrentX() {
  const transform = navIndicator?.style.transform || '';
  const match = transform.match(/translateX\(([^)]+)px\)/);
  return match ? parseFloat(match[1]) : 0;
}

function getBtnIndexAtX(clientX) {
  const btns = Array.from(menuButtons);
  for (let i = 0; i < btns.length; i++) {
    const rect = btns[i].getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right) return i;
  }
  return -1;
}

if (sidebarMenu) {
  sidebarMenu.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 860) return;
    isDraggingNav  = true;
    confirmedSwipe = false;
    navDragStartX  = e.touches[0].clientX;
    navDragStartIndicatorX = getIndicatorCurrentX();
    const activeBtn = document.querySelector('.menu-btn.active');
    navBtnWidth  = activeBtn ? activeBtn.offsetWidth : 0;
    navMenuLeft  = sidebarMenu.getBoundingClientRect().left;

    navIndicator.style.transition = 'none';
  }, { passive: true });

  sidebarMenu.addEventListener('touchmove', (e) => {
    if (!isDraggingNav || window.innerWidth > 860) return;

    const deltaX = e.touches[0].clientX - navDragStartX;
    if (Math.abs(deltaX) < 4) return;

    confirmedSwipe = true;

    const btns    = Array.from(menuButtons);
    const first   = btns[0].offsetLeft - 4;
    const last    = btns[btns.length - 1].offsetLeft - 4;
    const newX    = Math.min(Math.max(navDragStartIndicatorX + deltaX, first), last);

    navIndicator.style.transform = `translateX(${newX}px)`;

    const hoverIdx = getBtnIndexAtX(e.touches[0].clientX);
    if (hoverIdx !== -1) {
      btns.forEach((b, i) => {
        b.classList.toggle('active', i === hoverIdx);
      });
    }
  }, { passive: true });

  sidebarMenu.addEventListener('touchend', (e) => {
    if (!isDraggingNav || window.innerWidth > 860) return;
    isDraggingNav = false;

    const releasedIdx = getBtnIndexAtX(e.changedTouches[0].clientX);
    const activeIdx   = releasedIdx !== -1 ? releasedIdx : Array.from(menuButtons).findIndex(b => b.classList.contains('active'));
    const targetIdx   = Math.min(Math.max(activeIdx, 0), panelsOrder.length - 1);

    switchPanel(panelsOrder[targetIdx]);
  }, { passive: true });
}

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  if (window.innerWidth > 860) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (window.innerWidth > 860 || isDraggingNav) return;

  const deltaX = touchStartX - e.changedTouches[0].clientX;
  const deltaY = touchStartY - e.changedTouches[0].clientY;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
    const activeSection = Array.from(crudSections).find(s => s.classList.contains('active'));
    if (!activeSection) return;

    const currentIndex = panelsOrder.indexOf(activeSection.id);

    if (deltaX > 0 && currentIndex < panelsOrder.length - 1) {
      switchPanel(panelsOrder[currentIndex + 1]);
    } else if (deltaX < 0 && currentIndex > 0) {
      switchPanel(panelsOrder[currentIndex - 1]);
    }
  }
}, { passive: true });