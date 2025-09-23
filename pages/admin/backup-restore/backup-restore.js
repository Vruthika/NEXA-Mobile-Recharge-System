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

    // Remove any existing highlight classes first
    link.classList.remove(
      "bg-purple-600",
      "text-white",
      "rounded-lg",
      "hover:bg-purple-700"
    );
    link.classList.add("text-gray-200");

    // Check if this is the settings link and we're on a settings page
    if (
      href.includes("settings/settings.html") &&
      currentPath.includes("settings")
    ) {
      link.classList.remove("text-gray-200");
      link.classList.add(
        "bg-purple-600",
        "text-white",
        "rounded-lg",
        "hover:bg-purple-700"
      );
      return;
    }

    // For other pages, use the original logic but improved
    let targetPath = href.replace("../", "");

    // Handle different possible path formats
    if (
      currentPath.endsWith(targetPath) ||
      currentPath.includes(targetPath.replace(".html", "")) ||
      (targetPath.includes("/") &&
        currentPath.includes(targetPath.split("/")[0]))
    ) {
      link.classList.remove("text-gray-200");
      link.classList.add(
        "bg-purple-600",
        "text-white",
        "rounded-lg",
        "hover:bg-purple-700"
      );
    }
  });
}

// Also call highlightActiveLink when the page loads, in case the sidebar is already loaded
document.addEventListener("DOMContentLoaded", function () {
  // Wait a bit for the sidebar to load, then highlight
  setTimeout(highlightActiveLink, 100);
});

// API URLs
const TRANSACTIONS_URL =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const CUSTOMERS_URL =
  "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers";
const PLANS_URL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";

// Data storage
let apiCustomers = [];
let apiPlans = [];
let apiTransactions = [];
let selectedFolderPath = "";

// Schedule backup settings
let scheduleInterval = null;

// Backup versions data
let backupVersions = [];
let currentPage = 1;
let rowsPerPage = 5;

document.addEventListener("DOMContentLoaded", function () {
  // Load sidebar
  fetch("/components/admin-sidebar.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("sidebar").innerHTML = data;
    })
    .catch((error) => console.error("Error loading sidebar:", error));

  // Initialize
  fetchAllData();
  renderVersionsTable();
  setupEventListeners();
});

// Fetch data from APIs
async function fetchAllData() {
  try {
    showToast("Loading data from APIs...", "info");

    const [customersRes, plansRes, transactionsRes] = await Promise.all([
      fetch(CUSTOMERS_URL),
      fetch(PLANS_URL),
      fetch(TRANSACTIONS_URL),
    ]);

    apiCustomers = await customersRes.json();
    apiPlans = await plansRes.json();
    apiTransactions = await transactionsRes.json();

    showToast("Data loaded successfully", "success");
  } catch (error) {
    console.error("Error fetching data:", error);
    showToast("Failed to load API data", "error");
  }
}

function setupEventListeners() {
  // Schedule button
  document.getElementById("scheduleBtn").addEventListener("click", setSchedule);

  // Browse button - folder path input
  document.getElementById("browseBtn").addEventListener("click", function () {
    showFolderPathDialog();
  });

  // Start backup button
  document
    .getElementById("startBackupBtn")
    .addEventListener("click", startBackup);

  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", function () {
    fetchAllData();
    renderVersionsTable();
    showToast("Data refreshed", "info");
  });

  // Modal close buttons
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("viewModal").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });

  // Expanded modal close buttons
  document
    .getElementById("closeExpandedModal")
    .addEventListener("click", closeExpandedModal);
  document
    .getElementById("expandedModal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeExpandedModal();
    });

  // Folder path modal buttons
  document
    .getElementById("cancelFolderPath")
    .addEventListener("click", closeFolderPathModal);
  document
    .getElementById("confirmFolderPath")
    .addEventListener("click", confirmFolderPath);
  document
    .getElementById("folderPathModal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeFolderPathModal();
    });

  // Allow Enter key to confirm folder path
  document
    .getElementById("folderPathInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        confirmFolderPath();
      }
    });

  // Confirmation modal buttons
  document
    .getElementById("cancelBtn")
    .addEventListener("click", closeConfirmationModal);
  document
    .getElementById("confirmBtn")
    .addEventListener("click", handleConfirmAction);
  document
    .getElementById("confirmationModal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeConfirmationModal();
    });

  // Mobile sidebar functionality
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.getElementById("sidebar");
  const mobileOverlay = document.getElementById("mobile-overlay");

  function toggleSidebar() {
    const isHidden = sidebar.classList.contains("-translate-x-full");
    if (isHidden) {
      sidebar.classList.remove("-translate-x-full");
      sidebar.classList.add("translate-x-0");
      mobileOverlay.classList.remove("hidden");
    } else {
      sidebar.classList.add("-translate-x-full");
      sidebar.classList.remove("translate-x-0");
      mobileOverlay.classList.add("hidden");
    }
  }

  mobileMenuBtn.addEventListener("click", toggleSidebar);
  mobileOverlay.addEventListener("click", toggleSidebar);
}

