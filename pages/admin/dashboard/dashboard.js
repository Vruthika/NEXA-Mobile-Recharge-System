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

// Transactions Data Fetch
const transactionsURL =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";

let inactiveCustomers = [];
let activeCustomers = [];
let transactions = [];

async function fetchDashboardData() {
  try {
    const customerRes = await fetch(customersURL);
    const transactionRes = await fetch(transactionsURL);
    const cust = await customerRes.json();
    transactions = await transactionRes.json();

    inactiveCustomers = cust.filter((s) => s.status === "Inactive");
    activeCustomers = cust.filter((s) => s.status === "Active");

    updateDashboardCards();
  } catch (e) {
    console.error("Error fetching dashboard data:", e);
  }
}

fetchDashboardData();

// ==============================
// Update Dashboard Summary Cards
// ==============================
function updateDashboardCards() {
  const total = activeCustomers.length + inactiveCustomers.length;
  const active = activeCustomers.length;
  const inactive = inactiveCustomers.length;

  document.getElementById("totalCustomers").innerText = total;
  document.getElementById("activeCustomers").innerText = active;
  document.getElementById("inactiveCustomers").innerText = inactive;
  const totalTransactions = transactions.length;
  const successTransactions = transactions.filter(
    (t) => t.status === "Success"
  ).length;
  const failedTransactions = transactions.filter(
    (t) => t.status === "Failed"
  ).length;

  document.getElementById("totalTransactions").innerText = totalTransactions;
  document.getElementById("successTransaction").innerText =
    totalTransactions > 0
      ? ((successTransactions / totalTransactions) * 100).toFixed(2) + "%"
      : "0%";

  document.getElementById("failedTransaction").innerText =
    totalTransactions > 0
      ? ((failedTransactions / totalTransactions) * 100).toFixed(2) + "%"
      : "0%";
}

window.onload = function () {
  // Prepaid Revenue Chart
  var prepaidChart = new CanvasJS.Chart("prepaidChart", {
    animationEnabled: true,
    theme: "light2",
    legend: {
      verticalAlign: "bottom",
      horizontalAlign: "center",
      fontSize: 14,
    },
    data: [
      {
        type: "doughnut",
        startAngle: 240,
        innerRadius: 70,
        indexLabel: "{label} - {y}%",
        indexLabelFontSize: 14,
        toolTipContent: "<b>{label}:</b> {y}%",
        click: function (e) {
          e.dataSeries.dataPoints.forEach((dp) => (dp.exploded = false));
        },
        dataPoints: [
          { y: 25, label: "True Unlimited 5G Plans", color: "#A5B4FC " }, // soft lavender blue
          { y: 15, label: "Top Up", color: "#86EFAC  " }, // mint green
          { y: 20, label: "Annual Plans", color: "#7DD3FC " }, // soft sky blue
          { y: 10, label: "3 GB/Day", color: "#C4B5FD" }, // light purple
          { y: 10, label: "2.5 GB/Day", color: "#FDE68A " }, // light yellow
          { y: 20, label: "2 GB/Day", color: "#ff90c7ff" }, // blue
          { y: 10, label: "1.5 GB/Day", color: "#fac78cff  " }, // light orange
        ],
      },
    ],
  });

  // Postpaid Revenue Chart
  var postpaidChart = new CanvasJS.Chart("postpaidChart", {
    animationEnabled: true,
    theme: "light2",
    legend: {
      verticalAlign: "bottom",
      horizontalAlign: "center",
      fontSize: 14,
    },
    data: [
      {
        type: "doughnut",
        startAngle: 240,
        innerRadius: 70,
        indexLabel: "{label} - {y}%",
        indexLabelFontSize: 16,
        toolTipContent: "<b>{label}:</b> {y}%",
        click: function (e) {
          e.dataSeries.dataPoints.forEach((dp) => (dp.exploded = false));
        },
        dataPoints: [
          { y: 35, label: "Individual Plans", color: "#93C5FD " }, // powder blue
          { y: 25, label: "Family Pack", color: "#A7F3D0 " }, // soft mint
          { y: 20, label: "JioHotstar Plans", color: "#a585f0ff" }, //purple
          { y: 20, label: "Netflix Plans", color: "#fd99afff" }, // light pink
        ],
      },
    ],
  });

  prepaidChart.render();
  postpaidChart.render();
};
