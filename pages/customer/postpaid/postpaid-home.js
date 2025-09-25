// Navbar functionality
function initializeNavbar() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const hamburgerLines = document.querySelectorAll(
    ".hamburger-line-1, .hamburger-line-2, .hamburger-line-3"
  );

  // Return early if elements don't exist
  if (!mobileMenuBtn || !mobileMenu || hamburgerLines.length === 0) {
    console.log("Navbar elements not found, retrying...");
    return false;
  }

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
      hamburgerLines[0].style.transform = "rotate(45deg) translate(6px, 6px)";
      hamburgerLines[1].style.opacity = "0";
      hamburgerLines[2].style.transform = "rotate(-45deg) translate(6px, -6px)";

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Close menu
      mobileMenu.classList.remove("translate-y-0", "opacity-100", "visible");
      mobileMenu.classList.add("-translate-y-full", "opacity-0", "invisible");

      // Reset hamburger
      hamburgerLines[0].style.transform = "";
      hamburgerLines[1].style.opacity = "1";
      hamburgerLines[2].style.transform = "";

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
      // highlightActiveLink();

      // If navbar was loaded, initialize it
      if (id === "navbar") {
        // Try to initialize navbar, with retries if elements aren't ready
        let retryCount = 0;
        const maxRetries = 10;

        function tryInitNavbar() {
          if (initializeNavbar()) {
            console.log("Navbar initialized on attempt", retryCount + 1);
            return;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(tryInitNavbar, 100);
          } else {
            console.warn(
              "Failed to initialize navbar after",
              maxRetries,
              "attempts"
            );
          }
        }

        setTimeout(tryInitNavbar, 50);
      }
    })
    .catch((error) => {
      console.error(`Error loading ${id}:`, error);
      // Don't fail, just continue
    });
}

// Initialize components
async function initializeComponents() {
  try {
    await Promise.allSettled([
      loadComponent("navbar", "/components/navbar.html"),
      loadComponent("footer", "/components/footer.html"),
    ]);
    document.dispatchEvent(new Event("navloaded"));
  } catch (error) {
    console.warn("Some components failed to load:", error);
  }
}

// API URLs
const TRANSACTIONS_API =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const PLANS_API = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";

// Global variables - CHANGED: Default category is now "Most Trending Plans"
let allPlans = [];
let currentCategory = "Most Trending Plans";
let searchTerm = "";
let currentSelectedPlanId = null;

// Helper function to safely process plan benefits
function processPlanBenefits(benefits) {
  if (!benefits) return [];

  if (typeof benefits === "string") {
    return benefits
      .split(/[,\n]/)
      .map((b) => b.trim())
      .filter((b) => b);
  }

  if (Array.isArray(benefits)) {
    return benefits
      .filter((b) => b && typeof b === "string")
      .map((b) => b.trim());
  }

  return [];
}

// Function to fetch all plans
async function fetchAllPlans() {
  try {
    console.log("Fetching all plans...");
    const response = await fetch(PLANS_API);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Plans fetched successfully:", data);

    allPlans = Array.isArray(data) ? data : [];
    return allPlans;
  } catch (error) {
    console.error("Error fetching plans:", error);
    allPlans = [];
    return [];
  }
}

// Function to filter plans by category for postpaid
function filterPlansByCategory(category) {
  console.log("Filtering postpaid plans by category:", category);

  if (!allPlans.length) {
    console.warn("No plans available for filtering");
    return [];
  }

  let filteredPlans = allPlans.filter((plan) => plan.type === "Postpaid");
  console.log("Postpaid plans count:", filteredPlans.length);

  switch (category) {
    case "Most Trending Plans":
      // Return trending postpaid plans (you can modify this logic)
      return filteredPlans.slice(0, 4);
    case "Individual Plans":
      filteredPlans = filteredPlans.filter(
        (plan) => plan.category === "Individual Plans" || !plan.category
      );
      break;
    default:
      // For any other category
      filteredPlans = filteredPlans.filter(
        (plan) => plan.category === category
      );
      break;
  }

  console.log(`Filtered postpaid plans for ${category}:`, filteredPlans);
  return filteredPlans.slice(0, 4);
}

