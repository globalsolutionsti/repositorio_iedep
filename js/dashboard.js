const API = "TU_API_AQUI";

let padreActual = 0;
let padreDrive = "";
let ruta = [];
let user = null;

/* 🔥 ROLES */
const PERMISOS = {
  admin: { crear: true, subir: true },
  usuario: { crear: false, subir: true }
};

/* 🔥 MENU */
const MENU = [
  { nombre: "Documentos", modulo: "docs" },
  { nombre: "Mi unidad", modulo: "mi" }
];

document.addEventListener("DOMContentLoaded", () => {

  user = JSON.parse(localStorage.getItem("usuario"));

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("nombreUsuario").innerText = user.nombre;

  generarMenu();
  aplicarPermisos();

  init();
});

/* 🔥 MENU */
function generarMenu() {
  const nav = document.getElementById("menu");

  nav.innerHTML = MENU.map(m => `
    <a onclick="cambiarModulo('${m.modulo}')">${m.nombre}</a>
  `).join("");
}

function cambiarModulo(mod) {
  document.getElementById("tituloModulo").innerText = mod;
  irRaiz();
}

/* 🔥 PERMISOS */
function aplicarPermisos() {
  const rol = user.rol || "usuario";
  const permisos = PERMISOS[rol];

  if (!permisos.crear) {
    document.getElementById("btnNuevaCarpeta").style.display = "none";
  }
}

/* 🔥 FETCH */
async function safeFetch(url, options = null) {
  const res = await fetch(url, options);
  const text = await res.text();
  return JSON.parse(text);
}

/* 🔥 INIT */
function init() {
  safeFetch(`${API}?action=getRoot`)
    .then(root => {
      padreActual = root.id;
      padreDrive = root.drive;
      ruta = [root];
      actualizarRuta();
      cargar();
    });
}

/* 🔥 CARGAR */
function cargar() {
  showGlobalLoader();

  safeFetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(data => render(data))
    .finally(() => hideGlobalLoader());
}

/* 🔥 RENDER */
function render(data) {
  const cont = document.getElementById("explorador");

  cont.innerHTML = data.map(row => {
    const [id, nombre, tipo, , driveId] = row;

    return `
      <div class="card-item">
        <div onclick="abrir(${id}, '${tipo}', '${driveId}', '${nombre}')">
          <div class="card-icon">${tipo === "carpeta" ? "📁" : "📄"}</div>
          <div class="card-name">${nombre}</div>
        </div>

        ${tipo !== "carpeta" ? `
          <button onclick="preview('${driveId}')">👁</button>
        ` : ""}
      </div>
    `;
  }).join("");
}

/* 🔥 PREVIEW */
function preview(id) {
  const url = `https://drive.google.com/file/d/${id}/preview`;
  document.getElementById("previewFrame").src = url;
  document.getElementById("previewModal").classList.remove("hidden");
}

function cerrarPreview() {
  document.getElementById("previewModal").classList.add("hidden");
}

/* 🔥 NAVEGACIÓN */
function abrir(id, tipo, driveId, nombre) {
  if (tipo === "carpeta") {
    padreActual = id;
    padreDrive = driveId;
    ruta.push({ id, nombre, drive: driveId });
    actualizarRuta();
    cargar();
  } else {
    preview(driveId);
  }
}

function actualizarRuta() {
  document.getElementById("ruta").innerHTML =
    ruta.map((r, i) =>
      `<span onclick="irA(${i})">${r.nombre}</span>`
    ).join(" / ");
}

function irA(i) {
  const r = ruta[i];
  padreActual = r.id;
  padreDrive = r.drive;
  ruta = ruta.slice(0, i + 1);
  actualizarRuta();
  cargar();
}

function irRaiz() {
  padreActual = ruta[0].id;
  padreDrive = ruta[0].drive;
  ruta = [ruta[0]];
  actualizarRuta();
  cargar();
}

/* 🔥 LOADER */
function showGlobalLoader() {
  document.getElementById("globalLoader").classList.remove("hidden");
}

function hideGlobalLoader() {
  document.getElementById("globalLoader").classList.add("hidden");
}

/* 🔥 TOAST */
function toast(msg){
  const t=document.getElementById("toast");
  t.innerText=msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),3000);
}

function logout(){
  localStorage.removeItem("usuario");
  window.location.href="index.html";
}
