// Global variables
let loggedInUser = null;
let currentCustomer = null;
let userTransactions = [];
let availablePlans = [];
let currentActivePlan = null;

// API URLs
const API_TRANSACTIONS =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const API_PLANS = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";

// Toast notification function
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  let icon, borderColor, bgColor, textColor;

  if (type === "success") {
    icon = `
      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `;
    borderColor = "border-green-200";
    bgColor = "bg-green-50";
    textColor = "text-green-800";
  } else if (type === "error") {
    icon = `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
    `;
    borderColor = "border-red-200";
    bgColor = "bg-red-50";
    textColor = "text-red-800";
  }

  toast.className = `toast flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${bgColor} ${borderColor} ${textColor} border min-w-[350px] backdrop-blur-lg`;
  toast.innerHTML = `
    <div class="flex-shrink-0">${icon}</div>
    <span class="font-medium flex-1">${message}</span>
    <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors" onclick="this.parentElement.remove()">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add("hide");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 400);
    }
  }, 5000);
}

function showLoadingState(isLoading) {
  const inputs = ["customerName", "customerPhone", "customerPlan"];
  inputs.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      if (isLoading) {
        element.classList.add("loading-skeleton");
        element.value = "";
        element.placeholder = "Loading...";
      } else {
        element.classList.remove("loading-skeleton");
        element.placeholder = "";
      }
    }
  });
}

// Load customer data from API
async function loadCustomerData() {
  try {
    showLoadingState(true);

    const response = await fetch(
      "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers"
    );
    const customers = await response.json();

    // Find the logged in customer using the phone from loggedInUser
    const userPhone = loggedInUser ? loggedInUser.phone : null;
    currentCustomer = customers.find(
      (customer) => customer.phone === userPhone
    );

    if (!currentCustomer) {
      showToast("Customer data not found", "error");
      return;
    }

    // Populate the form fields
    document.getElementById("customerName").value = currentCustomer.name;
    document.getElementById("customerPhone").value = currentCustomer.phone;

    // Fetch active plan instead of using the static value
    fetchActivePlan();
  } catch (error) {
    console.error("Error loading customer data:", error);
    showToast("Failed to load customer data", "error");
    showLoadingState(false);
  }
}

// Fetch transactions for the current user
async function fetchTransactions() {
  try {
    const response = await fetch(API_TRANSACTIONS);
    const allTransactions = await response.json();

    if (currentCustomer) {
      // Filter transactions by phone number and only successful ones
      userTransactions = allTransactions
        .filter(
          (transaction) =>
            transaction.phone === currentCustomer.phone &&
            transaction.status === "Success"
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    userTransactions = [];
  }
}

// Fetch available plans
async function fetchPlans() {
  try {
    const response = await fetch(API_PLANS);
    availablePlans = await response.json();
  } catch (error) {
    console.error("Error fetching plans:", error);
    availablePlans = [];
  }
}

// Find the active plan based on transactions and plan validity
function findActivePlan() {
  if (userTransactions.length === 0) {
    currentActivePlan = null;
    return;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  for (let transaction of userTransactions) {
    const transactionDate = new Date(transaction.date);
    transactionDate.setHours(0, 0, 0, 0); // Reset time to start of day

    const plan = availablePlans.find((p) => p.id === transaction.planId);

    if (plan) {
      // For postpaid plans, validity is always 30 days (monthly)
      const validity =
        plan.type === "Postpaid"
          ? 30
          : parseInt(plan.validity.replace(/\D/g, "")) || 30;

      const daysDifference = Math.floor(
        (now - transactionDate) / (1000 * 60 * 60 * 24)
      );

      // Plan is active if (current date - recharge date) < validity days
      if (daysDifference < validity) {
        const expiryDate = new Date(transactionDate);
        expiryDate.setDate(expiryDate.getDate() + validity);

        currentActivePlan = {
          ...plan,
          transactionDate: transactionDate,
          expiryDate: expiryDate,
          transaction: transaction,
          daysUsed: daysDifference,
          daysRemaining: validity - daysDifference,
          isPrepaid: plan.type === "Prepaid",
          isPostpaid: plan.type === "Postpaid",
        };
        return; // Found active plan, exit the loop
      }
    }
  }

  // If we get here, no active plan was found
  currentActivePlan = null;
}

// Fetch and display the active plan
async function fetchActivePlan() {
  try {
    await fetchPlans();
    await fetchTransactions();
    findActivePlan();
    updatePlanInfo();
  } catch (error) {
    console.error("Error fetching active plan:", error);
    currentActivePlan = null;
    updatePlanInfo();
  }
}

// Update the plan information in the UI
function updatePlanInfo() {
  const planField = document.getElementById("customerPlan");

  if (currentActivePlan) {
    planField.value = `${currentActivePlan.name} (${currentActivePlan.type})`;
  } else {
    planField.value = "No active plan";
  }

  showLoadingState(false);
}

// Load customer data from API
async function loadCustomerData() {
  try {
    showLoadingState(true);

    const response = await fetch(
      "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers"
    );
    const customers = await response.json();

    // Find the logged in customer using the phone from loggedInUser
    const userPhone = loggedInUser ? loggedInUser.phone : null;
    currentCustomer = customers.find(
      (customer) => customer.phone === userPhone
    );

    if (!currentCustomer) {
      showToast("Customer data not found", "error");
      return;
    }

    // Populate the form fields
    document.getElementById("customerName").value = currentCustomer.name;
    document.getElementById("customerPhone").value = currentCustomer.phone;

    // Fetch active plan instead of using the static value
    fetchActivePlan();

    // Update status badge
    const statusBadge = document.getElementById("statusBadge");
    if (statusBadge) {
      statusBadge.textContent = currentCustomer.status;
      statusBadge.className =
        currentCustomer.status === "Active"
          ? "px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
          : "px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full";
    }

    showLoadingState(false);
  } catch (error) {
    console.error("Error loading customer data:", error);
    showToast("Error loading customer data", "error");
    showLoadingState(false);
  }
}

// Profile image functions
function handleImageUpload(file) {
  if (!file.type.startsWith("image/")) {
    showToast("Please select a valid image file", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Image size should be less than 5MB", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const imageData = e.target.result;
    window.profileImageData = imageData;
    displayProfileImage(imageData);
    showToast("Profile picture updated successfully!", "success");
  };
  reader.readAsDataURL(file);
}

function displayProfileImage(imageData) {
  const profileImage = document.getElementById("profileImage");
  const defaultAvatar = document.getElementById("defaultAvatar");
  const removeBtn = document.getElementById("removeBtn");

  if (profileImage && defaultAvatar && removeBtn) {
    profileImage.src = imageData;
    profileImage.classList.remove("hidden");
    defaultAvatar.style.display = "none";
    removeBtn.classList.remove("hidden");
  }
}

function removeProfileImage() {
  const profileImage = document.getElementById("profileImage");
  const defaultAvatar = document.getElementById("defaultAvatar");
  const removeBtn = document.getElementById("removeBtn");

  if (profileImage && defaultAvatar && removeBtn) {
    profileImage.classList.add("hidden");
    profileImage.src = "";
    defaultAvatar.style.display = "flex";
    removeBtn.classList.add("hidden");
    window.profileImageData = null;
    showToast("Profile picture removed", "success");
  }
}

function loadSavedProfileImage() {
  if (window.profileImageData) {
    displayProfileImage(window.profileImageData);
  }
}

function initializeProfileImageUpload() {
  const profileImageInput = document.getElementById("profileImageInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const defaultAvatar = document.getElementById("defaultAvatar");
  const removeBtn = document.getElementById("removeBtn");

  if (uploadBtn && profileImageInput) {
    uploadBtn.addEventListener("click", () => profileImageInput.click());
  }

  if (defaultAvatar && profileImageInput) {
    defaultAvatar.addEventListener("click", () => profileImageInput.click());
  }

  if (profileImageInput) {
    profileImageInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) handleImageUpload(file);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", removeProfileImage);
  }
}

function initializePasswordChange() {
  const saveBtn = document.getElementById("saveBtn");
  const oldPasswordInput = document.getElementById("oldPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  if (
    !saveBtn ||
    !oldPasswordInput ||
    !newPasswordInput ||
    !confirmPasswordInput
  ) {
    return;
  }

  saveBtn.addEventListener("click", function () {
    if (!oldPasswordInput.value) {
      showToast("Please enter your current password", "error");
      oldPasswordInput.focus();
      return;
    }

    if (!newPasswordInput.value) {
      showToast("Please enter your new password", "error");
      newPasswordInput.focus();
      return;
    }

    if (newPasswordInput.value !== confirmPasswordInput.value) {
      showToast("New passwords do not match", "error");
      confirmPasswordInput.focus();
      return;
    }

    if (newPasswordInput.value.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      newPasswordInput.focus();
      return;
    }

    // Validate current password
    if (oldPasswordInput.value !== currentCustomer.password) {
      showToast("Current password is incorrect", "error");
      oldPasswordInput.focus();
      return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Updating Password...
    `;

    // Simulate API call to update password
    setTimeout(() => {
      showToast("Password updated successfully!", "success");
      document.getElementById("passwordChangeForm").reset();

      // Reset button state
      saveBtn.disabled = false;
      saveBtn.textContent = "Update Password";
    }, 2000);
  });
}

