const API_BASE = "https://asdassadsad.rf.gd/api/api.php"; // Tu dominio de backend
const phoneNumber = "51966756553";

let globalPrecios = {};
let globalProductos = [];
let cart = JSON.parse(localStorage.getItem("magikCart")) || [];
let currentProduct = {};
let currentSlideIndex = 0;
let currentImages = [];

const FORMAT_DESC = {
  lc: "Jeringa estéril de 10ml con micelio vivo. Ideal para inocular.",
  spawn: "Mushbag de 1Kg de grano esterilizado 100% colonizado.",
  kit: "Sistema todo en uno colonizado. Guía incluida y automático.",
  agar: "Placa de agar con micelio aislado. Uso avanzado.",
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateCartUI();
  loadCatalog();
});

function loadCatalog() {
  fetch(`${API_BASE}?action=get_catalog`)
    .then((r) => r.json())
    .then((data) => {
      globalPrecios = data.precios;
      globalProductos = data.productos;
      renderGrid();
    })
    .catch((err) => console.error("Error cargando API:", err));
}

function renderGrid() {
  const grid = document.getElementById("dynamic-grid");
  grid.innerHTML = "";

  globalProductos.forEach((p) => {
    const isExotica = p.tipo === "exotica";
    const stockStatus =
      p.stock_actual <= 0
        ? `<div class="stock-badge pre-order">PREVENTA</div>`
        : `<div class="stock-badge in-stock">${p.stock_actual} DISP.</div>`;

    const article = document.createElement("article");
    article.className = "product-item";
    article.innerHTML = `
            <div class="img-container">
                <img src="${p.imagen_main}" alt="${p.nombre}">
                ${stockStatus}
            </div>
            <div class="info-box">
                <h3>${p.nombre}</h3>
                <p class="price ${
                  isExotica ? "exotica" : ""
                }">${p.tipo.toUpperCase()}</p>
            </div>
        `;
    article.onclick = () => openModal(p);
    grid.appendChild(article);
  });
}

function openModal(p) {
  const modal = document.getElementById("productModal");
  const modalContent = modal.querySelector(".modal-content");

  currentProduct = {
    name: p.nombre,
    type: p.tipo,
    desc: p.descripcion,
    stock: parseInt(p.stock_actual),
    images: [
      p.imagen_main,
      ...p.otras_imagenes.split(",").filter((i) => i.trim() !== ""),
    ],
    activePrice: 0,
    isPreventa: false,
  };

  document.getElementById("modal-title").innerText = currentProduct.name;
  if (currentProduct.type === "exotica")
    modalContent.classList.add("theme-exotica");
  else modalContent.classList.remove("theme-exotica");

  setupVariantSelect();
  modal.style.display = "flex";
}

function setupVariantSelect() {
  const select = document.getElementById("variant-select");
  select.innerHTML = "";
  const formats = globalPrecios[currentProduct.type];
  for (let key in formats) {
    let opt = document.createElement("option");
    opt.value = key;
    opt.innerText = formats[key].nombre;
    select.appendChild(opt);
  }
  select.onchange = () => updateDetails(select.value);
  updateDetails(select.value);
}

function updateDetails(key) {
  const priceData = globalPrecios[currentProduct.type][key];
  const stockInfo = document.getElementById("stock-info-text");

  currentProduct.regularPrice = priceData.regular;
  currentProduct.preventaPrice = priceData.preventa;
  currentProduct.currentFormatName = priceData.nombre;

  if (currentProduct.stock <= 0) {
    currentProduct.isPreventa = true;
    currentProduct.activePrice = currentProduct.preventaPrice;
    stockInfo.innerHTML = `<span style="color:#e74c3c;">AGOTADO - Disponible solo en Preventa</span>`;
  } else {
    currentProduct.isPreventa = false;
    currentProduct.activePrice = currentProduct.regularPrice;
    stockInfo.innerHTML = `<span style="color:#27ae60;">¡STOCK DISPONIBLE! (${currentProduct.stock} unidades)</span>`;
  }

  document.getElementById("modal-price").innerText =
    currentProduct.activePrice.toFixed(2);
  document.getElementById("modal-desc").innerHTML = `<p class="main-desc">${
    FORMAT_DESC[key] || ""
  }</p><p class="small-text">${currentProduct.desc}</p>`;
  currentImages = currentProduct.images;
  setupCarousel();
}

