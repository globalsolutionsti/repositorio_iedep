const API = "https://script.google.com/macros/s/AKfycbzKmRl5XGRXwIvE3iQi8NGh7VBEcXhHNz28THYY3OxNo2oekkH_DfpxSMryDbxWlSpO/exec";

/* =========================
   🔥 VARIABLES
========================= */
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

/* =========================
   🔥 INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {

  try {
    const data = localStorage.getItem("usuario");
    if (data) user = JSON.parse(data);
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

  // cerrar tooltips al hacer click fuera
  document.addEventListener("click", () => {
    document.querySelectorAll(".metadata-tooltip").forEach(t => {
      t.classList.add("hidden");
    });
  });
});

/* =========================
   🔥 FETCH SEGURO
========================= */
async function safeFetch(url, options = null) {
  const res = await fetch(url, options);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Respuesta inválida:", text);
    throw new Error("JSON inválido");
  }
}

/* =========================
   🔥 INIT ROOT
========================= */
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
    .catch(() => toast("Error cargando raíz"));

  cargarFavoritosUsuario();
  cargarStats();
}

/* =========================
   🔥 CARGAR
========================= */
function cargar() {

  showGlobalLoader();

  safeFetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(data => {

      if (data.data) data = data.data;

      dataActual = data || [];
      aplicarFiltros();

    })
    .catch(() => toast("Error cargando estructura"))
    .finally(() => hideGlobalLoader());
}

/* =========================
   🔥 FILTROS
========================= */
function aplicarFiltros() {

  let filtrado = [...dataActual];

  if (textoBusqueda) {
    filtrado = filtrado.filter(row => {
      const nombre = row.nombre || row[1];
      return nombre.toLowerCase().includes(textoBusqueda);
    });
  }

  render(filtrado);
}

function buscar(valor) {
  textoBusqueda = valor.toLowerCase();
  aplicarFiltros();
}

function filtrarTipo(tipo) {
  filtroTipo = tipo;
  aplicarFiltros();
}

/* =========================
   🔥 RENDER
========================= */
function render(data) {

  const contenedor = document.getElementById("explorador");
  contenedor.innerHTML = "";

  data.forEach(itemData => {

    const id = itemData.id || itemData[0];
    const nombre = itemData.nombre || itemData[1];
    const tipo = itemData.tipo || itemData[2];
    const driveId = itemData.driveId || itemData[3];

    const item = document.createElement("div");
    item.className = "card-item";

    const esFav = favoritos.includes(Number(id));

    item.innerHTML = `
      <div class="acciones-item">
        <span class="favorito">${esFav ? "⭐" : "☆"}</span>
        <span class="eliminar">🗑️</span>
      </div>

      <div class="icono">${tipo === "carpeta" ? "📁" : "📄"}</div>
      <div class="nombre">${nombre}</div>

      <div class="metadata-tooltip hidden"></div>
    `;

    // ⭐ favorito
    item.querySelector(".favorito").onclick = (e) => {
      e.stopPropagation();
      toggleFavorito(id);
    };

    // 🗑 eliminar
    item.querySelector(".eliminar").onclick = (e) => {
      e.stopPropagation();
      eliminarItem(id, nombre);
    };

    // 🔥 click inteligente
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

/* =========================
   🔥 ABRIR
========================= */
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

/* =========================
   🔥 PREVIEW GRANDE
========================= */
function previewArchivo(driveId) {

  const modal = document.getElementById("previewModal");
  const frame = document.getElementById("previewFrame");

  frame.src = `https://drive.google.com/file/d/${driveId}/preview`;

  modal.classList.remove("hidden");

  const box = modal.querySelector(".modal-content");
  box.style.width = "90%";
  box.style.height = "90%";
}

function cerrarPreview() {
  document.getElementById("previewModal").classList.add("hidden");
}

/* =========================
   🔥 FAVORITOS
========================= */
function toggleFavorito(id) {

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "toggleFavorito",
      usuario: user.usuario,
      item_id: id
    })
  })
  .then(res => {

    if (res.favorito) {
      favoritos.push(Number(id));
    } else {
      favoritos = favoritos.filter(f => f != id);
    }

    aplicarFiltros();
    toast(res.favorito ? "⭐ Agregado" : "❌ Eliminado");
  });
}

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

    let data = res.data || res;

    if (!Array.isArray(data)) throw "error";

    dataActual = data;

    render(dataActual);
    document.getElementById("ruta").innerText = "⭐ Favoritos";

  })
  .catch(() => toast("Error cargando favoritos"))
  .finally(() => hideGlobalLoader());
}

function cargarFavoritosUsuario() {

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "obtenerFavoritos",
      usuario: user.usuario
    })
  })
  .then(res => {

    let data = res.data || res || [];

    favoritos = data.map(f => Number(f.id || f[0]));

  })
  .catch(() => console.error("Error favoritos"));
}

/* =========================
   🔥 ELIMINAR
========================= */
function eliminarItem(id, nombre) {

  itemEliminar = { id, nombre };

  document.getElementById("confirmText").innerText =
    `¿Deseas eliminar "${nombre}"?`;

  document.getElementById("confirmModal").classList.remove("hidden");
}

function cerrarConfirm() {
  itemEliminar = null;
  document.getElementById("confirmModal").classList.add("hidden");
}

function confirmarEliminar() {

  if (!itemEliminar || eliminando) return;

  eliminando = true;
  mostrarLoader();

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "eliminar",
      item_id: itemEliminar.id,
      usuario: user.usuario
    })
  })
  .then(() => {
    toast("🗑 Eliminado");
    cargar();
  })
  .finally(() => {
    eliminando = false;
    ocultarLoader();
    cerrarConfirm();
  });
}

/* =========================
   🔥 METADATA
========================= */
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

    if (!res.status) return;

    let html = "<strong>Versiones:</strong><br>";

    res.versiones.forEach(v => {
      html += `v${v[2]} - ${v[3]}<br>`;
    });

    html += "<br><strong>Notas:</strong><br>";

    res.notas.forEach(n => {
      html += `• ${n[2]}<br>`;
    });

    tooltip.innerHTML = html;
  });
}

/* =========================
   🔥 NOTAS
========================= */
function abrirModalNota() {
  document.getElementById("modalNota").classList.remove("hidden");
}

function cerrarModalNota() {
  document.getElementById("modalNota").classList.add("hidden");
  document.getElementById("notaTexto").value = "";
}

function guardarNotaArchivo() {

  const nota = document.getElementById("notaTexto").value;

  if (!nota.trim()) return cerrarModalNota();

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "guardarNota",
      archivo_id: archivoActualNota,
      nota,
      usuario: user.usuario
    })
  })
  .then(() => toast("📝 Nota guardada"))
  .catch(() => toast("Error nota"));

  cerrarModalNota();
}

/* =========================
   🔥 OTROS
========================= */
function mostrarLoader() {
  document.getElementById("loader").classList.remove("hidden");
}

function ocultarLoader() {
  document.getElementById("loader").classList.add("hidden");
}

function showGlobalLoader() {
  document.getElementById("globalLoader").classList.remove("hidden");
}

function hideGlobalLoader() {
  document.getElementById("globalLoader").classList.add("hidden");
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}

function cargarStats() {
  safeFetch(`${API}?action=stats`)
    .then(res => console.log("📊", res));
}
