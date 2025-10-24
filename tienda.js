const WHATSAPP_NUMBER = "50243371469";
const CURRENCY = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });

const PRODUCTS = [
  { id: "mx1", nombre: "Nexlock Urban 15.6” (peso + app)", precio: 399, promo: 349, stock: 12, img: "img/urban.jpg", categoria: "Urbana" },
  { id: "mx2", nombre: "Nexlock Pro 17” USB (GPS + alarma)", precio: 549, stock: 7, img: "img/pro.jpg", categoria: "Trabajo" },
  { id: "mx3", nombre: "Nexlock Travel RFID (impermeable)", precio: 629, promo: 579, stock: 5, img: "img/travel.jpg", categoria: "Viaje" }
];

const CART_KEY = "nexlock_cart";
const $ = (q) => document.querySelector(q);
const loadCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "{}");
const saveCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
const money = (n) => CURRENCY.format(n);
const cartCount = (c) => Object.values(c).reduce((a, b) => a + b, 0);

// Render de productos
function renderProducts() {
  const grid = $("#grid-productos");
  const q = ($("#buscador")?.value || "").toLowerCase();

  const filtered = PRODUCTS.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q)
  );

  let html = "";
  filtered.forEach((p) => {
    const precioUnit = p.promo ?? p.precio;
    const tienePromo = Boolean(p.promo);
    html +=
      '<article class="card" data-id="' +
      p.id +
      '">' +
      '<img src="' + (p.img || "img/placeholder.jpg") + '" alt="' + p.nombre + '" loading="lazy" />' +
      "<h3>" + p.nombre + "</h3>" +
      '<div class="precio">' +
      (tienePromo
        ? '<span class="promo">' + money(precioUnit) + "</span><span class=\"tachado\">" + money(p.precio) + "</span>"
        : "<span>" + money(precioUnit) + "</span>") +
      "</div>" +
      "<small>" + (p.categoria || "—") + " · Stock: " + (p.stock ?? "—") + "</small><br />" +
      '<button class="btn-agregar" data-id="' + p.id + '">Añadir al carrito</button>' +
      "</article>";
  });

  grid.innerHTML = html || '<p style="color:#97a0ad">No hay resultados.</p>';
}

// Totales + WhatsApp
function totals(cart) {
  let subtotal = 0;
  for (const [pid, qty] of Object.entries(cart)) {
    const p = PRODUCTS.find((x) => x.id === pid);
    if (!p) continue;
    const unit = p.promo ?? p.precio;
    subtotal += unit * qty;
  }
  return { subtotal, total: subtotal };
}

function buildWA(cart) {
  const lines = ["Pedido Nexlock (Mochilas inteligentes)"];
  for (const [pid, qty] of Object.entries(cart)) {
    const p = PRODUCTS.find((x) => x.id === pid);
    if (!p) continue;
    const unit = p.promo ?? p.precio;
    lines.push(
      "• " +
        p.nombre +
        " x" +
        qty +
        " — " +
        money(unit * qty) +
        " (" +
        money(unit) +
        " c/u)"
    );
  }
  const { total } = totals(cart);
  lines.push("\nTotal: " + money(total) + "");
  lines.push("Entrega/pago: a coordinar por WhatsApp");
  return encodeURIComponent(lines.join("\n"));
}

function updateBadge() {
  const badge = $("#cart-badge");
  const count = cartCount(loadCart());
  badge.textContent = count;
  badge.style.display = count ? "inline-block" : "none";
}

function renderCartDrawer() {
  const cart = loadCart();
  const list = $("#cart-list");
  if (!Object.keys(cart).length) {
    list.innerHTML =
      '<div style="color:#97a0ad; text-align:center; padding:20px">Tu carrito está vacío.</div>';
  } else {
    let html = "";
    for (const [pid, qty] of Object.entries(cart)) {
      const p = PRODUCTS.find((x) => x.id === pid);
      if (!p) continue;
      const unit = p.promo ?? p.precio;
      const line = unit * qty;
      html +=
        '<div class="cart-item" data-id="' +
        pid +
        '">' +
        '<img src="' + (p.img || "img/placeholder.jpg") + '" alt="' + p.nombre + '" />' +
        "<div>" +
        '<div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start">' +
        "<strong>" + p.nombre + "</strong>" +
        '<button class="removeBtn" title="Quitar">🗑</button>' +
        "</div>" +
        '<div class="qty" style="margin-top:6px">' +
        '<button class="decBtn">−</button>' +
        "<span><strong>" + qty + "</strong></span>" +
        '<button class="incBtn">+</button>' +
        '<span style="margin-left:auto">' + money(line) + "</span>" +
        "</div>" +
        "<small>" + money(unit) + " c/u</small>" +
        "</div></div>";
    }
    list.innerHTML = html;
  }
  const { subtotal, total } = totals(cart);
  $("#cart-subtotal").textContent = money(subtotal);
  $("#cart-total").textContent = money(total);
}

function openDrawer() {
  const d = $("#cart-drawer");
  d.classList.add("open");
}
function closeDrawer() {
  const d = $("#cart-drawer");
  d.classList.remove("open");
}

(function init() {
  renderProducts();
  updateBadge();

  const buscador = $("#buscador");
  if (buscador) buscador.addEventListener("input", renderProducts);

  document.addEventListener("click", (e) => {
    if (e.target.matches(".btn-agregar")) {
      const pid = e.target.getAttribute("data-id");
      const cart = loadCart();
      cart[pid] = (cart[pid] || 0) + 1;
      saveCart(cart);
      updateBadge();
      e.target.textContent = "Añadido ✔";
      setTimeout(() => (e.target.textContent = "Añadir al carrito"), 900);
    }

    if (e.target.id === "cart-fab") {
      renderCartDrawer();
      openDrawer();
    }
    if (e.target.id === "cart-close") closeDrawer();

    if (
      e.target.classList.contains("incBtn") ||
      e.target.classList.contains("decBtn") ||
      e.target.classList.contains("removeBtn")
    ) {
      const item = e.target.closest(".cart-item");
      const pid = item?.dataset.id;
      if (!pid) return;
      const cart = loadCart();
      if (e.target.classList.contains("incBtn"))
        cart[pid] = (cart[pid] || 0) + 1;
      if (e.target.classList.contains("decBtn")) {
        cart[pid] = Math.max(0, (cart[pid] || 0) - 1);
        if (cart[pid] === 0) delete cart[pid];
      }
      if (e.target.classList.contains("removeBtn")) delete cart[pid];
      saveCart(cart);
      renderCartDrawer();
      updateBadge();
    }

    if (e.target.id === "cart-whatsapp") {
      const cart = loadCart();
      if (!Object.keys(cart).length) return alert("Tu carrito está vacío.");
      const text = buildWA(cart);
      window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + text, "_blank");
    }

    if (e.target.id === "cart-clear") {
      saveCart({});
      renderCartDrawer();
      updateBadge();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
})();