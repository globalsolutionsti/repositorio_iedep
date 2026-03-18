const API_URL = "https://script.google.com/macros/s/AKfycbz3yMl9gFYvv40j5HyK5QiKNf9TCIMTyd7zdR-9c2ryYvMT8c0NGp7JmtW7VrXs8qH2/exec";

function login() {
  const usuario = document.getElementById('usuario').value;
  const pin = document.getElementById('pin').value;

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'login',
      usuario,
      pin
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.status) {
      localStorage.setItem('usuario', JSON.stringify(data));
      window.location.href = 'dashboard.html';
    } else {
      alert('Credenciales incorrectas');
    }
  });
}
