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

// Customer Data Fetch
const customersURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers";

let inactiveCustomers = [];
let activeCustomers = [];
let filteredActive = [];

let inactiveCurrentPage = 1;
let activeCurrentPage = 1;
const inactiveRowsPerPage = 5;
const activeRowsPerPage = 10;

async function fetchCustomers() {
  try {
    const res = await fetch(customersURL);
    const cust = await res.json();

    inactiveCustomers = cust.filter((s) => s.status === "Inactive");
    activeCustomers = cust.filter((s) => s.status === "Active");
    filteredActive = [...activeCustomers];

    // Render tables after data fetch
    renderInactive();
    renderActive();
  } catch (e) {
    console.error("Error fetching customers:", e);
  }
}
fetchCustomers();

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
          <button class="px-3 py-1 bg-red-500 text-white rounded-md"
            onclick="showDeleteModal(${index})">Deactivate</button>
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
    tbody.innerHTML += `
      <tr class="text-center border">
        <td class="p-3 border">${start + index + 1}</td>
        <td class="p-3 border">${c.name}</td>
        <td class="p-3 border">${c.phone}</td>
        <td class="p-3 border">${c.type ? c.type : "-"}</td>
      <td class="p-3 border">${c.plan ? c.plan : "-"}</td>
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
