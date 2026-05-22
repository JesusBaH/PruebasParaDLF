const menuButtons = document.querySelectorAll('.menu-btn');
const crudSections = document.querySelectorAll('.crud-section');
const panelsOrder = ['panel-catalog', 'panel-categories', 'panel-occasions'];

function switchPanel(panelId) {
  menuButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-target') === panelId) {
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  crudSections.forEach(section => {
    section.classList.remove('active');
    if (section.id === panelId) {
      section.classList.add('active');
    }
  });
}

if (menuButtons) {
  menuButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchPanel(btn.getAttribute('data-target'));
    });
  });
}

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