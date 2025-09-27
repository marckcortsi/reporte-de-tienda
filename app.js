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

let touchStartY = 0;
let isPulling   = false;

/************************************
 * Al cargar la ventana
 ************************************/
window.onload = () => {
  // Evitar caché
  fetch('base_de_datos.json?nocache=' + Date.now())
    .then(r => r.json())
    .then(data => {
      data.usuarios.forEach(u => {
        if (u.saldoFavor === undefined) {
          u.saldoFavor = 0;
        }
      });

      usuarios            = data.usuarios;
      historialCompras    = data.historialCompras;
      productos           = data.productos;
      historialEntradas   = data.historialEntradas;
      numInversionistas   = data.numInversionistas;
      totalInversion      = data.totalInversion;
      gastoEnProductos    = data.gastoEnProductos;
      inversionRecuperada = data.inversionRecuperada;
      gananciasTotales    = data.gananciasTotales;

      // Llenar el select
      llenarSelectUsuarios("select-usuario-consulta");

      // Reemplazar el state inicial
      const initialSection = window.location.hash.substring(1) || 'main-menu';
      history.replaceState({ section: initialSection }, "", "#" + initialSection);
      showSection(initialSection, false);
    })
    .catch(err => console.error("Error al cargar base_de_datos.json:", err));

  // Pull-to-refresh casero
  document.addEventListener('touchstart', e => {
    if (document.documentElement.scrollTop === 0) {
      touchStartY = e.touches[0].clientY;
      isPulling = true;
    } else {
      isPulling = false;
    }
  });
  document.addEventListener('touchmove', e => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 80) {
      isPulling = false;
      location.reload();
    }
  });

  // Botón "atrás" del navegador
  window.addEventListener('popstate', e => {
    if (e.state && e.state.section) {
      showSection(e.state.section, false);
    } else {
      // Si no hay estado, ir al menú principal
      showSection('main-menu', false);
      history.replaceState({ section: 'main-menu' }, "", "#main-menu");
    }
  });
};

/************************************
 * Navegación con History API
 ************************************/
function navigateTo(sectionId) {
  showSection(sectionId, true);
  history.pushState({ section: sectionId }, "", "#" + sectionId);
}

function navigateBack() {
  history.back();
}

function irAConsultaGlobal() {
  // Asegurar que el menú principal esté en el historial
  if (!history.state || history.state.section !== 'main-menu') {
    history.replaceState({ section: 'main-menu' }, "", "#main-menu");
  }
  
  // Navegar a consulta global
  navigateTo('consulta-inversion');
  
  // Actualizar datos después de la navegación
  setTimeout(() => {
    actualizarConsultaInversion();
  }, 50);
}

/************************************
 * Transición de secciones
 ************************************/
