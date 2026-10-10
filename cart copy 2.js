const LAQMA_ITEMS = {
  burger: { name: 'برغر لقمة', price: 20, extras: [{id:'cheese',name:'جبنة إضافية',price:3},{id:'sauce',name:'صوص إضافي',price:2}] },
  pizza: { name: 'بيتزا الجبنة', price: 25, extras: [{id:'olives',name:'زيتون',price:3},{id:'extra-cheese',name:'جبنة إضافية',price:5}] },
  fries: { name: 'بطاطا مقلية', price: 8, extras: [{id:'sauce',name:'صوص إضافي',price:2}] },
  shawarma: { name: 'شاورما دجاج', price: 18, extras: [{id:'cheese',name:'جبنة',price:3},{id:'garlic',name:'ثومية إضافية',price:2}] },
  orange: { name: 'عصير برتقال', price: 12, extras: [] },
  strawberry: { name: 'عصير فراولة', price: 14, extras: [] },
  soda: { name: 'مشروب غازي', price: 5, extras: [] },
  coffee: { name: 'قهوة تركية', price: 8, extras: [] },
  combo_burger: { name: 'كومبو برغر + بطاطا + مشروب', price: 29, extras: [], sizes: [{id:'regular',name:'عادي',price:0},{id:'large',name:'كبير',price:7}] },
  combo_shawarma: { name: 'كومبو شاورما + بطاطا + مشروب', price: 27, extras: [], sizes: [{id:'regular',name:'عادي',price:0},{id:'large',name:'كبير',price:6}] }
};
// اكتب رقم المطعم الحقيقي مع مفتاح الدولة، بدون علامة + أو مسافات.
const RESTAURANT_WHATSAPP = '';
const CART_KEY = 'laqma-cart-v1'; // نفس المفتاح القديم للحفاظ على السلة
const EXTRAS_KEY = 'laqma-extras-v2';
const DETAILS_KEY = 'laqma-details-v2';
const SIZES_KEY = 'laqma-sizes-v3';
const SIZE_OPTIONS = [{id:'regular',name:'عادي',price:0},{id:'large',name:'كبير',price:5}];

