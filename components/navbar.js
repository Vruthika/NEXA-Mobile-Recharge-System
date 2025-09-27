document.addEventListener("navloaded", function () {
  // Check if current page is a plans page (only plans.html)
  function isPlansPage() {
    const currentPath = window.location.pathname;
    const plansPages = [
      "/pages/customer/plans/plans.html",
      "/pages/admin/plans/plans.html",
    ];

    // Only show search on actual plans.html pages, not prepaid/postpaid home pages
    return (
      plansPages.some((page) => currentPath.includes(page)) ||
      (currentPath.includes("plans") && currentPath.includes(".html"))
    );
  }

  // Get current page type for navigation highlighting
  function getCurrentPage() {
    const currentPath = window.location.pathname.toLowerCase();

    if (
      currentPath.includes("/dashboard/") ||
      currentPath.includes("/dashboard.html")
    ) {
      return "home";
    } else if (
      currentPath.includes("/prepaid/") ||
      currentPath.includes("/postpaid/") ||
      currentPath.includes("/plans/") ||
      currentPath.includes("plans.html")
    ) {
      return "plans";
    } else if (
      currentPath.includes("/contact") ||
      currentPath.includes("/support/")
    ) {
      return "contact";
    }
    return null;
  }

  // Update navigation active states
  function updateActiveNavigation() {
    const currentPage = getCurrentPage();

    // Desktop navigation links
    const desktopHomeLink = document.getElementById("desktop-home-link");
    const desktopPlansLink = document.getElementById("desktop-plans-link");
    const desktopContactLink = document.getElementById("desktop-contact-link");

    // Mobile navigation links
    const mobileHomeLink = document.getElementById("mobile-home-link");
    const mobilePlansLink = document.getElementById("mobile-plans-link");
    const mobileContactLink = document.getElementById("mobile-contact-link");

    // Reset all states first
    const allDesktopLinks = [
      desktopHomeLink,
      desktopPlansLink,
      desktopContactLink,
    ];
    const allMobileLinks = [mobileHomeLink, mobilePlansLink, mobileContactLink];

    // Reset desktop states
    allDesktopLinks.forEach((link) => {
      if (link) {
        link.classList.remove("text-primary");
        link.classList.add("text-gray-700");
        const underline = link.querySelector("span");
        if (underline) {
          underline.classList.remove("w-full");
          underline.classList.add("w-0");
        }
      }
    });

    // Reset mobile states
    allMobileLinks.forEach((link) => {
      if (link) {
        link.classList.remove("bg-primary/10", "border-l-4", "border-primary");
        link.classList.add("hover:bg-gray-100");

        // Reset icon and text colors
        const icon = link.querySelector(".material-icons");
        const text = link.querySelector("span:last-child");
        if (icon) {
          icon.classList.remove("text-primary");
          icon.classList.add("text-gray-500", "group-hover:text-primary");
        }
        if (text) {
          text.classList.remove("text-primary");
          text.classList.add("text-gray-700", "group-hover:text-primary");
        }
      }
    });

    // Set active state based on current page
    if (currentPage === "home") {
      // Desktop home active
      if (desktopHomeLink) {
        desktopHomeLink.classList.remove("text-gray-700");
        desktopHomeLink.classList.add("text-primary");
        const underline = desktopHomeLink.querySelector("span");
        if (underline) {
          underline.classList.remove("w-0");
          underline.classList.add("w-full");
        }
      }

      // Mobile home active
      if (mobileHomeLink) {
        mobileHomeLink.classList.remove("hover:bg-gray-100");
        mobileHomeLink.classList.add(
          "bg-primary/10",
          "border-l-4",
          "border-primary"
        );

        const icon = mobileHomeLink.querySelector(".material-icons");
        const text = mobileHomeLink.querySelector("span:last-child");
        if (icon) {
          icon.classList.remove("text-gray-500", "group-hover:text-primary");
          icon.classList.add("text-primary");
        }
        if (text) {
          text.classList.remove("text-gray-700", "group-hover:text-primary");
          text.classList.add("text-primary");
        }
      }
    } else if (currentPage === "plans") {
      // Desktop plans active
      if (desktopPlansLink) {
        desktopPlansLink.classList.remove("text-gray-700");
        desktopPlansLink.classList.add("text-primary");
        const underline = desktopPlansLink.querySelector("span");
        if (underline) {
          underline.classList.remove("w-0");
          underline.classList.add("w-full");
        }
      }

      // Mobile plans active
      if (mobilePlansLink) {
        mobilePlansLink.classList.remove("hover:bg-gray-100");
        mobilePlansLink.classList.add(
          "bg-primary/10",
          "border-l-4",
          "border-primary"
        );

        const icon = mobilePlansLink.querySelector(".material-icons");
        const text = mobilePlansLink.querySelector("span:last-child");
        if (icon) {
          icon.classList.remove("text-gray-500", "group-hover:text-primary");
          icon.classList.add("text-primary");
        }
        if (text) {
          text.classList.remove("text-gray-700", "group-hover:text-primary");
          text.classList.add("text-primary");
        }
      }
    } else if (currentPage === "contact") {
      // Desktop contact active
      if (desktopContactLink) {
        desktopContactLink.classList.remove("text-gray-700");
        desktopContactLink.classList.add("text-primary");
        const underline = desktopContactLink.querySelector("span");
        if (underline) {
          underline.classList.remove("w-0");
          underline.classList.add("w-full");
        }
      }

      // Mobile contact active
      if (mobileContactLink) {
        mobileContactLink.classList.remove("hover:bg-gray-100");
        mobileContactLink.classList.add(
          "bg-primary/10",
          "border-l-4",
          "border-primary"
        );

        const icon = mobileContactLink.querySelector(".material-icons");
        const text = mobileContactLink.querySelector("span:last-child");
        if (icon) {
          icon.classList.remove("text-gray-500", "group-hover:text-primary");
          icon.classList.add("text-primary");
        }
        if (text) {
          text.classList.remove("text-gray-700", "group-hover:text-primary");
          text.classList.add("text-primary");
        }
      }
    }
  }

  // Show/hide search functionality based on current page
  function toggleSearchVisibility() {
    const searchContainer = document.getElementById("search-container");
    const mobileSearchContainer = document.getElementById(
      "mobile-search-container"
    );

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
      const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : "U";

      // Update desktop avatar and name
      const userAvatar = document.getElementById("user-avatar");
      const userName = document.getElementById("user-name");
      if (userAvatar) userAvatar.textContent = firstLetter;
      if (userName) userName.textContent = user.name || "User";

      // Update mobile avatar and name
      const mobileUserAvatar = document.getElementById("mobile-user-avatar");
      const mobileUserName = document.getElementById("mobile-user-name");
      if (mobileUserAvatar) mobileUserAvatar.textContent = firstLetter;
      if (mobileUserName) mobileUserName.textContent = user.name || "User";
    }
  }

  // Toggle dropdown menu
  function toggleDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropdown = document.getElementById("user-dropdown");
    if (dropdown) {
      dropdown.classList.toggle("hidden");
      console.log(
        "Dropdown toggled, hidden class:",
        dropdown.classList.contains("hidden")
      );
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

  // Initialize authentication state, search visibility, and active navigation
  checkAuthState();
  toggleSearchVisibility();
  updateActiveNavigation();

  // Attach dropdown functionality - wait a bit for DOM to be ready
  setTimeout(() => {
    const userAvatarBtn = document.getElementById("user-avatar-btn");
    if (userAvatarBtn) {
      // Remove any existing listeners
      const newUserAvatarBtn = userAvatarBtn.cloneNode(true);
      userAvatarBtn.parentNode.replaceChild(newUserAvatarBtn, userAvatarBtn);

      // Add new listener
      newUserAvatarBtn.addEventListener("click", toggleDropdown);
      console.log("Dropdown event listener attached");
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", closeDropdownOnOutsideClick);
  }, 100);

  // Attach logout listeners
  const desktopLogout = document.getElementById("logout-btn");
  const mobileLogout = document.getElementById("mobile-logout-btn");

  if (desktopLogout) {
    desktopLogout.addEventListener("click", handleLogout);
  }

  if (mobileLogout) {
    mobileLogout.addEventListener("click", handleLogout);
  }

  // Listen for storage changes (when user logs in/out in another tab)
  window.addEventListener("storage", function (e) {
    if (
      e.key === "loggedInUser" ||
      e.key === "customerId" ||
      e.key === "role"
    ) {
      checkAuthState();
    }
  });
});
