/* ==========================================================================
   FOLIOS — app.js
   JavaScript Vanilla — comportamiento básico compartido por las páginas.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  const toggleBtn = document.querySelector('.navbar__toggle');

  if (toggleBtn && navbar) {
    toggleBtn.addEventListener('click', () => {
      navbar.classList.toggle('is-open');
    });
  }

  initRegistroForm();
  initLoginForm();
  initSesion();
  initDocumentos();
});

/**
 * Validación básica del formulario de registro.
 * Por ahora no hay backend: solo valida en el navegador y
 * simula el envío mostrando un mensaje de éxito.
 */
function initRegistroForm() {
  const form = document.getElementById('formRegistro');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let esValido = true;

    const campos = [
      { input: form.nombre, error: 'errorNombre', mensaje: 'Ingresa tu nombre completo.' },
      { input: form.correo, error: 'errorCorreo', mensaje: 'Ingresa un correo institucional válido.' },
      { input: form.semestre, error: 'errorSemestre', mensaje: 'Selecciona tu semestre.' },
      { input: form.programa, error: 'errorPrograma', mensaje: 'Selecciona tu programa académico.' },
      { input: form.contrasena, error: 'errorContrasena', mensaje: 'La contraseña debe tener al menos 6 caracteres.' },
    ];

    campos.forEach(({ input, error, mensaje }) => {
      const errorEl = document.getElementById(error);
      const valido = input.checkValidity() && input.value.trim() !== '';

      if (!valido) {
        esValido = false;
        if (errorEl) errorEl.textContent = mensaje;
      } else if (errorEl) {
        errorEl.textContent = '';
      }
    });

    if (esValido) {
      alert('Cuenta creada correctamente (simulado). Ahora puedes iniciar sesión.');
      form.reset();
    }
  });
}

/**
 * Validación básica del formulario de inicio de sesión.
 * Sin backend todavía: solo valida en el navegador y simula el ingreso.
 */
function initLoginForm() {
  const form = document.getElementById('formLogin');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let esValido = true;

    const campos = [
      { input: form.correo, error: 'errorCorreo', mensaje: 'Ingresa un correo institucional válido.' },
      { input: form.contrasena, error: 'errorContrasena', mensaje: 'Ingresa tu contraseña.' },
    ];

    campos.forEach(({ input, error, mensaje }) => {
      const errorEl = document.getElementById(error);
      const valido = input.checkValidity() && input.value.trim() !== '';

      if (!valido) {
        esValido = false;
        if (errorEl) errorEl.textContent = mensaje;
      } else if (errorEl) {
        errorEl.textContent = '';
      }
    });

    if (esValido) {
      localStorage.setItem('foliosSesion', 'activa');
      window.location.href = 'documentos.html';
    }
  });
}

/**
 * Sesión simulada con localStorage (sin backend todavía).
 * Muestra/oculta los botones del navbar según si hay "sesión activa"
 * guardada en el navegador, y maneja el botón de cerrar sesión.
 */
function initSesion() {
  const loggedOut = document.getElementById('navbarLoggedOut');
  const loggedIn = document.getElementById('navbarLoggedIn');
  if (!loggedOut || !loggedIn) return;

  const haySesion = localStorage.getItem('foliosSesion') === 'activa';
  loggedOut.classList.toggle('hidden-block', haySesion);
  loggedIn.classList.toggle('hidden-block', !haySesion);

  const cerrarSesion = () => {
    localStorage.removeItem('foliosSesion');
    window.location.href = 'index.html';
  };

  const btnCerrar = document.getElementById('btnCerrarSesion');
  const btnCerrarSidebar = document.getElementById('btnCerrarSesionSidebar');

  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarSesion);
  }

  if (btnCerrarSidebar) {
    btnCerrarSidebar.addEventListener('click', cerrarSesion);
  }
}

/* --------------------------------------------------------------------------
   Documentos — datos de prueba (simulan lo que vendría de la BD/API)
   -------------------------------------------------------------------------- */
