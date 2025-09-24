function loadComponent(id, filepath) {
  fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
    })
    .catch((error) => console.error("Error loading navbar:", error));
}

// Initialize components
loadComponent("navbar", "/components/navbar.html");
loadComponent("footer", "/components/footer.html");
// Global variables
let currentUser = null;
let transactions = [];
let plans = [];
let customers = [];
let currentSelectedTransaction = null;

// API URLs
const API_URLS = {
  transactions: "https://68ca32f2430c4476c3488311.mockapi.io/Transactions",
  plans: "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans",
  customers: "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers",
};

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  const closeModalBtn = document.getElementById("close-modal");
  const filterSelect = document.getElementById("filter-select");
  const modal = document.getElementById("plan-modal");

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  if (filterSelect) filterSelect.addEventListener("change", filterTransactions);

  // Setup search functionality for navbar
  setupSearchFunctionality();

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.classList.contains("modal-overlay")) {
        closeModal();
      }
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
}

// Setup search functionality for navbar
function setupSearchFunctionality() {
  // Wait for navbar to load, then setup search
  setTimeout(() => {
    // Find search input using multiple possible selectors
    const searchInputs = document.querySelectorAll(
      [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="Search" i]',
        ".search-input",
        "#search-input",
        "#search",
        '.navbar input[type="text"]',
        'input[name="search"]',
      ].join(",")
    );

    // Find search buttons using multiple possible selectors
    const searchButtons = document.querySelectorAll(
      [
        'button[type="submit"]',
        ".search-button",
        ".search-btn",
        'button[aria-label*="search" i]',
        'button[title*="search" i]',
        ".navbar button",
        'button .material-icons:contains("search")',
        "button:has(.material-icons)",
      ].join(",")
    );

    console.log("Found search inputs:", searchInputs);
    console.log("Found search buttons:", searchButtons);

    // Setup search input listeners
    searchInputs.forEach((input) => {
      // Real-time search on input
      input.addEventListener("input", (e) => {
        performSearch(e.target.value);
      });

      // Search on Enter key
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          performSearch(e.target.value);
        }
      });
    });

    // Setup search button listeners
    searchButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();

        // Find associated input field
        const form = button.closest("form");
        let searchValue = "";

        if (form) {
          const input = form.querySelector(
            'input[type="search"], input[type="text"]'
          );
          searchValue = input ? input.value : "";
        } else {
          // Look for nearby input field
          const nearbyInput =
            button.parentElement.querySelector("input") ||
            document.querySelector('input[type="search"], .search-input');
          searchValue = nearbyInput ? nearbyInput.value : "";
        }

        performSearch(searchValue);
      });
    });

    // Also check for Material Icons search buttons specifically
    const materialSearchButtons = document.querySelectorAll("button");
    materialSearchButtons.forEach((button) => {
      const icon = button.querySelector(".material-icons");
      if (
        icon &&
        (icon.textContent.includes("search") ||
          icon.textContent.includes("Search"))
      ) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const form = button.closest("form");
          let searchValue = "";

          if (form) {
            const input = form.querySelector("input");
            searchValue = input ? input.value : "";
          } else {
            const nearbyInput = document.querySelector(
              'input[type="search"], input[type="text"]'
            );
            searchValue = nearbyInput ? nearbyInput.value : "";
          }

          performSearch(searchValue);
        });
      }
    });
  }, 1000); // Wait 1 second for navbar to load
}

