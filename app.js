/************************************
 * Variables globales
 ************************************/
let usuarios            = [];
let historialCompras    = {};
let numInversionistas   = 0;
let totalInversion      = 0;
let gastoEnProductos    = 0;
let inversionRecuperada = 0;
let gananciasTotales    = 0;
let productos           = [];
let historialEntradas   = [];

/************************************
 * Al cargar la ventana, hacemos fetch del JSON
 ************************************/
window.onload = () => {
  fetch('base_de_datos.json')
    .then(response => response.json())
    .then(data => {
      // Cargar datos desde el JSON
      usuarios            = data.usuarios;
      historialCompras    = data.historialCompras;
      productos           = data.productos;
      historialEntradas   = data.historialEntradas;
      numInversionistas   = data.numInversionistas;
      totalInversion      = data.totalInversion;
      gastoEnProductos    = data.gastoEnProductos;
      inversionRecuperada = data.inversionRecuperada;
      gananciasTotales    = data.gananciasTotales;

      // Llenar select para consulta individual
      llenarSelectUsuarios("select-usuario-consulta");
    })
    .catch(err => console.error("Error al cargar base_de_datos.json:", err));
};

/************************************
 * Mostrar / Ocultar Secciones
 ************************************/
function showSection(sectionId) {
  const sections = document.querySelectorAll(".section");
  sections.forEach(sec => sec.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");
}

/************************************
 * Formato de Moneda
 ************************************/
function formatMoney(amount) {
  return "$" + Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/************************************
 * Llenar Select Usuarios
 ************************************/
function llenarSelectUsuarios(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = "";
  usuarios.forEach(u => {
    const option = document.createElement("option");
    option.value = u.nombre;
    option.text = u.nombre;
    select.appendChild(option);
  });
}

/************************************
 * CONSULTA INDIVIDUAL
 ************************************/
function filtrarInformacionUsuario() {
  const usuario           = document.getElementById("select-usuario-consulta").value;
  const consultaUsuarioDiv= document.getElementById("consulta-usuario");
  const fotoUsuario       = document.getElementById("foto-usuario");
  const nombreUsuario     = document.getElementById("nombre-usuario");
  const inversionUsuario  = document.getElementById("inversion-usuario");
  const gananciaUsuario   = document.getElementById("ganancia-usuario");
  const adeudoUsuario     = document.getElementById("adeudo-usuario-estado");
  const tablaHistorial    = document.getElementById("tabla-historial").querySelector("tbody");

  consultaUsuarioDiv.classList.remove("hidden");

  const userObj = usuarios.find(u => u.nombre === usuario);
  if (!userObj) return;

  // Foto de usuario
  fotoUsuario.src = `fotos/${userObj.nombre}.jpg`;
  fotoUsuario.alt = userObj.nombre;
  fotoUsuario.onerror = function() {
    this.onerror = null;
    this.src = "fotos/default.png";
  };

  // Datos principales
  nombreUsuario.innerText = userObj.nombre;
  if (userObj.nombre === "Externo") {
    inversionUsuario.innerText = formatMoney(0);
    gananciaUsuario.innerText  = "No aplica (Externo)";
  } else {
    // En tu código original, cada inversionista tenía 500
    inversionUsuario.innerText = formatMoney(500);
    gananciaUsuario.innerText  = formatMoney(userObj.ganancia);
  }

  // Adeudo
  if (userObj.adeudo > 0) {
    adeudoUsuario.innerText     = `Adeudo: ${formatMoney(userObj.adeudo)}`;
    adeudoUsuario.classList.add("red");
    adeudoUsuario.classList.remove("green");
  } else {
    adeudoUsuario.innerText     = "Sin adeudos";
    adeudoUsuario.classList.add("green");
    adeudoUsuario.classList.remove("red");
  }

  // Historial de compras
  tablaHistorial.innerHTML = "";
  const historial = historialCompras[userObj.nombre];
  if (!historial || historial.length === 0) {
    let row = document.createElement("tr");
    row.innerHTML = `<td colspan="5">Sin compras registradas</td>`;
    tablaHistorial.appendChild(row);
  } else {
    historial.forEach(compra => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${compra.producto}</td>
        <td>${compra.piezas}</td>
        <td>${formatMoney(compra.costoTotal)}</td>
        <td>${compra.fecha}</td>
        <td>${formatMoney(compra.ganancia)}</td>
      `;
      tablaHistorial.appendChild(row);
    });
  }
}

/************************************
 * IMPRIMIR REPORTE DE USUARIO
 ************************************/
function imprimirReporteUsuario() {
  const usuario = document.getElementById("select-usuario-consulta").value;
  const userObj = usuarios.find(u => u.nombre === usuario);
  if (!userObj) {
    alert("Usuario no encontrado.");
    return;
  }

  let contenidoHTML = `<p><strong>Usuario:</strong> ${userObj.nombre}</p>`;
  if (userObj.nombre !== "Externo") {
    contenidoHTML += `<p><strong>Inversión:</strong> ${formatMoney(500)}</p>`;
    contenidoHTML += `<p><strong>Ganancia Total:</strong> ${formatMoney(userObj.ganancia)}</p>`;
  } else {
    contenidoHTML += `<p><strong>Inversión:</strong> 0 (Externo)</p>`;
    contenidoHTML += `<p><strong>Ganancia Total:</strong> N/A (Externo)</p>`;
  }
  contenidoHTML += `<p><strong>Adeudo:</strong> ${formatMoney(userObj.adeudo)}</p>`;

  const historial = historialCompras[userObj.nombre];
  if (!historial || historial.length === 0) {
    contenidoHTML += `<p>Sin compras registradas</p>`;
  } else {
    contenidoHTML += `
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Piezas</th>
          <th>CostoTotal</th>
          <th>Fecha</th>
          <th>Ganancia</th>
        </tr>
      </thead>
      <tbody>
    `;
    historial.forEach(compra => {
      contenidoHTML += `
        <tr>
          <td>${compra.producto}</td>
          <td>${compra.piezas}</td>
          <td>${formatMoney(compra.costoTotal)}</td>
          <td>${compra.fecha}</td>
          <td>${formatMoney(compra.ganancia)}</td>
        </tr>
      `;
    });
    contenidoHTML += `</tbody></table>`;
  }

  mostrarVentanaImpresion(contenidoHTML, "Reporte de Usuario");
}

/************************************
 * MOSTRAR VENTANA EMERGENTE (Imprimir)
 ************************************/
function mostrarVentanaImpresion(htmlContenido, titulo) {
  let ventana = window.open("", "Reporte", "width=900,height=600");
  ventana.document.write(`
    <html>
      <head>
        <title>${titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
          table {
            margin: 0 auto;
            border-collapse: collapse; 
            width: 80%;
          }
          th, td {
            border: 1px solid #ccc; 
            padding: 8px; 
            text-align: center;
          }
          button {
            background-color: #009ee3; 
            color: #fff; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 6px; 
            cursor: pointer;
            margin: 10px;
          }
        </style>
      </head>
      <body>
        <h2>${titulo}</h2>
        ${htmlContenido}
        <button onclick="window.print()">Imprimir</button>
      </body>
    </html>
  `);
  ventana.document.close();
}

/************************************
 * CONSULTA GLOBAL
 ************************************/
function actualizarConsultaInversion() {
  const invTotalEl     = document.getElementById("inv-total");
  const invGananciasEl = document.getElementById("inv-ganancias");
  const invSaldoEl     = document.getElementById("inv-saldo");
  const invAdeudosEl   = document.getElementById("inv-adeudos");

  let saldoActual  = totalInversion - (gastoEnProductos - inversionRecuperada);
  let totalAdeudos = usuarios.reduce((acum, u) => acum + u.adeudo, 0);

  invTotalEl.innerText     = formatMoney(totalInversion);
  invGananciasEl.innerText = formatMoney(gananciasTotales);
  invSaldoEl.innerText     = formatMoney(saldoActual);
  invAdeudosEl.innerText   = formatMoney(totalAdeudos);

  const tbody = document.getElementById("tabla-usuarios-ganancias").querySelector("tbody");
  tbody.innerHTML = "";

  let usuariosConGanancia = [...usuarios].filter(u => u.nombre !== "Externo");
  usuariosConGanancia.sort((a, b) => b.ganancia - a.ganancia);

  usuariosConGanancia.forEach(u => {
    let totalCompras = 0;
    (historialCompras[u.nombre] || []).forEach(c => {
      totalCompras += c.costoTotal;
    });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <img src="fotos/${u.nombre}.jpg" alt="${u.nombre}" class="foto-usuario-tabla"
          onerror="this.onerror=null; this.src='fotos/default.png';"/>
      </td>
      <td>${u.nombre}</td>
      <td>${formatMoney(totalCompras)}</td>
      <td>${formatMoney(u.ganancia)}</td>
    `;
    if (u.adeudo > 0) {
      row.classList.add("con-adeudo");
    }
    tbody.appendChild(row);
  });
}

/************************************
 * DESCARGAR BASE DE DATOS EN JSON
 ************************************/
function descargarBaseDeDatosJSON() {
  const data = {
    usuarios,
    historialCompras,
    productos,
    historialEntradas,
    numInversionistas,
    totalInversion,
    gastoEnProductos,
    inversionRecuperada,
    gananciasTotales
  };
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "base_de_datos.json";
  link.click();

  URL.revokeObjectURL(url);
}

/************************************
 * MOSTRAR INVENTARIO (solo lectura)
 ************************************/
function mostrarInventario() {
  const tbody = document
    .getElementById("tabla-inventario")
    .querySelector("tbody");
  tbody.innerHTML = "";

  productos.forEach((prod) => {
    const row = document.createElement("tr");
    if (prod.piezas === 0) {
      // Subrayar en rojo si no hay stock
      row.style.backgroundColor = "#ffd4d4";
    }
    row.innerHTML = `
      <td>${prod.codigo}</td>
      <td>${prod.descripcion}</td>
      <td>${formatMoney(prod.precioCompra)}</td>
      <td>${formatMoney(prod.precioVenta)}</td>
      <td>${prod.piezas}</td>
    `;
    tbody.appendChild(row);
  });
}

/************************************
 * PANTALLA COMPLETA DE TABLA
 ************************************/
function toggleFullscreen(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Si no estamos en fullscreen, lo pedimos
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      alert(`Error al intentar entrar en pantalla completa: ${err.message}`);
    });
  } else {
    // Si ya estamos en fullscreen, salimos
    document.exitFullscreen();
  }
}
