const API = "https://script.google.com/macros/s/AKfycbw1ivWeBv0Fh6fiM9hQM_x8VXOtLpb_EhJHAxRVYwP5cyxNYBB7iTYFt8wyP5tppLGk/exec";

const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nombreUsuario").innerText = user.nombre;
});

let padreActual = 0;
let padreDrive = "";

// 🔥 OBTENER ROOT
function init() {
  fetch(`${API}?action=getRoot`)
  .then(r => r.json())
  .then(root => {
    console.log("ROOT:", root);

    padreActual = root.id;
    padreDrive = root.drive;

    cargar();
  });
}

// 🔥 CARGAR ESTRUCTURA
function cargar() {
  fetch(`${API}?action=getEstructura&padre=${padreActual}`)
  .then(r => r.json())
  .then(render);
}

// 🔥 RENDER
function render(data) {
  const cont = document.getElementById("explorador");
  cont.innerHTML = "";

  data.forEach(row => {
    const tipo = row[2];
    const icono = tipo === "carpeta" ? "📁" : "📄";

    cont.innerHTML += `
      <div class="card-item" onclick="abrir(${row[0]}, '${tipo}', '${row[4]}')">
        <div class="icon">${icono}</div>
        <div>${row[1]}</div>
      </div>
    `;
  });
}

// 🔥 ABRIR
function abrir(id, tipo, driveId) {
  if (tipo === "carpeta") {
    padreActual = id;
    padreDrive = driveId;
    cargar();
  } else {
    window.open(`https://drive.google.com/file/d/${driveId}`);
  }
}

// 🔥 VOLVER A RAÍZ
function irRaiz() {
  init();
}

// 🔥 CREAR CARPETA
function nuevaCarpeta() {
  const nombre = prompt("Nombre carpeta");

  if (!nombre) return;

  const url = `${API}?action=crearCarpeta&nombre=${encodeURIComponent(nombre)}&padre=${padreActual}&padre_drive=${padreDrive}`;

  console.log("URL:", url);

  fetch(url)
  .then(r => r.json())
  .then(res => {
    console.log("RESPUESTA:", res);

    if(res.status){
      alert("Carpeta creada");
      cargar();
    } else {
      alert("Error: " + res.error);
    }
  })
  .catch(err => {
    console.error("ERROR:", err);
    alert("Error real en conexión");
  });
}

// 🔥 SUBIR ARCHIVO (MEJORADO)
function subir() {

  const fileInput = document.getElementById("fileInput");

  if (!fileInput.files.length) {
    alert("Selecciona un archivo");
    return;
  }

  const file = fileInput.files[0];

  const reader = new FileReader();

  reader.onload = function(e) {

    const base64 = e.target.result.split(",")[1];

    const url = `${API}?action=subirArchivo
      &nombre=${encodeURIComponent(file.name)}
      &tipo=${file.type}
      &padre=${padreActual}
      &padre_drive=${padreDrive}
      &archivo=${encodeURIComponent(base64)}`;

    console.log("SUBIDA URL:", url);

    fetch(url)
    .then(r => r.json())
    .then(res => {
      console.log("RESPUESTA:", res);

      if(res.status){
        alert("Archivo subido");
        cargar();
      } else {
        alert("Error: " + res.error);
      }
    })
    .catch(err => {
      console.error("ERROR:", err);
      alert("Error real en subida");
    });

  };

  reader.readAsDataURL(file);
}
// 🔥 LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// 🔥 INICIO
window.onload = init;