// Perform search functionality
function performSearch(searchTerm) {
  if (!currentUser) {
    showToast("Please wait for data to load", "info");
    return;
  }

  console.log("Performing search for:", searchTerm);

  // Clear search if empty
  if (!searchTerm || searchTerm.trim() === "") {
    renderTransactions();
    showToast("Search cleared", "info");
    return;
  }

  const searchTermLower = searchTerm.toLowerCase().trim();

  // Filter user transactions based on search term
  let userTransactions = transactions.filter(
    (t) =>
      String(t.customerId) === String(currentUser.id) ||
      String(t.userId) === String(currentUser.id)
  );

  const filteredTransactions = userTransactions.filter((transaction) => {
    // Get associated plan
    const plan = plans.find((p) => String(p.id) === String(transaction.planId));

    // Search in multiple fields
    const searchableFields = [
      transaction.id,
      transaction.amount,
      transaction.status,
      transaction.paymentMode,
      transaction.referenceNumber,
      transaction.transactionId,
      plan?.name,
      plan?.category,
      plan?.type,
      plan?.description,
      plan?.validity,
      new Date(transaction.date || transaction.createdAt).toLocaleDateString(
        "en-IN"
      ),
    ].filter((field) => field); // Remove undefined/null values

    // Check if search term matches any field
    return searchableFields.some((field) =>
      String(field).toLowerCase().includes(searchTermLower)
    );
  });

  console.log("Filtered transactions:", filteredTransactions);

  // Render filtered results
  renderTransactions(filteredTransactions);

  // Show toast with results count
  if (filteredTransactions.length === 0) {
    showToast(`No transactions found for "${searchTerm}"`, "info");
  } else {
    showToast(
      `Found ${filteredTransactions.length} transaction(s) for "${searchTerm}"`,
      "success"
    );
  }
}

// Initialize application
async function initializeApp() {
  try {
    showToast("Loading data...", "info");

    await Promise.all([loadCustomers(), loadPlans(), loadTransactions()]);

    // Simulate logged-in user (first customer)
    if (customers.length > 0) {
      currentUser = customers[0];
      renderUserProfile();
    }

    renderTransactions();
    showToast("Data loaded successfully!", "success");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    showToast("Failed to load data. Please try again.", "error");
  }
}

// API call functions
async function loadCustomers() {
  try {
    const response = await fetch(API_URLS.customers);
    customers = await response.json();
    console.log("Loaded customers:", customers);
  } catch (error) {
    console.error("Failed to load customers:", error);
    customers = [];
  }
}

async function loadPlans() {
  try {
    const response = await fetch(API_URLS.plans);
    plans = await response.json();
    console.log("Loaded plans:", plans);
  } catch (error) {
    console.error("Failed to load plans:", error);
    plans = [];
  }
}

