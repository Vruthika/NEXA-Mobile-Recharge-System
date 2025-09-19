// Password visibility toggle
function togglePassword() {
  const passwordInput = document.getElementById("password");
  const eyeOpen = document.getElementById("eye-open");
  const eyeClosed = document.getElementById("eye-closed");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeOpen.classList.add("hidden");
    eyeClosed.classList.remove("hidden");
  } else {
    passwordInput.type = "password";
    eyeOpen.classList.remove("hidden");
    eyeClosed.classList.add("hidden");
  }
}

// Form handling JavaScript
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value.trim(),
    };

    // Basic validation
    if (!formData.email || !formData.password) {
      showError("Please fill in all fields");
      return;
    }

    // Validate email or phone format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    if (!emailRegex.test(formData.email) && !phoneRegex.test(formData.email)) {
      showError("Please enter a valid email or phone number");
      return;
    }

    if (formData.password.length < 6 && formData.email !== "admin@gmail.com") {
      // 👆 Skip password length check for admin since it's "admin"
      showError("Password must be at least 6 characters long");
      return;
    }

    // Show loading state
    showLoading(true);

    try {
      // 👇 Check for Admin Login first
      if (
        formData.email === "admin@gmail.com" &&
        formData.password === "admin@123"
      ) {
        showLoading(false);
        showSuccessMessage();
        localStorage.setItem("role", "admin");

        // Redirect to admin dashboard
        setTimeout(() => {
          window.location.href = "../../admin/dashboard/dashboard.html";
        }, 1500);
        return;
      }

      // Fetch customer data from API
      const response = await fetch(customerURL);
      const customers = await response.json();

      // Check if user exists
      const matchedCustomer = customers.find(
        (customer) =>
          (customer.phone === formData.email ||
            customer.email === formData.email) &&
          customer.password === formData.password
      );

      if (matchedCustomer) {
        showLoading(false);
        showSuccessMessage();
        localStorage.setItem("customerId", matchedCustomer.id);
        localStorage.setItem("role", "customer");

        // Redirect to customer dashboard
        setTimeout(() => {
          window.location.href = "../../customer/dashboard/dashboard.html";
        }, 1500);
      } else {
        showLoading(false);
        showError("Invalid credentials. Please try again.");
      }
    } catch (error) {
      showLoading(false);
      console.error("Login error:", error);
      showError("Something went wrong. Please try again later.");
    }
  });

function showError(message) {
  const errorDiv = document.getElementById("form-error");
  if (!errorDiv) return; // safety check

  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");

  // Auto-hide after 5s
  setTimeout(() => {
    errorDiv.classList.add("hidden");
    errorDiv.textContent = "";
  }, 5000);
}

function showLoading(isLoading) {
  const loginText = document.getElementById("login-text");
  const loginSpinner = document.getElementById("login-spinner");
  const submitButton = document.querySelector('button[type="submit"]');

  if (isLoading) {
    loginText.classList.add("hidden");
    loginSpinner.classList.remove("hidden");
    submitButton.disabled = true;
    submitButton.style.opacity = "0.7";
  } else {
    loginText.classList.remove("hidden");
    loginSpinner.classList.add("hidden");
    submitButton.disabled = false;
    submitButton.style.opacity = "1";
  }
}

function showSuccessMessage() {
  document.getElementById("success-message").classList.remove("hidden");
}

function closeSuccessMessage() {
  document.getElementById("success-message").classList.add("hidden");
  // Reset form
  document.getElementById("loginForm").reset();
}

// Add floating animation to background elements
document.addEventListener("DOMContentLoaded", function () {
  const circles = document.querySelectorAll(".animate-float-login");
  circles.forEach((circle, index) => {
    circle.style.animationDelay = `${index * 2}s`;
  });
});

// Add ripple effect to button
document.querySelector(".btn-primary").addEventListener("click", function (e) {
  const button = e.currentTarget;
  const ripple = document.createElement("span");

  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;

  if (!document.querySelector("#ripple-keyframes")) {
    const style = document.createElement("style");
    style.id = "ripple-keyframes";
    style.textContent = `
          @keyframes ripple {
            to { transform: scale(4); opacity: 0; }
          }
        `;
    document.head.appendChild(style);
  }

  button.style.position = "relative";
  button.style.overflow = "hidden";
  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
});

// Handle touch interactions on mobile
if ("ontouchstart" in window) {
  document.querySelectorAll(".input-enhanced").forEach((input) => {
    input.addEventListener("touchstart", function () {
      this.style.transform = "scale(0.98)";
    });

    input.addEventListener("touchend", function () {
      this.style.transform = "scale(1)";
    });
  });
}

const customerURL = "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers";
