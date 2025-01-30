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
 * Al cargar la ventana
 ************************************/
window.onload = () => {
  // Forzar no cache al recargar
  fetch('base_de_datos.json?nocache=' + new Date().getTime())
    .then(response => response.json())
    .then(data => {
      data.usuarios.forEach(u => {
        if (u.saldoFavor === undefined) {
          u.saldoFavor = 0;
        }
      });

      // Cargar datos
      usuarios            = data.usuarios;
      historialCompras    = data.historialCompras;
      productos           = data.productos;
      historialEntradas   = data.historialEntradas;
      numInversionistas   = data.numInversionistas;
      totalInversion      = data.totalInversion;
      gastoEnProductos    = data.gastoEnProductos;
      inversionRecuperada = data.inversionRecuperada;
      gananciasTotales    = data.gananciasTotales;

      // Llenar select
      llenarSelectUsuarios("select-usuario-consulta");
    })
    .catch(err => console.error("Error al cargar base_de_datos.json:", err));
};

/************************************
 * Mostrar / Ocultar Secciones
 ************************************/
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");
}

/************************************
 * Formato dinero
 ************************************/
function formatMoney(amount) {
  return "$" + Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/************************************
 * Llenar select
 ************************************/
function llenarSelectUsuarios(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = "";
  usuarios.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.nombre;
    opt.text = u.nombre;
    sel.appendChild(opt);
  });
}

/************************************
 * Del input date => YYYYMMDD
 ************************************/
function parseInputDay(value) {
  if (!value) return null;
  let [yyyy, mm, dd] = value.split("-").map(x => parseInt(x));
  return (yyyy * 10000) + (mm * 100) + dd;
}

/************************************
 * De "DD/M/YYYY, HH:MM..." => YYYYMMDD
 ************************************/
function parseHistorialDay(fechaStr) {
  const parteFecha = fechaStr.split(",")[0].trim();
  let [dia, mes, anio] = parteFecha.split("/").map(x => parseInt(x));
  return (anio * 10000) + (mes * 100) + dia;
}

/************************************
 * Ver datos del usuario
 ************************************/
function filtrarInformacionUsuario() {
  const usuario = document.getElementById("select-usuario-consulta").value;
  const userObj = usuarios.find(u => u.nombre === usuario);
  if (!userObj) return;

  document.getElementById("consulta-usuario").classList.remove("hidden");

  // Foto
  const foto = document.getElementById("foto-usuario");
  foto.src = `fotos/${userObj.nombre}.jpg`;
  foto.alt = userObj.nombre;
  foto.onerror = function() {
    this.onerror = null;
    this.src = "fotos/default.png";
  };

  // Labels
  document.getElementById("nombre-usuario").textContent = userObj.nombre;
  const invEl = document.getElementById("inversion-usuario");
  const ganEl = document.getElementById("ganancia-usuario");
  const adeudoEl = document.getElementById("adeudo-usuario-estado");
  const saldoEl = document.getElementById("saldo-favor-usuario");

  if (userObj.nombre === "Externo") {
    invEl.textContent = formatMoney(0);
    ganEl.textContent = "No aplica";
  } else {
    invEl.textContent = formatMoney(500);
    ganEl.textContent = formatMoney(userObj.ganancia);
  }

  if (userObj.adeudo > 0) {
    adeudoEl.textContent = `Adeudo: ${formatMoney(userObj.adeudo)}`;
    adeudoEl.classList.add("red");
    adeudoEl.classList.remove("green");
  } else {
    adeudoEl.textContent = "Sin adeudos";
    adeudoEl.classList.add("green");
    adeudoEl.classList.remove("red");
  }

  saldoEl.textContent = formatMoney(userObj.saldoFavor || 0);

  // Mostrar historial sin filtros
  const tbody = document.querySelector("#tabla-historial tbody");
  tbody.innerHTML = "";
  const historial = historialCompras[userObj.nombre] || [];
  if (historial.length === 0) {
    let row = document.createElement("tr");
    row.innerHTML = `<td colspan="5">Sin compras registradas</td>`;
    tbody.appendChild(row);
  } else {
    historial.forEach(c => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${c.producto}</td>
        <td>${c.piezas}</td>
        <td>${formatMoney(c.costoTotal)}</td>
        <td>${c.fecha}</td>
        <td>${formatMoney(c.ganancia)}</td>
      `;
      tbody.appendChild(row);
    });
  }
}

/************************************
 * Filtrar por rango de fechas
 ************************************/
function filtrarHistorialPorFecha() {
  const usuario = document.getElementById("select-usuario-consulta").value;
  const userObj = usuarios.find(u => u.nombre === usuario);
  if (!userObj) return;

  const startVal = document.getElementById("start-date").value;
  const endVal   = document.getElementById("end-date").value;
  const startDay = parseInputDay(startVal);
  const endDay   = parseInputDay(endVal);

  const tbody = document.querySelector("#tabla-historial tbody");
  tbody.innerHTML = "";

  let historial = historialCompras[userObj.nombre] || [];

  if (startDay && endDay) {
    let minDay = Math.min(startDay, endDay);
    let maxDay = Math.max(startDay, endDay);

    historial = historial.filter(h => {
      const cDay = parseHistorialDay(h.fecha);
      return (cDay >= minDay && cDay <= maxDay);
    });
  }

  if (historial.length === 0) {
    let row = document.createElement("tr");
    row.innerHTML = `<td colspan="5">Sin compras registradas en este rango</td>`;
    tbody.appendChild(row);
  } else {
    historial.forEach(c => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${c.producto}</td>
        <td>${c.piezas}</td>
        <td>${formatMoney(c.costoTotal)}</td>
        <td>${c.fecha}</td>
        <td>${formatMoney(c.ganancia)}</td>
      `;
      tbody.appendChild(row);
    });
  }
}