function initializeProfileEdit() {
  const editProfileBtn = document.getElementById("editProfileBtn");
  const nameInput = document.getElementById("customerName");

  if (!editProfileBtn || !nameInput) {
    return;
  }

  editProfileBtn.addEventListener("click", function () {
    const isEditing = !nameInput.disabled;

    if (isEditing) {
      // Save changes
      nameInput.disabled = true;
      nameInput.classList.remove("bg-white");
      nameInput.classList.add("bg-gray-50", "cursor-not-allowed");
      editProfileBtn.textContent = "Edit Profile";
      editProfileBtn.classList.remove("btn-gradient-success");
      editProfileBtn.classList.add("btn-gradient");

      // Update current customer object
      currentCustomer.name = nameInput.value;
      showToast("Profile updated successfully!", "success");
    } else {
      // Enable editing only for name field
      nameInput.disabled = false;
      nameInput.classList.remove("bg-gray-50", "cursor-not-allowed");
      nameInput.classList.add("bg-white");
      nameInput.focus();
      editProfileBtn.textContent = "Save Changes";
      editProfileBtn.classList.remove("btn-gradient");
      editProfileBtn.classList.add("btn-gradient-success");
    }
  });
}

// Load external components
function loadComponent(id, filepath) {
  return fetch(filepath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((data) => {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = data;
      }
      // Force light theme immediately after loading
      setTimeout(forceLightTheme, 50);
    })
    .catch((error) => {
      console.error(`Error loading ${id}:`, error);
    });
}