const DOCUMENTOS_SIMULADOS = [
  { id: 1, nombre: 'Resumen Parcial 1 - Límites y derivadas', materia: 'Cálculo III', categoria: 'Resumen', autor: 'Laura Gómez', fecha: '2026-02-14', calificacion: 4.6 },
  { id: 2, nombre: 'Taller de normalización de bases de datos', materia: 'Bases de Datos', categoria: 'Taller', autor: 'Juan Pérez', fecha: '2026-03-02', calificacion: 4.2 },
  { id: 3, nombre: 'Parcial 2026-1 resuelto', materia: 'Termodinámica', categoria: 'Parcial antiguo', autor: 'Camila Ruiz', fecha: '2026-04-10', calificacion: 4.8 },
  { id: 4, nombre: 'Apuntes clase completos - Circuitos', materia: 'Circuitos Eléctricos', categoria: 'Apuntes de clase', autor: 'Andrés Torres', fecha: '2026-01-22', calificacion: 4.0 },
  { id: 5, nombre: 'Guía de estudio final', materia: 'Cálculo III', categoria: 'Guía de estudio', autor: 'Mariana Duarte', fecha: '2026-03-18', calificacion: 4.4 },
  { id: 6, nombre: 'Laboratorio 3 - Consultas SQL', materia: 'Bases de Datos', categoria: 'Laboratorio', autor: 'Juan Pérez', fecha: '2026-02-27', calificacion: 3.9 },
  { id: 7, nombre: 'Apuntes segundo corte', materia: 'Termodinámica', categoria: 'Apuntes de clase', autor: 'Laura Gómez', fecha: '2026-04-01', calificacion: 4.3 },
  { id: 8, nombre: 'Taller resuelto - Circuitos RC', materia: 'Circuitos Eléctricos', categoria: 'Taller', autor: 'Camila Ruiz', fecha: '2026-03-25', calificacion: 4.7 },
];

/**
 * Inicializa la página de documentos: llena los filtros con las materias y
 * categorías presentes en los datos simulados, dibuja las tarjetas y conecta
 * el buscador + los selects para filtrar en el navegador (sin backend aún).
 */
function initDocumentos() {
  const grid = document.getElementById('docsGrid');
  if (!grid) return;

  const buscador = document.getElementById('buscador');
  const filtroMateria = document.getElementById('filtroMateria');
  const filtroCategoria = document.getElementById('filtroCategoria');
  const vacio = document.getElementById('docsVacio');

  llenarSelect(filtroMateria, DOCUMENTOS_SIMULADOS.map((d) => d.materia));
  llenarSelect(filtroCategoria, DOCUMENTOS_SIMULADOS.map((d) => d.categoria));

  function renderizar() {
    const texto = buscador.value.trim().toLowerCase();
    const materia = filtroMateria.value;
    const categoria = filtroCategoria.value;

    const filtrados = DOCUMENTOS_SIMULADOS.filter((doc) => {
      const coincideTexto =
        doc.nombre.toLowerCase().includes(texto) ||
        doc.materia.toLowerCase().includes(texto) ||
        doc.autor.toLowerCase().includes(texto);
      const coincideMateria = !materia || doc.materia === materia;
      const coincideCategoria = !categoria || doc.categoria === categoria;
      return coincideTexto && coincideMateria && coincideCategoria;
    });

    grid.innerHTML = filtrados.map(crearTarjetaDocumento).join('');
    vacio.style.display = filtrados.length === 0 ? 'block' : 'none';
  }

  buscador.addEventListener('input', renderizar);
  filtroMateria.addEventListener('change', renderizar);
  filtroCategoria.addEventListener('change', renderizar);

  renderizar();
}

function llenarSelect(select, valores) {
  const unicos = [...new Set(valores)].sort();
  unicos.forEach((valor) => {
    const option = document.createElement('option');
    option.value = valor;
    option.textContent = valor;
    select.appendChild(option);
  });
}

function crearTarjetaDocumento(doc) {
  const fecha = new Date(doc.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  return `
    <article class="doc-card">
      <span class="doc-card__categoria">${doc.categoria}</span>
      <h3 class="doc-card__nombre">${doc.nombre}</h3>
      <span class="doc-card__meta">${doc.materia}</span>
      <span class="doc-card__meta">${doc.autor} · ${fecha}</span>
      <span class="doc-card__rating"><i class="bi bi-star-fill"></i> ${doc.calificacion.toFixed(1)}</span>
      <div class="doc-card__acciones">
        <a href="documento.html?id=${doc.id}" class="btn btn-outline">Ver</a>
        <button type="button" class="btn btn-primary" onclick="alert('Descarga simulada: ${doc.nombre}')">Descargar</button>
      </div>
    </article>
  `;
}