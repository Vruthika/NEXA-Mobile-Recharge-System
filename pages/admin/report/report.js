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
const transactionsURL =
  "https://68ca32f2430c4476c3488311.mockapi.io/Transactions";
const plansURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";
const customersURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers";

// Global variables
let transactions = [];
let plans = [];
let inactiveCustomers = [];
let activeCustomers = [];
let filteredTransactions = [];
let revenueChart, planChart, prepaidChart, postpaidChart;

// Load CanvasJS dynamically
function loadCanvasJS() {
  return new Promise((resolve, reject) => {
    if (window.CanvasJS) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://canvasjs.com/assets/script/canvasjs.min.js";
    script.onload = () => {
      console.log("CanvasJS loaded successfully");
      resolve();
    };
    script.onerror = () => {
      console.error("Failed to load CanvasJS");
      reject();
    };
    document.head.appendChild(script);
  });
}

async function fetchReportData() {
  try {
    // Load CanvasJS first
    await loadCanvasJS();

    const [transactionRes, plansRes, customerRes] = await Promise.all([
      fetch(transactionsURL),
      fetch(plansURL),
      fetch(customersURL),
    ]);

    transactions = await transactionRes.json();
    plans = await plansRes.json();
    const customers = await customerRes.json();

    inactiveCustomers = customers.filter((s) => s.status === "Inactive");
    activeCustomers = customers.filter((s) => s.status === "Active");

    filteredTransactions = [...transactions];

    console.log("Data loaded:", {
      transactions: transactions.length,
      plans: plans.length,
      customers: customers.length,
    });

    updateCards();
    createRevenueChart();
    createPlanChart();
    updateRevenueCharts();
    populateFilterDropdowns();
  } catch (e) {
    console.error("Error fetching report data:", e);
  }
}

// Populate filter dropdowns
function populateFilterDropdowns() {
  // Get unique categories from plans
  const categories = [...new Set(plans.map((p) => p.category))].filter(Boolean);

  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }
}

// Update Summary Cards
function updateCards() {
  const totalTransactions = filteredTransactions.length;
  const successTransactions = filteredTransactions.filter(
    (t) => t.status === "Success"
  );
  const failedTransactions = filteredTransactions.filter(
    (t) => t.status === "Failed"
  );

  // Calculate total revenue from successful transactions (filtered)
  let totalRevenue = 0;
  successTransactions.forEach((t) => {
    const plan = plans.find((p) => p.name === t.plan);
    if (plan) {
      totalRevenue += parseFloat(plan.price) || 0;
    }
  });

  // Update DOM
  document.getElementById(
    "totalRevenue"
  ).innerText = `Rs. ${totalRevenue.toLocaleString()}`;
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

// Calculate Revenue for CanvasJS Charts
function calculateRevenue() {
  console.log("=== Calculating Revenue for CanvasJS Charts ===");

  const successfulTransactions = filteredTransactions.filter(
    (t) => t.status === "Success"
  );
  const revenueByPlan = {};

  successfulTransactions.forEach((transaction) => {
    const plan = plans.find((p) => p.name === transaction.plan);

    if (plan) {
      const planName = plan.name;
      const amount = parseFloat(plan.price) || 0;

      if (revenueByPlan[planName]) {
        revenueByPlan[planName] += amount;
      } else {
        revenueByPlan[planName] = amount;
      }
    }
  });

  console.log("Revenue by plan:", revenueByPlan);
  return revenueByPlan;
}

// Create Chart Data Points for CanvasJS
function createChartDataPoints(revenueData, planType) {
  console.log(`Creating chart data for ${planType}`);

  const colors = [
    "#A5B4FC",
    "#86EFAC",
    "#7DD3FC",
    "#C4B5FD",
    "#FDE68A",
    "#FF90C7",
    "#FAC78C",
    "#93C5FD",
    "#A7F3D0",
    "#A585F0",
    "#FD99AF",
    "#FBBF24",
  ];

  const filteredRevenue = {};

  // Filter revenue by plan type
  Object.entries(revenueData).forEach(([planName, revenue]) => {
    const plan = plans.find((p) => p.name === planName);

    if (plan && plan.type) {
      const planTypeStr = plan.type.toLowerCase();
      const targetType = planType.toLowerCase();

      if (
        planTypeStr.includes(targetType) ||
        targetType.includes(planTypeStr)
      ) {
        filteredRevenue[planName] = revenue;
      }
    }
  });

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
      revenue: revenue, // Add revenue for tooltip
    }))
    .filter((point) => point.y > 0)
    .sort((a, b) => b.y - a.y);

  return dataPoints.length > 0
    ? dataPoints
    : [{ y: 100, label: `No ${planType} Data`, color: "#E5E7EB" }];
}

