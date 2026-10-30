// Stand-in for the Firebase SDK so the demo runs with no Firebase project.
// The demo page maps the real Firebase imports to this file with an import map.
// Data lives in this browser only (localStorage), or in memory for ?shot= screenshots.

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot');
const KEY = 'santa-demo-db';

const day = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
const ans = (cats, treats, hobbies, colors, avoid, notes, sizes) => ({
  cats: { sel: cats, other: '' }, treats: { sel: treats, other: '' }, hobbies: { sel: hobbies, other: '' },
  colors: { sel: colors, other: '' }, avoid: { sel: avoid, other: '' }, notes,
  sizes: sizes || { cat: '', v: {}, o: {} }
});
const person = (name, extra) => ({ name, admin: false, claimed: true, done: false, bought: false, kindness: null, answers: null, codename: null, giveTo: null, ...extra });

// A demo family: Alex organizes, everyone else has joined and most have filled out wishlists.
function seed(drawn) {
  const people = {
    ALEX42: person('Alex', { admin: true, done: true, codename: 'Pikachu',
      answers: ans(['Books', 'Cozy home stuff'], ['Coffee or tea'], ['Reading', 'Cooking'], ['Green'], ['Mugs'], 'Loves mystery novels.') }),
    JORD77: person('Jordan', { done: true, codename: 'Snorlax',
      answers: ans(['Tech & gadgets', 'Games & puzzles'], ['Savory snacks', 'Spicy foods'], ['Gaming', 'Movies & TV'], ['Black', 'Blue'], ['Socks'],
        'Wireless earbuds or a big jigsaw puzzle!', { cat: 'men', v: { shirt: 'L', shoes: '10.5' }, o: {} }) }),
    SAMM35: person('Sam', { done: true, codename: 'Eevee',
      answers: ans(['Beauty & self-care', 'Art & crafts'], ['Chocolate', 'Baked goods'], ['Crafts / DIY', 'Music'], ['Pink', 'Purple'], ['Candles'],
        'Watercolor paints would be amazing.', { cat: 'women', v: { shirt: 'S', jacket: 'M' }, o: {} }) }),
    TAYL58: person('Taylor', { done: true, codename: 'Squirtle',
      answers: ans(['Outdoors & sports', 'Experiences'], ['Coffee or tea'], ['Fitness', 'Travel'], ['Blue', 'Neutrals'], ['Food'], 'A new water bottle or hiking socks.') }),
    RILE29: person('Riley', { done: true, codename: 'Jigglypuff',
      answers: ans(['Clothing & accessories', 'Books'], ['Candy'], ['Reading', 'Movies & TV'], ['Red'], ['Gift cards'], 'Cozy pajamas!') }),
    CASE64: person('Casey', { claimed: false }),
    MORG83: person('Morgan', { claimed: false })
  };
  const ev = { title: 'Family Secret Santa', budget: '$30', date: day(24), drawn: !!drawn, revealed: false };
  const chats = {};
  if (drawn) {
    const ring = ['ALEX42', 'JORD77', 'SAMM35', 'TAYL58', 'RILE29', 'CASE64', 'MORG83'];
    ring.forEach((c, i) => { people[c].giveTo = ring[(i + 1) % ring.length]; people[c].claimed = true; people[c].done = true; chats[c] = { items: [] }; });
    people.CASE64.codename = 'Bulbasaur'; people.CASE64.answers = ans(['Games & puzzles'], ['Chocolate'], ['Gaming'], ['Green'], [], '');
    people.MORG83.codename = 'Psyduck'; people.MORG83.answers = ans(['Cozy home stuff'], ['Baked goods'], ['Cooking'], ['Neutrals'], [], '');
    people.ALEX42.bought = true; people.SAMM35.bought = true; people.TAYL58.bought = true;
    chats.JORD77 = { items: [{ q: 'Do you have a favorite video game series?', a: 'Zelda, always!' }, { q: 'Over-ear or in-ear headphones?', a: null }] };
    chats.ALEX42 = { items: [{ q: 'Paperback or hardcover?', a: null }] };
  }
  return { event: { main: ev }, people, chats };
}

