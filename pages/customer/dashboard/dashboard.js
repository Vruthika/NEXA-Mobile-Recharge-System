function loadComponent(id, filepath) {
  fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
    })
    .catch((error) => console.error("Error loading component:", error));
}

// API URLs
const API_CUSTOMERS =
  "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers";
const API_TRANSACTIONS =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const API_PLANS = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";

// Global state
let currentUser = null;
let userTransactions = [];
let availablePlans = [];
let currentActivePlan = null;
let dailyDataUsage = {
  totalGB: 0,
  usedGB: 0,
  usedPercentage: 0,
  lastResetDate: null,
  nextResetDate: null,
};

// Initialize app
async function initializeApp() {
  // Check if user is logged in
  let loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) {
    window.location.href = "/pages/auth/login/login.html";
    return;
  } else {
    currentUser = JSON.parse(loggedInUser);
  }

  try {
    showLoadingOverlay(true);
    await fetchUserData();
    await fetchTransactions();
    await fetchPlans();
    findActivePlan();
    updateDashboard();

    // Only generate data usage if there's an active plan
    if (currentActivePlan) {
      await initializeDataUsage();
      updateRenewalTimer();
    }
    document.dispatchEvent(new Event("navloaded"));

    startPeriodicUpdates();
    showLoadingOverlay(false);
  } catch (error) {
    console.error("Error initializing app:", error);
    showToast("Error loading dashboard. Please try again.", "error");
    showLoadingOverlay(false);
  }
}

async function fetchUserData() {
  try {
    const response = await fetch(API_CUSTOMERS);
    const customers = await response.json();
    const fullUser = customers.find((c) => c.id === currentUser.id);

    if (fullUser) {
      currentUser = fullUser;
      localStorage.setItem("loggedInUser", JSON.stringify(fullUser));
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

async function fetchTransactions() {
  try {
    const response = await fetch(API_TRANSACTIONS);
    const allTransactions = await response.json();

    if (currentUser) {
      // Filter transactions by phone number and only successful ones
      userTransactions = allTransactions
        .filter(
          (transaction) =>
            transaction.phone === currentUser.phone &&
            transaction.status === "Success"
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    userTransactions = [];
  }
}

async function fetchPlans() {
  try {
    const response = await fetch(API_PLANS);
    availablePlans = await response.json();
  } catch (error) {
    console.error("Error fetching plans:", error);
    availablePlans = [];
  }
}

// Modified fetchActivePlan to use the findActivePlan logic instead of invalid query
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
      const validity = parseInt(plan.validity.replace(/\D/g, "")) || 30; // Extract number from validity string, default 30
      const daysDifference = Math.floor(
        (now - transactionDate) / (1000 * 60 * 60 * 24)
      );

      // Plan is active if (current date - recharge date) < validity days (strict < for expiry at end of day)
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
          isPrepaid:
            (currentUser.type || "Prepaid").toLowerCase() === "prepaid",
        };
        break;
      }
    }
  }
}