// Update Revenue Charts (CanvasJS)
function updateRevenueCharts() {
  if (!window.CanvasJS) {
    console.warn("CanvasJS not loaded yet");
    return;
  }

  const revenueData = calculateRevenue();
  console.log("Final revenue data for charts:", revenueData);

  const prepaidData = createChartDataPoints(revenueData, "prepaid");
  const postpaidData = createChartDataPoints(revenueData, "postpaid");

  // Common chart configuration
  const commonConfig = {
    animationEnabled: true,
    theme: "light2",
    width: 400,
    height: 350,
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
        indexLabelFontSize: 10,
        toolTipContent:
          "<b>{label}:</b><br/>Revenue: Rs.{revenue}<br/>Percentage: {y}%",
        click: function (e) {
          e.dataSeries.dataPoints.forEach((dp) => (dp.exploded = false));
        },
      },
    ],
  };

  // Prepaid Revenue Chart
  if (prepaidChart) prepaidChart.destroy();
  prepaidChart = new CanvasJS.Chart("prepaidChart", {
    ...commonConfig,
    title: {
      text: "Prepaid Revenue Distribution",
      fontSize: 16,
    },
    data: [
      {
        ...commonConfig.data[0],
        dataPoints: prepaidData,
      },
    ],
  });

  // Postpaid Revenue Chart
  if (postpaidChart) postpaidChart.destroy();
  postpaidChart = new CanvasJS.Chart("postpaidChart", {
    ...commonConfig,
    title: {
      text: "Postpaid Revenue Distribution",
      fontSize: 16,
    },
    data: [
      {
        ...commonConfig.data[0],
        dataPoints: postpaidData,
      },
    ],
  });

  prepaidChart.render();
  postpaidChart.render();
}

function createRevenueChart() {
  const ctx = document.getElementById("revenueChart").getContext("2d");
  const monthlyData = {};

  filteredTransactions
    .filter((t) => t.status === "Success" && t.date)
    .forEach((t) => {
      const plan = plans.find((p) => p.name === t.plan);
      if (!plan) return;

      const dateParts = t.date.split("-");
      if (dateParts.length < 3) return;

      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);
      const date = new Date(year, month, day);

      if (isNaN(date.getTime())) {
        console.warn("Invalid date for transaction:", t);
        return;
      }

      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      monthlyData[monthKey] =
        (monthlyData[monthKey] || 0) + parseFloat(plan.price);
    });

  const sortedKeys = Object.keys(monthlyData).sort();
  if (sortedKeys.length === 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  const labels = sortedKeys.map((k) => {
    const [y, m] = k.split("-");
    return new Date(y, m - 1).toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  });

  const data = sortedKeys.map((k) => monthlyData[k]);

  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data,
          borderColor: "rgb(139,92,246)",
          backgroundColor: "rgba(139,92,246,0.2)",
          fill: true,
          tension: 0.3,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => "₹" + v.toLocaleString() },
        },
      },
    },
  });
}

// Plan-wise Revenue Pie Chart
function createPlanChart() {
  const ctx = document.getElementById("planChart").getContext("2d");
  const planRevenue = {};

  filteredTransactions
    .filter((t) => t.status === "Success")
    .forEach((t) => {
      const plan = plans.find((p) => p.name === t.plan);
      if (!plan) return;
      planRevenue[t.plan] = (planRevenue[t.plan] || 0) + parseFloat(plan.price);
    });

  const labels = Object.keys(planRevenue);
  const data = Object.values(planRevenue);

  const softMutedColors = [
    "#F8BBD9",
    "#7DD3FC",
    "#FDE047",
    "#D4C5F9",
    "#FFCAB0",
    "#6EE7B7",
    "#FBBF24",
    "#F472B6",
    "#60A5FA",
    "#A3E635",
    "#FED7AA",
    "#C084FC",
    "#34D399",
    "#FACC15",
    "#F87171",
    "#38BDF8",
    "#A855F7",
    "#10B981",
    "#FCD34D",
    "#EC4899",
    "#3B82F6",
    "#84CC16",
    "#F97316",
    "#8B5CF6",
    "#059669",
    "#EAB308",
    "#f9a0a0ff",
    "#0EA5E9",
    "#7C3AED",
    "#22C55E",
    "#F59E0B",
    "#D946EF",
  ];

  const backgroundColors = labels.map(
    (_, i) => softMutedColors[i % softMutedColors.length]
  );

  if (planChart) planChart.destroy();
  planChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue by Plan",
          data,
          backgroundColor: backgroundColors,
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 10,
          hoverBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
      elements: {
        arc: {
          borderAlign: "center",
        },
      },
    },
  });
}

