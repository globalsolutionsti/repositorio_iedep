const API = "https://script.google.com/macros/s/AKfycbyxK9UZIWJN73jd5XCNgiLytHxoE_XJDaqrYoT3feCRhXSfW_6DC4q19RN3DdswZOwQ/exec";
const user = JSON.parse(localStorage.getItem("user"));

let padreActual = 0;
let padreDrive = "";
let ruta = []; // 🔥 historial navegación

if (!user) {
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nombreUsuario").innerText = user.nombre;
});

// 🔥 OBTENER ROOT
function init() {
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

  cont.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(row => {

          const tipo = row[2];
          const nombre = row[1];
          const driveId = row[4];

          return `
            <tr>
              <td onclick="abrir(${row[0]}, '${tipo}', '${driveId}', '${nombre}')">
                ${tipo === "carpeta" ? "📁" : "📄"} ${nombre}
              </td>
              <td>${tipo}</td>
              <td>
                ${tipo === "archivo" 
                  ? `<a href="https://drive.google.com/file/d/${driveId}" target="_blank">Abrir</a>`
                  : ''}
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

// 🔥 ABRIR
function abrir(id, tipo, driveId, nombre) {

  if (tipo === "carpeta") {

    // 🔥 EVITAR DUPLICADOS
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
  headers: {
    "Content-Type": "text/plain;charset=utf-8"
  }
})
    .then(r => r.json())
    .then(res => {

      if(res.status){
        alert("Archivo subido correctamente");
        cargar();
      } else {
        alert("Error: " + res.error);
      }

    })
    .catch(err => {
      console.error(err);
      alert("Error real en subida");
    });

  };

  reader.readAsDataURL(file);
}


function actualizarRuta() {
  const cont = document.getElementById("ruta");

  cont.innerHTML = ruta.map((r, i) => {
    return `<span onclick="irA(${i})">${r.nombre}</span>`;
  }).join(" / ");
}

function irA(index) {
  const nivel = ruta[index];

  padreActual = nivel.id;
  padreDrive = nivel.drive;

  ruta = ruta.slice(0, index + 1);

  actualizarRuta();
  cargar();
}

// 🔥 LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// 🔥 INICIO
window.onload = init;
