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
      highlightActiveLink();

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

// Global variables
let allPlans = [];
let currentCategory = "Popular Plans";
let searchTerm = "";
let currentSelectedPlanId = null;

// Function to highlight active links (placeholder)
function highlightActiveLink() {
  // This function can be implemented if needed
  console.log("Highlighting active links");
}

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

// Function to get most popular prepaid plans from transactions
async function getMostPopularPlans() {
  try {
    console.log("Fetching popular plans...");
    const transactionsResponse = await fetch(TRANSACTIONS_API);

    if (!transactionsResponse.ok) {
      throw new Error(`HTTP error! status: ${transactionsResponse.status}`);
    }

    const transactions = await transactionsResponse.json();
    console.log("Transactions fetched:", transactions);

    if (!Array.isArray(transactions)) {
      console.warn("Transactions is not an array, using fallback");
      return ["1", "4", "3", "10"];
    }

    // Filter for successful prepaid transactions
    const successfulPrepaidTransactions = transactions.filter(
      (t) => t.type === "Prepaid" && t.status === "Success" && t.planId
    );

    console.log(
      "Successful prepaid transactions:",
      successfulPrepaidTransactions
    );

    const planCounts = {};
    successfulPrepaidTransactions.forEach((transaction) => {
      const planId = transaction.planId; // Note: using planId not plan_id
      if (planId) {
        planCounts[planId] = (planCounts[planId] || 0) + 1;
      }
    });

    console.log("Plan counts:", planCounts);

    // If no transactions found, return fallback popular plans
    if (Object.keys(planCounts).length === 0) {
      console.log("No transaction data found, using fallback popular plans");
      return ["1", "4", "3", "10"];
    }

    const sortedPlans = Object.entries(planCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([planId]) => planId);

    console.log("Most popular plan IDs:", sortedPlans);
    return sortedPlans;
  } catch (error) {
    console.error("Error fetching popular plans:", error);
    return ["1", "4", "3", "10"]; // Fallback popular plans
  }
}

// Function to get plan details by IDs
async function getPlanDetails(planIds) {
  console.log("Getting plan details for IDs:", planIds);

  if (allPlans.length === 0) {
    console.log("No plans loaded, fetching...");
    await fetchAllPlans();
  }

  const foundPlans = planIds
    .map((planId) => {
      const plan = allPlans.find(
        (p) => p.id === planId || p.id === parseInt(planId)
      );
      if (!plan) {
        console.warn(`Plan not found for ID: ${planId}`);
      }
      return plan;
    })
    .filter((plan) => plan);

  console.log("Found plans:", foundPlans);
  return foundPlans;
}

// Function to filter plans by category
function filterPlansByCategory(category) {
  console.log("Filtering plans by category:", category);

  if (!allPlans.length) {
    console.warn("No plans available for filtering");
    return [];
  }

  let filteredPlans = allPlans.filter((plan) => plan.type === "Prepaid");
  console.log("Prepaid plans count:", filteredPlans.length);

  switch (category) {
    case "Popular Plans":
      // This should be handled separately by getMostPopularPlans
      return [];
    case "True Unlimited 5G Plans":
      filteredPlans = filteredPlans.filter(
        (plan) => plan.category === "True Unlimited 5G Plans"
      );
      break;
    default:
      // For any other category
      filteredPlans = filteredPlans.filter(
        (plan) => plan.category === category
      );
      break;
  }

  console.log(`Filtered plans for ${category}:`, filteredPlans);
  return filteredPlans.slice(0, 4);
}

