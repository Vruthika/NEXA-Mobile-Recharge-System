// Universal Navbar Loader
// This script can be included in any page to load the navbar component

function loadNavbar() {
  const navbarContainer = document.getElementById('navbar-container');
  if (!navbarContainer) {
    console.warn('Navbar container not found. Make sure you have <div id="navbar-container"></div> in your HTML.');
    return;
  }

  fetch('/components/navbar.html')
    .then(response => response.text())
    .then(html => {
      navbarContainer.innerHTML = html;
      // Load navbar JavaScript functionality
      loadNavbarScript();
    })
    .catch(error => {
      console.error('Error loading navbar:', error);
      // Fallback: show a simple navigation
      navbarContainer.innerHTML = `
        <nav class="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
              <div class="flex items-center space-x-3">
                <img src="/assets/images/logo.png" alt="NEXA" class="h-12 w-12 rounded-full border border-purple-500" />
                <div class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NEXA</div>
              </div>
              <div class="flex items-center space-x-4">
                <a href="/pages/customer/landing/landing.html" class="text-gray-700 dark:text-gray-200 hover:text-primary">Home</a>
                <button onclick="window.location.href='/pages/auth/login/login.html'" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">Login</button>
              </div>
            </div>
          </div>
        </nav>
      `;
    });
}

function loadNavbarScript() {
  // Check if navbar.js is already loaded
  if (window.navbarLoaded) {
    return;
  }

  // Create and load navbar.js script
  const script = document.createElement('script');
  script.src = '/components/navbar.js';
  script.onload = function() {
    // Dispatch event to initialize navbar functionality
    document.dispatchEvent(new CustomEvent('navloaded'));
    window.navbarLoaded = true;
  };
  script.onerror = function() {
    console.error('Failed to load navbar script');
  };
  document.head.appendChild(script);
}

// Auto-load navbar when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only auto-load if navbar container exists
  if (document.getElementById('navbar-container')) {
    loadNavbar();
  }
});

// Export functions for manual loading
window.loadNavbar = loadNavbar;
window.loadNavbarScript = loadNavbarScript;
