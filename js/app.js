const API = "https://script.google.com/macros/s/AKfycbzN8BoLMmbWVJACVtvlQVnoX29PKCV3xN0U-X6GCuve8OUWONh5Mjq11wXr5kM2g3Uo/exec";

function login() {

  const usuario = document.getElementById("usuario").value;
  const pin = document.getElementById("pin").value;

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

    if (res.status) {

      localStorage.setItem("usuario", JSON.stringify(res.usuario));

      window.location.href = "dashboard.html";

    } else {
      alert("PIN incorrecto");
    }

  })
  .catch(err => {
    console.error(err);
    alert("Error de conexión");
  });
}
