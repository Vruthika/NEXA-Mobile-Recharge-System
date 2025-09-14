function loadComponent(id, filepath) {
  fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      highlightActiveLink();
    })
    .catch((error) => console.error("Error loading navbar:", error));
}

loadComponent("navbar", "/components/navbar.html");
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

/// Mock Data
let inactiveCustomers = [
  { name: "Ravi Kumar", phone: "9876543210", days: 15 },
  { name: "Priya Sharma", phone: "9123456780", days: 30 },
  { name: "Arjun Mehta", phone: "9988776655", days: 10 },
];

let activeCustomers = [
  { name: "John Doe", phone: "9090909090", type: "Prepaid", plan: "1.5GB/day" },
  {
    name: "Jane Smith",
    phone: "9123456789",
    type: "Postpaid",
    plan: "Family Pack",
  },
  {
    name: "Alice Johnson",
    phone: "9876501234",
    type: "Prepaid",
    plan: "2GB/day",
  },
  {
    name: "Bob Brown",
    phone: "9988771122",
    type: "Postpaid",
    plan: "Unlimited 5G",
  },
];

let filteredActive = [...activeCustomers];

// Render Inactive Customers
function renderInactive() {
  let tbody = document.getElementById("inactiveTable");
  tbody.innerHTML = "";
  inactiveCustomers.forEach((c, index) => {
    tbody.innerHTML += `
            <tr class="text-center border">
              <td class="p-3 border">${index + 1}</td>
              <td class="p-3 border">${c.name}</td>
              <td class="p-3 border">${c.phone}</td>
              <td class="p-3 border">${c.days}</td>
              <td class="p-3 border">
                <button class="px-3 py-1 bg-blue-500 text-white rounded-md mr-2" onclick="viewInactive('${
                  c.name
                }')">View</button>
                <button class="px-3 py-1 bg-red-500 text-white rounded-md" onclick="deactivateInactive(${index})">Deactivate</button>
              </td>
            </tr>`;
  });
}

// Render Active Customers
function renderActive() {
  let tbody = document.getElementById("activeTable");
  tbody.innerHTML = "";
  filteredActive.forEach((c, index) => {
    tbody.innerHTML += `
            <tr class="text-center border">
              <td class="p-3 border">${index + 1}</td>
              <td class="p-3 border">${c.name}</td>
              <td class="p-3 border">${c.phone}</td>
              <td class="p-3 border">${c.type}</td>
              <td class="p-3 border">${c.plan}</td>
            </tr>`;
  });
}

// Deactivate inactive customer (remove from table)
function deactivateInactive(index) {
  let removed = inactiveCustomers.splice(index, 1);
  renderInactive();
  showToast(`${removed[0].name} (${removed[0].phone}) has been deactivated`);
}

// View Inactive customer details
function viewInactive(name) {
  showToast(`ℹ️ Viewing details for ${name}`);
}

// Filter Active Customers
document.getElementById("filterType").addEventListener("change", (e) => {
  const type = e.target.value;
  if (type === "All") {
    filteredActive = [...activeCustomers];
  } else {
    filteredActive = activeCustomers.filter((c) => c.type === type);
  }
  renderActive();
});

// Toast
function showToast(message) {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className =
    "toast flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg bg-white shadow-xl border-red-500 text-black border-t-4";
  toast.innerHTML = `❌ <span>${message}</span>`;

  container.appendChild(toast);

  // Auto-hide after 3s
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Initial Render
renderInactive();
renderActive();

// Update Summary Cards
function updateCards() {
  document.getElementById("totalCustomers").innerText =
    activeCustomers.length + inactiveCustomers.length;

  document.getElementById("activeCustomers").innerText = activeCustomers.length;

  document.getElementById("inactiveCustomers").innerText =
    inactiveCustomers.length;
}

// Modify renderInactive
function renderInactive() {
  let tbody = document.getElementById("inactiveTable");
  tbody.innerHTML = "";
  inactiveCustomers.forEach((c, index) => {
    tbody.innerHTML += `
      <tr class="text-center border">
        <td class="p-3 border">${index + 1}</td>
        <td class="p-3 border">${c.name}</td>
        <td class="p-3 border">${c.phone}</td>
        <td class="p-3 border">${c.days}</td>
        <td class="p-3 border">
          <button class="px-3 py-1 bg-blue-500 text-white rounded-md mr-2" onclick="viewInactive('${
            c.name
          }')">View</button>
          <button class="px-3 py-1 bg-red-500 text-white rounded-md" onclick="deactivateInactive(${index})">Deactivate</button>
        </td>
      </tr>`;
  });
  updateCards();
}

// Modify renderActive
function renderActive() {
  let tbody = document.getElementById("activeTable");
  tbody.innerHTML = "";
  filteredActive.forEach((c, index) => {
    tbody.innerHTML += `
      <tr class="text-center border">
        <td class="p-3 border">${index + 1}</td>
        <td class="p-3 border">${c.name}</td>
        <td class="p-3 border">${c.phone}</td>
        <td class="p-3 border">${c.type}</td>
        <td class="p-3 border">${c.plan}</td>
      </tr>`;
  });
  updateCards();
}
