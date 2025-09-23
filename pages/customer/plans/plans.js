// Global variables
let allPlans = [];
let allTransactions = [];
let currentCategory = "Popular Plans";
let currentType = "Prepaid";
let isSearchActive = false;
let currentSelectedPlanId = null;

// Predefined categories for prepaid plans
const predefinedPrepaidCategories = [
  "Popular Plans",
  "True Unlimited 5G Plans",
  "Top Up",
  "Annual Plans",
  "3 GB/ Day",
  "2.5 GB/ Day",
  "2 GB/ Day",
  "1.5 GB/ Day",
];

// DOM elements (will be set after DOM is loaded)
let categoryList,
  plansContainer,
  sectionTitle,
  planModal,
  prepaidTab,
  postpaidTab,
  planSearch;

// API URLs
const PLANS_API_URL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";
const TRANSACTIONS_API_URL =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";

// Helper function to get URL parameters
function getURLParameters() {
  const params = new URLSearchParams(window.location.search);
  return {
    type: params.get("type") || "Prepaid",
  };
}

// Helper function to safely convert benefits to searchable string
function benefitsToString(benefits) {
  if (!benefits) return "";
  if (typeof benefits === "string") return benefits;
  if (Array.isArray(benefits)) return benefits.join(" ");
  return String(benefits);
}

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

// Load navbar and footer
function loadComponent(id, filepath) {
  return fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;

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
    .catch((error) => console.error(`Error loading ${id}:`, error));
}

// Fetch data from APIs
async function fetchData() {
  try {
    const [plansResponse, transactionsResponse] = await Promise.all([
      fetch(PLANS_API_URL),
      fetch(TRANSACTIONS_API_URL),
    ]);

    if (!plansResponse.ok || !transactionsResponse.ok) {
      throw new Error("Failed to fetch data");
    }

    allPlans = await plansResponse.json();
    allTransactions = await transactionsResponse.json();

    console.log("Fetched plans:", allPlans);
    console.log("Fetched transactions:", allTransactions);

    initializePage();
  } catch (error) {
    console.error("Error fetching data:", error);
    if (plansContainer) {
      plansContainer.innerHTML =
        '<div class="text-center text-red-500 py-8">Failed to load plans. Please try again later.</div>';
    }
    if (categoryList) {
      categoryList.innerHTML =
        '<div class="text-center text-red-500 py-4">Failed to load categories.</div>';
    }
  }
}