async function initializeDataUsage() {
  if (!currentActivePlan) return;

  // Use the 'limit' field from the plan API for total data
  dailyDataUsage.totalGB = currentActivePlan.limit
    ? parseFloat(currentActivePlan.limit)
    : 2.5;

  console.log("Plan Limit:", currentActivePlan.limit);
  console.log("Total Data Limit:", dailyDataUsage.totalGB + "GB");

  // Determine reset logic based on plan type
  const now = new Date();
  const isPrepaid = currentActivePlan.isPrepaid;

  if (isPrepaid) {
    // Prepaid: Reset daily at midnight
    dailyDataUsage.lastResetDate = new Date(now);
    dailyDataUsage.lastResetDate.setHours(0, 0, 0, 0);

    dailyDataUsage.nextResetDate = new Date(now);
    dailyDataUsage.nextResetDate.setDate(
      dailyDataUsage.nextResetDate.getDate() + 1
    );
    dailyDataUsage.nextResetDate.setHours(0, 0, 0, 0);
  } else {
    // Postpaid: Reset after validity period (monthly)
    dailyDataUsage.lastResetDate = new Date(currentActivePlan.transactionDate);
    dailyDataUsage.lastResetDate.setHours(0, 0, 0, 0);

    dailyDataUsage.nextResetDate = new Date(currentActivePlan.expiryDate);
    dailyDataUsage.nextResetDate.setHours(0, 0, 0, 0);
  }

  // Generate random usage on every page reload (don't save to localStorage)
  // Random usage between 10% to 95% to ensure variety
  dailyDataUsage.usedPercentage = Math.random() * 0.85 + 0.1;
  dailyDataUsage.usedGB = (
    dailyDataUsage.totalGB * dailyDataUsage.usedPercentage
  ).toFixed(2);

  updateDataUsageDisplay();

  // Check if we need to show the alert modal (less than 25% remaining)
  if (dailyDataUsage.usedPercentage >= 0.75) {
    setTimeout(() => {
      showDataUsageAlert();
    }, 1000);
  }
}

function updateDataUsageDisplay() {
  if (!currentActivePlan || !dailyDataUsage) return;

  const remainingGB = (dailyDataUsage.totalGB - dailyDataUsage.usedGB).toFixed(
    2
  );
  const remainingPercentage = (
    (1 - dailyDataUsage.usedPercentage) *
    100
  ).toFixed(0);

  updateElementText("remainingData", `${remainingGB} GB`);
  updateElementText("totalData", `left of ${dailyDataUsage.totalGB} GB`);
  updateElementText(
    "dataPercentage",
    `${(dailyDataUsage.usedPercentage * 100).toFixed(0)}%`
  );

  const progressBar = document.getElementById("dataProgressBar");
  if (progressBar) {
    progressBar.style.width = `${remainingPercentage}%`;
  }

  // Update reset information
  const resetInfoElement = document.getElementById("renewalInfo");
  if (resetInfoElement) {
    const isPrepaid = currentActivePlan.isPrepaid;
    const resetText = isPrepaid
      ? `Resets daily at 12:00 AM`
      : `Resets on ${formatDateExpiry(dailyDataUsage.nextResetDate)}`;

    resetInfoElement.innerHTML = `
      <span class="material-icons text-sm mr-1">schedule</span>
      ${resetText}
    `;
  }
}

function updateDashboard() {
  if (!currentUser) return;

  // Update user information
  const firstName = currentUser.name.split(" ")[0];
  const userInitial = currentUser.name.charAt(0).toUpperCase();

  // Safe element updates
  updateElementText("welcomeName", firstName);
  updateElementText("userInitial", userInitial);
  updateElementText("phoneNumber", formatPhoneNumber(currentUser.phone));
  updateElementText("customerName", currentUser.name);
  updateElementText("accountType", `${currentUser.type || "Prepaid"} Account`);
  updateElementText("userDisplayName", currentUser.name);
  updateElementText("fullPhoneNumber", formatPhoneNumber(currentUser.phone));
  updateElementText("displayAccountType", currentUser.type || "Prepaid");
  updateElementText("serviceType", `${currentUser.type || "Prepaid"} 5G`);

  // Update plan information
  updatePlanInfo();
  updateDataUsageSection();
}

function updateElementText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

function updateElementHTML(id, html) {
  const element = document.getElementById(id);
  if (element) {
    element.innerHTML = html;
  }
}

