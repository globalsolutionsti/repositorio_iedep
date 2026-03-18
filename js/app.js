const API = "https://script.google.com/macros/s/AKfycbzN8BoLMmbWVJACVtvlQVnoX29PKCV3xN0U-X6GCuve8OUWONh5Mjq11wXr5kM2g3Uo/exec";

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