/************************************
 * Borrar Filtro
 ************************************/
function limpiarFiltroHistorial() {
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value   = "";
  filtrarInformacionUsuario();
}

/************************************
 * Imprimir reporte
 ************************************/
function imprimirReporteUsuario() {
  const usuario = document.getElementById("select-usuario-consulta").value;
  const userObj = usuarios.find(u => u.nombre === usuario);
  if (!userObj) {
    alert("Usuario no encontrado.");
    return;
  }

  let html = `<p><strong>Usuario:</strong> ${userObj.nombre}</p>`;
  if (userObj.nombre !== "Externo") {
    html += `<p><strong>Inversión:</strong> ${formatMoney(500)}</p>`;
    html += `<p><strong>Ganancia Total:</strong> ${formatMoney(userObj.ganancia)}</p>`;
  } else {
    html += `<p><strong>Inversión:</strong> 0 (Externo)</p>`;
    html += `<p><strong>Ganancia Total:</strong> N/A (Externo)</p>`;
  }
  html += `<p><strong>Adeudo:</strong> ${formatMoney(userObj.adeudo)}</p>`;
  html += `<p><strong>Saldo a favor:</strong> ${formatMoney(userObj.saldoFavor || 0)}</p>`;

  const hist = historialCompras[userObj.nombre];
  if (!hist || hist.length === 0) {
    html += `<p>Sin compras registradas</p>`;
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Piezas</th>
            <th>Costo</th>
            <th>Fecha</th>
            <th>Ganancia</th>
          </tr>
        </thead>
        <tbody>
    `;
    hist.forEach(c => {
      html += `
          <tr>
            <td>${c.producto}</td>
            <td>${c.piezas}</td>
            <td>${formatMoney(c.costoTotal)}</td>
            <td>${c.fecha}</td>
            <td>${formatMoney(c.ganancia)}</td>
          </tr>
      `;
    });
    html += `</tbody></table>`;
  }
  mostrarVentanaImpresion(html, "Reporte de Usuario");
}

/************************************
 * Ventana emergente de impresión
 ************************************/
function mostrarVentanaImpresion(content, title) {
  let w = window.open("", "Reporte", "width=900,height=600");
  w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial,sans-serif; text-align:center; margin:20px; }
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
        <h2>${title}</h2>
        ${content}
        <button onclick="window.print()">Imprimir</button>
      </body>
    </html>
  `);
  w.document.close();
}

/************************************
 * Consulta Global
 ************************************/
function actualizarConsultaInversion() {
  const invTotalEl     = document.getElementById("inv-total");
  const invGananciasEl = document.getElementById("inv-ganancias");
  const invSaldoEl     = document.getElementById("inv-saldo");
  const invAdeudosEl   = document.getElementById("inv-adeudos");

  let saldoActual  = totalInversion - (gastoEnProductos - inversionRecuperada);
  let totalAdeudos = usuarios.reduce((acum, u) => acum + (u.adeudo || 0), 0);

  invTotalEl.textContent     = formatMoney(totalInversion);
  invGananciasEl.textContent = formatMoney(gananciasTotales);
  invSaldoEl.textContent     = formatMoney(saldoActual);
  invAdeudosEl.textContent   = formatMoney(totalAdeudos);

  const tbody = document.querySelector("#tabla-usuarios-ganancias tbody");
  tbody.innerHTML = "";

  let invers = usuarios.filter(u => u.nombre !== "Externo");
  invers.sort((a, b) => b.ganancia - a.ganancia);

  invers.forEach(u => {
    let totalCompras = 0;
    (historialCompras[u.nombre] || []).forEach(c => totalCompras += c.costoTotal);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <img src="fotos/${u.nombre}.jpg" alt="${u.nombre}" class="foto-usuario-tabla"
             onerror="this.onerror=null; this.src='fotos/default.png';"/>
      </td>
      <td>${u.nombre}</td>
      <td>${formatMoney(totalCompras)}</td>
      <td>${formatMoney(u.ganancia)}</td>
      <td>${formatMoney(u.adeudo)}</td>
      <td>${formatMoney(u.saldoFavor || 0)}</td>
    `;
    if (u.adeudo > 0) row.classList.add("con-adeudo");
    tbody.appendChild(row);
  });
}

/************************************
 * Descargar DB
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
  const str = JSON.stringify(data, null, 2);
  const blob = new Blob([str], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "base_de_datos.json";
  link.click();

  URL.revokeObjectURL(url);
}

/************************************
 * Inventario
 ************************************/
function mostrarInventario() {
  const tbody = document.querySelector("#tabla-inventario tbody");
  tbody.innerHTML = "";

  productos.forEach(p => {
    const row = document.createElement("tr");
    if (p.piezas === 0) row.style.backgroundColor = "#ffd4d4";
    row.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.descripcion}</td>
      <td>${formatMoney(p.precioCompra)}</td>
      <td>${formatMoney(p.precioVenta)}</td>
      <td>${p.piezas}</td>
    `;
    tbody.appendChild(row);
  });
}

/************************************
 * Pantalla completa
 ************************************/
function toggleFullscreen(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(err => alert(`Error: ${err}`));
  } else {
    document.exitFullscreen();
  }
}