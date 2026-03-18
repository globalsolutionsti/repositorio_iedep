const API = "https://script.google.com/macros/s/AKfycbzPH4xDXOU14Hcldpo_g08B6MtJrGajOz0ojbwEqIMlNDxmdQ-e-ghyIjynzSTnf9rl/exec";

let padreActual = 0;
let padreDrive = "";
let ruta = [];
let user = null;


// 🔥 INICIALIZACIÓN SEGURA
document.addEventListener("DOMContentLoaded", () => {

  try {
    const data = localStorage.getItem("usuario");

    if (data && data !== "undefined") {
      user = JSON.parse(data);
    }

  } catch (e) {
    console.warn("Error parsing user:", e);
  }

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("nombreUsuario").innerText = user.nombre;

  // 🔥 EVENTO FILE INPUT
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", function() {
      const file = this.files[0];
      document.getElementById("fileName").innerText = file ? file.name : "Ningún archivo seleccionado";
    });
  }

  init();
});


// 🔥 OBTENER RAÍZ
function init() {

  showGlobalLoader();

  fetch(`${API}?action=getRoot`)
    .then(r => r.json())
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
    .catch(err => {
      console.error(err);
      toast("Error cargando raíz");
      hideGlobalLoader();
    });
}


// 🔥 CARGAR ESTRUCTURA (CON CACHE 🚀)
function cargar() {

  showGlobalLoader();

  const cacheKey = "estructura_" + padreActual;
  const cache = localStorage.getItem(cacheKey);

  let usoCache = false;

  // 🔥 SI HAY CACHE → render inmediato
  if (cache) {
    try {
      render(JSON.parse(cache));
      usoCache = true;

      // 🔥 IMPORTANTE: ocultar loader si ya mostramos datos
      hideGlobalLoader();

    } catch (e) {
      console.warn("Cache corrupto");
    }
  }

  fetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(r => r.json())
    .then(data => {

      render(data);

      localStorage.setItem(cacheKey, JSON.stringify(data));

      hideGlobalLoader();

    })
    .catch(err => {
      console.error(err);

      // 🔥 SOLO mostrar error si NO hubo cache
      if (!usoCache) {
        toast("Error cargando estructura");
        hideGlobalLoader();
      }
    });
}


// 🔥 RENDER (OPTIMIZADO)
function render(data) {

  const cont = document.getElementById("explorador");

  if (!data || data.length === 0) {
    cont.innerHTML = "<p>Sin elementos</p>";
    return;
  }

  let html = `<div class="grid-cards">`;

  for (let i = 0; i < data.length; i++) {

    const row = data[i];

    const id = row[0];
    const nombre = row[1];
    const tipo = row[2];
    const driveId = row[4];

    const icono = obtenerIcono(nombre, tipo);

    html += `
      <div class="card-item" onclick="abrir(${id}, '${tipo}', '${driveId}', '${nombre}')">
        <div class="card-icon">${icono}</div>
        <div class="card-name">${nombre}</div>
        <div class="card-type">${tipo}</div>
      </div>
    `;
  }

  html += `</div>`;

  cont.innerHTML = html;
}


// 🔥 ABRIR CARPETA / ARCHIVO
function abrir(id, tipo, driveId, nombre) {

  if (tipo === "carpeta") {

    const ultimo = ruta[ruta.length - 1];

    if (ultimo && ultimo.id === id) return;

    padreActual = id;
    padreDrive = driveId;

    ruta.push({
      id: id,
      nombre: nombre,
      drive: driveId
    });

    actualizarRuta();
    cargar();

  } else {
    window.open(`https://drive.google.com/file/d/${driveId}`);
  }
}


// 🔥 BREADCRUMB
function actualizarRuta() {

  const cont = document.getElementById("ruta");

  cont.innerHTML = ruta.map((r, i) => {
    return `<span style="cursor:pointer" onclick="irA(${i})">${r.nombre}</span>`;
  }).join(" / ");
}


