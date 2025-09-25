function loadComponent(id, filepath) {
  fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      highlightActiveLink();
    })
    .catch((error) => console.error("Error loading navbar:", error));
}

// loadComponent("navbar", "/components/navbar.html");
loadComponent("sidebar", "/components/admin-sidebar.html");

function highlightActiveLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll("#sidebar a");

  links.forEach((link) => {
    const href = link.getAttribute("href");

    if (currentPath.endsWith(href.replace("../", ""))) {
      link.classList.add(
        "bg-purple-600",
        "text-white",
        "rounded-lg",
        "hover:bg-purple-700"
      );
    } else {
      link.classList.remove(
        "bg-purple-600",
        "text-white",
        "rounded-lg",
        "hover:bg-purple-700"
      );
      link.classList.add("text-gray-200");
    }
  });
}

// API URLs
const customersURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers";
const transactionsURL =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const plansURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";

let inactiveCustomers = [];
let activeCustomers = [];
let filteredActive = [];
let transactions = [];

let inactiveCurrentPage = 1;
let activeCurrentPage = 1;
const inactiveRowsPerPage = 5;
const activeRowsPerPage = 10;

// Utility function to calculate days difference
function daysDifference(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);

  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}

// Function to extract validity days from plan name
function extractValidityDays(planName) {
  if (!planName) return 0;

  // Common patterns in plan names
  const patterns = [
    /(\d+)\s*days?/i, // "28 Days", "84 days"
    /(\d+)\s*day/i, // "28 day"
    /annual/i, // "Annual" plans
    /yearly/i, // "Yearly" plans
  ];

  // Check for annual/yearly plans first
  if (/annual|yearly/i.test(planName)) {
    return 365;
  }

  // Extract numeric days
  for (let pattern of patterns) {
    const match = planName.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  // Default validity based on plan type
  if (/top-up|topup/i.test(planName)) {
    return 30; // Top-up plans typically 30 days
  }

  if (/family|premium|postpaid/i.test(planName)) {
    return 30; // Monthly plans
  }

  // Default fallback
  return 28;
}

// Function to get active plan for a customer
function getActivePlan(customerPhone) {
  const currentDate = new Date();

  // Get all successful transactions for this customer phone
  const customerTransactions = transactions.filter(
    (t) => t.phone === customerPhone && t.status === "Success"
  );

  if (customerTransactions.length === 0) {
    return "-";
  }

  // Find the most recent active plan
  let activePlan = null;
  let latestValidDate = null;

  customerTransactions.forEach((transaction) => {
    const rechargeDate = new Date(transaction.date);
    const validityDays = extractValidityDays(transaction.plan);

    // Calculate expiry date
    const expiryDate = new Date(rechargeDate);
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    // Check if plan is still active (current date <= expiry date)
    if (currentDate <= expiryDate) {
      // If this is the first active plan or if this plan expires later
      if (!latestValidDate || expiryDate > latestValidDate) {
        activePlan = transaction.plan;
        latestValidDate = expiryDate;
      }
    }
  });

  return activePlan || "-";
}

// Function to determine customer type based on plan
function determineCustomerType(planName) {
  if (!planName || planName === "-") {
    return "Prepaid"; // Default
  }

  const planLower = planName.toLowerCase();

  // Check for postpaid indicators in plan name
  if (
    planLower.includes("postpaid") ||
    planLower.includes("monthly") ||
    planLower.includes("unlimited") ||
    planLower.includes("family") ||
    planLower.includes("business")
  ) {
    return "Postpaid";
  }

  // Check for prepaid indicators
  if (
    planLower.includes("prepaid") ||
    planLower.includes("top-up") ||
    planLower.includes("topup") ||
    planLower.includes("recharge")
  ) {
    return "Prepaid";
  }

  // Default to Prepaid if unclear
  return "Prepaid";
}

async function fetchData() {
  try {
    // Fetch customers, transactions, and plans
    const [customersRes, transactionsRes, plansRes] = await Promise.all([
      fetch(customersURL),
      fetch(transactionsURL),
      fetch(plansURL),
    ]);

    const customers = await customersRes.json();
    transactions = await transactionsRes.json();
    plans = await plansRes.json();

    inactiveCustomers = customers.filter((s) => s.status === "Inactive");
    activeCustomers = customers.filter((s) => s.status === "Active");

    // Add active plan information and ensure type is set correctly for active customers
    activeCustomers.forEach((customer) => {
      customer.activePlan = getActivePlan(customer.phone);

      // If customer has an active plan, assign a type based on plan
      if (customer.activePlan !== "-") {
        // Customer has active plan - determine type if missing
        if (!customer.type || customer.type === "-" || customer.type === null) {
          customer.type = determineCustomerType(customer.activePlan);
        }
      } else {
        // Customer has no active plan - set type to "-"
        customer.type = "-";
      }
    });

    filteredActive = [...activeCustomers];

    // Render tables after data fetch
    renderInactive();
    renderActive();
  } catch (e) {
    console.error("Error fetching data:", e);
    showToast("❌ Failed to load customer data. Please try again.");
  }
}

// Initialize data fetch
fetchData();

// Deactivate Inactive Customers
let deleteIndex = null; // Store the customer index temporarily

function showDeleteModal(index) {
  deleteIndex = index;
  document.getElementById("deleteModal").classList.remove("hidden");
  document.getElementById("deleteModal").classList.add("flex");
}

function hideDeleteModal() {
  deleteIndex = null;
  document.getElementById("deleteModal").classList.add("hidden");
  document.getElementById("deleteModal").classList.remove("flex");
}

document
  .getElementById("cancelDelete")
  .addEventListener("click", hideDeleteModal);

document.getElementById("confirmDelete").addEventListener("click", () => {
  if (deleteIndex !== null) {
    deactivateInactive(deleteIndex);
  }
  hideDeleteModal();
});

async function deactivateInactive(index) {
  const customer = inactiveCustomers[index];

  try {
    // Send DELETE request to MockAPI
    const res = await fetch(`${customersURL}/${customer.id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete customer");

    // Remove from local list only if DELETE succeeds
    inactiveCustomers.splice(index, 1);

    if (
      inactiveCurrentPage >
      Math.ceil(inactiveCustomers.length / inactiveRowsPerPage)
    ) {
      inactiveCurrentPage = Math.max(1, inactiveCurrentPage - 1);
    }

    renderInactive();
    showToast(`${customer.name} (${customer.phone}) has been deactivated`);
  } catch (err) {
    console.error("Error deleting customer:", err);
    showToast("❌ Failed to delete customer. Please try again.");
  }
}

// Filter Active Customers
document.getElementById("filterType").addEventListener("change", (e) => {
  const type = e.target.value;
  if (type === "All") {
    filteredActive = [...activeCustomers];
  } else {
    filteredActive = activeCustomers.filter((c) => c.type === type);
  }
  activeCurrentPage = 1;
  renderActive();
});

// Toast Notifications
function showToast(message) {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className =
    "toast flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg bg-white border-red-500 text-black border-t-4";
  toast.innerHTML = `❌ <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Inactive Customers + Pagination
function renderInactive() {
  let tbody = document.getElementById("inactiveTable");
  tbody.innerHTML = "";

  let start = (inactiveCurrentPage - 1) * inactiveRowsPerPage;
  let end = start + inactiveRowsPerPage;
  let paginated = inactiveCustomers.slice(start, end);

  paginated.forEach((c, index) => {
    tbody.innerHTML += `
      <tr class="text-center border">
        <td class="p-3 border">${start + index + 1}</td>
        <td class="p-3 border">${c.name}</td>
        <td class="p-3 border">${c.phone}</td>
        <td class="p-3 border">${c.days}</td>
        <td class="p-3 border">
          <button class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            onclick="showDeleteModal(${start + index})">Deactivate</button>
        </td>
      </tr>`;
  });

  updateCards();
  renderInactivePagination();
}

function renderInactivePagination() {
  let pagination = document.getElementById("inactivePagination");
  pagination.innerHTML = "";

  let totalPages = Math.ceil(inactiveCustomers.length / inactiveRowsPerPage);
  if (totalPages === 0) return;

  // Prev Button
  let prevBtn = document.createElement("button");
  prevBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
         stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" 
        d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z" />
    </svg>`;
  prevBtn.className =
    "px-2 py-1 rounded-md flex items-center justify-center " +
    (inactiveCurrentPage === 1
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  prevBtn.disabled = inactiveCurrentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (inactiveCurrentPage > 1) {
      inactiveCurrentPage--;
      renderInactive();
    }
  });
  pagination.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    let button = document.createElement("button");
    button.innerText = i;
    button.className =
      "px-3 py-1 rounded-md " +
      (i === inactiveCurrentPage
        ? "bg-purple-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300");

    button.addEventListener("click", () => {
      inactiveCurrentPage = i;
      renderInactive();
    });
    pagination.appendChild(button);
  }

  // Next Button
  let nextBtn = document.createElement("button");
  nextBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
         stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" 
        d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
    </svg>`;
  nextBtn.className =
    "px-2 py-1 rounded-md flex items-center justify-center " +
    (inactiveCurrentPage === totalPages
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  nextBtn.disabled = inactiveCurrentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (inactiveCurrentPage < totalPages) {
      inactiveCurrentPage++;
      renderInactive();
    }
  });
  pagination.appendChild(nextBtn);
}

// Active Customers + Pagination
function renderActive() {
  let tbody = document.getElementById("activeTable");
  tbody.innerHTML = "";

  let start = (activeCurrentPage - 1) * activeRowsPerPage;
  let end = start + activeRowsPerPage;
  let paginated = filteredActive.slice(start, end);

  paginated.forEach((c, index) => {
    // Get active plan for this customer (refresh to get real-time data)
    const activePlan = getActivePlan(c.phone);

    tbody.innerHTML += `
      <tr class="text-center border">
        <td class="p-3 border">${start + index + 1}</td>
        <td class="p-3 border">${c.name}</td>
        <td class="p-3 border">${c.phone}</td>
        <td class="p-3 border">${c.type}</td>
        <td class="p-3 border ${
          activePlan !== "-" ? "text-green-600 font-medium" : "text-gray-500"
        }">${activePlan}</td>
      </tr>`;
  });

  renderActivePagination();
  updateCards();
}

function renderActivePagination() {
  let pagination = document.getElementById("activePagination");
  pagination.innerHTML = "";

  let totalPages = Math.ceil(filteredActive.length / activeRowsPerPage);
  if (totalPages === 0) return;

  // Prev Button
  let prevBtn = document.createElement("button");
  prevBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
         stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" 
        d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z" />
    </svg>`;
  prevBtn.className =
    "px-2 py-1 rounded-md flex items-center justify-center " +
    (activeCurrentPage === 1
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  prevBtn.disabled = activeCurrentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (activeCurrentPage > 1) {
      activeCurrentPage--;
      renderActive();
    }
  });
  pagination.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    let button = document.createElement("button");
    button.innerText = i;
    button.className =
      "px-3 py-1 rounded-md " +
      (i === activeCurrentPage
        ? "bg-purple-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300");

    button.addEventListener("click", () => {
      activeCurrentPage = i;
      renderActive();
    });
    pagination.appendChild(button);
  }

  // Next Button
  let nextBtn = document.createElement("button");
  nextBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
         stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" 
        d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
    </svg>`;
  nextBtn.className =
    "px-2 py-1 rounded-md flex items-center justify-center " +
    (activeCurrentPage === totalPages
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  nextBtn.disabled = activeCurrentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (activeCurrentPage < totalPages) {
      activeCurrentPage++;
      renderActive();
    }
  });
  pagination.appendChild(nextBtn);
}

// Update Summary Cards
function updateCards() {
  document.getElementById("totalCustomers").innerText =
    activeCustomers.length + inactiveCustomers.length;

  document.getElementById("activeCustomers").innerText = activeCustomers.length;

  document.getElementById("inactiveCustomers").innerText =
    inactiveCustomers.length;
}
