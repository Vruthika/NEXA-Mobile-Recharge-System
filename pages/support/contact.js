// Enhanced FAQ functionality
function toggleFAQ(element) {
  const faqItem = element.parentElement;
  const answer = faqItem.querySelector(".enhanced-faq-answer");
  const icon = element.querySelector(".faq-icon i");

  // Close all other FAQ items
  document.querySelectorAll(".enhanced-faq-item").forEach((item) => {
    if (item !== faqItem && item.classList.contains("active")) {
      item.classList.remove("active");
      const otherIcon = item.querySelector(".faq-icon i");
      otherIcon.className = "fas fa-plus";
    }
  });

  // Toggle current FAQ item
  if (faqItem.classList.contains("active")) {
    faqItem.classList.remove("active");
    icon.className = "fas fa-plus";
  } else {
    faqItem.classList.add("active");
    icon.className = "fas fa-minus";
  }
}

// Live chat functionality
function startLiveChat() {
  // Add a visual feedback
  const chatBtn = event.target;
  const originalText = chatBtn.textContent;
  chatBtn.textContent = "Connecting...";
  chatBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";

  setTimeout(() => {
    alert(
      "Live chat feature will be available soon! Please use our phone support or email for immediate assistance."
    );
    chatBtn.textContent = originalText;
    chatBtn.style.background = "linear-gradient(135deg, #3b82f6, #8b5cf6)";
  }, 1500);
}

// Component loading functionality
function loadComponent(id, filepath) {
  return fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;

      if (id === "navbar") {
        let retryCount = 0;
        const maxRetries = 10;

        function tryInitNavbar() {
          if (initializeNavbar()) {
            console.log("Navbar initialized on attempt", retryCount + 1);
            return;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(tryInitNavbar, 100);
          } else {
            console.warn(
              "Failed to initialize navbar after",
              maxRetries,
              "attempts"
            );
          }
        }

        setTimeout(tryInitNavbar, 50);
      }
    })
    .catch((error) => console.error("Error loading component:", error));
}

// Initialize components
document.addEventListener("DOMContentLoaded", function () {
  Promise.all([
    loadComponent("navbar", "/components/navbar.html"),
    loadComponent("footer", "/components/footer.html"),
  ]).then(() => {
    document.dispatchEvent(new Event("navloaded"));
  });

  // Add smooth scroll behavior for better UX
  document.documentElement.style.scrollBehavior = "smooth";

  // Add intersection observer for animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = "running";
      }
    });
  });

  document
    .querySelectorAll(".enhanced-support-card, .enhanced-faq-item")
    .forEach((el) => {
      observer.observe(el);
    });
});

// Navbar functionality
function initializeNavbar() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const hamburgerLines = document.querySelectorAll(
    ".hamburger-line-1, .hamburger-line-2, .hamburger-line-3"
  );

  if (!mobileMenuBtn || !mobileMenu || hamburgerLines.length === 0) {
    console.log("Navbar elements not found, retrying...");
    return false;
  }

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;

    if (isMenuOpen) {
      mobileMenu.classList.remove(
        "-translate-y-full",
        "opacity-0",
        "invisible"
      );
      mobileMenu.classList.add("translate-y-0", "opacity-100", "visible");

      hamburgerLines[0].style.transform = "rotate(45deg) translate(6px, 6px)";
      hamburgerLines[1].style.opacity = "0";
      hamburgerLines[2].style.transform = "rotate(-45deg) translate(6px, -6px)";

      document.body.style.overflow = "hidden";
    } else {
      mobileMenu.classList.remove("translate-y-0", "opacity-100", "visible");
      mobileMenu.classList.add("-translate-y-full", "opacity-0", "invisible");

      hamburgerLines[0].style.transform = "";
      hamburgerLines[1].style.opacity = "1";
      hamburgerLines[2].style.transform = "";

      document.body.style.overflow = "";
    }
  }

  const newMobileMenuBtn = mobileMenuBtn.cloneNode(true);
  mobileMenuBtn.parentNode.replaceChild(newMobileMenuBtn, mobileMenuBtn);

  newMobileMenuBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  const menuLinks = mobileMenu.querySelectorAll("a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (isMenuOpen) {
        toggleMenu();
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (
      isMenuOpen &&
      !mobileMenu.contains(event.target) &&
      !newMobileMenuBtn.contains(event.target)
    ) {
      toggleMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isMenuOpen) {
      toggleMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024 && isMenuOpen) {
      toggleMenu();
    }
  });

  console.log("Navbar initialized successfully");
  return true;
}
