const LAQMA_ITEMS = {
  burger: { name: 'برغر لقمة', price: 20 },
  pizza: { name: 'بيتزا الجبنة', price: 25 },
  fries: { name: 'بطاطا مقلية', price: 8 },
  shawarma: { name: 'شاورما دجاج', price: 18 },
  orange: { name: 'عصير برتقال', price: 12 },
  strawberry: { name: 'عصير فراولة', price: 14 },
  soda: { name: 'مشروب غازي', price: 5 },
  coffee: { name: 'قهوة تركية', price: 8 }
};

// غيّر الرقم إلى رقم المطعم الحقيقي قبل النشر (بدون +).
const RESTAURANT_WHATSAPP = '0592405995';
const CART_KEY = 'laqma-cart-v1';

function readCart() {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function addToCart(id) {
  if (!LAQMA_ITEMS[id]) return;
  const cart = readCart();
  cart[id] = Math.min(99, (Number(cart[id]) || 0) + 1);
  saveCart(cart);
  const status = document.getElementById('cart-status');
  if (status) status.textContent = `تمت إضافة ${LAQMA_ITEMS[id].name} إلى السلة`;
}

function changeQuantity(id, delta) {
  const cart = readCart();
  if (!LAQMA_ITEMS[id]) return;
  const next = Math.max(0, Math.min(99, (Number(cart[id]) || 0) + delta));
  if (next === 0) delete cart[id];
  else cart[id] = next;
  saveCart(cart);
}

function renderCart() {
  const cart = readCart();
  const rows = Object.entries(cart).filter(([id, qty]) => LAQMA_ITEMS[id] && Number.isInteger(qty) && qty > 0);
  const count = rows.reduce((sum, [, qty]) => sum + qty, 0);
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = count;

  const list = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!list || !totalEl) return;
  list.replaceChildren();
  let total = 0;
  if (!rows.length) {
    const empty = document.createElement('p');
    empty.textContent = 'السلة فاضية حاليًا. اختار أصناف من المنيو.';
    list.append(empty);
  }
  rows.forEach(([id, qty]) => {
    const item = LAQMA_ITEMS[id];
    total += item.price * qty;
    const row = document.createElement('div');
    row.className = 'cart-row';
    const name = document.createElement('span');
    name.textContent = `${item.name} — ${item.price * qty} ₪`;
    const controls = document.createElement('div');
    controls.className = 'qty-controls';
    const minus = document.createElement('button');
    minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `تقليل ${item.name}`);
    minus.addEventListener('click', () => changeQuantity(id, -1));
    const amount = document.createElement('span');
    amount.textContent = qty;
    const plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `زيادة ${item.name}`);
    plus.addEventListener('click', () => changeQuantity(id, 1));
    controls.append(minus, amount, plus);
    row.append(name, controls);
    list.append(row);
  });
  totalEl.textContent = `${total} ₪`;
  const checkout = document.getElementById('checkout-button');
  if (checkout) checkout.disabled = rows.length === 0;
}

function checkoutWhatsApp() {
  const rows = Object.entries(readCart()).filter(([id, qty]) => LAQMA_ITEMS[id] && Number.isInteger(qty) && qty > 0);
  if (!rows.length) return;
  if (!/^\d{8,15}$/.test(RESTAURANT_WHATSAPP)) {
    alert('قبل إرسال الطلب، ضع رقم واتساب المطعم الحقيقي في ملف cart.js');
    return;
  }
  const total = rows.reduce((sum, [id, qty]) => sum + LAQMA_ITEMS[id].price * qty, 0);
  const lines = rows.map(([id, qty]) => `• ${LAQMA_ITEMS[id].name} × ${qty} = ${LAQMA_ITEMS[id].price * qty} شيكل`);
  const message = `مرحبًا، بدي أطلب من مطعم لقمة:\n${lines.join('\n')}\n\nالمجموع: ${total} شيكل`;
  window.open(`https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-add-to-cart]').forEach(button => {
    button.addEventListener('click', () => addToCart(button.dataset.addToCart));
  });
  const checkout = document.getElementById('checkout-button');
  if (checkout) checkout.addEventListener('click', checkoutWhatsApp);
  renderCart();
});
