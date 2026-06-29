/* FPR member-identity resolver (added by FPRMembers7 — resolves real Memberstack
   member id onto the mount before the feature reads it; normalizes placeholder
   to demo-member when logged out; optional api-url fallback). */
window.__fprResolveMount = window.__fprResolveMount || async function (el, apiFallback) {
  function un(v){ return !v || v==='demo-member' || v==='preview-member' || v==='demo'
    || /MEMBER_ID|_VAR\b/i.test(v) || /^\{\{[\s\S]*\}\}$/.test(v); }
  function unApi(v){ return !v || !/^https?:\/\//i.test(v)
    || /YOUR[-_ ]?API|YOUR-API-DOMAIN|example\.com|localhost|\{\{|\.\.\./i.test(v); }
  if (apiFallback && unApi(el.getAttribute('data-api-url'))) {
    el.setAttribute('data-api-url', apiFallback); el.dataset.apiUrl = apiFallback;
  }
  if (!un(el.getAttribute('data-member-id'))) return;   // real id already injected
  var ms=null, start=Date.now();
  while (Date.now()-start < 3000) {
    if (window.$memberstackDom && window.$memberstackDom.getCurrentMember) { ms=window.$memberstackDom; break; }
    await new Promise(function(r){ setTimeout(r,100); });
  }
  var member=null; if (ms) { try { member=(await ms.getCurrentMember()).data; } catch(e){} }
  if (member && member.id) {
    el.setAttribute('data-member-id', member.id); el.dataset.memberId = member.id;
    var cf=member.customFields||{};
    var name=[cf['first-name'],cf['last-name']].filter(Boolean).join(' ').trim() || (member.auth&&member.auth.email) || '';
    if (name) { el.setAttribute('data-member-name', name); el.dataset.memberName = name; }
  } else {
    el.setAttribute('data-member-id','demo-member'); el.dataset.memberId='demo-member';
  }
};

/**
 * FPRMembers.com — Build 4: Dealer Pulse — Opportunity Signals Dashboard
 * File: fpr-pulse.js
 * Built: 2026-05-05
 *
 * Paste into: Webflow Site Settings → Custom Code → before </body>
 *
 * Configure on the root element:
 *   <div class="fpr-pulse" data-api-url="https://..." data-member-id="{{member-id}}">
 *
 * MAP DISPLAY RULE — enforced at the rendering layer:
 *   - Cards with content_variant = 'map_restricted' NEVER show prices, inventory
 *     counts, or any numerical market data. They show only the required text.
 *   - Cards with content_variant = 'full_pricing' may show all pricing data.
 *   - The API also strips price fields server-side for MAP-restricted signals,
 *     so this is a belt-and-suspenders enforcement.
 */

(function (global) {
  'use strict';

  // A real, authenticated member id is a UUID (the API rejects anything else with a 500). Missing or
  // placeholder ids ('demo-member', '{{member-id}}', etc.) mean the session was not detected → we show
  // an explicit "log in" state pointing at the real FPRMembers login page, NOT silent demo data.
  function isRealMemberId(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
  }

  /* ---- State -------------------------------------------------------------- */
  var state = {
    memberId:   null,
    apiUrl:     null,
    demoMode:   false,
    signals:    [],
    watchlist:  [],
    activeTab:  'all',
    unreadCount: 0,
    searchQuery: '',
    searchResults: [],
    watchedSkuIds: new Set(),
    pollInterval: null,
  };

  /* ---- Format helpers ----------------------------------------------------- */
  var _fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  function fmt(v) { return v != null ? _fmt.format(v) : '—'; }

  function timeAgo(isoStr) {
    if (!isoStr) return '';
    var d = Date.now() - new Date(isoStr).getTime();
    var m = Math.floor(d / 60000);
    if (m < 1)   return 'Just now';
    if (m < 60)  return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24)  return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ---- Signal type helpers ------------------------------------------------ */
  var SIGNAL_LABELS = {
    scarcity:          'Low Inventory',
    price_favorable:   'Price Movement',
    price_unfavorable: 'Market Shift',
    restock:           'Back in Stock',
    market_movement:   'Market Movement',
  };

  function severityClass(s) {
    return 'fpr-severity-badge--' + (s || 'medium');
  }

  function movementPillClass(type) {
    return type === 'price_favorable' || type === 'restock'
      ? 'fpr-movement-pill--favorable'
      : 'fpr-movement-pill--unfavorable';
  }

  function inventoryWidth(count, threshold) {
    if (count === 0) return 0;
    var pct = Math.min(100, (count / Math.max(threshold * 2, 20)) * 100);
    return Math.max(4, pct);
  }

  function inventoryBarClass(count, threshold) {
    if (!count || count === 0)           return 'fpr-inventory-bar__fill--critical';
    if (count <= threshold)              return 'fpr-inventory-bar__fill--low';
    return 'fpr-inventory-bar__fill--ok';
  }

  var WATCH_STATUS_LABELS = {
    available:    'Available',
    scarce:       'Low Stock',
    out_of_stock: 'Out of Stock',
    map_zone:     'MAP Zone',
  };

  /* ============================================================================
     API CALLS
     ============================================================================ */

  async function fetchSignals() {
    if (state.demoMode) return DEMO_SIGNALS;
    var url = state.apiUrl + '/api/pulse/signals/' + state.memberId;
    var r = await fetch(url);
    if (!r.ok) throw new Error('Signal fetch failed');
    return await r.json();
  }

  async function fetchWatchlist() {
    if (state.demoMode) return { items: DEMO_WATCHLIST };
    var r = await fetch(state.apiUrl + '/api/pulse/watchlist/' + state.memberId);
    if (!r.ok) throw new Error('Watchlist fetch failed');
    return await r.json();
  }

  async function markRead(deliveryId) {
    if (state.demoMode) return;
    await fetch(state.apiUrl + '/api/pulse/signals/' + deliveryId + '/read', { method: 'POST' });
  }

  async function dismissSignal(deliveryId) {
    if (state.demoMode) return;
    await fetch(state.apiUrl + '/api/pulse/signals/' + deliveryId + '/dismiss', { method: 'POST' });
  }

  async function markAllRead() {
    if (state.demoMode) { state.signals.forEach(s => { s.dashboard_read_at = new Date().toISOString(); }); return; }
    await fetch(state.apiUrl + '/api/pulse/signals/read-all/' + state.memberId, { method: 'POST' });
  }

  async function searchSkus(q) {
    if (state.demoMode) return DEMO_SKU_SEARCH.filter(s =>
      s.product_name.toLowerCase().includes(q.toLowerCase()) ||
      s.brand.toLowerCase().includes(q.toLowerCase())
    );
    var r = await fetch(state.apiUrl + '/api/pulse/sku-search?q=' + encodeURIComponent(q) + '&limit=10');
    if (!r.ok) return [];
    var d = await r.json();
    return d.results || [];
  }

  async function addToWatchlist(skuId) {
    if (state.demoMode) {
      state.watchedSkuIds.add(skuId);
      return;
    }
    await fetch(state.apiUrl + '/api/pulse/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: state.memberId, skuId, reason: 'manual' }),
    });
    state.watchedSkuIds.add(skuId);
  }

  async function removeFromWatchlist(skuId) {
    if (state.demoMode) { state.watchedSkuIds.delete(skuId); return; }
    await fetch(state.apiUrl + '/api/pulse/watchlist/' + state.memberId + '/' + skuId, {
      method: 'DELETE',
    });
    state.watchedSkuIds.delete(skuId);
  }

  /* ============================================================================
     RENDERING
     ============================================================================ */

  function renderBell(container) {
    var badge = container.querySelector('.fpr-bell__badge');
    if (!badge) return;
    badge.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount;
    badge.classList.toggle('has-unread', state.unreadCount > 0);

    var bell = container.querySelector('.fpr-bell');
    if (state.unreadCount > 0) {
      bell.classList.add('is-ringing');
      setTimeout(function () { bell.classList.remove('is-ringing'); }, 1200);
    }
  }

  function renderTabs(container) {
    var tabs = container.querySelectorAll('.fpr-tab[data-filter]');
    tabs.forEach(function (t) {
      var filter = t.dataset.filter;
      t.classList.toggle('is-active', filter === state.activeTab);

      /* Tab counts */
      var count = filter === 'all' ? state.signals.length
        : state.signals.filter(s => s.signal_type === filter).length;

      var countEl = t.querySelector('.fpr-tab__count');
      if (countEl) countEl.textContent = count;
    });
  }

  /* ---- MAP-restricted signal card ---------------------------------------- */
  function renderMapCard(signal) {
    var card = document.createElement('div');
    card.className = 'fpr-signal-card fpr-signal-card--map';
    card.dataset.deliveryId = signal.delivery_id;
    if (signal.dashboard_read_at) card.classList.add('is-read');

    // Logged out / no session → real FPRMembers login page. Logged in → the member's signal page.
    // (A configured-but-preview embed with no apiUrl falls back to '#'.)
    var loginUrl = state.loggedOut ? state.loginUrl
                 : (state.demoMode ? '#' : state.apiUrl.replace('/api','') + '/member/signals?signal=' + signal.signal_id);

    card.innerHTML =
      '<div class="fpr-signal-card__inner">' +
        '<div class="fpr-signal-card__icon">' +
          '<svg viewBox="0 0 24 24"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"/></svg>' +
        '</div>' +
        '<div class="fpr-signal-card__content">' +
          '<span class="fpr-signal-card__badge">' +
            '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
            'Strategic Buy Zone' +
          '</span>' +
          /* REQUIRED TEXT — verbatim per MAP rule */
          '<p class="fpr-signal-card__headline">An item on your watchlist has entered your Strategic Buy Zone.</p>' +
          '<p class="fpr-signal-card__subtext">Log in to see availability.</p>' +
        '</div>' +
        '<a href="' + escHtml(loginUrl) + '" class="fpr-signal-card__cta">' +
          'Log In' +
          '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</a>' +
      '</div>' +
      '<div class="fpr-signal-card__meta">' +
        '<span class="fpr-signal-card__timestamp">' + timeAgo(signal.delivered_at) + '</span>' +
        '<button class="fpr-signal-card__dismiss" data-action="dismiss" data-id="' + escHtml(signal.delivery_id) + '">Dismiss</button>' +
      '</div>';

    return card;
  }

  /* ---- Full-pricing signal card ------------------------------------------ */
  function renderFullCard(signal) {
    var card = document.createElement('div');
    card.className = 'fpr-signal-card fpr-signal-card--full';
    card.dataset.deliveryId = signal.delivery_id;
    window.fprAwardTicket('deal_signal_viewed', { deliveryId: signal.delivery_id });
    if (signal.dashboard_read_at) card.classList.add('is-read');

    var movPct  = signal.deviation_pct != null ? Math.abs(parseFloat(signal.deviation_pct)).toFixed(1) + '%' : '—';
    var movDir  = signal.deviation_pct > 0 ? '▼' : '▲';
    var movLabel = signal.deviation_pct > 0 ? 'below avg' : 'above avg';
    var threshold = 10; /* default scarcity threshold */

    var invPct  = inventoryWidth(signal.current_inventory, threshold);
    var invBarClass = inventoryBarClass(signal.current_inventory, threshold);
    var invLabel = signal.current_inventory != null
      ? (signal.current_inventory === 0 ? 'Out of Stock' :
         signal.current_inventory <= 3  ? 'Critical — ' + signal.current_inventory + ' left' :
         signal.current_inventory + ' units remaining')
      : 'Limited';

    var ctaUrl = state.demoMode ? '#' : (state.apiUrl.replace('/api','') + '/products/' + signal.sku_id);

    card.innerHTML =
      '<div class="fpr-signal-card__header">' +
        '<div class="fpr-signal-card__product">' +
          '<div class="fpr-signal-card__brand">' + escHtml(signal.brand) + ' &middot; ' + escHtml(signal.category || '') + '</div>' +
          '<div class="fpr-signal-card__name">' + escHtml(signal.product_name) + '</div>' +
        '</div>' +
        '<span class="fpr-severity-badge ' + severityClass(signal.severity) + '">' + escHtml((signal.severity || '').toUpperCase()) + '</span>' +
      '</div>' +

      '<div class="fpr-signal-card__pricing">' +
        '<div class="fpr-price-cell">' +
          '<div class="fpr-price-cell__label">Current Price</div>' +
          '<div class="fpr-price-cell__value fpr-price-cell__value--favorable">' + fmt(signal.current_price) + '</div>' +
        '</div>' +
        '<div class="fpr-price-cell">' +
          '<div class="fpr-price-cell__label">30-Day Avg</div>' +
          '<div class="fpr-price-cell__value fpr-price-cell__value--muted">' + fmt(signal.avg_30d_price) + '</div>' +
        '</div>' +
        '<div class="fpr-price-cell">' +
          '<div class="fpr-price-cell__label">Movement</div>' +
          '<div style="margin-top:4px">' +
            '<span class="fpr-movement-pill ' + movementPillClass(signal.signal_type) + '">' +
              movDir + ' ' + movPct + ' ' + movLabel +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="fpr-signal-card__inventory">' +
        '<span class="fpr-inventory-label">' + escHtml(invLabel) + '</span>' +
        '<div class="fpr-inventory-bar">' +
          '<div class="fpr-inventory-bar__fill ' + invBarClass + '" style="width:' + invPct + '%"></div>' +
        '</div>' +
      '</div>' +

      '<div class="fpr-signal-card__footer">' +
        '<span class="fpr-signal-card__timestamp">' + escHtml(SIGNAL_LABELS[signal.signal_type] || 'Signal') + ' &middot; ' + timeAgo(signal.delivered_at) + '</span>' +
        '<div class="fpr-signal-card__actions">' +
          '<button class="fpr-dismiss-btn" data-action="dismiss" data-id="' + escHtml(signal.delivery_id) + '">Dismiss</button>' +
          '<a href="' + escHtml(ctaUrl) + '" class="fpr-atc-btn">' +
            'Add to Cart' +
          '</a>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;padding:0 12px 12px">' +
        '<button onclick="FPRShare.open(\'Share This Deal\')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
          'Share This Deal' +
        '</button>' +
      '</div>';

    return card;
  }

  function renderSignalCard(signal) {
    return signal.content_variant === 'map_restricted'
      ? renderMapCard(signal)
      : renderFullCard(signal);
  }

  function renderSignals(container) {
    var list = container.querySelector('.fpr-signals-list');
    if (!list) return;

    var filtered = state.activeTab === 'all'
      ? state.signals
      : state.signals.filter(function (s) { return s.signal_type === state.activeTab; });

    list.innerHTML = '';

    if (filtered.length === 0) {
      list.innerHTML =
        '<div class="fpr-empty-state">' +
          '<div class="fpr-empty-state__icon"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>' +
          '<p class="fpr-empty-state__title">No Opportunity Signals</p>' +
          '<p class="fpr-empty-state__text">When items on your watchlist show significant movement or low inventory, your signals will appear here.</p>' +
        '</div>';
      return;
    }

    filtered.forEach(function (signal) {
      list.appendChild(renderSignalCard(signal));
    });
  }

  function renderWatchlist(container) {
    var grid = container.querySelector('.fpr-watchlist-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (state.watchlist.length === 0) {
      grid.innerHTML =
        '<div class="fpr-empty-state" style="grid-column:1/-1">' +
          '<div class="fpr-empty-state__icon"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>' +
          '<p class="fpr-empty-state__title">Your watchlist is empty</p>' +
          '<p class="fpr-empty-state__text">Add SKUs to start receiving Opportunity Signals.</p>' +
        '</div>';
      return;
    }

    state.watchlist.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'fpr-watchlist-item';
      div.dataset.skuId = item.sku_id;

      var statusLabel = WATCH_STATUS_LABELS[item.watchlist_status] || item.watchlist_status;
      var statusClass = 'fpr-watch-status--' + (item.watchlist_status || 'available');

      /* MAP rule: never show price for MAP-restricted items */
      var priceHtml = item.is_under_map
        ? '<span class="fpr-watchlist-item__price fpr-watchlist-item__price--hidden">Member pricing — log in</span>'
        : '<span class="fpr-watchlist-item__price">' + fmt(item.best_price) + '</span>';

      var signalHtml = item.unread_signals > 0
        ? '<span class="fpr-watchlist-item__signals fpr-watchlist-item__signals--active">⚡ ' + item.unread_signals + ' active signal' + (item.unread_signals > 1 ? 's' : '') + '</span>'
        : '<span class="fpr-watchlist-item__signals">Monitoring</span>';

      div.innerHTML =
        '<button class="fpr-watchlist-item__remove" data-action="remove" data-sku-id="' + escHtml(item.sku_id) + '" title="Remove from watchlist">' +
          '<svg viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>' +
        '</button>' +
        '<div class="fpr-watchlist-item__brand">' + escHtml(item.brand) + '</div>' +
        '<div class="fpr-watchlist-item__name">' + escHtml(item.product_name) + '</div>' +
        '<span class="fpr-watch-status ' + statusClass + '">' +
          '<span class="fpr-watch-status__dot"></span>' + escHtml(statusLabel) +
        '</span>' +
        priceHtml +
        signalHtml;

      grid.appendChild(div);
    });
  }

  /* ============================================================================
     SEARCH OVERLAY
     ============================================================================ */

  var searchDebounce = null;

  function openSearch(container) {
    var overlay = container.querySelector('.fpr-search-overlay');
    if (overlay) overlay.classList.add('is-open');
    var input = container.querySelector('.fpr-search-input');
    if (input) { input.value = ''; input.focus(); }
    var results = container.querySelector('.fpr-search-results');
    if (results) results.innerHTML = '';
  }

  function closeSearch(container) {
    var overlay = container.querySelector('.fpr-search-overlay');
    if (overlay) overlay.classList.remove('is-open');
  }

  async function handleSearchInput(container, q) {
    clearTimeout(searchDebounce);
    if (q.trim().length < 2) {
      container.querySelector('.fpr-search-results').innerHTML = '';
      return;
    }
    searchDebounce = setTimeout(async function () {
      var results = await searchSkus(q).catch(function () { return []; });
      renderSearchResults(container, results);
    }, 300);
  }

  function renderSearchResults(container, results) {
    var el = container.querySelector('.fpr-search-results');
    if (!el) return;

    el.innerHTML = '';

    if (results.length === 0) {
      el.innerHTML = '<div style="padding:16px 18px;font-size:13px;color:#9AA3AF;">No SKUs found.</div>';
      return;
    }

    results.forEach(function (sku) {
      var row = document.createElement('div');
      row.className = 'fpr-search-result';
      var isWatched = state.watchedSkuIds.has(sku.id);

      row.innerHTML =
        '<div class="fpr-search-result__info">' +
          '<div class="fpr-search-result__brand">' + escHtml(sku.brand) + '</div>' +
          '<div class="fpr-search-result__name">' + escHtml(sku.product_name) + '</div>' +
        '</div>' +
        '<button class="fpr-search-result__add ' + (isWatched ? 'is-added' : '') + '" data-sku-id="' + escHtml(sku.id) + '" type="button">' +
          (isWatched ? 'Watching' : 'Watch') +
        '</button>';

      var addBtn = row.querySelector('.fpr-search-result__add');
      addBtn.addEventListener('click', async function () {
        if (isWatched) return;
        await addToWatchlist(sku.id);
        addBtn.textContent = 'Watching';
        addBtn.classList.add('is-added');
        isWatched = true;
        /* Refresh watchlist */
        var wlData = await fetchWatchlist().catch(function () { return { items: [] }; });
        state.watchlist = wlData.items || [];
        renderWatchlist(container);
      });

      el.appendChild(row);
    });
  }

  /* ============================================================================
     EVENT BINDING
     ============================================================================ */

  function bindEvents(container) {
    /* Tab clicks */
    container.querySelectorAll('.fpr-tab[data-filter]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.activeTab = tab.dataset.filter;
        renderTabs(container);
        renderSignals(container);
      });
    });

    /* Mark all read */
    var markAllBtn = container.querySelector('[data-action="mark-all-read"]');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async function () {
        await markAllRead();
        state.signals.forEach(function (s) { s.dashboard_read_at = new Date().toISOString(); });
        state.unreadCount = 0;
        renderBell(container);
        renderSignals(container);
      });
    }

    /* Delegated: dismiss + read signals */
    container.querySelector('.fpr-signals-list')?.addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;

      var deliveryId = btn.dataset.id;
      var action     = btn.dataset.action;

      if (action === 'dismiss') {
        await dismissSignal(deliveryId);
        state.signals = state.signals.filter(function (s) { return s.delivery_id !== deliveryId; });
        var card = container.querySelector('[data-delivery-id="' + deliveryId + '"]');
        if (card) card.classList.add('is-dismissed');
        renderTabs(container);
        setTimeout(function () { renderSignals(container); }, 300);
      }
    });

    /* Signal card click → mark as read */
    container.querySelector('.fpr-signals-list')?.addEventListener('click', async function (e) {
      var card = e.target.closest('.fpr-signal-card');
      if (!card || card.classList.contains('is-read')) return;
      var deliveryId = card.dataset.deliveryId;
      if (deliveryId) {
        await markRead(deliveryId);
        card.classList.add('is-read');
        var sig = state.signals.find(function (s) { return s.delivery_id === deliveryId; });
        if (sig) sig.dashboard_read_at = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        renderBell(container);
      }
    });

    /* Watchlist: remove */
    container.querySelector('.fpr-watchlist-grid')?.addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-action="remove"]');
      if (!btn) return;
      var skuId = btn.dataset.skuId;
      await removeFromWatchlist(skuId);
      state.watchlist = state.watchlist.filter(function (w) { return w.sku_id !== skuId; });
      renderWatchlist(container);
    });

    /* Watchlist: add (opens search overlay) */
    var addBtn = container.querySelector('[data-action="add-to-watchlist"]');
    if (addBtn) addBtn.addEventListener('click', function () { openSearch(container); });

    /* Search overlay */
    var overlay = container.querySelector('.fpr-search-overlay');
    var searchInput = container.querySelector('.fpr-search-input');

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeSearch(container);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        handleSearchInput(container, searchInput.value);
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSearch(container);
      });
    }
  }

  /* ============================================================================
     INIT + POLL
     ============================================================================ */

  async function load(container) {
    try {
      var [signalData, watchlistData] = await Promise.all([
        fetchSignals(),
        fetchWatchlist(),
      ]);

      state.signals    = signalData.signals || signalData || [];
      state.unreadCount = signalData.unreadCount || state.signals.filter(function (s) { return !s.dashboard_read_at; }).length;
      state.watchlist  = watchlistData.items || watchlistData || [];
      state.watchedSkuIds = new Set(state.watchlist.map(function (w) { return w.sku_id; }));

      renderBell(container);
      renderTabs(container);
      renderSignals(container);
      renderWatchlist(container);

    } catch (err) {
      console.error('[FPR Pulse]', err);
    }
  }

  function startPolling(container) {
    /* Refresh leaderboard / signals every 90 seconds */
    state.pollInterval = setInterval(function () { load(container); }, 90000);
  }

  async function init() {
    var container = document.querySelector('.fpr-pulse');
    if (!container) return;

    // Pass an apiFallback so the resolver injects a working data-api-url even if the Webflow mount is
    // missing the attribute (otherwise the page silently runs in demo/logged-out mode).
    await window.__fprResolveMount(container, 'https://fpr-api-production.up.railway.app');
    state.memberId = container.dataset.memberId || 'demo-member';
    state.apiUrl   = container.dataset.apiUrl   || '';
    state.loginUrl = container.dataset.loginUrl || 'https://www.fprmembers.com/log-in';
    // Session not detected (missing/non-UUID member id): explicit logged-out state, real login CTA.
    state.loggedOut = !isRealMemberId(state.memberId);
    // Use demo content (and never hit the API with a bad id) when there's no API URL or no real session.
    state.demoMode = container.dataset.demo === 'true' || !state.apiUrl || state.loggedOut;

    bindEvents(container);
    load(container);
    startPolling(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ============================================================================
     DEMO DATA
     ============================================================================ */

  var DEMO_SIGNALS = {
    unreadCount: 3,
    signals: [
      {
        delivery_id:     'del-001',
        signal_id:       'sig-001',
        content_variant: 'map_restricted',
        signal_type:     'scarcity',
        severity:        'high',
        is_under_map:    true,
        current_price:   null,  /* never sent for MAP-restricted */
        avg_30d_price:   null,
        deviation_pct:   null,
        current_inventory: null,
        product_name:    'Glock 17 Gen5',
        brand:           'Glock',
        category:        'Handguns',
        sku:             'G17500203',
        sku_id:          'sku-glock-17',
        dashboard_read_at: null,
        delivered_at:    new Date(Date.now() - 14 * 60000).toISOString(),
      },
      {
        delivery_id:     'del-002',
        signal_id:       'sig-002',
        content_variant: 'full_pricing',
        signal_type:     'price_favorable',
        severity:        'medium',
        is_under_map:    false,
        current_price:   241.00,
        avg_30d_price:   299.00,
        deviation_pct:   19.4,
        current_inventory: 22,
        product_name:    'Taurus G3C 9mm',
        brand:           'Taurus',
        category:        'Handguns',
        sku:             '1-G3C931-12',
        sku_id:          'sku-taurus-g3c',
        dashboard_read_at: null,
        delivered_at:    new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        delivery_id:     'del-003',
        signal_id:       'sig-003',
        content_variant: 'map_restricted',
        signal_type:     'restock',
        severity:        'medium',
        is_under_map:    true,
        current_price:   null,
        avg_30d_price:   null,
        deviation_pct:   null,
        current_inventory: null,
        product_name:    'Sig Sauer P365 XL',
        brand:           'Sig Sauer',
        category:        'Handguns',
        sku:             '365XL-9-BXR3-10',
        sku_id:          'sku-sig-p365xl',
        dashboard_read_at: null,
        delivered_at:    new Date(Date.now() - 5 * 3600000).toISOString(),
      },
      {
        delivery_id:     'del-004',
        signal_id:       'sig-004',
        content_variant: 'full_pricing',
        signal_type:     'scarcity',
        severity:        'critical',
        is_under_map:    false,
        current_price:   379.00,
        avg_30d_price:   489.00,
        deviation_pct:   22.5,
        current_inventory: 2,
        product_name:    'S&W M&P Shield Plus',
        brand:           'Smith & Wesson',
        category:        'Handguns',
        sku:             '13244',
        sku_id:          'sku-sw-shield-plus',
        dashboard_read_at: new Date(Date.now() - 3600000).toISOString(),
        delivered_at:    new Date(Date.now() - 18 * 3600000).toISOString(),
      },
    ],
  };

  var DEMO_WATCHLIST = [
    { sku_id: 'sku-glock-17',    brand: 'Glock',          product_name: 'Glock 17 Gen5',      is_under_map: true,  best_price: null,   watchlist_status: 'map_zone',     unread_signals: 1 },
    { sku_id: 'sku-sig-p365xl',  brand: 'Sig Sauer',      product_name: 'P365 XL 9mm',         is_under_map: true,  best_price: null,   watchlist_status: 'map_zone',     unread_signals: 1 },
    { sku_id: 'sku-taurus-g3c',  brand: 'Taurus',         product_name: 'G3C 9mm',             is_under_map: false, best_price: 241.00, watchlist_status: 'available',    unread_signals: 1 },
    { sku_id: 'sku-sw-shield',   brand: 'Smith & Wesson', product_name: 'M&P Shield Plus',      is_under_map: false, best_price: 379.00, watchlist_status: 'scarce',       unread_signals: 1 },
    { sku_id: 'sku-ruger-1022',  brand: 'Ruger',          product_name: '10/22 Carbine',        is_under_map: true,  best_price: null,   watchlist_status: 'available',    unread_signals: 0 },
    { sku_id: 'sku-mossberg',    brand: 'Mossberg',        product_name: '500 Field 12ga',       is_under_map: false, best_price: 398.00, watchlist_status: 'available',    unread_signals: 0 },
  ];

  var DEMO_SKU_SEARCH = [
    { id: 'sku-hellcat',       brand: 'Springfield',   product_name: 'Hellcat OSP 9mm',    is_under_map: false },
    { id: 'sku-glock-19',      brand: 'Glock',         product_name: 'Glock 19 Gen5 9mm',  is_under_map: true  },
    { id: 'sku-rem-870',       brand: 'Remington',      product_name: '870 Express 12ga',   is_under_map: false },
    { id: 'sku-ruger-american',brand: 'Ruger',          product_name: 'American Rifle .308',is_under_map: false },
    { id: 'sku-henry-golden',  brand: 'Henry',          product_name: 'Golden Boy .22 LR',  is_under_map: false },
  ];

  global.FPRPulse = { reload: function () { var c = document.querySelector('.fpr-pulse'); if (c) load(c); } };

}(typeof window !== 'undefined' ? window : this));
