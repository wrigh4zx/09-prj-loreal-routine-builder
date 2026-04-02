/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

/* Keep selected products in memory while the page is open */
let selectedProducts = [];
let previousFocusedElement = null;

/* Create a reusable modal for product descriptions */
const descriptionModal = document.createElement("div");
descriptionModal.className = "description-modal";
descriptionModal.setAttribute("aria-hidden", "true");
descriptionModal.innerHTML = `
  <div
    class="description-modal-content"
    role="dialog"
    aria-modal="true"
    aria-labelledby="descriptionModalTitle"
  >
    <div class="description-modal-header">
      <h3 id="descriptionModalTitle"></h3>
      <button
        type="button"
        class="description-modal-close"
        aria-label="Close description modal"
      >
        &times;
      </button>
    </div>
    <img
      id="descriptionModalImage"
      class="description-modal-image"
      src=""
      alt=""
    >
    <p id="descriptionModalBody" class="description-modal-body"></p>
  </div>
`;
document.body.appendChild(descriptionModal);

const descriptionModalTitle = document.getElementById("descriptionModalTitle");
const descriptionModalImage = document.getElementById("descriptionModalImage");
const descriptionModalBody = document.getElementById("descriptionModalBody");
const descriptionModalCloseBtn = descriptionModal.querySelector(
  ".description-modal-close",
);

/* Build a simple unique id from product details */
function getProductId(product) {
  return `${product.name}-${product.brand}`;
}

/* Escape text before placing it into innerHTML */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* Return only fields needed for routine generation */
function getSelectedProductData() {
  return selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));
}