async function loadTransactions() {
  try {
    const response = await fetch(API_URLS.transactions);
    transactions = await response.json();
    console.log("Loaded transactions:", transactions);

    // Sort transactions by date (newest first)
    transactions.sort(
      (a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
  } catch (error) {
    console.error("Failed to load transactions:", error);
    transactions = [];
  }
}

// Helper function to check if a plan is still valid
function isPlanValid(transaction, plan) {
  if (!transaction || !plan) return false;

  // Get the recharge date
  const rechargeDate = new Date(transaction.date || transaction.createdAt);
  const currentDate = new Date();

  // Calculate days passed since recharge
  const daysPassed = Math.floor(
    (currentDate - rechargeDate) / (1000 * 60 * 60 * 24)
  );

  // Extract validity days from plan
  let validityDays = 0;
  if (plan.validity) {
    const validityStr = plan.validity.toString().toLowerCase();

    // Parse different validity formats
    if (validityStr.includes("day")) {
      const match = validityStr.match(/(\d+)\s*day/);
      validityDays = match ? parseInt(match[1]) : 0;
    } else if (validityStr.includes("month")) {
      const match = validityStr.match(/(\d+)\s*month/);
      validityDays = match ? parseInt(match[1]) * 30 : 0;
    } else if (validityStr.includes("year")) {
      const match = validityStr.match(/(\d+)\s*year/);
      validityDays = match ? parseInt(match[1]) * 365 : 0;
    } else {
      // Try to parse as just a number (assuming days)
      const numberMatch = validityStr.match(/(\d+)/);
      validityDays = numberMatch ? parseInt(numberMatch[1]) : 0;
    }
  }

  console.log(
    `Plan validity check - Days passed: ${daysPassed}, Validity days: ${validityDays}`
  );

  return daysPassed <= validityDays;
}

// Helper function to get remaining days for a plan
function getRemainingDays(transaction, plan) {
  if (!transaction || !plan) return 0;

  const rechargeDate = new Date(transaction.date || transaction.createdAt);
  const currentDate = new Date();
  const daysPassed = Math.floor(
    (currentDate - rechargeDate) / (1000 * 60 * 60 * 24)
  );

  let validityDays = 0;
  if (plan.validity) {
    const validityStr = plan.validity.toString().toLowerCase();

    if (validityStr.includes("day")) {
      const match = validityStr.match(/(\d+)\s*day/);
      validityDays = match ? parseInt(match[1]) : 0;
    } else if (validityStr.includes("month")) {
      const match = validityStr.match(/(\d+)\s*month/);
      validityDays = match ? parseInt(match[1]) * 30 : 0;
    } else if (validityStr.includes("year")) {
      const match = validityStr.match(/(\d+)\s*year/);
      validityDays = match ? parseInt(match[1]) * 365 : 0;
    } else {
      const numberMatch = validityStr.match(/(\d+)/);
      validityDays = numberMatch ? parseInt(numberMatch[1]) : 0;
    }
  }

  return Math.max(0, validityDays - daysPassed);
}

// Render user profile
function renderUserProfile() {
  const userProfile = document.getElementById("user-profile");
  if (!userProfile || !currentUser) return;

  // Get the most recent successful transaction for this user
  const recentTransaction = transactions
    .filter(
      (t) =>
        (String(t.customerId) === String(currentUser.id) ||
          String(t.userId) === String(currentUser.id)) &&
        (t.status || "success").toLowerCase() === "success"
    )
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    )[0];

  const recentPlan = recentTransaction
    ? plans.find((p) => String(p.id) === String(recentTransaction.planId))
    : null;

  // Check if the plan is still valid
  const isActivePlan =
    recentTransaction &&
    recentPlan &&
    isPlanValid(recentTransaction, recentPlan);
  const remainingDays = isActivePlan
    ? getRemainingDays(recentTransaction, recentPlan)
    : 0;

  userProfile.innerHTML = `
          <div class="relative">
            <div class="w-24 h-24 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-white text-4xl">person</span>
            </div>
            <div class="absolute -top-1 -right-1 w-6 h-6 ${
              isActivePlan ? "bg-green-500" : "bg-gray-400"
            } rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          
          <h3 class="text-xl font-bold text-text-light mb-2">
            ${currentUser.name || "Unknown User"}
          </h3>
          
          <p class="text-subtext-light mb-6">
            ${currentUser.phone || currentUser.phoneNumber || "No phone number"}
          </p>

          ${
            isActivePlan
              ? `
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-text-light">Active Plan</h4>
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ${remainingDays} days left
                </span>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-subtext-light">
                  <span class="font-medium">Plan:</span> ${
                    recentPlan.name || "Unknown"
                  }
                </p>
                <p class="text-sm text-subtext-light">
                  <span class="font-medium">Type:</span> ${
                    recentPlan.category || recentPlan.type || "Unknown"
                  }
                </p>
                <p class="text-sm text-subtext-light">
                  <span class="font-medium">Validity:</span> ${
                    recentPlan.validity || "Unknown"
                  }
                </p>
                <p class="text-sm text-subtext-light">
                  <span class="font-medium">Recharged:</span> ${new Date(
                    recentTransaction.date || recentTransaction.createdAt
                  ).toLocaleDateString("en-IN")}
                </p>
                <p class="text-lg font-bold text-green-600 mt-2">
                  ₹${recentPlan.price || recentTransaction.amount || "0"}
                </p>
              </div>
            </div>
          `
              : recentTransaction && recentPlan
              ? `
            <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
              <div class="flex items-center mb-2">
                <span class="material-icons text-red-500 mr-2">error_outline</span>
                <h4 class="font-semibold text-red-700">Plan Expired</h4>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-subtext-light">
                  <span class="font-medium">Last Plan:</span> ${
                    recentPlan.name || "Unknown"
                  }
                </p>
                <p class="text-sm text-subtext-light">
                  <span class="font-medium">Expired:</span> ${(() => {
                    const rechargeDate = new Date(
                      recentTransaction.date || recentTransaction.createdAt
                    );
                    const validityDays =
                      parseInt(recentPlan.validity?.match(/(\d+)/)?.[1]) || 30;
                    const expiryDate = new Date(
                      rechargeDate.getTime() +
                        validityDays * 24 * 60 * 60 * 1000
                    );
                    return expiryDate.toLocaleDateString("en-IN");
                  })()}
                </p>
                <p class="text-sm font-medium text-red-600 mt-2">
                  Plan has expired. Please recharge to continue services.
                </p>
              </div>
            </div>
          `
              : `
            <div class="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
              <span class="material-icons text-gray-400 text-3xl mb-2">sim_card_download</span>
              <h4 class="font-medium text-gray-600 mb-1">No Active Plan</h4>
              <p class="text-sm text-subtext-light">No recent recharge found. Please recharge to activate a plan.</p>
            </div>
          `
          }
        `;
}

// Render transactions
function renderTransactions(filteredTransactions = null) {
  const transactionList = document.getElementById("transaction-list");
  if (!transactionList || !currentUser) return;

  // Filter transactions for current user only
  let userTransactions = transactions.filter(
    (t) =>
      String(t.customerId) === String(currentUser.id) ||
      String(t.userId) === String(currentUser.id)
  );

  // Apply additional filter if provided
  if (filteredTransactions) {
    userTransactions = filteredTransactions.filter(
      (t) =>
        String(t.customerId) === String(currentUser.id) ||
        String(t.userId) === String(currentUser.id)
    );
  }

  if (userTransactions.length === 0) {
    transactionList.innerHTML = `
            <div class="bg-card-light p-12 rounded-2xl shadow-lg text-center">
              <span class="material-icons text-gray-400 text-6xl mb-4">receipt_long</span>
              <h3 class="text-xl font-semibold text-text-light mb-2">No transactions found</h3>
              <p class="text-subtext-light">Your recharge history will appear here once you make a transaction.</p>
            </div>
          `;
    return;
  }

  transactionList.innerHTML = userTransactions
    .map((transaction) => {
      const plan = plans.find(
        (p) => String(p.id) === String(transaction.planId)
      );
      const customer = customers.find(
        (c) =>
          String(c.id) === String(transaction.customerId) ||
          String(c.id) === String(transaction.userId)
      );

      const status = transaction.status || "success";
      const statusClass = `status-${status.toLowerCase()}`;

      const transactionDate = new Date(
        transaction.date || transaction.createdAt || Date.now()
      );
      const formattedDate = transactionDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const formattedTime = transactionDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
            <div class="bg-card-light p-6 rounded-2xl shadow-lg card-hover border border-border-light animate-slide-up">
              <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <div class="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                      <span class="material-icons text-white">sim_card</span>
                    </div>
                    <div>
                      <h3 class="font-semibold text-text-light">
                        ${plan?.name || "Unknown Plan"}
                      </h3>
                      <p class="text-sm text-subtext-light">
                        ${formattedDate} at ${formattedTime}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-primary mb-1">
                    ₹${transaction.amount || plan?.price || "0"}
                  </div>
                  <span class="status-badge ${statusClass}">
                    ${status}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span class="font-medium text-subtext-light">Payment Mode:</span>
                  <p class="text-text-light">${
                    transaction.paymentMode || "Online"
                  }</p>
                </div>
                <div>
                  <span class="font-medium text-subtext-light">Reference:</span>
                  <p class="text-text-light font-mono text-xs">
                    ${
                      transaction.referenceNumber ||
                      transaction.transactionId ||
                      "TXN" + Math.random().toString(36).substr(2, 9)
                    }
                  </p>
                </div>
              </div>

              <div class="flex justify-end space-x-3">
                <button
                  onclick="showTransactionModal('${
                    transaction.id
                  }', ${JSON.stringify(transaction).replace(/"/g, "&quot;")})"
                  class="px-4 py-2 text-sm font-medium rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center space-x-1"
                >
                  <span class="material-icons text-sm">visibility</span>
                  <span>View Details</span>
                </button>
                <button
                  onclick="downloadInvoice('${
                    transaction.id
                  }', ${JSON.stringify(transaction).replace(/"/g, "&quot;")})"
                  class="px-4 py-2 text-sm font-medium rounded-xl bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-all flex items-center space-x-1"
                >
                  <span class="material-icons text-sm">download</span>
                  <span>Download Invoice</span>
                </button>
              </div>
            </div>
          `;
    })
    .join("");
}

// Show transaction modal
function showTransactionModal(transactionId, transactionData = null) {
  console.log("Looking for transaction with ID:", transactionId);
  console.log("Transaction data passed:", transactionData);

  let transaction;
  if (transactionData) {
    // Use the passed transaction data directly
    transaction =
      typeof transactionData === "string"
        ? JSON.parse(transactionData.replace(/&quot;/g, '"'))
        : transactionData;
  } else {
    // Fallback to finding in transactions array
    transaction = transactions.find(
      (t) => String(t.id) === String(transactionId)
    );
  }

  console.log("Using transaction:", transaction);

  if (!transaction) {
    console.error("Transaction not found for ID:", transactionId);
    showToast("Transaction not found", "error");
    return;
  }

  const plan = plans.find((p) => String(p.id) === String(transaction.planId));
  console.log("Found plan:", plan);

  // If plan is not found, create a default plan object
  const defaultPlan = {
    id: transaction.planId || "unknown",
    name: "Unknown Plan",
    category: "General",
    price: transaction.amount || "0",
    validity: "N/A",
    description: "Plan details not available",
    benefits: ["Standard benefits apply"],
  };

  const planToUse = plan || defaultPlan;

  currentSelectedTransaction = transaction;
  const modal = document.getElementById("plan-modal");

  // Update modal content
  document.getElementById("modal-plan-name").textContent =
    planToUse.name || "Unknown Plan";
  document.getElementById("modal-plan-category").textContent =
    planToUse.category || planToUse.type || "Unknown Category";
  document.getElementById("modal-plan-price").textContent = `₹${
    planToUse.price || transaction.amount || "0"
  }`;
  document.getElementById("modal-plan-validity").textContent =
    planToUse.validity || "N/A";
  document.getElementById("modal-plan-description").textContent =
    planToUse.description || "No description available";

  // Parse and display benefits
  let benefits = [];
  if (planToUse.benefits) {
    if (typeof planToUse.benefits === "string") {
      benefits = planToUse.benefits
        .split(/[,\n]/)
        .map((b) => b.trim())
        .filter((b) => b);
    } else if (Array.isArray(planToUse.benefits)) {
      benefits = planToUse.benefits.filter((b) => b && b.trim());
    }
  }

  if (benefits.length === 0) {
    benefits = ["No specific benefits listed"];
  }

  document.getElementById("modal-plan-benefits").innerHTML = benefits
    .map(
      (benefit) => `
            <li class="flex items-center space-x-2">
              <span class="material-icons text-green-500 text-sm">check_circle</span>
              <span class="text-subtext-light">${benefit}</span>
            </li>
          `
    )
    .join("");

  // Setup download button
  const downloadBtn = document.getElementById("download-invoice-modal");
  if (downloadBtn) {
    downloadBtn.onclick = () => downloadInvoice(transactionId, transaction);
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

// Close modal
function closeModal() {
  const modal = document.getElementById("plan-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    currentSelectedTransaction = null;
  }
}

// Filter transactions
function filterTransactions() {
  const filterSelect = document.getElementById("filter-select");
  const filterValue = filterSelect?.value || "all";

  // Get user transactions first
  let userTransactions = transactions.filter(
    (t) =>
      String(t.customerId) === String(currentUser.id) ||
      String(t.userId) === String(currentUser.id)
  );

  if (filterValue !== "all") {
    userTransactions = userTransactions.filter(
      (t) => (t.status || "success").toLowerCase() === filterValue.toLowerCase()
    );
  }

  renderTransactions(userTransactions);
}

// Download invoice
function downloadInvoice(transactionId, transactionData = null) {
  console.log("Downloading invoice for transaction ID:", transactionId);
  console.log("Transaction data passed:", transactionData);

  let transaction;
  if (transactionData) {
    // Use the passed transaction data directly
    transaction =
      typeof transactionData === "string"
        ? JSON.parse(transactionData.replace(/&quot;/g, '"'))
        : transactionData;
  } else {
    // Fallback to finding in transactions array
    transaction = transactions.find(
      (t) => String(t.id) === String(transactionId)
    );
  }

  console.log("Using transaction for invoice:", transaction);

  if (!transaction) {
    console.error("Transaction not found for invoice download:", transactionId);
    showToast("Transaction not found", "error");
    return;
  }

  const plan = plans.find((p) => String(p.id) === String(transaction.planId));

  // Always use the current logged-in user for the invoice
  const customer = currentUser;

  // Create default plan if not found
  const defaultPlan = {
    name: "Unknown Plan",
    category: "General",
    price: transaction.amount || "0",
    validity: "N/A",
    description: "Plan details not available",
  };

  const planToUse = plan || defaultPlan;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Enhanced Header with gradient effect
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 50, "F");

    // Add a subtle accent line
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 45, 210, 5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("RECHARGE INVOICE", 105, 30, { align: "center" });

    // Company info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Mobile Recharge Services", 105, 40, { align: "center" });

    // Invoice metadata section with better formatting
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 65, 180, 25, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 65, 180, 25, "S");

    const invoiceDate = new Date(); // Use current date for invoice generation
    const transactionDate = new Date(
      transaction.date || transaction.createdAt || Date.now()
    );
    const invoiceNumber = `INV-${
      transaction.id || Math.random().toString(36).substr(2, 9)
    }`;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details", 20, 75);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`, 20, 82);
    doc.text(
      `Invoice Date: ${invoiceDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      110,
      82
    );
    doc.text(
      `Transaction Date: ${transactionDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`,
      20,
      87
    );
    doc.text(
      `Reference: ${
        transaction.referenceNumber || transaction.transactionId || "N/A"
      }`,
      110,
      87
    );

    // Customer details section with styling
    doc.setFillColor(34, 197, 94);
    doc.rect(15, 105, 5, 30, "F");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text("CUSTOMER DETAILS", 25, 115);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${customer?.name || "Unknown Customer"}`, 25, 125);
    doc.text(
      `Phone: ${customer?.phone || customer?.phoneNumber || "N/A"}`,
      25,
      132
    );

    // Plan details section with styling
    doc.setFillColor(59, 130, 246);
    doc.rect(15, 150, 5, 45, "F");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("PLAN DETAILS", 25, 160);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Plan Name: ${planToUse.name || "Unknown Plan"}`, 25, 170);
    doc.text(
      `Category: ${planToUse.category || planToUse.type || "N/A"}`,
      25,
      177
    );
    doc.text(`Validity: ${planToUse.validity || "N/A"}`, 25, 184);

    // Wrap description text
    const description = planToUse.description || "No description available";
    const splitDescription = doc.splitTextToSize(
      `Description: ${description}`,
      165
    );
    doc.text(splitDescription, 25, 191);

    // Payment details section with enhanced styling
    const paymentY = 191 + splitDescription.length * 7 + 15;
    doc.setFillColor(168, 85, 247);
    doc.rect(15, paymentY - 10, 5, 35, "F");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(147, 51, 234);
    doc.text("PAYMENT DETAILS", 25, paymentY);

    // Amount with special formatting
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Payment Mode: ${transaction.paymentMode || "Online"}`,
      25,
      paymentY + 10
    );

    const status = (transaction.status || "Success").toUpperCase();
    const statusColor =
      status === "SUCCESS"
        ? [34, 197, 94]
        : status === "FAILED"
        ? [239, 68, 68]
        : [245, 158, 11];

    doc.text("Status: ", 25, paymentY + 17);
    doc.setTextColor(...statusColor);
    doc.setFont("helvetica", "bold");
    doc.text(status, 55, paymentY + 17);

    // Amount in a highlighted box
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(209, 213, 219);
    doc.rect(120, paymentY + 5, 70, 20, "FD");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Total Amount", 125, paymentY + 12);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(
      `Rs. ${transaction.amount || planToUse.price || "0"}`,
      125,
      paymentY + 20
    );

    // Footer with better styling
    const footerY = paymentY + 40;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, footerY, 190, footerY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Thank you for choosing our recharge services!",
      105,
      footerY + 10,
      { align: "center" }
    );
    doc.text(
      "This is a computer generated invoice - no signature required.",
      105,
      footerY + 17,
      { align: "center" }
    );

    doc.setFontSize(8);
    doc.text(
      "For support, contact us at support@recharge.com | Call: 1800-123-4567",
      105,
      footerY + 25,
      { align: "center" }
    );

    // Save the PDF with better filename
    const fileName = `Recharge_Invoice_${invoiceNumber.replace("INV-", "")}_${
      invoiceDate.toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    showToast("Invoice downloaded successfully!", "success");
    closeModal();
  } catch (error) {
    console.error("Error generating PDF:", error);
    showToast("Failed to generate invoice. Please try again.", "error");
  }
}

// Show toast notification
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };

  toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Dark mode toggle (optional)
function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.documentElement.classList.contains("dark")
  );
}

// Initialize dark mode based on user preference
(function initializeDarkMode() {
  // Force light mode only
  document.documentElement.classList.remove("dark");
})();
