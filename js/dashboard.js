const API = "https://script.google.com/macros/s/AKfycbwiu1aeGwSLTtanKZF6BD22CxAGjMvSCJJ_Hv8eZIWWUNsxCRI4a11JkKaP9_duWmI/exec";

let padreActual = 0;
let padreDrive = "";
let ruta = [];
let user = null;

/* 🔥 FIX CRÍTICO */
let vista = "grid";

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

/* 🔥 FETCH SEGURO */
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

  safeFetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(data => {

      if (!Array.isArray(data)) {
        console.error("❌ No es array:", data);
        throw new Error("Formato inválido");
      }

      render(data);

    })
    .catch(err => {
      console.error("ERROR CARGAR:", err);
      toast("Error cargando estructura");
    })
    .finally(() => {
      hideGlobalLoader(true);
    });
}

/* 🔥 RENDER SEGURO */
function render(data) {
  try {
    const cont = document.getElementById("explorador");

    if (!cont) return;

    if (!data || data.length === 0) {
      cont.innerHTML = "<p>Sin resultados</p>";
      return;
    }

    let clase = vista === "grid" ? "grid-cards" : "lista";

    cont.innerHTML = `<div class="${clase}" id="contenedorItems"></div>`;

    const wrapper = document.getElementById("contenedorItems");

    if (!wrapper) {
      console.error("❌ wrapper null");
      return;
    }

    data.forEach(row => {
      if (!row) return;

      const [id, nombre, tipo, , driveId] = row;
      const icono = obtenerIcono(nombre, tipo);

      const item = document.createElement("div");
      item.className = "card-item";

      item.innerHTML = `
        <div class="card-icon">${icono}</div>
        <div class="card-name">${nombre}</div>
        <div class="card-type">${tipo}</div>
      `;

      item.addEventListener("click", () => {
        abrir(id, tipo, driveId, nombre);
      });

      wrapper.appendChild(item);
    });

  } catch (err) {
    console.error("❌ ERROR EN RENDER:", err);
    throw err; // 🔥 esto permite que el catch de cargar lo detecte
  }
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
    ruta.map((r, i) =>
      `<span style="cursor:pointer" onclick="irA(${i})">${r.nombre}</span>`
    ).join(" / ");
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

/* 🔥 ICONOS */
function obtenerIcono(nombre, tipo) {
  if (tipo === "carpeta") return "📁";

  const ext = nombre.includes(".") ? nombre.split(".").pop().toLowerCase() : "";

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

/* 🔥 LOADER GLOBAL */
function showGlobalLoader() {
  document.getElementById("globalLoader").classList.remove("hidden");
}
function hideGlobalLoader() {
  document.getElementById("globalLoader").classList.add("hidden");
}

/* 🔥 TOAST */
function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

/* 🔥 LOGOUT */
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}
