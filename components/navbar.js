document.addEventListener("navloaded", function () {
  function handleLogout() {
    // Clear user details
    localStorage.removeItem("loggedInPhone");
    localStorage.removeItem("loggedInUser");
    // Redirect to login page (adjust path if needed)
    window.location.href = "/pages/auth/login/login.html";
  }

  // Attach listeners safely
  const desktopLogout = document.getElementById("logout-btn");
  const mobileLogout = document.getElementById("mobile-logout-btn");

  if (desktopLogout) {
    desktopLogout.addEventListener("click", handleLogout);
  }

  if (mobileLogout) {
    mobileLogout.addEventListener("click", handleLogout);
  }
});
