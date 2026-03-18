const API = "https://script.google.com/macros/s/AKfycbzN8BoLMmbWVJACVtvlQVnoX29PKCV3xN0U-X6GCuve8OUWONh5Mjq11wXr5kM2g3Uo/exec";

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

  console.log("USER:", user);

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("nombreUsuario").innerText = user.nombre;

  init();
});


// 🔥 OBTENER RAÍZ
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
    })
    .catch(err => {
      console.error(err);
      alert("Error cargando raíz");
    });
}


// 🔥 CARGAR ESTRUCTURA
function cargar() {
  fetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(r => r.json())
    .then(data => render(data))
    .catch(err => {
      console.error(err);
      alert("Error cargando estructura");
    });
}


// 🔥 RENDER (TIPO SHAREPOINT)
function render(data) {
  const cont = document.getElementById("explorador");

  if (!data || data.length === 0) {
    cont.innerHTML = "<p>Sin elementos</p>";
    return;
  }

  cont.innerHTML = `
    <div class="grid-cards">
      ${data.map(row => {

        const id = row[0];
        const nombre = row[1];
        const tipo = row[2];
        const driveId = row[4];

        const icono = obtenerIcono(nombre, tipo);

        return `
          <div class="card-item" onclick="abrir(${id}, '${tipo}', '${driveId}', '${nombre}')">
            
            <div class="card-icon">${icono}</div>

            <div class="card-name">${nombre}</div>

            <div class="card-type">${tipo}</div>

          </div>
        `;
      }).join("")}
    </div>
  `;
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


// 🔥 BREADCRUMB DINÁMICO
function actualizarRuta() {
  const cont = document.getElementById("ruta");

  cont.innerHTML = ruta.map((r, i) => {
    return `<span style="cursor:pointer" onclick="irA(${i})">${r.nombre}</span>`;
  }).join(" / ");
}


// 🔥 NAVEGAR A NIVEL
function irA(index) {

  const nivel = ruta[index];

  padreActual = nivel.id;
  padreDrive = nivel.drive;

  ruta = ruta.slice(0, index + 1);

  actualizarRuta();
  cargar();
}


// 🔥 VOLVER A RAÍZ
function irRaiz() {
  init();
}


// 🔥 CREAR CARPETA (POST FIX)
function nuevaCarpeta() {

  const nombre = prompt("Nombre carpeta");

  if (!nombre) return;

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "crearCarpeta",
      nombre: nombre,
      padre: padreActual,
      padre_drive: padreDrive
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    }
  })
  .then(r => r.json())
  .then(res => {

    if (res.status) {
      alert("Carpeta creada");
      cargar();
    } else {
      alert("Error: " + res.error);
    }

  })
  .catch(err => {
    console.error(err);
    alert("Error real en conexión");
  });
}


// 🔥 SUBIR ARCHIVO (FUNCIONAL)
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

      if (res.status) {
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


// 🔥 LOGOUT
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}
