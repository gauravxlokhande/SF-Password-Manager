'use strict';
/*
 * Developed by: Gaurav Lokhande
 * Email: gaurravLokhande@gmail.com
 * Portfolio: https://gauravxlokhande.github.io/gauravxlokhande/
 * Linkedin: www.linkedin.com/in/gauravlokhande
 * GitHub: https://github.com/gauravxlokhande
 * Trailhead: https://www.salesforce.com/trailblazer/gauravlokhande
 * Instagram: gaurravlokhande
 * @Version: 0.1 
 * @Completed on: 20 May 2026
 */

let orgs = [], dark = false, editId = null, selColor = '#0176D3';
const $ = id => document.getElementById(id);

const listEl=$('list'), emptyEl=$('empty'), badgeEl=$('orgBadge'),
      searchIn=$('searchIn'), sClear=$('sClear'), addBtn=$('addBtn'),
      themeBtn=$('themeBtn'), backdrop=$('backdrop'), drawerH=$('drawerH'),
      drawerX=$('drawerX'), cancelBtn=$('cancelBtn'), saveBtn=$('saveBtn'),
      fName=$('fName'), fUrl=$('fUrl'), fUser=$('fUser'), fPass=$('fPass'),
      eyeBtn=$('eyeBtn'), swatchEl=$('swatches'), toastEl=$('toast');

// ── Storage ────────────────────────────────────────────────────────
function load() {
  chrome.storage.local.get(['sfv_orgs','sfv_dark'], r => {
    orgs = r.sfv_orgs || [];
    dark = !!r.sfv_dark;
    applyTheme(); render();
  });
}
function persist() { chrome.storage.local.set({ sfv_orgs: orgs }); }

// ── Theme ──────────────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}
themeBtn.addEventListener('click', () => {
  dark = !dark; applyTheme();
  chrome.storage.local.set({ sfv_dark: dark });
});

// ── Render ─────────────────────────────────────────────────────────
function render(q = '') {
  const lq  = q.toLowerCase();
  const vis = lq ? orgs.filter(o =>
    o.name.toLowerCase().includes(lq) || o.user.toLowerCase().includes(lq)
  ) : orgs;

  badgeEl.textContent = orgs.length + (orgs.length === 1 ? ' org' : ' orgs');
  listEl.innerHTML = '';

  if (!vis.length) {
    emptyEl.classList.add('on');
    $('eTitle').textContent = lq ? 'No results' : 'No orgs saved';
    $('eSub').innerHTML = lq
      ? `Nothing matched "<b>${esc(q)}</b>"`
      : `Click <b>+</b> to add your Salesforce org`;
    return;
  }
  emptyEl.classList.remove('on');

  vis.forEach(org => {
    const c   = org.color || '#0176D3';
    const bg  = hexA(c, .12);
    const ini = initials(org.name);
    const env = envLabel(org.url);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--stripe', c);
    card.innerHTML = `
      <div class="card-ava" style="background:${bg};color:${c}">${ini}</div>
      <div class="card-info">
        <div class="card-name" title="${esc(org.name)}">${esc(org.name)}</div>
        <div class="card-user" title="${esc(org.user)}">${esc(org.user)}</div>
        <span class="card-env ${env.cls}">${env.label}</span>
      </div>
      <div class="card-right">
        <button class="login-btn" data-id="${org.id}">
          <svg viewBox="0 0 12 12" fill="none">
            <path d="M4 6h6M8 4l2 2-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.5 2H2v8h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="lbl">Login</span>
          <span class="spin"></span>
        </button>
        <div class="card-acts">
          <button class="ca-btn" data-a="edit" data-id="${org.id}" title="Edit">
            <svg viewBox="0 0 12 12" fill="none"><path d="M8.2 1.8l2 2-6.5 6.5H1.7V8.2l6.5-6.4z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
          </button>
          <button class="ca-btn del" data-a="del" data-id="${org.id}" title="Remove">
            <svg viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M4.5 3V2h3v1M5 4.5v4M7 4.5v4M2.5 3l.5 6h6l.5-6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>`;

    card.addEventListener('click', e => {
      const btn = e.target.closest('[data-a],[data-id]');
      if (!btn) return;
      const id = btn.dataset.id;
      const a  = btn.dataset.a;
      if (btn.classList.contains('login-btn')) doLogin(id, btn);
      else if (a === 'edit') openDrawer(orgs.find(o => o.id === id));
      else if (a === 'del')  removeOrg(id);
    });
    listEl.appendChild(card);
  });
}

// ── LOGIN — key fix: background.js opens tab + watches + injects ───
function doLogin(id, btnEl) {
  const org = orgs.find(o => o.id === id);
  if (!org) return;

  btnEl.classList.add('busy');

  chrome.runtime.sendMessage({ type: 'SF_DO_LOGIN', org }, res => {
    if (res && res.ok) {
      showToast('Opening ' + org.name + '…', 'ok');
      // Close popup — background.js will inject credentials when page loads
      window.close();
    } else {
      btnEl.classList.remove('busy');
      showToast('Could not open tab', 'err');
    }
  });
}