// Get popular plans based on transaction data
function getPopularPlans() {
  // Count transactions per plan
  const planTransactionCount = {};

  allTransactions.forEach((transaction) => {
    const planId = transaction.planId;
    if (planId) {
      planTransactionCount[planId] = (planTransactionCount[planId] || 0) + 1;
    }
  });

  // Sort plans by transaction count and get top 6
  const sortedPlans = allPlans
    .filter((plan) => plan.type === currentType) // Use currentType instead of hardcoded "Prepaid"
    .map((plan) => ({
      ...plan,
      transactionCount: planTransactionCount[plan.id] || 0,
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 6);

  console.log("Popular plans:", sortedPlans);
  return sortedPlans;
}

// Initialize page
function initializePage() {
  // Check URL parameters first
  const urlParams = getURLParameters();

  // Set currentType based on URL parameter
  if (urlParams.type) {
    currentType =
      urlParams.type.charAt(0).toUpperCase() +
      urlParams.type.slice(1).toLowerCase();
  }

  // Set appropriate default category based on type
  if (currentType === "Postpaid") {
    // For postpaid, get the first available category from the plans
    const postpaidPlans = allPlans.filter((plan) => plan.type === "Postpaid");
    if (postpaidPlans.length > 0) {
      const postpaidCategories = [
        ...new Set(postpaidPlans.map((plan) => plan.category)),
      ];
      currentCategory = postpaidCategories[0] || "Popular Plans";
    }
  } else {
    currentCategory = "Popular Plans";
  }

  // Update tab UI
  updateTabUI();

  loadCategories();
  renderPlans(currentCategory);
}

// Update tab UI based on current type
function updateTabUI() {
  if (currentType === "Postpaid") {
    if (postpaidTab) {
      postpaidTab.className =
        "px-6 sm:px-8 py-2 rounded-full bg-primary text-white text-base sm:text-lg font-semibold transition-all";
    }
    if (prepaidTab) {
      prepaidTab.className =
        "px-6 sm:px-8 py-2 rounded-full text-text-light dark:text-text-dark text-base sm:text-lg font-semibold transition-all hover:bg-gray-100 dark:hover:bg-gray-600";
    }
  } else {
    if (prepaidTab) {
      prepaidTab.className =
        "px-6 sm:px-8 py-2 rounded-full bg-primary text-white text-base sm:text-lg font-semibold transition-all";
    }
    if (postpaidTab) {
      postpaidTab.className =
        "px-6 sm:px-8 py-2 rounded-full text-text-light dark:text-text-dark text-base sm:text-lg font-semibold transition-all hover:bg-gray-100 dark:hover:bg-gray-600";
    }
  }
}

// Load categories in sidebar
function loadCategories() {
  let categories;

  if (currentType === "Prepaid") {
    categories = predefinedPrepaidCategories;
  } else {
    // For postpaid, use categories from API
    categories = [
      ...new Set(
        allPlans
          .filter((plan) => plan.type === "Postpaid")
          .map((plan) => plan.category)
      ),
    ];

    // If no postpaid categories found, add a default
    if (categories.length === 0) {
      categories = ["Popular Plans"];
    }
  }

  if (categoryList) {
    categoryList.innerHTML = categories
      .map(
        (category, index) => `
        <button
          class="category-btn block w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${
            category === currentCategory
              ? "bg-accent-light dark:bg-accent-dark text-primary dark:text-white"
              : "bg-card-light dark:bg-card-dark hover:bg-gray-100 dark:hover:bg-gray-700"
          }"
          data-category="${category}"
        >
          ${category}
        </button>
      `
      )
      .join("");

    // Add click listeners
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        currentCategory = e.target.dataset.category;
        isSearchActive = false;
        clearSearchInputs();
        updateActiveCategory(e.target);
        renderPlans(currentCategory);
      });
    });
  }
}

// Clear all search inputs
function clearSearchInputs() {
  if (planSearch) planSearch.value = "";
  const searchInput = document.getElementById("search-input");
  const mobileSearchInput = document.getElementById("mobile-search-input");
  if (searchInput) searchInput.value = "";
  if (mobileSearchInput) mobileSearchInput.value = "";
}

// Update active category in sidebar
function updateActiveCategory(activeBtn) {
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.className =
      "category-btn block w-full text-left px-4 py-3 rounded-lg font-semibold transition-all bg-card-light dark:bg-card-dark hover:bg-gray-100 dark:hover:bg-gray-700";
  });
  if (activeBtn) {
    activeBtn.className =
      "category-btn block w-full text-left px-4 py-3 rounded-lg font-semibold transition-all bg-accent-light dark:bg-accent-dark text-primary dark:text-white";
  }
}

// Render plans
function renderPlans(category) {
  if (sectionTitle) sectionTitle.textContent = category;
  let filteredPlans = [];

  if (category === "Popular Plans") {
    // Get popular plans for current type (Prepaid or Postpaid)
    filteredPlans = getPopularPlans();
  } else {
    // Filter plans by category and type
    filteredPlans = allPlans.filter(
      (plan) => plan.category === category && plan.type === currentType
    );
  }

  console.log("Filtered plans:", filteredPlans);

  if (!plansContainer) return;

  if (filteredPlans.length === 0) {
    plansContainer.innerHTML = `
      <div class="text-center py-12">
        <div class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="material-icons text-4xl text-gray-400">search_off</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">No plans found</h3>
        <p class="text-gray-600 dark:text-gray-400">No ${currentType.toLowerCase()} plans available in ${category}.</p>
      </div>
    `;
    return;
  }

  // Group plans into rows of 3
  const planRows = [];
  for (let i = 0; i < filteredPlans.length; i += 3) {
    planRows.push(filteredPlans.slice(i, i + 3));
  }

  plansContainer.innerHTML = planRows
    .map(
      (row) => `
        <section class="mb-12">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${row.map((plan) => createPlanCard(plan)).join("")}
          </div>
        </section>
      `
    )
    .join("");

  // Add click listeners to plan cards
  document.querySelectorAll(".plan-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      const planId = e.currentTarget.dataset.planId;
      showPlanModal(planId);
    });
  });
}