// Enhanced Filter Functions
function applyFilters() {
  const fromDate = document.getElementById("fromDate")?.value;
  const toDate = document.getElementById("toDate")?.value;
  const monthFilter = document.getElementById("monthFilter")?.value;
  const typeFilter = document.getElementById("typeFilter")?.value;
  const categoryFilter = document.getElementById("categoryFilter")?.value;

  console.log("Applying filters:", {
    fromDate,
    toDate,
    monthFilter,
    typeFilter,
    categoryFilter,
  });

  filteredTransactions = transactions.filter((transaction) => {
    // Date range filter
    if (transaction.date) {
      const txDate = new Date(transaction.date);
      if (fromDate && txDate < new Date(fromDate)) return false;
      if (toDate && txDate > new Date(toDate + "T23:59:59")) return false;
    }

    // Month filter
    if (monthFilter && transaction.date) {
      const txDate = new Date(transaction.date);
      const txMonth =
        txDate.getFullYear() +
        "-" +
        String(txDate.getMonth() + 1).padStart(2, "0");
      if (txMonth !== monthFilter) return false;
    }

    // Type filter (Prepaid/Postpaid)
    if (typeFilter) {
      const plan = plans.find((p) => p.name === transaction.plan);
      if (
        !plan ||
        !plan.type ||
        plan.type.toLowerCase() !== typeFilter.toLowerCase()
      )
        return false;
    }

    // Category filter
    if (categoryFilter) {
      const plan = plans.find((p) => p.name === transaction.plan);
      if (!plan || !plan.category || plan.category !== categoryFilter)
        return false;
    }

    return true;
  });

  console.log(
    `Filtered transactions: ${filteredTransactions.length}/${transactions.length}`
  );

  // Update all components
  updateCards();
  createRevenueChart();
  createPlanChart();
  updateRevenueCharts();
}

// Individual filter functions for backward compatibility
function applyDateFilter() {
  applyFilters();
}

function applyMonthFilter() {
  const monthFilter = document.getElementById("monthFilter")?.value;
  if (monthFilter) {
    // Clear date filters when month filter is applied
    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    if (fromDate) fromDate.value = "";
    if (toDate) toDate.value = "";
  }
  applyFilters();
}

function applyTypeFilter() {
  applyFilters();
}

function applyCategoryFilter() {
  applyFilters();
}

function resetFilter() {
  // Clear all filter inputs
  const filters = [
    "fromDate",
    "toDate",
    "monthFilter",
    "typeFilter",
    "categoryFilter",
  ];
  filters.forEach((filterId) => {
    const element = document.getElementById(filterId);
    if (element) element.value = "";
  });

  // Reset filtered data
  filteredTransactions = [...transactions];

  // Update all components
  updateCards();
  createRevenueChart();
  createPlanChart();
  updateRevenueCharts();
}

// Export PDF
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  const exportData =
    filteredTransactions.length > 0 ? filteredTransactions : transactions;

  doc.setFontSize(18);
  doc.text("NEXA", 14, 20);
  doc.setFontSize(16);
  doc.text("Transactions Report", 14, 30);

  const fromDate = document.getElementById("fromDate")?.value;
  const toDate = document.getElementById("toDate")?.value;
  let nextY = 40;

  if (fromDate || toDate) {
    let rangeText = "Date Range: ";
    rangeText += fromDate ? fromDate : "All";
    rangeText += " to ";
    rangeText += toDate ? toDate : "All";
    doc.setFontSize(12);
    doc.text(rangeText, 14, nextY);
    nextY += 10;
  }

  const tableData = exportData.map((t, index) => {
    const matchedPlan = plans.find((p) => p.name === t.plan);
    const price = matchedPlan ? matchedPlan.price : "-";
    return [
      index + 1,
      t.transaction_id,
      t.name,
      t.phone,
      t.type,
      t.plan,
      "Rs. " + price,
      t.date,
      t.status,
    ];
  });

  const headers = [
    [
      "S.No",
      "Transaction ID",
      "Name",
      "Phone Number",
      "Type",
      "Recharged Plan",
      "Price",
      "Transaction Date",
      "Status",
    ],
  ];

  doc.autoTable({
    head: headers,
    body: tableData,
    startY: nextY,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 55 },
      6: { cellWidth: 20 },
      7: { cellWidth: 30 },
      8: { cellWidth: 25 },
    },
  });

  doc.save("recharge_transactions_report.pdf");
}

// Initialize application
document.addEventListener("DOMContentLoaded", function () {
  fetchReportData();
});

// Fallback initialization
window.onload = function () {
  fetchReportData();
};
