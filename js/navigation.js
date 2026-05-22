const menuButtons = document.querySelectorAll('.menu-btn');
const crudSections = document.querySelectorAll('.crud-section');
const navIndicator = document.querySelector('.nav-indicator');
const panelsOrder = ['panel-catalog', 'panel-categories', 'panel-occasions'];

function moveIndicator(activeBtn) {
  if (!navIndicator || window.innerWidth > 860) return;
  const btnWidth = activeBtn.offsetWidth;
  const btnLeft = activeBtn.offsetLeft;
  
  navIndicator.style.width = `${btnWidth - 8}px`;
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
    if (section.id === panelId) {
      section.classList.add('active');
    }
  });

  if (targetBtn) {
    moveIndicator(targetBtn);
    targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

if (menuButtons.length > 0) {
  setTimeout(() => {
    const activeBtn = document.querySelector('.menu-btn.active');
    if (activeBtn) moveIndicator(activeBtn);
  }, 350);
}

if (menuButtons) {
  menuButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchPanel(btn.getAttribute('data-target'));
    });
  });
}

window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.menu-btn.active');
  if (activeBtn) moveIndicator(activeBtn);
});

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  if (window.innerWidth > 860) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (window.innerWidth > 860) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchStartX - touchEndX;
  const deltaY = touchStartY - touchEndY;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
    const activeSection = Array.from(crudSections).find(s => s.classList.contains('active'));
    if (!activeSection) return;

    const currentIndex = panelsOrder.indexOf(activeSection.id);

    if (deltaX > 0 && currentIndex < panelsOrder.length - 1) {
      switchPanel(panelsOrder[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (deltaX < 0 && currentIndex > 0) {
      switchPanel(panelsOrder[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}, { passive: true });