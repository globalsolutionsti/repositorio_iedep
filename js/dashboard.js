const API = "https://script.google.com/macros/s/AKfycbzKmRl5XGRXwIvE3iQi8NGh7VBEcXhHNz28THYY3OxNo2oekkH_DfpxSMryDbxWlSpO/exec";

// 🔥 CERRAR TOOLTIPS AL HACER CLICK FUERA
document.addEventListener("click", () => {
  document.querySelectorAll(".metadata-tooltip").forEach(t => {
    t.classList.add("hidden");
  });
});

/* =========================
   🔥 VARIABLES GLOBALES
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

window.vista = "grid";

/* =========================
   🔥 PERMISOS
========================= */
const PERMISOS = {
  admin: { crear: true, subir: true },
  usuario: { crear: false, subir: true }
};

/* =========================
   🔥 INIT SEGURO
========================= */
document.addEventListener("DOMContentLoaded", () => {

  try {
    const data = localStorage.getItem("usuario");
    if (data && data !== "undefined") user = JSON.parse(data);
  } catch (e) {
    console.warn("Error parsing user:", e);
  }

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("nombreUsuario").innerText = user.nombre;

  generarMenu();
  aplicarPermisos();

  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", function () {
      const file = this.files[0];
      document.getElementById("fileName").innerText =
        file ? file.name : "Ningún archivo seleccionado";
    });
  }

  initDragDrop();
  init();
});

/* =========================
   🔥 MENU
========================= */
function generarMenu() {
  const menu = document.getElementById("menu");
  if (!menu) return;

  menu.innerHTML = `
    <a onclick="irRaiz()">📂 Documentos</a>
    <a onclick="verFavoritos()">⭐ Favoritos</a>
  `;
}

/* =========================
   🔥 PERMISOS
========================= */
function aplicarPermisos() {
  const rol = user.rol || "usuario";
  const permisos = PERMISOS[rol];

  if (!permisos.crear) {
    const btn = document.querySelector(".btn-primary");
    if (btn) btn.style.display = "none";
  }
}

/* =========================
   🔥 FETCH SEGURO
========================= */
async function safeFetch(url, options = null) {
  const res = await fetch(url, options);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("❌ Backend inválido:", text);
    throw new Error("JSON inválido");
  }
}

/* =========================
   🔥 INIT ROOT
========================= */
function init() {
  safeFetch(`${API}?action=getRoot`)
    .then(root => {

      if (!root || !root.id) throw new Error("Root inválido");

      padreActual = root.id;
      padreDrive = root.drive;

      ruta = [{
        id: root.id,
        nombre: root.nombre,
        drive: root.drive
      }];

      actualizarRuta();
      cargar(false);

    })
    .catch(err => {
      console.error("ERROR ROOT:", err);
      toast("Error cargando raíz");
    });

  cargarStats();
  cargarFavoritosUsuario();
}

/* =========================
   🔥 CARGAR
========================= */
function cargar(mostrarLoaderGlobal = true) {

  if (mostrarLoaderGlobal) showGlobalLoader();

  safeFetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(data => {

      if (!data) throw new Error("Respuesta vacía");

      if (data.data) data = data.data;

      dataActual = data;
      aplicarFiltros();

    })
    .catch(err => {
      console.error("ERROR CARGAR:", err);
      toast("Error cargando estructura");
    })
    .finally(() => {
      hideGlobalLoader();
    });
}

/* =========================
   🔥 FILTROS
========================= */
function aplicarFiltros() {

  let filtrado = [...dataActual];

  if (textoBusqueda) {
    filtrado = filtrado.filter(row => {
      const nombre = Array.isArray(row) ? row[1] : row.nombre;
      return nombre.toLowerCase().includes(textoBusqueda);
    });
  }

  if (filtroTipo !== "todos") {
    filtrado = filtrado.filter(row => {

      const nombre = Array.isArray(row) ? row[1].toLowerCase() : row.nombre.toLowerCase();
      const tipo = Array.isArray(row) ? row[2] : row.tipo;

      if (filtroTipo === "carpeta") return tipo === "carpeta";
      if (filtroTipo === "pdf") return nombre.endsWith(".pdf");
      if (filtroTipo === "imagen") return /\.(jpg|jpeg|png)/.test(nombre);
      if (filtroTipo === "video") return nombre.endsWith(".mp4");

      return true;
    });
  }

  render(filtrado);
}

