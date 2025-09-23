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

const plansURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";
let totalCategories = [];
let totalPlans = [];
let filteredPlans = [];
let prepaidCategories = [];
let postpaidCategories = [];
let prepaidPlans = [];
let postpaidPlans = [];
let nextPlanId = 1;

async function fetchPlans() {
  try {
    const res = await fetch(plansURL);
    const plans = await res.json();

    // Convert id to number and find the highest ID
    totalPlans = plans.map((plan) => ({
      ...plan,
      id: parseInt(plan.id),
    }));

    nextPlanId = Math.max(...totalPlans.map((p) => p.id)) + 1;

    totalCategories = [
      ...new Map(
        totalPlans.map((plan) => [plan.category, plan.type])
      ).entries(),
    ].map(([category, type]) => ({ category, type }));

    filteredPlans = [...totalPlans];

    prepaidPlans = totalPlans.filter((p) => p.type === "Prepaid");
    postpaidPlans = totalPlans.filter((p) => p.type === "Postpaid");

    // Get unique prepaid categories
    prepaidCategories = [
      ...new Set(prepaidPlans.map((plan) => plan.category)),
    ].map((category) => ({ category, type: "Prepaid" }));

    // Get unique postpaid categories
    postpaidCategories = [
      ...new Set(postpaidPlans.map((plan) => plan.category)),
    ].map((category) => ({ category, type: "Postpaid" }));

    updateCards();
    populateFilterDropdowns();
    renderPlan();
  } catch (e) {
    console.error("Error fetching plans:", e);
    showToast("Error fetching plans", "error");
  }
}

function updateCards() {
  const elements = {
    totalCategories: document.getElementById("totalCategories"),
    prepaidCategories: document.getElementById("prepaidCategories"),
    postpaidCategories: document.getElementById("postpaidCategories"),
    totalPlans: document.getElementById("totalPlans"),
    prepaidPlans: document.getElementById("prepaidPlans"),
    postpaidPlans: document.getElementById("postpaidPlans"),
  };

  // Check if all elements exist before updating
  Object.keys(elements).forEach((key) => {
    if (!elements[key]) {
      console.error(`Element ${key} not found`);
      return;
    }
  });

  if (elements.totalCategories)
    elements.totalCategories.innerText = totalCategories.length;
  if (elements.prepaidCategories)
    elements.prepaidCategories.innerText = prepaidCategories.length;
  if (elements.postpaidCategories)
    elements.postpaidCategories.innerText = postpaidCategories.length;
  if (elements.totalPlans) elements.totalPlans.innerText = totalPlans.length;
  if (elements.prepaidPlans)
    elements.prepaidPlans.innerText = prepaidPlans.length;
  if (elements.postpaidPlans)
    elements.postpaidPlans.innerText = postpaidPlans.length;
}

