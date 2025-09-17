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

// Plans Data Fetch
const plansURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans";
let totalCategories = [];
let totalPlans = [];
let filteredPlans = [];

async function fetchPlans() {
  try {
    const res = await fetch(plansURL);
    const plans = await res.json();
    totalCategories = [
      ...new Map(plans.map((plan) => [plan.category, plan.type])).entries(),
    ].map(([category, type]) => ({ category, type }));
    totalPlans = [...plans];
    filteredPlans = [...plans];
    updateCards();
    renderCategory();
    renderPlan();
  } catch (e) {
    console.error("Error fetching plans:", e);
  }
}
fetchPlans();

function updateCards() {
  document.getElementById("totalCategories").innerText = totalCategories.length;

  document.getElementById("totalPlans").innerText = totalPlans.length;
}

let categoryCurrentPage = 1;
let planCurrentPage = 1;
const categoryRowsPerPage = 5;
const planRowsPerPage = 10;

function renderCategory() {
  let tbody = document.getElementById("categoryTable");
  tbody.innerHTML = "";

  let start = (categoryCurrentPage - 1) * categoryRowsPerPage;
  let end = start + categoryRowsPerPage;
  let paginated = totalCategories.slice(start, end);

  paginated.forEach((c, index) => {
    tbody.innerHTML += `
      <tr class="text-center border">
        <td class="p-3 border">${start + index + 1}</td>
        <td class="p-3 border">${c.category}</td>
        <td class="p-3 border">${c.type}</td>
        
        <td class="p-3 flex justify-center space-x-8 ">
           <button class="px-4 py-1 rounded-md flex items-center space-x-2 bg-blue-500 text-white hover:bg-blue-600 transition"
                onclick="viewCategory(${start + index})">
                <span>View</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            </button>

          <button class="px-4 py-1 rounded-md flex items-center space-x-2 bg-green-500 text-white hover:bg-green-600 transition"
            onclick="updateCategory(${start + index})">
            <span>Update</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
        </td>
      </tr>`;
  });

  updateCards();
  renderCategoryPagination();
}

function renderCategoryPagination() {
  let pagination = document.getElementById("categoryPagination");
  pagination.innerHTML = "";

  let totalPages = Math.ceil(totalCategories.length / categoryRowsPerPage);
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
    (categoryCurrentPage === 1
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  prevBtn.disabled = categoryCurrentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (categoryCurrentPage > 1) {
      categoryCurrentPage--;
      renderCategory();
    }
  });
  pagination.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    let button = document.createElement("button");
    button.innerText = i;
    button.className =
      "px-3 py-1 rounded-md " +
      (i === categoryCurrentPage
        ? "bg-purple-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300");

    button.addEventListener("click", () => {
      categoryCurrentPage = i;
      renderCategory();
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
    (categoryCurrentPage === totalPages
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  nextBtn.disabled = categoryCurrentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (categoryCurrentPage < totalPages) {
      categoryCurrentPage++;
      renderCategory();
    }
  });
  pagination.appendChild(nextBtn);
}

function renderPlan() {
  let tbody = document.getElementById("planTable");
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
        
        <td class="p-3 flex justify-center space-x-8 ">
           <button class="px-4 py-1 rounded-md flex items-center space-x-2 bg-blue-500 text-white hover:bg-blue-600 transition"
                onclick="viewCategory(${start + index})">
                <span>View</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            </button>

          <button class="px-4 py-1 rounded-md flex items-center space-x-2 bg-green-500 text-white hover:bg-green-600 transition"
            onclick="updateCategory(${start + index})">
            <span>Update</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
        </td>
      </tr>`;
  });

  updateCards();
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

// Filter Plans
document.addEventListener("DOMContentLoaded", () => {
  const filterDropdown = document.getElementById("filterType");
  if (filterDropdown) {
    filterDropdown.addEventListener("change", (e) => {
      const type = e.target.value;

      if (type === "All") {
        filteredPlans = [...totalPlans];
      } else {
        filteredPlans = totalPlans.filter(
          (p) => p.type.toLowerCase() === type.toLowerCase()
        );
      }

      planCurrentPage = 1;
      renderPlan();
    });
  }
});