// Function to search postpaid plans
function searchPlans(searchTerm) {
  if (!allPlans.length || !searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase();
  return allPlans
    .filter(
      (plan) =>
        plan.type === "Postpaid" &&
        (plan.name?.toLowerCase().includes(term) ||
          plan.description?.toLowerCase().includes(term) ||
          plan.category?.toLowerCase().includes(term) ||
          (typeof plan.benefits === "string" &&
            plan.benefits.toLowerCase().includes(term)))
    )
    .slice(0, 4);
}

// Function to show activation success animation
function showActivationSuccess(planName) {
  const successHTML = `
    <div id="activation-success" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-scaleIn">
        <div class="checkmark-circle mb-6">
          <div class="background"></div>
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-green-600 mb-2">Plan Activated Successfully!</h3>
        <p class="text-gray-600 mb-6">${planName} has been activated on your number.</p>
        <button 
          onclick="redirectToDashboard()" 
          class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Continue
        </button>
      </div>
    </div>
    <style>
      .checkmark-circle {
        width: 150px;
        height: 150px;
        position: relative;
        display: inline-block;
        vertical-align: top;
        margin: 0 auto;
      }
      
      .checkmark-circle .background {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        background: #00c851;
        position: absolute;
        animation: scaleIn 0.3s ease;
      }
      
      .checkmark {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        display: block;
        stroke-width: 4;
        stroke: #fff;
        stroke-miterlimit: 10;
        position: absolute;
        top: 0;
        left: 0;
      }
      
      .checkmark__circle {
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        stroke-width: 4;
        stroke-miterlimit: 10;
        stroke: #fff;
        fill: none;
        animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
      }
      
      .checkmark__check {
        transform-origin: 50% 50%;
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
      }
      
      @keyframes scaleIn {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
      
      @keyframes stroke {
        100% {
          stroke-dashoffset: 0;
        }
      }
    </style>
  `;

  document.body.insertAdjacentHTML("beforeend", successHTML);
}

// Function to redirect to dashboard
function redirectToDashboard() {
  // Close the success modal first
  closeActivationSuccess();

  // Redirect to dashboard page
  window.location.href = "/pages/customer/dashboard/dashboard.html";
}

// Function to close activation success
function closeActivationSuccess() {
  const successModal = document.getElementById("activation-success");
  if (successModal) {
    successModal.remove();
  }
}

// Function to show plan modal for postpaid
function showPlanModal(planId) {
  const plan = allPlans.find(
    (p) => p.id === planId || p.id === parseInt(planId)
  );
  if (!plan) {
    console.error("Plan not found for modal:", planId);
    return;
  }

  currentSelectedPlanId = planId;

  // Create modal if it doesn't exist
  let modal = document.getElementById("plan-modal");
  if (!modal) {
    const modalHTML = `
      <div id="plan-modal" class="fixed inset-0 z-50 hidden">
        <div class="modal-overlay absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style="backdrop-filter: blur(10px);">
          <div class="bg-card-light dark:bg-card-dark rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
            <button id="close-modal" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <span class="material-icons">close</span>
            </button>
            <div class="p-8">
              <div class="text-center mb-6">
                <div class="w-20 h-20 bg-gradient-to-r from-primary to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span class="material-icons text-white text-3xl">sim_card</span>
                </div>
                <h3 class="text-2xl font-bold mb-2" id="modal-plan-name">Plan Name</h3>
                <p class="text-gray-600 dark:text-gray-400" id="modal-plan-category">Category</p>
              </div>
              <div class="space-y-6">
                <div class="text-center">
                  <div class="text-4xl font-bold text-primary mb-2" id="modal-plan-price">₹0</div>
                  <p class="text-gray-600 dark:text-gray-400" id="modal-plan-validity">Validity</p>
                </div>
                <div>
                  <h4 class="font-semibold mb-3">Description</h4>
                  <p class="text-gray-600 dark:text-gray-400" id="modal-plan-description">Plan description</p>
                </div>
                <div>
                  <h4 class="font-semibold mb-3">Benefits</h4>
                  <ul class="space-y-2" id="modal-plan-benefits">
                    <!-- Benefits will be loaded dynamically -->
                  </ul>
                </div>
                <button id="activate-now-button" class="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all">
                  Activate Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    modal = document.getElementById("plan-modal");

    // Add event listeners
    const closeModalBtn = document.getElementById("close-modal");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", closeModal);
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("modal-overlay")) {
        closeModal();
      }
    });

    const activateNowButton = document.getElementById("activate-now-button");
    if (activateNowButton) {
      activateNowButton.addEventListener("click", function () {
        if (currentSelectedPlanId) {
          closeModal();
          showActivationSuccess(plan.name || "Postpaid Plan");
        } else {
          alert("Please select a plan first");
        }
      });
    }
  }

  // Update modal content
  const modalPlanName = document.getElementById("modal-plan-name");
  const modalPlanCategory = document.getElementById("modal-plan-category");
  const modalPlanPrice = document.getElementById("modal-plan-price");
  const modalPlanValidity = document.getElementById("modal-plan-validity");
  const modalPlanDescription = document.getElementById(
    "modal-plan-description"
  );
  const modalPlanBenefits = document.getElementById("modal-plan-benefits");

  if (modalPlanName) modalPlanName.textContent = plan.name || "Unnamed Plan";
  if (modalPlanCategory)
    modalPlanCategory.textContent = plan.category || "Postpaid Plan";
  if (modalPlanPrice) modalPlanPrice.textContent = `₹${plan.price || "0"}`;
  if (modalPlanValidity)
    modalPlanValidity.textContent = plan.validity || "Monthly";
  if (modalPlanDescription)
    modalPlanDescription.textContent =
      plan.description || "Premium postpaid plan with unlimited benefits";

  // Parse and display benefits
  const benefits = processPlanBenefits(plan.benefits);

  if (modalPlanBenefits) {
    if (benefits.length === 0) {
      modalPlanBenefits.innerHTML = `
        <li class="flex items-center space-x-2">
          <span class="material-icons text-green-500 text-sm">check_circle</span>
          <span>Unlimited 5G Data</span>
        </li>
        <li class="flex items-center space-x-2">
          <span class="material-icons text-green-500 text-sm">check_circle</span>
          <span>Priority Network Access</span>
        </li>
        <li class="flex items-center space-x-2">
          <span class="material-icons text-green-500 text-sm">check_circle</span>
          <span>OTT Subscriptions Included</span>
        </li>
      `;
    } else {
      modalPlanBenefits.innerHTML = benefits
        .map(
          (benefit) => `
          <li class="flex items-center space-x-2">
            <span class="material-icons text-green-500 text-sm">check_circle</span>
            <span>${benefit}</span>
          </li>
        `
        )
        .join("");
    }
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

// Function to close modal
function closeModal() {
  const modal = document.getElementById("plan-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    currentSelectedPlanId = null;
  }
}

// Function to create plan card HTML with modal functionality for postpaid
function createPlanCard(plan, index) {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-indigo-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-pink-500 to-violet-600",
  ];

  const badges = [
    { text: "TRENDING", color: "from-green-400 to-green-600" },
    { text: "POPULAR", color: "from-blue-400 to-blue-600" },
    { text: "VALUE", color: "from-purple-400 to-purple-600" },
    { text: "PREMIUM", color: "from-yellow-400 to-orange-500" },
  ];

  const benefits = processPlanBenefits(plan.benefits);
  const benefitsHtml = benefits
    .slice(0, 3)
    .map(
      (benefit) => `
        <div class="flex items-center">
          <span class="material-icons text-green-500 text-sm mr-2">check_circle</span>
          ${benefit}
        </div>
      `
    )
    .join("");

  const badge = badges[index % badges.length];
  const badgeHtml = badge.text
    ? `
        <div class="absolute top-0 right-0 bg-gradient-to-r ${badge.color} text-white px-3 py-1 rounded-bl-lg text-xs font-semibold">
          ${badge.text}
        </div>
      `
    : "";

  return `
    <div class="bg-card-light dark:bg-card-dark rounded-2xl p-6 shadow-xl card-hover relative overflow-hidden animate-scaleIn">
      ${badgeHtml}
      <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
        gradients[index % gradients.length]
      }"></div>
      <div class="text-center">
        <h3 class="text-lg font-bold mb-2 text-gray-800 dark:text-white">
          ${plan.name || "Postpaid Plan"}
        </h3>
        <div class="text-3xl font-bold text-primary mb-2">₹${
          plan.price || "0"
        }<span class="text-sm font-normal">/month</span></div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          ${plan.validity || "Monthly"} Billing
        </div>
        <div class="space-y-2 text-sm text-left mb-6">
          ${
            benefitsHtml ||
            `
            <div class="flex items-center">
              <span class="material-icons text-green-500 text-sm mr-2">check_circle</span>
              Unlimited 5G Data
            </div>
            <div class="flex items-center">
              <span class="material-icons text-green-500 text-sm mr-2">check_circle</span>
              Priority Network Access
            </div>
            <div class="flex items-center">
              <span class="material-icons text-green-500 text-sm mr-2">check_circle</span>
              OTT Subscriptions
            </div>
            `
          }
        </div>
        <button class="activate-plan-btn w-full bg-gradient-to-r ${
          gradients[index % gradients.length]
        } text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all" data-plan-id="${
    plan.id
  }">
          Activate Now
        </button>
      </div>
    </div>
  `;
}

// Function to update category button styles
function updateCategoryButtons(activeCategory) {
  const buttons = document.querySelectorAll(".category-btn");
  buttons.forEach((btn) => {
    const category = btn.getAttribute("data-category");
    if (category === activeCategory) {
      btn.className =
        "category-btn px-3 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all";
    } else {
      btn.className =
        "category-btn px-3 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-200 dark:bg-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors";
    }
  });
}

// Function to load and display postpaid plans
async function loadPlans() {
  try {
    console.log(
      `Loading postpaid plans for category: ${currentCategory}, search: ${searchTerm}`
    );

    let plansToShow = [];
    const container = document.getElementById("postpaid-plans-container");

    if (!container) {
      console.error("Postpaid plans container not found");
      return;
    }

    // Show loading state
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 mt-2">Loading postpaid plans...</p>
      </div>
    `;

    if (searchTerm.trim()) {
      // Search mode
      plansToShow = searchPlans(searchTerm);
      if (plansToShow.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-8">
            <p class="text-gray-500">No postpaid plans found for "${searchTerm}". Please try a different search term.</p>
          </div>
        `;
        return;
      }
    } else {
      // Category filter mode
      plansToShow = filterPlansByCategory(currentCategory);
    }

    console.log("Postpaid plans to show:", plansToShow);

    if (plansToShow.length === 0) {
      // Fallback: show some default postpaid plans if none found
      plansToShow = [
        {
          id: 101,
          name: "Postpaid Plus",
          price: 599,
          validity: "Monthly",
          category: "Most Trending Plans",
          type: "Postpaid",
          benefits:
            "Unlimited 5G Data, Netflix Premium, Amazon Prime, 100GB Data",
        },
        {
          id: 102,
          name: "Business Pro",
          price: 899,
          validity: "Monthly",
          category: "Most Trending Plans",
          type: "Postpaid",
          benefits:
            "Unlimited 5G Data, Priority Network, OTT Bundle, International Roaming",
        },
        {
          id: 103,
          name: "Family Pack",
          price: 1299,
          validity: "Monthly",
          category: "Most Trending Plans",
          type: "Postpaid",
          benefits:
            "4 Connections, Shared Data, Family OTT Subscriptions, Free Calling",
        },
        {
          id: 104,
          name: "Premium Ultra",
          price: 1499,
          validity: "Monthly",
          category: "Most Trending Plans",
          type: "Postpaid",
          benefits:
            "Unlimited Everything, 5G Priority, Premium OTT, International Benefits",
        },
      ];
      console.log("Using fallback postpaid plans:", plansToShow);
    }

    container.innerHTML = plansToShow
      .map((plan, index) => createPlanCard(plan, index))
      .join("");

    // Add event listeners to "Activate Now" buttons
    const activatePlanButtons =
      container.querySelectorAll(".activate-plan-btn");
    activatePlanButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const planId = button.getAttribute("data-plan-id");
        console.log("Activate plan clicked for ID:", planId);
        showPlanModal(planId);
      });
    });
  } catch (error) {
    console.error("Error loading postpaid plans:", error);
    const container = document.getElementById("postpaid-plans-container");
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-red-500">Unable to load postpaid plans. Please try again later.</p>
          <p class="text-sm text-gray-400 mt-2">Error: ${error.message}</p>
        </div>
      `;
    }
  }
}

