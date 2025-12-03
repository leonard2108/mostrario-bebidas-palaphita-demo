console.log("App iniciado — Ren Master Edition");

/* ===========================================================
   ESTADO GLOBAL
   =========================================================== */
const state = {
    lang: localStorage.getItem("lang") || "pt",
    products: [],
    dict: {},
    t: (k) => k
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ===========================================================
   HASH DA SENHA — SUA SENHA: dc-21-08
   =========================================================== */
const ADMIN_HASH = "8ae080239c616ab3d2c399da3ae6550ccc78a83fb0f1c3eab08bfb41bf164e70";

async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

async function adminLogin() {
    const pwd = prompt("Senha de administrador:");
    if (!pwd) return false;
    return (await sha256(pwd)) === ADMIN_HASH;
}

/* ===========================================================
   POPUP PREMIUM DE IDIOMA (Bandeiras Redondas — iOS)
   =========================================================== */
function openLanguagePopup() {
    if ($("#lang-popup")) $("#lang-popup").remove();

    const modal = document.createElement("div");
    modal.id = "lang-popup";

    modal.innerHTML = `
        <div class="popup-card">
            <div class="close-popup">✖</div>
            <h2>Selecione seu idioma</h2>
            <div class="flag-grid"></div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".close-popup").onclick = () => modal.remove();

    const FLAGS = {
        pt: "https://flagcdn.com/w80/br.png",
        en: "https://flagcdn.com/w80/us.png",
        es: "https://flagcdn.com/w80/es.png",
        fr: "https://flagcdn.com/w80/fr.png",
        jp: "https://flagcdn.com/w80/jp.png",
        kr: "https://flagcdn.com/w80/kr.png",
        cn: "https://flagcdn.com/w80/cn.png",
        de: "https://flagcdn.com/w80/de.png",
        it: "https://flagcdn.com/w80/it.png",
        nl: "https://flagcdn.com/w80/nl.png",
        ru: "https://flagcdn.com/w80/ru.png",
        tr: "https://flagcdn.com/w80/tr.png",
        bg: "https://flagcdn.com/w80/bg.png",
        pl: "https://flagcdn.com/w80/pl.png",
        ar: "https://flagcdn.com/w80/ae.png" // Emirados — mais seguro
    };

    const grid = modal.querySelector(".flag-grid");

    Object.entries(FLAGS).forEach(([code, url]) => {
        const btn = document.createElement("button");
        btn.className = "flag-btn";

        btn.innerHTML = `
            <img src="${url}" class="flag-icon" alt="${code}">
            <span class="flag-label">${code.toUpperCase()}</span>
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

/* ===========================================================
   I18N — CARREGAMENTO DE IDIOMA
   =========================================================== */
async function loadI18n(lang) {
    try {
        const res = await fetch(`i18n/${lang}.json`);
        if (!res.ok) throw new Error();
        state.dict = await res.json();
        state.t = (k) => state.dict[k] || k;
        document.documentElement.lang = lang;
    } catch {
        if (lang !== "pt") return loadI18n("pt");
    }
}

function applyTranslation() {
    $$("[data-i18n]").forEach(el => {
        el.textContent = state.t(el.dataset.i18n);
    });

    $$("[data-i18n-placeholder]").forEach(el => {
        el.placeholder = state.t(el.dataset.i18nPlaceholder);
    });

    document.title = state.t("title");
}

/* ===========================================================
   PRODUTOS
   =========================================================== */
async function loadProducts() {
    try {
        const res = await fetch(`products-${state.lang}.json`);
        if (!res.ok) throw new Error();
        state.products = await res.json();
        renderProducts(state.products);
    } catch {
        if (state.lang !== "pt") {
            state.lang = "pt";
            return loadProducts();
        }
    }
}

function renderProducts(list) {
    const box = $("#products-container");
    box.innerHTML = "";

    list.forEach(p => {
        const img = (Array.isArray(p.images) && p.images.length)
            ? p.images[0]
            : p.image;

        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <div class="product-image-container">
                <img src="${img}" alt="${p.name}">
            </div>
            <div class="content">
                <h3>${p.name}</h3>
                <p class="desc">${p.description}</p>
            </div>
        `;

        box.appendChild(card);
    });
}

/* ===========================================================
   BUSCA
   =========================================================== */
$("#search").addEventListener("input", () => {
    const term = $("#search").value.toLowerCase();

    const filtered = state.products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );

    renderProducts(filtered);
});

/* ===========================================================
   PAINEL ADMIN SECRETO
   =========================================================== */
document.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
        const ok = await adminLogin();
        if (!ok) return alert("Senha incorreta!");

        const modal = $("#admin-bg-modal");
        modal.style.display = "flex";

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

    document.documentElement.style.setProperty(
        "--bg-image",
        url ? `url('${url}')` : "none"
    );

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

/* ===========================================================
   SELECTOR DE IDIOMA (TOPO)
   =========================================================== */
$("#language").addEventListener("change", async (e) => {
    const lang = e.target.value;

    state.lang = lang;
    localStorage.setItem("lang", lang);

    await loadI18n(lang);
    applyTranslation();
    loadProducts();
});

/* ===========================================================
   INICIALIZAÇÃO
   =========================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    openLanguagePopup();   // popup sempre ao entrar
    await loadI18n(state.lang);
    applyTranslation();
    loadProducts();
});
