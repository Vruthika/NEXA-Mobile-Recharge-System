function loadComponent(id, filepath) {
  fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      // highlightActiveLink();
      // Initialize mobile menu after navbar is loaded
      if (id === "navbar") {
        initializeMobileMenu();
      }
    })
    .catch((error) => console.error("Error loading component:", error));
}

// Initialize mobile menu functionality
function initializeMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const hamburgerLines = document.querySelectorAll(
    ".hamburger-line-1, .hamburger-line-2, .hamburger-line-3"
  );
  let isMenuOpen = false;

  if (!mobileMenuBtn || !mobileMenu) return; // Exit if elements don't exist

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

  // Toggle menu on button click
  mobileMenuBtn.addEventListener("click", toggleMenu);

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
      !mobileMenuBtn.contains(event.target)
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
}

loadComponent("navbar", "/components/navbar.html");
loadComponent("footer", "/components/footer.html");

const TRANSACTIONS_API =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const PLANS_API = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";

// Global variables - Changed default to Most Trending Plans
let allPlans = [];
let currentCategory = "Most Trending Plans";
let searchTerm = "";

// Function to safely handle benefits data
function formatBenefits(benefits) {
  if (!benefits) return [];

  if (typeof benefits === "string") {
    return benefits.split("\n").filter((b) => b.trim());
  } else if (Array.isArray(benefits)) {
    return benefits.filter((b) => b && b.trim && b.trim());
  } else if (typeof benefits === "object") {
    // If benefits is an object, convert to array of strings
    return Object.values(benefits)
      .filter((b) => b && typeof b === "string")
      .map((b) => b.trim());
  }

  // Fallback for other data types
  return [benefits.toString()];
}

