const API = "https://script.google.com/macros/s/AKfycbwHUT0R4aZP3r6QBQZ8TRtrLE5CJB2_ePX-4XlO8ssk-Sy4j_0hp5zw1fWWPi0ooEHN/exec";

/* =========================
   🔥 VARIABLES GLOBALES
========================= */
let padreActual = 0;
let padreDrive = "";
let ruta = [];
let user = null;

let vista = "grid"; // grid | lista
let dataActual = []; // 🔥 cache en memoria (rendimiento)
let filtroTipo = "todos";
let textoBusqueda = "";

/* 🔥 FIX DEFINITIVO */
window.vista = "grid";

/* 🔥 PERMISOS */
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
    <a onclick="toast('Próximamente')">⭐ Favoritos</a>
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
}

/* =========================
   🔥 CARGAR (MEJORADO)
========================= */
function cargar(mostrarLoaderGlobal = true) {

  if (mostrarLoaderGlobal) showGlobalLoader();

  safeFetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(data => {

      console.log("🔥 DATA BACKEND:", data);

      if (!data) throw new Error("Respuesta vacía");

      if (data.data) data = data.data;

      dataActual = data; // 🔥 cache memoria
      aplicarFiltros();  // 🔥 usa filtros + buscador

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
   🔥 FILTROS + BUSCADOR
========================= */
function aplicarFiltros() {

  let filtrado = [...dataActual];

  // 🔍 BUSCADOR
  if (textoBusqueda) {
    filtrado = filtrado.filter(row => {
      const nombre = Array.isArray(row) ? row[1] : row.nombre;
      return nombre.toLowerCase().includes(textoBusqueda);
    });
  }

  // 🎛 FILTRO
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

/* =========================
   🔥 BUSCAR
========================= */
function buscar(valor) {
  textoBusqueda = valor.toLowerCase();
  aplicarFiltros();
}

/* =========================
   🔥 FILTRAR
========================= */
function filtrarTipo(tipo) {
  filtroTipo = tipo;
  aplicarFiltros();
}

/* =========================
   🔥 CAMBIAR VISTA
========================= */
function cambiarVista() {
  vista = vista === "grid" ? "lista" : "grid";
  window.vista = vista;
  aplicarFiltros();
}

/* =========================
   🔥 RENDER PRO (MEJORADO)
========================= */
function render(data) {

  const cont = document.getElementById("explorador");
  if (!cont) return;

  if (!data || data.length === 0) {
    cont.innerHTML = "<p>Sin resultados</p>";
    return;
  }

  const modoVista = window.vista || "grid";
  const clase = modoVista === "grid" ? "grid-cards" : "lista";

  cont.innerHTML = `<div class="${clase}" id="contenedorItems"></div>`;

  const wrapper = document.getElementById("contenedorItems");
  if (!wrapper) return;

  data.forEach(row => {

    let id, nombre, tipo, driveId;

    if (Array.isArray(row)) {
      [id, nombre, tipo, , driveId] = row;
    } else {
      id = row.id;
      nombre = row.nombre;
      tipo = row.tipo;
      driveId = row.driveId || row.drive;
    }

    const item = document.createElement("div");
    item.className = "card-item";

    // 🔥 MODO LISTA
    if (modoVista === "lista") item.classList.add("item-lista");

    item.innerHTML = `
      <div class="card-icon">${obtenerIcono(nombre, tipo)}</div>
      <div class="card-name">${nombre}</div>
      <div class="card-type">${tipo}</div>
      <div onclick="event.stopPropagation(); toggleFavorito(${id})">⭐</div>
      <div onclick="event.stopPropagation(); eliminarItem(${id}, '${nombre}')">🗑</div>
    `;

    item.addEventListener("click", () => {
      abrir(id, tipo, driveId, nombre);
    });

    wrapper.appendChild(item);
  });
}

/* =========================
   🔥 RESTO (SIN CAMBIOS)
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
   🔥 NUEVA CARPETA
========================= */
function nuevaCarpeta() {
  const nombre = prompt("Nombre de la carpeta");
  if (!nombre) return;

  mostrarLoader();

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "crearCarpeta",
      nombre,
      padre: padreActual,
      padre_drive: padreDrive
    }),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
    .then(res => {
      if (res.status) {
        toast("Carpeta creada");
        cargar(true);
      } else {
        toast("Error: " + res.error);
      }
    })
    .catch(() => toast("Error de conexión"))
    .finally(() => ocultarLoader());
}

/* =========================
   🔥 SUBIR
========================= */
function subir() {
  const fileInput = document.getElementById("fileInput");

  if (!fileInput.files.length) {
    toast("Selecciona archivo");
    return;
  }

  subirArchivoDirecto(fileInput.files[0]);
}

function subirArchivoDirecto(file) {
  mostrarLoader();

  const reader = new FileReader();

  reader.onload = function (e) {

    const base64 = e.target.result.split(",")[1];

    safeFetch(API, {
      method: "POST",
      body: JSON.stringify({
        action: "subirArchivo",
        nombre: file.name,
        tipo: file.type,
        archivo: base64,
        padre: padreActual,
        padre_drive: padreDrive
      }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
      .then(res => {
        console.log("🔥 RESPUESTA SUBIDA:", res);

        if (res.status) {
          toast("Archivo subido correctamente");
          cargar(true);
        } else {
          toast("Error: " + res.error);
        }
      })
      .catch(() => toast("Error subida"))
      .finally(() => ocultarLoader());
  };

  reader.readAsDataURL(file);
}

/* =========================
   🔥 DRAG & DROP
========================= */
function initDragDrop() {

  const dropZone = document.getElementById("dropZone");

  ["dragenter","dragover","dragleave","drop"].forEach(event=>{
    document.addEventListener(event,e=>{
      e.preventDefault();
      e.stopPropagation();
    },false);
  });

  document.addEventListener("dragenter",()=>{
    if(dropZone) dropZone.classList.remove("hidden");
  });

  document.addEventListener("dragleave",(e)=>{
    if(e.clientX===0 && e.clientY===0){
      if(dropZone) dropZone.classList.add("hidden");
    }
  });

  document.addEventListener("drop",(e)=>{
    if(dropZone) dropZone.classList.add("hidden");

    const files=e.dataTransfer.files;
    if(files && files.length){
      subirArchivoDirecto(files[0]);
    }
  });
}

/* =========================
   🔥 UTILIDADES
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

/* =========================
   🔥 ICONOS (TU VERSIÓN COMPLETA)
========================= */
function obtenerIcono(nombre, tipo) {
  if (tipo === "carpeta") return "📁";

  const ext = nombre.includes(".")
    ? nombre.split(".").pop().toLowerCase()
    : "";

  switch (ext) {
    case "pdf": return "📕";
    case "doc":
    case "docx": return "📘";
    case "xls":
    case "xlsx": return "📗";
    case "ppt":
    case "pptx": return "📙";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif": return "🖼️";
    case "zip":
    case "rar": return "🗜️";
    case "mp4":
    case "avi": return "🎬";
    case "mp3":
    case "wav": return "🎵";
    case "txt": return "📄";
    default: return "📄";
  }
}

function toggleFavorito(id) {

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "toggleFavorito",
      usuario: user.usuario,
      item_id: id
    }),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
  .then(res => {
    if (res.status) {
      toast(res.favorito ? "⭐ Agregado a favoritos" : "❌ Eliminado de favoritos");
    }
  });
}

function esFavorito(id) {
  return false; // luego lo conectamos a backend real
}

function eliminarItem(id, nombre) {

  if (!confirm("¿Enviar a papelera?")) return;

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "eliminar",
      item_id: id,
      nombre: nombre,
      usuario: user.usuario
    }),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
  .then(res => {
    if (res.status) {
      toast("Enviado a papelera");
      cargar(true);
    }
  });
}

function cargarStats() {

  safeFetch(`${API}?action=stats`)
    .then(res => {
      console.log("📊 STATS:", res);
    });
}
