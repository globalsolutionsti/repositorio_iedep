const API_URL = "https://script.google.com/macros/s/AKfycbz3yMl9gFYvv40j5HyK5QiKNf9TCIMTyd7zdR-9c2ryYvMT8c0NGp7JmtW7VrXs8qH2/exec";

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
