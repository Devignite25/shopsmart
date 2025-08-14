/* Minimal JS: loads products.json, renders cards, enables search & filter, injects JSON-LD */
const grid = document.getElementById('productGrid');
const emptyState = document.getElementById('emptyState');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');

let PRODUCTS = [];
let ACTIVE = [];

async function loadProducts() {
  try {
    const res = await fetch('products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load products.json');
    PRODUCTS = await res.json();
    const cats = [...new Set(PRODUCTS.map(p => p.category))].sort();
    for (const c of cats) {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      categoryFilter.appendChild(opt);
    }
    ACTIVE = PRODUCTS;
    render();
    injectJsonLd(PRODUCTS);
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<div class="empty">Could not load products. Ensure products.json exists.</div>';
  }
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const filtered = PRODUCTS.filter(p => {
    const matchesCat = !cat || p.category === cat;
    const inText = [p.title, p.brand || '', p.description || '', ...(p.tags || [])]
      .join(' ').toLowerCase();
    const matchesQuery = !q || inText.includes(q);
    return matchesCat && matchesQuery;
  });

  grid.innerHTML = filtered.map(cardHtml).join('');
  emptyState.classList.toggle('hidden', filtered.length !== 0);
  ACTIVE = filtered;
}

function cardHtml(p) {
  const price = p.price ? `<span class="price">$${Number(p.price).toFixed(2)}</span>` : '';
  const verified = p.verified ? `<span class="badge">Verified pick</span>` : '';
  const pills = (p.tags || []).slice(0, 6).map(t => `<span class="pill">${t}</span>`).join('');
  return `
    <article class="card">
      <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">
      <div class="content">
        <div class="row space-between center">
          <h3 class="title">${escapeHtml(p.title)}</h3>
          ${verified}
        </div>
        <div class="meta">${escapeHtml(p.brand || p.category)}</div>
        <p>${escapeHtml(p.description || '')}</p>
        <div class="row space-between center">
          <div class="pills">${pills}</div>
          ${price}
        </div>
        <a class="btn" href="${p.url}" target="_blank" rel="nofollow noopener sponsored">Buy now</a>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function injectJsonLd(items) {
  document.querySelectorAll('script[data-jsonld="products"]').forEach(s => s.remove());
  items.slice(0, 20).forEach(p => {
    const data = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": p.title,
      "image": [p.image],
      "brand": p.brand || undefined,
      "description": p.description || undefined,
      "offers": p.price ? {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": String(p.price),
        "url": p.url,
        "availability": "https://schema.org/InStock"
      } : undefined
    };
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.dataset.jsonld = 'products';
    tag.textContent = JSON.stringify(data);
    document.head.appendChild(tag);
  });
}

searchInput.addEventListener('input', render);
categoryFilter.addEventListener('change', render);
document.addEventListener('DOMContentLoaded', loadProducts);
