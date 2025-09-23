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

    // Remove any existing highlight classes first
    link.classList.remove(
      "bg-purple-600",
      "text-white",
      "rounded-lg",
      "hover:bg-purple-700"
    );
    link.classList.add("text-gray-200");

    // Check if this is the settings link and we're on a settings page
    if (
      href.includes("settings/settings.html") &&
      currentPath.includes("settings")
    ) {
      link.classList.remove("text-gray-200");
      link.classList.add(
        "bg-purple-600",
        "text-white",
        "rounded-lg",
        "hover:bg-purple-700"
      );
      return;
    }

    // For other pages, use the original logic but improved
    let targetPath = href.replace("../", "");

    // Handle different possible path formats
    if (
      currentPath.endsWith(targetPath) ||
      currentPath.includes(targetPath.replace(".html", "")) ||
      (targetPath.includes("/") &&
        currentPath.includes(targetPath.split("/")[0]))
    ) {
      link.classList.remove("text-gray-200");
      link.classList.add(
        "bg-purple-600",
        "text-white",
        "rounded-lg",
        "hover:bg-purple-700"
      );
    }
  });
}

// Also call highlightActiveLink when the page loads, in case the sidebar is already loaded
document.addEventListener("DOMContentLoaded", function () {
  // Wait a bit for the sidebar to load, then highlight
  setTimeout(highlightActiveLink, 100);
});
