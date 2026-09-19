/* ==========================================================================
   FOLIOS — app.js
   JavaScript Vanilla — comportamiento compartido por las páginas.
   ========================================================================== */

const API_URL = 'http://127.0.0.1:8000';   // dirección del backend: un solo lugar para cambiarla
const TOKEN_KEY = 'foliosToken';           // clave de localStorage donde se guarda el token

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
  initSubirDocumento();
  initSesion();
  initDocumentos();
});

/* --------------------------------------------------------------------------
   Comunicación con la API
   -------------------------------------------------------------------------- */

/**
 * Hace una petición al backend. Si hay token guardado, lo envía en el
 * encabezado Authorization. Nunca lanza errores: siempre devuelve
 * { ok, estado, datos }, donde estado = 0 significa "no hubo conexión".
 */
async function llamarApi(ruta, { metodo = 'GET', cuerpo = null } = {}) {
  const headers = {};
  if (cuerpo) headers['Content-Type'] = 'application/json';

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const datos = await respuesta.json().catch(() => null);
    return { ok: respuesta.ok, estado: respuesta.status, datos };
  } catch (error) {
    return { ok: false, estado: 0, datos: null };
  }
}

// Qué campo del formulario corresponde a cada nombre de campo del backend
const CAMPO_A_ERROR = {
  nombre: 'errorNombre',
  correo: 'errorCorreo',
  contrasena: 'errorContrasena',
  semestre: 'errorSemestre',
  programa: 'errorPrograma',
  descripcion: 'errorDescripcion',
  id_materia: 'errorMateria',
  id_categoria: 'errorCategoria',
  enlace: 'errorEnlace',
};

function mostrarError(idElemento, mensaje) {
  const el = document.getElementById(idElemento);
  if (el) el.textContent = mensaje;
}

/** Muestra un error de la API en el lugar que corresponda del formulario. */
function mostrarErrorServidor(resp) {
  if (resp.estado === 0) {
    mostrarError('errorGeneral', 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.');
    return;
  }

  // 422: el backend devuelve una lista con un error por campo inválido
  if (resp.estado === 422 && Array.isArray(resp.datos && resp.datos.detail)) {
    resp.datos.detail.forEach((e) => {
      const campo = e.loc[e.loc.length - 1];
      const mensaje = String(e.msg).replace('Value error, ', '');
      mostrarError(CAMPO_A_ERROR[campo] || 'errorGeneral', mensaje);
    });
    return;
  }

  const detalle = resp.datos && typeof resp.datos.detail === 'string' ? resp.datos.detail : null;
  mostrarError('errorGeneral', detalle || 'Ocurrió un error inesperado.');
}

/**
 * Valida en el navegador los campos indicados (para ahorrar viajes al servidor).
 * Devuelve true si todos son válidos y pinta el mensaje en los que no.
 */
function validarCampos(campos) {
  let esValido = true;
  campos.forEach(({ input, error, mensaje }) => {
    const valido = input.checkValidity() && input.value.trim() !== '';
    mostrarError(error, valido ? '' : mensaje);
    if (!valido) esValido = false;
  });
  return esValido;
}

/** Crea un <option>. Usa textContent (no innerHTML): el texto nunca se interpreta como HTML. */
function crearOpcion(valor, texto) {
  const option = document.createElement('option');
  option.value = valor;
  option.textContent = texto;
  return option;
}

/**
 * Llena un <select> con <optgroup>: agrupa los elementos según grupoDe().
 */
function llenarSelectAgrupado(select, elementos, grupoDe, valorDe, textoDe) {
  const grupos = new Map();
  elementos.forEach((elemento) => {
    const grupo = grupoDe(elemento);
    if (!grupos.has(grupo)) grupos.set(grupo, []);
    grupos.get(grupo).push(elemento);
  });

  grupos.forEach((lista, nombreGrupo) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = nombreGrupo;
    lista.forEach((elemento) => {
      optgroup.appendChild(crearOpcion(valorDe(elemento), textoDe(elemento)));
    });
    select.appendChild(optgroup);
  });
}

/* --------------------------------------------------------------------------
   Registro
   -------------------------------------------------------------------------- */