// Function to search plans
function searchPlans(searchTerm) {
  if (!allPlans.length || !searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase();
  return allPlans
    .filter(
      (plan) =>
        plan.type === "Prepaid" &&
        (plan.name?.toLowerCase().includes(term) ||
          plan.description?.toLowerCase().includes(term) ||
          plan.category?.toLowerCase().includes(term) ||
          (typeof plan.benefits === "string" &&
            plan.benefits.toLowerCase().includes(term)))
    )
    .slice(0, 4);
}

// Function to show plan modal
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
                <button id="buy-now-button" class="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all">
                  Buy Now
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

    const buyNowButton = document.getElementById("buy-now-button");
    if (buyNowButton) {
      buyNowButton.addEventListener("click", function () {
        if (currentSelectedPlanId) {
          window.location.href = `/pages/customer/payment/payment.html?planId=${currentSelectedPlanId}`;
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
    modalPlanCategory.textContent = plan.category || "Unknown Category";
  if (modalPlanPrice) modalPlanPrice.textContent = `₹${plan.price || "0"}`;
  if (modalPlanValidity) modalPlanValidity.textContent = plan.validity || "N/A";
  if (modalPlanDescription)
    modalPlanDescription.textContent =
      plan.description || "No description available";

  // Parse and display benefits
  const benefits = processPlanBenefits(plan.benefits);

  if (modalPlanBenefits) {
    if (benefits.length === 0) {
      modalPlanBenefits.innerHTML = `
        <li class="flex items-center space-x-2">
          <span class="material-icons text-green-500 text-sm">check_circle</span>
          <span>No specific benefits listed</span>
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

// Function to create plan card HTML with modal functionality
function createPlanCard(plan, index) {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-indigo-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-pink-500 to-violet-600",
  ];

  const badges = [
    { text: "POPULAR", color: "from-green-400 to-green-600" },
    { text: "", color: "" },
    { text: "", color: "" },
    { text: "BEST VALUE", color: "from-yellow-400 to-orange-500" },
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
          ${plan.name || "Unnamed Plan"}
        </h3>
        <div class="text-3xl font-bold text-primary mb-2">₹${
          plan.price || "0"
        }</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          ${plan.validity || "N/A"} Validity
        </div>
        <div class="space-y-2 text-sm text-left mb-6">
          ${
            benefitsHtml ||
            '<div class="text-center text-gray-400">No benefits listed</div>'
          }
        </div>
        <button class="choose-plan-btn w-full bg-gradient-to-r ${
          gradients[index % gradients.length]
        } text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all" data-plan-id="${
    plan.id
  }">
          Choose Plan
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

// Function to load and display plans
async function loadPlans() {
  try {
    console.log(
      `Loading plans for category: ${currentCategory}, search: ${searchTerm}`
    );

    let plansToShow = [];
    const container = document.getElementById("popular-plans-container");

    if (!container) {
      console.error("Plans container not found");
      return;
    }

    // Show loading state
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 mt-2">Loading plans...</p>
      </div>
    `;

    if (searchTerm.trim()) {
      // Search mode
      plansToShow = searchPlans(searchTerm);
      if (plansToShow.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-8">
            <p class="text-gray-500">No plans found for "${searchTerm}". Please try a different search term.</p>
          </div>
        `;
        return;
      }
    } else if (currentCategory === "Popular Plans") {
      // Popular plans mode
      const popularPlanIds = await getMostPopularPlans();
      plansToShow = await getPlanDetails(popularPlanIds);

      if (plansToShow.length === 0) {
        // Fallback: get first 4 prepaid plans if no popular plans found
        plansToShow = allPlans
          .filter((plan) => plan.type === "Prepaid")
          .slice(0, 4);
        console.log("Using fallback prepaid plans:", plansToShow);
      }
    } else {
      // Category filter mode
      plansToShow = filterPlansByCategory(currentCategory);
    }

    console.log("Plans to show:", plansToShow);

    if (plansToShow.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-gray-500">No plans available for "${currentCategory}". Please try another category.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = plansToShow
      .map((plan, index) => createPlanCard(plan, index))
      .join("");

    // Add event listeners to "Choose Plan" buttons
    const choosePlanButtons = container.querySelectorAll(".choose-plan-btn");
    choosePlanButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const planId = button.getAttribute("data-plan-id");
        console.log("Choose plan clicked for ID:", planId);
        showPlanModal(planId);
      });
    });
  } catch (error) {
    console.error("Error loading plans:", error);
    const container = document.getElementById("popular-plans-container");
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-red-500">Unable to load plans. Please try again later.</p>
          <p class="text-sm text-gray-400 mt-2">Error: ${error.message}</p>
        </div>
      `;
    }
  }
}

// Main initialization function
async function initializeApp() {
  try {
    console.log("Initializing app...");

    // Initialize components first
    await initializeComponents();

    // Load all plans first
    await fetchAllPlans();

    // Load initial popular plans
    await loadPlans();

    // Set up event listeners after DOM is ready
    setupEventListeners();

    console.log("App initialized successfully");
  } catch (error) {
    console.error("Error initializing app:", error);

    const container = document.getElementById("popular-plans-container");
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
  console.log("Setting up event listeners...");

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
          // Reset to Popular Plans when search is cleared
          currentCategory = "Popular Plans";
          updateCategoryButtons("Popular Plans");
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