// Create plan card HTML
function createPlanCard(plan) {
  // Safely convert benefits to lowercase string for search attributes
  const benefitsString = benefitsToString(plan.benefits).toLowerCase();

  return `
    <div class="plan-card card-hover bg-card-light dark:bg-card-dark rounded-xl p-6 cursor-pointer border border-border-light dark:border-border-dark" 
         data-plan-id="${plan.id}"
         data-plan-name="${(plan.name || "").toLowerCase()}"
         data-plan-description="${(plan.description || "").toLowerCase()}"
         data-plan-benefits="${benefitsString}"
         data-plan-validity="${(plan.validity || "").toLowerCase()}"
         data-plan-category="${(plan.category || "").toLowerCase()}">
      <div class="flex justify-between items-start mb-4">
        <div class="w-12 h-12 bg-gradient-to-r from-primary to-purple-500 rounded-lg flex items-center justify-center">
          <span class="material-icons text-white">sim_card</span>
        </div>
        <span class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold px-2 py-1 rounded-full">
          ${plan.validity || "N/A"}
        </span>
      </div>
      <h3 class="font-bold text-lg mb-2">${plan.name || "Unnamed Plan"}</h3>
      <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">${
        plan.description || "No description available"
      }</p>
      <div class="flex justify-between items-center">
        <div>
          <span class="text-2xl font-bold text-primary">₹${
            plan.price || "0"
          }</span>
          <span class="text-gray-500 text-sm ml-1">/${
            plan.validity || ""
          }</span>
        </div>
        <button class="bg-primary hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          View Details
        </button>
      </div>
    </div>
  `;
}

// Show plan modal
function showPlanModal(planId) {
  const plan = allPlans.find((p) => p.id === planId);
  if (!plan || !planModal) return;

  currentSelectedPlanId = planId;

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

  // Parse and display benefits - handle both string and array formats
  let benefits = [];
  if (plan.benefits) {
    if (typeof plan.benefits === "string") {
      benefits = plan.benefits
        .split(/[,\n]/)
        .map((b) => b.trim())
        .filter((b) => b);
    } else if (Array.isArray(plan.benefits)) {
      benefits = plan.benefits.filter((b) => b && b.trim());
    }
  }

  if (benefits.length === 0) {
    benefits = ["No specific benefits listed"];
  }

  if (modalPlanBenefits) {
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

  planModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

// Close modal
function closeModal() {
  if (planModal) {
    planModal.classList.add("hidden");
    document.body.style.overflow = "";
    currentSelectedPlanId = null;
  }
}

// Search functionality
function searchPlans(query) {
  if (query.trim() === "") {
    isSearchActive = false;
    renderPlans(currentCategory);
    return;
  }

  isSearchActive = true;
  if (sectionTitle) sectionTitle.textContent = `Search Results for "${query}"`;

  const searchTerm = query.toLowerCase();
  const matchingPlans = [];

  // Get all plans of current type
  const currentTypePlans = allPlans.filter((plan) => plan.type === currentType);

  // Search through plans
  currentTypePlans.forEach((plan) => {
    const planName = (plan.name || "").toLowerCase();
    const planDescription = (plan.description || "").toLowerCase();
    const planBenefits = benefitsToString(plan.benefits).toLowerCase();
    const planValidity = (plan.validity || "").toLowerCase();
    const planCategory = (plan.category || "").toLowerCase();

    if (
      planName.includes(searchTerm) ||
      planDescription.includes(searchTerm) ||
      planBenefits.includes(searchTerm) ||
      planValidity.includes(searchTerm) ||
      planCategory.includes(searchTerm)
    ) {
      matchingPlans.push(plan);
    }
  });

  console.log("Search results:", matchingPlans);

  if (!plansContainer) return;

  if (matchingPlans.length === 0) {
    plansContainer.innerHTML = `
      <div class="text-center py-12">
        <div class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="material-icons text-4xl text-gray-400">search_off</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">No results found</h3>
        <p class="text-gray-600 dark:text-gray-400">Try adjusting your search terms.</p>
      </div>
    `;
    return;
  }

  // Group matching plans into rows of 3
  const planRows = [];
  for (let i = 0; i < matchingPlans.length; i += 3) {
    planRows.push(matchingPlans.slice(i, i + 3));
  }

  plansContainer.innerHTML = planRows
    .map(
      (row) => `
        <section class="mb-12">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${row.map((plan) => createPlanCard(plan)).join("")}
          </div>
        </section>
      `
    )
    .join("");

  // Add click listeners to plan cards
  document.querySelectorAll(".plan-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      const planId = e.currentTarget.dataset.planId;
      showPlanModal(planId);
    });
  });
}

