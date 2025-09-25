// Mobile menu functionality - will be initialized after navbar loads
let mobileMenuInitialized = false;

function initializeMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  // Check if elements exist and haven't been initialized yet
  if (!mobileMenuBtn || !mobileMenu || mobileMenuInitialized) {
    return false;
  }

  const hamburgerLines = document.querySelectorAll(
    ".hamburger-line-1, .hamburger-line-2, .hamburger-line-3"
  );

  function toggleMobileMenu() {
    const isHidden = mobileMenu.classList.contains("hidden");

    if (isHidden) {
      // Show menu
      mobileMenu.classList.remove("hidden");
      // Animate hamburger to X
      hamburgerLines.forEach((line, index) => {
        line.classList.add("active");
      });
    } else {
      // Hide menu
      mobileMenu.classList.add("hidden");
      // Animate X back to hamburger
      hamburgerLines.forEach((line, index) => {
        line.classList.remove("active");
      });
    }
  }

  mobileMenuBtn.addEventListener("click", toggleMobileMenu);

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !mobileMenuBtn.contains(e.target) &&
      !mobileMenu.contains(e.target) &&
      !mobileMenu.classList.contains("hidden")
    ) {
      toggleMobileMenu();
    }
  });

  // Close mobile menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mobileMenu.classList.contains("hidden")) {
      toggleMobileMenu();
    }
  });

  // Close mobile menu when screen size changes to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024 && !mobileMenu.classList.contains("hidden")) {
      toggleMobileMenu();
    }
  });

  mobileMenuInitialized = true;
  console.log("Mobile menu initialized successfully");
  return true;
}

// Toast notification function
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
  toast.textContent = message;

  const container = document.getElementById("toastContainer");
  if (container) {
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove("translate-x-full"), 100);

    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

function startLiveChat() {
  showToast("Live chat feature coming soon!", "info");
}

function emailSupport() {
  window.open("mailto:support@nexa.com?subject=Support Request");
}

// Carousel functionality
function initializeCarousel() {
  const carousel = document.getElementById("carousel");
  const dotsContainer = document.getElementById("carousel-dots");
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");

  // Check if carousel elements exist
  if (!carousel || !dotsContainer) {
    console.warn("Carousel elements not found");
    return;
  }

  const items = document.querySelectorAll(".carousel-item");
  const totalItems = items.length;

  if (totalItems === 0) {
    console.warn("No carousel items found");
    return;
  }

  let dots = [];
  let currentIndex = 0;
  let autoScrollInterval;

  // Create dots based on number of items
  for (let i = 0; i < totalItems; i++) {
    const dot = document.createElement("button");
    dot.classList.add(
      "w-2.5",
      "h-2.5",
      "rounded-full",
      "transition-colors",
      "mx-1"
    );

    if (i === 0) {
      dot.classList.add("bg-primary");
    } else {
      dot.classList.add("bg-gray-300", "dark:bg-gray-600");
    }

    dot.addEventListener("click", () => {
      goToSlide(i);
    });

    dotsContainer.appendChild(dot);
    dots.push(dot);
  }

  // Navigation functions
  function goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= totalItems) index = totalItems - 1;

    currentIndex = index;
    const itemWidth = items[0].clientWidth;
    const scrollPosition = currentIndex * itemWidth;

    carousel.scrollTo({
      left: scrollPosition,
      behavior: "smooth",
    });

    updateDots(currentIndex);
    updateNavButtons();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  // Update dots function
  function updateDots(activeIndex) {
    dots.forEach((dot, i) => {
      if (i === activeIndex) {
        dot.classList.add("bg-primary");
        dot.classList.remove("bg-gray-300", "dark:bg-gray-600");
      } else {
        dot.classList.remove("bg-primary");
        dot.classList.add("bg-gray-300", "dark:bg-gray-600");
      }
    });
  }

  // Update navigation buttons
  function updateNavButtons() {
    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
      prevBtn.style.opacity = currentIndex === 0 ? "0.5" : "1";
    }
    if (nextBtn) {
      nextBtn.disabled = currentIndex === totalItems - 1;
      nextBtn.style.opacity = currentIndex === totalItems - 1 ? "0.5" : "1";
    }
  }

  // Event listeners for navigation buttons
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);

  // Update dots on scroll
  carousel.addEventListener("scroll", () => {
    const itemWidth = items[0].clientWidth;
    const scrollLeft = carousel.scrollLeft;
    const newIndex = Math.round(scrollLeft / itemWidth);

    if (newIndex !== currentIndex) {
      currentIndex = newIndex;
      updateDots(currentIndex);
      updateNavButtons();
    }
  });

  // Auto-scroll functionality
  function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
      if (currentIndex < totalItems - 1) {
        nextSlide();
      } else {
        goToSlide(0);
      }
    }, 5000);
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
    }
  }

  // Start auto-scroll on page load
  startAutoScroll();

  // Pause auto-scroll on hover
  carousel.addEventListener("mouseenter", stopAutoScroll);
  carousel.addEventListener("mouseleave", startAutoScroll);

  // Pause auto-scroll when interacting with navigation
  if (prevBtn) {
    prevBtn.addEventListener("mouseenter", stopAutoScroll);
    prevBtn.addEventListener("mouseleave", startAutoScroll);
  }
  if (nextBtn) {
    nextBtn.addEventListener("mouseenter", stopAutoScroll);
    nextBtn.addEventListener("mouseleave", startAutoScroll);
  }

  // Initialize navigation buttons
  updateNavButtons();

  // Handle window resize
  window.addEventListener("resize", () => {
    goToSlide(currentIndex); // Re-center current slide
  });
}

// FAQ accordion functionality
function initializeFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");

  if (faqItems.length === 0) {
    console.warn("No FAQ items found");
    return;
  }

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    if (question) {
      question.addEventListener("click", () => {
        // Close all other items
        faqItems.forEach((otherItem) => {
          if (otherItem !== item && otherItem.classList.contains("active")) {
            otherItem.classList.remove("active");
          }
        });

        // Toggle current item
        item.classList.toggle("active");
      });
    }
  });
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing components...");

  // Initialize components that don't depend on navbar
  initializeCarousel();
  initializeFAQ();

  // Try to initialize mobile menu immediately
  initializeMobileMenu();

  // If mobile menu not initialized (navbar not loaded yet), set up polling
  if (!mobileMenuInitialized) {
    console.log("Mobile menu elements not found, starting polling...");
    const navbarCheckInterval = setInterval(() => {
      if (initializeMobileMenu()) {
        console.log("Mobile menu initialized via polling");
        clearInterval(navbarCheckInterval);
      }
    }, 100); // Check every 100ms

    // Stop checking after 5 seconds to avoid infinite loop
    setTimeout(() => {
      clearInterval(navbarCheckInterval);
      if (!mobileMenuInitialized) {
        console.warn("Mobile menu elements not found after 5 seconds");
      }
    }, 5000);
  }
});

// Optional: If you can modify navbar-loader.js, add this event listener
document.addEventListener("navbarLoaded", function () {
  console.log("Navbar loaded event received");
  initializeMobileMenu();
});
