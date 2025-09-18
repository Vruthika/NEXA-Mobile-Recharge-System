// Form handling JavaScript
document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirm-password").value,
    };

    // Basic validation
    if (
      !formData.name ||
      !formData.phone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      showError("Please fill in all fields");
      return;
    }

    // Mobile number validation (10 digits, only numbers starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      showError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    // Show loading state
    showLoading(true);

    // Send data to MockAPI (POST request)
    fetch(customerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        showLoading(false);
        console.log("Raw data from API:", data);

        // Cleaned object (without id, createdAt, avatar)
        const cleaned = {
          name: data.name,
          phone: data.phone,
          password: data.password,
        };
        console.log("Cleaned Data:", cleaned);

        showSuccessMessage();
      })
      .catch((err) => {
        showLoading(false);
        showError("Failed to register user");
        console.error(err);
      });
  });

function showError(message) {
  // Create and show error message
  const errorDiv = document.createElement("div");
  errorDiv.className =
    "fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg z-50 animate-pulse text-sm sm:text-base max-w-sm sm:w-auto mx-auto sm:mx-0";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  // Remove after 3 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

function showLoading(isLoading) {
  const buttonText = document.getElementById("button-text");
  const loadingSpinner = document.getElementById("loading-spinner");
  const submitButton = document.querySelector('button[type="submit"]');

  if (isLoading) {
    buttonText.classList.add("hidden");
    loadingSpinner.classList.remove("hidden");
    submitButton.disabled = true;
    submitButton.style.opacity = "0.7";
  } else {
    buttonText.classList.remove("hidden");
    loadingSpinner.classList.add("hidden");
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
  document.getElementById("registerForm").reset();
  // Redirect to login page
  window.location.href = "../login/login.html";
}

// Add floating animation to background elements
document.addEventListener("DOMContentLoaded", function () {
  const circles = document.querySelectorAll(".animate-float");
  circles.forEach((circle, index) => {
    circle.style.animationDelay = `${index * 1.5}s`;
  });
});

// Add ripple effect to button (optimized for mobile)
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

  // Add ripple keyframe if not exists
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
