const IVA = 0.16;
let productos = [];
const carrito = new Map(); // id -> { item, qty }

// Utils
const $ = (sel) => document.querySelector(sel);
function money(n) { return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" }); }
function coincideBusqueda(item, term) {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  const campos = [item.nombre, item.marca, item.editorial, item.autor, item.tamanio, item.color]
    .filter(Boolean).map(s => String(s).toLowerCase());
  return campos.some(c => c.includes(t));
}
function ordenar(items, modo) {
  const arr = [...items];
  switch (modo) {
    case "price_asc": return arr.sort((a, b) => a.precio - b.precio);
    case "price_desc": return arr.sort((a, b) => b.precio - a.precio);
    case "name_asc": return arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
    default: return arr;
  }
}

// Render de productos
function renderLista() {
  const category = $("#categoria").value;
  const sort = $("#orden").value;
  const term = $("#busqueda").value;

  let visibles = productos.filter(p =>
    (category === "all" ? true : p.categoria === category) &&
    coincideBusqueda(p, term)
  );
  visibles = ordenar(visibles, sort);

  const listEl = $("#lista");
  listEl.innerHTML = "";
  if (!visibles.length) {
    listEl.innerHTML = `<p style="grid-column:1/-1;color:var(--muted)">No se encontraron productos.</p>`;
    return;
  }

  for (const p of visibles) {
    const meta = p.categoria === "libros"
      ? `${p.autor ?? "Autor"} · ${p.editorial ?? "Editorial"}`
      : p.categoria === "libretas"
      ? `${p.marca ?? ""} ${p.tamanio ? "· " + p.tamanio : ""}${p.colores ? " · Colores: " + p.colores.join(", ") : ""}`
      : p.marca ?? "Útiles escolares";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb">${p.categoria.toUpperCase()}</div>
      <div class="card-body">
        <div class="title">${p.nombre}</div>
        <div class="meta">${meta}</div>
        <div class="meta">${p.stock > 0 ? "Stock: " + p.stock : "Sin stock"}</div>
        <div class="price">${money(p.precio)}</div>
        <div class="actions">
          <button class="btn small" ${p.stock ? "" : "disabled"} data-add="${p.id}">Agregar</button>
          <button class="btn small secondary" data-details="${p.id}">Detalles</button>
        </div>
      </div>
    `;
    listEl.appendChild(card);
  }
}

// Carrito
function agregar(id) {
  const item = productos.find(p => p.id === id);
  if (!item || item.stock <= 0) return;
  const entry = carrito.get(id) || { item, qty: 0 };
  if (entry.qty < item.stock) {
    entry.qty += 1;
    carrito.set(id, entry);
  }
  renderCarrito();
}
function quitar(id) {
  const entry = carrito.get(id);
  if (!entry) return;
  entry.qty -= 1;
  if (entry.qty <= 0) carrito.delete(id);
  else carrito.set(id, entry);
  renderCarrito();
}
function eliminar(id) { carrito.delete(id); renderCarrito(); }

function renderCarrito() {
  const cartEl = $("#carrito");
  cartEl.innerHTML = "";
  if (carrito.size === 0) {
    cartEl.innerHTML = `<p style="color:var(--muted)">Tu carrito está vacío.</p>`;
  } else {
    for (const [id, { item, qty }] of carrito.entries()) {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div>
          <div style="font-weight:700">${item.nombre}</div>
          <div style="color:var(--muted);font-size:.9rem">${item.categoria}${item.marca ? " · " + item.marca : ""}</div>
        </div>
        <div>${money(item.precio)}</div>
        <div class="qty">
          <button data-dec="${id}">−</button>
          <span>${qty}</span>
          <button data-inc="${id}">+</button>
        </div>
        <button class="btn small remove" data-remove="${id}">Eliminar</button>
      `;
      cartEl.appendChild(row);
    }
  }
  const subtotal = Array.from(carrito.values()).reduce((a, { item, qty }) => a + item.precio * qty, 0);
  const iva = subtotal * IVA;
  const total = subtotal + iva;

  $("#itemsCount").textContent = `Artículos: ${Array.from(carrito.values()).reduce((a, e) => a + e.qty, 0)}`;
  $("#subtotal").textContent = `Subtotal: ${money(subtotal)} MXN`;
  $("#iva").textContent = `IVA (16%): ${money(iva)} MXN`;
  $("#total").textContent = `Total: ${money(total)} MXN`;
}

// Detalles
function verDetalles(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  const campos = Object.entries(p).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n");
  alert(`Detalles del producto:\n\n${campos}`);
}

// Eventos delegados
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const rmv = e.target.closest("[data-remove]");
  const det = e.target.closest("[data-details]");
  if (add) agregar(add.getAttribute("data-add"));
  if (inc) agregar(inc.getAttribute("data-inc"));
  if (dec) quitar(dec.getAttribute("data-dec"));
  if (rmv) eliminar(rmv.getAttribute("data-remove"));
  if (det) verDetalles(det.getAttribute("data-details"));
});

// Filtros y búsqueda
$("#categoria").addEventListener("change", renderLista);
$("#orden").addEventListener("change", renderLista);
$("#busqueda").addEventListener("input", renderLista);
$("#limpiar").addEventListener("click", () => {
  $("#categoria").value = "all";
  $("#orden").value = "relevance";
  $("#busqueda").value = "";
  renderLista();
});
$("#vaciar").addEventListener("click", () => { carrito.clear(); renderCarrito(); });

// Datos embebidos directamente
const libros = [
  { id: "l1", nombre: "Cien años de soledad", autor: "Gabriel García Márquez", editorial: "Sudamericana", precio: 250, stock: 5, categoria: "libros" },
  { id: "l2", nombre: "El principito", autor: "Antoine de Saint-Exupéry", editorial: "Reynal & Hitchcock", precio: 150, stock: 3, categoria: "libros" }
];
const libretas = [
  { id: "lb1", nombre: "Libreta rayada", marca: "Scribe", tamanio: "A5", precio: 50, stock: 10, categoria: "libretas" }
];
const utiles = [
  { id: "u1", nombre: "Pluma azul", marca: "Bic", precio: 10, stock: 20, categoria: "utiles" }
];

// Init
document.addEventListener("DOMContentLoaded", () => {
  productos = [...libros, ...libretas, ...utiles];
  renderLista();
  renderCarrito();
});
