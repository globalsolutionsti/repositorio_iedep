const API = "https://script.google.com/macros/s/AKfycbyxK9UZIWJN73jd5XCNgiLytHxoE_XJDaqrYoT3feCRhXSfW_6DC4q19RN3DdswZOwQ/exec";

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
