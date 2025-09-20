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
let transactions = [];
let plans = [];

async function fetchDashboardData() {
  try {
    const customerRes = await fetch(customersURL);
    const transactionRes = await fetch(transactionsURL);
    const plansRes = await fetch(plansURL);

    const cust = await customerRes.json();
    transactions = await transactionRes.json();
    plans = await plansRes.json();

    inactiveCustomers = cust.filter((s) => s.status === "Inactive");
    activeCustomers = cust.filter((s) => s.status === "Active");

    updateDashboardCards();
    updateRevenueCharts();
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

// ==============================
// Calculate Revenue from Successful Transactions
// ==============================
function calculateRevenue() {
  console.log("=== DEBUG: Calculating Revenue ===");
  console.log("Total transactions:", transactions.length);
  console.log("Total plans:", plans.length);

  // Get only successful transactions
  const successfulTransactions = transactions.filter(
    (t) => t.status === "Success"
  );
  console.log("Successful transactions:", successfulTransactions.length);
  console.log(
    "First few successful transactions:",
    successfulTransactions.slice(0, 3)
  );
  console.log("First few plans:", plans.slice(0, 3));

  // Debug: Show actual structure of transactions and plans
  if (successfulTransactions.length > 0) {
    console.log(
      "Sample transaction keys:",
      Object.keys(successfulTransactions[0])
    );
    console.log("Full sample transaction:", successfulTransactions[0]);
  }
  if (plans.length > 0) {
    console.log("Sample plan keys:", Object.keys(plans[0]));
    console.log("Full sample plan:", plans[0]);
  }

  // Group transactions by plan and calculate revenue
  const revenueByPlan = {};

  successfulTransactions.forEach((transaction) => {
    // Try multiple field names for planId
    const possiblePlanIdFields = [
      "planId",
      "plan_id",
      "planID",
      "PlanId",
      "id",
      "plan",
    ];
    let planId = null;
    let planIdField = null;

    for (let field of possiblePlanIdFields) {
      if (transaction[field] !== undefined && transaction[field] !== null) {
        planId = transaction[field];
        planIdField = field;
        break;
      }
    }

    console.log(
      `Transaction planId: ${planId} (from field: ${planIdField}, type: ${typeof planId})`
    );

    // Try multiple ways to match planId with different field names
    let plan = null;
    if (planId !== null) {
      plan = plans.find(
        (p) =>
          p.id === planId ||
          p.id === String(planId) ||
          String(p.id) === String(planId) ||
          p.planId === planId ||
          p.plan_id === planId
      );
    }

    if (plan) {
      console.log("Found matching plan:", plan);
      // Try multiple field names for plan name
      const planName =
        plan.name ||
        plan.planName ||
        plan.title ||
        plan.plan_name ||
        `Plan ${plan.id}`;
      // Try multiple field names for amount
      const amount = parseFloat(
        plan.amount || plan.price || plan.cost || plan.value || 0
      );

      console.log(`Plan: ${planName}, Amount: ${amount}`);

      if (revenueByPlan[planName]) {
        revenueByPlan[planName] += amount;
      } else {
        revenueByPlan[planName] = amount;
      }
    } else {
      console.log("No matching plan found for transaction:", transaction);
      console.log(
        `Tried to match planId: ${planId} with plan IDs:`,
        plans.map((p) => p.id).slice(0, 5)
      );
    }
  });

  console.log("Revenue by plan:", revenueByPlan);
  return revenueByPlan;
}

// ==============================
// Create Chart Data Points
// ==============================
function createChartDataPoints(revenueData, planType) {
  console.log(`=== Creating chart data for ${planType} ===`);
  console.log("Revenue data:", revenueData);

  const colors = [
    "#A5B4FC",
    "#86EFAC",
    "#7DD3FC",
    "#C4B5FD",
    "#FDE68A",
    "#ff90c7ff",
    "#fac78cff",
    "#93C5FD",
    "#A7F3D0",
    "#a585f0ff",
    "#fd99afff",
    "#FBBF24",
  ];

  const totalRevenue = Object.values(revenueData).reduce(
    (sum, amount) => sum + amount,
    0
  );
  console.log("Total revenue:", totalRevenue);

  if (totalRevenue === 0) {
    console.log("No revenue data found");
    return [{ y: 100, label: `No ${planType} Data`, color: "#E5E7EB" }];
  }

  // Filter revenue by plan type
  const filteredRevenue = {};

  Object.entries(revenueData).forEach(([planName, revenue]) => {
    const plan = plans.find(
      (p) =>
        (p.name || p.planName || p.title || p.plan_name || `Plan ${p.id}`) ===
        planName
    );

    if (plan && plan.type) {
      // Check if plan type matches (case-insensitive, partial match)
      const planTypeStr = plan.type.toLowerCase();
      const targetType = planType.toLowerCase();

      if (
        planTypeStr.includes(targetType) ||
        targetType.includes(planTypeStr)
      ) {
        filteredRevenue[planName] = revenue;
        console.log(`Matched ${planName} (${plan.type}) to ${planType}`);
      }
    } else if (plan) {
      console.log(`Plan ${planName} has no type field:`, plan);
      // If no type field, distribute plans between prepaid/postpaid based on name or other criteria
      if (planType === "prepaid") {
        // Common prepaid plan indicators
        if (
          planName.toLowerCase().includes("prepaid") ||
          planName.toLowerCase().includes("recharge") ||
          planName.toLowerCase().includes("top up") ||
          planName.toLowerCase().includes("gb/day")
        ) {
          filteredRevenue[planName] = revenue;
        }
      } else if (planType === "postpaid") {
        // Common postpaid plan indicators
        if (
          planName.toLowerCase().includes("postpaid") ||
          planName.toLowerCase().includes("family") ||
          planName.toLowerCase().includes("individual") ||
          planName.toLowerCase().includes("netflix") ||
          planName.toLowerCase().includes("hotstar")
        ) {
          filteredRevenue[planName] = revenue;
        }
      }
    }
  });

  console.log(`Filtered revenue for ${planType}:`, filteredRevenue);

  const filteredTotal = Object.values(filteredRevenue).reduce(
    (sum, amount) => sum + amount,
    0
  );

  if (filteredTotal === 0) {
    return [{ y: 100, label: `No ${planType} Data`, color: "#E5E7EB" }];
  }

  // Convert to chart data
  const dataPoints = Object.entries(filteredRevenue)
    .map(([planName, revenue], index) => ({
      y: parseFloat(((revenue / filteredTotal) * 100).toFixed(1)),
      label: planName,
      color: colors[index % colors.length],
    }))
    .filter((point) => point.y > 0)
    .sort((a, b) => b.y - a.y);

  console.log(`${planType} chart data points:`, dataPoints);
  return dataPoints.length > 0
    ? dataPoints
    : [{ y: 100, label: `No ${planType} Data`, color: "#E5E7EB" }];
}

// ==============================
// Update Revenue Charts
// ==============================
function updateRevenueCharts() {
  const revenueData = calculateRevenue();
  console.log("Final revenue data for charts:", revenueData);

  const prepaidData = createChartDataPoints(revenueData, "prepaid");
  const postpaidData = createChartDataPoints(revenueData, "postpaid");

  // Prepaid Revenue Chart
  var prepaidChart = new CanvasJS.Chart("prepaidChart", {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: "Prepaid Revenue Distribution",
      fontSize: 16,
    },
    legend: {
      verticalAlign: "bottom",
      horizontalAlign: "center",
      fontSize: 12,
    },
    data: [
      {
        type: "doughnut",
        startAngle: 240,
        innerRadius: 70,
        indexLabel: "{label} - {y}%",
        indexLabelFontSize: 12,
        toolTipContent: "<b>{label}:</b> {y}%",
        click: function (e) {
          e.dataSeries.dataPoints.forEach((dp) => (dp.exploded = false));
        },
        dataPoints: prepaidData,
      },
    ],
  });

  // Postpaid Revenue Chart
  var postpaidChart = new CanvasJS.Chart("postpaidChart", {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: "Postpaid Revenue Distribution",
      fontSize: 16,
    },
    legend: {
      verticalAlign: "bottom",
      horizontalAlign: "center",
      fontSize: 12,
    },
    data: [
      {
        type: "doughnut",
        startAngle: 240,
        innerRadius: 70,
        indexLabel: "{label} - {y}%",
        indexLabelFontSize: 12,
        toolTipContent: "<b>{label}:</b> {y}%",
        click: function (e) {
          e.dataSeries.dataPoints.forEach((dp) => (dp.exploded = false));
        },
        dataPoints: postpaidData,
      },
    ],
  });

  prepaidChart.render();
  postpaidChart.render();
}

// Initialize charts after page load
window.onload = function () {
  // Charts will be updated after data is fetched in fetchDashboardData()
};
