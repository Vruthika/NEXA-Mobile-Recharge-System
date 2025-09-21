const TRANSACTIONS_API =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const PLANS_API = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";

// Global variables
let allPlans = [];
let currentCategory = "Individual Plans";
let searchTerm = "";

// Function to fetch all plans
async function fetchAllPlans() {
  try {
    const response = await fetch(PLANS_API);
    allPlans = await response.json();
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

    // Get plans by category first
    const categoryPlans = allPlans.filter(
      (plan) => plan.type === "Postpaid" && plan.category === category
    );

    const categoryPlanIds = categoryPlans.map((plan) => plan.id);

    // Count transactions for plans in this category
    const planCounts = {};
    successfulPostpaidTransactions.forEach((transaction) => {
      const planId = transaction.plan_id;
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

// Function to filter plans by category
function filterPlansByCategory(category) {
  if (!allPlans.length) return [];

  let filteredPlans = allPlans.filter((plan) => plan.type === "Postpaid");

  switch (category) {
    case "Individual Plans":
      filteredPlans = filteredPlans.filter(
        (plan) => plan.category === "Individual Plans"
      );
      break;
    case "Family Pack":
      filteredPlans = filteredPlans.filter(
        (plan) => plan.category === "Family Pack"
      );
      break;
    case "JioHotstar Plans":
      filteredPlans = filteredPlans.filter(
        (plan) => plan.category === "JioHotstar Plans"
      );
      break;
    case "Netflix Plans":
      filteredPlans = filteredPlans.filter(
        (plan) => plan.category === "Netflix Plans"
      );
      break;
  }

  return filteredPlans.slice(0, 4);
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
          plan.description.toLowerCase().includes(term) ||
          plan.category.toLowerCase().includes(term) ||
          plan.benefits.toLowerCase().includes(term))
    )
    .slice(0, 4);
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

  const benefitsArray = plan.benefits.split("\n").filter((b) => b.trim());
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
                ${plan.name}
              </h3>
              <div class="text-3xl font-bold text-primary mb-2">₹${
                plan.price
              }</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                ${plan.validity} Validity
              </div>
              <div class="space-y-2 text-sm text-left mb-6">
                ${benefitsHtml}
              </div>
              <button class="w-full bg-gradient-to-r ${
                gradients[index % gradients.length]
              } text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
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
        "category-btn px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all";
    } else {
      btn.className =
        "category-btn px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors";
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
            </div>
          `;
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", async function () {
  // Load all plans first
  await fetchAllPlans();

  // Load initial plans for default category
  await loadPlans();

  // Category button event listeners
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const category = this.getAttribute("data-category");
      currentCategory = category;
      searchTerm = ""; // Clear search when category is selected
      document.getElementById("search-input").value = "";

      updateCategoryButtons(category);
      await loadPlans();
    });
  });

  // Search functionality
  const searchInput = document.getElementById("search-input");
  let searchTimeout;

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      searchTerm = this.value;
      if (searchTerm.trim()) {
        // Clear category selection when searching
        updateCategoryButtons("");
        currentCategory = "";
      } else {
        // Reset to Individual Plans when search is cleared
        currentCategory = "Individual Plans";
        updateCategoryButtons("Individual Plans");
      }
      await loadPlans();
    }, 300); // Debounce search
  });
});
