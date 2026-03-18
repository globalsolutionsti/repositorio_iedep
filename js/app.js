const API_URL = "https://script.google.com/macros/s/AKfycbxj82IShlz12wgYmGDsC7tWu0CXJCWEq8gQpfMjs00nuozxUz6I14KAfUAfWhIUKlkD/exec";

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