function updateDataUsageSection() {
  const dataUsageCard = document.querySelector(
    ".lg\\:col-span-2.space-y-6 > .bg-card-light.p-6.rounded-2xl.shadow-lg.border.border-border-light.hover\\:shadow-xl.transition-all.duration-300.animate-fade-in:nth-child(2)"
  );

  if (!dataUsageCard) return;

  if (!currentActivePlan) {
    // Show recharge message when no active plan
    dataUsageCard.innerHTML = `
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold">Current Plan</h3>
              <span class="text-subtext-light text-sm">No Active Plan</span>
            </div>

            <div class="text-center py-8">
              <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-primary text-3xl">sim_card_alert</span>
              </div>
              <h3 class="text-2xl font-bold mb-3">Recharge to unlock exciting benefits!</h3>
              <p class="text-subtext-light text-sm mb-6 leading-relaxed">
                Choose from our amazing plans to enjoy high-speed data, unlimited calls, and more
              </p>
              <button
                onclick="showRechargeModal()"
                class="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto"
              >
                <span class="material-icons">payment</span>
                <span>Recharge Now</span>
              </button>
            </div>
          `;
  } else {
    // Show data usage when there's an active plan
    dataUsageCard.innerHTML = `
            <div class="flex items-center justify-between mb-4">
              <h3 id="planName" class="text-xl font-bold">${
                currentActivePlan.name || "Current Plan"
              }</h3>
              <span class="text-subtext-light text-sm" id="currentPlanStatus">Active</span>
            </div>

            <div class="mb-6">
              <div class="flex items-baseline space-x-2 mb-3">
                <span
                  id="remainingData"
                  class="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                  >Loading...</span
                >
                <span id="totalData" class="text-subtext-light font-medium"
                  >Loading...</span
                >
              </div>

              <!-- Enhanced Progress Bar -->
              <div class="relative">
                <div
                  class="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden"
                >
                  <div
                    id="dataProgressBar"
                    class="bg-gradient-to-r from-primary to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style="width: 0%"
                  >
                    <div
                      class="w-full h-full bg-white opacity-30 animate-pulse"
                    ></div>
                  </div>
                </div>
                <div class="flex justify-between text-xs text-subtext-light">
                  <span>Available</span>
                  <span id="dataPercentage">0%</span>
                  <span>Used</span>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between">
                <p
                  id="renewalInfo"
                  class="text-subtext-light text-sm flex items-center"
                >
                  <span class="material-icons text-sm mr-1">schedule</span>
                  Calculating...
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
              <button
                onclick="showUsageDetailsModal()"
                class="bg-background-light hover:bg-gray-100 text-text-light font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span class="material-icons text-lg">analytics</span>
                <span>Check Usage</span>
              </button>
              <button
                onclick="addDataBooster()"
                class="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105"
              >
                <span class="material-icons text-lg">add</span>
                <span>Add Data</span>
              </button>
            </div>

            <p class="text-xs text-subtext-light text-center">
              <span class="material-icons text-xs mr-1">info</span>
              Balance updates within 60 minutes of usage
            </p>
          `;

    // Update the data usage display after the HTML is rendered
    setTimeout(() => updateDataUsageDisplay(), 100);
  }
}

function updatePlanInfo() {
  if (currentActivePlan) {
    updateElementText("planStatus", "Active");

    // Update active plan content
    const activePlanHTML = `
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-4">
                <span class="text-3xl font-bold bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent">
                  ₹${currentActivePlan.price}
                </span>
                <div class="text-right">
                  <p class="flex text-subtext-light text-sm">Expires on</p>
                  <p class="flex font-bold text-lg">${formatDateExpiry(
                    currentActivePlan.expiryDate
                  )}</p>
                </div>
              </div>
            </div>
            <div class="p-4 bg-background-light rounded-xl">
              <p class="text-sm font-medium mb-2">Plan Features:</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center space-x-2">
                  <span class="material-icons text-green-500 text-sm">check_circle</span>
                  <span>${
                    currentActivePlan.benefits
                      ? currentActivePlan.benefits[0]
                      : "Unlimited Calls"
                  }</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="material-icons text-green-500 text-sm">check_circle</span>
                  <span>${
                    currentActivePlan.benefits
                      ? currentActivePlan.benefits[1]
                      : "100 SMS/day"
                  }</span>
                </div>
                
                <div class="flex items-center space-x-2">
                  <span class="material-icons text-green-500 text-sm">check_circle</span>
                  <span>5G Access</span>
                </div>
              </div>
            </div>
          `;
    updateElementHTML("activePlanContent", activePlanHTML);
  } else {
    updateElementText("planStatus", "No Active Plan");

    const noActivePlanHTML = `
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-gray-400 text-2xl">sim_card_alert</span>
              </div>
              <h3 class="font-bold text-lg mb-2">No Active Plan</h3>
              <p class="text-subtext-light text-sm mb-4">You don't have any active plan. Choose a plan to get started.</p>
            </div>
          `;
    updateElementHTML("activePlanContent", noActivePlanHTML);
  }
}