function showSection(sectionId, push = false) {
  document.querySelectorAll(".section").forEach(s => {
    s.classList.remove("active", "slide-in");
    s.classList.add("slide-out");
  });
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.classList.remove("slide-out");
  target.classList.add("active", "slide-in");
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
 * Formato Dinero
 ************************************/
function formatMoney(amount) {
  return "$" + Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/************************************
 * parseInputDay => YYYYMMDD
 ************************************/
function parseInputDay(value) {
  if (!value) return null;
  const [yyyy, mm, dd] = value.split("-").map(x => parseInt(x));
  return (yyyy * 10000) + (mm * 100) + dd;
}

/************************************
 * parseHistorialDay => YYYYMMDD
 ************************************/
function parseHistorialDay(str) {
  const parteFecha = str.split(",")[0].trim();
  let [dia, mes, anio] = parteFecha.split("/").map(n => parseInt(n));
  return (anio * 10000) + (mes * 100) + dia;
}

/************************************
 * Consulta Individual
 ************************************/
function filtrarInformacionUsuario() {
  const user = document.getElementById("select-usuario-consulta").value;
  const userObj = usuarios.find(u => u.nombre === user);
  if (!userObj) return;

  document.getElementById("consulta-usuario").classList.remove("hidden");

  // Foto
  const foto = document.getElementById("foto-usuario");
  foto.src = `fotos/${userObj.nombre}.jpg`;
  foto.onerror = function() {
    this.onerror = null;
    this.src = "fotos/default.png";
  };

  document.getElementById("nombre-usuario").textContent = userObj.nombre;
  if (userObj.nombre === "Externo") {
    document.getElementById("inversion-usuario").textContent = formatMoney(0);
    document.getElementById("ganancia-usuario").textContent = "No aplica";
  } else {
    document.getElementById("inversion-usuario").textContent = formatMoney(500);
    document.getElementById("ganancia-usuario").textContent = formatMoney(userObj.ganancia);
  }

  const adeudoEl = document.getElementById("adeudo-usuario-estado");
  if (userObj.adeudo > 0) {
    adeudoEl.textContent = `Adeudo: ${formatMoney(userObj.adeudo)}`;
    adeudoEl.classList.add("red");
    adeudoEl.classList.remove("green");
  } else {
    adeudoEl.textContent = "Sin adeudos";
    adeudoEl.classList.add("green");
    adeudoEl.classList.remove("red");
  }
  document.getElementById("saldo-favor-usuario").textContent = formatMoney(userObj.saldoFavor || 0);

  // Llenar historial sin filtros
  const tbody = document.querySelector("#tabla-historial tbody");
  tbody.innerHTML = "";
  const hist = (historialCompras[userObj.nombre] || []);
  if (hist.length === 0) {
    let row = document.createElement("tr");
    row.innerHTML = `<td colspan="5">Sin compras registradas</td>`;
    tbody.appendChild(row);
  } else {
    hist.forEach(c => {
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
 * Filtrar Historial por fecha
 ************************************/
function filtrarHistorialPorFecha() {
  const user = document.getElementById("select-usuario-consulta").value;
  const userObj = usuarios.find(u => u.nombre === user);
  if (!userObj) return;

  const startVal = document.getElementById("start-date").value;
  const endVal   = document.getElementById("end-date").value;
  const startDay = parseInputDay(startVal);
  const endDay   = parseInputDay(endVal);

  const tbody = document.querySelector("#tabla-historial tbody");
  tbody.innerHTML = "";

  let hist = historialCompras[userObj.nombre] || [];
  if (startDay && endDay) {
    const minDay = Math.min(startDay, endDay);
    const maxDay = Math.max(startDay, endDay);

    hist = hist.filter(c => {
      const d = parseHistorialDay(c.fecha);
      return (d >= minDay && d <= maxDay);
    });
  }

  if (hist.length === 0) {
    let row = document.createElement("tr");
    row.innerHTML = `<td colspan="5">Sin compras registradas en ese rango</td>`;
    tbody.appendChild(row);
  } else {
    hist.forEach(c => {
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
 * Imprimir Reporte Usuario
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
  contenidoHTML += `<p><strong>Saldo a favor:</strong> ${formatMoney(userObj.saldoFavor || 0)}</p>`;

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
            <th>Costo</th>
            <th>Fecha</th>
            <th>Ganancia</th>
          </tr>
        </thead>
        <tbody>
    `;
    historial.forEach(c => {
      contenidoHTML += `
        <tr>
          <td>${c.producto}</td>
          <td>${c.piezas}</td>
          <td>${formatMoney(c.costoTotal)}</td>
          <td>${c.fecha}</td>
          <td>${formatMoney(c.ganancia)}</td>
        </tr>
      `;
    });
    contenidoHTML += `</tbody></table>`;
  }

  mostrarVentanaImpresion(contenidoHTML, "Reporte de Usuario");
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
  const invTotalEl          = document.getElementById("inv-total");
  const invGananciasEl      = document.getElementById("inv-ganancias");
  const invSaldoEl          = document.getElementById("inv-saldo");
  const invAdeudosEl        = document.getElementById("inv-adeudos");
  const invVentasEl         = document.getElementById("inv-ventas");
  const invDineroRepartirEl = document.getElementById("inv-dinero-repartir");

  let saldoActual  = totalInversion - (gastoEnProductos - inversionRecuperada);
  let totalAdeudos = usuarios.reduce((acum, u) => acum + (u.adeudo || 0), 0);
  
  // Calcular total de ventas (suma de todas las compras de todos los usuarios)
  let totalVentas = 0;
  usuarios.forEach(u => {
    (historialCompras[u.nombre] || []).forEach(c => {
      totalVentas += c.costoTotal;
    });
  });

  // Calcular dinero a repartir (solo valores positivos de dinero a recibir)
  let dineroARepartir = 0;
  let usuariosInversionistas = usuarios.filter(u => u.nombre !== "Externo");
  usuariosInversionistas.forEach(u => {
    let dineroARecibir = (u.ganancia || 0) - (u.adeudo || 0);
    if (dineroARecibir > 0) {
      dineroARepartir += dineroARecibir;
    }
  });

  invTotalEl.textContent          = formatMoney(totalInversion);
  invGananciasEl.textContent      = formatMoney(gananciasTotales);
  invSaldoEl.textContent          = formatMoney(saldoActual);
  invAdeudosEl.textContent        = formatMoney(totalAdeudos);
  invVentasEl.textContent         = formatMoney(totalVentas);
  invDineroRepartirEl.textContent = formatMoney(dineroARepartir);

  const tbody = document.querySelector("#tabla-usuarios-ganancias tbody");
  tbody.innerHTML = "";

  // Excluir "Externo"
  let invers = usuarios.filter(u => u.nombre !== "Externo");
  // Ordenar por ganancia descendente
  invers.sort((a, b) => b.ganancia - a.ganancia);

  invers.forEach(u => {
    let totalCompras = 0;
    (historialCompras[u.nombre] || []).forEach(c => {
      totalCompras += c.costoTotal;
    });

    // Calcular dinero a recibir: ganancias menos adeudo
    let dineroARecibir = (u.ganancia || 0) - (u.adeudo || 0);
    let adeudo = u.adeudo || 0;

    // Determinar clase para dinero a recibir
    let claseDinero = '';
    if (dineroARecibir > 0) {
      claseDinero = 'dinero-positivo';
    } else if (dineroARecibir < 0) {
      claseDinero = 'dinero-negativo';
    }

    // Determinar clase para adeudo basado en intensidad
    let claseAdeudo = '';
    if (adeudo > 0) {
      if (adeudo <= 100) {
        claseAdeudo = 'adeudo-bajo';
      } else if (adeudo <= 300) {
        claseAdeudo = 'adeudo-medio';
      } else if (adeudo <= 600) {
        claseAdeudo = 'adeudo-alto';
      } else {
        claseAdeudo = 'adeudo-muy-alto';
      }
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <img src="fotos/${u.nombre}.jpg" alt="${u.nombre}" class="foto-usuario-tabla"
          onerror="this.onerror=null; this.src='fotos/default.png';"/>
      </td>
      <td>${u.nombre}</td>
      <td>${formatMoney(totalCompras)}</td>
      <td>${formatMoney(u.ganancia)}</td>
      <td class="${claseAdeudo}">${formatMoney(adeudo)}</td>
      <td>${formatMoney(u.saldoFavor || 0)}</td>
      <td class="${claseDinero}">${formatMoney(dineroARecibir)}</td>
    `;
    
    // Mantener la clase con-adeudo para el fondo de toda la fila si hay adeudo
    if (adeudo > 0) {
      row.classList.add("con-adeudo");
    }
    
    tbody.appendChild(row);
  });
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
 * Pantalla Completa
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