const API = "https://script.google.com/macros/s/AKfycbzPH4xDXOU14Hcldpo_g08B6MtJrGajOz0ojbwEqIMlNDxmdQ-e-ghyIjynzSTnf9rl/exec";

let padreActual = 0;
let padreDrive = "";
let ruta = [];
let user = null;

// 🔥 INIT
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

  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", function () {
      const file = this.files[0];
      document.getElementById("fileName").innerText = file ? file.name : "Ningún archivo seleccionado";
    });
  }

  init(); // 🔹 Mostramos loader global al inicio
});

// 🔥 ROOT
function init() {
  showGlobalLoader(); // 🔹 MOSTRAR spinner global desde el inicio
  fetch(`${API}?action=getRoot`)
    .then(r => r.json())
    .then(root => {
      padreActual = root.id;
      padreDrive = root.drive;
      ruta = [{ id: root.id, nombre: root.nombre, drive: root.drive }];
      actualizarRuta();
      cargar(true); // 🔹 Ahora mostramos loader global al cargar estructura
    })
    .catch(err => {
      console.error(err);
      toast("Error cargando raíz");
    })
    .finally(() => hideGlobalLoader(true)); // 🔹 Forzamos ocultar siempre
}

// 🔥 CARGAR
function cargar(mostrarLoaderGlobal = true) {
  if (mostrarLoaderGlobal) showGlobalLoader();

  const cacheKey = "estructura_" + padreActual;
  const cache = localStorage.getItem(cacheKey);

  if (cache) {
    try { render(JSON.parse(cache)); } catch (e) { console.warn("Cache corrupto"); }
  }

  fetch(`${API}?action=getEstructura&padre=${padreActual}`)
    .then(r => r.json())
    .then(data => {
      render(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    })
    .catch(err => {
      console.error(err);
      toast("Error cargando estructura");
    })
    .finally(() => hideGlobalLoader(true)); // 🔹 Forzar ocultar loader global
}

// 🔥 RENDER
function render(data) {
  const cont = document.getElementById("explorador");
  if (!data || data.length === 0) { cont.innerHTML = "<p>Sin elementos</p>"; return; }

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

// 🔥 ABRIR
function abrir(id, tipo, driveId, nombre) {
  if (tipo === "carpeta") {
    const ultimo = ruta[ruta.length - 1];
    if (ultimo && ultimo.id === id) return;
    padreActual = id; padreDrive = driveId;
    ruta.push({ id, nombre, drive: driveId });
    actualizarRuta();
    cargar(true);
  } else { window.open(`https://drive.google.com/file/d/${driveId}`); }
}

// 🔥 RUTA
function actualizarRuta() {
  document.getElementById("ruta").innerHTML =
    ruta.map((r, i) => `<span style="cursor:pointer" onclick="irA(${i})">${r.nombre}</span>`).join(" / ");
}

// 🔥 NAVEGAR
function irA(index) {
  const nivel = ruta[index];
  padreActual = nivel.id; padreDrive = nivel.drive;
  ruta = ruta.slice(0, index + 1);
  actualizarRuta();
  cargar(true);
}

// 🔥 RAÍZ
function irRaiz() { init(); }

// 🔥 CACHE
function limpiarCache() { Object.keys(localStorage).forEach(k => { if (k.startsWith("estructura_")) localStorage.removeItem(k); }); }

// 🔥 NUEVA CARPETA
function nuevaCarpeta() {
  const nombre = prompt("Nombre de la carpeta"); if (!nombre) return;
  mostrarLoader();
  fetch(API, {
    method: "POST",
    body: JSON.stringify({ action: "crearCarpeta", nombre, padre: padreActual, padre_drive: padreDrive }),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
  .then(r => r.json())
  .then(res => {
    if (res.status) { toast("Carpeta creada correctamente"); limpiarCache(); cargar(true); }
    else toast("Error: " + res.error);
  })
  .catch(err => { console.error(err); toast("Error de conexión"); })
  .finally(() => ocultarLoader());
}

// 🔥 SUBIR
function subir() {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) { toast("Selecciona un archivo"); return; }
  subirArchivoDirecto(fileInput.files[0]);
}

// 🔥 SUBIR DIRECTO
function subirArchivoDirecto(file) {
  mostrarLoader();
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result.split(",")[1];
    fetch(API, {
      method: "POST",
      body: JSON.stringify({ action:"subirArchivo", nombre:file.name, tipo:file.type, archivo:base64, padre:padreActual, padre_drive:padreDrive }),
      headers: {"Content-Type":"text/plain;charset=utf-8"}
    })
    .then(r=>r.json())
    .then(res=>{
      if(res.status){ toast("Archivo subido correctamente"); limpiarCache(); cargar(true); }
      else toast("Error: "+res.error);
    })
    .catch(err=>{ console.error(err); toast("Error en subida"); })
    .finally(()=>ocultarLoader());
  };
  reader.readAsDataURL(file);
}

// 🔥 ICONOS
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

// 🔥 LOADER LOCAL
function mostrarLoader() { document.getElementById("loader").classList.remove("hidden"); }
function ocultarLoader() { document.getElementById("loader").classList.add("hidden"); }

// 🔥 LOADER GLOBAL
let loaderCount=0, loaderTimeout;
function showGlobalLoader(){
  loaderCount++;
  const el=document.getElementById("globalLoader");
  if(loaderCount===1){
    el.classList.remove("hidden");
    loaderTimeout = setTimeout(()=>{
      console.warn("Loader forzado cerrado tras 10s");
      loaderCount=0; el.classList.add("hidden");
    },10000);
  }
}
function hideGlobalLoader(force=false){
  const el=document.getElementById("globalLoader");
  if(force){ loaderCount=0; el.classList.add("hidden"); clearTimeout(loaderTimeout); return; }
  loaderCount--; if(loaderCount<=0){ loaderCount=0; el.classList.add("hidden"); clearTimeout(loaderTimeout);}
}

// 🔥 TOAST
function toast(msg){ const t=document.getElementById("toast"); t.innerText=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),3000); }

// 🔥 LOGOUT
function logout(){ localStorage.removeItem("usuario"); window.location.href="index.html"; }

// 🔥 DRAG & DROP
const dropZone = document.getElementById("dropZone");
["dragenter","dragover","dragleave","drop"].forEach(event=>{
  document.addEventListener(event,e=>{ e.preventDefault(); e.stopPropagation(); },false);
});
document.addEventListener("dragenter",()=>{ if(dropZone) dropZone.classList.remove("hidden"); });
document.addEventListener("dragleave",(e)=>{ if(e.clientX===0 && e.clientY===0){ if(dropZone) dropZone.classList.add("hidden"); }});
document.addEventListener("drop",(e)=>{
  if(dropZone) dropZone.classList.add("hidden");
  const files=e.dataTransfer.files;
  if(!files||files.length===0){ toast("No se detectó archivo"); return; }
  subirArchivoDirecto(files[0]);
});
