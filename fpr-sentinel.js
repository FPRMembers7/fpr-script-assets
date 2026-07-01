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
 * FPRMembers.com — Build 7: Sentinel Intelligence Brief
 * File: fpr-sentinel.js
 *
 * Usage:
 *   <div class="fpr-sentinel-mount"
 *        data-api-url="https://your-api.com"
 *        data-member-id="MEMBER_ID"
 *        data-member-name="MEMBER_NAME">
 *   </div>
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // SVG Icons
  // -------------------------------------------------------------------------
  const IC = {
    brief:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    gavel:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>`,
    chart:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    search:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    signal:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>`,
    bell:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    setup:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    shield:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    trash:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    chevron:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
    warning:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    eye:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    info:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    trend_up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  };

  function ic(name) { return `<span style="display:inline-flex;align-items:center;width:1em;height:1em">${IC[name] || ''}</span>`; }

  // -------------------------------------------------------------------------
  // Demo brief (realistic full brief for standalone preview)
  // -------------------------------------------------------------------------
  const DEMO_BRIEF = {
    // CONTAINMENT (2026-06): all sample legislative + hidden-amendment content removed. Sentinel's
    // legislative monitor is pending a verified data source; no bills are shown until then. This demo
    // object is intentionally empty so no unverified/fabricated legislation can ever render.
    brief_week: '',
    brief_date: '',
    threat_count_critical: 0,
    threat_count_high: 0,
    threat_count_watch: 0,
    executive_summary: 'No verified firearm-related federal legislation is currently flagged.',
    sections_json: [
      { id: 'legislative',       title: 'Legislative Threat Monitor',  icon: 'gavel',  items: [] },
      { id: 'availability',      title: 'Future Availability Outlook', icon: 'chart',  items: [] },
      { id: 'hidden_amendments', title: 'Hidden Amendment Scanner',    icon: 'search', items: [] },
      { id: 'market',            title: 'Market Intelligence',         icon: 'signal', map_compliant: true, items: [] },
    ],
    action_items: [],
    disclaimer: 'For informational purposes only. Not legal advice. Always consult a qualified firearms attorney for legal guidance.',
  };

  const DEMO_PROFILE = {
    state_code: '', city_name: '', zip_code: '',
    carry_permit_type: 'none', profile_complete: false,
  };

  const DEMO_FIREARMS = [];

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  let state = {
    apiUrl: '', memberId: '', memberName: '',
    view: 'brief',    // setup | brief | legislative | availability | notifications
    profile: DEMO_PROFILE,
    firearms: [...DEMO_FIREARMS],
    brief: DEMO_BRIEF,
    openSections: new Set(['legislative']),
    pushEnabled: false,
    alertPrefs: { legislative: true, availability: true, hidden_amendments: true, market: true },
    root: null,
    pendingFirearm: {},
  };

  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------
  async function api(path, opts = {}) {
    if (!state.apiUrl) return null;
    try {
      const r = await fetch(state.apiUrl + path, {
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
        ...opts,
      });
      return r.ok ? r.json() : null;
    } catch { return null; }
  }

  async function loadData() {
    const [profileData, briefData] = await Promise.all([
      api(`/api/sentinel/member/${state.memberId}/profile`),
      api(`/api/sentinel/member/${state.memberId}/brief`),
    ]);
    if (profileData?.profile) { state.profile = profileData.profile; state.firearms = profileData.firearms || []; }
    if (briefData?.brief) {
      const b = briefData.brief;
      b.sections_json = typeof b.sections_json === 'string' ? JSON.parse(b.sections_json) : b.sections_json;
      b.action_items  = typeof b.action_items  === 'string' ? JSON.parse(b.action_items)  : b.action_items;
      state.brief = b;
    }
    if (!state.profile?.profile_complete) state.view = 'setup';
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  function render() {
    state.root.innerHTML = '';
    state.root.appendChild(buildShell());
  }

  function buildShell() {
    const shell = el('div', 'fpr-sentinel__shell');
    shell.appendChild(buildTopbar());
    shell.appendChild(buildSidebar());
    shell.appendChild(buildMain());
    return shell;
  }

  // ——— Topbar ———
  function buildTopbar() {
    const bar = el('div', 'fpr-sentinel__topbar');
    const tc  = state.brief;
    bar.innerHTML = `
      <div class="fpr-sentinel__topbar-logo">FPRMembers.com</div>
      <div class="fpr-sentinel__topbar-divider"></div>
      <div class="fpr-sentinel__topbar-title">
        <div class="fpr-sentinel__topbar-pulse"></div>
        Sentinel Intelligence Brief
      </div>
      <div class="fpr-sentinel__threat-counter">
        ${tc?.threat_count_critical ? `<div class="fpr-sentinel__threat-pill --critical">${IC.warning} ${tc.threat_count_critical} Critical</div>` : ''}
        ${tc?.threat_count_high     ? `<div class="fpr-sentinel__threat-pill --high">${tc.threat_count_high} High</div>` : ''}
        ${tc?.threat_count_watch    ? `<div class="fpr-sentinel__threat-pill --watch">${tc.threat_count_watch} Watch</div>` : ''}
      </div>
      <div class="fpr-sentinel__topbar-week">${tc?.brief_week || ''}</div>
    `;
    return bar;
  }

  // ——— Sidebar ———
  function buildSidebar() {
    const sb = el('div', 'fpr-sentinel__sidebar');
    const tc = state.brief;
    const critHigh = (tc?.threat_count_critical || 0) + (tc?.threat_count_high || 0);

    sb.innerHTML = `
      <div class="fpr-sentinel__sidebar-heading">Navigation</div>
      <div class="fpr-sentinel__nav">
        <button class="fpr-sentinel__nav-tab${state.view === 'brief' ? ' --active' : ''}" data-view="brief">
          <span style="width:15px;height:15px;display:flex">${IC.brief}</span> Intelligence Brief
          ${critHigh > 0 ? `<div class="fpr-sentinel__nav-tab-badge --critical">${critHigh}</div>` : ''}
        </button>
        <button class="fpr-sentinel__nav-tab${state.view === 'legislative' ? ' --active' : ''}" data-view="legislative">
          <span style="width:15px;height:15px;display:flex">${IC.gavel}</span> Legislative Monitor
        </button>
        <button class="fpr-sentinel__nav-tab${state.view === 'availability' ? ' --active' : ''}" data-view="availability">
          <span style="width:15px;height:15px;display:flex">${IC.chart}</span> Availability Tracker
        </button>
        <button class="fpr-sentinel__nav-tab${state.view === 'notifications' ? ' --active' : ''}" data-view="notifications">
          <span style="width:15px;height:15px;display:flex">${IC.bell}</span> Notifications
        </button>
        <button class="fpr-sentinel__nav-tab${state.view === 'setup' ? ' --active' : ''}" data-view="setup">
          <span style="width:15px;height:15px;display:flex">${IC.setup}</span> My Profile
        </button>
      </div>

      <div class="fpr-sentinel__sidebar-heading">Monitoring For</div>
      <div class="fpr-sentinel__sidebar-firearms">
        ${state.profile?.state_code ? `<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.35);padding:2px 4px 8px">📍 ${state.profile.city_name || state.profile.state_code}, ${state.profile.state_code}</div>` : ''}
        ${state.firearms.map(f => buildSidebarFirearm(f)).join('')}
        ${!state.firearms.length ? `<div style="font-size:12px;color:rgba(255,255,255,.25);padding:4px">No firearms registered yet</div>` : ''}
      </div>
    `;

    sb.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => { state.view = btn.dataset.view; render(); });
    });
    return sb;
  }

  function buildSidebarFirearm(f) {
    const emoji = { pistol: '🔫', revolver: '🔫', rifle: '🎯', shotgun: '🔫', suppressor: '🔇' }[f.firearm_type] || '🔫';
    return `
      <div class="fpr-sentinel__sidebar-firearm">
        <div class="fpr-sentinel__sidebar-firearm-icon">${emoji}</div>
        <div>
          <div class="fpr-sentinel__sidebar-firearm-name">${esc(f.make)} ${esc(f.model)}</div>
          <div class="fpr-sentinel__sidebar-firearm-cal">${esc(f.caliber)}${f.magazine_capacity ? ` · ${f.magazine_capacity}rd` : ''}</div>
        </div>
      </div>
    `;
  }

  // ——— Main ———
  function buildMain() {
    const main = el('div', 'fpr-sentinel__main');
    if (state.view === 'setup')          main.appendChild(buildSetupView());
    else if (state.view === 'brief')     main.appendChild(buildBriefView());
    else if (state.view === 'legislative') main.appendChild(buildLegislativeView());
    else if (state.view === 'availability') main.appendChild(buildAvailabilityView());
    else if (state.view === 'notifications') main.appendChild(buildNotificationsView());
    return main;
  }

  // ==========================================================================
  // VIEW: PROFILE SETUP
  // ==========================================================================
  function buildSetupView() {
    const wrap = el('div', 'fpr-sentinel__setup');
    wrap.innerHTML = `
      <div>
        <h2 style="font-size:22px;font-weight:800;margin:0 0 4px;color:var(--fpr-gray-900)">Sentinel Profile Setup</h2>
        <p style="font-size:14px;color:var(--fpr-gray-500);margin:0">Register your firearms and location so Sentinel can personalize every brief to your exact situation.</p>
      </div>

      <!-- Step 1: Location -->
      <div class="fpr-sentinel__setup-step">
        <div class="fpr-sentinel__setup-step-header">
          <div class="fpr-sentinel__setup-step-num">1</div>
          <div class="fpr-sentinel__setup-step-title">Your Location</div>
        </div>
        <div class="fpr-sentinel__form-row">
          <div class="fpr-sentinel__field">
            <label class="fpr-sentinel__label">Zip Code *</label>
            <input class="fpr-sentinel__input" id="fpr-zip" type="text" maxlength="10"
              placeholder="85001" value="${esc(state.profile?.zip_code || '')}" />
          </div>
          <div class="fpr-sentinel__field">
            <label class="fpr-sentinel__label">Carry Permit</label>
            <select class="fpr-sentinel__select" id="fpr-carry">
              <option value="none"     ${state.profile?.carry_permit_type === 'none'      ? 'selected' : ''}>No Permit / None</option>
              <option value="concealed"${state.profile?.carry_permit_type === 'concealed' ? 'selected' : ''}>Concealed Carry (CCW)</option>
              <option value="open"     ${state.profile?.carry_permit_type === 'open'      ? 'selected' : ''}>Open Carry</option>
              <option value="both"     ${state.profile?.carry_permit_type === 'both'      ? 'selected' : ''}>Both CCW and Open Carry</option>
            </select>
          </div>
          <div class="fpr-sentinel__field">
            <label class="fpr-sentinel__label">Email (for brief delivery)</label>
            <input class="fpr-sentinel__input" id="fpr-email" type="email"
              placeholder="you@email.com" value="${esc(state.profile?.email || '')}" />
          </div>
        </div>
        <button class="fpr-btn fpr-btn--sentinel fpr-btn--sm" id="fpr-save-location" style="margin-top:12px">
          ${IC.check} Save Location
        </button>
      </div>

      <!-- Step 2: Register Firearms -->
      <div class="fpr-sentinel__setup-step">
        <div class="fpr-sentinel__setup-step-header">
          <div class="fpr-sentinel__setup-step-num">2</div>
          <div class="fpr-sentinel__setup-step-title">Register Your Firearms</div>
        </div>
        <p style="font-size:13px;color:var(--fpr-gray-500);margin:0 0 14px">
          Sentinel uses your registered firearms to personalize every legislative alert — naming your specific guns when a bill would affect them.
        </p>

        <!-- Add firearm form -->
        <div class="fpr-sentinel__form-row" style="background:var(--fpr-white);border:1.5px solid var(--fpr-gray-200);border-radius:var(--fpr-radius);padding:14px;margin-bottom:12px">
          <div class="fpr-sentinel__field">
            <label class="fpr-sentinel__label">Make *</label>
            <input class="fpr-sentinel__input" id="fpr-make" placeholder="Glock, Sig Sauer…" />
          </div>
          <div class="fpr-sentinel__field">
            <label class="fpr-sentinel__label">Model *</label>
            <input class="fpr-sentinel__input" id="fpr-model" placeholder="17 Gen5, P320…" />
          </div>
          <div class="fpr-sentinel__field">
            <label class="fpr-sentinel__label">Caliber *</label>
            <input class="fpr-sentinel__input" id="fpr-caliber" placeholder="9mm, 5.56, .308…" />
          </div>
          <div class="fpr-sentinel__field">
            <label class="fpr-sentinel__label">Type</label>
            <select class="fpr-sentinel__select" id="fpr-type">
              <option value="pistol">Pistol</option>
              <option value="revolver">Revolver</option>
              <option value="rifle">Rifle</option>
              <option value="shotgun">Shotgun</option>
              <option value="suppressor">Suppressor / NFA</option>
            </select>
          </div>
          <div class="fpr-sentinel__field">
            <label class="fpr-sentinel__label">Std. Magazine Capacity</label>
            <input class="fpr-sentinel__input" id="fpr-mag-cap" type="number" placeholder="17" min="1" max="200" />
          </div>
          <div class="fpr-sentinel__field" style="display:flex;align-items:flex-end">
            <button class="fpr-btn fpr-btn--sentinel fpr-btn--sm" id="fpr-add-firearm" style="width:100%">
              ${IC.plus} Add Firearm
            </button>
          </div>
        </div>

        <!-- Firearm list -->
        <div class="fpr-sentinel__firearm-list" id="fpr-firearm-list">
          ${state.firearms.map(f => buildFirearmRow(f)).join('')}
          ${!state.firearms.length ? `<div style="font-size:13px;color:var(--fpr-gray-400);text-align:center;padding:16px">No firearms added yet.</div>` : ''}
        </div>
      </div>

      <!-- Step 3: Alert Preferences -->
      <div class="fpr-sentinel__setup-step">
        <div class="fpr-sentinel__setup-step-header">
          <div class="fpr-sentinel__setup-step-num">3</div>
          <div class="fpr-sentinel__setup-step-title">Alert Preferences</div>
        </div>
        ${buildAlertPrefsHtml()}
      </div>

      <div class="fpr-sentinel__disclaimer">⚠️ For informational purposes only. Not legal advice. Always consult a qualified firearms attorney for legal guidance.</div>

      <div>
        <button class="fpr-btn fpr-btn--gold" id="fpr-profile-complete" ${state.firearms.length ? '' : 'disabled'}>
          Activate Sentinel Monitoring →
        </button>
      </div>
    `;

    wrap.querySelector('#fpr-save-location')?.addEventListener('click', saveLocation.bind(null, wrap));
    wrap.querySelector('#fpr-add-firearm')?.addEventListener('click', addFirearm.bind(null, wrap));
    wrap.querySelector('#fpr-profile-complete')?.addEventListener('click', completeProfile);
    wrap.querySelectorAll('[data-remove-firearm]').forEach(btn => {
      btn.addEventListener('click', () => removeFirearm(btn.dataset.removeFirearm, wrap));
    });

    return wrap;
  }

  function buildFirearmRow(f) {
    const emoji = { pistol:'🔫', revolver:'🔫', rifle:'🎯', shotgun:'🔫', suppressor:'🔇' }[f.firearm_type] || '🔫';
    return `
      <div class="fpr-sentinel__firearm-row" data-firearm-id="${f.id}">
        <div class="fpr-sentinel__firearm-row-icon">${emoji}</div>
        <div class="fpr-sentinel__firearm-row-info">
          <div class="fpr-sentinel__firearm-row-name">${esc(f.make)} ${esc(f.model)}</div>
          <div class="fpr-sentinel__firearm-row-meta">${esc(f.caliber)} · ${esc(f.firearm_type)}${f.magazine_capacity ? ` · ${f.magazine_capacity}rd std` : ''}</div>
        </div>
        <button class="fpr-sentinel__firearm-row-remove" data-remove-firearm="${f.id}" title="Remove">✕</button>
      </div>
    `;
  }

  function buildAlertPrefsHtml() {
    const prefs = [
      { key: 'legislative',      label: 'Legislative Threats',    desc: 'Bills and laws affecting your firearms and carry rights.' },
      { key: 'availability',     label: 'Availability Outlook',   desc: 'Future Availability Score changes and scarcity signals.' },
      { key: 'market',           label: 'Market Intelligence',    desc: 'MAP-compliant availability and demand signals from the FPR dealer network.' },
    ];
    return prefs.map(p => `
      <div class="fpr-sentinel__toggle-row">
        <div>
          <div class="fpr-sentinel__toggle-label">${p.label}</div>
          <div class="fpr-sentinel__toggle-desc">${p.desc}</div>
        </div>
        <label class="fpr-sentinel__toggle">
          <input type="checkbox" ${state.alertPrefs[p.key] ? 'checked' : ''} data-pref="${p.key}" />
          <div class="fpr-sentinel__toggle-track"></div>
          <div class="fpr-sentinel__toggle-thumb"></div>
        </label>
      </div>
    `).join('');
  }

  async function saveLocation(wrap) {
    const zip   = wrap.querySelector('#fpr-zip')?.value?.trim();
    const carry = wrap.querySelector('#fpr-carry')?.value;
    const email = wrap.querySelector('#fpr-email')?.value?.trim();
    if (!zip) { showToast('Zip code is required.', 'critical'); return; }

    const data = await api('/api/sentinel/profile', {
      method: 'POST',
      body: JSON.stringify({ memberId: state.memberId, memberName: state.memberName, zipCode: zip, carryPermitType: carry, email }),
    });

    if (data?.ok) {
      state.profile = { ...state.profile, zip_code: zip, carry_permit_type: carry, email, state_code: data.stateCode, city_name: data.cityName };
      showToast(`Location set: ${data.cityName || zip}, ${data.stateCode}`, 'success');
    } else {
      state.profile = { ...state.profile, zip_code: zip, carry_permit_type: carry, state_code: zip.startsWith('8') ? 'AZ' : 'TX', city_name: 'Demo City' };
      showToast('Location saved (demo mode).', 'teal');
    }
    render();
  }

  async function addFirearm(wrap) {
    const make   = wrap.querySelector('#fpr-make')?.value?.trim();
    const model  = wrap.querySelector('#fpr-model')?.value?.trim();
    const caliber= wrap.querySelector('#fpr-caliber')?.value?.trim();
    const type   = wrap.querySelector('#fpr-type')?.value;
    const magCap = parseInt(wrap.querySelector('#fpr-mag-cap')?.value) || null;

    if (!make || !model || !caliber) { showToast('Make, model, and caliber are required.', 'critical'); return; }

    const newFirearm = { id: 'local-' + Date.now(), make, model, caliber, firearm_type: type, action_type: 'semi_auto', magazine_capacity: magCap };

    const data = await api(`/api/sentinel/member/${state.memberId}/firearms`, {
      method: 'POST',
      body: JSON.stringify({ make, model, caliber, firearmType: type, magazineCapacity: magCap }),
    });

    if (data?.firearm) { state.firearms.push(data.firearm); }
    else { state.firearms.push(newFirearm); }

    showToast(`${make} ${model} added to your Sentinel profile.`, 'success');
    render();
  }

  async function removeFirearm(id, wrap) {
    state.firearms = state.firearms.filter(f => f.id !== id);
    await api(`/api/sentinel/member/${state.memberId}/firearms/${id}`, { method: 'DELETE' });
    render();
  }

  async function completeProfile() {
    await api(`/api/sentinel/member/${state.memberId}/profile/complete`, { method: 'POST' });
    state.profile = { ...state.profile, profile_complete: true };
    state.view = 'brief';
    showToast('Sentinel is now monitoring your profile. Your first brief will be ready shortly.', 'success');
    render();
  }

  // ==========================================================================
  // VIEW: BRIEF
  // ==========================================================================
  function buildBriefView() {
    const brief = state.brief;
    if (!brief) {
      const wrap = el('div', 'fpr-sentinel__brief');
      wrap.innerHTML = `
        <div class="fpr-sentinel__empty">
          ${IC.brief}
          <p>No brief available yet. Your first brief will be generated on the next weekly cycle.</p>
          <button class="fpr-btn fpr-btn--sentinel" style="margin-top:16px" id="fpr-go-setup">Complete Profile Setup</button>
        </div>
      `;
      wrap.querySelector('#fpr-go-setup')?.addEventListener('click', () => { state.view = 'setup'; render(); });
      return wrap;
    }

    const sections = typeof brief.sections_json === 'string'
      ? JSON.parse(brief.sections_json) : (brief.sections_json || []);
    const actions  = typeof brief.action_items  === 'string'
      ? JSON.parse(brief.action_items)  : (brief.action_items  || []);

    var _hasItems = sections.some(function(sec){ return (sec.items || []).length > 0; });
    if (!_hasItems) {
      var emptyWrap = el('div', 'fpr-sentinel__brief');
      emptyWrap.innerHTML = `
        <div class="fpr-sentinel__empty" style="padding:48px 24px;text-align:center">
          ${IC.brief}
          <p style="font-size:15px;font-weight:600;color:var(--fpr-gray-700);margin:14px 0 4px">No verified firearm-related federal legislation is currently flagged.</p>
          <p style="font-size:13px;color:var(--fpr-gray-500);margin:0;line-height:1.6">Sentinel only reports bills confirmed against official Congress.gov records. When a verified firearm-related federal bill is active, it will appear here.</p>
        </div>
        <div class="fpr-sentinel__disclaimer fpr-sentinel__disclaimer--sticky">⚠️ For informational purposes only. Not legal advice. Always consult a qualified firearms attorney for legal guidance.</div>
      `;
      return emptyWrap;
    }
    if (typeof window.fprAwardTicket === 'function') { window.fprAwardTicket('brief_viewed', { week: brief.brief_week || '' }); }
    const wrap = el('div', 'fpr-sentinel__brief');
    wrap.innerHTML = `
      <!-- Hero -->
      <div class="fpr-sentinel__brief-hero">
        <div class="fpr-sentinel__brief-hero-week">Weekly Intelligence Brief · ${brief.brief_week || ''}</div>
        <div class="fpr-sentinel__brief-hero-title">
          ${state.profile?.city_name ? `${esc(state.profile.city_name)}, ${esc(state.profile.state_code)} · ` : ''}
          Personalized for Your Firearms
        </div>
        <div class="fpr-sentinel__brief-hero-summary">${esc(brief.executive_summary || '')}</div>
        <div class="fpr-sentinel__brief-hero-counts">
          ${brief.threat_count_critical ? `<div class="fpr-sentinel__count-badge --critical">${IC.warning} ${brief.threat_count_critical} Critical</div>` : ''}
          ${brief.threat_count_high     ? `<div class="fpr-sentinel__count-badge --high">${brief.threat_count_high} High</div>` : ''}
          ${brief.threat_count_watch    ? `<div class="fpr-sentinel__count-badge --watch">${brief.threat_count_watch} Watch</div>` : ''}
          <div class="fpr-sentinel__count-badge --market">${IC.signal} Market Signals Active</div>
        </div>
      </div>

      <!-- Action Items -->
      ${actions.length ? `
        <div style="background:var(--fpr-gold-muted);border-bottom:1px solid rgba(201,151,58,.2)">
          <div style="padding:14px 28px 6px;font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--fpr-gold);text-transform:uppercase">This Week\'s Action Items</div>
          <div class="fpr-sentinel__actions-list" style="padding-top:0">
            ${actions.map((a, i) => `
              <div class="fpr-sentinel__action-item">
                <div class="fpr-sentinel__action-num">${i + 1}</div>
                <div>${esc(a)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Sections -->
      <div class="fpr-sentinel__brief-body" id="fpr-brief-sections">
        ${sections.map(s => buildBriefSection(s)).join('')}
      </div>

      <div style="display:flex;justify-content:flex-end;padding:12px 16px 4px">
        <button onclick="FPRShare.open('Share Your Brief')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share Your Brief
        </button>
      </div>

      <!-- Sticky disclaimer -->
      <div class="fpr-sentinel__disclaimer fpr-sentinel__disclaimer--sticky">
        ⚠️ For informational purposes only. Not legal advice. Always consult a qualified firearms attorney for legal guidance.
      </div>
    `;

    // Wire section accordions
    wrap.querySelectorAll('.fpr-sentinel__section-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const section = hdr.closest('.fpr-sentinel__brief-section');
        section.classList.toggle('--open');
      });
    });

    // Open first section by default
    const first = wrap.querySelector('.fpr-sentinel__brief-section');
    if (first) first.classList.add('--open');

    return wrap;
  }

  function buildBriefSection(section) {
    const iconName = { gavel: 'gavel', chart: 'chart', search: 'search', signal: 'signal' }[section.icon] || 'brief';
    const count    = section.items?.length || 0;

    return `
      <div class="fpr-sentinel__brief-section" id="section-${section.id}">
        <div class="fpr-sentinel__section-header">
          <div class="fpr-sentinel__section-icon">${IC[iconName] || ''}</div>
          <div class="fpr-sentinel__section-title">${esc(section.title)}</div>
          ${count > 0 ? `<div class="fpr-sentinel__section-count">${count} item${count !== 1 ? 's' : ''}</div>` : ''}
          ${section.map_compliant ? `<div style="font-size:10px;font-weight:700;color:var(--fpr-gray-400);padding:2px 8px;background:var(--fpr-gray-100);border-radius:99px">MAP Compliant</div>` : ''}
          <div class="fpr-sentinel__section-chevron">${IC.chevron}</div>
        </div>
        <div class="fpr-sentinel__section-body">
          ${section.id === 'legislative'       ? buildLegislativeItems(section.items || []) : ''}
          ${section.id === 'availability'      ? buildFASItems(section.items || []) : ''}
          ${section.id === 'hidden_amendments' ? buildHiddenItems(section.items || []) : ''}
          ${section.id === 'market'            ? buildMarketItems(section.items || []) : ''}
        </div>
      </div>
    `;
  }

  function buildLegislativeItems(items) {
    return items.map(item => `
      <div class="fpr-sentinel__item --${item.threat_level || 'monitor'}">
        <div class="fpr-sentinel__item-meta">
          <div class="fpr-sentinel__threat-tag --${item.threat_level || 'monitor'}">${(item.threat_level || 'MONITOR').toUpperCase()}</div>
          ${item.bill_number ? `<div class="fpr-sentinel__item-bill">${esc(item.bill_number)}</div>` : ''}
          ${item.status ? `<div class="fpr-sentinel__item-status">${esc(item.status)}</div>` : ''}
        </div>
        <div class="fpr-sentinel__item-headline">${esc(item.headline || item.title || '')}</div>
        <div class="fpr-sentinel__item-body">${esc(item.body || item.short_summary || '')}</div>
        ${item.personalized_impact ? `<div class="fpr-sentinel__item-personal">🎯 ${esc(item.personalized_impact)}</div>` : ''}
        ${item.action ? `<div class="fpr-sentinel__item-action">${esc(item.action)}</div>` : ''}
      </div>
    `).join('');
  }

  function buildFASItems(items) {
    return items.map(item => {
      const tier = fasRisk(item.fas_score);
      return `
        <div class="fpr-sentinel__fas-item">
          <div class="fpr-sentinel__fas-header">
            <div>
              <div class="fpr-sentinel__fas-category">${esc(item.category || '')}</div>
              <div style="display:flex;gap:6px;margin-top:4px">
                <div class="fpr-sentinel__fas-trend --${item.trend || 'stable'}">
                  ${item.trend === 'rising' ? '↑' : item.trend === 'falling' ? '↓' : '→'} ${esc(item.trend || 'stable')}
                </div>
              </div>
            </div>
            <div class="fpr-sentinel__fas-score-badge --${tier}">
              ${item.fas_score || 0}
              <span style="font-size:11px;font-weight:600;margin-left:2px">/100</span>
            </div>
          </div>
          <div class="fpr-sentinel__fas-bar-track">
            <div class="fpr-sentinel__fas-bar-fill --${tier}" style="width:${item.fas_score || 0}%"></div>
          </div>
          <div style="font-size:10px;font-weight:700;color:var(--fpr-gray-400);text-transform:uppercase;letter-spacing:.06em">${fasLabel(tier)}</div>
          <div class="fpr-sentinel__item-body" style="margin-top:6px">${esc(item.body || '')}</div>
          ${item.action ? `<div class="fpr-sentinel__item-action">${esc(item.action)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function buildHiddenItems(items) {
    return items.map(item => `
      <div class="fpr-sentinel__item --high">
        <div class="fpr-sentinel__item-meta">
          <div class="fpr-sentinel__threat-tag --high">HIDDEN AMENDMENT</div>
          ${item.section_ref ? `<div class="fpr-sentinel__item-bill">${esc(item.section_ref)}</div>` : ''}
        </div>
        <div class="fpr-sentinel__item-headline">${esc(item.headline || '')}</div>
        <div style="font-size:12px;font-weight:600;color:var(--fpr-gray-500);margin-bottom:8px">
          Found in: <em>${esc(item.parent_bill || '')}</em>
          ${item.parent_subject ? ` (${esc(item.parent_subject)})` : ''}
        </div>
        <div class="fpr-sentinel__item-body">${esc(item.body || '')}</div>
        ${item.action ? `<div class="fpr-sentinel__item-action">${esc(item.action)}</div>` : ''}
      </div>
    `).join('');
  }

  function buildMarketItems(items) {
    return `
      <div style="font-size:12px;font-weight:700;color:var(--fpr-gray-400);padding:0 0 12px;display:flex;align-items:center;gap:6px">
        ${IC.info} Market intelligence follows MAP compliance rules. No specific below-MAP pricing shown.
      </div>
      ${items.map(item => `
        <div class="fpr-sentinel__item --teal">
          <div class="fpr-sentinel__item-meta">
            <div style="font-size:10px;font-weight:800;background:rgba(13,115,119,.15);color:var(--sentinel-teal);padding:2px 8px;border-radius:99px;text-transform:uppercase">${esc(item.signal_type || 'signal')}</div>
            <div class="fpr-sentinel__item-bill">${esc(item.category || '')}</div>
          </div>
          <div class="fpr-sentinel__item-headline">${esc(item.framing || '')}</div>
          <div class="fpr-sentinel__item-body">${esc(item.body || '')}</div>
          ${item.action ? `<div class="fpr-sentinel__item-action">${esc(item.action)}</div>` : ''}
        </div>
      `).join('')}
      <div class="fpr-sentinel__disclaimer" style="margin-top:8px">For informational purposes only. Not legal advice. Market intelligence uses MAP-compliant framing. Always consult a qualified firearms attorney for legal guidance.</div>
    `;
  }

  // ==========================================================================
  // VIEW: LEGISLATIVE (full tracker)
  // ==========================================================================
  function getSectionItems(id) {
    let secs = state.brief && state.brief.sections_json;
    if (typeof secs === 'string') { try { secs = JSON.parse(secs); } catch (e) { secs = []; } }
    const sec = (secs || []).find(x => x.id === id);
    return (sec && sec.items) || [];
  }

  function buildLegislativeView() {
    const wrap = el('div', 'fpr-sentinel__setup');
    wrap.innerHTML = `
      <h2 style="font-size:22px;font-weight:800;margin:0 0 4px;color:var(--fpr-gray-900)">Legislative Monitor</h2>
      <p style="font-size:14px;color:var(--fpr-gray-500);margin:0 0 20px">All active legislative items tracked by Sentinel, ordered by threat level.</p>

      ${(function(){ var items = getSectionItems('legislative'); return items.length ? buildLegislativeItems(items) : '<div class="fpr-sentinel__empty" style="padding:28px;text-align:center;color:var(--fpr-gray-500)">No verified firearm-related federal legislation is currently flagged.</div>'; })()}

      <div class="fpr-sentinel__disclaimer" style="margin-top:16px">⚠️ For informational purposes only. Not legal advice. Always consult a qualified firearms attorney for legal guidance.</div>
    `;
    return wrap;
  }

  // ==========================================================================
  // VIEW: AVAILABILITY (FAS tracker)
  // ==========================================================================
  function buildAvailabilityView() {
    const wrap = el('div', 'fpr-sentinel__setup');
    wrap.innerHTML = `
      <h2 style="font-size:22px;font-weight:800;margin:0 0 4px;color:var(--fpr-gray-900)">Future Availability Tracker</h2>
      <p style="font-size:14px;color:var(--fpr-gray-500);margin:0 0 4px">Future Availability Score (FAS) — 90-day scarcity risk projection for your registered firearm categories.</p>
      <p style="font-size:12px;color:var(--fpr-gray-400);margin:0 0 20px">
        Score = Legislative factor (0–40) + Demand factor (0–30) + Supply factor (0–30). Higher = greater scarcity risk.
      </p>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        ${[{l:'LOW RISK',c:'var(--fas-low)'},{l:'MODERATE',c:'var(--fas-moderate)'},{l:'HIGH RISK',c:'var(--fas-high)'},{l:'CRITICAL',c:'var(--fas-critical)'}].map(z =>
          `<div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--fpr-gray-500)"><div style="width:10px;height:10px;border-radius:50%;background:${z.c}"></div>${z.l}</div>`
        ).join('')}
      </div>

      ${(function(){ var items = getSectionItems('availability'); return items.length ? buildFASItems(items) : '<div class="fpr-sentinel__empty" style="padding:28px;text-align:center;color:var(--fpr-gray-500)">No availability data is currently published.</div>'; })()}

      <div class="fpr-sentinel__disclaimer" style="margin-top:16px">⚠️ For informational purposes only. Not legal advice. Always consult a qualified firearms attorney for legal guidance.</div>
    `;
    return wrap;
  }

  // ==========================================================================
  // VIEW: NOTIFICATIONS
  // ==========================================================================
  function buildNotificationsView() {
    const wrap = el('div', 'fpr-sentinel__notifications');
    wrap.innerHTML = `
      <h2 style="font-size:22px;font-weight:800;margin:0 0 4px;color:var(--fpr-gray-900)">Notification Settings</h2>
      <p style="font-size:14px;color:var(--fpr-gray-500);margin:0 0 24px">Choose how and when Sentinel alerts you. Critical threats bypass the weekly schedule.</p>

      <!-- Email -->
      <div class="fpr-sentinel__push-card" style="margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;color:var(--fpr-gray-900);margin-bottom:12px">📧 Email Delivery</div>
        <div class="fpr-sentinel__toggle-row">
          <div>
            <div class="fpr-sentinel__toggle-label">Weekly Brief</div>
            <div class="fpr-sentinel__toggle-desc">Delivered every Sunday morning</div>
          </div>
          <label class="fpr-sentinel__toggle">
            <input type="checkbox" checked id="fpr-email-weekly" /><div class="fpr-sentinel__toggle-track"></div><div class="fpr-sentinel__toggle-thumb"></div>
          </label>
        </div>
        <div class="fpr-sentinel__toggle-row">
          <div>
            <div class="fpr-sentinel__toggle-label">Critical Alert Bypass</div>
            <div class="fpr-sentinel__toggle-desc">Immediate email when a CRITICAL threat is detected for your state or firearms</div>
          </div>
          <label class="fpr-sentinel__toggle">
            <input type="checkbox" checked id="fpr-email-critical" /><div class="fpr-sentinel__toggle-track"></div><div class="fpr-sentinel__toggle-thumb"></div>
          </label>
        </div>
      </div>

      <!-- Push -->
      <div class="fpr-sentinel__push-card ${state.pushEnabled ? 'fpr-sentinel__push-enabled' : ''}" id="fpr-push-card">
        <div style="font-size:13px;font-weight:700;color:var(--fpr-gray-900);margin-bottom:12px">
          📱 Browser Push Notifications
          ${state.pushEnabled ? `<span style="font-size:10px;font-weight:700;color:var(--sentinel-teal);margin-left:8px">ENABLED</span>` : ''}
        </div>
        <p style="font-size:12px;color:var(--fpr-gray-500);margin:0 0 14px;line-height:1.6">
          Receive instant alerts when a Critical or High-level threat is detected — even when you\'re not on the FPRMembers.com website.
        </p>
        ${!state.pushEnabled
          ? `<button class="fpr-btn fpr-btn--sentinel fpr-btn--sm" id="fpr-enable-push">${IC.bell} Enable Push Notifications</button>`
          : `<button class="fpr-btn fpr-btn--ghost fpr-btn--sm" id="fpr-disable-push">Disable Push</button>`
        }
      </div>

      <!-- Brief cadence -->
      <div class="fpr-sentinel__push-card" style="margin-top:16px">
        <div style="font-size:13px;font-weight:700;color:var(--fpr-gray-900);margin-bottom:12px">📅 Brief Frequency</div>
        <select class="fpr-sentinel__select" id="fpr-cadence" style="max-width:220px">
          <option value="weekly" selected>Weekly (recommended)</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <p style="font-size:12px;color:var(--fpr-gray-500);margin:10px 0 0">Critical threat alerts always bypass the cadence setting and are delivered immediately.</p>
      </div>

      <div class="fpr-sentinel__disclaimer" style="margin-top:20px">⚠️ For informational purposes only. Not legal advice. Always consult a qualified firearms attorney for legal guidance.</div>
    `;

    wrap.querySelector('#fpr-enable-push')?.addEventListener('click', enablePush);
    wrap.querySelector('#fpr-disable-push')?.addEventListener('click', disablePush);
    return wrap;
  }

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast('Push notifications are not supported in this browser. Use email notifications instead.', 'critical');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { showToast('Push permission denied. Enable notifications in your browser settings.', 'critical'); return; }

      // Get VAPID public key
      const keyData = await api('/api/sentinel/vapid-public-key');
      const pubKey  = keyData?.publicKey;
      if (!pubKey) { showToast('Push configuration unavailable — contact support.', 'critical'); return; }

      // Register SW and subscribe
      const registration = await navigator.serviceWorker.register('/sentinel-sw.js');
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubKey),
      });

      // Send subscription to API
      await api(`/api/sentinel/member/${state.memberId}/push-subscribe`, {
        method: 'POST',
        body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: arrayBufferToBase64(sub.getKey('p256dh')), auth: arrayBufferToBase64(sub.getKey('auth')) } }),
      });

      state.pushEnabled = true;
      showToast('Push notifications enabled! You\'ll receive alerts for Critical and High threats.', 'success');
      render();
    } catch (err) {
      showToast('Could not enable push: ' + err.message, 'critical');
    }
  }

  async function disablePush() {
    await api(`/api/sentinel/member/${state.memberId}/push-subscribe`, { method: 'DELETE' });
    state.pushEnabled = false;
    showToast('Push notifications disabled.', 'teal');
    render();
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function fasRisk(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  }

  function fasLabel(tier) {
    return { critical: 'CRITICAL RISK', high: 'HIGH RISK', moderate: 'MODERATE RISK', low: 'LOW RISK' }[tier] || tier;
  }

  function urlBase64ToUint8Array(base64) {
    const pad = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function showToast(msg, type = 'teal') {
    let wrap = document.querySelector('.fpr-sentinel__toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'fpr-sentinel__toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = `fpr-sentinel__toast --${type}`;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('--out'); setTimeout(() => t.remove(), 300); }, 4000);
  }

  // -------------------------------------------------------------------------
  // Bootstrap
  // -------------------------------------------------------------------------
  async function init(root) {
    state.root       = root;
    state.apiUrl     = (root.dataset.apiUrl || '').replace(/\/$/, '');
    state.memberId   = root.dataset.memberId   || 'demo-member';
    state.memberName = root.dataset.memberName || 'Demo Member';
    root.classList.add('fpr-sentinel');

    render();
    await loadData();
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fpr-sentinel-mount').forEach(function(root){ window.__fprResolveMount(root).then(function(){ init(root); }); });
  });

  window.FPRSentinel = { init };
})();