async function cargarProgramas(form) {
  const resp = await llamarApi('/api/programas');
  if (!resp.ok) {
    mostrarError('errorPrograma', 'No se pudieron cargar los programas. Recarga la página.');
    return;
  }
  llenarSelectAgrupado(
    form.programa,
    resp.datos,
    (programa) => programa.facultad,
    (programa) => programa.nombre,
    (programa) => programa.nombre
  );
}

function initRegistroForm() {
  const form = document.getElementById('formRegistro');
  if (!form) return;

  cargarProgramas(form);   // los programas vienen de la base de datos, no del HTML

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    mostrarError('errorGeneral', '');

    const esValido = validarCampos([
      { input: form.nombre, error: 'errorNombre', mensaje: 'Ingresa tu nombre completo.' },
      { input: form.correo, error: 'errorCorreo', mensaje: 'Ingresa un correo institucional válido.' },
      { input: form.semestre, error: 'errorSemestre', mensaje: 'Selecciona tu semestre.' },
      { input: form.programa, error: 'errorPrograma', mensaje: 'Selecciona tu programa académico.' },
      { input: form.contrasena, error: 'errorContrasena', mensaje: 'La contraseña debe tener al menos 6 caracteres.' },
    ]);
    if (!esValido) return;

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;   // evita enviar dos veces con doble clic

    const resp = await llamarApi('/api/registro', {
      metodo: 'POST',
      cuerpo: {
        nombre: form.nombre.value.trim(),
        correo: form.correo.value.trim(),
        contrasena: form.contrasena.value,
        semestre: Number(form.semestre.value),   // el select entrega texto; la API espera número
        programa: form.programa.value,
      },
    });

    boton.disabled = false;

    if (resp.ok) {
      alert('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
      window.location.href = 'login.html';
      return;
    }
    if (resp.estado === 409) {
      mostrarError('errorCorreo', resp.datos.detail);
      return;
    }
    if (resp.estado === 400) {
      mostrarError('errorPrograma', resp.datos.detail);
      return;
    }
    mostrarErrorServidor(resp);
  });
}

/* --------------------------------------------------------------------------
   Inicio de sesión
   -------------------------------------------------------------------------- */
function initLoginForm() {
  const form = document.getElementById('formLogin');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    mostrarError('errorGeneral', '');

    const esValido = validarCampos([
      { input: form.correo, error: 'errorCorreo', mensaje: 'Ingresa un correo institucional válido.' },
      { input: form.contrasena, error: 'errorContrasena', mensaje: 'Ingresa tu contraseña.' },
    ]);
    if (!esValido) return;

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;

    const resp = await llamarApi('/api/login', {
      metodo: 'POST',
      cuerpo: {
        correo: form.correo.value.trim(),
        contrasena: form.contrasena.value,
      },
    });

    boton.disabled = false;

    if (resp.ok) {
      localStorage.setItem(TOKEN_KEY, resp.datos.access_token);
      window.location.href = 'documentos.html';
      return;
    }
    if (resp.estado === 401) {
      mostrarError('errorContrasena', resp.datos.detail);
      return;
    }
    mostrarErrorServidor(resp);
  });
}

/* --------------------------------------------------------------------------
   Subir documento
   -------------------------------------------------------------------------- */
async function cargarCatalogosDocumento(form) {
  const [materias, categorias] = await Promise.all([
    llamarApi('/api/materias'),
    llamarApi('/api/categorias'),
  ]);

  if (materias.ok) {
    // Todas las materias, agrupadas por programa (decisión del equipo)
    llenarSelectAgrupado(
      form.materia,
      materias.datos,
      (materia) => materia.programa,
      (materia) => materia.codigo,
      (materia) => materia.nombre
    );
  } else {
    mostrarError('errorMateria', 'No se pudieron cargar las materias. Recarga la página.');
  }

  if (categorias.ok) {
    categorias.datos.forEach((categoria) => {
      form.categoria.appendChild(crearOpcion(categoria.id, categoria.nombre));
    });
  } else {
    mostrarError('errorCategoria', 'No se pudieron cargar las categorías. Recarga la página.');
  }
}