// Search functionality with debounce
let searchTimeout;

function setupSearchListener(element) {
  if (element) {
    element.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchPlans(e.target.value);

        // Sync search across all inputs
        const searchValue = e.target.value;
        if (planSearch && planSearch !== e.target)
          planSearch.value = searchValue;
        const searchInput = document.getElementById("search-input");
        const mobileSearchInput = document.getElementById(
          "mobile-search-input"
        );
        if (searchInput && searchInput !== e.target)
          searchInput.value = searchValue;
        if (mobileSearchInput && mobileSearchInput !== e.target)
          mobileSearchInput.value = searchValue;
      }, 300);
    });
  }
}

// Initialize DOM elements and event listeners
function initializeDOMElements() {
  // Get DOM elements
  categoryList = document.getElementById("category-list");
  plansContainer = document.getElementById("plans-container");
  sectionTitle = document.getElementById("section-title");
  planModal = document.getElementById("plan-modal");
  prepaidTab = document.getElementById("prepaid-tab");
  postpaidTab = document.getElementById("postpaid-tab");
  planSearch = document.getElementById("plan-search");

  // Setup event listeners
  if (planModal) {
    const closeModalBtn = document.getElementById("close-modal");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", closeModal);
    }

    planModal.addEventListener("click", (e) => {
      if (e.target === planModal) closeModal();
    });
  }

  // Buy Now button click handler
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

  // Tab switching
  if (prepaidTab) {
    prepaidTab.addEventListener("click", () => {
      currentType = "Prepaid";
      currentCategory = "Popular Plans";
      isSearchActive = false;
      clearSearchInputs();

      updateTabUI();
      loadCategories();
      renderPlans(currentCategory);
    });
  }

  if (postpaidTab) {
    postpaidTab.addEventListener("click", () => {
      currentType = "Postpaid";
      // Set default category for postpaid
      const postpaidPlans = allPlans.filter((plan) => plan.type === "Postpaid");
      if (postpaidPlans.length > 0) {
        const postpaidCategories = [
          ...new Set(postpaidPlans.map((plan) => plan.category)),
        ];
        currentCategory = postpaidCategories[0] || "Popular Plans";
      } else {
        currentCategory = "Popular Plans";
      }
      isSearchActive = false;
      clearSearchInputs();

      updateTabUI();
      loadCategories();
      renderPlans(currentCategory);
    });
  }

  // Setup search listeners for all search inputs
  setupSearchListener(planSearch);
  setupSearchListener(document.getElementById("search-input"));
  setupSearchListener(document.getElementById("mobile-search-input"));
}

// Main initialization function
async function initializeApp() {
  try {
    // Load components first
    await Promise.all([
      loadComponent("navbar", "/components/navbar.html"),
      loadComponent("footer", "/components/footer.html"),
    ]);

    // Initialize DOM elements
    initializeDOMElements();

    // Fetch data and initialize page
    await fetchData();

    console.log("App initialized successfully");
  } catch (error) {
    console.error("Error initializing app:", error);
  }
}

// Wait for DOM to be ready, then initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