function updateRenewalTimer() {
  if (!currentActivePlan) return;

  const now = new Date();
  let timeUntilReset = 0;
  const isPrepaid = currentActivePlan.isPrepaid;

  if (isPrepaid) {
    // Prepaid: Reset at next midnight
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    timeUntilReset = tomorrow - now;
  } else {
    // Postpaid: Reset at plan expiry
    timeUntilReset = dailyDataUsage.nextResetDate - now;
  }

  const hoursLeft = Math.floor(timeUntilReset / (1000 * 60 * 60));
  const minutesLeft = Math.floor(
    (timeUntilReset % (1000 * 60 * 60)) / (1000 * 60)
  );

  let renewalText = "";
  if (isPrepaid) {
    renewalText = `Renews in ${hoursLeft}h ${minutesLeft}m`;
  } else {
    const daysLeft = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) {
      renewalText = `Renews in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;
    } else {
      renewalText = `Renews in ${hoursLeft}h ${minutesLeft}m`;
    }
  }

  updateElementHTML(
    "renewalInfo",
    `
          <span class="material-icons text-sm mr-1">schedule</span>
          ${renewalText}
        `
  );
}

// Utility functions
function formatPhoneNumber(phone) {
  if (!phone) return "N/A";
  return phone.replace(/(\d{5})(\d{5})/, "$1$2");
}

function formatDateExpiry(date) {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
      ? "nd"
      : day === 3 || day === 23
      ? "rd"
      : "th";
  return `${day}${suffix} ${month}, ${year}`;
}

function showLoadingOverlay(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.classList.toggle("hidden", !show);
  }
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
  toast.textContent = message;

  const container = document.getElementById("toastContainer");
  if (container) {
    container.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.remove("translate-x-full"), 100);

    // Auto remove
    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

function startPeriodicUpdates() {
  // Update renewal timer every minute (only if there's an active plan)
  setInterval(() => {
    if (currentActivePlan) {
      updateRenewalTimer();
    }
  }, 60000);
}

// Modal Functions
function showDataUsageAlert() {
  if (!currentActivePlan || !dailyDataUsage) return;

  const usedPercentage = (dailyDataUsage.usedPercentage * 100).toFixed(0);
  const remainingPercentage = 100 - usedPercentage;

  // Create and show the alert modal
  const alertModalHTML = `
    <div id="dataAlertModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-scale-in">
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span class="material-icons text-red-500 text-2xl">warning</span>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900">Data Usage Alert</h3>
                <p class="text-sm text-gray-600">High data consumption detected</p>
              </div>
            </div>
            <button onclick="closeDataAlert()" class="text-gray-400 hover:text-gray-600 transition-colors">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-700">Data Used: ${
                dailyDataUsage.usedGB
              } GB</span>
              <span class="text-gray-700">Remaining: ${(
                dailyDataUsage.totalGB - dailyDataUsage.usedGB
              ).toFixed(2)} GB</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="bg-red-500 h-3 rounded-full transition-all duration-1000" style="width: ${usedPercentage}%"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>${usedPercentage}% Used</span>
              <span>100%</span>
            </div>
          </div>

          <!-- Alert Message -->
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="flex items-center space-x-2">
              <span class="material-icons text-red-500 text-lg">info</span>
              <span class="text-red-800 font-semibold">Alert! ${usedPercentage}% of your daily quota is used</span>
            </div>
            <p class="text-red-700 text-sm mt-2">Only ${remainingPercentage}% (${(
    dailyDataUsage.totalGB - dailyDataUsage.usedGB
  ).toFixed(2)} GB) remaining.</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex space-x-3">
            <button onclick="closeDataAlert()" class="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors">
              Dismiss
            </button>
            <button onclick="addDataBooster(); closeDataAlert();" class="flex-1 bg-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center space-x-2">
              <span class="material-icons text-lg">add</span>
              <span>Add Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("dataAlertModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add new modal to the page
  document.body.insertAdjacentHTML("beforeend", alertModalHTML);

  // Add animation styles if not already present
  if (!document.querySelector("#alertStyles")) {
    const styles = `
      <style id="alertStyles">
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      </style>
    `;
    document.head.insertAdjacentHTML("beforeend", styles);
  }
}

function closeDataAlert() {
  const modal = document.getElementById("dataAlertModal");
  if (modal) {
    modal.style.opacity = "0";
    modal.style.transform = "scale(0.9)";
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

function showPlanDetailsModal() {
  const modal = document.getElementById("planDetailsModal");
  const content = document.getElementById("planDetailsContent");

  if (currentActivePlan && content) {
    const planDetailsHTML = `
            <div class="space-y-6">
              <div class="text-center">
                <div class="text-4xl font-bold text-primary mb-2">₹${
                  currentActivePlan.price
                }</div>
                <div class="text-lg font-semibold">${
                  currentActivePlan.name
                }</div>
                <div class="text-sm text-subtext-light">Valid for ${
                  currentActivePlan.validity
                }</div>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-3">Plan Benefits</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center justify-between">
                    <span>Talk Time:</span>
                    <span class="font-medium">${
                      currentActivePlan.benefits
                        ? currentActivePlan.benefits[0]
                        : "Unlimited"
                    }</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>SMS:</span>
                    <span class="font-medium">${
                      currentActivePlan.benefits
                        ? currentActivePlan.benefits[1]
                        : "100/day"
                    }</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Data:</span>
                    <span class="font-medium">${
                      currentActivePlan.limit ||
                      currentActivePlan.data ||
                      "2.5GB"
                    }/day</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Network:</span>
                    <span class="font-medium">5G Ready</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">Plan Status</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center justify-between">
                    <span>Activated:</span>
                    <span class="font-medium">${formatDateExpiry(
                      currentActivePlan.transactionDate
                    )}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Expires:</span>
                    <span class="font-medium">${formatDateExpiry(
                      currentActivePlan.expiryDate
                    )}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Status:</span>
                    <span class="font-medium text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </div>
          `;
    content.innerHTML = planDetailsHTML;
  } else if (content) {
    content.innerHTML = `
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-gray-400 text-2xl">sim_card_alert</span>
              </div>
              <h3 class="font-bold text-lg mb-2">No Active Plan</h3>
              <p class="text-subtext-light text-sm">You don't have any active plan. Choose a plan to get started.</p>
            </div>
          `;
  }

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closePlanDetailsModal() {
  const modal = document.getElementById("planDetailsModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function showUsageDetailsModal() {
  const modal = document.getElementById("usageDetailsModal");
  const content = document.getElementById("usageDetailsContent");

  if (content) {
    if (currentActivePlan && dailyDataUsage) {
      const isPrepaid = currentActivePlan.isPrepaid;
      const resetType = isPrepaid ? "daily" : "monthly";
      const resetTime = isPrepaid
        ? "12:00 AM tonight"
        : formatDateExpiry(dailyDataUsage.nextResetDate);

      const usageDetailsHTML = `
              <div class="space-y-6">
                <div class="text-center">
                  <div class="text-4xl font-bold text-primary mb-2">${(
                    dailyDataUsage.usedPercentage * 100
                  ).toFixed(0)}%</div>
                  <div class="text-lg font-semibold">Data Usage ${
                    isPrepaid ? "Today" : "This Month"
                  }</div>
                  <div class="text-sm text-subtext-light">${
                    dailyDataUsage.usedGB
                  } GB used of ${dailyDataUsage.totalGB} GB</div>
                </div>
                
                <div class="space-y-4">
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold mb-3">${
                      isPrepaid ? "Daily" : "Monthly"
                    } Usage Breakdown</h4>
                    <div class="space-y-3">
                      <div>
                        <div class="flex justify-between text-sm mb-1">
                          <span>Data Used</span>
                          <span class="font-medium">${
                            dailyDataUsage.usedGB
                          } GB</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-red-500 h-2 rounded-full" style="width: ${(
                            dailyDataUsage.usedPercentage * 100
                          ).toFixed(0)}%"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div class="flex justify-between text-sm mb-1">
                          <span>Data Remaining</span>
                          <span class="font-medium">${(
                            dailyDataUsage.totalGB - dailyDataUsage.usedGB
                          ).toFixed(2)} GB</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-green-500 h-2 rounded-full" style="width: ${(
                            (1 - dailyDataUsage.usedPercentage) *
                            100
                          ).toFixed(0)}%"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-semibold mb-2">Usage Statistics</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">${Math.floor(
                          Math.random() * 50 + 20
                        )}</div>
                        <div class="text-subtext-light">Apps Used</div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">${Math.floor(
                          Math.random() * 8 + 2
                        )}h</div>
                        <div class="text-subtext-light">Active Time</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-yellow-50 p-4 rounded-lg">
                    <h4 class="font-semibold mb-2 flex items-center">
                      <span class="material-icons text-yellow-600 mr-2">schedule</span>
                      Renewal Information
                    </h4>
                    <p class="text-sm text-subtext-light">Your ${resetType} data quota will be refreshed on ${resetTime}.</p>
                  </div>
                </div>
              </div>
            `;
      content.innerHTML = usageDetailsHTML;
    } else {
      content.innerHTML = `
              <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span class="material-icons text-gray-400 text-2xl">sim_card_alert</span>
                </div>
                <h3 class="font-bold text-lg mb-2">No Active Plan</h3>
                <p class="text-subtext-light text-sm mb-4">You don't have any active plan. Recharge to view usage details.</p>
                <button
                  onclick="showRechargeModal(); closeUsageDetailsModal();"
                  class="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200"
                >
                  Recharge Now
                </button>
              </div>
            `;
    }
  }

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeUsageDetailsModal() {
  const modal = document.getElementById("usageDetailsModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// Event Handlers
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("customerId");
    localStorage.removeItem("role");
    // Clear any other stored data
    localStorage.clear();
    // Redirect to login page
    window.location.href = "../auth/login/login.html";
  }
}

// Make logout function globally available
window.logout = logout;

function refreshAccount() {
  showToast("Refreshing account data...", "info");
  initializeApp();
}

// Feature Functions
function showRechargeModal() {
  // showToast("Recharge modal would open here", "info");
  window.location.href = "/pages/customer/plans/plans.html";
}

function showHistory() {
  // showToast("History page would load here", "info");
  window.location.href = "/pages/customer/history/history.html";
}

function addDataBooster() {
  // showToast("Add data booster page would load here", "info");
  window.location.href = "/pages/customer/plans/plans.html";
}

function rechargePlan() {
  // showToast("Recharge plan page would load here", "info");
  window.location.href = "/pages/customer/plans/plans.html";
}

function browsePlans() {
  // showToast("Browse plans page would load here", "info");
  window.location.href = "/pages/customer/prepaid/prepaid-home.html";
}

function startLiveChat() {
  showToast("Live chat feature coming soon!", "info");
}

function emailSupport() {
  window.open("mailto:support@nexa.com?subject=Support Request");
}

// Handle escape key to close modals
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeDataAlert();
    closePlanDetailsModal();
    closeUsageDetailsModal();
  }
});

// Initialize components and app
document.addEventListener("DOMContentLoaded", function () {
  loadComponent("navbar", "/components/navbar.html");
  loadComponent("footer", "/components/footer.html");
  document.dispatchEvent(new Event("navloaded"));
  initializeApp();
  fetchActivePlan();
});
