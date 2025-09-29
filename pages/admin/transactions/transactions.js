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

const transactionsURL =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";

let totalTransactions = [];
let filteredTransactions = [];
let allPlans = [];

let transactionCurrentPage = 1;
const transactionRowsPerPage = 10;

async function fetchTransactions() {
  try {
    const res = await fetch(transactionsURL);
    const trans = await res.json();
    totalTransactions = [...trans];
    filteredTransactions = [...trans];
    renderTransactions();
  } catch (e) {
    console.error("Error fetching transactions:", e);
  }
}
fetchTransactions();

async function fetchPlans() {
  try {
    const res = await fetch(
      "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans"
    );
    const plans = await res.json();
    allPlans = plans;
    populatePlanDropdown(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
  }
}

function populatePlanDropdown(plans) {
  const filterPlan = document.getElementById("filterPlan");
  if (filterPlan) {
    const currentSelection = filterPlan.value;
    filterPlan.innerHTML = `<option value="All">All</option>`;
    plans.forEach((plan) => {
      const option = document.createElement("option");
      option.value = plan.name;
      option.textContent = plan.name;
      filterPlan.appendChild(option);
    });
    const optionExists = [...filterPlan.options].some(
      (option) => option.value === currentSelection
    );
    if (optionExists) {
      filterPlan.value = currentSelection;
    } else {
      filterPlan.value = "All";
    }
  }
}

function updatePlanDropdown() {
  const selectedType = document.getElementById("filterType").value;
  let filteredPlans;
  if (selectedType === "All") {
    filteredPlans = allPlans;
  } else {
    filteredPlans = allPlans.filter((plan) => plan.type === selectedType);
  }
  populatePlanDropdown(filteredPlans);
}

function parseDate(dateString) {
  if (!dateString) return null;
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  const dateFormats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];
  for (let format of dateFormats) {
    const match = dateString.match(format);
    if (match) {
      if (format === dateFormats[0]) {
        date = new Date(match[3], match[2] - 1, match[1]);
      } else if (format === dateFormats[1]) {
        date = new Date(match[1], match[2] - 1, match[3]);
      } else {
        date = new Date(match[3], match[1] - 1, match[2]);
      }
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return null;
}

function clearDateFilters() {
  document.getElementById("dateFrom").value = "";
  document.getElementById("dateTo").value = "";
  applyFilters();
}

function applyFilters() {
  const typeFilter = document.getElementById("filterType").value;
  const statusFilter = document.getElementById("filterStatus").value;
  const planFilter = document.getElementById("filterPlan").value;
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const searchInput = document
    .getElementById("searchNameOrNumber")
    .value.toLowerCase()
    .trim();

  filteredTransactions = totalTransactions.filter((transaction) => {
    const typeMatch = typeFilter === "All" || transaction.type === typeFilter;
    const statusMatch =
      statusFilter === "All" || transaction.status === statusFilter;
    const planMatch = planFilter === "All" || transaction.plan === planFilter;
    const searchMatch =
      searchInput === "" ||
      (transaction.name &&
        transaction.name.toLowerCase().includes(searchInput)) ||
      (transaction.phone && transaction.phone.toString().includes(searchInput));

    let dateMatch = true;
    if (dateFrom || dateTo) {
      const transactionDate = parseDate(
        transaction.date || transaction.createdAt || transaction.timestamp
      );
      if (transactionDate) {
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        if (fromDate) fromDate.setHours(0, 0, 0, 0);
        if (toDate) toDate.setHours(23, 59, 59, 999);
        if (fromDate && transactionDate < fromDate) {
          dateMatch = false;
        }
        if (toDate && transactionDate > toDate) {
          dateMatch = false;
        }
      } else if (dateFrom || dateTo) {
        dateMatch = false;
      }
    }
    return typeMatch && statusMatch && searchMatch && planMatch && dateMatch;
  });

  transactionCurrentPage = 1;
  renderTransactions();
}

function initializeFilters() {
  const typeFilter = document.getElementById("filterType");
  const statusFilter = document.getElementById("filterStatus");
  const planFilter = document.getElementById("filterPlan");
  const searchInput = document.getElementById("searchNameOrNumber");
  const dateFrom = document.getElementById("dateFrom");
  const dateTo = document.getElementById("dateTo");
  const clearDateBtn = document.getElementById("clearDateFilters");

  if (typeFilter) {
    typeFilter.addEventListener("change", () => {
      updatePlanDropdown();
      applyFilters();
    });
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }
  if (planFilter) {
    planFilter.addEventListener("change", applyFilters);
  }
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  if (dateFrom) {
    dateFrom.addEventListener("change", applyFilters);
  }
  if (dateTo) {
    dateTo.addEventListener("change", applyFilters);
  }
  if (clearDateBtn) {
    clearDateBtn.addEventListener("click", clearDateFilters);
  }
}

function openTransactionModal(index) {
  const transaction = filteredTransactions[index];
  const modal = document.getElementById("transactionModal");
  const modalContent = document.getElementById("modalContent");

  if (!modal || !modalContent) {
    console.error("Modal elements not found");
    return;
  }

  let displayDate = "N/A";
  if (transaction.date || transaction.createdAt || transaction.timestamp) {
    const date = parseDate(
      transaction.date || transaction.createdAt || transaction.timestamp
    );
    if (date) {
      displayDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  modalContent.innerHTML = `
    <div class="space-y-6">
      <div class="text-center border-b pb-4">
        <h2 class="text-2xl font-bold text-purple-600">Transaction Invoice</h2>
        <p class="text-sm text-gray-500 mt-1">Transaction ID: ${
          transaction.transaction_id || "N/A"
        }</p>
      </div>
      <div class="flex justify-center">
        <span class="px-4 py-2 rounded-full text-sm font-semibold ${
          transaction.status === "Success"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }">
          ${transaction.status || "N/A"}
        </span>
      </div>
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Name</p>
            <p class="font-semibold text-gray-800">${
              transaction.name || "N/A"
            }</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Phone Number</p>
            <p class="font-semibold text-gray-800">${
              transaction.phone || "N/A"
            }</p>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Plan Details</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Connection Type</p>
            <p class="font-semibold text-gray-800">${
              transaction.type || "N/A"
            }</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Recharged Plan</p>
            <p class="font-semibold text-gray-800">${
              transaction.plan || "N/A"
            }</p>
          </div>
          ${
            transaction.amount
              ? `
          <div>
            <p class="text-sm text-gray-600">Amount</p>
            <p class="font-semibold text-gray-800">₹${transaction.amount}</p>
          </div>
          `
              : ""
          }
          <div>
            <p class="text-sm text-gray-600">Transaction Date</p>
            <p class="font-semibold text-gray-800">${displayDate}</p>
          </div>
        </div>
      </div>
      ${
        transaction.description
          ? `
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Description</h3>
        <p class="text-gray-700">${transaction.description}</p>
      </div>
      `
          : ""
      }
      
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeTransactionModal() {
  const modal = document.getElementById("transactionModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function renderTransactions() {
  let tbody = document.getElementById("transactionTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  let start = (transactionCurrentPage - 1) * transactionRowsPerPage;
  let end = start + transactionRowsPerPage;
  let paginated = filteredTransactions.slice(start, end);

  paginated.forEach((t, index) => {
    let displayDate = "N/A";
    if (t.date || t.createdAt || t.timestamp) {
      const date = parseDate(t.date || t.createdAt || t.timestamp);
      if (date) {
        displayDate = date.toLocaleDateString();
      }
    }

    tbody.innerHTML += `
      <tr class="text-center border">
        <td class="p-2 border text-xs lg:text-sm">${start + index + 1}</td>
        <td class="p-2 border text-xs lg:text-sm truncate">${
          t.name || "N/A"
        }</td>
        <td class="p-2 border text-xs lg:text-sm">${t.phone || "N/A"}</td>
        <td class="p-2 border text-xs lg:text-sm">${t.type || "N/A"}</td>
        <td class="p-2 border text-xs lg:text-sm truncate">${
          t.plan || "N/A"
        }</td>
        <td class="p-2 border text-xs lg:text-sm">${t.status || "N/A"}</td>
        <td class="p-2 border text-xs lg:text-sm">${displayDate}</td>
        <td class="p-2 border">
          <button 
            onclick="openTransactionModal(${start + index})" 
            class="bg-purple-600 text-white px-2 py-1 rounded text-xs lg:text-sm hover:bg-purple-700 transition"
          >
            View
          </button>
        </td>
      </tr>`;
  });

  renderTransactionPagination();
}

function renderTransactionPagination() {
  let pagination = document.getElementById("transactionPagination");
  if (!pagination) return;

  pagination.innerHTML = "";

  let totalPages = Math.ceil(
    filteredTransactions.length / transactionRowsPerPage
  );
  if (totalPages === 0) return;

  let prevBtn = document.createElement("button");
  prevBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
         stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" 
        d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z" />
    </svg>`;
  prevBtn.className =
    "px-2 py-1 rounded-md flex items-center justify-center " +
    (transactionCurrentPage === 1
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  prevBtn.disabled = transactionCurrentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (transactionCurrentPage > 1) {
      transactionCurrentPage--;
      renderTransactions();
    }
  });
  pagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    let button = document.createElement("button");
    button.innerText = i;
    button.className =
      "px-3 py-1 rounded-md " +
      (i === transactionCurrentPage
        ? "bg-purple-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300");

    button.addEventListener("click", () => {
      transactionCurrentPage = i;
      renderTransactions();
    });
    pagination.appendChild(button);
  }

  let nextBtn = document.createElement("button");
  nextBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
         stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" 
        d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
    </svg>`;
  nextBtn.className =
    "px-2 py-1 rounded-md flex items-center justify-center " +
    (transactionCurrentPage === totalPages
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  nextBtn.disabled = transactionCurrentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (transactionCurrentPage < totalPages) {
      transactionCurrentPage++;
      renderTransactions();
    }
  });
  pagination.appendChild(nextBtn);
}

document.addEventListener("DOMContentLoaded", () => {
  fetchPlans();
  initializeFilters();

  const closeModalBtn = document.getElementById("closeModal");
  const modal = document.getElementById("transactionModal");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeTransactionModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeTransactionModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeTransactionModal();
    }
  });
});
