(function(){
'use strict';
document.documentElement.lang='fa';
document.documentElement.dir='rtl';

/* برای استفاده‌ی واقعی: آدرس عکس هر کادر را اینجا بنویسید. مثال: 'hero-main': 'img/hero.jpg' */
var PHOTOS = {};

var FREE_SHIP = 3000000, SHIP_FEE = 120000, CODE = {name:'SARV10', pct:10};
var DIG = '۰۱۲۳۴۵۶۷۸۹';
function fd(s){ return String(s).replace(/\d/g, function(d){ return DIG[d]; }); }
function fa(n){ return fd(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'٬')); }
function toman(n){ return fa(n)+' تومان'; }
function plain(s){ return String(s).replace(/[۰-۹]/g,function(d){return DIG.indexOf(d);}); }
function norm(s){ return String(s).toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[‌\s]+/g,''); }
function $(s,r){ return (r||document).querySelector(s); }
function $$(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
async function apiRequest(path, options){
  var response;
  try{ response = await fetch(path, options || {}); }
  catch(error){ throw new Error('به سرور وصل نشدیم. پروژه را با دستور npm run dev اجرا کنید.'); }
  var data = {};
  try{ data = await response.json(); }catch(error){}
  if(!response.ok) throw new Error(data.error || 'درخواست با خطا روبه‌رو شد.');
  return data;
}

var C = {
  ink:{n:'مشکی',h:'#1B1F22'}, navy:{n:'سرمه‌ای',h:'#223357'}, olive:{n:'زیتونی',h:'#6B7048'},
  sand:{n:'شنی',h:'#CDBB98'}, white:{n:'سفید',h:'#F4F2EC'}, blue:{n:'آبی',h:'#5E86B3'},
  rust:{n:'آجری',h:'#A5502F'}, grey:{n:'طوسی',h:'#8A9095'}, wine:{n:'شرابی',h:'#6D2B3A'}, camel:{n:'کاملی',h:'#B58450'}
};
var SZ = ['S','M','L','XL'], KID = ['۲ سال','۴ سال','۶ سال','۸ سال'], ONE = ['تک‌سایز'];

var PRODUCTS = [
  {id:1, name:'پیراهن کتان مردانه', cat:'مردانه', icon:'shirt', tone:1, price:980000, sizes:SZ, colors:[C.white,C.blue,C.sand], desc:'کتان نرم با برش راسته. برای محل کار و بیرون رفتن.'},
  {id:2, name:'شلوار جین راسته', cat:'مردانه', icon:'trousers', tone:3, price:1450000, old:1750000, tag:'تخفیف', sizes:SZ, colors:[C.navy,C.ink,C.grey], desc:'جین ضخیم با قد راسته و کمر استاندارد.'},
  {id:3, name:'کاپشن پافر سبک', cat:'مردانه', icon:'jacket', tone:2, price:3200000, sizes:SZ, colors:[C.olive,C.ink,C.navy], desc:'سبک و گرم، با جیب‌های زیپ‌دار برای روزهای سرد.'},
  {id:4, name:'تی‌شرت نخی ساده', cat:'مردانه', icon:'shirt', tone:4, price:420000, tag:'جدید', sizes:SZ, colors:[C.white,C.ink,C.rust,C.olive], desc:'نخ پنبه‌ای با یقه‌ی گرد، مناسب زیرپوشی و تکی.'},
  {id:5, name:'مانتو کتان بلند', cat:'زنانه', icon:'coat', tone:2, price:1900000, tag:'جدید', sizes:SZ, colors:[C.sand,C.ink,C.olive], desc:'قد بلند با چاک کناری و جیب. بدون چروک‌افتادگی زیاد.'},
  {id:6, name:'پیراهن دامن‌دار', cat:'زنانه', icon:'dress', tone:4, price:1680000, sizes:SZ, colors:[C.wine,C.navy,C.camel], desc:'دامن گشاد تا زیر زانو، با کمربند پارچه‌ای.'},
  {id:7, name:'شلوار پارچه‌ای زنانه', cat:'زنانه', icon:'trousers', tone:1, price:1310000, old:1600000, tag:'تخفیف', sizes:SZ, colors:[C.ink,C.camel,C.grey], desc:'پارچه‌ی روان با کمر کش‌دار و پاچه‌ی راسته.'},
  {id:8, name:'پالتو پشمی', cat:'زنانه', icon:'coat', tone:3, price:4800000, sizes:SZ, colors:[C.camel,C.grey,C.ink], desc:'پشم گرم با آستر نرم و دکمه‌های مخفی.'},
  {id:9, name:'ست پسرانه', cat:'بچگانه', icon:'shirt', tone:3, price:780000, sizes:KID, colors:[C.blue,C.olive], desc:'تی‌شرت و شلوار نخی برای بازی و مدرسه.'},
  {id:10, name:'سرهمی نوزادی', cat:'بچگانه', icon:'dress', tone:4, price:540000, tag:'جدید', sizes:['۳ ماه','۶ ماه','۹ ماه','۱۲ ماه'], colors:[C.white,C.sand], desc:'نخ نرم با دکمه‌های کشویی برای تعویض راحت.'},
  {id:11, name:'شال نخی', cat:'اکسسوری', icon:'scarf', tone:1, price:360000, sizes:ONE, colors:[C.rust,C.navy,C.sand,C.grey], desc:'سبک و بزرگ، مناسب روی مانتو و پالتو.'},
  {id:12, name:'کیف دوشی چرمی', cat:'اکسسوری', icon:'bag', tone:2, price:2100000, sizes:ONE, colors:[C.camel,C.ink], desc:'چرم طبیعی با بند قابل تنظیم و دو بخش داخلی.'}
];
var CATS = ['همه','زنانه','مردانه','بچگانه','اکسسوری'];
function P(id){ for(var i=0;i<PRODUCTS.length;i++) if(PRODUCTS[i].id===id) return PRODUCTS[i]; }

/* state */
var S = {cart:[], wish:[], code:false};
try{
  var raw = JSON.parse(localStorage.getItem('sarv-store-v1')||'null');
  if(raw && Array.isArray(raw.cart) && Array.isArray(raw.wish)){
    S.cart = raw.cart.filter(function(l){ return P(l.id) && l.qty>0; });
    S.wish = raw.wish.filter(function(id){ return P(id); });
    S.code = !!raw.code;
  }
}catch(e){}
function save(){ try{ localStorage.setItem('sarv-store-v1', JSON.stringify(S)); }catch(e){} }
var F = {cat:'همه', q:'', sort:'pop', wish:false, sale:false};
var photos = {};   // photos chosen in the "جایگذاری عکس‌ها" mode (this tab only)
var view = 'cart', codeErr = '', order = '';

/* photo slots */
function paintSlot(el){
  var key = el.getAttribute('data-slot'), src = photos[key] || PHOTOS[key];
  if(src){ el.innerHTML = '<img src="'+src+'" alt="'+(el.getAttribute('data-alt')||'')+'" loading="lazy">'; }
  else { el.innerHTML = '<span class="ph"><svg aria-hidden="true"><use href="#g-'+el.getAttribute('data-icon')+'"/></svg><span>جای عکس محصول</span></span>'; }
}
function paintSlots(root){ $$('[data-slot]', root).forEach(paintSlot); }
function slotHTML(key, icon, tone, alt){ return '<span class="slot tone'+tone+'" data-slot="'+key+'" data-icon="'+icon+'" data-alt="'+alt+'"></span>'; }

/* tiles + chips */
function count(cat){ return PRODUCTS.filter(function(p){ return cat==='همه'||p.cat===cat; }).length; }
function renderTiles(){
  var meta = {'زنانه':['coat',2],'مردانه':['shirt',1],'بچگانه':['dress',4],'اکسسوری':['bag',3]};
  $('#tiles').innerHTML = ['زنانه','مردانه','بچگانه','اکسسوری'].map(function(c){
    return '<button type="button" class="tile" data-act="nav" data-cat="'+c+'">'+slotHTML('tile-'+c, meta[c][0], meta[c][1], 'دسته‌ی '+c)+
      '<span class="lbl"><b>'+c+'</b><span>'+fa(count(c))+' محصول</span></span></button>';
  }).join('');
  paintSlots($('#tiles'));
}
function renderChips(){
  var h = CATS.map(function(c){
    return '<button type="button" class="chip" data-act="cat" data-cat="'+c+'" aria-pressed="'+(!F.wish&&!F.sale&&F.cat===c)+'">'+c+' <small>'+fa(count(c))+'</small></button>';
  }).join('');
  h += '<button type="button" class="chip" data-act="cat" data-cat="تخفیف" aria-pressed="'+F.sale+'">تخفیف‌ها <small>'+fa(PRODUCTS.filter(function(p){return p.old;}).length)+'</small></button>';
  h += '<button type="button" class="chip" data-act="cat" data-cat="علاقه" aria-pressed="'+F.wish+'">علاقه‌مندی‌ها <small>'+fa(S.wish.length)+'</small></button>';
  $('#chips').innerHTML = h;
}

/* grid */
function list(){
  var a = PRODUCTS.filter(function(p){
    return (F.cat==='همه'||p.cat===F.cat) && (!F.wish||S.wish.indexOf(p.id)>-1) && (!F.sale||p.old) && (!F.q||norm(p.name+p.cat).indexOf(norm(F.q))>-1);
  });
  if(F.sort==='low') a.sort(function(x,y){return x.price-y.price;});
  if(F.sort==='high') a.sort(function(x,y){return y.price-x.price;});
  return a;
}
function card(p){
  var w = S.wish.indexOf(p.id)>-1;
  return '<article class="card"><div class="media">'+
    '<button type="button" class="open" data-act="open" data-id="'+p.id+'" aria-label="مشاهده‌ی '+p.name+'">'+slotHTML('p-'+p.id,p.icon,p.tone,p.name)+'</button>'+
    (p.tag?'<span class="tag'+(p.tag==='تخفیف'?' sale':'')+'">'+p.tag+'</span>':'')+
    '<button type="button" class="heart'+(w?' on':'')+'" data-act="wish" data-id="'+p.id+'" aria-pressed="'+w+'" aria-label="افزودن '+p.name+' به علاقه‌مندی‌ها"><svg class="ic"><use href="#i-heart"/></svg></button>'+
    '</div><div class="info"><button type="button" class="name" data-act="open" data-id="'+p.id+'">'+p.name+'</button><span class="cat">'+p.cat+'</span>'+
    '<div class="price"><span>'+toman(p.price)+'</span>'+(p.old?'<s>'+fa(p.old)+'</s>':'')+'</div>'+
    '<div class="dots" aria-hidden="true">'+p.colors.map(function(c){return '<i style="background:'+c.h+'"></i>';}).join('')+'</div></div></article>';
}
function renderGrid(){
  var a = list(), g = $('#grid');
  g.innerHTML = a.length ? a.map(card).join('') :
    '<div class="empty"><p>محصولی با این فیلتر پیدا نشد.</p><button type="button" class="btn ghost" data-act="reset">پاک کردن فیلترها</button></div>';
  paintSlots(g);
  $('#count').textContent = fa(a.length)+' محصول';
  renderChips();
}

/* overlays */
var active = null, lastFocus = null, scrim = $('#scrim');
function openOv(el){
  if(active) closeOv(true);
  lastFocus = document.activeElement; active = el;
  el.classList.add('open'); scrim.classList.add('open');
  document.documentElement.style.overflow = 'hidden';
  var f = el.querySelector('[data-first]') || el;
  setTimeout(function(){ f.focus(); }, 40);
}
function closeOv(silent){
  if(!active) return;
  active.classList.remove('open'); scrim.classList.remove('open');
  document.documentElement.style.overflow = '';
  active = null;
  if(!silent && lastFocus && lastFocus.focus) lastFocus.focus();
}
document.addEventListener('keydown', function(e){
  if(!active) return;
  if(e.key==='Escape'){ closeOv(); return; }
  if(e.key==='Tab'){
    var f = $$('button,[href],input,select,textarea', active).filter(function(n){ return !n.disabled && n.offsetParent!==null; });
    if(!f.length) return;
    var first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
});
var toastT;
function toast(t){ var el=$('#toast'); el.textContent=t; el.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(function(){ el.classList.remove('show'); }, 2400); }

/* quick view */
var Q = null;
function renderQV(fk){
  var p = P(Q.id), qv = $('#qv');
  qv.innerHTML = '<div class="qv"><button type="button" class="x" data-act="close" data-first aria-label="بستن"><svg class="ic"><use href="#i-close"/></svg></button>'+
    slotHTML('p-'+p.id,p.icon,p.tone,p.name)+
    '<div class="qv-i"><div><h2 id="qvT">'+p.name+'</h2><p>'+p.cat+'</p></div>'+
    '<div class="price"><span>'+toman(p.price)+'</span>'+(p.old?'<s>'+fa(p.old)+'</s>':'')+'</div><p>'+p.desc+'</p>'+
    '<div class="opt"><b>رنگ: <span>'+p.colors[Q.color].n+'</span></b><div class="pick sw">'+p.colors.map(function(c,i){
      return '<button type="button" data-act="qv-color" data-i="'+i+'" data-k="c'+i+'" aria-pressed="'+(Q.color===i)+'" aria-label="'+c.n+'"><i style="background:'+c.h+'"></i></button>';}).join('')+'</div></div>'+
    '<div class="opt"><b>سایز: <span>'+p.sizes[Q.size]+'</span></b><div class="pick">'+p.sizes.map(function(s,i){
      return '<button type="button" data-act="qv-size" data-i="'+i+'" data-k="s'+i+'" aria-pressed="'+(Q.size===i)+'">'+s+'</button>';}).join('')+'</div></div>'+
    '<div class="qv-act"><div class="step"><button type="button" data-act="qv-dec" data-k="dec" aria-label="کم کردن"><svg class="ic"><use href="#i-minus"/></svg></button><output aria-live="polite">'+fa(Q.qty)+'</output><button type="button" data-act="qv-inc" data-k="inc" aria-label="زیاد کردن"><svg class="ic"><use href="#i-plus"/></svg></button></div>'+
    '<button type="button" class="btn primary" data-act="qv-add">افزودن به سبد</button></div></div></div>';
  paintSlots(qv);
  if(fk){ var f = qv.querySelector('[data-k="'+fk+'"]'); if(f) f.focus(); }
}
function openQV(id){ var p=P(id); Q={id:id,size:0,color:0,qty:1}; renderQV(); openOv($('#qv')); }

/* cart */
function lineKey(l){ return l.id+'|'+l.size+'|'+l.color; }
function sub(){ return S.cart.reduce(function(a,l){ return a+P(l.id).price*l.qty; },0); }
function disc(){ return S.code ? Math.round(sub()*CODE.pct/100) : 0; }
function ship(){ var n = sub()-disc(); return (S.cart.length && n<FREE_SHIP) ? SHIP_FEE : 0; }
function total(){ return sub()-disc()+ship(); }
function qtyAll(){ return S.cart.reduce(function(a,l){ return a+l.qty; },0); }
function addToCart(id,size,color,qty){
  var l = null;
  for(var i=0;i<S.cart.length;i++){ if(S.cart[i].id===id && S.cart[i].size===size && S.cart[i].color===color){ l=S.cart[i]; break; } }
  if(l) l.qty = Math.min(9, l.qty+qty); else S.cart.push({id:id,size:size,color:color,qty:qty});
  save(); badges();
}
function badges(){
  var c = qtyAll(), w = S.wish.length;
  var cb=$('#cBadge'), wb=$('#wBadge');
  cb.hidden = !c; cb.textContent = fa(c);
  wb.hidden = !w; wb.textContent = fa(w);
}
function sumHTML(){
  var d = disc(), s = ship();
  return '<div class="sum"><div><span>جمع کالاها</span><span>'+toman(sub())+'</span></div>'+
    (d?'<div><span>تخفیف ('+fa(CODE.pct)+'٪)</span><span>−'+toman(d)+'</span></div>':'')+
    '<div><span>هزینه‌ی ارسال</span><span>'+(s?toman(s):'رایگان')+'</span></div>'+
    '<div class="tot"><span>مبلغ قابل پرداخت</span><span>'+toman(total())+'</span></div></div>';
}
function renderCart(){
  var body=$('#dBody'), foot=$('#dFoot'), n=qtyAll();
  $('#dTitle').textContent = view==='checkout' ? 'اطلاعات ارسال' : (view==='done' ? 'سفارش ثبت شد' : 'سبد خرید'+(n?' ('+fa(n)+')':''));
  if(view==='done'){
    body.innerHTML = '<div class="done"><svg class="ic"><use href="#i-check"/></svg><h3>ممنون از خرید شما</h3><p>شماره‌ی سفارش: <b>'+order+'</b></p><p class="note">سفارش شما در سیستم فروشگاه ذخیره شد. پرداخت آنلاین هنوز فعال نیست و هماهنگی ادامه‌ی سفارش باید توسط فروشگاه انجام شود.</p><button type="button" class="btn primary" data-act="close">ادامه‌ی خرید</button></div>';
    foot.innerHTML=''; foot.hidden=true; return;
  }
  foot.hidden=false;
  if(view==='checkout'){
    body.innerHTML = '<form class="form" id="coForm" novalidate>'+
      '<label>نام و نام خانوادگی<span class="field"><input id="coName" autocomplete="name"></span></label>'+
      '<label>شماره موبایل<span class="field"><input id="coPhone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹"></span></label>'+
      '<label>شهر<span class="field"><input id="coCity" autocomplete="address-level2"></span></label>'+
      '<label>آدرس کامل<span class="field"><input id="coAddr" autocomplete="street-address"></span></label>'+
      '<p class="note">پس از ثبت، سفارش در پنل مدیریت ذخیره می‌شود. پرداخت آنلاین هنوز راه‌اندازی نشده است.</p>'+
      '<p class="msg err" id="coMsg" aria-live="polite"></p>'+
      '<div class="sum"><div class="tot"><span>مبلغ قابل پرداخت</span><span>'+toman(total())+'</span></div></div>'+
      '<button type="submit" class="btn primary block">ثبت سفارش</button>'+
      '<button type="button" class="lnk" data-act="back">بازگشت به سبد</button></form>';
    foot.innerHTML=''; foot.hidden=true; return;
  }
  if(!S.cart.length){
    body.innerHTML = '<div class="empty" style="padding-block:48px"><p>سبد خرید شما خالی است.</p><button type="button" class="btn ghost" data-act="close">دیدن محصولات</button></div>';
    foot.innerHTML=''; foot.hidden=true; return;
  }
  var net = sub()-disc(), rem = Math.max(0, FREE_SHIP-net), pct = Math.min(100, net/FREE_SHIP*100);
  var h = '<div class="ship">'+(rem>0 ? toman(rem)+' دیگر تا ارسال رایگان' : 'ارسال سفارش شما رایگان است')+
    '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(pct)+'"><i style="width:'+pct+'%"></i></div></div>';
  h += S.cart.map(function(l,i){
    var p=P(l.id);
    return '<div class="line">'+slotHTML('p-'+p.id,p.icon,p.tone,p.name)+'<div class="meta"><b>'+p.name+'</b><small>سایز '+p.sizes[l.size]+' · '+p.colors[l.color].n+'</small>'+
      '<div class="row"><div class="step"><button type="button" data-act="dec" data-i="'+i+'" aria-label="کم کردن"><svg class="ic"><use href="#i-minus"/></svg></button><output>'+fa(l.qty)+'</output><button type="button" data-act="inc" data-i="'+i+'" aria-label="زیاد کردن"><svg class="ic"><use href="#i-plus"/></svg></button></div>'+
      '<span><b>'+toman(p.price*l.qty)+'</b></span></div></div>'+
      '<button type="button" class="ibtn" data-act="rm" data-i="'+i+'" aria-label="حذف '+p.name+'"><svg class="ic"><use href="#i-trash"/></svg></button></div>';
  }).join('');
  body.innerHTML = h; paintSlots(body);
  foot.innerHTML = (S.code ? '<div class="coupon"><span>کد '+CODE.name+' اعمال شد</span><button type="button" class="lnk" data-act="rmcode">حذف</button></div>' :
      '<form class="code" id="codeForm" novalidate><label class="field"><span class="sr">کد تخفیف</span><input id="codeIn" placeholder="کد تخفیف (نمونه: '+CODE.name+')" autocomplete="off" dir="ltr"></label><button type="submit" class="btn ghost">اعمال</button></form>')+
    '<p class="msg err" id="codeMsg" aria-live="polite" style="margin:0;min-height:0">'+codeErr+'</p>'+sumHTML()+
    '<button type="button" class="btn primary block" data-act="checkout">ادامه و ثبت سفارش</button>';
}
function openCart(v){ view = v||'cart'; codeErr=''; renderCart(); openOv($('#drawer')); }

/* photo placing mode */
var editKey = null;
function setEdit(on){
  document.body.classList.toggle('edit', on);
  var b=$('#editBtn'); b.setAttribute('aria-pressed', on); $('span', b).textContent = on ? 'پایان جایگذاری' : 'جایگذاری عکس‌ها';
  if(on) toast('روی هر کادر بزنید و عکس خودتان را انتخاب کنید');
}
$('#file').addEventListener('change', function(e){
  var f = e.target.files && e.target.files[0];
  if(f && editKey){
    photos[editKey] = URL.createObjectURL(f);
    $$('[data-slot="'+editKey+'"]').forEach(paintSlot);
  }
  e.target.value=''; editKey=null;
});
document.addEventListener('click', function(e){
  if(!document.body.classList.contains('edit')) return;
  var s = e.target.closest('.slot');
  if(s){ e.preventDefault(); e.stopPropagation(); editKey = s.getAttribute('data-slot'); $('#file').click(); }
}, true);

/* actions */
function go(id){ var el=$(id); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }
function setCat(c){
  F.wish=false; F.sale=false;
  if(c==='تخفیف'){ F.cat='همه'; F.sale=true; }
  else if(c==='علاقه'){ F.cat='همه'; F.wish=true; }
  else F.cat=c;
  renderGrid();
}
document.addEventListener('click', function(e){
  var t = e.target.closest('[data-act]'); if(!t) return;
  var a = t.getAttribute('data-act'), id = +t.getAttribute('data-id'), i = +t.getAttribute('data-i');
  if(a==='top'){ e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); }
  else if(a==='nav'){ setCat(t.getAttribute('data-cat')); go('#products'); }
  else if(a==='cat'){ setCat(t.getAttribute('data-cat')); }
  else if(a==='reset'){ F={cat:'همه',q:'',sort:'pop',wish:false,sale:false}; $('#q').value=''; $('#sort').value='pop'; renderGrid(); }
  else if(a==='search'){ go('#products'); setTimeout(function(){ $('#q').focus(); }, 400); }
  else if(a==='wishlist'){ setCat('علاقه'); go('#products'); }
  else if(a==='open'){ openQV(id); }
  else if(a==='wish'){
    var k = S.wish.indexOf(id), on = k<0;
    if(on) S.wish.push(id); else S.wish.splice(k,1);
    save(); badges();
    if(F.wish) renderGrid(); else { renderChips(); $$('.heart[data-id="'+id+'"]').forEach(function(b){ b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); }); }
    toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
  }
  else if(a==='close'){ closeOv(); }
  else if(a==='open-cart'){ openCart('cart'); }
  else if(a==='qv-color'){ Q.color=i; renderQV(t.getAttribute('data-k')); }
  else if(a==='qv-size'){ Q.size=i; renderQV(t.getAttribute('data-k')); }
  else if(a==='qv-inc'){ Q.qty=Math.min(9,Q.qty+1); renderQV('inc'); }
  else if(a==='qv-dec'){ Q.qty=Math.max(1,Q.qty-1); renderQV('dec'); }
  else if(a==='qv-add'){ addToCart(Q.id,Q.size,Q.color,Q.qty); toast('به سبد خرید اضافه شد'); openCart('cart'); }
  else if(a==='inc'){ S.cart[i].qty=Math.min(9,S.cart[i].qty+1); save(); badges(); renderCart(); }
  else if(a==='dec'){ S.cart[i].qty=Math.max(1,S.cart[i].qty-1); save(); badges(); renderCart(); }
  else if(a==='rm'){ S.cart.splice(i,1); save(); badges(); renderCart(); }
  else if(a==='rmcode'){ S.code=false; save(); renderCart(); }
  else if(a==='checkout'){ view='checkout'; renderCart(); var n=$('#coName'); if(n) n.focus(); }
  else if(a==='back'){ view='cart'; renderCart(); }
  else if(a==='edit'){ setEdit(!document.body.classList.contains('edit')); }
});
document.addEventListener('submit', async function(e){
  var f = e.target; e.preventDefault();
  if(f.id==='codeForm'){
    var v = $('#codeIn').value.trim().toUpperCase();
    if(v===CODE.name){ S.code=true; codeErr=''; save(); } else { codeErr='این کد معتبر نیست. کد را دوباره بررسی کنید.'; }
    renderCart();
  } else if(f.id==='coForm'){
    var ph = plain($('#coPhone').value).replace(/[\s-]/g,''), msg = $('#coMsg');
    var customerName = $('#coName').value.trim();
    var city = $('#coCity').value.trim();
    var address = $('#coAddr').value.trim();
    if(!customerName){ msg.textContent='نام و نام خانوادگی را وارد کنید.'; $('#coName').focus(); return; }
    if(!/^09\d{9}$/.test(ph)){ msg.textContent='شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.'; $('#coPhone').focus(); return; }
    if(!city || address.length < 8){ msg.textContent='شهر و آدرس کامل را وارد کنید.'; return; }
    var submitButton = f.querySelector('button[type="submit"]');
    if(submitButton){ submitButton.disabled=true; submitButton.textContent='در حال ثبت سفارش...'; }
    msg.textContent='';
    try{
      var result = await apiRequest('/api/orders', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          customer:{name:customerName, phone:ph, city:city, address:address},
          cart:S.cart,
          couponCode:S.code ? CODE.name : null
        })
      });
      order = result.orderNumber;
      S.cart=[]; S.code=false; save(); badges(); view='done'; renderCart();
    }catch(error){
      msg.textContent = error.message || 'ثبت سفارش انجام نشد. اتصال سرور را بررسی کنید.';
      if(submitButton){ submitButton.disabled=false; submitButton.textContent='ثبت سفارش'; }
    }
  } else if(f.id==='news'){
    var m = $('#newsMsg'), p2 = plain($('#phone').value).replace(/[\s-]/g,'');
    if(!/^09\d{9}$/.test(p2)){
      m.className='msg err'; m.textContent='شماره موبایل را با ۰۹ شروع کنید و ۱۱ رقم بنویسید.'; return;
    }
    var newsButton = f.querySelector('button[type="submit"]');
    if(newsButton){ newsButton.disabled=true; newsButton.textContent='در حال ثبت...'; }
    try{
      var subscribed = await apiRequest('/api/newsletter', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:p2})
      });
      m.className='msg'; m.textContent=subscribed.message || 'عضویت ثبت شد.'; $('#phone').value='';
    }catch(error){
      m.className='msg err'; m.textContent=error.message || 'ثبت عضویت انجام نشد.';
    }finally{
      if(newsButton){ newsButton.disabled=false; newsButton.textContent='عضویت'; }
    }
  }
});
$('#q').addEventListener('input', function(e){ F.q=e.target.value; renderGrid(); });
$('#sort').addEventListener('change', function(e){ F.sort=e.target.value; renderGrid(); });

/* countdown to midnight */
function tick(){
  var n=new Date(), end=new Date(n); end.setHours(24,0,0,0);
  var s=Math.max(0,Math.floor((end-n)/1000)), h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60;
  function z(v){ return fd(('0'+v).slice(-2)); }
  $('#cd').textContent = z(h)+':'+z(m)+':'+z(x);
}

/* init: load the product catalogue from the local backend */
async function boot(){
  try{
    var result = await apiRequest('/api/products');
    if(Array.isArray(result.products)) PRODUCTS = result.products;
    S.cart = S.cart.filter(function(line){ return P(line.id) && line.qty>0; });
    S.wish = S.wish.filter(function(id){ return P(id); });
    save();
  }catch(error){
    console.warn('Backend is not available:', error.message);
    toast('برای ثبت سفارش، سرور را با npm run dev اجرا کنید');
  }
  renderTiles(); renderGrid(); badges(); paintSlots(document);
}
boot(); tick(); setInterval(tick,1000);
})();
