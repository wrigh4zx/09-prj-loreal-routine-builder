/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const clearSelectedProductsBtn = document.getElementById(
  "clearSelectedProducts",
);

const localeStrings = {
  en: {
    pageTitle: "L'Oréal | Smart Routine & Product Advisor",
    siteTitle: "Smart Routine & Product Advisor",
    chooseCategory: "Choose a Category",
    searchLabel: "Search products by name or keyword",
    searchPlaceholder: "Search by name or keyword",
    selectedProductsHeading: "Selected Products",
    clearAll: "Clear All",
    generateRoutine: "Generate Routine",
    buildRoutineHeading: "Let's Build Your Routine",
    messageLabel: "Message",
    chatPlaceholder: "Ask me about products or routines…",
    sendLabel: "Send",
    selectedEmpty: "No products selected yet.",
    noProductsMatchBoth: "No products match that category and search term.",
    noProductsMatchCategory: "No products found in this category.",
    noProductsMatchSearch: "No products match your search.",
    noProductsPrompt:
      "Select a category or search by keyword to view products.",
    noProductsSelectedTitle: "No products selected",
    noProductsSelectedMessage:
      "Please select at least one product, then click Generate Routine.",
    advisorLabel: "Advisor",
    youLabel: "You",
    sourcesHeading: "Sources",
    detailsButton: "View details",
    closeDescription: "Close description modal",
    byText: "by",
    footerCopyright: "© 2025 L'Oréal. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfUse: "Terms of Use",
    contact: "Contact",
    missingWorkerUrl: "Missing worker URL. Add WORKER_URL in secrets.js.",
    networkError:
      "Network fetch failed. Check WORKER_URL, your worker deployment, CORS settings, and internet connection.",
    notFoundError:
      "Worker endpoint not found (404). Check WORKER_URL in secrets.js.",
    noResponseError: "No response was returned by the worker.",
    assistantLanguageInstruction: "Reply in English.",
    categoryLabels: {
      cleanser: "Cleansers",
      moisturizer: "Moisturizers & Treatments",
      skincare: "Skincare",
      haircare: "Haircare",
      makeup: "Makeup",
      "hair color": "Hair Color",
      "hair styling": "Hair Styling",
      "men's grooming": "Men's Grooming",
      suncare: "Suncare",
      fragrance: "Fragrance",
    },
  },
  fr: {
    pageTitle: "L'Oréal | Conseiller de routine et de produits",
    siteTitle: "Conseiller de routine et de produits",
    chooseCategory: "Choisir une catégorie",
    searchLabel: "Rechercher des produits par nom ou mot-clé",
    searchPlaceholder: "Rechercher par nom ou mot-clé",
    selectedProductsHeading: "Produits sélectionnés",
    clearAll: "Tout effacer",
    generateRoutine: "Générer la routine",
    buildRoutineHeading: "Construisons votre routine",
    messageLabel: "Message",
    chatPlaceholder:
      "Posez-moi des questions sur les produits ou les routines…",
    sendLabel: "Envoyer",
    selectedEmpty: "Aucun produit sélectionné pour le moment.",
    noProductsMatchBoth:
      "Aucun produit ne correspond à cette catégorie et à ce terme de recherche.",
    noProductsMatchCategory: "Aucun produit trouvé dans cette catégorie.",
    noProductsMatchSearch: "Aucun produit ne correspond à votre recherche.",
    noProductsPrompt:
      "Choisissez une catégorie ou recherchez par mot-clé pour afficher les produits.",
    noProductsSelectedTitle: "Aucun produit sélectionné",
    noProductsSelectedMessage:
      "Sélectionnez au moins un produit, puis cliquez sur Générer la routine.",
    advisorLabel: "Conseiller",
    youLabel: "Vous",
    sourcesHeading: "Sources",
    detailsButton: "Voir les détails",
    closeDescription: "Fermer la fenêtre de description",
    byText: "par",
    footerCopyright: "© 2025 L'Oréal. Tous droits réservés.",
    privacyPolicy: "Politique de confidentialité",
    termsOfUse: "Conditions d'utilisation",
    contact: "Contact",
    missingWorkerUrl:
      "URL du worker manquante. Ajoutez WORKER_URL dans secrets.js.",
    networkError:
      "Échec de la requête réseau. Vérifiez WORKER_URL, le déploiement du worker, les paramètres CORS et votre connexion Internet.",
    notFoundError:
      "Point de terminaison du worker introuvable (404). Vérifiez WORKER_URL dans secrets.js.",
    noResponseError: "Aucune réponse n'a été renvoyée par le worker.",
    assistantLanguageInstruction: "Réponds en français.",
    categoryLabels: {
      cleanser: "Nettoyants",
      moisturizer: "Hydratants et soins",
      skincare: "Soins de la peau",
      haircare: "Soins capillaires",
      makeup: "Maquillage",
      "hair color": "Coloration",
      "hair styling": "Coiffage",
      "men's grooming": "Soins pour hommes",
      suncare: "Protection solaire",
      fragrance: "Parfums",
    },
  },
};

