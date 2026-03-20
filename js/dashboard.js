const API = "https://script.google.com/macros/s/AKfycbwiu1aeGwSLTtanKZF6BD22CxAGjMvSCJJ_Hv8eZIWWUNsxCRI4a11JkKaP9_duWmI/exec";

let padreActual = 0;
let padreDrive = "";
let ruta = [];
let user = null;

/* 🔥 PERMISOS */
const PERMISOS = {
  admin: { crear: true, subir: true },
  usuario: { crear: false, subir: true }
};

/* 🔥 INIT */
document.addEventListener("DOMContentLoaded", () => {
  try {
    const data = localStorage.getItem("usuario");
    if (data && data !== "undefined") user = JSON.parse(data);
  } catch (e) { console.warn("Error parsing user:", e); }

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
      document.getElementById("fileName").innerText = file ? file.name : "Ningún archivo seleccionado";
    });
  }

  init();
});

/* 🔥 MENU */
function generarMenu() {
  const menu = document.getElementById("menu");
  if (!menu) return;

  menu.innerHTML = `
    <a onclick="irRaiz()">📂 Documentos</a>
    <a onclick="toast('Próximamente')">⭐ Favoritos</a>
  `;
}

/* 🔥 PERMISOS */
function aplicarPermisos() {
  const rol = user.rol || "usuario";
  const permisos = PERMISOS[rol];

  if (!permisos.crear) {
    const btn = document.querySelector(".btn-primary");
    if (btn) btn.style.display = "none";
  }
}

/* 🔥 PARSER SEGURO */
async function safeFetch(url, options = null) {
  const res = await fetch(url, options);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("❌ Respuesta inválida del backend:", text);
    throw new Error("Backend no devolvió JSON válido");
  }
}

/* 🔥 INIT ROOT */
function init() {
  safeFetch(`${API}?action=getRoot`)
    .then(root => {

      if (!root || !root.id) throw new Error("Root inválido");

      padreActual = root.id;
      padreDrive = root.drive;
      ruta = [{ id: root.id, nombre: root.nombre, drive: root.drive }];

      actualizarRuta();
      cargar(false);

    })
    .catch(err => {
      console.error("ERROR ROOT:", err);
      toast("Error cargando raíz");
      hideGlobalLoader(true);
    });
}

/* 🔥 CARGAR */
function cargar(mostrarLoaderGlobal = true) {

  if (mostrarLoaderGlobal) showGlobalLoader();

  const cacheKey = "estructura_" + padreActual;
  const cache = localStorage.getItem(cacheKey);

  if (cache) {
    try { render(JSON.parse(cache)); } 
    catch (e) { console.warn("Cache corrupto"); }
  }

  safeFetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(data => {

      if (!data) throw new Error("Respuesta vacía");

      render(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));

    })
    .catch(err => {
      console.error("ERROR CARGAR:", err);
      toast("Error cargando estructura");
    })
    .finally(() => {
      hideGlobalLoader(true);
    });
}

/* 🔥 RENDER (CON PREVIEW) */
function render(data) {
  const cont = document.getElementById("explorador");

  if (!data.length) {
    cont.innerHTML = "<p>Sin resultados</p>";
    return;
  }

  let clase = vista === "grid" ? "grid-cards" : "lista";

  // 🔥 contenedor limpio
  cont.innerHTML = `<div class="${clase}" id="contenedorItems"></div>`;

  const wrapper = document.getElementById("contenedorItems");

  data.forEach(row => {
    const [id, nombre, tipo, , driveId] = row;
    const icono = obtenerIcono(nombre, tipo);

    // 🔥 crear elemento real (NO string)
    const item = document.createElement("div");
    item.className = "card-item";

    item.innerHTML = `
      <div class="card-icon">${icono}</div>
      <div class="card-name">${nombre}</div>
      <div class="card-type">${tipo}</div>
    `;

    // 🔥 EVENTO REAL (AQUÍ ESTÁ EL FIX)
    item.addEventListener("click", () => {
      abrir(id, tipo, driveId, nombre);
    });

    wrapper.appendChild(item);
  });
}

/* 🔥 PREVIEW */
function previewArchivo(driveId) {
  const modal = document.getElementById("previewModal");
  const frame = document.getElementById("previewFrame");

  frame.src = `https://drive.google.com/file/d/${driveId}/preview`;
  modal.classList.remove("hidden");
}

function cerrarPreview() {
  document.getElementById("previewModal").classList.add("hidden");
}

/* 🔥 ABRIR */
function abrir(id, tipo, driveId, nombre) {
  if (tipo === "carpeta") {
    const ultimo = ruta[ruta.length - 1];
    if (ultimo && ultimo.id === id) return;

    padreActual = id;
    padreDrive = driveId;
    ruta.push({ id, nombre, drive: driveId });
    actualizarRuta();
    cargar(true);
  } else {
    previewArchivo(driveId);
  }
}

