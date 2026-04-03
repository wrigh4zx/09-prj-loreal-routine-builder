/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

/* Keep selected products in memory while the page is open */
let selectedProducts = [];
let previousFocusedElement = null;
let typingTimer = null;
let productsCache = [];
let productsLoaded = false;

/* Track the active keyword search */
let activeSearchQuery = "";

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

/* Remove common markdown styling so the response reads like plain text */
function formatAssistantText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n\s*\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n");
}

/* Keep worker-provided links safe before placing them into HTML */
function sanitizeUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "";
    }

    return parsedUrl.href;
  } catch (_error) {
    return "";
  }
}

/* Type the assistant response into the chat window one character at a time */
function typeIntoChatWindow(answer, citations = [], title = "") {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }

  const plainText = formatAssistantText(answer);
  const citationMarkup = citations.length
    ? `
      <div class="chat-citations">
        <h3>Sources</h3>
        <ul>
          ${citations
            .map((citation, index) => {
              const safeUrl = sanitizeUrl(citation.url);
              const safeLabel = escapeHtml(
                citation.title || citation.url || `Source ${index + 1}`,
              );

              if (!safeUrl) {
                return "";
              }

              return `<li><a href="${safeUrl}" target="_blank" rel="noreferrer noopener">${safeLabel}</a></li>`;
            })
            .join("")}
        </ul>
      </div>
    `
    : "";

  chatWindow.innerHTML = `
    <div class="chat-response">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
      <div class="chat-response-text"></div>
      ${citationMarkup}
    </div>
  `;

  const responseText = chatWindow.querySelector(".chat-response-text");

  let index = 0;
  typingTimer = setInterval(() => {
    responseText.textContent = plainText.slice(0, index + 1);
    index += 1;

    if (index >= plainText.length) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
  }, 18);
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

/* Normalize text for keyword matching */
function normalizeSearchText(text) {
  return text.toLowerCase().trim();
}

/* Load product data once and reuse it for filtering */
async function loadProducts() {
  if (productsLoaded) {
    return productsCache;
  }

  const response = await fetch("products.json");
  const data = await response.json();
  productsCache = Array.isArray(data.products) ? data.products : [];
  productsLoaded = true;
  return productsCache;
}

/* Return the products that match the current category and keyword filters */
function getFilteredProducts(products) {
  const selectedCategory = categoryFilter.value;
  const searchQuery = normalizeSearchText(activeSearchQuery);

  return products.filter((product) => {
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    const searchableText = normalizeSearchText(
      `${product.name} ${product.brand} ${product.category} ${product.description}`,
    );

    return searchableText.includes(searchQuery);
  });
}

/* Build a helpful message when no products match the filters */
function getEmptyProductMessage() {
  const hasCategory = Boolean(categoryFilter.value);
  const hasSearch = Boolean(normalizeSearchText(activeSearchQuery));

  if (hasCategory && hasSearch) {
    return "No products match that category and search term.";
  }

  if (hasCategory) {
    return "No products found in this category.";
  }

  if (hasSearch) {
    return "No products match your search.";
  }

  return "Select a category or search by keyword to view products.";
}

/* Render the products that match the current filters */
async function renderFilteredProducts() {
  const products = await loadProducts();
  const filteredProducts = getFilteredProducts(products);
  displayProducts(filteredProducts);
}

/* Send a chat request to the worker and return the assistant reply */
async function sendChatRequest(messages) {
  const safeWorkerUrl = typeof WORKER_URL === "string" ? WORKER_URL.trim() : "";

  if (!safeWorkerUrl) {
    throw new Error("Missing worker URL. Add WORKER_URL in secrets.js.");
  }

  const payload = {
    messages,
  };

  let response;

  try {
    response = await fetch(safeWorkerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (_networkError) {
    throw new Error(
      "Network fetch failed. Check WORKER_URL, your worker deployment, CORS settings, and internet connection.",
    );
  }

  const responseText = await response.text();
  let data = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch (_jsonError) {
    data = responseText;
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Worker endpoint not found (404). Check WORKER_URL in secrets.js.",
      );
    }

    throw new Error(
      (typeof data === "string" && data.trim()) ||
        data?.error?.message ||
        data?.message ||
        `Worker request failed (status ${response.status}).`,
    );
  }

  const reply =
    data?.answer ||
    data?.output_text ||
    data?.choices?.[0]?.message?.content ||
    data?.message?.content ||
    data?.result ||
    data?.response ||
    (typeof data === "string" ? data : "");

  if (!reply) {
    throw new Error("No response was returned by the worker.");
  }

  return {
    answer: reply,
    citations: Array.isArray(data?.citations) ? data.citations : [],
  };
}