// Main initialization function
async function initializeApp() {
  try {
    console.log("Initializing postpaid app...");

    // Initialize components first
    await initializeComponents();

    // Load all plans first
    await fetchAllPlans();

    // Update category buttons to show "Most Trending Plans" as active
    updateCategoryButtons(currentCategory);

    // Load initial postpaid plans
    await loadPlans();

    // Set up event listeners after DOM is ready
    setupEventListeners();

    console.log("Postpaid app initialized successfully");
  } catch (error) {
    console.error("Error initializing postpaid app:", error);

    const container = document.getElementById("postpaid-plans-container");
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-red-500">Failed to initialize application. Please refresh the page.</p>
        </div>
      `;
    }
  }
}

// Function to set up event listeners
function setupEventListeners() {
  console.log("Setting up event listeners for postpaid...");

  // Category button event listeners
  const categoryButtons = document.querySelectorAll(".category-btn");
  console.log("Found category buttons:", categoryButtons.length);

  categoryButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const category = this.getAttribute("data-category");
      console.log("Category button clicked:", category);

      currentCategory = category;
      searchTerm = ""; // Clear search when category is selected

      // Clear search input if it exists
      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        searchInput.value = "";
      }

      updateCategoryButtons(category);
      await loadPlans();
    });
  });

  // Search functionality
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    console.log("Setting up search input listener");
    let searchTimeout;

    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        searchTerm = this.value;
        console.log("Search term:", searchTerm);

        if (searchTerm.trim()) {
          // Clear category selection when searching
          updateCategoryButtons("");
          currentCategory = "";
        } else {
          // Reset to Most Trending Plans when search is cleared
          currentCategory = "Most Trending Plans";
          updateCategoryButtons("Most Trending Plans");
        }
        await loadPlans();
      }, 300); // Debounce search
    });
  } else {
    console.log("Search input not found");
  }

  // Close modal on Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
      closeActivationSuccess();
    }
  });

  console.log("Event listeners set up successfully");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