/* ========================= */
function buscar(valor) {
  textoBusqueda = valor.toLowerCase();
  aplicarFiltros();
}

function filtrarTipo(tipo) {
  filtroTipo = tipo;
  aplicarFiltros();
}

function cambiarVista() {
  vista = vista === "grid" ? "lista" : "grid";
  window.vista = vista;
  aplicarFiltros();
}

/* =========================
   🔥 RENDER
========================= */
function render(data) {
  const contenedor = document.getElementById("explorador");
  contenedor.innerHTML = "";

  data.forEach(itemData => {

    const { id, nombre, tipo, driveId } = itemData;

    const item = document.createElement("div");
    item.className = "card-item";

    item.innerHTML = `
      <div class="acciones-item">
        <span class="favorito" onclick="toggleFavorito('${id}', event)">⭐</span>
        <span class="eliminar" onclick="eliminarItem('${id}', '${nombre}', event)">🗑️</span>
      </div>

      <div class="icono">${tipo === "carpeta" ? "📁" : "📄"}</div>
      <div class="nombre">${nombre}</div>
      <div class="tipo">${tipo}</div>

      <div class="metadata-tooltip hidden">
        <div>📄 Versiones: <span id="ver-${id}">...</span></div>
        <div>📝 Notas: <span id="nota-${id}">...</span></div>
      </div>
    `;

    item.addEventListener("click", (e) => {

      e.stopPropagation();

      if (e.target.closest(".acciones-item")) return;

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
   🔥 RESTO
========================= */
function abrir(id, tipo, driveId, nombre) {
  if (tipo === "carpeta") {
    padreActual = id;
    padreDrive = driveId;
    ruta.push({ id, nombre, drive: driveId });
    actualizarRuta();
    cargar(true);
  } else {
    previewArchivo(driveId);
  }
}

function previewArchivo(driveId) {
  const modal = document.getElementById("previewModal");
  const frame = document.getElementById("previewFrame");

  frame.src = `https://drive.google.com/file/d/${driveId}/preview`;
  modal.classList.remove("hidden");
}

function cerrarPreview() {
  document.getElementById("previewModal").classList.add("hidden");
}

function actualizarRuta() {
  document.getElementById("ruta").innerHTML =
    ruta.map((r, i) =>
      `<span style="cursor:pointer" onclick="irA(${i})">${r.nombre}</span>`
    ).join(" / ");
}

function irA(index) {
  const nivel = ruta[index];

  padreActual = nivel.id;
  padreDrive = nivel.drive;

  ruta = ruta.slice(0, index + 1);

  actualizarRuta();
  cargar(true);
}

function irRaiz() {
  if (ruta.length > 0) {
    const root = ruta[0];

    padreActual = root.id;
    padreDrive = root.drive;
    ruta = [root];

    actualizarRuta();
    cargar(true);
  }
}

/* =========================
   🔥 ELIMINAR
========================= */
let itemEliminar = null;

function eliminarItem(id, nombre) {

  if (!id) return;

  itemEliminar = { id, nombre };

  const texto = document.getElementById("confirmText");
  const modal = document.getElementById("confirmModal");

  texto.innerText = `¿Deseas enviar "${nombre}" a la papelera?`;
  modal.classList.remove("hidden");
}

/* ========================= */
function cargarStats() {
  safeFetch(`${API}?action=stats`);
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
    }),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
  .then(res => {

    if (!res.status) return;

    let html = "<strong>🧾 Versiones:</strong><br>";

    res.versiones.forEach(v => {
      html += `v${v[2]} - ${v[3]}<br>`;
    });

    html += "<br><strong>📝 Notas:</strong><br>";

    res.notas.forEach(n => {
      html += `• ${n[2]}<br>`;
    });

    tooltip.innerHTML = html;
  });
}
