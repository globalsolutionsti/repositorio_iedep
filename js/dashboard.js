const API = "https://script.google.com/macros/s/AKfycbwbY1bdXy9IJqBn9_pwF_5JNnHF3LDLbVR0Y1-Y1JYDtwiqkaWjt2V3tqfHGI76ZF-6/exec";

let padreActual = 0;
let padreDrive = "";

// 🔥 CARGAR ROOT REAL DESDE SHEETS
function init() {
  fetch(API, {
    method: "POST",
    body: JSON.stringify({ action: "getRoot" })
  })
  .then(r => r.json())
  .then(root => {
    padreActual = root.id;
    padreDrive = root.drive;
    cargar();
  });
}

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
      <div class="card-item" onclick="abrir(${row[0]}, '${tipo}', '${row[4]}')">
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

// 🔥 NUEVA FUNCIÓN
function irRaiz() {
  init();
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
  }).then(() => cargar());
}

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
    })
    .then(r => r.json())
    .then(res => {
      if(res.status){
        alert("Archivo subido");
        cargar();
      } else {
        console.error(res.error);
        alert("Error real: " + res.error);
      }
    });
  };

  reader.readAsDataURL(file);
}

function logout() {
  localStorage.clear();
  window.location = "index.html";
}

window.onload = init;