function readJSON(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback; }
  catch { return fallback; }
}
function readCart() { return readJSON(CART_KEY, {}); }
function readSizes() { return readJSON(SIZES_KEY, {}); }
function readExtras() { return readJSON(EXTRAS_KEY, {}); }
function readDetails() { return readJSON(DETAILS_KEY, {}); }
function rowsInCart() {
  return Object.entries(readCart()).filter(([id,qty]) => LAQMA_ITEMS[id] && Number.isInteger(qty) && qty > 0);
}
function selectedExtras(id) {
  const saved = readExtras()[id];
  const allowed = LAQMA_ITEMS[id]?.extras || [];
  return allowed.filter(extra => Array.isArray(saved) && saved.includes(extra.id));
}
function sizeOptions(id) { return LAQMA_ITEMS[id].sizes || (['burger','pizza','fries','shawarma','orange','strawberry','soda','coffee'].includes(id) ? SIZE_OPTIONS : []); }
function selectedSize(id) { const choices=sizeOptions(id); return choices.find(x=>x.id===readSizes()[id]) || choices[0] || {id:'regular',name:'عادي',price:0}; }
function itemUnitPrice(id) { return LAQMA_ITEMS[id].price + selectedSize(id).price + selectedExtras(id).reduce((sum,e)=>sum+e.price,0); }
function updateSize(id,value) { const saved=readSizes(); if(!sizeOptions(id).some(x=>x.id===value))return; saved[id]=value;localStorage.setItem(SIZES_KEY,JSON.stringify(saved));renderCart(); }
function removeItem(id) { const cart=readCart();delete cart[id];saveCart(cart); }
function totalPrice() { return rowsInCart().reduce((sum,[id,qty])=>sum+itemUnitPrice(id)*qty,0); }
function saveCart(cart) { localStorage.setItem(CART_KEY,JSON.stringify(cart)); renderCart(); }
function addToCart(id) {
  if (!LAQMA_ITEMS[id]) return;
  const cart = readCart();
  cart[id] = Math.min(99,(Number(cart[id]) || 0)+1);
  saveCart(cart);
  const status = document.getElementById('cart-status');
  if (status) status.textContent = `تمت إضافة ${LAQMA_ITEMS[id].name} إلى السلة`;
}
function changeQuantity(id,delta) {
  const cart=readCart();
  const next=Math.max(0,Math.min(99,(Number(cart[id])||0)+delta));
  if (!next) delete cart[id]; else cart[id]=next;
  saveCart(cart);
}
function updateExtra(id,extraId,checked) {
  const saved=readExtras();
  const chosen=new Set(Array.isArray(saved[id]) ? saved[id] : []);
  if (checked) chosen.add(extraId); else chosen.delete(extraId);
  saved[id]=[...chosen];
  localStorage.setItem(EXTRAS_KEY,JSON.stringify(saved));
  renderCart();
}
function make(tag,cls,content) {
  const el=document.createElement(tag);
  if (cls) el.className=cls;
  if (content !== undefined) el.textContent=content;
  return el;
}
function renderCart() {
  const rows=rowsInCart();
  const count=document.getElementById('cart-count');
  if (count) count.textContent=rows.reduce((sum,[,qty])=>sum+qty,0);
  const list=document.getElementById('cart-items');
  const total=document.getElementById('cart-total');
  if (!list || !total) return;
  list.replaceChildren();
  if (!rows.length) list.append(make('p','','السلة فاضية. اختار أصناف من المأكولات أو المشروبات.'));
  rows.forEach(([id,qty])=>{
    const item=LAQMA_ITEMS[id];
    const row=make('section','cart-row');
    const details=make('div','cart-item-details');
    details.append(make('strong','cart-item-name',item.name),make('p','cart-item-price',`${itemUnitPrice(id)} ₪ للوحدة`));
    if (sizeOptions(id).length) {
      const label=make('label','size-option','الحجم: ');
      const select=document.createElement('select');select.setAttribute('aria-label',`حجم ${item.name}`);
      sizeOptions(id).forEach(opt=>{const option=document.createElement('option');option.value=opt.id;option.textContent=`${opt.name}${opt.price?' (+'+opt.price+' ₪)':''}`;option.selected=selectedSize(id).id===opt.id;select.append(option);});
      select.addEventListener('change',()=>updateSize(id,select.value));label.append(select);details.append(label);
    }
    if (item.extras.length) {
      const extrasWrap=make('div','extras-wrap');
      extrasWrap.append(make('span','extras-title','إضافات (سعر الإضافة لكل قطعة):'));
      item.extras.forEach(extra=>{
        const label=make('label','extra-option');
        const input=document.createElement('input');
        input.type='checkbox';
        input.checked=selectedExtras(id).some(e=>e.id===extra.id);
        input.addEventListener('change',()=>updateExtra(id,extra.id,input.checked));
        label.append(input,document.createTextNode(` ${extra.name} (+${extra.price} ₪)`));
        extrasWrap.append(label);
      });
      details.append(extrasWrap);
    }
    const controls=make('div','qty-controls');
    const minus=make('button','','−'); minus.type='button'; minus.setAttribute('aria-label',`تقليل ${item.name}`);
    minus.addEventListener('click',()=>changeQuantity(id,-1));
    const plus=make('button','','+'); plus.type='button'; plus.setAttribute('aria-label',`زيادة ${item.name}`);
    plus.addEventListener('click',()=>changeQuantity(id,1));
    controls.append(minus,make('span','',String(qty)),plus);
    const side=make('div','cart-side');
    const remove=make('button','remove-cart-item','حذف الصنف');remove.type='button';remove.addEventListener('click',()=>removeItem(id));
    side.append(controls,make('strong','cart-line-total',`${itemUnitPrice(id)*qty} ₪`),remove);
    row.append(details,side);
    list.append(row);
  });
  total.textContent=`${totalPrice()} ₪`;
  const checkout=document.getElementById('checkout-button');
  if (checkout) checkout.disabled=!rows.length;
}
function saveDetails() {
  const fields=['customer-name','customer-phone','delivery-method','customer-address','order-notes'];
  const data={};
  fields.forEach(id=>{const el=document.getElementById(id);if(el)data[id]=el.value;});
  localStorage.setItem(DETAILS_KEY,JSON.stringify(data));
}
function updateAddressVisibility() {
  const wrap=document.getElementById('address-wrap');
  const address=document.getElementById('customer-address');
  const isDelivery=document.getElementById('delivery-method')?.value==='delivery';
  if(wrap)wrap.hidden=!isDelivery;
  if(address)address.required=isDelivery;
}
function checkoutWhatsApp() {
  const rows=rowsInCart();
  if(!rows.length)return;
  const name=document.getElementById('customer-name');
  const address=document.getElementById('customer-address');
  const method=document.getElementById('delivery-method');
  if(!name?.value.trim()){alert('اكتب اسم الزبون أولًا');name?.focus();return;}
  if(method?.value==='delivery' && !address?.value.trim()){alert('اكتب عنوان التوصيل');address?.focus();return;}
  if(!/^\d{8,15}$/.test(RESTAURANT_WHATSAPP)){
    alert('قبل إرسال الطلب، ضع رقم واتساب المطعم الحقيقي في ملف cart.js');return;
  }
  saveDetails();
  const lines=rows.map(([id,qty])=>{
    const extras=selectedExtras(id);
    const sizeText=sizeOptions(id).length?`\n   الحجم: ${selectedSize(id).name}`:'';
    const extraText=extras.length?`\n   إضافات: ${extras.map(e=>`${e.name} (+${e.price} ₪)`).join('، ')}`:'';
    return `• ${LAQMA_ITEMS[id].name} × ${qty} = ${itemUnitPrice(id)*qty} شيكل${sizeText}${extraText}`;
  });
  const phone=document.getElementById('customer-phone')?.value.trim() || 'غير مذكور';
  const notes=document.getElementById('order-notes')?.value.trim() || 'لا يوجد';
  const delivery=method?.value==='delivery';
  const message=`مرحبًا، بدي أطلب من مطعم لقمة:\n\n${lines.join('\n')}\n\nالمجموع: ${totalPrice()} شيكل\n\nالاسم: ${name.value.trim()}\nالهاتف: ${phone}\nطريقة الاستلام: ${delivery?'توصيل':'استلام من المطعم'}${delivery?`\nالعنوان: ${address.value.trim()}`:''}\nملاحظات: ${notes}\n\nيرجى تأكيد الطلب والتكلفة النهائية.`;
  window.open(`https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-add-to-cart]').forEach(button=>button.addEventListener('click',()=>addToCart(button.dataset.addToCart)));
  const saved=readDetails();
  ['customer-name','customer-phone','delivery-method','customer-address','order-notes'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    if(typeof saved[id]==='string')el.value=saved[id];
    el.addEventListener('input',saveDetails);
    el.addEventListener('change',saveDetails);
  });
  document.getElementById('delivery-method')?.addEventListener('change',updateAddressVisibility);
  updateAddressVisibility();
  document.getElementById('checkout-button')?.addEventListener('click',checkoutWhatsApp);
  renderCart();
});
