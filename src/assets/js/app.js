const componentDirectory = new URL("../../components/", document.currentScript.src);

async function loadComponent(container, fileName, componentName) {
  try {
    const response = await fetch(new URL(fileName, componentDirectory));
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    container.innerHTML = await response.text();
  } catch (error) {
    console.error(`No se pudo cargar ${componentName}:`, error);
    container.setAttribute("role", "alert");
    container.textContent = `No se pudo cargar ${componentName}. Comprueba que la página se sirve desde un servidor local.`;
  }
}

const navbarContainer = document.querySelector("#navbar-container");
if (navbarContainer) {
  loadComponent(navbarContainer, "navbar.html", "la navegación");
}

const sidebarContainer = document.querySelector("#sidebar-container");
if (sidebarContainer) {
  loadComponent(sidebarContainer, "sidebar.html", "el menú lateral").then(() => {
    if (window.location.pathname.endsWith("/useradmin.html")) {
      const usersLink = sidebarContainer.querySelector('a[href="../views/useradmin.html"]');
      if (usersLink) {
        sidebarContainer.querySelectorAll(".sidebar-link.active").forEach((link) => {
          link.classList.remove("active");
          link.removeAttribute("aria-current");
        });
        usersLink.classList.add("active");
        usersLink.setAttribute("aria-current", "page");
      }
    }
  });
}