/* Ask OpenAI for a personalized routine using selected products */
async function generateRoutineFromSelectedProducts() {
  if (selectedProducts.length === 0) {
    chatWindow.textContent =
      "Please select at least one product, then click Generate Routine.";
    return;
  }

  if (typeof OPENAI_API_KEY === "undefined" || !OPENAI_API_KEY) {
    chatWindow.textContent =
      "Missing API key. Add your key in secrets.js before generating a routine.";
    return;
  }

  const selectedProductData = getSelectedProductData();
  const productJson = JSON.stringify(selectedProductData, null, 2);

  chatWindow.textContent = "Generating your personalized routine...";
  generateRoutineBtn.disabled = true;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a beauty routine assistant. Create a practical step-by-step routine using only the selected products. Include morning and evening sections when possible.",
          },
          {
            role: "user",
            content: `Create a personalized skincare/beauty routine using only these selected products:\n\n${productJson}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const apiMessage = data.error?.message || "OpenAI request failed.";
      throw new Error(apiMessage);
    }

    const routine = data.choices?.[0]?.message?.content;

    if (!routine) {
      throw new Error("No routine was returned by the API.");
    }

    chatWindow.innerHTML = `<strong>Your Personalized Routine</strong><br><br>${escapeHtml(
      routine,
    ).replace(/\n/g, "<br>")}`;
  } catch (error) {
    chatWindow.textContent = `Something went wrong: ${error.message}`;
  } finally {
    generateRoutineBtn.disabled = false;
  }
}

/* Check if a product is currently selected */
function isProductSelected(productId) {
  return selectedProducts.some(
    (product) => getProductId(product) === productId,
  );
}

/* Open modal and show product description */
function openDescriptionModal(product) {
  previousFocusedElement = document.activeElement;
  descriptionModalTitle.textContent = `${product.name} by ${product.brand}`;
  descriptionModalImage.src = product.image;
  descriptionModalImage.alt = product.name;
  descriptionModalBody.textContent = product.description;
  descriptionModal.classList.add("is-open");
  descriptionModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  descriptionModalCloseBtn.focus();
}

/* Close modal and return focus to previous element */
function closeDescriptionModal() {
  descriptionModal.classList.remove("is-open");
  descriptionModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (previousFocusedElement) {
    previousFocusedElement.focus();
  }
}

/* Add or remove product from selected list */
function toggleProductSelection(product) {
  const productId = getProductId(product);

  if (isProductSelected(productId)) {
    selectedProducts = selectedProducts.filter(
      (selectedProduct) => getProductId(selectedProduct) !== productId,
    );
  } else {
    selectedProducts.push(product);
  }

  renderSelectedProducts();
}

/* Render selected products with remove buttons */
function renderSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="selected-empty">No products selected yet.</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map((product) => {
      const productId = getProductId(product);

      return `
        <button
          type="button"
          class="selected-item"
          data-product-id="${productId}"
          aria-label="Remove ${product.name}"
        >
          ${product.name}
          <span class="remove-icon" aria-hidden="true">&times;</span>
        </button>
      `;
    })
    .join("");
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const productId = getProductId(product);

      return `
    <div
      class="product-card ${isProductSelected(productId) ? "is-selected" : ""}"
      data-product-id="${productId}"
      role="button"
      tabindex="0"
      aria-pressed="${isProductSelected(productId)}"
      aria-label="Select ${product.name}"
    >
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button
          type="button"
          class="description-toggle"
          data-product-id="${productId}"
          aria-haspopup="dialog"
          aria-label="View details for ${product.name}"
        >
          View details
        </button>
      </div>
    </div>
  `;
    })
    .join("");
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory,
  );

  displayProducts(filteredProducts);
});

/* Handle click on product cards using event delegation */
productsContainer.addEventListener("click", async (e) => {
  const descriptionButton = e.target.closest(".description-toggle");
  if (descriptionButton) {
    const products = await loadProducts();
    const selectedCategory = categoryFilter.value;
    const filteredProducts = products.filter(
      (product) => product.category === selectedCategory,
    );

    const productToShow = filteredProducts.find(
      (product) =>
        getProductId(product) === descriptionButton.dataset.productId,
    );

    if (productToShow) {
      openDescriptionModal(productToShow);
    }

    return;
  }

  const productCard = e.target.closest(".product-card");
  if (!productCard) {
    return;
  }

  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory,
  );

  const clickedProduct = filteredProducts.find(
    (product) => getProductId(product) === productCard.dataset.productId,
  );

  if (!clickedProduct) {
    return;
  }

  toggleProductSelection(clickedProduct);
  displayProducts(filteredProducts);
});

/* Support keyboard selection with Enter/Space */
productsContainer.addEventListener("keydown", async (e) => {
  if (e.target.closest(".description-toggle")) {
    return;
  }

  if (e.key !== "Enter" && e.key !== " ") {
    return;
  }

  const productCard = e.target.closest(".product-card");
  if (!productCard) {
    return;
  }

  e.preventDefault();

  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory,
  );

  const focusedProduct = filteredProducts.find(
    (product) => getProductId(product) === productCard.dataset.productId,
  );

  if (!focusedProduct) {
    return;
  }

  toggleProductSelection(focusedProduct);
  displayProducts(filteredProducts);
});

/* Remove products directly from selected section */
selectedProductsList.addEventListener("click", (e) => {
  const removeButton = e.target.closest(".selected-item");
  if (!removeButton) {
    return;
  }

  const productIdToRemove = removeButton.dataset.productId;
  selectedProducts = selectedProducts.filter(
    (product) => getProductId(product) !== productIdToRemove,
  );

  renderSelectedProducts();

  /* Refresh visible cards so selected border is removed in grid */
  const selectedCategory = categoryFilter.value;
  if (!selectedCategory) {
    return;
  }

  loadProducts().then((products) => {
    const filteredProducts = products.filter(
      (product) => product.category === selectedCategory,
    );
    displayProducts(filteredProducts);
  });
});

/* Close modal from close button or when clicking the backdrop */
descriptionModal.addEventListener("click", (e) => {
  if (
    e.target === descriptionModal ||
    e.target.closest(".description-modal-close")
  ) {
    closeDescriptionModal();
  }
});

/* Allow closing modal with Escape key */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && descriptionModal.classList.contains("is-open")) {
    closeDescriptionModal();
  }
});

/* Show empty state message in selected section on first load */
renderSelectedProducts();

/* Generate routine from selected products */
generateRoutineBtn.addEventListener("click", async () => {
  await generateRoutineFromSelectedProducts();
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
