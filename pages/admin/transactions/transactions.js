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
      // Active link: purple base, dark purple on hover
      link.classList.add(
        "bg-purple-600",
        "text-white",
        "rounded-lg",
        "hover:bg-purple-700"
      );
    } else {
      // Inactive links: plain style, no hover background
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

// let filteredType = [];
// let filteredStatus = [];
// let filteredPlan = [];

let transactionCurrentPage = 1;
const transactionRowsPerPage = 10;

async function fetchTransactions() {
  try {
    const res = await fetch(transactionsURL);
    const trans = await res.json();
    totalTransactions = [...trans];
    filteredTransactions = [...trans]; // Initialize filtered array

    // Render tables after data fetch
    renderTransactions();
  } catch (e) {
    console.error("Error fetching transactions:", e);
  }
}
fetchTransactions();

function applyFilters() {
  const typeFilter = document.getElementById("filterType").value;
  const statusFilter = document.getElementById("filterStatus").value;

  filteredTransactions = totalTransactions.filter((transaction) => {
    const typeMatch = typeFilter === "All" || transaction.type === typeFilter;
    const statusMatch =
      statusFilter === "All" || transaction.status === statusFilter;

    return typeMatch && statusMatch;
  });

  transactionCurrentPage = 1;
  renderTransactions();
}

// Initialize event listeners after DOM is loaded
function initializeFilters() {
  const typeFilter = document.getElementById("filterType");
  const statusFilter = document.getElementById("filterStatus");

  if (typeFilter) {
    typeFilter.addEventListener("change", applyFilters);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }
}

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", initializeFilters);

// Total Transactions + Pagination
function renderTransactions() {
  let tbody = document.getElementById("transactionTable");
  tbody.innerHTML = "";

  let start = (transactionCurrentPage - 1) * transactionRowsPerPage;
  let end = start + transactionRowsPerPage;
  let paginated = filteredTransactions.slice(start, end);

  paginated.forEach((t, index) => {
    tbody.innerHTML += `
      <tr class="text-center border">
        <td class="p-3 border">${start + index + 1}</td>
        <td class="p-3 border">${t.name}</td>
        <td class="p-3 border">${t.phone}</td>
        <td class="p-3 border">${t.type}</td>
        <td class="p-3 border">${t.plan}</td>
        <td class="p-3 border">${t.status}</td>
      </tr>`;
  });

  renderTransactionPagination();
}

function renderTransactionPagination() {
  let pagination = document.getElementById("transactionPagination");
  pagination.innerHTML = "";

  let totalPages = Math.ceil(
    filteredTransactions.length / transactionRowsPerPage
  );
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

  // Page Numbers
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
