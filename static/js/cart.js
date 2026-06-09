// ═══════════════════════════════════════
//  AgroShop — Cart Manager (prix en DA)
// ═══════════════════════════════════════

const CART_KEY = 'agroshop_cart';

function formatDA(price) {
  return Math.round(price).toLocaleString('fr-DZ') + ' DA';
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
  updateCartBadge();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  renderCart();
  updateCartBadge();
}

function addToCart(id, name, price, image) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }
  saveCart(cart);
  showToast(`${name} ajouté au panier !`, 'success');
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

function updateQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    saveCart(cart);
  }
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="fa fa-shopping-basket"></i>
        <p>Votre panier est vide</p>
        <a href="/products" onclick="toggleCart()">Commencer les achats</a>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  let subtotal = 0;
  container.innerHTML = cart.map(item => {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;
    return `
      <div class="cart-item">
        <img src="${item.image || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=60&q=80'}" alt="${item.name}">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span>${formatDA(item.price)} / unité</span>
          <div class="cart-item-controls">
            <button onclick="updateQty(${item.id}, -1)"><i class="fa fa-minus"></i></button>
            <span>${item.qty}</span>
            <button onclick="updateQty(${item.id}, 1)"><i class="fa fa-plus"></i></button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span class="cart-item-price">${formatDA(lineTotal)}</span>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><i class="fa fa-trash"></i></button>
        </div>
      </div>`;
  }).join('');

  if (footer) footer.style.display = 'block';
  if (totalEl) totalEl.textContent = formatDA(subtotal);
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
  document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

// Init on page load
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  updateCartBadge();
});
