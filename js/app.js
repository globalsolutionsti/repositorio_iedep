const API = "https://script.google.com/macros/s/AKfycbygPg3UH5H8ZenwCamz6QtSa0gAe1P_UMgp4SznCQacnYoA0pAZEVE0tp1GeCWJj9PK/exec";

function login() {

  const usuario = document.getElementById("usuario").value;
  const pin = document.getElementById("pin").value;

  if (!usuario || !pin) {
    alert("Completa todos los campos");
    return;
  }

  fetch(`${API}?action=login&usuario=${usuario}&pin=${pin}`)
  .then(r => r.json())
  .then(d => {
    if (d.status) {
      localStorage.setItem("user", JSON.stringify(d));
      window.location.href = "dashboard.html";
    } else {
      alert("Usuario o PIN incorrecto");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error de conexión");
  });
}