/* Ask OpenAI for a personalized routine using selected products */
async function generateRoutineFromSelectedProducts() {
  if (selectedProducts.length === 0) {
    chatWindow.textContent =
      "Please select at least one product, then click Generate Routine.";
    return;
  }

  const selectedProductData = getSelectedProductData();
  const productJson = JSON.stringify(selectedProductData, null, 2);

  chatWindow.textContent = "Generating your personalized routine...";
  generateRoutineBtn.disabled = true;

  try {
    const routine = await sendChatRequest([
      {
        role: "system",
        content:
          "You are a beauty routine assistant. Use current, web-verified information when relevant. Create a practical step-by-step routine using only the selected products. Include morning and evening sections when possible. Return plain text only. Do not use markdown, bold text, bullet points, or special formatting. Use short section labels on separate lines, then list each step on its own line. Include any useful sources the worker provides.",
      },
      {
        role: "user",
        content: `Create a personalized skincare/beauty routine using only these selected products:\n\n${productJson}`,
      },
    ]);

    typeIntoChatWindow(
      routine.answer,
      routine.citations,
      "Your Personalized Routine",
    );
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

/* Create HTML for displaying product cards */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        ${getEmptyProductMessage()}
      </div>
    `;
    return;
  }

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
  await renderFilteredProducts();
});

/* Filter products as the user types in the search field */
productSearch.addEventListener("input", async (e) => {
  activeSearchQuery = e.target.value;
  await renderFilteredProducts();
});

/* Handle click on product cards using event delegation */
productsContainer.addEventListener("click", async (e) => {
  const descriptionButton = e.target.closest(".description-toggle");
  if (descriptionButton) {
    const products = await loadProducts();
    const filteredProducts = getFilteredProducts(products);

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
  const filteredProducts = getFilteredProducts(products);

  const clickedProduct = filteredProducts.find(
    (product) => getProductId(product) === productCard.dataset.productId,
  );

  if (!clickedProduct) {
    return;
  }

  toggleProductSelection(clickedProduct);
  await renderFilteredProducts();
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
  const filteredProducts = getFilteredProducts(products);

  const focusedProduct = filteredProducts.find(
    (product) => getProductId(product) === productCard.dataset.productId,
  );

  if (!focusedProduct) {
    return;
  }

  toggleProductSelection(focusedProduct);
  await renderFilteredProducts();
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
  renderFilteredProducts();
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
renderFilteredProducts();

/* Generate routine from selected products */
generateRoutineBtn.addEventListener("click", async () => {
  await generateRoutineFromSelectedProducts();
});

/* Chat form submission handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const question = userInput.value.trim();

  if (!question) {
    return;
  }

  const selectedProductData = getSelectedProductData();
  const productJson = JSON.stringify(selectedProductData, null, 2);

  chatWindow.textContent = "Thinking...";
  sendBtn.disabled = true;

  try {
    const answer = await sendChatRequest([
      {
        role: "system",
        content:
          "You are a beauty routine assistant. Answer clearly and briefly. Use current, web-verified information when relevant. Use the selected products as your main context. If the question asks for a routine, give a practical step-by-step answer. Return plain text only. Do not use markdown, bold text, bullet points, or special formatting. Use short section labels on separate lines and keep each thought on its own line when helpful. Include any useful sources the worker provides.",
      },
      {
        role: "user",
        content: `Selected products:\n${productJson}\n\nUser question: ${question}`,
      },
    ]);

    typeIntoChatWindow(answer.answer, answer.citations);
    userInput.value = "";
  } catch (error) {
    chatWindow.textContent = `Something went wrong: ${error.message}`;
  } finally {
    sendBtn.disabled = false;
  }
});