function showFolderPathDialog() {
  document.getElementById("folderPathModal").classList.remove("hidden");
  document.getElementById("folderPathInput").focus();
}

function closeFolderPathModal() {
  document.getElementById("folderPathModal").classList.add("hidden");
  document.getElementById("folderPathInput").value = "";
}

function confirmFolderPath() {
  const pathInput = document.getElementById("folderPathInput");
  const path = pathInput.value.trim();

  if (!path) {
    showToast("Please enter a valid folder path", "error");
    return;
  }

  // Basic path validation
  const isValidPath =
    /^([a-zA-Z]:\\|\/|\\\\).+/.test(path) ||
    /^[a-zA-Z]:/.test(path) ||
    path.startsWith("/");

  if (!isValidPath) {
    showToast("Please enter a valid folder path format", "error");
    return;
  }

  selectedFolderPath = path;
  document.getElementById(
    "selectedPath"
  ).textContent = `Selected: ${selectedFolderPath}`;
  showToast("Backup location selected successfully", "success");
  closeFolderPathModal();
}

function setQuickPath(path) {
  if (path && !path.includes("null")) {
    document.getElementById("folderPathInput").value = path;
  }
}

function setSchedule() {
  const selectedSchedule = document.querySelector(
    'input[name="schedule"]:checked'
  ).value;
  const statusDiv = document.getElementById("scheduleStatus");
  const statusText = document.getElementById("statusText");

  // Clear existing interval if any
  if (scheduleInterval) {
    clearInterval(scheduleInterval);
    scheduleInterval = null;
  }

  // Just show the status - no actual scheduling for demo purposes
  // In a real application, this would be handled by the backend/server
  statusDiv.classList.remove("hidden");
  statusDiv.classList.remove("bg-gray-50", "text-gray-700");
  statusDiv.classList.add(
    "bg-green-50",
    "text-green-700",
    "border",
    "border-green-200"
  );
  statusText.textContent = `Scheduled for ${selectedSchedule} backups`;

  showToast(`Scheduled ${selectedSchedule} backups successfully!`, "success");
}

function startBackup() {
  const format = document.getElementById("backupFormat").value;

  if (!format) {
    showToast("Please select a backup format", "error");
    return;
  }

  if (!selectedFolderPath) {
    showToast("Please select a backup location", "error");
    return;
  }

  if (apiCustomers.length === 0) {
    showToast(
      "No data available to backup. Please wait for data to load.",
      "error"
    );
    return;
  }

  // Show progress
  const progressDiv = document.getElementById("backupProgress");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  progressDiv.classList.remove("hidden");

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      // Create new backup version with real API data
      const newVersion = {
        id: Date.now(),
        version: `v1.${backupVersions.length + 1}.0`,
        date: new Date().toLocaleString(),
        size: `${(Math.random() * 50 + 10).toFixed(1)} MB`,
        type: format.toUpperCase(),
        customers: [...apiCustomers],
        plans: [...apiPlans],
        transactions: [...apiTransactions],
        location: selectedFolderPath,
      };

      backupVersions.unshift(newVersion);
      renderVersionsTable();

      setTimeout(() => {
        progressDiv.classList.add("hidden");
        showToast("Manual backup completed successfully!", "success");

        // Reset form
        document.getElementById("backupFormat").value = "";
        document.getElementById("selectedPath").textContent =
          "No location selected";
        selectedFolderPath = "";
      }, 500);
    }

    progressBar.style.width = `${Math.min(progress, 100)}%`;
    progressText.textContent = `${Math.min(Math.round(progress), 100)}%`;
  }, 300);
}

