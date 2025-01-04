// Variables globales para almacenar la información del JSON
let baseDatos = {};
let usuarios = [];
let historialCompras = {};
let productos = [];
let historialEntradas = [];

// Al cargar la página, hacemos el fetch de nuestro base_de_datos.json
window.addEventListener('DOMContentLoaded', () => {
  fetch('base_de_datos.json')
    .then(res => res.json())
    .then(data => {
      baseDatos         = data;
      usuarios         = data.usuarios;
      historialCompras = data.historialCompras;
      productos        = data.productos;
      historialEntradas= data.historialEntradas;
      // Llenamos el select de usuarios
      cargarSelectUsuarios();
      // Opcionalmente, mostramos por defecto alguna sección
      // mostrarSeccion('seccion-individual');
    })
    .catch(err => console.error('Error al cargar el JSON:', err));
});

// Función para mostrar/ocultar secciones
function mostrarSeccion(id) {
  document.querySelectorAll('section').forEach(sec => sec.classList.add('oculta'));
  document.getElementById(id).classList.remove('oculta');
}

// Llenar select de usuarios
function cargarSelectUsuarios() {
  const select = document.getElementById('select-usuario');
  select.innerHTML = '';
  usuarios.forEach(u => {
    const option = document.createElement('option');
    option.value = u.nombre;
    option.textContent = u.nombre;
    select.appendChild(option);
  });
}

// Mostrar info del usuario seleccionado
function mostrarUsuario() {
  const nombreUsuario = document.getElementById('select-usuario').value;
  const usuarioObj    = usuarios.find(u => u.nombre === nombreUsuario);
  const contenedor    = document.getElementById('info-usuario');
  contenedor.innerHTML = '';

  if (!usuarioObj) {
    contenedor.innerHTML = '<p>Usuario no encontrado.</p>';
    return;
  }

  // Datos básicos
  let html = `
    <p><strong>Nombre:</strong> ${usuarioObj.nombre}</p>
    <p><strong>Adeudo:</strong> $${usuarioObj.adeudo.toFixed(2)}</p>
    <p><strong>Ganancia:</strong> $${usuarioObj.ganancia.toFixed(2)}</p>
  `;

  // Historial de compras
  let compras = historialCompras[usuarioObj.nombre];
  if (!compras || compras.length === 0) {
    html += `<p>No hay compras registradas para este usuario.</p>`;
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Piezas</th>
            <th>Costo Total</th>
            <th>Fecha</th>
            <th>Ganancia</th>
          </tr>
        </thead>
        <tbody>
    `;
    compras.forEach(c => {
      html += `
        <tr>
          <td>${c.producto}</td>
          <td>${c.piezas}</td>
          <td>$${c.costoTotal.toFixed(2)}</td>
          <td>${c.fecha}</td>
          <td>$${c.ganancia.toFixed(2)}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  contenedor.innerHTML = html;
}

// Consulta Global
function mostrarConsultaGlobal() {
  const infoGlobal     = document.getElementById('info-global');
  const {
    numInversionistas,
    totalInversion,
    gastoEnProductos,
    inversionRecuperada,
    gananciasTotales
  } = baseDatos;

  // Mostramos info global básica
  let html = `
    <p><strong>Núm. Inversionistas:</strong> ${numInversionistas}</p>
    <p><strong>Inversión Total:</strong> $${totalInversion.toFixed(2)}</p>
    <p><strong>Gasto en Productos:</strong> $${gastoEnProductos.toFixed(2)}</p>
    <p><strong>Inversión Recuperada:</strong> $${inversionRecuperada.toFixed(2)}</p>
    <p><strong>Ganancias Totales:</strong> $${gananciasTotales.toFixed(2)}</p>
  `;

  // Tabla de productos (opcional)
  if (productos && productos.length > 0) {
    html += `
      <h3>Productos en Inventario</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Precio Compra</th>
            <th>Precio Venta</th>
            <th>Piezas</th>
          </tr>
        </thead>
        <tbody>
    `;
    productos.forEach(p => {
      html += `
        <tr>
          <td>${p.codigo}</td>
          <td>${p.descripcion}</td>
          <td>$${p.precioCompra.toFixed(2)}</td>
          <td>$${p.precioVenta.toFixed(2)}</td>
          <td>${p.piezas}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Historial de entradas (opcional)
  if (historialEntradas && historialEntradas.length > 0) {
    html += `
      <h3>Historial de Entradas</h3>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Costo Total</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
    `;
    historialEntradas.forEach(e => {
      html += `
        <tr>
          <td>${e.producto}</td>
          <td>${e.cantidad}</td>
          <td>$${e.costoTotal.toFixed(2)}</td>
          <td>${e.fecha}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  infoGlobal.innerHTML = html;
}

// Para que cargue la sección global cuando se muestre
function mostrarSeccion(id) {
  document.querySelectorAll('section').forEach(sec => sec.classList.add('oculta'));
  document.getElementById(id).classList.remove('oculta');
  
  if (id === 'seccion-global') {
    mostrarConsultaGlobal();
  }
}
