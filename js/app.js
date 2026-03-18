const API_URL = "https://script.google.com/macros/s/AKfycbxzSE4pJ4gk3DSF1f9wkdgbgOC18lKC8xeWNT0Y8zvm4HjNENX9_jlQVtOlBDS9DsW0/exec";

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
      alert("Error");
    }
  });
}
