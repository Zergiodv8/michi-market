/* =====================================================================
   Michi Market - script.js (nivel 3)
   ===================================================================== */

const URL_API = "api/productos.json";
const CLAVE_CARRITO = "michiMarket.carrito";

let productos = [];
let carrito = leerCarrito();

// Formato de pesos argentinos: 38900 -> "$ 38.900"
const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// Elementos del DOM que se usan varias veces
const listaProductos = document.getElementById("lista-productos");
const listaCarrito = document.getElementById("lista-carrito");
const formulario = document.getElementById("formulario");

/* =====================================================================
   1. Traer los productos de la API (fetch con async/await)
   ===================================================================== */

async function cargarProductos() {
  try {
    const respuesta = await fetch(URL_API);
    if (!respuesta.ok) throw new Error("Error HTTP " + respuesta.status);
    productos = await respuesta.json();
    crearFiltros();
    mostrarProductos(productos);
  } catch (error) {
    listaProductos.innerHTML = "<p>No pudimos cargar los productos. Recargá la página para intentar de nuevo.</p>";
    console.error(error);
  }
}

/* =====================================================================
   2. Cards de productos y filtros por categoría
   ===================================================================== */

function mostrarProductos(lista) {
  listaProductos.innerHTML = lista
    .map(
      (p) => `
      <article class="card-producto">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <div class="cuerpo">
          <h3>${p.title}</h3>
          <p class="descripcion">${p.description}</p>
          <p class="precio">${formatoPrecio.format(p.price)}</p>
          <button type="button" class="btn btn-warning" data-id="${p.id}">Agregar al carrito</button>
        </div>
      </article>`
    )
    .join("");
}

// Un solo listener para todos los botones "Agregar" (delegación de eventos)
listaProductos.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-id]");
  if (boton) agregarAlCarrito(Number(boton.dataset.id));
});

function crearFiltros() {
  const categorias = ["Todos", ...new Set(productos.map((p) => p.category))];
  const contenedor = document.getElementById("filtros");

  contenedor.innerHTML = categorias
    .map((c, i) => `<button type="button" class="btn btn-outline-secondary ${i === 0 ? "activo" : ""}" data-categoria="${c}">${c}</button>`)
    .join("");

  contenedor.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if (!boton) return;
    contenedor.querySelectorAll("button").forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");
    const categoria = boton.dataset.categoria;
    mostrarProductos(categoria === "Todos" ? productos : productos.filter((p) => p.category === categoria));
  });
}

/* =====================================================================
   3. Carrito: agregar productos y guardar en localStorage
   ===================================================================== */

function leerCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
  } catch {
    return []; // si lo guardado está dañado, empezamos con el carrito vacío
  }
}

function guardarCarrito() {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  mostrarCarrito();
}

function agregarAlCarrito(id) {
  const producto = productos.find((p) => p.id === id);
  const item = carrito.find((p) => p.id === id);
  if (item) {
    item.cantidad++;
  } else {
    carrito.push({ id, title: producto.title, price: producto.price, image: producto.image, cantidad: 1 });
  }
  guardarCarrito();
  mostrarAviso(`Agregaste "${producto.title}" al carrito`);
}

const contarProductos = () => carrito.reduce((suma, item) => suma + item.cantidad, 0);
const calcularTotal = () => carrito.reduce((suma, item) => suma + item.price * item.cantidad, 0);

/* =====================================================================
   4. Ver y editar el carrito (panel lateral)
   ===================================================================== */

function mostrarCarrito() {
  listaCarrito.innerHTML = carrito
    .map(
      (item) => `
      <li class="item-carrito">
        <div>
          <strong>${item.title}</strong><br>
          ${formatoPrecio.format(item.price)} c/u
        </div>
        <div class="botones">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-accion="restar" data-id="${item.id}" aria-label="Restar uno">−</button>
          <span>${item.cantidad}</span>
          <button type="button" class="btn btn-sm btn-outline-secondary" data-accion="sumar" data-id="${item.id}" aria-label="Sumar uno">+</button>
          <button type="button" class="btn btn-sm btn-danger" data-accion="eliminar" data-id="${item.id}">Eliminar</button>
        </div>
      </li>`
    )
    .join("");

  document.getElementById("carrito-vacio").hidden = carrito.length > 0;
  document.getElementById("total").textContent = formatoPrecio.format(calcularTotal());
  document.getElementById("contador").textContent = contarProductos();
  document.getElementById("finalizar").disabled = carrito.length === 0;
}