// ── Remove ─────────────────────────────────────────────────────────
function removeOrg(id) {
  orgs = orgs.filter(o => o.id !== id);
  persist(); render(searchIn.value); showToast('Org removed');
}

// ── Search ─────────────────────────────────────────────────────────
searchIn.addEventListener('input', () => {
  searchIn.closest('.search-row').classList.toggle('has-q', !!searchIn.value);
  render(searchIn.value);
});
sClear.addEventListener('click', () => {
  searchIn.value = '';
  searchIn.closest('.search-row').classList.remove('has-q');
  render(); searchIn.focus();
});

// ── Drawer ─────────────────────────────────────────────────────────
function openDrawer(org = null) {
  editId = org?.id || null;
  drawerH.textContent = org ? 'Edit Org' : 'Add Org';
  fName.value = org?.name || '';
  fUrl.value  = org?.url  || '';
  fUser.value = org?.user || '';
  fPass.value = org?.pass || '';

  fPass.type = 'password';
  document.querySelector('.eye-show').style.display = '';
  document.querySelector('.eye-hide').style.display = 'none';

  const url = org?.url || '';
  document.querySelectorAll('.preset').forEach(p => {
    if (p.dataset.url) {
      p.classList.toggle('active', !!url && url.startsWith(p.dataset.url));
    } else {
      p.classList.toggle('active', !!url && !['login.salesforce.com','test.salesforce.com'].some(s => url.includes(s)));
    }
  });

  selColor = org?.color || '#0176D3';
  document.querySelectorAll('.sw').forEach(s =>
    s.classList.toggle('active', s.dataset.c === selColor));

  [fName, fUrl, fUser, fPass].forEach(el => el.classList.remove('err'));
  backdrop.classList.add('open');
  setTimeout(() => fName.focus(), 280);
}
function closeDrawer() { backdrop.classList.remove('open'); }

addBtn.addEventListener('click', () => openDrawer());
drawerX.addEventListener('click', closeDrawer);
cancelBtn.addEventListener('click', closeDrawer);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeDrawer(); });

document.querySelector('.url-presets').addEventListener('click', e => {
  const p = e.target.closest('.preset');
  if (!p) return;
  if (p.dataset.url) fUrl.value = p.dataset.url;
  document.querySelectorAll('.preset').forEach(x => x.classList.toggle('active', x === p));
});

swatchEl.addEventListener('click', e => {
  const s = e.target.closest('.sw');
  if (!s) return;
  selColor = s.dataset.c;
  document.querySelectorAll('.sw').forEach(x => x.classList.toggle('active', x === s));
});

eyeBtn.addEventListener('click', () => {
  const show = fPass.type === 'password';
  fPass.type = show ? 'text' : 'password';
  document.querySelector('.eye-show').style.display = show ? 'none' : '';
  document.querySelector('.eye-hide').style.display = show ? ''     : 'none';
});

saveBtn.addEventListener('click', () => {
  const n = fName.value.trim(), u = fUrl.value.trim(),
        usr = fUser.value.trim(), pw = fPass.value;
  let ok = true;
  [[n,fName],[u,fUrl],[usr,fUser],[pw,fPass]].forEach(([v,el]) => {
    if (!v) { el.classList.add('err'); shake(el); ok = false; }
    else el.classList.remove('err');
  });
  if (!ok) return showToast('Fill in all fields', 'err');

  const url = u.startsWith('http') ? u : 'https://' + u;
  if (editId) {
    const i = orgs.findIndex(o => o.id === editId);
    if (i > -1) orgs[i] = { ...orgs[i], name:n, url, user:usr, pass:pw, color:selColor };
    showToast('Org updated', 'ok');
  } else {
    orgs.push({ id: uid(), name:n, url, user:usr, pass:pw, color:selColor });
    showToast('Org saved', 'ok');
  }
  persist(); render(searchIn.value); closeDrawer();
});

[fName,fUrl,fUser,fPass].forEach(el =>
  el.addEventListener('input', () => el.classList.remove('err')));

// ── Toast ──────────────────────────────────────────────────────────
let tt;
function showToast(msg, type = '') {
  toastEl.textContent = msg;
  toastEl.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(tt);
  tt = setTimeout(() => toastEl.className = 'toast', 2800);
}

// ── Helpers ────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function hexA(hex, a) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
function initials(name) { return (name.match(/\b\w/g)||['?']).slice(0,2).join('').toUpperCase(); }
function envLabel(url = '') {
  if (url.includes('test.salesforce.com'))  return { label:'Sandbox',    cls:'env-sandbox' };
  if (url.includes('login.salesforce.com')) return { label:'Production', cls:'env-prod'    };
  return { label:'Custom', cls:'env-custom' };
}
function shake(el) {
  el.classList.remove('shake'); void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once:true });
}

load();