// Navbar functionality
function initializeNavbar() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!mobileMenuBtn || !mobileMenu) {
    console.log("Navbar elements not found, retrying...");
    return false;
  }

  const hamburgerLines = document.querySelectorAll(
    ".hamburger-line-1, .hamburger-line-2, .hamburger-line-3"
  );

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;

    if (isMenuOpen) {
      // Open menu
      mobileMenu.classList.remove(
        "-translate-y-full",
        "opacity-0",
        "invisible"
      );
      mobileMenu.classList.add("translate-y-0", "opacity-100", "visible");

      // Animate hamburger to X
      if (hamburgerLines.length >= 3) {
        hamburgerLines[0].style.transform = "rotate(45deg) translate(6px, 6px)";
        hamburgerLines[1].style.opacity = "0";
        hamburgerLines[2].style.transform =
          "rotate(-45deg) translate(6px, -6px)";
      }

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Close menu
      mobileMenu.classList.remove("translate-y-0", "opacity-100", "visible");
      mobileMenu.classList.add("-translate-y-full", "opacity-0", "invisible");

      // Reset hamburger
      if (hamburgerLines.length >= 3) {
        hamburgerLines[0].style.transform = "";
        hamburgerLines[1].style.opacity = "1";
        hamburgerLines[2].style.transform = "";
      }

      // Allow body scroll
      document.body.style.overflow = "";
    }
  }

  // Remove any existing event listeners to prevent duplicates
  const newMobileMenuBtn = mobileMenuBtn.cloneNode(true);
  mobileMenuBtn.parentNode.replaceChild(newMobileMenuBtn, mobileMenuBtn);

  // Toggle menu on button click
  newMobileMenuBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking on menu items
  const menuLinks = mobileMenu.querySelectorAll("a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (isMenuOpen) {
        toggleMenu();
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      isMenuOpen &&
      !mobileMenu.contains(event.target) &&
      !newMobileMenuBtn.contains(event.target)
    ) {
      toggleMenu();
    }
  });

  // Close menu on escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isMenuOpen) {
      toggleMenu();
    }
  });

  // Handle window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024 && isMenuOpen) {
      toggleMenu();
    }
  });

  console.log("Navbar initialized successfully");
  return true;
}

// Safe function to check if element has href and includes text
function elementHasHrefAndIncludes(element, text) {
  if (!element || !element.getAttribute) return false;

  const href = element.getAttribute("href");
  const elementText = element.textContent || "";

  return (href && href.includes(text)) || elementText.includes(text);
}

// Simple function to force light theme (like other pages)
function forceLightTheme() {
  try {
    // Remove dark class from html and body
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");

    // Set light mode in localStorage
    localStorage.setItem("darkMode", "false");
  } catch (error) {
    console.warn("Error in forceLightTheme:", error);
  }
}

function fixMobileMenuActiveStates() {
  try {
    const mobileMenu = document.getElementById("mobile-menu");
    if (!mobileMenu) return;

    const mobileLinks = mobileMenu.querySelectorAll("a");
    const currentPath = window.location.pathname;

    mobileLinks.forEach((link) => {
      if (!link || !link.classList) return;

      // Remove all active classes first
      link.classList.remove("bg-purple-600", "text-white", "rounded-lg");

      // Add active class only to Profile link if we're on profile page
      const href = link.getAttribute("href");
      if (
        href &&
        (href.includes("profile") || currentPath.includes("profile"))
      ) {
        link.classList.add("bg-purple-600", "text-white", "rounded-lg");
        link.classList.remove("text-gray-800", "hover:text-purple-600");
      } else {
        // For non-active links, ensure proper styling
        link.classList.add("text-gray-800", "hover:text-purple-600");
        link.classList.remove("text-white");

        // Specifically remove active state from Plans link
        if (
          elementHasHrefAndIncludes(link, "Plans") ||
          elementHasHrefAndIncludes(link, "plans")
        ) {
          link.classList.remove("bg-purple-600", "text-white");
        }
      }
    });
  } catch (error) {
    console.warn("Error in fixMobileMenuActiveStates:", error);
  }
}