// Function to fetch all plans
async function fetchAllPlans() {
  try {
    const response = await fetch(PLANS_API);
    allPlans = await response.json();
    console.log("Fetched plans:", allPlans); // Debug log
    return allPlans;
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
}

// Function to get most popular postpaid plans from transactions by category
async function getMostPopularPlansByCategory(category) {
  try {
    const transactionsResponse = await fetch(TRANSACTIONS_API);
    const transactions = await transactionsResponse.json();

    // Filter successful postpaid transactions
    const successfulPostpaidTransactions = transactions.filter(
      (t) => t.type === "Postpaid" && t.status === "Success"
    );

    if (category === "Most Trending Plans") {
      // For trending plans, get all postpaid plans and sort by popularity
      const planCounts = {};
      successfulPostpaidTransactions.forEach((transaction) => {
        const planId = transaction.planId;
        if (planId) {
          planCounts[planId] = (planCounts[planId] || 0) + 1;
        }
      });

      // Sort by popularity and take top 4
      const sortedPlans = Object.entries(planCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([planId]) => planId);

      // If no transaction data, return first 4 postpaid plans
      if (sortedPlans.length === 0) {
        const postpaidPlans = allPlans.filter(
          (plan) => plan.type === "Postpaid"
        );
        return postpaidPlans.slice(0, 4).map((plan) => plan.id);
      }

      return sortedPlans;
    }

    // Get plans by category first
    const categoryPlans = allPlans.filter(
      (plan) => plan.type === "Postpaid" && plan.category === category
    );

    const categoryPlanIds = categoryPlans.map((plan) => plan.id);

    // Count transactions for plans in this category
    const planCounts = {};
    successfulPostpaidTransactions.forEach((transaction) => {
      const planId = transaction.planId;
      if (categoryPlanIds.includes(planId)) {
        planCounts[planId] = (planCounts[planId] || 0) + 1;
      }
    });

    // Sort by popularity and take top 4
    const sortedPlans = Object.entries(planCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([planId]) => planId);

    // If no transaction data, return first 4 plans from category
    if (sortedPlans.length === 0) {
      return categoryPlans.slice(0, 4).map((plan) => plan.id);
    }

    return sortedPlans;
  } catch (error) {
    console.error("Error fetching popular plans:", error);
    // Fallback to first few plans of the category
    const categoryPlans = allPlans.filter(
      (plan) => plan.type === "Postpaid" && plan.category === category
    );
    return categoryPlans.slice(0, 4).map((plan) => plan.id);
  }
}

// Function to get plan details by IDs
async function getPlanDetails(planIds) {
  if (allPlans.length === 0) {
    await fetchAllPlans();
  }

  return planIds
    .map((planId) => allPlans.find((plan) => plan.id === planId))
    .filter((plan) => plan);
}

// Function to search plans
function searchPlans(searchTerm) {
  if (!allPlans.length || !searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase();
  return allPlans
    .filter(
      (plan) =>
        plan.type === "Postpaid" &&
        (plan.name.toLowerCase().includes(term) ||
          (plan.description && plan.description.toLowerCase().includes(term)) ||
          (plan.category && plan.category.toLowerCase().includes(term)) ||
          (plan.benefits &&
            JSON.stringify(plan.benefits).toLowerCase().includes(term)))
    )
    .slice(0, 4);
}

// Function to show plan modal
function showPlanModal(plan) {
  const benefitsArray = formatBenefits(plan.benefits);
  const benefitsHtml = benefitsArray
    .map(
      (benefit) => `
    <div class="flex items-center mb-2">
      <span class="material-icons text-green-500 text-sm mr-2">check_circle</span>
      <span class="text-sm text-gray-600 dark:text-gray-300">${benefit.trim()}</span>
    </div>
  `
    )
    .join("");

  const modalHtml = `
    <div id="plan-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onclick="closePlanModal(event)">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100" onclick="event.stopPropagation()">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">${
              plan.name
            }</h2>
            <div class="flex items-center">
              <span class="text-3xl font-bold text-blue-600">₹${
                plan.price
              }</span>
              <span class="text-sm text-gray-500 ml-2">for ${
                plan.validity || "N/A"
              }</span>
            </div>
          </div>
          <button onclick="closePlanModal()" class="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-600 dark:text-gray-300 mb-4">${
            plan.description || "No description available"
          }</p>
          <h3 class="font-semibold text-gray-800 dark:text-white mb-3">Benefits included:</h3>
          ${benefitsHtml || '<p class="text-gray-500">No benefits listed</p>'}
        </div>
        
        <button onclick="activatePlan('${plan.id}', '${
    plan.name
  }')" class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center text-lg">
          <span class="material-icons mr-2">check_circle</span>
          Activate Plan Now
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  document.body.style.overflow = "hidden";
}

// Function to close plan modal
function closePlanModal(event) {
  if (event && event.target === event.currentTarget) {
    const modal = document.getElementById("plan-modal");
    if (modal) {
      modal.remove();
      document.body.style.overflow = "auto";
    }
  } else if (!event) {
    // Called directly
    const modal = document.getElementById("plan-modal");
    if (modal) {
      modal.remove();
      document.body.style.overflow = "auto";
    }
  }
}

// Function to show activation success
function showActivationSuccess(planName) {
  const successHtml = `
    <div id="activation-success" class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-95 backdrop-blur-lg">
      <div class="text-center">
        <div class="checkmark-circle mb-6">
          <div class="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <span class="material-icons text-white text-6xl">check</span>
          </div>
        </div>
        <h2 class="text-4xl font-bold mb-4 text-gray-800">Plan Activated Successfully!</h2>
        <p class="text-gray-600 text-lg mb-2">${planName} has been activated</p>
        <p class="text-gray-500 mb-8">You can now enjoy all the benefits of your new plan</p>
        <button onclick="closeActivationSuccess()" class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105">
          Continue to Dashboard
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", successHtml);
  document.body.style.overflow = "hidden";
}

// Function to close activation success
function closeActivationSuccess() {
  const success = document.getElementById("activation-success");
  if (success) {
    success.remove();
    document.body.style.overflow = "auto";
    window.location.href = "/pages/customer/dashboard/dashboard.html";
  }
}

// Function to activate plan
async function activatePlan(planId, planName) {
  // Close the plan modal first
  closePlanModal();

  // Show loading for a moment
  setTimeout(() => {
    showActivationSuccess(planName);
  }, 500);
}

// Function to create plan card HTML
function createPlanCard(plan, index) {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-indigo-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-green-500 to-blue-600",
  ];

  const badges = [
    { text: "MOST POPULAR", color: "from-green-400 to-green-600" },
    { text: "PREMIUM", color: "from-purple-400 to-purple-600" },
    { text: "FAMILY CHOICE", color: "from-blue-400 to-blue-600" },
    { text: "BEST VALUE", color: "from-yellow-400 to-orange-500" },
  ];

  const benefitsArray = formatBenefits(plan.benefits);
  const benefitsHtml = benefitsArray
    .slice(0, 3)
    .map(
      (benefit) => `
          <div class="flex items-center">
            <span class="material-icons text-green-500 text-sm mr-2">check_circle</span>
            ${benefit.trim()}
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
                  '<p class="text-gray-500 text-center">No benefits listed</p>'
                }
              </div>
              <button onclick="showPlanModal(${JSON.stringify(plan).replace(
                /"/g,
                "&quot;"
              )})" class="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
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
    let plansToShow = [];
    const container = document.getElementById("postpaid-plans-container");

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
    } else if (currentCategory) {
      // Category mode - get most popular plans in category
      const popularPlanIds = await getMostPopularPlansByCategory(
        currentCategory
      );
      plansToShow = await getPlanDetails(popularPlanIds);
    }

    console.log("Plans to show:", plansToShow); // Debug log

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
  } catch (error) {
    console.error("Error loading plans:", error);
    document.getElementById("postpaid-plans-container").innerHTML = `
            <div class="col-span-full text-center py-8">
              <p class="text-red-500">Unable to load plans. Please try again later.</p>
              <p class="text-gray-500 text-sm mt-2">Error: ${error.message}</p>
            </div>
          `;
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", async function () {
  // Load all plans first
  await fetchAllPlans();

  // Set "Most Trending Plans" as default active button
  updateCategoryButtons("Most Trending Plans");

  // Load initial plans for default category
  await loadPlans();

  // Category button event listeners
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const category = this.getAttribute("data-category");
      currentCategory = category;
      searchTerm = ""; // Clear search when category is selected
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";

      updateCategoryButtons(category);
      await loadPlans();
    });
  });

  // Search functionality
  const searchInput = document.getElementById("search-input");
  let searchTimeout;

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        searchTerm = this.value;
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
  }

  // Fix View all plans button to redirect to postpaid section
  const viewAllPlansBtn = document.querySelector(
    'button[onclick*="plans.html"]'
  );
  if (viewAllPlansBtn) {
    viewAllPlansBtn.onclick = function () {
      window.location.href = "/pages/customer/plans/plans.html?type=postpaid";
    };
  }
});