// 🔥 NAVEGAR
function irA(index) {

  const nivel = ruta[index];

  padreActual = nivel.id;
  padreDrive = nivel.drive;

  ruta = ruta.slice(0, index + 1);

  actualizarRuta();
  cargar();
}


// 🔥 RAÍZ
function irRaiz() {
  init();
}


// 🔥 LIMPIAR CACHE (CLAVE 🔥)
function limpiarCache() {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("estructura_")) {
      localStorage.removeItem(k);
    }
  });
}


// 🔥 CREAR CARPETA
function nuevaCarpeta() {

  const nombre = prompt("Nombre de la carpeta");
  if (!nombre) return;

  mostrarLoader();

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "crearCarpeta",
      nombre,
      padre: padreActual,
      padre_drive: padreDrive
    }),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
  .then(r => r.json())
  .then(res => {

    ocultarLoader();

    if (res.status) {
      toast("Carpeta creada correctamente");
      limpiarCache(); // 🔥 CLAVE
      cargar();
    } else {
      toast("Error: " + res.error);
    }

  })
  .catch(err => {
    ocultarLoader();
    console.error(err);
    toast("Error de conexión");
  });
}


// 🔥 SUBIR
function subir() {

  const fileInput = document.getElementById("fileInput");

  if (!fileInput.files.length) {
    toast("Selecciona un archivo");
    return;
  }

  subirArchivoDirecto(fileInput.files[0]);
}


// 🔥 SUBIR DIRECTO (DRAG & DROP + BOTÓN)
function subirArchivoDirecto(file) {

  mostrarLoader();

  const reader = new FileReader();

  reader.onload = function(e) {

    const base64 = e.target.result.split(",")[1];

    fetch(API, {
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
    .then(r => r.json())
    .then(res => {

      ocultarLoader();

      if (res.status) {
        toast("Archivo subido correctamente");
        limpiarCache(); // 🔥 CLAVE
        cargar();
      } else {
        toast("Error: " + res.error);
      }

    })
    .catch(err => {
      ocultarLoader();
      console.error(err);
      toast("Error en subida");
    });

  };

  reader.readAsDataURL(file);
}


// 🔥 ICONOS
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
    case "png": return "🖼️";
    case "zip":
    case "rar": return "🗜️";
    case "mp4": return "🎬";
    case "mp3": return "🎵";
    default: return "📄";
  }
}


// 🔥 LOADER LOCAL
function mostrarLoader() {
  document.getElementById("loader").classList.remove("hidden");
}

function ocultarLoader() {
  document.getElementById("loader").classList.add("hidden");
}


// 🔥 LOADER GLOBAL
let loaderTimeout;

function showGlobalLoader() {
  const el = document.getElementById("globalLoader");
  el.classList.remove("hidden");

  // 🔥 AUTO-KILL en 10 segundos
  loaderTimeout = setTimeout(() => {
    console.warn("Loader forzado a cerrar");
    hideGlobalLoader();
  }, 10000);
}

function hideGlobalLoader() {
  const el = document.getElementById("globalLoader");
  el.classList.add("hidden");

  clearTimeout(loaderTimeout);
}


// 🔥 TOAST
function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}


// 🔥 LOGOUT
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}


// 🔥 DRAG & DROP
const dropZone = document.getElementById("dropZone");

["dragenter", "dragover", "dragleave", "drop"].forEach(event => {
  document.addEventListener(event, e => {
    e.preventDefault();
    e.stopPropagation();
  }, false);
});

document.addEventListener("dragenter", () => {
  if (dropZone) dropZone.classList.remove("hidden");
});

document.addEventListener("dragleave", (e) => {
  if (e.clientX === 0 && e.clientY === 0) {
    if (dropZone) dropZone.classList.add("hidden");
  }
});

document.addEventListener("drop", (e) => {

  if (dropZone) dropZone.classList.add("hidden");

  const files = e.dataTransfer.files;

  if (!files || files.length === 0) {
    toast("No se detectó archivo");
    return;
  }

  subirArchivoDirecto(files[0]);
});
