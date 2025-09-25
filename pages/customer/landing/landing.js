// Mobile menu functionality
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const hamburgerLines = document.querySelectorAll(
  ".hamburger-line-1, .hamburger-line-2, .hamburger-line-3"
);

function toggleMobileMenu() {
  const isHidden = mobileMenu.classList.contains("hidden");

  if (isHidden) {
    // Show menu
    mobileMenu.classList.remove("hidden");
    // Animate hamburger to X
    hamburgerLines[0].classList.add("active");
    hamburgerLines[1].classList.add("active");
    hamburgerLines[2].classList.add("active");
  } else {
    // Hide menu
    mobileMenu.classList.add("hidden");
    // Animate X back to hamburger
    hamburgerLines[0].classList.remove("active");
    hamburgerLines[1].classList.remove("active");
    hamburgerLines[2].classList.remove("active");
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

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  initializeCarousel();
  initializeFAQ();
});

// Carousel functionality
function initializeCarousel() {
  const carousel = document.getElementById("carousel");
  const dotsContainer = document.getElementById("carousel-dots");
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");
  const items = document.querySelectorAll(".carousel-item");
  const totalItems = items.length;
  let dots = [];
  let currentIndex = 0;
  let autoScrollInterval;

  // Create dots based on number of items
  for (let i = 0; i < totalItems; i++) {
    const dot = document.createElement("button");
    dot.classList.add("w-2.5", "h-2.5", "rounded-full", "transition-colors");

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
    const itemWidth = carousel.querySelector(".carousel-item").clientWidth;
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
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === totalItems - 1;
  }

  // Event listeners for navigation buttons
  prevBtn.addEventListener("click", prevSlide);
  nextBtn.addEventListener("click", nextSlide);

  // Update dots on scroll
  carousel.addEventListener("scroll", () => {
    const itemWidth = carousel.querySelector(".carousel-item").clientWidth;
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
    clearInterval(autoScrollInterval);
  }

  // Start auto-scroll on page load
  startAutoScroll();

  // Pause auto-scroll on hover
  carousel.addEventListener("mouseenter", stopAutoScroll);
  carousel.addEventListener("mouseleave", startAutoScroll);

  // Pause auto-scroll when interacting with navigation
  prevBtn.addEventListener("mouseenter", stopAutoScroll);
  nextBtn.addEventListener("mouseenter", stopAutoScroll);
  prevBtn.addEventListener("mouseleave", startAutoScroll);
  nextBtn.addEventListener("mouseleave", startAutoScroll);

  // Initialize navigation buttons
  updateNavButtons();
}

// FAQ accordion functionality
function initializeFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {
      // Close all other items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
        }
      });

      // Toggle current item
      item.classList.toggle("active");
    });
  });
}
