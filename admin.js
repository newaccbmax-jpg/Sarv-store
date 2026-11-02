'use strict';
(function(){
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  let adminKey = '';
  const statuses = {
    new:'جدید', processing:'در حال آماده‌سازی', shipped:'ارسال‌شده',
    delivered:'تحویل‌شده', cancelled:'لغوشده'
  };
  function escapeHTML(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  async function api(path, options={}){
    const response = await fetch(path, {
      ...options,
      headers:{'Content-Type':'application/json','x-admin-key':adminKey,...(options.headers||{})}
    });
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error || 'درخواست انجام نشد.');
    return data;
  }
  function message(id, text, error=false){
    const el = $('#'+id); el.textContent = text; el.classList.toggle('error',error);
  }
  function showDashboard(){
    $('#loginPanel').classList.add('hidden');
    $('#dashboard').classList.remove('hidden');
    loadAll();
  }
  async function loadAll(){
    try{
      const [orderData, productData] = await Promise.all([api('/api/admin/orders'), api('/api/admin/products')]);
      renderOrders(orderData.orders || []);
      renderProducts(productData.products || []);
    }catch(error){ message('loginMsg',error.message,true); }
  }
  function renderOrders(orders){
    $('#orderCount').textContent = orders.length+' سفارش';
    if(!orders.length){ $('#ordersList').innerHTML='<div class="empty">هنوز سفارشی ثبت نشده است.</div>'; return; }
    $('#ordersList').innerHTML = orders.map(order => `
      <article class="order">
        <div class="orderhead"><b class="num">${escapeHTML(order.orderNumber)}</b><span class="small">${escapeHTML(order.createdAt)}</span></div>
        <h3>${escapeHTML(order.customerName)}</h3>
        <div class="details">${escapeHTML(order.phone)} · ${escapeHTML(order.city)}<br>${escapeHTML(order.address)}</div>
        <div class="items">${(order.items||[]).map(item => `<div>${escapeHTML(item.name)} — ${escapeHTML(item.size)} / ${escapeHTML(item.color)} × ${escapeHTML(item.qty)} · ${Number(item.lineTotal).toLocaleString('fa-IR')} تومان</div>`).join('')}</div>
        <div class="row"><span class="small">مبلغ نهایی</span><b>${Number(order.total).toLocaleString('fa-IR')} تومان</b></div>
        <div class="statusrow"><select data-status-for="${escapeHTML(order.orderNumber)}">${Object.entries(statuses).map(([value,label])=>`<option value="${value}" ${order.status===value?'selected':''}>${label}</option>`).join('')}</select><button class="secondary" data-save-status="${escapeHTML(order.orderNumber)}">ذخیره وضعیت</button></div>
      </article>`).join('');
  }
  function renderProducts(products){
    $('#productCount').textContent = products.length+' محصول';
    if(!products.length){ $('#productsList').innerHTML='<div class="empty">محصولی ثبت نشده است.</div>'; return; }
    $('#productsList').innerHTML=products.map(p=>`
      <article class="product"><div class="productrow">
        <div><div class="productname">${escapeHTML(p.name)}</div><div class="productmeta">${escapeHTML(p.cat)} · شناسه ${p.id}</div></div>
        <label>قیمت (تومان)<input type="number" min="0" step="1000" data-price-for="${p.id}" value="${p.price}"></label>
        <div class="row"><button class="secondary" data-save-price="${p.id}">ذخیره قیمت</button><button class="danger" data-delete-product="${p.id}">حذف</button></div>
      </div></article>`).join('');
  }
  $('#loginForm').addEventListener('submit', async event=>{
    event.preventDefault();
    adminKey=$('#adminKey').value.trim();
    try{
      await api('/api/admin/orders');
      showDashboard(); message('loginMsg','');
    }catch(error){ adminKey=''; message('loginMsg',error.message,true); }
  });
  $('#refreshBtn').addEventListener('click',loadAll);
  $$('.tabs [data-tab]').forEach(button=>button.addEventListener('click',()=>{
    $$('.tabs button').forEach(b=>b.classList.toggle('active',b===button));
    $$('.tab').forEach(tab=>tab.classList.toggle('active',tab.id==='tab-'+button.dataset.tab));
  }));
  document.addEventListener('click',async event=>{
    const statusButton=event.target.closest('[data-save-status]');
    const priceButton=event.target.closest('[data-save-price]');
    const deleteButton=event.target.closest('[data-delete-product]');
    if(statusButton){
      const number=statusButton.dataset.saveStatus;
      const status=$(`[data-status-for="${number}"]`).value;
      statusButton.disabled=true;
      try{ await api('/api/admin/orders/'+encodeURIComponent(number),{method:'PATCH',body:JSON.stringify({status})}); statusButton.textContent='ذخیره شد'; }
      catch(error){ alert(error.message); statusButton.disabled=false; }
    }
    if(priceButton){
      const id=priceButton.dataset.savePrice;
      const price=Number($(`[data-price-for="${id}"]`).value);
      priceButton.disabled=true;
      try{ await api('/api/admin/products/'+id,{method:'PATCH',body:JSON.stringify({price})}); priceButton.textContent='ذخیره شد'; }
      catch(error){ alert(error.message); priceButton.disabled=false; }
    }
    if(deleteButton){
      const id=deleteButton.dataset.deleteProduct;
      if(!confirm('این محصول حذف شود؟')) return;
      try{ await api('/api/admin/products/'+id,{method:'DELETE'}); await loadAll(); }
      catch(error){ alert(error.message); }
    }
  });
  $('#productForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    const parseColors=String(form.get('colors')).split(',').map(entry=>{
      const parts=entry.trim().split(':'); return {n:(parts[0]||'').trim(),h:(parts[1]||'').trim()};
    });
    const payload={
      name:form.get('name'),cat:form.get('cat'),price:Number(form.get('price')),
      old:form.get('old') || null,tag:form.get('tag'),icon:form.get('icon'),tone:Number(form.get('tone')),
      sizes:String(form.get('sizes')).split(',').map(x=>x.trim()).filter(Boolean),
      colors:parseColors,desc:form.get('desc')
    };
    try{
      await api('/api/admin/products',{method:'POST',body:JSON.stringify(payload)});
      formElement.reset();
      message('productMsg','محصول با موفقیت ذخیره شد.');
      await loadAll();
    }catch(error){message('productMsg',error.message,true);}
  });
})();
