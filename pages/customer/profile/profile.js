// Get logged in customer phone from localStorage
const loggedInPhone = localStorage.getItem("loggedInPhone");
let currentCustomer = null;

document.addEventListener("DOMContentLoaded", function () {
  // Check if customer is logged in
  if (!loggedInPhone) {
    showToast("Please log in to view your profile", "error");
    setTimeout(() => {
      window.location.href = "/pages/auth/login/login.html";
    }, 2000);
    return;
  }

  // Load customer data
  loadCustomerData();
  loadSavedProfileImage();

  // Initialize components
  initializeProfileImageUpload();
  initializePasswordChange();
  initializeProfileEdit();
});

// Load customer data from API
async function loadCustomerData() {
  try {
    showLoadingState(true);

    const response = await fetch(
      "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers"
    );
    const customers = await response.json();

    // Find the logged in customer
    currentCustomer = customers.find(
      (customer) => customer.phone === loggedInPhone
    );

    if (!currentCustomer) {
      showToast("Customer data not found", "error");
      return;
    }

    // Populate the form fields
    document.getElementById("customerName").value = currentCustomer.name;
    document.getElementById("customerPhone").value = currentCustomer.phone;
    document.getElementById("customerPlan").value =
      currentCustomer.plan || "No active plan";

    // Update status badge
    const statusBadge = document.getElementById("statusBadge");

    statusBadge.textContent = currentCustomer.status;
    statusBadge.className =
      currentCustomer.status === "Active"
        ? "px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
        : "px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full";

    showLoadingState(false);
  } catch (error) {
    console.error("Error loading customer data:", error);
    showToast("Error loading customer data", "error");
    showLoadingState(false);
  }
}

function showLoadingState(isLoading) {
  const inputs = ["customerName", "customerPhone", "customerPlan"];
  inputs.forEach((id) => {
    const element = document.getElementById(id);
    if (isLoading) {
      element.classList.add("loading-skeleton");
      element.value = "";
      element.placeholder = "Loading...";
    } else {
      element.classList.remove("loading-skeleton");
      element.placeholder = "";
    }
  });
}

function initializeProfileImageUpload() {
  const profileImage = document.getElementById("profileImage");
  const defaultAvatar = document.getElementById("defaultAvatar");
  const profileImageInput = document.getElementById("profileImageInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const removeBtn = document.getElementById("removeBtn");
  const uploadOverlay = document.getElementById("uploadOverlay");

  uploadBtn.addEventListener("click", () => profileImageInput.click());
  defaultAvatar.addEventListener("click", () => profileImageInput.click());
  uploadOverlay.addEventListener("click", () => profileImageInput.click());

  profileImageInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  });

  removeBtn.addEventListener("click", removeProfileImage);
}

function initializePasswordChange() {
  const saveBtn = document.getElementById("saveBtn");
  const oldPasswordInput = document.getElementById("oldPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

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

  editProfileBtn.addEventListener("click", function () {
    const nameInput = document.getElementById("customerName");
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

  profileImage.src = imageData;
  profileImage.classList.remove("hidden");
  defaultAvatar.style.display = "none";
  removeBtn.classList.remove("hidden");
}

function removeProfileImage() {
  const profileImage = document.getElementById("profileImage");
  const defaultAvatar = document.getElementById("defaultAvatar");
  const removeBtn = document.getElementById("removeBtn");

  profileImage.classList.add("hidden");
  profileImage.src = "";
  defaultAvatar.style.display = "flex";
  removeBtn.classList.add("hidden");
  window.profileImageData = null;
  showToast("Profile picture removed", "success");
}

function loadSavedProfileImage() {
  if (window.profileImageData) {
    displayProfileImage(window.profileImageData);
  }
}

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
  } else if (type === "info") {
    icon = `
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          `;
    borderColor = "border-blue-200";
    bgColor = "bg-blue-50";
    textColor = "text-blue-800";
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

// Load external components
function loadComponent(id, filepath) {
  fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      // Force light theme for navbar with more comprehensive approach
      setTimeout(() => {
        forceLightTheme();
        highlightActiveLink();
      }, 100);
    })
    .catch((error) => console.error(`Error loading ${id}:`, error));
}

// Comprehensive function to force light theme
function forceLightTheme() {
  // Remove dark class from html and body
  document.documentElement.classList.remove("dark");
  document.body.classList.remove("dark");

  // Find and fix all dark theme elements in navbar
  const navbar = document.getElementById("navbar");
  if (navbar) {
    // Remove dark class from navbar container
    navbar.classList.remove("dark");

    // Find all elements with dark theme classes and override them
    const allElements = navbar.querySelectorAll("*");
    allElements.forEach((el) => {
      // Remove common dark theme classes
      el.classList.remove(
        "dark:bg-gray-800",
        "dark:bg-gray-900",
        "dark:text-white",
        "dark:text-gray-100",
        "dark:border-gray-700"
      );

      // Force light theme classes if they have dark variants
      if (
        el.classList.contains("bg-gray-800") ||
        el.classList.contains("bg-gray-900")
      ) {
        el.classList.remove("bg-gray-800", "bg-gray-900");
        el.classList.add("bg-white");
      }

      if (el.classList.contains("border-gray-700")) {
        el.classList.remove("border-gray-700");
        el.classList.add("border-gray-200");
      }
    });

    // Specifically target sidebar if it exists
    const sidebar = navbar.querySelector("#sidebar");
    if (sidebar) {
      sidebar.classList.remove("bg-gray-800", "dark:bg-gray-800");
      sidebar.classList.add("bg-white", "border-r", "border-gray-200");

      // Fix sidebar links
      const sidebarLinks = sidebar.querySelectorAll("a");
      sidebarLinks.forEach((link) => {
        if (!link.classList.contains("bg-purple-600")) {
          link.classList.remove("text-gray-200", "text-white");
          link.classList.add("text-gray-700");
        }
      });
    }
  }

  // Set localStorage to prevent dark mode from being applied
  localStorage.setItem("darkMode", "false");
}

function highlightActiveLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll("#sidebar a");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.remove(
      "bg-purple-600",
      "text-white",
      "rounded-lg",
      "hover:bg-purple-700"
    );
    link.classList.add("text-gray-200");

    if (href && (href.includes("profile") || currentPath.includes("profile"))) {
      link.classList.remove("text-gray-200");
      link.classList.add(
        "bg-purple-600",
        "text-white",
        "rounded-lg",
        "hover:bg-purple-700"
      );
    }
  });
}

// Initialize components
loadComponent("navbar", "/components/navbar.html");
loadComponent("footer", "/components/footer.html");
