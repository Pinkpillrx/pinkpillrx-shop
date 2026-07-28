let cart = JSON.parse(localStorage.getItem('pinkpillrx-cart') || '[]');
let currentMerchProduct = null;

document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  loadDigitalProducts();
  loadMerchProducts();
});

async function buyNow(product) {
  const btn = event.currentTarget;
  btn.disabled = true;
  btn.textContent = 'Loading...';

  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ ...product, quantity: 1 }], mode: 'direct' })
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('Something went wrong. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Buy Now';
    }
  } catch (err) {
    showToast('Connection error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Buy Now';
  }
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id && i.variantId === product.variantId);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(`${product.name} added to cart.`);
  closeModal();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function saveCart() {
  localStorage.setItem('pinkpillrx-cart', JSON.stringify(cart));
}

function updateCartUI() {
  const count = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  if (count > 0) {
    countEl.textContent = count;
    countEl.style.display = 'flex';
  } else {
    countEl.style.display = 'none';
  }
}

async function checkoutCart() {
  if (cart.length === 0) return;
  const btn = document.querySelector('#cart-footer .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Loading...';

  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, mode: 'cart' })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('Checkout failed. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Checkout';
    }
  } catch (err) {
    showToast('Connection error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Checkout';
  }
}

function openCart() {
  document.getElementById('cart-overlay').classList.add('active');
  document.getElementById('cart-drawer').classList.add('active');
  renderCartItems();
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('active');
  document.getElementById('cart-drawer').classList.remove('active');
  document.body.style.overflow = '';
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    footer.style.display = 'none';
    return;
  }
  footer.style.display = 'block';
  const total = cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
  document.getElementById('cart-total-price').textContent = `$${(total / 100).toFixed(2)}`;
  container.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-thumb">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover">` : '🛍️'}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.variantLabel ? `<div class="cart-item-variant">${item.variantLabel}</div>` : ''}
        <button class="cart-item-remove" onclick="removeFromCart(${idx})">Remove</button>
      </div>
      <div class="cart-item-price">$${(item.price / 100).toFixed(2)}</div>
    </div>
  `).join('');
}

function openVariantModal(product) {
  currentMerchProduct = product;
  const content = document.getElementById('modal-content');
  const sizes = [...new Set(product.variants.map(v => v.options?.size).filter(Boolean))];
  const colors = [...new Set(product.variants.map(v => v.options?.color).filter(Boolean))];

  let html = `
    <div class="modal-product-name">${product.name}</div>
    <div class="modal-product-price">$${(product.variants[0]?.price / 100 || 0).toFixed(2)}</div>
  `;

  if (sizes.length > 0) {
    html += `<div class="variant-label">Size</div>
    <div class="variant-options" id="size-options">
      ${sizes.map(s => `<button class="variant-btn" data-size="${s}" onclick="selectVariant('size', '${s}', this)">${s}</button>`).join('')}
    </div>`;
  }

  if (colors.length > 0) {
    html += `<div class="variant-label">Color</div>
    <div class="variant-options" id="color-options">
      ${colors.map(c => `<button class="variant-btn" data-color="${c}" onclick="selectVariant('color', '${c}', this)">${c}</button>`).join('')}
    </div>`;
  }

  html += `<button class="btn-primary btn-full" style="margin-top:16px" onclick="addSelectedToCart()">Add to Cart</button>`;
  content.innerHTML = html;

  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('variant-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function selectVariant(type, value, el) {
  const group = el.closest('.variant-options');
  group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

function addSelectedToCart() {
  if (!currentMerchProduct) return;
  const selectedSize = document.querySelector('#size-options .variant-btn.selected')?.dataset.size;
  const selectedColor = document.querySelector('#color-options .variant-btn.selected')?.dataset.color;
  const variant = currentMerchProduct.variants.find(v => {
    const sizeMatch = !selectedSize || v.options?.size === selectedSize;
    const colorMatch = !selectedColor || v.options?.color === selectedColor;
    return sizeMatch && colorMatch;
  });
  if (!variant) { showToast('Please select your options.'); return; }
  const variantLabel = [selectedSize, selectedColor].filter(Boolean).join(' / ');
  addToCart({
    id: currentMerchProduct.id,
    variantId: variant.id,
    name:
