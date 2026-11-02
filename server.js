'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'sarv-store.db');
const FREE_SHIP = 3000000;
const SHIP_FEE = 120000;
const COUPON = 'SARV10';
const COUPON_PERCENT = 10;
const MAX_BODY = 1024 * 1024;

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnv();
const PORT = Number(process.env.PORT || 3000);

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    cat TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'shirt',
    tone INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL CHECK(price >= 0),
    old INTEGER,
    tag TEXT,
    sizes_json TEXT NOT NULL,
    colors_json TEXT NOT NULL,
    desc TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    items_json TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    discount INTEGER NOT NULL,
    shipping INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
if (productCount === 0) {
  const seedPath = path.join(DATA_DIR, 'seed-products.json');
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const insert = db.prepare(`INSERT INTO products
    (id,name,cat,icon,tone,price,old,tag,sizes_json,colors_json,desc)
    VALUES (@id,@name,@cat,@icon,@tone,@price,@old,@tag,@sizes_json,@colors_json,@desc)`);
  db.exec('BEGIN');
  try {
    for (const p of seed) {
      insert.run({
        id: p.id, name: p.name, cat: p.cat, icon: p.icon, tone: p.tone,
        price: p.price, old: p.old ?? null, tag: p.tag ?? null,
        sizes_json: JSON.stringify(p.sizes), colors_json: JSON.stringify(p.colors), desc: p.desc || ''
      });
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

const getProductsStmt = db.prepare('SELECT * FROM products ORDER BY id');
function productFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    cat: row.cat,
    icon: row.icon,
    tone: row.tone,
    price: row.price,
    ...(row.old != null ? { old: row.old } : {}),
    ...(row.tag ? { tag: row.tag } : {}),
    sizes: JSON.parse(row.sizes_json),
    colors: JSON.parse(row.colors_json),
    desc: row.desc
  };
}
function getProducts() {
  return getProductsStmt.all().map(productFromRow);
}
function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}
function cleanText(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}
function toAsciiDigits(value) {
  return String(value ?? '').replace(/[۰-۹٠-٩]/g, (digit) => {
    const fa = '۰۱۲۳۴۵۶۷۸۹';
    const ar = '٠١٢٣٤٥٦٧٨٩';
    const index = fa.indexOf(digit);
    return String(index >= 0 ? index : ar.indexOf(digit));
  });
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('حجم درخواست بیش از حد مجاز است.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(Object.assign(new Error('فرمت داده‌های ارسالی معتبر نیست.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
function isAdmin(req) {
  const expected = process.env.ADMIN_KEY || '';
  const supplied = req.headers['x-admin-key'] || '';
  if (expected.length < 24 || typeof supplied !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  send(res, process.env.ADMIN_KEY ? 401 : 503, {
    error: process.env.ADMIN_KEY
      ? 'کلید مدیریت اشتباه است.'
      : 'کلید مدیریت تنظیم نشده است. فایل .env را بررسی کنید.'
  });
  return false;
}
function validPhone(value) {
  return /^09\d{9}$/.test(toAsciiDigits(value).replace(/[\s-]/g, ''));
}
function validProductInput(body, partial = false) {
  const data = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  if (!partial || has('name')) {
    data.name = cleanText(body.name, 100);
    if (!data.name) throw new Error('نام محصول الزامی است.');
  }
  if (!partial || has('cat')) {
    data.cat = cleanText(body.cat, 40);
    if (!data.cat) throw new Error('دسته‌بندی محصول الزامی است.');
  }
  if (!partial || has('price')) {
    data.price = Number(body.price);
    if (!Number.isSafeInteger(data.price) || data.price < 0) throw new Error('قیمت باید عدد صحیح و نامنفی باشد.');
  }
  if (has('old') || !partial) {
    data.old = body.old === '' || body.old == null ? null : Number(body.old);
    if (data.old != null && (!Number.isSafeInteger(data.old) || data.old < 0)) throw new Error('قیمت قبلی معتبر نیست.');
  }
  if (has('tag') || !partial) data.tag = cleanText(body.tag || '', 30) || null;
  if (has('icon') || !partial) data.icon = cleanText(body.icon || 'shirt', 30) || 'shirt';
  if (has('tone') || !partial) {
    data.tone = Number(body.tone ?? 1);
    if (!Number.isInteger(data.tone) || data.tone < 1 || data.tone > 4) throw new Error('مقدار tone باید بین ۱ تا ۴ باشد.');
  }
  if (has('sizes') || !partial) {
    data.sizes = Array.isArray(body.sizes) ? body.sizes.map((v) => cleanText(String(v), 30)).filter(Boolean).slice(0, 20) : [];
    if (!data.sizes.length) throw new Error('حداقل یک سایز وارد کنید.');
  }
  if (has('colors') || !partial) {
    data.colors = Array.isArray(body.colors) ? body.colors.slice(0, 12).map((c) => ({
      n: cleanText(c?.n, 30), h: String(c?.h || '')
    })) : [];
    if (!data.colors.length || data.colors.some((c) => !c.n || !/^#[0-9a-fA-F]{6}$/.test(c.h))) {
      throw new Error('رنگ‌ها باید نام و کد رنگ شش‌رقمی معتبر داشته باشند.');
    }
  }
  if (has('desc') || !partial) data.desc = cleanText(body.desc || '', 1000);
  return data;
}
function mapOrder(row) {
  return {
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    items: JSON.parse(row.items_json),
    subtotal: row.subtotal,
    discount: row.discount,
    shipping: row.shipping,
    total: row.total,
    status: row.status,
    createdAt: row.created_at
  };
}

async function handleApi(req, res, url) {
  const method = req.method;
  const pathname = url.pathname;

  if (method === 'GET' && pathname === '/api/health') {
    return send(res, 200, { ok: true, service: 'sarv-store-api' });
  }
  if (method === 'GET' && pathname === '/api/products') {
    return send(res, 200, { products: getProducts() });
  }
  if (method === 'POST' && pathname === '/api/orders') {
    const body = await readBody(req);
    const customer = body.customer || {};
    const name = cleanText(customer.name, 100);
    const phone = toAsciiDigits(customer.phone).replace(/[\s-]/g, '');
    const city = cleanText(customer.city, 100);
    const address = cleanText(customer.address, 700);
    if (!name || !validPhone(phone) || !city || address.length < 8) {
      return send(res, 400, { error: 'نام، شماره موبایل، شهر و آدرس معتبر را وارد کنید.' });
    }
    if (!Array.isArray(body.cart) || body.cart.length < 1 || body.cart.length > 40) {
      return send(res, 400, { error: 'سبد خرید خالی یا نامعتبر است.' });
    }
    const productsById = new Map(getProducts().map((p) => [p.id, p]));
    const items = [];
    let subtotal = 0;
    for (const line of body.cart) {
      const id = Number(line.id), sizeIndex = Number(line.size), colorIndex = Number(line.color), qty = Number(line.qty);
      const p = productsById.get(id);
      if (!p || !Number.isInteger(sizeIndex) || !Number.isInteger(colorIndex) ||
          !Number.isInteger(qty) || qty < 1 || qty > 9 ||
          sizeIndex < 0 || sizeIndex >= p.sizes.length ||
          colorIndex < 0 || colorIndex >= p.colors.length) {
        return send(res, 400, { error: 'یکی از محصولات سبد خرید معتبر نیست؛ صفحه را تازه‌سازی کنید.' });
      }
      const lineTotal = p.price * qty;
      if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(subtotal + lineTotal)) {
        return send(res, 400, { error: 'مبلغ سفارش معتبر نیست.' });
      }
      subtotal += lineTotal;
      items.push({
        productId: p.id, name: p.name, price: p.price, qty,
        size: p.sizes[sizeIndex], color: p.colors[colorIndex].n,
        lineTotal
      });
    }
    let discount = 0;
    if (body.couponCode) {
      if (String(body.couponCode).trim().toUpperCase() !== COUPON) {
        return send(res, 400, { error: 'کد تخفیف معتبر نیست.' });
      }
      discount = Math.round(subtotal * COUPON_PERCENT / 100);
    }
    const shipping = subtotal - discount < FREE_SHIP ? SHIP_FEE : 0;
    const total = subtotal - discount + shipping;
    let orderNumber;
    for (let attempt = 0; attempt < 5; attempt++) {
      orderNumber = 'SR-' + crypto.randomInt(10000, 100000);
      if (!db.prepare('SELECT 1 FROM orders WHERE order_number=?').get(orderNumber)) break;
      orderNumber = null;
    }
    if (!orderNumber) return send(res, 500, { error: 'ساخت شماره سفارش با خطا روبه‌رو شد.' });

    const insertOrder = db.prepare(`INSERT INTO orders
      (order_number,customer_name,phone,city,address,items_json,subtotal,discount,shipping,total,status)
      VALUES (?,?,?,?,?,?,?,?,?,?, 'new')`);
    insertOrder.run(orderNumber, name, phone, city, address, JSON.stringify(items), subtotal, discount, shipping, total);
    return send(res, 201, { ok: true, orderNumber, subtotal, discount, shipping, total, status: 'new' });
  }
  if (method === 'POST' && pathname === '/api/newsletter') {
    const body = await readBody(req);
    const phone = toAsciiDigits(body.phone).replace(/[\s-]/g, '');
    if (!validPhone(phone)) return send(res, 400, { error: 'شماره موبایل معتبر نیست.' });
    try {
      db.prepare('INSERT INTO subscribers (phone) VALUES (?)').run(phone);
      return send(res, 201, { ok: true, message: 'عضویت شما ثبت شد.' });
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) return send(res, 200, { ok: true, message: 'این شماره قبلاً عضو شده است.' });
      throw error;
    }
  }

  if (pathname.startsWith('/api/admin/')) {
    if (!requireAdmin(req, res)) return;
    if (method === 'GET' && pathname === '/api/admin/orders') {
      const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 200').all();
      return send(res, 200, { orders: rows.map(mapOrder) });
    }
    if (method === 'GET' && pathname === '/api/admin/products') {
      return send(res, 200, { products: getProducts() });
    }
    if (method === 'POST' && pathname === '/api/admin/products') {
      const body = await readBody(req);
      let data;
      try { data = validProductInput(body); }
      catch (error) { return send(res, 400, { error: error.message }); }
      const stmt = db.prepare(`INSERT INTO products (name,cat,icon,tone,price,old,tag,sizes_json,colors_json,desc)
        VALUES (@name,@cat,@icon,@tone,@price,@old,@tag,@sizes_json,@colors_json,@desc)`);
      const result = stmt.run({ ...data, sizes_json: JSON.stringify(data.sizes), colors_json: JSON.stringify(data.colors) });
      const product = productFromRow(db.prepare('SELECT * FROM products WHERE id=?').get(Number(result.lastInsertRowid)));
      return send(res, 201, { ok: true, product });
    }
    const productMatch = pathname.match(/^\/api\/admin\/products\/(\d+)$/);
    if (productMatch && method === 'PATCH') {
      const id = Number(productMatch[1]);
      if (!db.prepare('SELECT id FROM products WHERE id=?').get(id)) return send(res, 404, { error: 'محصول پیدا نشد.' });
      const body = await readBody(req);
      let data;
      try { data = validProductInput(body, true); }
      catch (error) { return send(res, 400, { error: error.message }); }
      const current = productFromRow(db.prepare('SELECT * FROM products WHERE id=?').get(id));
      const merged = { ...current, ...data };
      db.prepare(`UPDATE products SET name=?,cat=?,icon=?,tone=?,price=?,old=?,tag=?,sizes_json=?,colors_json=?,desc=? WHERE id=?`)
        .run(merged.name, merged.cat, merged.icon, merged.tone, merged.price, merged.old ?? null,
          merged.tag ?? null, JSON.stringify(merged.sizes), JSON.stringify(merged.colors), merged.desc, id);
      return send(res, 200, { ok: true, product: productFromRow(db.prepare('SELECT * FROM products WHERE id=?').get(id)) });
    }
    if (productMatch && method === 'DELETE') {
      db.prepare('DELETE FROM products WHERE id=?').run(Number(productMatch[1]));
      return send(res, 200, { ok: true });
    }
    const orderMatch = pathname.match(/^\/api\/admin\/orders\/([A-Z0-9-]+)$/);
    if (orderMatch && method === 'PATCH') {
      const body = await readBody(req);
      const allowed = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!allowed.includes(body.status)) return send(res, 400, { error: 'وضعیت سفارش معتبر نیست.' });
      const result = db.prepare('UPDATE orders SET status=? WHERE order_number=?').run(body.status, orderMatch[1]);
      if (!result.changes) return send(res, 404, { error: 'سفارش پیدا نشد.' });
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'مسیر مدیریتی پیدا نشد.' });
  }
  return send(res, 404, { error: 'مسیر API پیدا نشد.' });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};
function serveStatic(req, res, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (decoded === '/') decoded = '/index.html';
  const allowed = new Set(['/index.html', '/style.css', '/script.js', '/admin.html', '/admin.js']);
  if (!allowed.has(decoded)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  const filePath = path.join(ROOT, decoded.slice(1));
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Allow': 'GET,POST,PATCH,DELETE,OPTIONS' });
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) return send(res, 405, { error: 'متد پشتیبانی نمی‌شود.' });
      return await handleApi(req, res, url);
    }
    if (req.method === 'GET') return serveStatic(req, res, url.pathname);
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
  } catch (error) {
    console.error('[API error]', error);
    if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : 'خطای داخلی سرور رخ داد.' });
    else res.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`Sarv Store is running: http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  if (!process.env.ADMIN_KEY || process.env.ADMIN_KEY.length < 24) {
    console.warn('ADMIN_KEY is not configured. Copy .env.example to .env and set a key of at least 24 characters.');
  }
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
