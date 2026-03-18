const API_URL = "https://script.google.com/macros/s/AKfycbzeir5BEIVXP46xcQzbjgRUVggVYripPu0hv_9PvGZaLu_81T0UoH3gQPbLeq3Z-pDs/exec";

function login() {
  const usuario = document.getElementById('usuario').value;
  const pin = document.getElementById('pin').value;

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'login',
      usuario: usuario,
      pin: pin
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.status) {
      alert('Bienvenido ' + data.usuario);
    } else {
      alert('Error de acceso');
    }
  });
}
