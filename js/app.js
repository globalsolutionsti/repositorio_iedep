const API_URL = "https://script.google.com/macros/s/AKfycbyGGvQ9LjXKumtDo5d6Nbn9bF5bZAn95OQ8bZk86aHSsgPakaGjHieEDtDZk9c1mSLv/exec";

function login() {
  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      usuario: usuario.value,
      pin: pin.value
    })
  })
  .then(r => r.json())
  .then(d => {
    if (d.status) {
      localStorage.setItem("user", JSON.stringify(d));
      window.location = "dashboard.html";
    } else {
      alert("Usuario incorrecto");
    }
  });
}
