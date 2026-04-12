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
    
    // Create button - subtle, just icon
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.type = 'button';
    toggleBtn.style.cssText = 'background:none;border:none;cursor:pointer;color:#aaa;font-size:16px;padding:4px 8px;margin-left:4px;vertical-align:middle;opacity:0.7;transition:opacity 0.3s;';
    toggleBtn.title = 'Cambiar tema';
    toggleBtn.onmouseover = () => toggleBtn.style.opacity = '1';
    toggleBtn.onmouseout = () => toggleBtn.style.opacity = '0.7';
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    toggleBtn.innerHTML = currentTheme === 'dark' ? LIGHT_ICON : DARK_ICON;
    toggleBtn.onclick = toggle;
    
    // Find user-menu and add after it
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
      userMenu.parentNode.insertBefore(toggleBtn, userMenu.nextSibling);
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