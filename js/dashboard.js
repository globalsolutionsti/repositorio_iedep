const API_URL = "TU_URL_DEPLOY";

window.onload = () => {
  const user = localStorage.getItem('usuario');
  if(!user) {
    window.location.href = 'index.html';
  } else {
    loadDocumentos();
  }
};

function loadDocumentos() {
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'getDocumentos' })
  })
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector('#tablaDocs tbody');
    tbody.innerHTML = '';

    data.forEach((row, i) => {
      if(i === 0) return;

      tbody.innerHTML += `
        <tr>
          <td>${row[1]}</td>
          <td>${row[5]}</td>
          <td>${row[4]}</td>
          <td><a href="${row[3]}" target="_blank">Ver</a></td>
        </tr>
      `;
    });
  });
}

function subirArchivo() {
  alert('Siguiente paso: integración con Google Drive');
}