function populateFilterDropdowns() {
  const categoryFilter = document.getElementById("filterCategory");
  if (!categoryFilter) {
    console.error("Category filter element not found");
    return;
  }

  categoryFilter.innerHTML = '<option value="All">All</option>';

  const uniqueCategories = [...new Set(totalCategories.map((c) => c.category))];
  uniqueCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

let planCurrentPage = 1;
const planRowsPerPage = 10;

function renderPlan() {
  let tbody = document.getElementById("planTable");
  if (!tbody) {
    console.error("Plan table body not found");
    return;
  }

  tbody.innerHTML = "";

  let start = (planCurrentPage - 1) * planRowsPerPage;
  let end = start + planRowsPerPage;
  let paginated = filteredPlans.slice(start, end);

  paginated.forEach((p, index) => {
    tbody.innerHTML += `
            <tr class="text-center border">
              <td class="p-3 border">${start + index + 1}</td>
              <td class="p-3 border">${p.name}</td>
              <td class="p-3 border">Rs.${p.price}</td>
              <td class="p-3 border">${p.category}</td>
              <td class="p-3 border">${p.type}</td>
              
              <td class="p-3 flex justify-center space-x-2 ">
                 <button class="px-3 py-1 rounded-md flex items-center space-x-1 bg-blue-500 text-white hover:bg-blue-600 transition text-sm"
                      onclick="viewPlan(${p.id})">
                      <span>View</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                  </button>

                <button class="px-3 py-1 rounded-md flex items-center space-x-1 bg-green-500 text-white hover:bg-green-600 transition text-sm"
                  onclick="editPlan(${p.id})">
                  <span>Edit</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              </td>
            </tr>`;
  });

  renderPlanPagination();
}

function renderPlanPagination() {
  let pagination = document.getElementById("planPagination");
  pagination.innerHTML = "";

  let totalPages = Math.ceil(filteredPlans.length / planRowsPerPage);
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
    (planCurrentPage === 1
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  prevBtn.disabled = planCurrentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (planCurrentPage > 1) {
      planCurrentPage--;
      renderPlan();
    }
  });
  pagination.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    let button = document.createElement("button");
    button.innerText = i;
    button.className =
      "px-3 py-1 rounded-md " +
      (i === planCurrentPage
        ? "bg-purple-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300");

    button.addEventListener("click", () => {
      planCurrentPage = i;
      renderPlan();
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
    (planCurrentPage === totalPages
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  nextBtn.disabled = planCurrentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (planCurrentPage < totalPages) {
      planCurrentPage++;
      renderPlan();
    }
  });
  pagination.appendChild(nextBtn);
}

// Filter Functions
function setupFilters() {
  const categoryFilter = document.getElementById("filterCategory");
  const typeFilter = document.getElementById("filterType");

  if (categoryFilter) {
    categoryFilter.addEventListener("change", applyFilters);
  } else {
    console.error("Category filter element not found");
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", applyFilters);
  } else {
    console.error("Type filter element not found");
  }
}

function applyFilters() {
  const categoryFilterElement = document.getElementById("filterCategory");
  const typeFilterElement = document.getElementById("filterType");

  if (!categoryFilterElement || !typeFilterElement) {
    console.error("Filter elements not found");
    return;
  }

  const categoryFilter = categoryFilterElement.value;
  const typeFilter = typeFilterElement.value;

  filteredPlans = totalPlans.filter((plan) => {
    const categoryMatch =
      categoryFilter === "All" || plan.category === categoryFilter;
    const typeMatch = typeFilter === "All" || plan.type === typeFilter;
    return categoryMatch && typeMatch;
  });

  planCurrentPage = 1;
  renderPlan();
}

// Modal Functions
function showModal(content) {
  const modalOverlay = document.getElementById("modalOverlay");
  const modal = modalOverlay.querySelector(".bg-white");
  modal.innerHTML = content;
  modalOverlay.classList.remove("hidden");

  // Add event listener to close modal when clicking outside
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Add escape key listener
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
    }
  });
}

function closeModal() {
  const modalOverlay = document.getElementById("modalOverlay");
  modalOverlay.classList.add("hidden");
}

// Add Plan Function
function showAddPlanModal() {
  const modalContent = `
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-800">Add New Plan</h2>
              <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form id="addPlanForm" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input type="text" value="${nextPlanId}" disabled class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                  <input type="text" id="planName" name="planName" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select id="planType" name="planType" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                    <option value="">Select Type</option>
                    <option value="Prepaid">Prepaid</option>
                    <option value="Postpaid">Postpaid</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select id="planCategory" name="planCategory" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                    <option value="">Select Category</option>
                    ${[...new Set(totalCategories.map((c) => c.category))]
                      .map(
                        (category) =>
                          `<option value="${category}">${category}</option>`
                      )
                      .join("")}
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Validity *</label>
                  <input type="text" id="planValidity" name="planValidity" required placeholder="e.g., 28 days" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input type="number" id="planPrice" name="planPrice" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="planDescription" name="planDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="Enter plan description..."></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                <textarea id="planBenefits" name="planBenefits" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="Enter plan benefits (one per line)..."></textarea>
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Add Plan</button>
              </div>
            </form>
          </div>
        `;

  showModal(modalContent);

  // Handle form submission
  document
    .getElementById("addPlanForm")
    .addEventListener("submit", handleAddPlan);
}

async function handleAddPlan(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const planData = {
    id: nextPlanId,
    name: formData.get("planName"),
    type: formData.get("planType"),
    category: formData.get("planCategory"),
    validity: formData.get("planValidity"),
    price: parseFloat(formData.get("planPrice")),
    description: formData.get("planDescription") || "",
    benefits: formData.get("planBenefits") || "",
  };

  try {
    const response = await fetch(plansURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    });

    if (response.ok) {
      showToast("Plan added successfully!", "success");
      closeModal();
      fetchPlans(); // Refresh the data
    } else {
      throw new Error("Failed to add plan");
    }
  } catch (error) {
    console.error("Error adding plan:", error);
    showToast("Error adding plan", "error");
  }
}

