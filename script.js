// --- CONFIGURACIÓN ---
const phoneNumber = "51966756553";

// --- IMÁGENES GENÉRICAS DE INSUMOS ---
const INSUMO_IMAGES = {
  kit: [
    "img/kit-cultivo-1.webp",
    "img/kit-cultivo-2.webp",
    "img/kit-cultivo-3.webp",
  ],
  spawn: ["img/grain-spawn-1.webp", "img/grain-spawn-2.webp"],
  agar: ["img/placa-petri-1.webp", "img/placa-petri-2.webp"],
};

// --- PRECIOS Y TEXTOS (LÓGICA MANUAL) ---
const PRICING = {
  clasica: {
    lc: { regular: 85, preventa: 75 },
    spawn: { regular: 110, preventa: 95 },
    kit: { regular: 130, preventa: 115 },
    agar: { regular: 99, preventa: 85 },
  },
  exotica: {
    lc: { regular: 160, preventa: 139 },
    spawn: { regular: 189, preventa: 165 },
    kit: { regular: 199, preventa: 179 },
    agar: { regular: 179, preventa: 155 },
  },
};

const FORMAT_DETAILS = {
  "Cultura Líquida (LC)": {
    key: "lc",
    text: "Jeringa estéril de 10ml con micelio vivo de esta genética específica. Ideal para inocular tus propios frascos.",
    imageType: "strain",
  },
  "Grano (Spawn)": {
    key: "spawn",
    text: "Mushbag de 1Kg de grano esterilizado 100% colonizado y libre de contaminación. Listo para mezclar con sustrato o transferencias.",
    imageType: "spawn",
  },
  "Kit de Cultivo": {
    key: "kit",
    text: "Sistema todo en uno colonizado. Incluye grano, sustrato y bolsa con filtro anti-contaminantes y guía constante. Sin pasos difíciles y automático. Ideal para empezar.",
    imageType: "kit",
  },
  "Placa Petri (Agar)": {
    key: "agar",
    text: "Placa de agar con micelio aislado de esta genética. Perfecta para usuarios más avanzados.",
    imageType: "agar",
  },
};

const TYPE_INFO = {
  clasica: {
    title: "¿Qué significa cepa clásica?",
    text: "Son genéticas antiguas, estabilizadas y de confianza mundial. Conocidas por su resistencia y resultados predecibles. Ideales para estudios estándar y principiantes.",
  },
  exotica: {
    title: "¿Qué significa cepa exótica?",
    text: "Genéticas importadas de reciente aislamiento o mutaciones raras. Se caracterizan por morfologías únicas y una mayor concentración etnobotánica. Selección exclusiva para coleccionistas.",
  },
};

// --- VARIABLES GLOBALES ---
let cart = JSON.parse(localStorage.getItem("magikCart")) || [];
let currentProduct = {};
let currentSlideIndex = 0;
let currentImages = [];

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  initTheme(); // Iniciar tema guardado
});

function saveCart() {
  localStorage.setItem("magikCart", JSON.stringify(cart));
}

// --- MANEJO DEL BOTÓN ATRÁS (HISTORIAL) ---
window.addEventListener("popstate", function (event) {
  const modal = document.getElementById("productModal");
  if (modal && modal.style.display === "flex") {
    modal.style.display = "none";
  }
});

// --- FUNCIONES DEL MODAL ---
function openModal(element) {
  const modal = document.getElementById("productModal");
  const modalContent = modal.querySelector(".modal-content");

  currentProduct = {
    name: element.getAttribute("data-name"),
    type: element.getAttribute("data-type"),
    strainDesc: element.getAttribute("data-desc"),
    strainImg: element
      .getAttribute("data-img")
      .split(",")
      .map((img) => img.trim()),
    regularPrice: 0,
    preventaPrice: 0,
    activePrice: 0,
    isPreventa: false,
  };

  const titleElement = document.getElementById("modal-title");
  titleElement.innerText = currentProduct.name;

  // Lógica Exótica (Clase base)
  if (currentProduct.type === "exotica") {
    titleElement.classList.add("exotica");
    modalContent.classList.add("theme-exotica");
  } else {
    titleElement.classList.remove("exotica");
    modalContent.classList.remove("theme-exotica");
  }

  window.history.pushState({ modalOpen: true }, "", "");
  setupVariantSelect();
  modal.style.display = "flex";
}