function getBrowserLanguageCode() {
  const preferredLanguages = Array.isArray(navigator.languages)
    ? navigator.languages
    : [];
  const fallbackLanguage = navigator.language ? [navigator.language] : [];
  const allLanguages = [...preferredLanguages, ...fallbackLanguage, "en"];
  const firstLanguage = allLanguages.find(
    (language) => typeof language === "string" && language.trim(),
  );

  return (firstLanguage || "en").toLowerCase();
}

function getSupportedLocale(languageCode) {
  const primaryLanguage = String(languageCode || "en").split("-")[0];
  return localeStrings[primaryLanguage] ? primaryLanguage : "en";
}

function getAssistantLanguageInstruction(languageCode) {
  const locale = String(languageCode || "en").toLowerCase();

  if (locale.startsWith("fr")) {
    return "Réponds en français.";
  }

  const languageName = locale.startsWith("es")
    ? "Spanish"
    : locale.startsWith("de")
      ? "German"
      : locale.startsWith("it")
        ? "Italian"
        : locale.startsWith("pt")
          ? "Portuguese"
          : locale.startsWith("nl")
            ? "Dutch"
            : locale.startsWith("ar")
              ? "Arabic"
              : locale.startsWith("ja")
                ? "Japanese"
                : locale.startsWith("ko")
                  ? "Korean"
                  : locale.startsWith("zh")
                    ? "Chinese"
                    : "English";

  return `Reply in ${languageName}.`;
}

const browserLanguageCode = getBrowserLanguageCode();
const browserPrimaryLanguage = browserLanguageCode.split("-")[0];
const currentLocale = getSupportedLocale(browserLanguageCode);
let uiText = localeStrings[currentLocale];

const selectedProductsStorageKey = "loreal-selected-products";
const rtlLanguages = ["ar", "he", "fa", "ur"];
const sharedSystemPrompt = `You are a beauty routine assistant for L'Oréal products. Use the selected products and the full conversation history to answer clearly and briefly. Keep replies focused on skincare, haircare, makeup, fragrance, and related routine questions. Use current, web-verified information when relevant. Return plain text only. Do not use markdown, bold text, bullet points, or special formatting. Use short section labels on separate lines and keep each thought on its own line when helpful. Include useful sources when available. ${getAssistantLanguageInstruction(browserLanguageCode)}`;

/* Keep selected products and conversation history in memory while the page is open */
let selectedProducts = [];
let conversationHistory = [];
let previousFocusedElement = null;
let typingTimer = null;
let productsCache = [];
let productsLoaded = false;
const translationCache = new Map();
const localizedProductCache = new Map();

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
  if (product.id !== undefined && product.id !== null) {
    return String(product.id);
  }

  return `${product.name}-${product.brand}`;
}

function safeParseJson(text, fallbackValue) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return fallbackValue;
  }
}

function saveSelectedProducts() {
  try {
    localStorage.setItem(
      selectedProductsStorageKey,
      JSON.stringify(selectedProducts),
    );
  } catch (_error) {
    // Ignore storage failures so the UI still works.
  }
}

