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

/* ============================================================
   FPR Concierge Lite — Build 15
   Floating chat widget — Webflow-embeddable IIFE
   Usage: FPRConcierge.init(el)  where el has data-* attributes
   ============================================================ */

(function (root, factory) {
  root.FPRConcierge = factory();
}(window, function () {
  'use strict';

  const API_BASE = window.FPR_CONCIERGE_API || 'https://concierge.fpr.localhost:3015';

  // ─── SVG ICONS ──────────────────────────────────────────────
  const ICON = {
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    warn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  };

  // ─── HELPERS ────────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function fmtTime(iso) {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  async function api(path, method = 'GET', body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // ─── WIDGET FACTORY ─────────────────────────────────────────
  function createWidget(mountEl) {
    // Read product data attributes from mount element
    const memberId      = mountEl.dataset.memberId      || 'demo';
    const productSku    = mountEl.dataset.productSku    || '';
    const productName   = mountEl.dataset.productName   || '';
    const productBrand  = mountEl.dataset.productBrand  || '';
    const productCaliber= mountEl.dataset.productCaliber|| '';
    const productCat    = mountEl.dataset.productCategory|| '';
    const isMapCovered  = mountEl.dataset.isMapCovered === 'true';

    // Widget state
    let sessionId   = null;
    let isOpen      = false;
    let isSending   = false;
    let sessionEnded= false;
    let msgCount    = 0;

    // ─── BUILD DOM ──────────────────────────────────────────
    const root = el('div', 'fpr-cc');

    // Launcher button
    const launcher = el('button', 'fpr-cc-launcher');
    launcher.setAttribute('aria-label', 'Chat with FPR Concierge');
    launcher.innerHTML = ICON.chat;
    const badge = el('span', 'fpr-cc-badge');
    badge.textContent = '1';
    badge.setAttribute('hidden', '');
    launcher.appendChild(badge);

    // Panel
    const panel = el('div', 'fpr-cc-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'FPR Concierge');

    // Header
    const header = el('div', 'fpr-cc-header');
    header.innerHTML = `
      <div class="fpr-cc-avatar">${ICON.star}</div>
      <div class="fpr-cc-header-info">
        <div class="fpr-cc-header-title">FPR Concierge</div>
        <div class="fpr-cc-live">
          <div class="fpr-cc-live-dot"></div>
          <span>Your personal firearms advisor</span>
        </div>
      </div>
      <div class="fpr-cc-header-actions">
        <button class="fpr-cc-icon-btn" id="cc-refresh-btn" title="New conversation">${ICON.refresh}</button>
        <button class="fpr-cc-icon-btn" id="cc-close-btn" title="Close">${ICON.close}</button>
      </div>`;

    // Product bar
    const productBar = el('div', 'fpr-cc-product-bar');
    if (productName) {
      productBar.innerHTML = `
        <span class="fpr-cc-product-name">${esc(productName)}${productBrand ? ` · ${esc(productBrand)}` : ''}</span>
        <span class="fpr-cc-product-tag ${isMapCovered ? 'fpr-cc-product-tag--map' : 'fpr-cc-product-tag--open'}">
          ${isMapCovered ? 'MAP Protected' : 'Open Pricing'}
        </span>`;
    } else {
      productBar.setAttribute('hidden', '');
    }

    // MAP notice
    const mapNotice = el('div', 'fpr-cc-map-notice');
    mapNotice.innerHTML = `${ICON.lock}<span>Pricing on this item is available at checkout — add to cart to see your member pricing.</span>`;
    if (!isMapCovered) mapNotice.setAttribute('hidden', '');

    // Messages container
    const messages = el('div', 'fpr-cc-messages');
    messages.setAttribute('aria-live', 'polite');

    // Typing indicator
    const typing = el('div', 'fpr-cc-typing');
    typing.setAttribute('hidden', '');
    typing.innerHTML = `
      <div class="fpr-cc-msg-avatar">${ICON.star}</div>
      <div class="fpr-cc-typing-bubble">
        <span class="fpr-cc-dot"></span>
        <span class="fpr-cc-dot"></span>
        <span class="fpr-cc-dot"></span>
      </div>`;

    // Quick replies
    const quickRepliesBar = el('div', 'fpr-cc-quick-replies');
    quickRepliesBar.setAttribute('hidden', '');

    // Session ended notice
    const endedNotice = el('div', 'fpr-cc-ended-notice');
    endedNotice.setAttribute('hidden', '');
    endedNotice.innerHTML = `Conversation ended. <button id="cc-restart-btn">Start a new one</button>`;

    // Input area
    const inputArea = el('div', 'fpr-cc-input-area');
    inputArea.innerHTML = `
      <div class="fpr-cc-input-row">
        <textarea class="fpr-cc-input" id="cc-input" placeholder="Ask anything about this firearm…" rows="1" maxlength="1500"></textarea>
        <button class="fpr-cc-send-btn" id="cc-send-btn" disabled>${ICON.send}</button>
      </div>
      <div class="fpr-cc-input-footer">
        ${ICON.lock} FPR Concierge · Powered by Claude · <a href="https://fprmembers.com" target="_blank">fprmembers.com</a>
      </div>`;

    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(productBar);
    panel.appendChild(mapNotice);
    panel.appendChild(messages);
    panel.appendChild(typing);
    panel.appendChild(quickRepliesBar);
    panel.appendChild(endedNotice);
    panel.appendChild(inputArea);

    root.appendChild(panel);
    root.appendChild(launcher);
    mountEl.appendChild(root);

    // ─── ELEMENT REFS ────────────────────────────────────
    const inputEl    = panel.querySelector('#cc-input');
    const sendBtn    = panel.querySelector('#cc-send-btn');
    const closeBtn   = panel.querySelector('#cc-close-btn');
    const refreshBtn = panel.querySelector('#cc-refresh-btn');
    const restartBtn = panel.querySelector('#cc-restart-btn');

    // ─── RENDER HELPERS ─────────────────────────────────
    function scrollToBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    function showTyping(show) {
      if (show) {
        typing.removeAttribute('hidden');
        messages.appendChild(typing);
      } else {
        typing.setAttribute('hidden', '');
      }
      scrollToBottom();
    }

    function addBubble(role, content, opts = {}) {
      const isConcierge = role === 'concierge';
      const wrapper = el('div', `fpr-cc-msg fpr-cc-msg--${role}`);

      const avatarEl = el('div', 'fpr-cc-msg-avatar');
      avatarEl.innerHTML = isConcierge ? ICON.star : '👤';

      const body = el('div', 'fpr-cc-msg-body');
      const bubble = el('div', 'fpr-cc-bubble');

      // Convert newlines to paragraphs for readability
      const formatted = esc(content)
        .split(/\n\n+/)
        .map(p => `<p style="margin-bottom:6px">${p.replace(/\n/g,'<br>')}</p>`)
        .join('');
      bubble.innerHTML = formatted;

      const timeEl = el('span', 'fpr-cc-msg-time', fmtTime(opts.created_at));

      body.appendChild(bubble);
      body.appendChild(timeEl);

      // Feedback buttons on concierge messages
      if (isConcierge && opts.messageId) {
        const fb = el('div', 'fpr-cc-feedback');
        const upBtn = el('button', 'fpr-cc-feedback-btn', '👍');
        const dnBtn = el('button', 'fpr-cc-feedback-btn', '👎');
        upBtn.title = 'Helpful';
        dnBtn.title = 'Not helpful';
        upBtn.addEventListener('click', () => submitFeedback(opts.messageId, true, upBtn, dnBtn));
        dnBtn.addEventListener('click', () => submitFeedback(opts.messageId, false, upBtn, dnBtn));
        fb.appendChild(upBtn);
        fb.appendChild(dnBtn);
        body.appendChild(fb);

        const shareWrap = el('div');
        shareWrap.style.cssText = 'display:flex;justify-content:flex-end;margin-top:8px';
        shareWrap.innerHTML = '<button onclick="FPRShare.open(\'Share This Answer\')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share This Answer</button>';
        body.appendChild(shareWrap);
      }

      wrapper.appendChild(avatarEl);
      wrapper.appendChild(body);

      // Insert before typing indicator if visible
      messages.insertBefore(wrapper, typing.hasAttribute('hidden') ? null : typing);
      scrollToBottom();
      return wrapper;
    }

    function addError(text) {
      const e = el('div', 'fpr-cc-error');
      e.innerHTML = `${ICON.warn}<span>${esc(text)}</span>`;
      messages.appendChild(e);
      scrollToBottom();
      setTimeout(() => e.remove(), 8000);
    }

    function renderQuickReplies(replies) {
      quickRepliesBar.innerHTML = '';
      if (!replies || !replies.length) {
        quickRepliesBar.setAttribute('hidden', '');
        return;
      }
      replies.forEach(text => {
        const chip = el('button', 'fpr-cc-quick-chip', esc(text));
        chip.addEventListener('click', () => {
          quickRepliesBar.setAttribute('hidden', '');
          sendMessage(text);
        });
        quickRepliesBar.appendChild(chip);
      });
      quickRepliesBar.removeAttribute('hidden');
    }

    // ─── FEEDBACK ────────────────────────────────────────
    async function submitFeedback(messageId, helpful, upBtn, dnBtn) {
      upBtn.classList.toggle('fpr-cc-fb-active', helpful);
      dnBtn.classList.toggle('fpr-cc-fb-active', !helpful);
      upBtn.disabled = true;
      dnBtn.disabled = true;
      try {
        await api(`/api/concierge/session/${sessionId}/feedback`, 'POST', {
          member_id: memberId,
          message_id: messageId,
          helpful,
        });
      } catch { /* non-critical */ }
    }

    // ─── SESSION ─────────────────────────────────────────
    async function startSession() {
      messages.innerHTML = '';
      quickRepliesBar.setAttribute('hidden', '');
      endedNotice.setAttribute('hidden', '');
      sessionId = null;
      sessionEnded = false;
      msgCount = 0;
      sendBtn.disabled = true;
      showTyping(true);

      try {
        const data = await api('/api/concierge/session/start', 'POST', {
          member_id: memberId,
          product_sku: productSku || undefined,
          product_name: productName || undefined,
          product_brand: productBrand || undefined,
          product_caliber: productCaliber || undefined,
          product_category: productCat || undefined,
          is_map_covered: isMapCovered,
        });

        sessionId = data.session_id;
        showTyping(false);
        addBubble('concierge', data.opening_message);
        renderQuickReplies(data.quick_replies);
        sendBtn.disabled = false;
        inputEl.focus();
        badge.setAttribute('hidden', '');
      } catch (err) {
        showTyping(false);
        addError('Couldn\'t connect to your Concierge right now. Please try again in a moment.');
      }
    }

    // ─── SEND MESSAGE ─────────────────────────────────────
    async function sendMessage(text) {
      const content = (text || inputEl.value).trim();
      if (!content || isSending || sessionEnded) return;
      if (!sessionId) { addError('Session not started — please refresh.'); return; }

      isSending = true;
      sendBtn.disabled = true;
      inputEl.value = '';
      autoResizeInput();
      quickRepliesBar.setAttribute('hidden', '');

      addBubble('member', content);
      showTyping(true);

      try {
        const data = await api(`/api/concierge/session/${sessionId}/message`, 'POST', {
          member_id: memberId,
          content,
        });

        showTyping(false);
        addBubble('concierge', data.response, {
          messageId: data.message_id,
          created_at: data.created_at,
        });
        window.fprAwardTicket('concierge_answer_received', {});

        msgCount += 2;
        if (msgCount >= 44) {
          // Warn approaching limit
          const warn = el('div', 'fpr-cc-error');
          warn.innerHTML = `${ICON.warn}<span>You're near the conversation limit — start a new session when you're ready.</span>`;
          messages.appendChild(warn);
          scrollToBottom();
        }
      } catch (err) {
        showTyping(false);
        const msg = err.message || '';
        if (msg.includes('ended') || msg.includes('limit')) {
          sessionEnded = true;
          inputArea.querySelector('.fpr-cc-input-row').style.opacity = '0.4';
          inputEl.disabled = true;
          endedNotice.removeAttribute('hidden');
        } else {
          addError(err.message || 'Something went wrong. Please try again.');
        }
      } finally {
        isSending = false;
        if (!sessionEnded) sendBtn.disabled = false;
      }
    }

    // ─── INPUT AUTO-RESIZE ────────────────────────────────
    function autoResizeInput() {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
    }

    // ─── OPEN / CLOSE ────────────────────────────────────
    function open() {
      isOpen = true;
      panel.classList.add('fpr-cc-open');
      launcher.innerHTML = ICON.close + badge.outerHTML;
      badge.setAttribute('hidden', '');
      if (!sessionId) startSession();
      else inputEl.focus();
    }

    function close() {
      isOpen = false;
      panel.classList.remove('fpr-cc-open');
      launcher.innerHTML = ICON.chat + badge.outerHTML;
    }

    function toggle() { isOpen ? close() : open(); }

    // ─── END SESSION ─────────────────────────────────────
    async function endSession() {
      if (sessionId) {
        api(`/api/concierge/session/${sessionId}/end`, 'POST').catch(() => {});
      }
    }

    // ─── EVENTS ──────────────────────────────────────────
    launcher.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);

    refreshBtn.addEventListener('click', () => {
      if (sessionId) endSession();
      startSession();
    });

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        if (sessionId) endSession();
        startSession();
      });
    }

    sendBtn.addEventListener('click', () => sendMessage());

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    inputEl.addEventListener('input', () => {
      autoResizeInput();
      sendBtn.disabled = !inputEl.value.trim() || isSending;
    });

    // Show the unread badge after a short delay to attract attention
    setTimeout(() => {
      if (!isOpen) {
        badge.removeAttribute('hidden');
        badge.textContent = '1';
      }
    }, 3000);

    return { open, close, toggle };
  }

  // ─── PUBLIC API ──────────────────────────────────────────────
  function init(el) {
    if (!el) {
      console.warn('[FPRConcierge] No mount element provided.');
      return;
    }
    return createWidget(el);
  }

  function autoInit() {
    document.querySelectorAll('[data-fpr-concierge]').forEach(el => window.__fprResolveMount(el).then(function(){ init(el); }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  return { init };
}));
