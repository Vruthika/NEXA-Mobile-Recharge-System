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
const transactionsURL =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const plansURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";
const customersURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers";

let transactions = [];
let plans = [];
let inactiveCustomers = [];
let activeCustomers = [];
let filteredActive = [];

async function fetchReportData() {
  try {
    const [transactionRes, plansRes] = await Promise.all([
      fetch(transactionsURL),
      fetch(plansURL),
    ]);

    transactions = await transactionRes.json();
    plans = await plansRes.json();
    const res = await fetch(customersURL);
    const cust = await res.json();

    inactiveCustomers = cust.filter((s) => s.status === "Inactive");
    activeCustomers = cust.filter((s) => s.status === "Active");
    filteredActive = [...activeCustomers];

    updateCards();
  } catch (e) {
    console.error("Error fetching report data:", e);
  }
}

fetchReportData();

// Update Summary Cards
function updateCards() {
  const totalTransactions = transactions.length;
  const successTransactions = transactions.filter(
    (t) => t.status === "Success"
  );
  const failedTransactions = transactions.filter((t) => t.status === "Failed");

  // 🔹 Calculate total revenue from successful transactions
  let totalRevenue = 0;
  successTransactions.forEach((t) => {
    const plan = plans.find((p) => p.name === t.plan);
    if (plan) {
      totalRevenue += parseFloat(plan.price); // ensure number
    }
  });

  // Update DOM
  document.getElementById("totalRevenue").innerText = `Rs. ${totalRevenue}`;
  document.getElementById("totalTransactions").innerText = totalTransactions;
  document.getElementById("successRate").innerText =
    totalTransactions > 0
      ? ((successTransactions.length / totalTransactions) * 100).toFixed(2) +
        "%"
      : "0%";

  document.getElementById("failureRate").innerText =
    totalTransactions > 0
      ? ((failedTransactions.length / totalTransactions) * 100).toFixed(2) + "%"
      : "0%";

  document.getElementById("activeCustomers").innerText = activeCustomers.length;

  document.getElementById("inactiveCustomers").innerText =
    inactiveCustomers.length;
}