function renderVersionsTable() {
  const tbody = document.getElementById("versionsTable");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginated = backupVersions.slice(start, end);

  if (paginated.length === 0) {
    tbody.innerHTML = `
            <tr>
              <td colspan="6" class="p-8 text-center text-gray-500">
                No backup versions found. Create your first backup!
              </td>
            </tr>
          `;
    return;
  }

  paginated.forEach((version, index) => {
    tbody.innerHTML += `
            <tr class="text-center border hover:bg-gray-50">
              <td class="p-3 border">${start + index + 1}</td>
              <td class="p-3 border font-medium">${version.version}</td>
              <td class="p-3 border">${version.date}</td>
              <td class="p-3 border">${version.size}</td>
              <td class="p-3 border">
                <span class="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  ${version.type}
                </span>
              </td>
              <td class="p-3 border">
                <div class="flex justify-center space-x-2">
                  <button onclick="viewBackup(${
                    version.id
                  })" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                    View
                  </button>
                  <button onclick="restoreBackup(${
                    version.id
                  })" class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                    Restore
                  </button>
                  <button onclick="deleteBackup(${
                    version.id
                  })" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          `;
  });

  renderPagination();
}

function renderPagination() {
  const pagination = document.getElementById("versionsPagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(backupVersions.length / rowsPerPage);
  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z" />
          </svg>
        `;
  prevBtn.className = `px-2 py-1 rounded-md flex items-center justify-center ${
    currentPage === 1
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-purple-600 text-white hover:bg-purple-700"
  }`;
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderVersionsTable();
    }
  });
  pagination.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className = `px-3 py-1 rounded-md ${
      i === currentPage
        ? "bg-purple-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }`;
    button.addEventListener("click", () => {
      currentPage = i;
      renderVersionsTable();
    });
    pagination.appendChild(button);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
          </svg>
        `;
  nextBtn.className = `px-2 py-1 rounded-md flex items-center justify-center ${
    currentPage === totalPages
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-purple-600 text-white hover:bg-purple-700"
  }`;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderVersionsTable();
    }
  });
  pagination.appendChild(nextBtn);
}

function viewBackup(id) {
  const version = backupVersions.find((v) => v.id === id);
  if (!version) return;

  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = `
          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div><strong>Version:</strong> ${version.version}</div>
              <div><strong>Date:</strong> ${version.date}</div>
              <div><strong>Size:</strong> ${version.size}</div>
              <div><strong>Type:</strong> ${version.type}</div>
              ${
                version.schedule
                  ? `<div><strong>Schedule:</strong> ${version.schedule}</div>`
                  : ""
              }
              ${
                version.location
                  ? `<div><strong>Location:</strong> ${version.location}</div>`
                  : ""
              }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-blue-50 p-4 rounded-lg data-card clickable" onclick="showExpandedData('customers', ${
                version.id
              })">
                <h4 class="font-semibold text-blue-800 mb-2">Customers</h4>
                <p class="text-2xl font-bold text-blue-600">${
                  version.customers ? version.customers.length : 0
                }</p>
                <p class="text-sm text-blue-600">Records</p>
                <p class="text-xs text-blue-500 mt-2">Click to view all</p>
              </div>

              <div class="bg-green-50 p-4 rounded-lg data-card clickable" onclick="showExpandedData('plans', ${
                version.id
              })">
                <h4 class="font-semibold text-green-800 mb-2">Plans</h4>
                <p class="text-2xl font-bold text-green-600">${
                  version.plans ? version.plans.length : 0
                }</p>
                <p class="text-sm text-green-600">Records</p>
                <p class="text-xs text-green-500 mt-2">Click to view all</p>
              </div>

              <div class="bg-purple-50 p-4 rounded-lg data-card clickable" onclick="showExpandedData('transactions', ${
                version.id
              })">
                <h4 class="font-semibold text-purple-800 mb-2">Transactions</h4>
                <p class="text-2xl font-bold text-purple-600">${
                  version.transactions ? version.transactions.length : 0
                }</p>
                <p class="text-sm text-purple-600">Records</p>
                <p class="text-xs text-purple-500 mt-2">Click to view all</p>
              </div>
            </div>

            ${
              version.customers && version.customers.length > 0
                ? `
            <div class="space-y-4">
              <h4 class="font-semibold">Sample Data Preview:</h4>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-medium mb-2">Customers (First 3):</h5>
                <div class="space-y-1 text-sm">
                  ${version.customers
                    .slice(0, 3)
                    .map(
                      (c) =>
                        `<div>• ${c.name || "N/A"} - ${c.phone || "N/A"} (${
                          c.type || "N/A"
                        })</div>`
                    )
                    .join("")}
                </div>
              </div>

              ${
                version.plans && version.plans.length > 0
                  ? `
              <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-medium mb-2">Plans (First 3):</h5>
                <div class="space-y-1 text-sm">
                  ${version.plans
                    .slice(0, 3)
                    .map(
                      (p) =>
                        `<div>• ${p.name || "N/A"} - ₹${p.price || "N/A"} (${
                          p.validity || "N/A"
                        } days)</div>`
                    )
                    .join("")}
                </div>
              </div>
              `
                  : ""
              }

              ${
                version.transactions && version.transactions.length > 0
                  ? `
              <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-medium mb-2">Transactions (First 3):</h5>
                <div class="space-y-1 text-sm">
                  ${version.transactions
                    .slice(0, 3)
                    .map(
                      (t) =>
                        `<div>• ₹${t.amount || "N/A"} - ${t.date || "N/A"} (${
                          t.status || "N/A"
                        })</div>`
                    )
                    .join("")}
                </div>
              </div>
              `
                  : ""
              }
            </div>
            `
                : '<div class="text-center text-gray-500 py-8">No preview data available</div>'
            }
          </div>
        `;

  document.getElementById("viewModal").classList.remove("hidden");
}

function showExpandedData(dataType, versionId) {
  const version = backupVersions.find((v) => v.id === versionId);
  if (!version) return;

  let data, title, bgColor, textColor;

  switch (dataType) {
    case "customers":
      data = version.customers || [];
      title = "All Customers";
      bgColor = "bg-blue-50";
      textColor = "text-blue-800";
      break;
    case "plans":
      data = version.plans || [];
      title = "All Plans";
      bgColor = "bg-green-50";
      textColor = "text-green-800";
      break;
    case "transactions":
      data = version.transactions || [];
      title = "All Transactions";
      bgColor = "bg-purple-50";
      textColor = "text-purple-800";
      break;
    default:
      return;
  }

  const expandedModalTitle = document.getElementById("expandedModalTitle");
  const expandedModalContent = document.getElementById("expandedModalContent");

  expandedModalTitle.textContent = `${title} (${data.length} records)`;

  if (data.length === 0) {
    expandedModalContent.innerHTML = `
            <div class="text-center text-gray-500 py-8">
              No ${dataType} data available in this backup.
            </div>
          `;
  } else {
    let content = `<div class="space-y-3">`;

    data.forEach((item, index) => {
      content += `
              <div class="${bgColor} p-4 rounded-lg border border-gray-200">
                <div class="font-semibold ${textColor} mb-2">#${index + 1}</div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            `;

      // Display all properties of the item
      Object.keys(item).forEach((key) => {
        const value = item[key];
        content += `
                <div>
                  <span class="font-medium text-gray-600">${key}:</span>
                  <span class="text-gray-800">${value || "N/A"}</span>
                </div>
              `;
      });

      content += `
                </div>
              </div>
            `;
    });

    content += `</div>`;
    expandedModalContent.innerHTML = content;
  }

  document.getElementById("expandedModal").classList.remove("hidden");
}