// Screens used for the guide's screenshots: [seed state, code logged in as, tab to open]
const SHOTS = {
  setup: [null], login: ['open'], pick: ['open', null, 'claim'], wishlist: ['open', 'CASE64'],
  home: ['drawn', 'JORD77'], match: ['drawn', 'ALEX42', 'match'], msgs: ['drawn', 'ALEX42', 'msgs'],
  org: ['open', 'ALEX42', 'org'], draw: ['drawn', 'ALEX42', 'org'], reveal: ['reveal', 'ALEX42', 'reveal']
};

let store;
if (SHOT) {
  const [state, code, tab] = SHOTS[SHOT] || [null];
  store = state === null ? { event: {}, people: {}, chats: {} } : seed(state !== 'open');
  if (state === 'reveal') store.event.main.revealed = true;
  if (code === 'CASE64') store.people.CASE64.claimed = true;
  // Keep each screenshot's login separate from the real browser storage.
  const mem = { 'santa-code': code || null };
  Storage.prototype.getItem = k => mem[k] ?? null;
  Storage.prototype.setItem = (k, v) => { mem[k] = String(v); };
  Storage.prototype.removeItem = k => { delete mem[k]; };
  if (tab) {
    const go = () => {
      const b = tab === 'claim' ? document.querySelector('#claim') : document.querySelector(`.tabs button[data-t="${tab}"]`);
      if (b) b.click(); else setTimeout(go, 50);
    };
    setTimeout(go, 50);
  }
} else {
  try { store = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!store) store = seed(false);
}
const save = () => { if (!SHOT) try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
const listeners = new Set();
const changed = () => { save(); listeners.forEach(f => f()); };

export const initializeApp = () => ({});
export const getAuth = () => ({});
export const signInAnonymously = async () => ({ user: { uid: 'demo' } });
export const getFirestore = () => ({});
export const doc = (db, col, id) => ({ col, id });
export const collection = (db, col) => ({ col });

const snap = (col, id) => { const d = store[col]?.[id]; return { id, exists: () => d != null, data: () => clone(d) }; };
export const getDoc = async r => snap(r.col, r.id);
export const getDocs = async c => ({ docs: Object.keys(store[c.col] || {}).map(id => snap(c.col, id)) });
const put = (r, d) => { (store[r.col] ||= {})[r.id] = clone(d); };
export const setDoc = async (r, d) => { put(r, d); changed(); };
export const writeBatch = () => {
  const ops = [];
  return {
    set: (r, d) => ops.push(() => put(r, d)),
    update: (r, d) => ops.push(() => put(r, { ...store[r.col]?.[r.id], ...d })),
    delete: r => ops.push(() => { delete store[r.col]?.[r.id]; }),
    commit: async () => { ops.forEach(f => f()); changed(); }
  };
};
export const onSnapshot = (c, cb) => {
  const f = () => cb({ docs: Object.keys(store[c.col] || {}).map(id => snap(c.col, id)) });
  listeners.add(f); f();
  return () => listeners.delete(f);
};

// Demo bar with the organizer's code and a reset button (hidden in screenshots).
if (!SHOT) addEventListener('DOMContentLoaded', () => {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:70;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));background:#1f6b4a;color:#fff;font:14px system-ui,sans-serif';
  bar.innerHTML = '<span>🧪 <b>Demo</b>: data stays in your browser. Organizer code: <b>ALEX42</b></span>';
  const reset = document.createElement('button');
  reset.textContent = 'Reset demo';
  reset.style.cssText = 'width:auto;min-height:32px;margin:0;padding:4px 12px;font-size:13px;background:#fff;color:#1f6b4a';
  reset.onclick = () => { try { localStorage.removeItem(KEY); localStorage.removeItem('santa-code'); } catch (e) {} location.reload(); };
  bar.append(reset);
  document.body.append(bar);
  document.querySelector('main').style.paddingBottom = '96px';
});