function initSubirDocumento() {
  const form = document.getElementById('formDocumento');
  if (!form) return;

  cargarCatalogosDocumento(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    mostrarError('errorGeneral', '');

    const esValido = validarCampos([
      { input: form.nombre, error: 'errorNombre', mensaje: 'Ingresa el nombre del documento.' },
      { input: form.materia, error: 'errorMateria', mensaje: 'Selecciona la materia.' },
      { input: form.categoria, error: 'errorCategoria', mensaje: 'Selecciona la categoría.' },
      { input: form.enlace, error: 'errorEnlace', mensaje: 'Ingresa un enlace válido (empieza por http:// o https://).' },
    ]);
    mostrarError('errorDescripcion', '');
    if (!esValido) return;

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;

    const resp = await llamarApi('/api/documentos', {
      metodo: 'POST',
      cuerpo: {
        nombre: form.nombre.value.trim(),
        descripcion: form.descripcion.value,          // vacío = sin descripción (el backend lo normaliza)
        id_materia: Number(form.materia.value),       // los selects entregan texto; la API espera números
        id_categoria: Number(form.categoria.value),
        enlace: form.enlace.value.trim(),
      },
    });

    boton.disabled = false;

    if (resp.ok) {
      alert('Documento publicado correctamente.');
      form.reset();
      return;
    }
    if (resp.estado === 401) {          // la sesión venció mientras llenabas el formulario
      terminarSesion('login.html');
      return;
    }
    mostrarErrorServidor(resp);         // 400 (materia/categoría inexistente), 422, sin conexión...
  });
}

/* --------------------------------------------------------------------------
   Sesión
   -------------------------------------------------------------------------- */
function terminarSesion(destino) {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = destino;
}

async function initSesion() {
  // Botones de cerrar sesión, estén en la página que estén
  document.querySelectorAll('#btnCerrarSesion, #btnCerrarSesionSidebar').forEach((boton) => {
    boton.addEventListener('click', () => terminarSesion('index.html'));
  });

  // Navbar público: alterna los botones si la página los tiene
  const loggedOut = document.getElementById('navbarLoggedOut');
  const loggedIn = document.getElementById('navbarLoggedIn');
  if (loggedOut && loggedIn) {
    const haySesion = Boolean(localStorage.getItem(TOKEN_KEY));
    loggedOut.classList.toggle('hidden-block', haySesion);
    loggedIn.classList.toggle('hidden-block', !haySesion);
  }

  // Páginas privadas: son las que tienen el nombre del estudiante en el sidebar.
  // OJO: esto es comodidad, no seguridad. La protección real es que la API
  // responde 401 a quien no mande un token válido.
  const sidebarNombre = document.getElementById('sidebarNombre');
  if (!sidebarNombre) return;

  if (!localStorage.getItem(TOKEN_KEY)) {
    window.location.href = 'login.html';
    return;
  }

  const resp = await llamarApi('/api/perfil');
  if (resp.estado === 401) {          // token vencido o alterado
    terminarSesion('login.html');
    return;
  }
  if (resp.ok) {
    sidebarNombre.textContent = resp.datos.nombre;
    const detalle = document.getElementById('sidebarDetalle');
    if (detalle) detalle.textContent = `Semestre ${resp.datos.semestre} · ${resp.datos.puntaje} puntos`;
  }
}

/* --------------------------------------------------------------------------
   Documentos
   Lista vacía por ahora: se llenará con los datos que devuelva la API.
   -------------------------------------------------------------------------- */
const DOCUMENTOS = [];

/**
 * Inicializa la página de documentos: llena los filtros con las materias y
 * categorías presentes en DOCUMENTOS, dibuja las tarjetas y conecta
 * el buscador + los selects para filtrar en el navegador (sin backend aún).
 */
function initDocumentos() {
  const grid = document.getElementById('docsGrid');
  if (!grid) return;

  const buscador = document.getElementById('buscador');
  const filtroMateria = document.getElementById('filtroMateria');
  const filtroCategoria = document.getElementById('filtroCategoria');
  const vacio = document.getElementById('docsVacio');

  llenarSelect(filtroMateria, DOCUMENTOS.map((d) => d.materia));
  llenarSelect(filtroCategoria, DOCUMENTOS.map((d) => d.categoria));

  function renderizar() {
    const texto = buscador.value.trim().toLowerCase();
    const materia = filtroMateria.value;
    const categoria = filtroCategoria.value;

    const filtrados = DOCUMENTOS.filter((doc) => {
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