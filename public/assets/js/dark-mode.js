// Dark Mode Toggle
(function() {
  const THEME_KEY = 'theme';
  const DARK_ICON = '<i class="fas fa-moon"></i>';
  const LIGHT_ICON = '<i class="fas fa-sun"></i>';
  
  function init() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    applyTheme(currentTheme);
    createToggle(currentTheme);
  }
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === 'dark' ? LIGHT_ICON : DARK_ICON;
      toggleBtn.setAttribute('title', theme === 'dark' ? 'Modo claro' : 'Modo oscuro');
    }
  }
  
  function toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }
  
  function createToggle(currentTheme) {
    // Remove existing toggle if any
    const existing = document.getElementById('theme-toggle');
    if (existing) existing.remove();
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.className = 'btn btn-sm btn-outline-warning theme-toggle-btn';
    toggleBtn.setAttribute('title', currentTheme === 'dark' ? 'Modo claro' : 'Modo oscuro');
    toggleBtn.innerHTML = currentTheme === 'dark' ? LIGHT_ICON : DARK_ICON;
    toggleBtn.onclick = toggle;
    
    // Find a good place to put it - after navbar or in header
    const navbar = document.querySelector('.navbar');
    const navTop = document.querySelector('#templatemo_nav_top');
    
    if (navTop) {
      const userMenu = navTop.querySelector('#user-menu');
      if (userMenu) {
        userMenu.insertBefore(toggleBtn, userMenu.firstChild);
      } else {
        navTop.querySelector('.w-100').appendChild(toggleBtn);
      }
    } else if (navbar) {
      navbar.querySelector('.ms-auto')?.appendChild(toggleBtn);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();