function closeExpandedModal() {
  document.getElementById("expandedModal").classList.add("hidden");
}

function showConfirmationModal(title, message, type, onConfirm) {
  const modal = document.getElementById("confirmationModal");
  const titleEl = document.getElementById("confirmTitle");
  const messageEl = document.getElementById("confirmMessage");
  const iconEl = document.getElementById("confirmIcon");
  const confirmBtn = document.getElementById("confirmBtn");

  titleEl.textContent = title;
  messageEl.textContent = message;

  // Set colors based on type
  if (type === "restore") {
    iconEl.className =
      "w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-green-500";
    confirmBtn.className =
      "px-4 py-2 rounded-md transition-colors text-white font-semibold bg-green-600 hover:bg-green-700";
    confirmBtn.textContent = "Restore";
  } else if (type === "delete") {
    iconEl.className =
      "w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-red-500";
    confirmBtn.className =
      "px-4 py-2 rounded-md transition-colors text-white font-semibold bg-red-600 hover:bg-red-700";
    confirmBtn.textContent = "Delete";
  }

  // Store the callback function
  window.currentConfirmAction = onConfirm;

  modal.classList.remove("hidden");
}

function handleConfirmAction() {
  if (window.currentConfirmAction) {
    window.currentConfirmAction();
    window.currentConfirmAction = null;
  }
  closeConfirmationModal();
}