function loadSelectedProducts() {
  try {
    const storedValue = localStorage.getItem(selectedProductsStorageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue = safeParseJson(storedValue, []);

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (_error) {
    return [];
  }
}

function getInitialDirection() {
  const browserLanguage = browserLanguageCode;
  return rtlLanguages.some((language) => browserLanguage.startsWith(language))
    ? "rtl"
    : "ltr";
}

function shouldTranslateToBrowserLanguage() {
  return browserPrimaryLanguage !== "en";
}

function createProductTranslationKey(product) {
  return `${browserPrimaryLanguage}:${getProductId(product)}`;
}

function translateCategoryLabel(categoryValue) {
  return uiText.categoryLabels[categoryValue] || categoryValue;
}

function applyLanguageToPage() {
  document.documentElement.lang = browserLanguageCode;
  document.documentElement.setAttribute("dir", getInitialDirection());
  document.title = uiText.pageTitle;

  const siteTitle = document.querySelector(".site-title");
  if (siteTitle) {
    siteTitle.textContent = uiText.siteTitle;
  }

  if (categoryFilter) {
    const placeholderOption = categoryFilter.querySelector('option[value=""]');
    if (placeholderOption) {
      placeholderOption.textContent = uiText.chooseCategory;
    }

    categoryFilter.querySelectorAll("option").forEach((option) => {
      if (option.value) {
        option.textContent = translateCategoryLabel(option.value);
      }
    });
  }

  const productSearchLabel = document.querySelector(
    'label[for="productSearch"]',
  );
  if (productSearchLabel) {
    productSearchLabel.textContent = uiText.searchLabel;
  }

  if (productSearch) {
    productSearch.placeholder = uiText.searchPlaceholder;
  }

  const selectedProductsHeading = document.querySelector(
    ".selected-products h2",
  );
  if (selectedProductsHeading) {
    selectedProductsHeading.textContent = uiText.selectedProductsHeading;
  }

  if (clearSelectedProductsBtn) {
    clearSelectedProductsBtn.textContent = uiText.clearAll;
  }

  if (generateRoutineBtn) {
    generateRoutineBtn.innerHTML =
      '<i class="fa-solid fa-wand-magic-sparkles"></i> ' +
      uiText.generateRoutine;
  }

  const chatHeading = document.querySelector(".chatbox h2");
  if (chatHeading) {
    chatHeading.textContent = uiText.buildRoutineHeading;
  }

  const userInput = document.getElementById("userInput");
  if (userInput) {
    userInput.placeholder = uiText.chatPlaceholder;
  }

  const userInputLabel = document.querySelector('label[for="userInput"]');
  if (userInputLabel) {
    userInputLabel.textContent = uiText.messageLabel;
  }

  const sendBtnLabel = document.querySelector("#sendBtn .visually-hidden");
  if (sendBtnLabel) {
    sendBtnLabel.textContent = uiText.sendLabel;
  }

  const footerCopyright = document.querySelector(".site-footer p");
  if (footerCopyright) {
    footerCopyright.textContent = uiText.footerCopyright;
  }

  const footerLinks = document.querySelectorAll(".site-footer nav a");
  if (footerLinks[0]) {
    footerLinks[0].textContent = uiText.privacyPolicy;
  }
  if (footerLinks[1]) {
    footerLinks[1].textContent = uiText.termsOfUse;
  }
  if (footerLinks[2]) {
    footerLinks[2].textContent = uiText.contact;
  }

  if (descriptionModalCloseBtn) {
    descriptionModalCloseBtn.setAttribute(
      "aria-label",
      uiText.closeDescription,
    );
  }
}

function appendChatMessage(role, text, { title = "", citations = [] } = {}) {
  const messageElement = document.createElement("article");
  messageElement.className = `chat-turn chat-turn--${role}`;

  const roleLabel = role === "user" ? uiText.youLabel : uiText.advisorLabel;
  const citationMarkup =
    role === "assistant" && citations.length
      ? `
        <div class="chat-citations">
          <h3>${uiText.sourcesHeading}</h3>
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

  messageElement.innerHTML = `
    <div class="chat-turn-label">${roleLabel}</div>
    <div class="chat-turn-panel">
      ${title ? `<h3 class="chat-turn-title">${escapeHtml(title)}</h3>` : ""}
      <div class="chat-turn-text"></div>
      ${citationMarkup}
    </div>
  `;

  const textElement = messageElement.querySelector(".chat-turn-text");
  textElement.textContent = text;

  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return { messageElement, textElement };
}

function appendUserMessage(text) {
  appendChatMessage("user", text);
}

function recordConversationTurn(userMessage, assistantMessage) {
  conversationHistory.push(
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantMessage },
  );
}

function buildConversationMessages(currentUserMessage) {
  return [
    { role: "system", content: sharedSystemPrompt },
    ...conversationHistory,
    { role: "user", content: currentUserMessage },
  ];
}

function getSelectedProductsContext() {
  const selectedProductData = getSelectedProductData();
  return JSON.stringify(selectedProductData, null, 2);
}

function updateSelectedProductsControls() {
  if (clearSelectedProductsBtn) {
    clearSelectedProductsBtn.disabled = selectedProducts.length === 0;
  }
}

/* Escape text before placing it into innerHTML */
function escapeHtml(text) {
  return String(text ?? "")
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
  const { textElement } = appendChatMessage("assistant", "", {
    title,
    citations,
  });

  let index = 0;
  typingTimer = setInterval(() => {
    textElement.textContent = plainText.slice(0, index + 1);
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
    name: getProductDisplayName(product),
    brand: product.brand,
    category: product.category,
    description: getProductDisplayDescription(product),
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

function getProductDisplayName(product) {
  const localizedProduct = localizedProductCache.get(
    createProductTranslationKey(product),
  );
  return localizedProduct?.name || product.name;
}

function getProductDisplayDescription(product) {
  const localizedProduct = localizedProductCache.get(
    createProductTranslationKey(product),
  );
  return localizedProduct?.description || product.description;
}

async function translateTexts(texts) {
  const safeTexts = texts.map((text) => String(text || ""));

  if (!shouldTranslateToBrowserLanguage()) {
    return safeTexts;
  }

  const result = new Array(safeTexts.length);
  const missingTexts = [];
  const missingIndexes = [];

  safeTexts.forEach((text, index) => {
    const cacheKey = `${browserPrimaryLanguage}:${text}`;

    if (translationCache.has(cacheKey)) {
      result[index] = translationCache.get(cacheKey);
    } else {
      missingTexts.push(text);
      missingIndexes.push(index);
    }
  });

  if (missingTexts.length > 0) {
    const translatedMissingTexts = await sendTranslationRequest(missingTexts);

    translatedMissingTexts.forEach((translatedText, index) => {
      const originalText = missingTexts[index];
      const cacheKey = `${browserPrimaryLanguage}:${originalText}`;
      const safeTranslatedText = String(translatedText || originalText);

      translationCache.set(cacheKey, safeTranslatedText);
    });

    missingIndexes.forEach((originalIndex, index) => {
      result[originalIndex] =
        translatedMissingTexts[index] || safeTexts[originalIndex];
    });
  }

  return result.map((text, index) => text || safeTexts[index]);
}

async function getLocalizedProduct(product) {
  if (!shouldTranslateToBrowserLanguage()) {
    return product;
  }

  const productCacheKey = createProductTranslationKey(product);
  const cachedProduct = localizedProductCache.get(productCacheKey);

  if (cachedProduct) {
    return cachedProduct;
  }

  const [translatedName, translatedDescription] = await translateTexts([
    product.name,
    product.description,
  ]);

  const localizedProduct = {
    ...product,
    name: translatedName,
    description: translatedDescription,
  };

  localizedProductCache.set(productCacheKey, localizedProduct);
  return localizedProduct;
}

async function localizeUiTextForBrowserLanguage() {
  if (localeStrings[browserPrimaryLanguage]) {
    uiText = localeStrings[browserPrimaryLanguage];
    return;
  }

  const englishUiText = localeStrings.en;
  const translatableKeys = [
    "pageTitle",
    "siteTitle",
    "chooseCategory",
    "searchLabel",
    "searchPlaceholder",
    "selectedProductsHeading",
    "clearAll",
    "generateRoutine",
    "buildRoutineHeading",
    "messageLabel",
    "chatPlaceholder",
    "sendLabel",
    "selectedEmpty",
    "noProductsMatchBoth",
    "noProductsMatchCategory",
    "noProductsMatchSearch",
    "noProductsPrompt",
    "noProductsSelectedTitle",
    "noProductsSelectedMessage",
    "advisorLabel",
    "youLabel",
    "sourcesHeading",
    "detailsButton",
    "closeDescription",
    "byText",
    "footerCopyright",
    "privacyPolicy",
    "termsOfUse",
    "contact",
    "missingWorkerUrl",
    "networkError",
    "notFoundError",
    "noResponseError",
  ];
  const categoryKeys = Object.keys(englishUiText.categoryLabels);

  const translatedValues = await translateTexts(
    translatableKeys.map((key) => englishUiText[key]),
  );
  const translatedCategoryValues = await translateTexts(
    categoryKeys.map((key) => englishUiText.categoryLabels[key]),
  );

  const localizedUiText = {
    ...englishUiText,
    categoryLabels: {
      ...englishUiText.categoryLabels,
    },
  };

  translatableKeys.forEach((key, index) => {
    localizedUiText[key] = translatedValues[index];
  });

  categoryKeys.forEach((key, index) => {
    localizedUiText.categoryLabels[key] = translatedCategoryValues[index];
  });

  localizedUiText.assistantLanguageInstruction =
    getAssistantLanguageInstruction(browserLanguageCode);
  uiText = localizedUiText;
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
    return uiText.noProductsMatchBoth;
  }

  if (hasCategory) {
    return uiText.noProductsMatchCategory;
  }

  if (hasSearch) {
    return uiText.noProductsMatchSearch;
  }

  return uiText.noProductsPrompt;
}

/* Render the products that match the current filters */
async function renderFilteredProducts() {
  const products = await loadProducts();
  const filteredProducts = getFilteredProducts(products);
  const localizedProducts = await Promise.all(
    filteredProducts.map((product) => getLocalizedProduct(product)),
  );
  displayProducts(localizedProducts);
}

/* Send payloads to the worker and return the parsed JSON response */
async function sendWorkerRequest(payload) {
  const safeWorkerUrl = typeof WORKER_URL === "string" ? WORKER_URL.trim() : "";

  if (!safeWorkerUrl) {
    throw new Error(uiText.missingWorkerUrl);
  }

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
    throw new Error(uiText.networkError);
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
      throw new Error(uiText.notFoundError);
    }

    throw new Error(
      (typeof data === "string" && data.trim()) ||
        data?.error?.message ||
        data?.message ||
        `Worker request failed (status ${response.status}).`,
    );
  }

  return data;
}

/* Send a chat request to the worker and return the assistant reply */
async function sendChatRequest(messages) {
  const data = await sendWorkerRequest({ messages });

  const reply =
    data?.answer ||
    data?.output_text ||
    data?.choices?.[0]?.message?.content ||
    data?.message?.content ||
    data?.result ||
    data?.response ||
    (typeof data === "string" ? data : "");

  if (!reply) {
    throw new Error(uiText.noResponseError);
  }

  return {
    answer: reply,
    citations: Array.isArray(data?.citations) ? data.citations : [],
  };
}

/* Ask the worker to translate text into the browser's language */
async function sendTranslationRequest(texts) {
  const data = await sendWorkerRequest({
    task: "translate",
    targetLanguage: browserLanguageCode,
    texts,
  });

  const translations = Array.isArray(data?.translations)
    ? data.translations
    : [];

  if (translations.length !== texts.length) {
    return texts;
  }

  return translations.map((item, index) => String(item || texts[index]));
}

/* Ask OpenAI for a personalized routine using selected products */
async function generateRoutineFromSelectedProducts() {
  if (selectedProducts.length === 0) {
    appendChatMessage("assistant", uiText.noProductsSelectedMessage, {
      title: uiText.noProductsSelectedTitle,
    });
    return;
  }

  const productJson = getSelectedProductsContext();
  const userRequest =
    "Generate a personalized routine from my selected products.";

  appendUserMessage(userRequest);
  generateRoutineBtn.disabled = true;

  try {
    const routine = await sendChatRequest([
      ...buildConversationMessages(
        `Create a personalized skincare/beauty routine using only these selected products:\n\n${productJson}`,
      ),
    ]);

    typeIntoChatWindow(
      routine.answer,
      routine.citations,
      "Your Personalized Routine",
    );
    recordConversationTurn(
      `Create a personalized skincare/beauty routine using only these selected products:\n\n${productJson}`,
      routine.answer,
    );
  } catch (error) {
    appendChatMessage("assistant", `Something went wrong: ${error.message}`);
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
async function openDescriptionModal(product) {
  const localizedProduct = await getLocalizedProduct(product);
  previousFocusedElement = document.activeElement;
  descriptionModalTitle.textContent = `${localizedProduct.name} ${uiText.byText} ${localizedProduct.brand}`;
  descriptionModalImage.src = localizedProduct.image;
  descriptionModalImage.alt = localizedProduct.name;
  descriptionModalBody.textContent = localizedProduct.description;
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

  saveSelectedProducts();
  renderSelectedProducts();
}

/* Render selected products with remove buttons */
async function renderSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="selected-empty">${uiText.selectedEmpty}</p>
    `;
    updateSelectedProductsControls();
    return;
  }

  const localizedSelectedProducts = await Promise.all(
    selectedProducts.map((product) => getLocalizedProduct(product)),
  );

  selectedProductsList.innerHTML = localizedSelectedProducts
    .map((product) => {
      const productId = getProductId(product);

      return `
        <button
          type="button"
          class="selected-item"
          data-product-id="${productId}"
          aria-label="Remove ${escapeHtml(product.name)}"
        >
          ${escapeHtml(product.name)}
          <span class="remove-icon" aria-hidden="true">&times;</span>
        </button>
      `;
    })
    .join("");

  updateSelectedProductsControls();
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
      aria-label="Select ${escapeHtml(product.name)}"
    >
      <img src="${product.image}" alt="${escapeHtml(product.name)}">
      <div class="product-info">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.brand)}</p>
        <button
          type="button"
          class="description-toggle"
          data-product-id="${productId}"
          aria-haspopup="dialog"
          aria-label="View details for ${escapeHtml(product.name)}"
        >
          ${uiText.detailsButton}
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
      await openDescriptionModal(productToShow);
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

  saveSelectedProducts();
  renderSelectedProducts();

  /* Refresh visible cards so selected border is removed in grid */
  renderFilteredProducts();
});

if (clearSelectedProductsBtn) {
  clearSelectedProductsBtn.addEventListener("click", () => {
    selectedProducts = [];
    saveSelectedProducts();
    renderSelectedProducts();
    renderFilteredProducts();
  });
}

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
async function initializeApp() {
  selectedProducts = loadSelectedProducts();
  await localizeUiTextForBrowserLanguage();
  applyLanguageToPage();
  await renderSelectedProducts();
  await renderFilteredProducts();
}

initializeApp();

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

  const productJson = getSelectedProductsContext();
  appendUserMessage(question);
  sendBtn.disabled = true;

  try {
    const answer = await sendChatRequest([
      ...buildConversationMessages(
        `Selected products:\n${productJson}\n\nUser question: ${question}`,
      ),
    ]);

    typeIntoChatWindow(answer.answer, answer.citations);
    recordConversationTurn(
      `Selected products:\n${productJson}\n\nUser question: ${question}`,
      answer.answer,
    );
    userInput.value = "";
  } catch (error) {
    appendChatMessage("assistant", `Something went wrong: ${error.message}`);
  } finally {
    sendBtn.disabled = false;
  }
});