// View Plan Function
function viewPlan(planId) {
  const plan = totalPlans.find((p) => p.id === planId);
  if (!plan) return;

  const modalContent = `
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-gray-800">Plan Details</h2>
              <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 mb-1">Plan ID</h3>
                  <p class="text-lg font-semibold text-gray-900">${plan.id}</p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 mb-1">Plan Name</h3>
                  <p class="text-lg font-semibold text-gray-900">${
                    plan.name
                  }</p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 mb-1">Type</h3>
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    plan.type === "Prepaid"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }">${plan.type}</span>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 mb-1">Category</h3>
                  <p class="text-lg font-semibold text-gray-900">${
                    plan.category
                  }</p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 mb-1">Price</h3>
                  <p class="text-lg font-semibold text-green-600">Rs. ${
                    plan.price
                  }</p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 mb-1">Validity</h3>
                  <p class="text-lg font-semibold text-gray-900">${
                    plan.validity || "N/A"
                  }</p>
                </div>
              </div>
              
              ${
                plan.description
                  ? `
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p class="text-gray-900">${plan.description}</p>
                </div>
              `
                  : ""
              }
              
              ${
                plan.benefits &&
                typeof plan.benefits === "string" &&
                plan.benefits.trim()
                  ? `
  <div class="bg-gray-50 p-4 rounded-lg">
    <h3 class="text-sm font-medium text-gray-500 mb-2">Benefits</h3>
    <div class="text-gray-900">
      ${plan.benefits
        .split("\n")
        .map((benefit) => benefit.trim())
        .filter((benefit) => benefit)
        .map((benefit) => `<p class="mb-1">• ${benefit}</p>`)
        .join("")}
    </div>
  </div>
`
                  : ""
              }
            </div>
            
            
          </div>
        `;

  showModal(modalContent);
}

// Edit Plan Function
function editPlan(planId) {
  const plan = totalPlans.find((p) => p.id === planId);
  if (!plan) return;

  const modalContent = `
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-800">Edit Plan</h2>
              <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form id="editPlanForm" class="space-y-4">
              <input type="hidden" name="planId" value="${plan.id}">
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input type="text" value="${
                    plan.id
                  }" disabled class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                  <input type="text" name="planName" value="${
                    plan.name
                  }" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input type="text" value="${
                    plan.type
                  }" disabled class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input type="text" value="${
                    plan.category
                  }" disabled class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Validity *</label>
                  <input type="text" name="planValidity" value="${
                    plan.validity || ""
                  }" required placeholder="e.g., 28 days" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input type="number" name="planPrice" value="${
                    plan.price
                  }" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="planDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="Enter plan description...">${
                  plan.description || ""
                }</textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Benefits *</label>
                <textarea name="planBenefits" rows="3" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="Enter plan benefits (one per line)...">${
                  plan.benefits || ""
                }</textarea>
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Update Plan</button>
              </div>
            </form>
          </div>
        `;

  showModal(modalContent);

  // Handle form submission
  document
    .getElementById("editPlanForm")
    .addEventListener("submit", handleEditPlan);
}

async function handleEditPlan(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const planId = parseInt(formData.get("planId"));

  const planData = {
    name: formData.get("planName"),
    validity: formData.get("planValidity"),
    price: parseFloat(formData.get("planPrice")),
    description: formData.get("planDescription") || "",
    benefits: formData.get("planBenefits"),
  };

  try {
    const response = await fetch(`${plansURL}/${planId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    });

    if (response.ok) {
      showToast("Plan updated successfully!", "success");
      closeModal();
      fetchPlans(); // Refresh the data
    } else {
      throw new Error("Failed to update plan");
    }
  } catch (error) {
    console.error("Error updating plan:", error);
    showToast("Error updating plan", "error");
  }
}

// Toast Notifications
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 translate-x-full`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove("translate-x-full");
  }, 100);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add("translate-x-full");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  // Wait a bit more to ensure all elements are rendered
  setTimeout(() => {
    fetchPlans();
    setupFilters();

    const addPlanBtn = document.getElementById("addPlanBtn");
    if (addPlanBtn) {
      addPlanBtn.addEventListener("click", showAddPlanModal);
    } else {
      console.error("Add plan button not found");
    }
  }, 100);
});