function closeModal() {
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  } else {
    document.getElementById("productModal").style.display = "none";
  }
}

window.onclick = function (event) {
  const productModal = document.getElementById("productModal");
  const cartModal = document.getElementById("cartModal");
  if (event.target == productModal) closeModal();
  if (event.target == cartModal) cartModal.style.display = "none";
};

function setupVariantSelect() {
  const select = document.getElementById("variant-select");
  const options = Object.keys(FORMAT_DETAILS);
  select.innerHTML = "";
  options.forEach((opt) => {
    const optionElement = document.createElement("option");
    optionElement.value = opt;
    optionElement.innerText = opt;
    select.appendChild(optionElement);
  });
  select.onchange = () => updateModalDetails(select.value);
  updateModalDetails(select.value);
}

function updateModalDetails(selectedOption) {
  const priceElement = document.getElementById("modal-price");
  const descElement = document.getElementById("modal-desc");
  const formatData = FORMAT_DETAILS[selectedOption];
  const type = currentProduct.type || "clasica";
  const typeData = TYPE_INFO[type];

  const prices = PRICING[type][formatData.key];
  currentProduct.regularPrice = prices.regular;
  currentProduct.preventaPrice = prices.preventa;
  currentProduct.currentVariety = selectedOption;

  // Reset preventa
  currentProduct.isPreventa = false;
  currentProduct.activePrice = currentProduct.regularPrice;
  priceElement.innerText = currentProduct.activePrice.toFixed(2);

  descElement.innerHTML = `
    <div class="product-info-block"><p class="main-desc">${
      formatData.text
    }</p></div>
    <div class="accordion-wrapper">
        <button class="accordion-btn" onclick="toggleAccordion(this)">
            Precio por preventa <span class="arrow">▼</span>
        </button>
        <div class="panel">
            <div class="preventa-content">
                <p class="price-comparison">
                    <span class="strikethrough">${currentProduct.regularPrice.toFixed(
                      2
                    )}</span> 
                    <span class="highlight-price">${currentProduct.preventaPrice.toFixed(
                      2
                    )}</span>
                </p>
                <p class="small-text">Reserva tu producto ahora a un precio reducido (7-14 días hábiles).</p>
                <div class="preventa-option-container-internal">
                  <label class="preventa-checkbox">
                    <input type="checkbox" id="preventa-toggle" onchange="togglePreventaPrice()">
                    <span class="checkmark"></span>
                    <span class="label-text">Optar por PREVENTA (${currentProduct.preventaPrice.toFixed(
                      2
                    )})</span>
                  </label>
                </div>
            </div>
        </div>
    </div>
    <div class="accordion-wrapper">
        <button class="accordion-btn" onclick="toggleAccordion(this)">${
          typeData.title
        } <span class="arrow">▼</span></button>
        <div class="panel"><p class="small-text">${typeData.text}</p></div>
    </div>
    <div class="variant-note"><p>Añade al carrito para consultar por WhatsApp</p></div>
  `;

  if (formatData.imageType === "strain")
    currentImages = currentProduct.strainImg;
  else if (FORMAT_DETAILS[selectedOption])
    currentImages = INSUMO_IMAGES[formatData.imageType] || [];

  currentSlideIndex = 0;
  setupCarousel();
}

function togglePreventaPrice() {
  const preventaCheckbox = document.getElementById("preventa-toggle");
  const priceElement = document.getElementById("modal-price");
  if (preventaCheckbox && preventaCheckbox.checked) {
    currentProduct.activePrice = currentProduct.preventaPrice;
    currentProduct.isPreventa = true;
  } else {
    currentProduct.activePrice = currentProduct.regularPrice;
    currentProduct.isPreventa = false;
  }
  priceElement.innerText = currentProduct.activePrice.toFixed(2);
}

function toggleAccordion(btn) {
  btn.classList.toggle("active");
  const panel = btn.nextElementSibling;
  const arrow = btn.querySelector(".arrow");
  if (panel.style.maxHeight) {
    panel.style.maxHeight = null;
    arrow.style.transform = "rotate(0deg)";
  } else {
    panel.style.maxHeight = panel.scrollHeight + "px";
    arrow.style.transform = "rotate(180deg)";
  }
}

