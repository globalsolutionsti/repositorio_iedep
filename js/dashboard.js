const API_URL = "https://script.google.com/macros/s/AKfycbxzSE4pJ4gk3DSF1f9wkdgbgOC18lKC8xeWNT0Y8zvm4HjNENX9_jlQVtOlBDS9DsW0/exec";

let padreActual = 0;
let padreDrive = "ID_ROOT";

function cargar() {
  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "getEstructura",
      padre: padreActual
    })
  })
  .then(r => r.json())
  .then(render);
}

function render(data) {
  const cont = document.getElementById("explorador");
  cont.innerHTML = "";

  data.forEach(row => {
    const tipo = row[2];
    const icono = tipo === "carpeta" ? "📁" : "📄";

    cont.innerHTML += `
      <div class="card-item" onclick="abrir(${row[0]}, '${row[2]}', '${row[4]}')">
        <div class="icon">${icono}</div>
        <div>${row[1]}</div>
      </div>
    `;
  });
}

function abrir(id, tipo, driveId) {
  if (tipo === "carpeta") {
    padreActual = id;
    padreDrive = driveId;
    cargar();
  } else {
    window.open("https://drive.google.com/file/d/" + driveId);
  }
}

function nuevaCarpeta() {
  const nombre = prompt("Nombre carpeta");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "crearCarpeta",
      nombre,
      padre: padreActual,
      padre_drive: padreDrive
    })
  }).then(cargar);
}

function subir() {
  const file = document.getElementById("fileInput").files[0];
  const reader = new FileReader();

  reader.onload = function() {
    const base64 = reader.result.split(",")[1];

    fetch(API, {
      method: "POST",
      body: JSON.stringify({
        action: "subirArchivo",
        nombre: file.name,
        tipo: file.type,
        archivo: base64,
        padre: padreActual,
        padre_drive: padreDrive
      })
    }).then(cargar);
  };

  reader.readAsDataURL(file);
}

function logout() {
  localStorage.clear();
  window.location = "index.html";
}

window.onload = cargar;
