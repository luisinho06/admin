const userListContainer = document.querySelector("#userlist-container");

async function loadUserList() {
  try {
    const response = await fetch("../components/userlist.html");
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    userListContainer.innerHTML = await response.text();
    initializeUserTable();
  } catch (error) {
    console.error("No se pudo cargar la tabla de usuarios:", error);
    userListContainer.textContent = "No se pudo cargar la tabla. Abre esta página desde un servidor local.";
  }
}

function initializeUserTable() {
  let users = [
    { id: "USR-001", firstName: "María", lastName: "López", email: "maria.lopez@empresa.com", role: "Administrador", active: true },
    { id: "USR-002", firstName: "Carlos", lastName: "Ruiz", email: "carlos.ruiz@empresa.com", role: "Supervisor", active: true },
    { id: "USR-003", firstName: "Andrea", lastName: "Díaz", email: "andrea.diaz@empresa.com", role: "Inventario", active: true },
    { id: "USR-004", firstName: "Javier", lastName: "Mendoza", email: "javier.mendoza@empresa.com", role: "Inventario", active: false },
  ];
  let nextId = users.length + 1;
  let editingId = null;
  let deletingId = null;

  const tableBody = document.querySelector("#users-table-body");
  const search = document.querySelector("#user-search");
  const form = document.querySelector("#user-form");
  const formModalElement = document.querySelector("#user-form-modal");
  const detailsModalElement = document.querySelector("#user-details-modal");
  const deleteModalElement = document.querySelector("#user-delete-modal");
  const formModal = bootstrap.Modal.getOrCreateInstance(formModalElement);
  const detailsModal = bootstrap.Modal.getOrCreateInstance(detailsModalElement);
  const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalElement);
  const modalTriggers = new WeakMap();

  function showModal(modal, element) {
    modalTriggers.set(element, document.activeElement);
    modal.show();
  }

  document.querySelectorAll(".modal").forEach((modalElement) => {
    modalElement.addEventListener("hide.bs.modal", () => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && modalElement.contains(activeElement)) {
        activeElement.blur();
      }
    });
    modalElement.addEventListener("hidden.bs.modal", () => {
      const trigger = modalTriggers.get(modalElement);
      (trigger?.isConnected ? trigger : document.querySelector("#add-user-button"))?.focus();
    });
  });

  function addAction(menu, action, label, icon, destructive = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `dropdown-item${destructive ? " user-action-delete" : ""}`;
    button.dataset.userAction = action;
    button.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i> ${label}`;
    menu.append(button);
  }

  function createRow(user) {
    const row = document.createElement("tr");
    row.dataset.userId = user.id;
    for (const value of [user.id, user.firstName, user.lastName, user.email]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    const roleCell = document.createElement("td");
    const roleBadge = document.createElement("span");
    roleBadge.className = `user-role-badge role-${user.role.toLowerCase()}`;
    roleBadge.textContent = user.role;
    const stateBadge = document.createElement("span");
    stateBadge.className = `user-state-badge ${user.active ? "user-state-active" : "user-state-inactive"}`;
    stateBadge.textContent = user.active ? "Activo" : "Inactivo";
    roleCell.append(roleBadge, stateBadge);
    row.append(roleCell);

    const actionsCell = document.createElement("td");
    actionsCell.className = "users-actions-cell";
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn user-actions-toggle";
    toggle.dataset.bsToggle = "dropdown";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", `Acciones para ${user.firstName} ${user.lastName}`);
    toggle.innerHTML = '<i class="bi bi-three-dots" aria-hidden="true"></i>';
    const menu = document.createElement("div");
    menu.className = "dropdown-menu dropdown-menu-end user-actions-menu";
    addAction(menu, "details", "Detalles", "bi-eye");
    addAction(menu, "edit", "Editar", "bi-pencil");
    addAction(menu, "toggle", user.active ? "Desactivar" : "Activar", user.active ? "bi-person-dash" : "bi-person-check");
    addAction(menu, "delete", "Eliminar", "bi-trash", true);
    dropdown.append(toggle, menu);
    actionsCell.append(dropdown);
    row.append(actionsCell);
    return row;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase("es");
    const filteredUsers = users.filter((user) =>
      [user.id, user.firstName, user.lastName, user.email, user.role]
        .some((value) => value.toLocaleLowerCase("es").includes(query)),
    );
    tableBody.replaceChildren(...filteredUsers.map(createRow));
    document.querySelector("#users-result-count").textContent =
      `Mostrando ${filteredUsers.length} de ${users.length} usuarios`;

    if (filteredUsers.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.className = "users-empty-state";
      cell.textContent = "No se encontraron usuarios.";
      row.append(cell);
      tableBody.append(row);
    }
  }

  document.querySelector("#add-user-button").addEventListener("click", () => {
    editingId = null;
    form.reset();
    document.querySelector("#user-form-title").textContent = "Añadir usuario";
    document.querySelector("#user-form-error").hidden = true;
    showModal(formModal, formModalElement);
  });

  search.addEventListener("input", render);

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-user-action]");
    if (!button) return;
    const row = button.closest("tr[data-user-id]");
    const user = users.find((item) => item.id === row?.dataset.userId);
    if (!user) return;

    if (button.dataset.userAction === "details") {
      const list = document.querySelector("#user-details-list");
      list.replaceChildren();
      for (const [label, value] of [
        ["ID", user.id],
        ["Nombre", user.firstName],
        ["Apellido", user.lastName],
        ["Email", user.email],
        ["Role", user.role],
        ["Estado", user.active ? "Activo" : "Inactivo"],
      ]) {
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        list.append(term, description);
      }
      showModal(detailsModal, detailsModalElement);
    } else if (button.dataset.userAction === "edit") {
      editingId = user.id;
      document.querySelector("#user-form-title").textContent = "Editar usuario";
      document.querySelector("#user-first-name").value = user.firstName;
      document.querySelector("#user-last-name").value = user.lastName;
      document.querySelector("#user-email").value = user.email;
      document.querySelector("#user-role").value = user.role;
      document.querySelector("#user-form-error").hidden = true;
      showModal(formModal, formModalElement);
    } else if (button.dataset.userAction === "toggle") {
      user.active = !user.active;
      render();
    } else if (button.dataset.userAction === "delete") {
      deletingId = user.id;
      document.querySelector("#user-delete-message").textContent =
        `¿Quieres eliminar a ${user.firstName} ${user.lastName}?`;
      showModal(deleteModal, deleteModalElement);
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const email = document.querySelector("#user-email").value.trim();
    const duplicate = users.some((user) =>
      user.email.toLowerCase() === email.toLowerCase() && user.id !== editingId,
    );
    const error = document.querySelector("#user-form-error");
    if (duplicate) {
      error.textContent = "Ya existe una cuenta con ese email.";
      error.hidden = false;
      return;
    }

    const details = {
      firstName: document.querySelector("#user-first-name").value.trim(),
      lastName: document.querySelector("#user-last-name").value.trim(),
      email,
      role: document.querySelector("#user-role").value,
    };
    if (editingId) {
      Object.assign(users.find((user) => user.id === editingId), details);
    } else {
      users.push({ id: `USR-${String(nextId).padStart(3, "0")}`, ...details, active: true });
      nextId += 1;
    }
    formModal.hide();
    render();
  });

  document.querySelector("#confirm-delete-user").addEventListener("click", () => {
    users = users.filter((user) => user.id !== deletingId);
    deletingId = null;
    deleteModal.hide();
    render();
  });

  render();
}

if (userListContainer) {
  loadUserList();
}
