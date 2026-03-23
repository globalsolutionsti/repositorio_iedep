// 🔥 TU CÓDIGO ORIGINAL + FIXES (NO OPTIMIZADO AGRESIVO)

const API = "https://script.google.com/macros/s/AKfycbzKmRl5XGRXwIvE3iQi8NGh7VBEcXhHNz28THYY3OxNo2oekkH_DfpxSMryDbxWlSpO/exec";

// 🔥 CERRAR TOOLTIPS
document.addEventListener("click", () => {
  document.querySelectorAll(".metadata-tooltip").forEach(t => {
    t.classList.add("hidden");
  });
});

/* ========================= */
let padreActual = 0;
let padreDrive = "";
let ruta = [];
let user = null;

let vista = "grid";
let dataActual = [];
let filtroTipo = "todos";
let textoBusqueda = "";

let favoritos = [];
let archivoActualNota = null;

let itemEliminar = null;
let eliminando = false;

/* ========================= */
document.addEventListener("DOMContentLoaded", () => {

  try {
    const data = localStorage.getItem("usuario");
    if (data && data !== "undefined") user = JSON.parse(data);
  } catch {}

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("nombreUsuario").innerText = user.nombre;

  generarMenu();
  aplicarPermisos();

  initDragDrop();
  init();
});

/* ========================= */
function generarMenu() {
  const menu = document.getElementById("menu");
  menu.innerHTML = `
    <a onclick="irRaiz()">📂 Documentos</a>
    <a onclick="verFavoritos()">⭐ Favoritos</a>
  `;
}

/* ========================= */
async function safeFetch(url, options = null) {
  const res = await fetch(url, options);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Respuesta inválida:", text);
    throw new Error("JSON inválido");
  }
}

/* ========================= */
function init() {

  safeFetch(`${API}?action=getRoot`)
    .then(root => {

      padreActual = root.id;
      padreDrive = root.drive;

      ruta = [{
        id: root.id,
        nombre: root.nombre,
        drive: root.drive
      }];

      actualizarRuta();
      cargar();

    })
    .catch(() => toast("Error raíz"));

  cargarFavoritosUsuario();
}

/* ========================= */
function cargar() {

  showGlobalLoader();

  safeFetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(data => {

      if (data.data) data = data.data;

      dataActual = data;
      aplicarFiltros();

    })
    .catch(() => toast("Error carga"))
    .finally(() => hideGlobalLoader());
}

/* ========================= */
function aplicarFiltros() {

  let filtrado = [...dataActual];

  if (textoBusqueda) {
    filtrado = filtrado.filter(row => {
      const nombre = Array.isArray(row) ? row[1] : row.nombre;
      return nombre.toLowerCase().includes(textoBusqueda);
    });
  }

  render(filtrado);
}

/* ========================= */
function render(data) {

  const contenedor = document.getElementById("explorador"); // 🔥 FIX
  contenedor.innerHTML = "";

  data.forEach(itemData => {

    const id = Array.isArray(itemData) ? itemData[0] : itemData.id;
    const nombre = Array.isArray(itemData) ? itemData[1] : itemData.nombre;
    const tipo = Array.isArray(itemData) ? itemData[2] : itemData.tipo;
    const driveId = Array.isArray(itemData) ? itemData[3] : itemData.driveId;

    const item = document.createElement("div");
    item.className = "card-item";

    item.innerHTML = `
      <div class="acciones-item">
        <span class="favorito">⭐</span>
        <span class="eliminar">🗑️</span>
      </div>

      <div class="icono">${tipo === "carpeta" ? "📁" : "📄"}</div>
      <div class="nombre">${nombre}</div>

      <div class="metadata-tooltip hidden"></div>
    `;

    item.querySelector(".favorito").onclick = (e) => {
      e.stopPropagation();
      toggleFavorito(id);
    };

    item.querySelector(".eliminar").onclick = (e) => {
      e.stopPropagation();
      eliminarItem(id, nombre);
    };

    item.addEventListener("click", (e) => {

      e.stopPropagation();

      const tooltip = item.querySelector(".metadata-tooltip");

      if (!tooltip.classList.contains("hidden")) {
        abrir(id, tipo, driveId, nombre);
        return;
      }

      document.querySelectorAll(".metadata-tooltip").forEach(t => {
        t.classList.add("hidden");
      });

      tooltip.classList.remove("hidden");
      cargarMetadata(id, item);
    });

    contenedor.appendChild(item);
  });
}

/* ========================= */
function abrir(id, tipo, driveId, nombre) {

  if (tipo === "carpeta") {

    padreActual = id;
    padreDrive = driveId;

    ruta.push({ id, nombre, drive: driveId });

    actualizarRuta();
    cargar();

  } else {
    previewArchivo(driveId);
  }
}

/* ========================= */
function previewArchivo(driveId) {

  const modal = document.getElementById("previewModal");
  const frame = document.getElementById("previewFrame");

  frame.src = `https://drive.google.com/file/d/${driveId}/preview`;

  modal.classList.remove("hidden");

  modal.querySelector(".modal-content").style.width = "90%";
  modal.querySelector(".modal-content").style.height = "90%";
}

/* ========================= */
function toggleFavorito(id) {

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "toggleFavorito",
      usuario: user.usuario,
      item_id: id
    })
  })
  .then(() => {
    toast("Favorito actualizado");
  });
}

/* ========================= */
function verFavoritos() {

  showGlobalLoader();

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "obtenerFavoritos",
      usuario: user.usuario
    })
  })
  .then(res => {

    if (!res || !res.data) throw "error";

    dataActual = res.data;
    render(dataActual);

    document.getElementById("ruta").innerText = "⭐ Favoritos";

  })
  .catch(() => toast("Error favoritos"))
  .finally(() => hideGlobalLoader());
}

/* ========================= */
function cargarFavoritosUsuario() {
  // Se deja intacto como fallback
}

/* ========================= */
function eliminarItem(id, nombre) {

  itemEliminar = { id, nombre };

  document.getElementById("confirmText").innerText =
    `¿Eliminar "${nombre}"?`;

  document.getElementById("confirmModal").classList.remove("hidden");
}

function cerrarConfirm() {
  document.getElementById("confirmModal").classList.add("hidden");
}

function confirmarEliminar() {

  if (!itemEliminar) return;

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "eliminar",
      item_id: itemEliminar.id,
      usuario: user.usuario
    })
  })
  .then(() => {
    toast("Eliminado");
    cargar();
  });

  cerrarConfirm();
}

/* ========================= */
function cargarMetadata(id, element) {

  const tooltip = element.querySelector(".metadata-tooltip");

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "obtenerMetadata",
      archivo_id: id
    })
  })
  .then(res => {

    let html = "<strong>Versiones:</strong><br>";

    (res.versiones || []).forEach(v => {
      html += `v${v[2]} - ${v[3]}<br>`;
    });

    html += "<br><strong>Notas:</strong><br>";

    (res.notas || []).forEach(n => {
      html += `• ${n[2]}<br>`;
    });

    tooltip.innerHTML = html;
  });
}

/* ========================= */
function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}
