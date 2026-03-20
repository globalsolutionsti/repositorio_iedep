const API = "https://script.google.com/macros/s/AKfycbzP4svJKIiJPPMBIVNInV6P7gr-vjc8wzg_JgmxjqufZJ3r0WXGxi-N2V41HT4dIZ72/exec";

function login() {

  const usuario = document.getElementById("usuario").value.trim();
  const pin = document.getElementById("pin").value.trim();

  // 🔥 VALIDACIÓN
  if (!usuario || !pin) {
    alert("Ingresa usuario y PIN");
    return;
  }

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      usuario: usuario,
      pin: pin
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    }
  })
  .then(r => r.json())
  .then(res => {

    console.log("LOGIN RESPONSE:", res);

    // 🔥 VALIDACIÓN DE RESPUESTA
    if (res && res.status) {

      // 🔥 GUARDADO CORRECTO DE SESIÓN
      const userData = {
        usuario: usuario,
        nombre: res.nombre || usuario
      };

      localStorage.setItem("usuario", JSON.stringify(userData));

      // 🔥 REDIRECCIÓN SEGURA
      window.location.href = "dashboard.html";

    } else {
      alert(res.error || "Usuario o PIN incorrecto");
    }

  })
  .catch(err => {
    console.error(err);
    alert("Error de conexión con el servidor");
  });
}
