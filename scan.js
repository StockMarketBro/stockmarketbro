// ═══ StockMarketBro — Cron Job de señales automáticas ═══
// Vercel Serverless Function ejecutada cada hora
// Lee indicadores de Twelve Data y guarda señales en Firestore

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function getDB() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

const WATCHLIST = [
  { sym: 'AAPL', name: 'Apple' },
  { sym: 'MSFT', name: 'Microsoft' },
  { sym: 'NVDA', name: 'NVIDIA' },
  { sym: 'TSLA', name: 'Tesla' },
  { sym: 'GOOGL', name: 'Alphabet' },
  { sym: 'AMZN', name: 'Amazon' },
  { sym: 'META', name: 'Meta' },
  { sym: 'NFLX', name: 'Netflix' },
  { sym: 'AMD', name: 'AMD' },
  { sym: 'INTC', name: 'Intel' },
  { sym: 'JPM', name: 'JPMorgan' },
  { sym: 'BAC', name: 'Bank of America' },
  { sym: 'V', name: 'Visa' },
  { sym: 'MA', name: 'Mastercard' },
  { sym: 'DIS', name: 'Disney' },
  { sym: 'PYPL', name: 'PayPal' },
  { sym: 'UBER', name: 'Uber' },
  { sym: 'COIN', name: 'Coinbase' },
  { sym: 'PLTR', name: 'Palantir' },
  { sym: 'SNAP', name: 'Snap' },
  { sym: 'NKE', name: 'Nike' },
  { sym: 'SBUX', name: 'Starbucks' },
  { sym: 'WMT', name: 'Walmart' },
  { sym: 'KO', name: 'Coca-Cola' },
];

const TD_KEY = process.env.TWELVE_DATA_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchIndicator(sym, indicator, interval) {
  const url = `https://api.twelvedata.com/${indicator}?symbol=${sym}&interval=${interval}&outputsize=5&apikey=${TD_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'error') return null;
    return data.values?.[0] || null;
  } catch {
    return null;
  }
}

async function analyzeStock(sym) {
  const intervals = ['1day', '1week', '1month'];
  let buyCount = 0, sellCount = 0;

  for (const interval of intervals) {
    const [rsi, macd, stoch] = await Promise.all([
      fetchIndicator(sym, 'rsi', interval),
      fetchIndicator(sym, 'macd', interval),
      fetchIndicator(sym, 'stoch', interval),
    ]);
    await sleep(400);

    let buy = 0, sell = 0;
    if (rsi) { if (+rsi.rsi < 40) buy++; else if (+rsi.rsi > 60) sell++; }
    if (macd) { if (+macd.macd > +macd.macd_signal) buy++; else sell++; }
    if (stoch) { if (+stoch.slow_k < 25) buy++; else if (+stoch.slow_k > 75) sell++; }

    if (buy >= 2) buyCount++;
    else if (sell >= 2) sellCount++;
  }

  // Bimensual check for Very High
  const [rsi2m, macd2m] = await Promise.all([
    fetchIndicator(sym, 'rsi', '2month'),
    fetchIndicator(sym, 'macd', '2month'),
  ]);
  await sleep(400);
  let buy2m = 0, sell2m = 0;
  if (rsi2m) { if (+rsi2m.rsi < 40) buy2m++; else if (+rsi2m.rsi > 60) sell2m++; }
  if (macd2m) { if (+macd2m.macd > +macd2m.macd_signal) buy2m++; else sell2m++; }

  const isBuy = buyCount >= 2;
  const isSell = sellCount >= 2;
  if (!isBuy && !isSell) return null;

  const dir = isBuy ? 'buy' : 'sell';
  const allAligned = (isBuy && buy2m >= 1) || (isSell && sell2m >= 1);
  const level = allAligned ? 'very-high' : 'high';

  return { sym, dir, level };
}

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[SMB Scan] Starting at', new Date().toISOString());
  const db = getDB();
  const results = [];
  const errors = [];

  for (const stock of WATCHLIST) {
    try {
      const signal = await analyzeStock(stock.sym);
      if (signal) results.push({ ...signal, name: stock.name });
      await sleep(600);
    } catch (err) {
      errors.push({ sym: stock.sym, error: err.message });
    }
  }

  // Save to Firestore — readable by all logged-in users
  await db.collection('auto_signals').doc('latest').set({
    signals: results,
    scannedAt: new Date().toISOString(),
    total: WATCHLIST.length,
    buyCount: results.filter(r => r.dir === 'buy').length,
    sellCount: results.filter(r => r.dir === 'sell').length,
    highCount: results.filter(r => r.level === 'high').length,
    veryHighCount: results.filter(r => r.level === 'very-high').length,
    errors: errors.length,
  });

  console.log(`[SMB Scan] Done — ${results.length} signals saved`);
  return res.status(200).json({ ok: true, signals: results.length });
}
