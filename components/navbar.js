document.addEventListener("navloaded", function () {
  // Check if current page is a plans page (only plans.html)
  function isPlansPage() {
    const currentPath = window.location.pathname;
    const plansPages = [
      '/pages/customer/plans/plans.html',
      '/pages/admin/plans/plans.html'
    ];
    
    // Only show search on actual plans.html pages, not prepaid/postpaid home pages
    return plansPages.some(page => currentPath.includes(page)) || 
           (currentPath.includes('plans') && currentPath.includes('.html'));
  }

  // Show/hide search functionality based on current page
  function toggleSearchVisibility() {
    const searchContainer = document.getElementById("search-container");
    const mobileSearchContainer = document.getElementById("mobile-search-container");
    
    if (isPlansPage()) {
      // Show search on plans pages
      if (searchContainer) searchContainer.style.display = "block";
      if (mobileSearchContainer) mobileSearchContainer.style.display = "block";
    } else {
      // Hide search on other pages
      if (searchContainer) searchContainer.style.display = "none";
      if (mobileSearchContainer) mobileSearchContainer.style.display = "none";
    }
  }

  // Update user information display
  function updateUserInfo() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      
      // Update desktop avatar and name
      const userAvatar = document.getElementById("user-avatar");
      const userName = document.getElementById("user-name");
      if (userAvatar) userAvatar.textContent = firstLetter;
      if (userName) userName.textContent = user.name || 'User';
      
      // Update mobile avatar and name
      const mobileUserAvatar = document.getElementById("mobile-user-avatar");
      const mobileUserName = document.getElementById("mobile-user-name");
      if (mobileUserAvatar) mobileUserAvatar.textContent = firstLetter;
      if (mobileUserName) mobileUserName.textContent = user.name || 'User';
    }
  }

  // Toggle dropdown menu
  function toggleDropdown() {
    const dropdown = document.getElementById("user-dropdown");
    if (dropdown) {
      dropdown.classList.toggle("hidden");
    }
  }

  // Close dropdown when clicking outside
  function closeDropdownOnOutsideClick(event) {
    const userProfile = document.getElementById("user-profile");
    const dropdown = document.getElementById("user-dropdown");
    
    if (userProfile && dropdown && !userProfile.contains(event.target)) {
      dropdown.classList.add("hidden");
    }
  }

  // Authentication state management
  function checkAuthState() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const isLoggedIn = loggedInUser !== null;
    
    // Desktop elements
    const loginBtn = document.getElementById("login-btn");
    const userProfile = document.getElementById("user-profile");
    
    // Mobile elements
    const mobileLoginBtn = document.getElementById("mobile-login-btn");
    const mobileUserProfile = document.getElementById("mobile-user-profile");
    
    if (isLoggedIn) {
      // User is logged in - show profile and logout
      if (loginBtn) loginBtn.style.display = "none";
      if (userProfile) userProfile.style.display = "block";
      if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
      if (mobileUserProfile) mobileUserProfile.style.display = "block";
      
      // Update user information
      updateUserInfo();
    } else {
      // User is not logged in - show login button
      if (loginBtn) loginBtn.style.display = "block";
      if (userProfile) userProfile.style.display = "none";
      if (mobileLoginBtn) mobileLoginBtn.style.display = "block";
      if (mobileUserProfile) mobileUserProfile.style.display = "none";
    }
  }

  function handleLogout() {
    // Clear user details
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("customerId");
    localStorage.removeItem("role");
    // Redirect to landing page
    window.location.href = "/pages/customer/landing/landing.html";
  }

  // Initialize authentication state and search visibility
  checkAuthState();
  toggleSearchVisibility();

  // Attach dropdown functionality
  const userAvatarBtn = document.getElementById("user-avatar-btn");
  if (userAvatarBtn) {
    userAvatarBtn.addEventListener("click", toggleDropdown);
  }

  // Attach logout listeners
  const desktopLogout = document.getElementById("logout-btn");
  const mobileLogout = document.getElementById("mobile-logout-btn");

  if (desktopLogout) {
    desktopLogout.addEventListener("click", handleLogout);
  }

  if (mobileLogout) {
    mobileLogout.addEventListener("click", handleLogout);
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", closeDropdownOnOutsideClick);

  // Listen for storage changes (when user logs in/out in another tab)
  window.addEventListener("storage", function(e) {
    if (e.key === "loggedInUser" || e.key === "customerId" || e.key === "role") {
      checkAuthState();
    }
  });
});