listaCarrito.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const item = carrito.find((p) => p.id === id);

  if (boton.dataset.accion === "sumar") item.cantidad++;
  if (boton.dataset.accion === "restar") item.cantidad--;
  if (boton.dataset.accion === "eliminar" || item.cantidad < 1) {
    carrito = carrito.filter((p) => p.id !== id);
  }
  guardarCarrito();
});

document.getElementById("vaciar").addEventListener("click", () => {
  carrito = [];
  guardarCarrito();
});

/* =====================================================================
   5. Simular la compra (modal de Bootstrap)
   ===================================================================== */

// Si Bootstrap no cargó (sin internet o bloqueado), el panel y el modal
// se abren igual agregando la clase "abierto" (ver styles.css)
const panelCarrito = document.getElementById("carrito");
const modalCompra = document.getElementById("modal-compra");
const hayBootstrap = () => typeof window.bootstrap !== "undefined";

function mostrarPanel(mostrar) {
  if (hayBootstrap()) {
    const panel = bootstrap.Offcanvas.getOrCreateInstance(panelCarrito);
    mostrar ? panel.show() : panel.hide();
  } else {
    panelCarrito.classList.toggle("abierto", mostrar);
  }
}

function mostrarModal(mostrar) {
  if (hayBootstrap()) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalCompra);
    mostrar ? modal.show() : modal.hide();
  } else {
    modalCompra.classList.toggle("abierto", mostrar);
  }
}

// Sin Bootstrap: el botón del header abre el panel y las X / "Seguir comprando" cierran
document.querySelector(".boton-carrito").addEventListener("click", () => {
  if (!hayBootstrap()) mostrarPanel(true);
});
document.querySelectorAll("[data-bs-dismiss]").forEach((boton) => {
  boton.addEventListener("click", () => {
    if (!hayBootstrap()) boton.closest(".offcanvas, .modal").classList.remove("abierto");
  });
});

document.getElementById("finalizar").addEventListener("click", () => {
  const filas = carrito.map((i) => `<li>${i.cantidad} × ${i.title} — ${formatoPrecio.format(i.price * i.cantidad)}</li>`).join("");
  document.getElementById("resumen-compra").innerHTML = `
    <ul>${filas}</ul>
    <p><strong>Total: ${formatoPrecio.format(calcularTotal())}</strong></p>`;
  mostrarPanel(false);
  mostrarModal(true);
});

document.getElementById("confirmar-compra").addEventListener("click", () => {
  carrito = [];
  guardarCarrito();
  mostrarModal(false);
  mostrarAviso("¡Compra confirmada! Gracias por elegir Michi Market.");
});

/* =====================================================================
   6. Formulario de contacto: validación y envío a Formspree
   ===================================================================== */

const reglas = {
  nombre: (v) => (v.length >= 2 ? "" : "Escribí tu nombre (mínimo 2 letras)."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Escribí un correo válido, por ejemplo nombre@correo.com."),
  mensaje: (v) => (v.length >= 10 ? "" : "El mensaje debe tener al menos 10 caracteres."),
};

function validarCampo(campo) {
  const error = reglas[campo.id](campo.value.trim());
  document.getElementById("error-" + campo.id).textContent = error;
  campo.classList.toggle("invalido", error !== "");
  return error === "";
}

// Valida cada campo cuando el usuario sale de él
Object.keys(reglas).forEach((id) => {
  document.getElementById(id).addEventListener("blur", (e) => validarCampo(e.target));
});

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const campos = Object.keys(reglas).map((id) => document.getElementById(id));
  const todosValidos = campos.map(validarCampo).every(Boolean);
  if (!todosValidos) {
    campos.find((c) => c.classList.contains("invalido")).focus();
    return;
  }

  const estado = document.getElementById("estado-formulario");
  estado.textContent = "Enviando...";
  try {
    const respuesta = await fetch(formulario.action, {
      method: "POST",
      body: new FormData(formulario),
      headers: { Accept: "application/json" },
    });
    if (!respuesta.ok) throw new Error("Formspree respondió " + respuesta.status);
    estado.textContent = "¡Gracias! Te respondemos dentro de las 24 horas.";
    formulario.reset();
  } catch (error) {
    estado.textContent = "No se pudo enviar el mensaje. Probá de nuevo.";
    console.error(error);
  }
});

/* =====================================================================
   Avisos al usuario
   ===================================================================== */

let temporizadorAviso;

function mostrarAviso(texto) {
  const aviso = document.getElementById("aviso");
  aviso.textContent = texto;
  aviso.classList.add("visible");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove("visible"), 3000);
}

/* =====================================================================
   Inicio
   ===================================================================== */

cargarProductos();
mostrarCarrito();
