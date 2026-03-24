const API = "https://script.google.com/macros/s/AKfycbwSfSDzl8QmicDplxbOEplRLzJ_fo82s64aRYp3q4qGlB7VScQ11O7xyqBUJLme3vqK/exec";

/* ========================= 🔥 VARIABLES GLOBALES ========================= */
let padreActual = 0;
let padreDrive = "";
let ruta = [];
let user = null;
let vista = "grid";
let dataActual = [];
let filtroTipo = "todos";
let textoBusqueda = "";
let favoritos = [];

window.vista = "grid";

/* ========================= 🔥 INIT ========================= */
document.addEventListener("DOMContentLoaded", () => {
    const data = localStorage.getItem("usuario");
    if (data) user = JSON.parse(data);

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("nombreUsuario").innerText = user.nombre;

    generarMenu();
    init();
});

/* ========================= 🔥 MENU ========================= */
function generarMenu() {
    const menu = document.getElementById("menu");
    if (!menu) return;

    menu.innerHTML = `
        <a onclick="irRaiz()">📂 Documentos</a>
        <a onclick="verFavoritos()">⭐ Favoritos</a>
    `;
}

/* ========================= 🔥 FETCH ========================= */
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

/* ========================= 🔥 INIT ROOT ========================= */
function init() {
    safeFetch(`${API}?action=getRoot`)
        .then(root => {
            padreActual = root.id;
            padreDrive = root.drive;
            ruta = [{ id: root.id, nombre: root.nombre, drive: root.drive }];
            actualizarRuta();
            cargar();
        });
}

/* ========================= 🔥 CARGAR ========================= */
function cargar() {
    safeFetch(`${API}?action=getEstructura&padre=${padreActual}`)
        .then(data => {
            dataActual = data;
            render(dataActual);
        });
}

/* ========================= 🔥 RENDER ========================= */
function render(data) {
    const cont = document.getElementById("explorador");

    if (!data || data.length === 0) {
        cont.innerHTML = "<p>Sin resultados</p>";
        return;
    }

    cont.innerHTML = `
        <div class="grid-cards" id="contenedorItems"></div>
    `;

    const wrapper = document.getElementById("contenedorItems");

    data.forEach(row => {
        const [id, nombre, tipo, , driveId] = row;

        const item = document.createElement("div");
        item.className = "card-item";

        item.innerHTML = `
            <div class="card-icon">${obtenerIcono(nombre, tipo)}</div>
            <div class="card-name">${nombre}</div>
            <div class="card-type">${tipo}</div>
        `;

        item.onclick = () => abrir(id, tipo, driveId, nombre);

        wrapper.appendChild(item);
    });
}

/* ========================= 🔥 NAVEGACIÓN ========================= */
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

function actualizarRuta() {
    document.getElementById("ruta").innerHTML = ruta.map((r, i) =>
        `<span onclick="irA(${i})">${r.nombre}</span>`
    ).join(" / ");
}

function irA(index) {
    const nivel = ruta[index];
    padreActual = nivel.id;
    padreDrive = nivel.drive;
    ruta = ruta.slice(0, index + 1);
    actualizarRuta();
    cargar();
}

function irRaiz() {
    const root = ruta[0];
    padreActual = root.id;
    padreDrive = root.drive;
    ruta = [root];
    actualizarRuta();
    cargar();
}

/* ========================= 🔥 PREVIEW ========================= */
function previewArchivo(driveId) {
    const modal = document.getElementById("previewModal");
    const frame = document.getElementById("previewFrame");

    frame.src = `https://drive.google.com/file/d/${driveId}/preview`;
    modal.classList.remove("hidden");
}

function cerrarPreview() {
    document.getElementById("previewModal").classList.add("hidden");
}

/* ========================= 🔥 ICONOS ========================= */
function obtenerIcono(nombre, tipo) {
    if (tipo === "carpeta") return "📁";

    const ext = nombre.split(".").pop().toLowerCase();

    switch (ext) {
        case "pdf": return "📕";
        case "doc":
        case "docx": return "📘";
        case "xls":
        case "xlsx": return "📗";
        case "png":
        case "jpg":
        case "jpeg": return "🖼️";
        case "mp4": return "🎬";
        default: return "📄";
    }
}
