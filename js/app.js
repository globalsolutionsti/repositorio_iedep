const API = "https://script.google.com/macros/s/AKfycbw1ivWeBv0Fh6fiM9hQM_x8VXOtLpb_EhJHAxRVYwP5cyxNYBB7iTYFt8wyP5tppLGk/exec";

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
