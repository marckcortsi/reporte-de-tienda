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

// Para simular "pull to refresh"
let touchStartY = 0;
let isPulling   = false;

/************************************
 * Al cargar la ventana
 ************************************/
window.onload = () => {
  // Evitar caché con un timestamp
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

      // Llenar select
      llenarSelectUsuarios("select-usuario-consulta");

      // Manejar History API: inyectar el state inicial
      history.replaceState({ section: 'main-menu' }, "", "#main-menu");
    })
    .catch(err => console.error("Error al cargar base_de_datos.json:", err));

  // Detectar si el usuario hace "pull down" para refrescar
  document.addEventListener('touchstart', e => {
    // Al tocar la pantalla, revisamos si está scrolleado arriba
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
      // Pull to refresh (arbitrario 80px)
      isPulling = false;
      location.reload(); 
    }
  });

  // Cuando el usuario presione "back" en el navegador
  window.addEventListener('popstate', e => {
    // e.state.section
    if (e.state && e.state.section) {
      showSection(e.state.section, false); // false -> no push al history
    } else {
      // Si no hay state, ir al menú
      showSection('main-menu', false);
    }
  });
};

/************************************
 * Usar History API para transiciones
 ************************************/
function navigateTo(sectionId) {
  // Cambiamos la sección
  showSection(sectionId, true);
  // Metemos state
  history.pushState({ section: sectionId }, "", "#" + sectionId);
}

function navigateBack() {
  // Simular un click en "atrás" del navegador:
  history.back();
}

/************************************
 * Mostrar secciones con animación
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
 * Formato dinero
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
 * Consulta individual
 ************************************/
function filtrarInformacionUsuario() {
  const user = document.getElementById("select-usuario-consulta").value;
  const userObj = usuarios.find(u => u.nombre === user);
  if (!userObj) return;

  // Mostrar la tarjeta
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

  // Llenar historial
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
 * Filtrar Historial
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
 * Imprimir
 ************************************/
function imprimirReporteUsuario() {
  // ...
  alert("Aquí colocas tu lógica para imprimir, similar a lo anterior");
  // (Por brevedad omitimos la implementación,
  // puedes copiar lo de tu versión anterior)
}

/************************************
 * Consulta Global
 ************************************/
function actualizarConsultaInversion() {
  // Igual que antes: setear inv-total, inv-ganancias, etc.
  // ...
}

/************************************
 * Inventario
 ************************************/
function mostrarInventario() {
  // ...
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