function setupCarousel() {
  const imgWrapper = document.querySelector(".modal-img-wrapper");
  imgWrapper.innerHTML = "";
  if (currentImages.length <= 1) {
    const src =
      currentImages.length === 1 ? currentImages[0] : "img/placeholder.webp";
    imgWrapper.innerHTML = `<img src="${src}" alt="${currentProduct.name}" class="modal-static-img">`;
  } else {
    let slidesHTML = "";
    currentImages.forEach((img, index) => {
      slidesHTML += `<img src="${img}" class="carousel-slide" style="display: ${
        index === 0 ? "block" : "none"
      }">`;
    });
    slidesHTML += `<button class="carousel-btn prev" onclick="moveSlide(-1)">&#10094;</button><button class="carousel-btn next" onclick="moveSlide(1)">&#10095;</button>`;
    imgWrapper.innerHTML = slidesHTML;
  }
}

function moveSlide(n) {
  const slides = document.getElementsByClassName("carousel-slide");
  if (!slides.length) return;
  slides[currentSlideIndex].style.display = "none";
  currentSlideIndex += n;
  if (currentSlideIndex >= slides.length) currentSlideIndex = 0;
  if (currentSlideIndex < 0) currentSlideIndex = slides.length - 1;
  slides[currentSlideIndex].style.display = "block";
}

const standardBtn = document.querySelector(".add-cart-btn");
if (standardBtn) {
  standardBtn.addEventListener("click", function () {
    const item = {
      id: Date.now(),
      name: currentProduct.name,
      price: currentProduct.activePrice,
      variety: currentProduct.currentVariety,
      isPreventa: currentProduct.isPreventa,
      type: currentProduct.type, // GUARDAMOS EL TIPO (Clásica/Exótica)
    };
    cart.push(item);
    saveCart();
    updateCartUI();
    closeModal();
    toggleCart();
  });
}

function toggleCart() {
  const cartModal = document.getElementById("cartModal");
  cartModal.style.display =
    cartModal.style.display === "flex" ? "none" : "flex";
  if (cartModal.style.display === "flex") renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById("cart-items");
  container.innerHTML = "";
  if (cart.length === 0) {
    container.innerHTML = "<p class='empty-msg'>Tu carrito está vacío.</p>";
    document.getElementById("cart-total").innerText = "0.00";
    return;
  }
  let total = 0;
  cart.forEach((item) => {
    total += item.price;
    // LÓGICA DE COLOR DINÁMICO SEGÚN TIPO DE CEPA
    // Si es exótica -> Magenta (#9c27b0), Si es clásica -> Mostaza (#d4af37)
    let labelColor = item.type === "exotica" ? "#9c27b0" : "#d4af37";

    const preventaLabel = item.isPreventa
      ? `<span style='color:${labelColor}; font-size:0.8rem; font-weight:bold;'> (PREVENTA)</span>`
      : "";

    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <div class="item-info">
        <h4>${item.name} ${preventaLabel}</h4>
        <span>${item.variety}</span>
        <div><strong>${item.price.toFixed(2)}</strong></div>
      </div>
      <span class="remove-item" onclick="removeFromCart(${item.id})">🗑️</span>`;
    container.appendChild(div);
  });
  document.getElementById("cart-total").innerText = total.toFixed(2);
}

function updateCartUI() {
  const countElement = document.getElementById("cart-count");
  if (countElement) countElement.innerText = cart.length;
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCartItems();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCartItems();
  updateCartUI();
}

function sendToWhatsapp() {
  if (cart.length === 0) return alert("El carrito está vacío.");
  let message =
    "¡Hola equipo de FungusLlampa! 👋🍄%0AHe estado revisando su catálogo y me gustaría coordinar el siguiente pedido:%0A%0A";
  let total = 0;
  cart.forEach((item, i) => {
    total += item.price;
    const status = item.isPreventa ? "(PREVENTA ⏳)" : "(STOCK ✅)";
    message += `${i + 1}. *${item.name}* - ${
      item.variety
    } ${status} - S/. ${item.price.toFixed(2)}%0A`;
  });
  message += `%0A*TOTAL APROX: S/. ${total.toFixed(
    2
  )}*%0A%0AQuedo atento a su confirmación y los métodos de pago. ¡Gracias! ✨`;
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
}

// --- LOGICA MODO NOCTURNO ---
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const themeBtn = document.getElementById("theme-toggle");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    if (themeBtn) themeBtn.innerText = "☀️";
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeBtn.innerText = "☀️";
      } else {
        localStorage.setItem("theme", "light");
        themeBtn.innerText = "🌙";
      }
    });
  }
}
