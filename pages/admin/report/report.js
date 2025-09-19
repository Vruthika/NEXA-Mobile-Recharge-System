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
let filteredTransactions = [];
let revenueChart, planChart;

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

    // ✅ Initialize filteredTransactions here
    filteredTransactions = [...transactions];

    updateCards();

    // ✅ Create charts after data is ready
    createRevenueChart();
    createPlanChart();
  } catch (e) {
    console.error("Error fetching report data:", e);
  }
}

fetchReportData();

// Update Summary Cards
function updateCards() {
  // Use the filtered list instead of all transactions
  const totalTransactions = filteredTransactions.length;
  const successTransactions = filteredTransactions.filter(
    (t) => t.status === "Success"
  );
  const failedTransactions = filteredTransactions.filter(
    (t) => t.status === "Failed"
  );

  // 🔹 Calculate total revenue from successful transactions (filtered)
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

  // If active/inactive customers must also respect the date filter,
  // then calculate them from filteredTransactions instead of global arrays.
  document.getElementById("activeCustomers").innerText = activeCustomers.length;
  document.getElementById("inactiveCustomers").innerText =
    inactiveCustomers.length;
}

function createRevenueChart() {
  const ctx = document.getElementById("revenueChart").getContext("2d");
  const monthlyData = {};

  filteredTransactions
    .filter((t) => t.status === "Success" && t.date)
    .forEach((t) => {
      const plan = plans.find((p) => p.name === t.plan);
      if (!plan) return;

      // Force parsing YYYY-MM-DD or similar
      const dateParts = t.date.split("-");
      if (dateParts.length < 3) return;

      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JS months are 0-based
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
    "#F8BBD9", // Soft Pink
    "#7DD3FC", // Bright Sky Blue
    "#FDE047", // Soft Yellow
    "#D4C5F9", // Medium Lavender
    "#FFCAB0", // Peach
    "#6EE7B7", // Fresh Mint
    "#FBBF24", // Golden Yellow
    "#F472B6", // Rose Pink
    "#60A5FA", // Medium Blue
    "#A3E635", // Lime Green
    "#FED7AA", // Orange
    "#C084FC", // Purple
    "#34D399", // Emerald
    "#FACC15", // Amber
    "#F87171", // Light Red
    "#38BDF8", // Cyan
    "#A855F7", // Violet
    "#10B981", // Teal
    "#FCD34D", // Light Orange
    "#EC4899", // Hot Pink
    "#3B82F6", // Blue
    "#84CC16", // Green
    "#F97316", // Deep Orange
    "#8B5CF6", // Deep Purple
    "#059669", // Deep Teal
    "#EAB308", // Yellow
    "#f9a0a0ff ", // Red
    "#0EA5E9", // Light Blue
    "#7C3AED", // Indigo
    "#22C55E", // Bright Green
    "#F59E0B", // Amber Orange
    "#D946EF", // Magenta
  ];

  // Function to get maximally different colors for adjacent sectors
  const getDistributedColors = (count) => {
    if (count <= softMutedColors.length) {
      // Color families organized to ensure maximum contrast between adjacent colors
      const colorFamilies = [
        {
          colors: ["#F8BBD9", "#F472B6", "#EC4899", "#F87171"],
          family: "pink",
        }, // Pinks/Roses
        {
          colors: ["#7DD3FC", "#60A5FA", "#38BDF8", "#3B82F6", "#0EA5E9"],
          family: "blue",
        }, // Blues
        {
          colors: ["#FDE047", "#FBBF24", "#FACC15", "#FCD34D", "#EAB308"],
          family: "yellow",
        }, // Yellows/Golds
        {
          colors: ["#6EE7B7", "#34D399", "#10B981", "#22C55E"],
          family: "green",
        }, // Greens/Mints
        {
          colors: ["#FFCAB0", "#FED7AA", "#F97316", "#F59E0B"],
          family: "orange",
        }, // Oranges/Peaches
        {
          colors: ["#D4C5F9", "#C084FC", "#A855F7", "#8B5CF6", "#7C3AED"],
          family: "purple",
        }, // Purples/Lavenders
        { colors: ["#A3E635", "#84CC16"], family: "lime" }, // Lime/Light Green
        { colors: ["#059669"], family: "teal" }, // Teal
        { colors: ["#f9a0a0ff ", "#D946EF"], family: "accent" }, // Accent colors
      ];

      // Smart distribution to maximize contrast between adjacent sectors
      const selectedColors = [];
      let familyIndex = 0;
      let colorIndex = 0;

      for (let i = 0; i < count; i++) {
        const family = colorFamilies[familyIndex % colorFamilies.length];
        selectedColors.push(family.colors[colorIndex % family.colors.length]);

        // Move to next family to ensure different color family for next sector
        familyIndex++;

        // When we've cycled through all families, move to next color in each family
        if (familyIndex % colorFamilies.length === 0) {
          colorIndex++;
        }
      }

      return selectedColors;
    } else {
      // For very large datasets, use the predefined array cyclically
      return Array.from(
        { length: count },
        (_, i) => softMutedColors[i % softMutedColors.length]
      );
    }
  };

  const backgroundColors = getDistributedColors(labels.length);

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
            padding: 20,
            font: {
              size: 12,
            },
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

// Date Filter
function applyDateFilter() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;

  filteredTransactions = transactions.filter((t) => {
    if (!t.date) return false; // skip transactions without date
    const txDate = new Date(t.date);

    if (from && txDate < new Date(from)) return false;
    if (to && txDate > new Date(to)) return false;

    return true;
  });

  updateCards(); // Update summary cards
  createRevenueChart(); // Update revenue chart
  createPlanChart(); // Update plan chart
}

function resetFilter() {
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  filteredTransactions = [...transactions];

  updateCards(); // Update summary cards
  createRevenueChart(); // Update revenue chart
  createPlanChart(); // Update plan chart
}

// Export PDF
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape"); // 🔹 Landscape mode

  // 🔹 Decide which data to export
  const exportData =
    filteredTransactions && filteredTransactions.length > 0
      ? filteredTransactions
      : transactions;

  // 🔹 Add title
  doc.setFontSize(16);
  doc.setFontSize(18);
  doc.text("NEXA", 14, 20);

  doc.setFontSize(16);
  doc.text("Transactions Report", 14, 30); // moved below

  // 🔹 Show applied date range (if any)
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;

  // Start position for table
  let nextY = 40;

  if (from || to) {
    let rangeText = "Date Range: ";
    rangeText += from ? from : "All";
    rangeText += " to ";
    rangeText += to ? to : "All";

    doc.setFontSize(12);
    doc.text(rangeText, 14, nextY);

    nextY += 10; // ✅ Add gap below the date range before table
  }

  // 🔹 Prepare table data
  const tableData = exportData.map((t, index) => {
    const matchedPlan = plans.find((p) => p.name === t.plan);
    const price = matchedPlan ? matchedPlan.price : "-";

    return [
      index + 1, // S.No
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

  // 🔹 Define table headers
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

  // 🔹 Generate table with proper spacing
  doc.autoTable({
    head: headers,
    body: tableData,
    startY: nextY, // ✅ Dynamic start position
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246] }, // blue header
    alternateRowStyles: { fillColor: [245, 245, 245] }, // zebra striping
    columnStyles: {
      0: { cellWidth: 15 }, // S.No
      1: { cellWidth: 30 }, // Transaction ID
      2: { cellWidth: 35 }, // Name
      3: { cellWidth: 35 }, // Phone
      4: { cellWidth: 25 }, // Type
      5: { cellWidth: 55 }, // Plan
      6: { cellWidth: 20 }, // Price
      7: { cellWidth: 30 }, // Date
      8: { cellWidth: 25 }, // Status
    },
  });

  // 🔹 Save PDF
  doc.save("recharge_transactions_report.pdf");
}

fetchReportData();

// function createPlanChart() {
//   const ctx = document.getElementById("planChart").getContext("2d");
//   const planRevenue = {};

//   filteredTransactions
//     .filter((t) => t.status === "Success")
//     .forEach((t) => {
//       const plan = plans.find((p) => p.name === t.plan);
//       if (!plan) return;
//       planRevenue[t.plan] = (planRevenue[t.plan] || 0) + parseFloat(plan.price);
//     });

//   const labels = Object.keys(planRevenue);
//   const data = Object.values(planRevenue);

//   // Generate soft pastel-like colors, evenly spread across the wheel
//   const backgroundColors = labels.map((_, i) => {
//     const hue = (i * 360) / labels.length; // evenly spread hues
//     return `hsl(${hue}, 50%, 75%)`; // softer pastel tones
//   });

//   if (planChart) planChart.destroy();
//   planChart = new Chart(ctx, {
//     type: "pie",
//     data: {
//       labels,
//       datasets: [
//         {
//           label: "Revenue by Plan",
//           data,
//           backgroundColor: backgroundColors,
//           hoverOffset: 10,
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       plugins: {
//         legend: {
//           position: "bottom",
//           labels: {
//             usePointStyle: true,
//             padding: 20,
//           },
//         },
//       },
//     },
//   });
// }