function setupCarousel() {
  const wrapper = document.querySelector(".modal-img-wrapper");
  wrapper.innerHTML = "";
  if (currentImages.length <= 1) {
    wrapper.innerHTML = `<img src="${currentImages[0]}" class="modal-static-img">`;
  } else {
    let html = currentImages
      .map(
        (img, i) =>
          `<img src="${img}" class="carousel-slide" style="display:${
            i == 0 ? "block" : "none"
          }">`
      )
      .join("");
    html += `<button class="carousel-btn prev" onclick="moveSlide(-1)">&#10094;</button><button class="carousel-btn next" onclick="moveSlide(1)">&#10095;</button>`;
    wrapper.innerHTML = html;
  }
}

function moveSlide(n) {
  const slides = document.querySelectorAll(".carousel-slide");
  slides[currentSlideIndex].style.display = "none";
  currentSlideIndex = (currentSlideIndex + n + slides.length) % slides.length;
  slides[currentSlideIndex].style.display = "block";
}

document.querySelector(".add-cart-btn").onclick = () => {
  cart.push({
    id: Date.now(),
    name: currentProduct.name,
    price: currentProduct.activePrice,
    variety: currentProduct.currentFormatName,
    isPreventa: currentProduct.isPreventa,
    type: currentProduct.type,
  });
  localStorage.setItem("magikCart", JSON.stringify(cart));
  updateCartUI();
  closeModal();
  toggleCart();
};

function sendToWhatsapp() {
  if (cart.length === 0) return;

  // LOG EN INFINITYFREE
  fetch(`${API_BASE}?action=log_order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cart }),
  });

  let msg = "¡Hola FungusLlampa! 👋 Pedido solicitado:%0A%0A";
  cart.forEach((item, i) => {
    msg += `${i + 1}. *${item.name}* (${item.variety}) ${
      item.isPreventa ? "[PREVENTA]" : ""
    } - S/. ${item.price.toFixed(2)}%0A`;
  });
  msg += `%0A*Total: ${document.getElementById("cart-total").innerText}*`;
  window.open(`https://wa.me/${phoneNumber}?text=${msg}`, "_blank");
}

function updateCartUI() {
  document.getElementById("cart-count").innerText = cart.length;
  const container = document.getElementById("cart-items");
  let total = 0;
  container.innerHTML = cart.length === 0 ? "<p>Carrito vacío</p>" : "";
  cart.forEach((item) => {
    total += item.price;
    container.innerHTML += `<div class="cart-item"><div class="item-info"><h4>${
      item.name
    }</h4><span>${item.variety}</span><div><strong>S/. ${item.price.toFixed(
      2
    )}</strong></div></div><span class="remove-item" onclick="removeFromCart(${
      item.id
    })">🗑️</span></div>`;
  });
  document.getElementById("cart-total").innerText = "S/. " + total.toFixed(2);
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  localStorage.setItem("magikCart", JSON.stringify(cart));
  updateCartUI();
}

function clearCart() {
  cart = [];
  localStorage.removeItem("magikCart");
  updateCartUI();
}
function closeModal() {
  document.getElementById("productModal").style.display = "none";
}
function toggleCart() {
  const c = document.getElementById("cartModal");
  c.style.display = c.style.display === "flex" ? "none" : "flex";
}
function initTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  if (localStorage.getItem("theme") === "dark")
    document.body.classList.add("dark-mode");
  btn.onclick = () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
  };
}


