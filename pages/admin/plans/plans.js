function loadComponent(id, filepath) {
  fetch(filepath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
    })
    .catch((error) => console.error("Error loading navbar:", error));
}

loadComponent("navbar", "/components/navbar.html");
loadComponent("sidebar", "/components/admin-sidebar.html");