function highlightActiveLink() {
  try {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll("#sidebar a, #mobile-menu a");

    links.forEach((link) => {
      if (!link || !link.classList) return;

      // Remove all active classes first
      link.classList.remove("bg-purple-600", "text-white", "rounded-lg");

      // Add active class only to Profile link if we're on profile page
      const href = link.getAttribute("href");
      if (
        href &&
        (href.includes("profile") || currentPath.includes("profile"))
      ) {
        link.classList.add("bg-purple-600", "text-white", "rounded-lg");
        link.classList.remove(
          "text-gray-800",
          "text-gray-200",
          "hover:text-purple-600"
        );
      } else {
        // For non-active links
        link.classList.add("text-gray-800", "hover:text-purple-600");
        link.classList.remove("text-white");
      }
    });
  } catch (error) {
    console.warn("Error in highlightActiveLink:", error);
  }
}

function ensureMobileMenuLightTheme() {
  try {
    const mobileMenu = document.getElementById("mobile-menu");
    if (!mobileMenu) {
      // Retry if mobile menu not found yet
      setTimeout(ensureMobileMenuLightTheme, 100);
      return;
    }

    // Force light theme styles
    mobileMenu.classList.remove(
      "bg-gray-800",
      "dark:bg-gray-800",
      "dark:bg-gray-900"
    );
    mobileMenu.classList.add("bg-white");

    const mobileLinks = mobileMenu.querySelectorAll("a");
    mobileLinks.forEach((link) => {
      if (!link || !link.classList) return;

      link.classList.remove("text-white", "text-gray-200", "dark:text-white");

      // Set appropriate text colors
      if (link.classList.contains("bg-purple-600")) {
        link.classList.add("text-white");
      } else {
        link.classList.add("text-gray-800");
      }
    });

    console.log("Mobile menu light theme applied");
  } catch (error) {
    console.warn("Error in ensureMobileMenuLightTheme:", error);
  }
}

// Initialize components
async function initializeComponents() {
  try {
    await Promise.allSettled([
      loadComponent("navbar", "/components/navbar.html"),
      loadComponent("footer", "/components/footer.html"),
    ]);

    // Initialize navbar functionality after components are loaded
    initializeNavbarWithRetry();

    document.dispatchEvent(new Event("navloaded"));
  } catch (error) {
    console.warn("Some components failed to load:", error);
  }
}

// Function to initialize navbar with retry logic
function initializeNavbarWithRetry() {
  let retryCount = 0;
  const maxRetries = 10;

  function tryInitNavbar() {
    if (initializeNavbar()) {
      console.log("Navbar initialized successfully");
      return;
    }

    retryCount++;
    if (retryCount < maxRetries) {
      setTimeout(tryInitNavbar, 100);
    } else {
      console.warn("Failed to initialize navbar after", maxRetries, "attempts");
    }
  }

  setTimeout(tryInitNavbar, 50);
}

// Main initialization function
async function initializeApp() {
  try {
    console.log("Initializing profile application...");

    // First check if user is logged in using loggedInUser
    const loggedInUserStr = localStorage.getItem("loggedInUser");

    if (!loggedInUserStr) {
      showToast("Please log in to view your profile", "error");
      setTimeout(() => {
        window.location.href = "/pages/auth/login/login.html";
      }, 2000);
      return;
    }

    // Parse the loggedInUser data
    loggedInUser = JSON.parse(loggedInUserStr);
    console.log("Logged in user:", loggedInUser);

    // Initialize components first (navbar, footer)
    await initializeComponents();

    // Then load customer data
    await loadCustomerData();

    // Load saved profile image if exists
    loadSavedProfileImage();

    // Initialize all functionality
    initializeProfileImageUpload();
    initializePasswordChange();
    initializeProfileEdit();

    // Simple initialization like other pages - no dark mode interference
    setTimeout(() => {
      try {
        // Just ensure light mode for the page content, let navbar handle its own styling
        forceLightTheme();
      } catch (error) {
        console.warn("Error during theme initialization:", error);
      }
    }, 200);

    console.log("Profile application initialized successfully");
  } catch (error) {
    console.error("Error initializing profile application:", error);
    showToast("Error initializing application", "error");
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