/* 🔥 RUTA */
function actualizarRuta() {
  document.getElementById("ruta").innerHTML =
    ruta.map((r, i) => `<span style="cursor:pointer" onclick="irA(${i})">${r.nombre}</span>`).join(" / ");
}

/* 🔥 NAVEGAR */
function irA(index) {
  const nivel = ruta[index];
  padreActual = nivel.id;
  padreDrive = nivel.drive;
  ruta = ruta.slice(0, index + 1);
  actualizarRuta();
  cargar(true);
}

/* 🔥 RAÍZ */
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

/* 🔥 CACHE */
function limpiarCache() {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("estructura_")) localStorage.removeItem(k);
  });
}

/* 🔥 NUEVA CARPETA */
function nuevaCarpeta() {
  const nombre = prompt("Nombre de la carpeta");
  if (!nombre) return;

  mostrarLoader();

  safeFetch(API, {
    method: "POST",
    body: JSON.stringify({ action: "crearCarpeta", nombre, padre: padreActual, padre_drive: padreDrive }),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
    .then(res => {
      if (res.status) {
        toast("Carpeta creada correctamente");
        limpiarCache();
        cargar(true);
      } else {
        toast("Error: " + res.error);
      }
    })
    .catch(err => {
      console.error(err);
      toast("Error de conexión");
    })
    .finally(() => ocultarLoader());
}

/* 🔥 SUBIR */
function subir() {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) {
    toast("Selecciona un archivo");
    return;
  }
  subirArchivoDirecto(fileInput.files[0]);
}

/* 🔥 SUBIR DIRECTO */
function subirArchivoDirecto(file) {
  mostrarLoader();

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result.split(",")[1];

    safeFetch(API, {
      method: "POST",
      body: JSON.stringify({
        action:"subirArchivo",
        nombre:file.name,
        tipo:file.type,
        archivo:base64,
        padre:padreActual,
        padre_drive:padreDrive
      }),
      headers: {"Content-Type":"text/plain;charset=utf-8"}
    })
      .then(res=>{
        if(res.status){
          toast("Archivo subido correctamente");
          limpiarCache();
          cargar(true);
        } else {
          toast("Error: "+res.error);
        }
      })
      .catch(err=>{
        console.error(err);
        toast("Error en subida");
      })
      .finally(()=>ocultarLoader());
  };

  reader.readAsDataURL(file);
}

/* 🔥 ICONOS */
function obtenerIcono(nombre, tipo) {
  if(tipo==="carpeta") return "📁";
  const ext = nombre.includes(".") ? nombre.split(".").pop().toLowerCase() : "";

  switch(ext){
    case "pdf": return "📕";
    case "doc": case "docx": return "📘";
    case "xls": case "xlsx": return "📗";
    case "ppt": case "pptx": return "📙";
    case "jpg": case "jpeg": case "png": return "🖼️";
    case "zip": case "rar": return "🗜️";
    case "mp4": return "🎬";
    case "mp3": return "🎵";
    default: return "📄";
  }
}

/* 🔥 LOADER LOCAL */
function mostrarLoader() {
  document.getElementById("loader").classList.remove("hidden");
}
function ocultarLoader() {
  document.getElementById("loader").classList.add("hidden");
}

/* 🔥 LOADER GLOBAL */
let loaderActivo = false;
let loaderTimeout;

function showGlobalLoader() {
  if (loaderActivo) return;

  loaderActivo = true;
  const el = document.getElementById("globalLoader");
  el.classList.remove("hidden");

  loaderTimeout = setTimeout(() => {
    console.warn("⚠️ Loader forzado a cerrar");
    hideGlobalLoader(true);
  }, 8000);
}

function hideGlobalLoader(force = false) {
  const el = document.getElementById("globalLoader");

  if (!loaderActivo && !force) return;

  loaderActivo = false;
  el.classList.add("hidden");
  clearTimeout(loaderTimeout);
}

/* 🔥 TOAST */
function toast(msg){
  const t=document.getElementById("toast");
  t.innerText=msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),3000);
}

/* 🔥 LOGOUT */
function logout(){
  localStorage.removeItem("usuario");
  window.location.href="index.html";
}

/* 🔥 DRAG & DROP */
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
  if(e.clientX===0&&e.clientY===0){
    if(dropZone) dropZone.classList.add("hidden");
  }
});

document.addEventListener("drop",(e)=>{
  if(dropZone) dropZone.classList.add("hidden");

  const files=e.dataTransfer.files;
  if(!files||files.length===0){
    toast("No se detectó archivo");
    return;
  }

  subirArchivoDirecto(files[0]);
});
