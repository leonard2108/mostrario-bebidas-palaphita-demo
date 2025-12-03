console.log("App started");

// Estado global
const state = {
    lang: localStorage.getItem("lang") || null,
    products: [],
    dict: {},
    t: (k) => k
};

// =============================================
// HELPERS
// =============================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];


// =============================================
// SHA-256 + AUTENTICAÇÃO ADMIN
// =============================================
async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

const ADMIN_HASH = "7f7c6f7425c1a94031aede12dcdeec8f5eae78e2af3d54d28a303ceabbe35258";

async function adminLogin() {
    const pwd = prompt("Senha de administrador:");
    if (!pwd) return false;
    const hash = await sha256(pwd);
    return hash === ADMIN_HASH;
}


// =============================================
// POPUP DE IDIOMA (ABRE SEMPRE)
// =============================================
function showLanguagePopup() {
    const modal = document.createElement("div");
    modal.id = "lang-popup";
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,.5); display: flex;
        justify-content: center; align-items: center;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="
            background: white; padding: 20px;
            border-radius: 12px; width: 90%; max-width: 480px;
            text-align: center;
        ">
            <h2>Selecione seu idioma</h2>
            <div id="popup-lang-grid" style="
                display: grid; grid-template-columns: repeat(3,1fr);
                margin-top: 18px; gap: 10px;
            ">
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const langs = [
        ["pt","PT"],["en","EN"],["es","ES"],["fr","FR"],["jp","日本語"],["kr","한국어"],
        ["cn","中文"],["de","DE"],["it","IT"],["nl","NL"],["ru","RU"],
        ["tr","TR"],["bg","BG"],["pl","PL"],["ar","AR"]
    ];

    const grid = $("#popup-lang-grid");

    langs.forEach(([code, label]) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.style.cssText = `
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #ccc;
            cursor: pointer;
            background: #f2f2f2;
        `;
        btn.onclick = async () => {
            state.lang = code;
            localStorage.setItem("lang", code);

            await loadI18n(code);
            applyTranslation();
            loadProducts();

            modal.remove();
        };
        grid.appendChild(btn);
    });
}


// =============================================
// I18N
// =============================================
async function loadI18n(lang) {
    try {
        const res = await fetch(`i18n/${lang}.json`);
        if (!res.ok) throw new Error("not found");
        state.dict = await res.json();
        state.t = (k) => state.dict[k] || k;
        document.documentElement.lang = lang;
    } catch (e) {
        if (lang !== "pt") return loadI18n("pt");
    }
}

function applyTranslation() {
    $$("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        el.textContent = state.t(key);
    });

    $$("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        el.placeholder = state.t(key);
    });

    document.title = state.t("title") || "Catálogo de Produtos";
}


// =============================================
// PRODUTOS
// =============================================
async function loadProducts() {
    try {
        const file = `products-${state.lang}.json`;
        const res = await fetch(file);
        if (!res.ok) throw new Error(res.status);

        state.products = await res.json();
        renderProducts(state.products);
    } catch (e) {
        if (state.lang !== "pt") {
            state.lang = "pt";
            return loadProducts();
        }
    }
}

function renderProducts(products) {
    const container = $("#products-container");
    container.innerHTML = "";

    products.forEach(p => {
        const currentImg =
            Array.isArray(p.images) && p.images.length > 0
                ? p.images[p.currentImageIndex || 0]
                : p.image || "";

        const card = document.createElement("div");
        card.className = "product-card";
        card.dataset.productId = p.id;

        card.innerHTML = `
            <div class="product-image-container">
                <img src="${currentImg}" alt="${p.name}">
            </div>

            <div class="content">
                <h3>${p.name}</h3>
                <p class="desc">${p.description}</p>
            </div>
        `;
        container.appendChild(card);
    });
}


// =============================================
// BUSCA
// =============================================
$("#search").addEventListener("input", () => {
    const s = $("#search").value.toLowerCase();
    const result = state.products.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s)
    );
    renderProducts(result);
});


// =============================================
// PAINEL SECRETO – CTRL + ALT + A
// =============================================
document.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
        const ok = await adminLogin();
        if (!ok) return alert("Senha incorreta!");

        $("#admin-bg-modal").style.display = "flex";

        // carregar config
        $("#admin-bg-url").value = localStorage.getItem("bg-url") || "";
        $("#admin-bg-fit").value = localStorage.getItem("bg-fit") || "cover";
        $("#admin-bg-position").value = localStorage.getItem("bg-position") || "center center";
        $("#admin-bg-opacity").value = localStorage.getItem("bg-opacity") || "0.15";
    }
});

$("#admin-bg-cancel").onclick = () => {
    $("#admin-bg-modal").style.display = "none";
};

$("#admin-bg-save").onclick = () => {
    const url = $("#admin-bg-url").value.trim();
    const fit = $("#admin-bg-fit").value;
    const pos = $("#admin-bg-position").value.trim();
    const op = $("#admin-bg-opacity").value;

    if (url) document.documentElement.style.setProperty("--bg-image", `url('${url}')`);
    else document.documentElement.style.setProperty("--bg-image", "none");

    document.documentElement.style.setProperty("--bg-fit", fit);
    document.documentElement.style.setProperty("--bg-position", pos);
    document.documentElement.style.setProperty("--bg-opacity", op);

    localStorage.setItem("bg-url", url);
    localStorage.setItem("bg-fit", fit);
    localStorage.setItem("bg-position", pos);
    localStorage.setItem("bg-opacity", op);

    alert("Configurações salvas!");
    $("#admin-bg-modal").style.display = "none";
};


// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener("DOMContentLoaded", async () => {
    showLanguagePopup(); // popup automático

    const lang = state.lang || "pt";
    await loadI18n(lang);
    applyTranslation();
    loadProducts();
});