function closeConfirmationModal() {
  document.getElementById("confirmationModal").classList.add("hidden");
  window.currentConfirmAction = null;
}

function restoreBackup(id) {
  const version = backupVersions.find((v) => v.id === id);
  if (!version) return;

  showConfirmationModal(
    "Confirm Restore",
    `Are you sure you want to restore ${version.version}? This will overwrite current data.`,
    "restore",
    () => {
      showToast("Restore started...", "info");

      setTimeout(() => {
        // Here you would actually restore the data to the APIs
        apiCustomers = [...version.customers];
        apiPlans = [...version.plans];
        apiTransactions = [...version.transactions];

        showToast(`Successfully restored ${version.version}!`, "success");
      }, 2000);
    }
  );
}

function deleteBackup(id) {
  const version = backupVersions.find((v) => v.id === id);
  if (!version) return;

  showConfirmationModal(
    "Confirm Delete",
    `Are you sure you want to delete ${version.version}? This action cannot be undone.`,
    "delete",
    () => {
      backupVersions = backupVersions.filter((v) => v.id !== id);
      renderVersionsTable();
      showToast(`Deleted ${version.version}`, "success");
    }
  );
}

function closeModal() {
  document.getElementById("viewModal").classList.add("hidden");
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");

  let icon, borderColor, bgColor;

  if (type === "success") {
    icon = "✅";
    borderColor = "border-green-500";
    bgColor = "bg-green-50";
  } else if (type === "error") {
    icon = "❌";
    borderColor = "border-red-500";
    bgColor = "bg-red-50";
  } else if (type === "info") {
    icon = "ℹ️";
    borderColor = "border-blue-500";
    bgColor = "bg-blue-50";
  } else {
    icon = "✅";
    borderColor = "border-green-500";
    bgColor = "bg-green-50";
  }

  toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${bgColor} ${borderColor} text-gray-800 border-l-4 min-w-[300px]`;
  toast.innerHTML = `
          <span class="text-lg">${icon}</span>
          <span class="font-medium">${message}</span>
          <button class="ml-auto text-gray-500 hover:text-gray-700 text-xl leading-none" onclick="this.parentElement.remove()">&times;</button>
        `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add("hide");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 400);
    }
  }, 4000);
}
