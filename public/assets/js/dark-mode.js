// Dark Mode Toggle - Simplified
(function() {
  const THEME_KEY = 'theme';
  const DARK_ICON = '<i class="fas fa-moon"></i>';
  const LIGHT_ICON = '<i class="fas fa-sun"></i>';
  
  function init() {
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    applyTheme(currentTheme);
  }
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Update button if exists
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === 'dark' ? LIGHT_ICON : DARK_ICON;
      toggleBtn.title = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';
    }
  }
  
  function toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }
  
  function createToggle() {
    // Remove existing
    const existing = document.getElementById('theme-toggle');
    if (existing) existing.remove();
    
    // Create button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.className = 'btn btn-sm btn-outline-warning theme-toggle-btn';
    toggleBtn.setAttribute('type', 'button');
    toggleBtn.setAttribute('style', 'margin-left: 10px; margin-right: 10px;');
    toggleBtn.setAttribute('title', 'Cambiar tema');
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    toggleBtn.innerHTML = currentTheme === 'dark' ? LIGHT_ICON : DARK_ICON;
    toggleBtn.onclick = toggle;
    
    // Find navbar-top or user-menu and append
    const userMenu = document.getElementById('user-menu');
    const navTop = document.getElementById('templatemo_nav_top');
    const nav = document.querySelector('.navbar');
    
    if (userMenu) {
      userMenu.insertBefore(toggleBtn, userMenu.firstChild);
    } else if (navTop) {
      const w100 = navTop.querySelector('.w-100');
      if (w100) w100.appendChild(toggleBtn);
    } else if (nav) {
      nav.querySelector('.ms-auto')?.appendChild(toggleBtn);
    }
  }
  
  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      createToggle();
    });
  } else {
    init();
    createToggle();
  }
})();