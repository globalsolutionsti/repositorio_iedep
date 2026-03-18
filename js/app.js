const API = "https://script.google.com/macros/s/AKfycbwbY1bdXy9IJqBn9_pwF_5JNnHF3LDLbVR0Y1-Y1JYDtwiqkaWjt2V3tqfHGI76ZF-6/exec";

function login() {

  const usuario = document.getElementById("usuario").value;
  const pin = document.getElementById("pin").value;

  if (!usuario || !pin) {
    alert("Completa todos los campos");
    return;
  }

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      usuario: usuario,
      pin: pin
    })
  })
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
