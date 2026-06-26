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
 * FPRMembers.com — Build 6: Spotter — Shot Analysis System
 * File: fpr-spotter.js
 *
 * Usage:
 *   <div class="fpr-echo-mount"
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
    upload:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`,
    target:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    history:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.29"/></svg>`,
    badge:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="m15.477 12.89 1.515 5.789A1.5 1.5 0 0 1 15.03 20.5l-3.03-3.03-3.03 3.03a1.5 1.5 0 0 1-1.962-1.821l1.515-5.789"/></svg>`,
    share:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    shield:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    chart:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    copy:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    chevron:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
    lock:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    info:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    star:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    arrow:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  };

  function ic(name) { return `<span style="display:inline-flex;align-items:center">${IC[name] || ''}</span>`; }

  // -------------------------------------------------------------------------
  // Demo data (shown when API is not connected)
  // -------------------------------------------------------------------------
  const DEMO_SESSIONS = [
    { id: 's1', session_number: 1, echo_score: 58, pattern: 'scattered',    grouping_radius_mm: 68, improvement_pct: null, center_x_mm: -12, center_y_mm: -8, distance_yards: 7, firearm_type: 'pistol', created_at: '2026-04-07T14:22:00Z', coaching_json: { primary_issue: 'Scattered grouping — multiple fundamental issues present.', explanation: 'No consistent directional bias indicates simultaneous breakdown of grip, sight picture, and trigger control. Return to fundamentals at close range.', corrections: ['Return to 3-yard slow fire to rebuild fundamentals', 'Focus on one element at a time: grip first, then sight, then trigger', 'Dry fire 5 minutes daily before your next live session'], drills: ['3-Yard Slow Fire', 'Dry Fire Fundamentals', 'One-Handed Grip Drill'], encouragement: 'Every expert was once a beginner. This is your starting point.', top_drill: '3-Yard Slow Fire' } },
    { id: 's2', session_number: 2, echo_score: 63, pattern: 'low_left',     grouping_radius_mm: 54, improvement_pct: 8.6, center_x_mm: -22, center_y_mm: -18, distance_yards: 7, firearm_type: 'pistol', created_at: '2026-04-12T11:05:00Z', coaching_json: { primary_issue: 'Anticipating recoil — pushing muzzle down and left before the shot.', explanation: 'Low-left pattern is the most common error for right-handed shooters. The shooter is applying forward and downward pressure before the trigger breaks — a subconscious flinch in anticipation of recoil.', corrections: ['Deliberately slow your trigger press — surprise yourself when it fires', 'Dry fire with a coin balanced on the front sight', 'Have a partner load ball-and-dummy randomly so you see your flinch'], drills: ['Ball and Dummy Drill', 'Coin on the Front Sight', 'Slow Press to the Wall'], encouragement: 'Good news: you have a consistent pattern, which means consistent cause. Fix the cause and the pattern disappears.', top_drill: 'Ball and Dummy Drill' } },
    { id: 's3', session_number: 3, echo_score: 69, pattern: 'low_left',     grouping_radius_mm: 44, improvement_pct: 9.5, center_x_mm: -16, center_y_mm: -12, distance_yards: 7, firearm_type: 'pistol', created_at: '2026-04-18T15:33:00Z', coaching_json: { primary_issue: 'Anticipation improving — low-left bias reduced but still present.', explanation: 'Your group tightened significantly and the center of mass moved closer to point of aim. The anticipation flinch is becoming less severe. Continue the ball-and-dummy work — you are on the right track.', corrections: ['Maintain slow deliberate trigger press — do not rush', 'Add follow-through: watch the front sight for one full second after the shot', 'Increase dry fire to 10 minutes daily'], drills: ['Ball and Dummy Drill', 'Follow-Through Focus', 'Penny Drill'], encouragement: 'Real improvement visible this session — your grouping tightened by 19%. The drill work is paying off.', top_drill: 'Ball and Dummy Drill' } },
    { id: 's4', session_number: 4, echo_score: 74, pattern: 'left_pull',    grouping_radius_mm: 35, improvement_pct: 7.2, center_x_mm: -14, center_y_mm: -3, distance_yards: 7, firearm_type: 'pistol', created_at: '2026-04-24T09:11:00Z', coaching_json: { primary_issue: 'Trigger finger pulling left on press — good correction on anticipation.', explanation: 'You fixed the vertical component — shots are now near center height — but a lateral pull remains. The trigger finger is applying sideways pressure as it presses rearward. Check your finger placement on the trigger.', corrections: ['Use the center pad of your index finger, not the joint', 'Press straight rearward with zero lateral component', 'Confirm trigger finger placement before each string'], drills: ['Trigger Finger Placement Check', 'Dry Fire with Laser Sight', 'Pencil Drill'], encouragement: 'Excellent work resolving the vertical flinch. You are now dealing with one clean problem instead of three.', top_drill: 'Trigger Finger Placement Check' } },
    { id: 's5', session_number: 5, echo_score: 81, pattern: 'tight_centered', grouping_radius_mm: 22, improvement_pct: 9.5, center_x_mm: -4, center_y_mm: 2, distance_yards: 7, firearm_type: 'pistol', created_at: '2026-04-30T13:44:00Z', coaching_json: { primary_issue: 'Excellent grouping — maintain this form.', explanation: '', corrections: ['Keep your current trigger finger placement', 'Maintain your follow-through until the gun returns to battery', 'Consider moving to 10 or 15 yards to challenge yourself'], drills: ['Extended Distance Practice', 'Timed String Practice', 'Strong-Hand Only Drill'], encouragement: 'Outstanding session. Sub-1-inch shift from POA at 7 yards is expert-level work.', top_drill: 'Extended Distance Practice' } },
    { id: 's6', session_number: 6, echo_score: 85, pattern: 'tight_centered', grouping_radius_mm: 18, improvement_pct: 4.9, center_x_mm: -2, center_y_mm: 1, distance_yards: 10, firearm_type: 'pistol', created_at: '2026-05-04T10:20:00Z', coaching_json: { primary_issue: 'Excellent grouping — maintain this form.', explanation: '', corrections: ['You moved to 10 yards and maintained your group size — this is excellent', 'Add support-hand-only and strong-hand-only practice to your sessions', 'Consider competition shooting to pressure-test your skills'], drills: ['One-Handed Strings', 'Controlled Pair Drill', 'IDPA Stage Practice'], encouragement: 'You have improved 46% from your baseline. This is the result of consistent, deliberate practice.', top_drill: 'Controlled Pair Drill' } },
  ];

  const DEMO_BADGES = [
    { badge_slug: 'first_shot',    name: 'First Shot',       icon_emoji: '🎯', tier: 'bronze', description: 'Submitted your first target for Spotter analysis.',  earned_at: '2026-04-07' },
    { badge_slug: 'pattern_found', name: 'Pattern Detected', icon_emoji: '🔍', tier: 'bronze', description: 'Spotter identified a specific shot pattern.',          earned_at: '2026-04-12' },
    { badge_slug: 'first_improve', name: 'On the Way Up',    icon_emoji: '📈', tier: 'bronze', description: 'Improved your Echo Score session over session.',           earned_at: '2026-04-12' },
    { badge_slug: 'three_sessions',name: 'Hat Trick',        icon_emoji: '🎩', tier: 'bronze', description: 'Completed 3 shooting sessions with Spotter.',           earned_at: '2026-04-18' },
    { badge_slug: 'ten_pct_up',    name: 'Ten Percent Club', icon_emoji: '💪', tier: 'silver', description: 'Improved Echo Score 10% from baseline.',                   earned_at: '2026-04-18' },
    { badge_slug: 'five_sessions', name: 'Five and Counting',icon_emoji: '🔥', tier: 'silver', description: 'Completed 5 sessions with Spotter.',                    earned_at: '2026-04-30' },
    { badge_slug: 'score_70',      name: 'Developing Shooter',icon_emoji:'⭐', tier: 'silver', description: 'Achieved an Echo Score of 70+.',                           earned_at: '2026-04-24' },
    { badge_slug: 'pattern_fixed', name: 'Pattern Broken',   icon_emoji: '🔧', tier: 'silver', description: 'Went 3 sessions without your most common error.',          earned_at: '2026-04-30' },
    { badge_slug: 'score_80',      name: 'Proficient',       icon_emoji: '⭐', tier: 'gold',   description: 'Achieved an Echo Score of 80+.',                           earned_at: '2026-04-30' },
    { badge_slug: 'score_85',      name: 'Advanced',         icon_emoji: '🌟', tier: 'gold',   description: 'Achieved an Echo Score of 85+.',                           earned_at: '2026-05-04' },
    { badge_slug: 'five_streak',   name: 'Streak Builder',   icon_emoji: '⚡', tier: 'gold',   description: '5 consecutive improvement sessions.',                      earned_at: '2026-05-04' },
    { badge_slug: 'sub_2inch',     name: 'Sub-2 Group',      icon_emoji: '💎', tier: 'gold',   description: 'Recorded a grouping under 2 inches at 7 yards.',           earned_at: '2026-05-04' },
  ];

  const ALL_BADGES = [
    { badge_slug: 'score_90',   name: 'Expert',        icon_emoji: '🏆', tier: 'platinum', description: 'Achieve an Echo Score of 90+.' },
    { badge_slug: 'score_95',   name: 'Master',        icon_emoji: '👑', tier: 'platinum', description: 'Achieve an Echo Score of 95+.' },
    { badge_slug: 'sub_1inch',  name: 'Sub-1 Group',   icon_emoji: '💫', tier: 'platinum', description: 'Record a grouping under 1 inch at 7 yards.' },
    { badge_slug: 'twenty_five',name: 'Elite Member',  icon_emoji: '🦅', tier: 'platinum', description: 'Complete 25 sessions with Spotter.' },
    { badge_slug: 'ten_streak', name: 'Unstoppable',   icon_emoji: '🔱', tier: 'platinum', description: '10 consecutive improvement sessions.' },
    { badge_slug: 'ten_sessions',name:'Committed',     icon_emoji: '🏅', tier: 'gold',     description: 'Complete 10 sessions with Spotter.' },
    { badge_slug: 'twenty_pct_up',name:'Twenty Percent',icon_emoji:'🚀',tier:'gold',       description: 'Improve 20% from your baseline.' },
    { badge_slug: 'sub_3inch',  name: 'Sub-3 Group',   icon_emoji: '🎯', tier: 'silver',   description: 'Record a grouping under 3 inches at 7 yards.' },
    { badge_slug: 'drills_assigned',name:'Drills Assigned',icon_emoji:'📋',tier:'bronze',  description: 'Receive your first personalized drill assignments.' },
  ];

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  let state = {
    apiUrl: '', memberId: '', memberName: '',
    view: 'upload',          // upload | analyzing | result | history | badges | challenge
    sessions: [...DEMO_SESSIONS],
    badges: [...DEMO_BADGES],
    pendingFile: null,
    lastResult: DEMO_SESSIONS[DEMO_SESSIONS.length - 1],
    stats: {
      total_sessions: 6, best_echo_score: 85, latest_echo_score: 85,
      baseline_echo_score: 58, overall_improvement_pct: 46.6,
      avg_echo_score: 71.7, best_grouping_mm: 18, current_streak: 5,
      most_common_pattern: 'low_left',
    },
    root: null,
    analyzeStepInterval: null,
  };

  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------
  async function api(path, opts = {}) {
    if (!state.apiUrl) return null;
    try {
      const r = await fetch(state.apiUrl + path, opts);
      return r.ok ? r.json() : null;
    } catch { return null; }
  }

  async function loadProfile() {
    const data = await api(`/api/echo/member/${state.memberId}/profile`);
    if (!data) return;
    if (data.stats && data.stats.total_sessions) state.stats = data.stats;
    if (data.badges?.length) state.badges = data.badges;
    if (data.trend?.length) state.sessions = data.trend;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  function render() {
    state.root.innerHTML = '';
    state.root.appendChild(buildShell());
  }

  function buildShell() {
    const shell = el('div', 'fpr-echo__shell');
    shell.appendChild(buildTopbar());
    shell.appendChild(buildSidebar());
    shell.appendChild(buildMain());
    return shell;
  }

  // ——— Topbar ———
  function buildTopbar() {
    const bar = el('div', 'fpr-echo__topbar');
    bar.innerHTML = `
      <div class="fpr-echo__topbar-logo">FPRMembers.com</div>
      <div class="fpr-echo__topbar-divider"></div>
      <div class="fpr-echo__topbar-title">Spotter</div>
      <div class="fpr-echo__topbar-score">
        ${IC.target}
        <span>Echo Score: <strong>${state.stats.latest_echo_score || '—'}</strong></span>
        ${state.stats.overall_improvement_pct > 0 ? `<span style="color:#4ADE80">+${Math.round(state.stats.overall_improvement_pct)}%</span>` : ''}
      </div>
    `;
    return bar;
  }

  // ——— Sidebar ———
  function buildSidebar() {
    const sb = el('div', 'fpr-echo__sidebar');
    const tabs = [
      { view: 'upload',    label: 'Analyze Target',    icon: 'upload'  },
      { view: 'history',   label: 'Session History',   icon: 'history' },
      { view: 'badges',    label: 'My Badges',         icon: 'badge'   },
      { view: 'challenge', label: 'Challenge a Friend',icon: 'share'   },
    ];

    sb.innerHTML = `
      <div class="fpr-echo__sidebar-heading">Menu</div>
      <div class="fpr-echo__nav">
        ${tabs.map(t => `
          <button class="fpr-echo__nav-tab${state.view === t.view || (state.view === 'result' && t.view === 'upload') || (state.view === 'analyzing' && t.view === 'upload') ? ' --active' : ''}" data-view="${t.view}">
            <span style="width:16px;height:16px;display:flex">${IC[t.icon] || ''}</span> ${t.label}
          </button>
        `).join('')}
      </div>

      <div class="fpr-echo__sidebar-heading">Your Stats</div>
      <div class="fpr-echo__sidebar-stats">
        <div class="fpr-echo__sidebar-stat">
          <div class="fpr-echo__sidebar-stat-icon">${IC.target}</div>
          <div>
            <div class="fpr-echo__sidebar-stat-val">${state.stats.latest_echo_score || 0}</div>
            <div class="fpr-echo__sidebar-stat-lbl">Echo Score</div>
          </div>
        </div>
        <div class="fpr-echo__sidebar-stat">
          <div class="fpr-echo__sidebar-stat-icon">${IC.chart}</div>
          <div>
            <div class="fpr-echo__sidebar-stat-val" style="color:${state.stats.overall_improvement_pct > 0 ? '#4ADE80' : '#F87171'}">
              ${state.stats.overall_improvement_pct > 0 ? '+' : ''}${Math.round(state.stats.overall_improvement_pct || 0)}%
            </div>
            <div class="fpr-echo__sidebar-stat-lbl">Improvement</div>
          </div>
        </div>
        <div class="fpr-echo__sidebar-stat">
          <div class="fpr-echo__sidebar-stat-icon">${IC.history}</div>
          <div>
            <div class="fpr-echo__sidebar-stat-val">${state.stats.total_sessions || 0}</div>
            <div class="fpr-echo__sidebar-stat-lbl">Sessions</div>
          </div>
        </div>
      </div>

      <div class="fpr-echo__sidebar-heading" style="margin-top:8px">Recent Sessions</div>
      <div class="fpr-echo__sidebar-sessions">
        ${state.sessions.slice().reverse().slice(0, 5).map(s => buildSidebarSession(s)).join('')}
      </div>
    `;

    sb.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => { state.view = btn.dataset.view; render(); });
    });

    return sb;
  }

  function buildSidebarSession(s) {
    const tier  = scoreTier(s.echo_score);
    const delta = s.improvement_pct;
    const date  = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <div class="fpr-echo__sidebar-session-row" data-session-id="${s.id}">
        <div class="fpr-echo__sidebar-session-score --${tier}">${s.echo_score}</div>
        <div class="fpr-echo__sidebar-session-info">
          <div class="fpr-echo__sidebar-session-name">Session ${s.session_number}</div>
          <div class="fpr-echo__sidebar-session-date">${date} · ${esc(patternLabel(s.pattern))}</div>
        </div>
        <div class="fpr-echo__sidebar-session-delta ${delta > 0 ? '--up' : delta < 0 ? '--down' : '--flat'}">
          ${delta > 0 ? '↑' + Math.abs(delta).toFixed(1) + '%' : delta < 0 ? '↓' + Math.abs(delta).toFixed(1) + '%' : '—'}
        </div>
      </div>
    `;
  }

  // ——— Main ———
  function buildMain() {
    const main = el('div', 'fpr-echo__main');
    if (state.view === 'upload')    main.appendChild(buildUploadView());
    else if (state.view === 'analyzing') main.appendChild(buildAnalyzingView());
    else if (state.view === 'result')    main.appendChild(buildResultView(state.lastResult));
    else if (state.view === 'history')   main.appendChild(buildHistoryView());
    else if (state.view === 'badges')    main.appendChild(buildBadgesView());
    else if (state.view === 'challenge') main.appendChild(buildChallengeView());
    return main;
  }

  // ==========================================================================
  // VIEW: UPLOAD
  // ==========================================================================
  function buildUploadView() {
    const wrap = el('div', 'fpr-echo__upload-view');
    wrap.innerHTML = `
      <div>
        <h2 class="fpr-echo__view-heading">Analyze Your Target</h2>
        <p class="fpr-echo__view-sub">Upload a photo of your target. Spotter analyzes your shot grouping and delivers personalized coaching.</p>
      </div>

      <div class="fpr-echo__dropzone" id="fpr-dropzone">
        <input type="file" id="fpr-file-input" accept="image/jpeg,image/png,image/webp" />
        <div class="fpr-echo__dropzone-icon">${IC.upload}</div>
        <div class="fpr-echo__dropzone-heading">Drop your target photo here</div>
        <div class="fpr-echo__dropzone-sub">JPG, PNG, or WebP · Max 10 MB</div>
        <img class="fpr-echo__dropzone-preview" id="fpr-preview-img" src="" alt="Target preview" />
      </div>

      <div>
        <div style="font-size:13px;font-weight:700;color:var(--fpr-gray-700);margin-bottom:12px">Session Details <span style="font-weight:400;color:var(--fpr-gray-400)">(optional)</span></div>
        <div class="fpr-echo__meta-form">
          <div class="fpr-echo__field">
            <label class="fpr-echo__label">Distance (yards)</label>
            <input class="fpr-echo__input" id="fpr-distance" type="number" placeholder="7" min="3" max="100" value="7" />
          </div>
          <div class="fpr-echo__field">
            <label class="fpr-echo__label">Firearm Type</label>
            <select class="fpr-echo__select" id="fpr-firearm">
              <option value="pistol">Pistol</option>
              <option value="revolver">Revolver</option>
              <option value="rifle">Rifle</option>
              <option value="shotgun">Shotgun</option>
            </select>
          </div>
          <div class="fpr-echo__field">
            <label class="fpr-echo__label">Caliber</label>
            <input class="fpr-echo__input" id="fpr-caliber" type="text" placeholder="9mm" />
          </div>
          <div class="fpr-echo__field">
            <label class="fpr-echo__label">Shots Fired</label>
            <input class="fpr-echo__input" id="fpr-shots" type="number" placeholder="10" min="1" max="50" />
          </div>
        </div>
      </div>

      <div class="fpr-echo__privacy-note">
        ${IC.shield}
        <div><strong>Privacy First:</strong> Your photo is analyzed in memory and immediately deleted — it is never written to disk, stored, or shared. Only the coaching results are saved.</div>
      </div>

      <div class="fpr-echo__disclaimer">
        ⚠️ For training purposes only. Always follow range safety rules and local firearms regulations.
      </div>

      <div style="display:flex;gap:10px;align-items:center">
        <button class="fpr-btn fpr-btn--echo" id="fpr-analyze-btn" disabled>
          ${IC.target} Analyze My Target
        </button>
        <button class="fpr-btn fpr-btn--ghost fpr-btn--sm" id="fpr-demo-btn">
          Try Demo Analysis
        </button>
      </div>
    `;

    // Drag and drop
    const dz    = wrap.querySelector('#fpr-dropzone');
    const input = wrap.querySelector('#fpr-file-input');
    const preview = wrap.querySelector('#fpr-preview-img');
    const analyzeBtn = wrap.querySelector('#fpr-analyze-btn');

    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('--drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('--drag-over'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('--drag-over');
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    });

    input.addEventListener('change', () => {
      if (input.files[0]) handleFileSelect(input.files[0]);
    });

    function handleFileSelect(file) {
      if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'gold'); return; }
      state.pendingFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        dz.classList.add('--has-image');
        analyzeBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }

    analyzeBtn.addEventListener('click', () => {
      if (!state.pendingFile) return;
      submitAnalysis(wrap);
    });

    wrap.querySelector('#fpr-demo-btn')?.addEventListener('click', () => {
      loadDemoResult();
    });

    return wrap;
  }

  async function submitAnalysis(formEl) {
    const formData = new FormData();
    formData.append('target_image', state.pendingFile);
    formData.append('memberId',     state.memberId);
    formData.append('memberName',   state.memberName);
    formData.append('distanceYards', formEl.querySelector('#fpr-distance')?.value || '7');
    formData.append('firearmType',   formEl.querySelector('#fpr-firearm')?.value || 'pistol');
    formData.append('caliber',       formEl.querySelector('#fpr-caliber')?.value || '');
    formData.append('shotCountClaimed', formEl.querySelector('#fpr-shots')?.value || '');

    state.view = 'analyzing';
    render();

    if (!state.apiUrl) { setTimeout(() => loadDemoResult(true), 3500); return; }

    try {
      const resp = await fetch(state.apiUrl + '/api/echo/sessions/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Analysis failed');

      // Merge new session into state
      const newSession = {
        id: data.sessionId, session_number: data.sessionNumber,
        echo_score: data.analysis.echo_score, pattern: data.analysis.pattern,
        grouping_radius_mm: data.analysis.grouping_radius_mm,
        center_x_mm: data.analysis.center_x_mm, center_y_mm: data.analysis.center_y_mm,
        improvement_pct: data.improvement_pct, coaching_json: data.analysis,
        distance_yards: parseInt(formEl?.querySelector('#fpr-distance')?.value) || 7,
        firearm_type: formEl?.querySelector('#fpr-firearm')?.value || 'pistol',
        created_at: new Date().toISOString(),
      };
      state.sessions.push(newSession);
      state.lastResult = newSession;
      state.stats.latest_echo_score = data.analysis.echo_score;
      if (data.new_badges?.length) {
        showToast(`🏅 Badge Earned: ${data.new_badges.join(', ')}`, 'gold');
      }
      state.view = 'result';
      render();
    } catch (err) {
      state.view = 'upload';
      render();
      showToast('Analysis error: ' + err.message, 'gold');
    }
  }

  function loadDemoResult(fromAnalyzing = false) {
    const demo = DEMO_SESSIONS[1]; // A session with a clear pattern
    state.lastResult = demo;
    state.view = 'result';
    if (fromAnalyzing && state.analyzeStepInterval) clearInterval(state.analyzeStepInterval);
    render();
    showToast('Demo analysis complete — showing sample result.', 'blue');
  }

  // ==========================================================================
  // VIEW: ANALYZING
  // ==========================================================================
  function buildAnalyzingView() {
    const wrap = el('div', 'fpr-echo__analyzing');
    const steps = [
      { id: 's1', label: 'Uploading image securely…' },
      { id: 's2', label: 'Detecting target and bullet holes…' },
      { id: 's3', label: 'Analyzing shot grouping pattern…' },
      { id: 's4', label: 'Generating personalized coaching…' },
      { id: 's5', label: 'Deleting image from memory…' },
    ];
    wrap.innerHTML = `
      <div class="fpr-echo__radar"></div>
      <div class="fpr-echo__analyzing-text">Spotter is analyzing your target</div>
      <div class="fpr-echo__analyzing-sub">This takes about 5–8 seconds</div>
      <div class="fpr-echo__analyzing-steps" id="fpr-steps">
        ${steps.map(s => `<div class="fpr-echo__analyzing-step" id="step-${s.id}">${IC.info} ${s.label}</div>`).join('')}
      </div>
    `;

    let i = 0;
    const ids = steps.map(s => s.id);
    state.analyzeStepInterval = setInterval(() => {
      if (i > 0) {
        const prev = wrap.querySelector(`#step-${ids[i - 1]}`);
        if (prev) { prev.classList.remove('--active'); prev.classList.add('--done'); prev.innerHTML = `${IC.check} ${steps[i-1].label}`; }
      }
      if (i < ids.length) {
        const curr = wrap.querySelector(`#step-${ids[i]}`);
        if (curr) curr.classList.add('--active');
        i++;
      } else {
        clearInterval(state.analyzeStepInterval);
      }
    }, 700);

    return wrap;
  }

  // ==========================================================================
  // VIEW: RESULT
  // ==========================================================================
  function buildResultView(session) {
    if (!session) return buildUploadView();
    const analysis = session.coaching_json || {};
    const score    = session.echo_score || 0;
    const tier     = scoreTier(score);
    const r        = 44;
    const circ     = 2 * Math.PI * r;
    const offset   = circ - (score / 100) * circ;

    const wrap = el('div', 'fpr-echo__result-view');
    window.fprAwardTicket('shot_analyzed', { sessionNum: session.session_number || 0, score: score });
    wrap.innerHTML = `
      <!-- Score hero -->
      <div class="fpr-echo__score-hero">
        <div class="fpr-echo__score-ring-wrap">
          <svg viewBox="0 0 100 100">
            <circle class="ring-bg" cx="50" cy="50" r="${r}" />
            <circle class="ring-fill --${tier}" cx="50" cy="50" r="${r}"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}" />
          </svg>
          <div class="fpr-echo__score-inner">
            <div class="fpr-echo__score-number">${score}</div>
            <div class="fpr-echo__score-label-sm">Echo</div>
          </div>
        </div>
        <div class="fpr-echo__score-hero-info">
          <div class="fpr-echo__score-hero-heading">${scoreTierLabel(tier)}</div>
          <div class="fpr-echo__score-hero-sub">Session ${session.session_number} · ${session.distance_yards || 7} yards · ${session.firearm_type || 'pistol'}</div>
          <div class="fpr-echo__score-chips">
            <div class="fpr-echo__chip --blue">${IC.target} ${patternLabel(session.pattern)}</div>
            ${session.improvement_pct !== null && session.improvement_pct !== undefined
              ? `<div class="fpr-echo__chip ${session.improvement_pct >= 0 ? '--green' : '--red'}">${session.improvement_pct >= 0 ? '↑' : '↓'} ${Math.abs(session.improvement_pct).toFixed(1)}% vs last</div>`
              : `<div class="fpr-echo__chip --blue">Baseline session</div>`}
            ${session.grouping_radius_mm ? `<div class="fpr-echo__chip --gold">${IC.target} ${(session.grouping_radius_mm / 12.7).toFixed(1)}" group</div>` : ''}
          </div>
        </div>
        <div>
          <button class="fpr-btn fpr-btn--ghost fpr-btn--sm" id="fpr-new-analysis" style="color:#fff;border-color:rgba(255,255,255,.2)">
            ${IC.upload} New Target
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="fpr-echo__result-body">

        <div class="fpr-echo__analysis-grid">
          <!-- Target visualization -->
          <div class="fpr-echo__target-wrap">
            <canvas class="fpr-echo__target-canvas" id="fpr-target-canvas" width="200" height="200"></canvas>
            <div class="fpr-echo__target-legend">
              Simulated shot placement<br>based on detected pattern
            </div>
          </div>

          <!-- Coaching -->
          <div class="fpr-echo__coaching">
            <div class="fpr-echo__coaching-issue">${esc(analysis.primary_issue || '')}</div>
            ${analysis.explanation
              ? `<div class="fpr-echo__coaching-explanation">${esc(analysis.explanation)}</div>`
              : ''}

            ${analysis.corrections?.length ? `
              <div>
                <div class="fpr-echo__coaching-section-title">Immediate Corrections</div>
                <div class="fpr-echo__corrections-list">
                  ${analysis.corrections.map((c, i) => `
                    <div class="fpr-echo__correction-item">
                      <div class="fpr-echo__correction-num">${i + 1}</div>
                      <div>${esc(c)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${analysis.drills?.length ? `
              <div>
                <div class="fpr-echo__coaching-section-title">Prescribed Drills</div>
                <div class="fpr-echo__drills-list">
                  ${analysis.drills.slice(0, 3).map((d, i) => `
                    <div class="fpr-echo__drill-card">
                      <div class="fpr-echo__drill-rank --${i + 1}">${i + 1}</div>
                      <div class="fpr-echo__drill-name">${esc(d)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${analysis.encouragement
              ? `<div class="fpr-echo__encouragement">💬 ${esc(analysis.encouragement)}</div>`
              : ''}
          </div>
        </div>

        <div class="fpr-echo__disclaimer">⚠️ For training purposes only. Always follow range safety rules and local firearms regulations.</div>

        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="fpr-btn fpr-btn--echo" id="fpr-view-history-btn">${IC.history} Session History</button>
          <button class="fpr-btn fpr-btn--gold" id="fpr-challenge-btn">${IC.share} Challenge a Friend</button>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:12px">
          <button onclick="FPRShare.open('Share Your Shot')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share Your Shot
          </button>
        </div>

      </div>
    `;

    wrap.querySelector('#fpr-new-analysis')?.addEventListener('click', () => {
      state.view = 'upload'; state.pendingFile = null; render();
    });
    wrap.querySelector('#fpr-view-history-btn')?.addEventListener('click', () => {
      state.view = 'history'; render();
    });
    wrap.querySelector('#fpr-challenge-btn')?.addEventListener('click', () => {
      state.view = 'challenge'; render();
    });

    // Draw target after DOM settles
    setTimeout(() => drawTargetCanvas('fpr-target-canvas', session), 80);
    return wrap;
  }

  // ==========================================================================
  // VIEW: HISTORY
  // ==========================================================================
  function buildHistoryView() {
    const wrap = el('div', 'fpr-echo__history-view');
    const ordered = state.sessions.slice().sort((a, b) => a.session_number - b.session_number);

    wrap.innerHTML = `
      <h2 class="fpr-echo__view-heading" style="margin:0 0 4px">Session History</h2>
      <p class="fpr-echo__view-sub" style="margin:0 0 20px">${ordered.length} sessions · ${state.stats.overall_improvement_pct >= 0 ? '+' : ''}${Math.round(state.stats.overall_improvement_pct || 0)}% overall improvement</p>

      <div class="fpr-echo__trend-chart-wrap">
        <canvas class="fpr-echo__trend-canvas" id="fpr-trend-canvas" width="600" height="160"></canvas>
        <div class="fpr-echo__trend-legend">
          <div class="fpr-echo__trend-legend-item"><div class="fpr-echo__trend-legend-dot" style="background:#B91C1C"></div> Beginner (0–59)</div>
          <div class="fpr-echo__trend-legend-item"><div class="fpr-echo__trend-legend-dot" style="background:#C25C00"></div> Developing (60–74)</div>
          <div class="fpr-echo__trend-legend-item"><div class="fpr-echo__trend-legend-dot" style="background:#227A48"></div> Proficient (75–89)</div>
          <div class="fpr-echo__trend-legend-item"><div class="fpr-echo__trend-legend-dot" style="background:#C9973A"></div> Expert (90–100)</div>
        </div>
      </div>

      <div class="fpr-echo__session-cards" id="fpr-session-cards">
        ${ordered.slice().reverse().map(s => buildSessionCard(s)).join('')}
      </div>

      <div class="fpr-echo__disclaimer" style="margin-top:20px">⚠️ For training purposes only. Always follow range safety rules and local firearms regulations.</div>
    `;

    // Wire accordion
    wrap.querySelectorAll('.fpr-echo__session-card-header').forEach(hdr => {
      hdr.addEventListener('click', () => hdr.closest('.fpr-echo__session-card').classList.toggle('--open'));
    });

    setTimeout(() => drawTrendChart('fpr-trend-canvas', ordered), 60);
    return wrap;
  }

  function buildSessionCard(s) {
    const tier  = scoreTier(s.echo_score);
    const date  = new Date(s.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const delta = s.improvement_pct;
    const coaching = s.coaching_json || {};
    return `
      <div class="fpr-echo__session-card">
        <div class="fpr-echo__session-card-header">
          <div class="fpr-echo__session-score-badge --${tier}">${s.echo_score}</div>
          <div class="fpr-echo__session-card-info">
            <div class="fpr-echo__session-card-title">Session ${s.session_number} — ${scoreTierLabel(tier)}</div>
            <div class="fpr-echo__session-card-meta">${date} · ${s.distance_yards || '?'}yd · ${esc(patternLabel(s.pattern))}</div>
          </div>
          ${delta !== null && delta !== undefined
            ? `<div class="fpr-echo__session-card-delta ${delta >= 0 ? '--up' : '--down'}">${delta >= 0 ? '↑' : '↓'}${Math.abs(delta).toFixed(1)}%</div>`
            : ''}
          <div class="fpr-echo__session-card-chevron">${IC.chevron}</div>
        </div>
        <div class="fpr-echo__session-card-body">
          ${coaching.primary_issue ? `<p style="font-size:14px;font-weight:600;color:var(--fpr-gray-900);margin:14px 0 8px">${esc(coaching.primary_issue)}</p>` : ''}
          ${coaching.explanation ? `<p style="font-size:13px;color:var(--fpr-gray-700);line-height:1.7;margin:0 0 12px">${esc(coaching.explanation)}</p>` : ''}
          ${coaching.top_drill ? `<div style="font-size:12px;font-weight:700;color:var(--fpr-gray-400);margin-bottom:4px">Top drill</div><div style="font-size:13px;font-weight:600;color:var(--fpr-gray-900)">${esc(coaching.top_drill)}</div>` : ''}
          <div class="fpr-echo__disclaimer" style="margin-top:12px;font-size:11px">⚠️ For training purposes only. Always follow range safety rules and local firearms regulations.</div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: BADGES
  // ==========================================================================
  function buildBadgesView() {
    const wrap = el('div', 'fpr-echo__badges-view');
    const earnedSlugs = new Set(state.badges.map(b => b.badge_slug));
    const earnedMap   = Object.fromEntries(state.badges.map(b => [b.badge_slug, b]));

    // Merge all (earned + unearned)
    const catalog = [
      ...state.badges,
      ...ALL_BADGES.filter(b => !earnedSlugs.has(b.badge_slug)),
    ];

    const earned  = catalog.filter(b => earnedSlugs.has(b.badge_slug));
    const locked  = catalog.filter(b => !earnedSlugs.has(b.badge_slug));

    wrap.innerHTML = `
      <h2 class="fpr-echo__view-heading" style="margin:0 0 4px">My Badges</h2>
      <p class="fpr-echo__view-sub" style="margin:0 0 6px">${earned.length} earned · ${locked.length} remaining</p>

      <div style="height:6px;background:var(--fpr-gray-100);border-radius:99px;margin-bottom:20px;overflow:hidden">
        <div style="height:100%;width:${Math.round((earned.length / (earned.length + locked.length)) * 100)}%;background:linear-gradient(90deg,var(--fpr-gold),var(--fpr-gold-light));border-radius:99px;transition:width .6s"></div>
      </div>

      ${earned.length ? `
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--fpr-gray-400);text-transform:uppercase;margin-bottom:10px">Earned</div>
        <div class="fpr-echo__badges-grid" style="margin-bottom:24px">
          ${earned.map(b => buildBadgeCard(b, true)).join('')}
        </div>
      ` : ''}

      ${locked.length ? `
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--fpr-gray-400);text-transform:uppercase;margin-bottom:10px">To Unlock</div>
        <div class="fpr-echo__badges-grid">
          ${locked.map(b => buildBadgeCard(b, false)).join('')}
        </div>
      ` : ''}
    `;
    return wrap;
  }

  function buildBadgeCard(b, earned) {
    const tier = b.tier || 'bronze';
    const date = b.earned_at ? new Date(b.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
    return `
      <div class="fpr-echo__badge-card ${earned ? '--earned --' + tier : '--locked'}">
        <span class="fpr-echo__badge-emoji">${b.icon_emoji || '🎖'}</span>
        <div class="fpr-echo__badge-tier --${tier}">${tier}</div>
        <div class="fpr-echo__badge-name">${esc(b.name)}</div>
        <div class="fpr-echo__badge-desc">${esc(b.description)}</div>
        ${earned && date ? `<div class="fpr-echo__badge-earned-date">Earned ${date}</div>` : ''}
        ${!earned ? `<div style="margin-top:8px;font-size:11px;color:var(--fpr-gray-400)">${IC.lock} Locked</div>` : ''}
      </div>
    `;
  }

  // ==========================================================================
  // VIEW: CHALLENGE SHARE
  // ==========================================================================
  function buildChallengeView() {
    const wrap = el('div', 'fpr-echo__challenge-view');
    const s    = state.stats;
    const improve = Math.round(s.overall_improvement_pct || 0);
    const topBadge = state.badges.find(b => b.tier === 'platinum') ||
                     state.badges.find(b => b.tier === 'gold') ||
                     state.badges[state.badges.length - 1];

    const headline = improve >= 1
      ? `I improved my shooting accuracy by ${improve}% in ${s.total_sessions} sessions with Spotter on FPRMembers.com. Can you beat that?`
      : `I scored ${s.latest_echo_score}/100 on my latest Spotter session. Think you can match it?`;

    const shareText = `🎯 ${headline}\n\nMy stats:\n• Echo Score: ${s.latest_echo_score}/100\n• Improvement: ${improve > 0 ? '+' : ''}${improve}% from baseline\n• Sessions logged: ${s.total_sessions}\n${topBadge ? `• Top badge: ${topBadge.icon_emoji} ${topBadge.name}\n` : ''}\nUpload your own target at FPRMembers.com | #EchoCoach #ResponsibleGunOwner #FPRMembers`;

    wrap.innerHTML = `
      <h2 class="fpr-echo__view-heading" style="margin:0 0 4px">Challenge a Friend</h2>
      <p class="fpr-echo__view-sub" style="margin:0 0 20px">Share your improvement stats and challenge friends to match your accuracy.</p>

      <!-- Challenge card -->
      <div class="fpr-echo__challenge-card">
        <div class="fpr-echo__challenge-brand">FPRMembers.com</div>
        <div class="fpr-echo__challenge-title">Spotter — Shot Analysis</div>
        <div class="fpr-echo__challenge-score-row">
          <div>
            <div class="fpr-echo__challenge-score-big">${s.latest_echo_score || 0}</div>
            <div class="fpr-echo__challenge-score-sub">Echo Score</div>
          </div>
          <div style="width:1px;height:60px;background:rgba(255,255,255,.1)"></div>
          <div>
            <div class="fpr-echo__challenge-improve">${improve > 0 ? '+' : ''}${improve}%</div>
            <div class="fpr-echo__challenge-improve-sub">Improvement</div>
          </div>
          <div>
            <div class="fpr-echo__challenge-improve" style="color:#7BBEF5">${s.total_sessions}</div>
            <div class="fpr-echo__challenge-improve-sub">Sessions</div>
          </div>
        </div>
        ${topBadge ? `<div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:12px">${topBadge.icon_emoji} ${topBadge.name} earned</div>` : ''}
        <div class="fpr-echo__challenge-headline">${esc(headline)}</div>
        <div class="fpr-echo__challenge-cta">Can you beat it? Upload your target at FPRMembers.com →</div>
      </div>

      <textarea class="fpr-echo__challenge-share-text" id="fpr-share-text" rows="6" readonly>${shareText}</textarea>

      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="fpr-btn fpr-btn--echo" id="fpr-copy-btn">${IC.copy} Copy Challenge Text</button>
        <button class="fpr-btn fpr-btn--gold" id="fpr-generate-link-btn">${IC.share} Generate Share Link</button>
        <button class="fpr-btn fpr-btn--dark" id="fpr-download-card-btn">Download Card</button>
      </div>

      <div class="fpr-echo__disclaimer" style="margin-top:20px">⚠️ For training purposes only. Always follow range safety rules and local firearms regulations. Share only aggregate stats — never share target photos publicly.</div>
    `;

    wrap.querySelector('#fpr-copy-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(shareText).then(() => showToast('Challenge text copied!', 'success'));
    });

    wrap.querySelector('#fpr-generate-link-btn')?.addEventListener('click', async () => {
      const data = await api('/api/echo/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: state.memberId, memberName: state.memberName }),
      });
      if (data?.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl).then(() =>
          showToast('Share link copied: ' + data.shareUrl, 'success')
        );
      } else {
        showToast('Connect API to generate a share link.', 'blue');
      }
    });

    wrap.querySelector('#fpr-download-card-btn')?.addEventListener('click', () => {
      downloadChallengeCard(s, headline, topBadge);
    });

    return wrap;
  }

  // ==========================================================================
  // CANVAS — Target Visualization
  // ==========================================================================
  function drawTargetCanvas(canvasId, session) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 200, H = 200, cx = 100, cy = 100;

    // Concentric rings
    const rings = [
      { r: 90, color: '#E0E0E0' },
      { r: 72, color: '#CCCCCC' },
      { r: 54, color: '#FFE082' },
      { r: 36, color: '#FF8A65' },
      { r: 18, color: '#EF5350' },
      { r: 7,  color: '#B71C1C' },
    ];
    rings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.fillStyle = ring.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // Crosshair
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx - 90, cy); ctx.lineTo(cx + 90, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 90); ctx.lineTo(cx, cy + 90); ctx.stroke();

    // Generate shot positions based on detected pattern
    const shots = generateShotPositions(session);
    shots.forEach(pt => {
      ctx.beginPath();
      ctx.arc(cx + pt.x, cy - pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1A6BC4';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // Center of mass indicator
    const scaleF = 1.8; // px per mm (approximate for target scale)
    const cmX = (session.center_x_mm || 0) * scaleF;
    const cmY = (session.center_y_mm || 0) * scaleF;
    ctx.strokeStyle = '#E5B657';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx + cmX - 8, cy - cmY); ctx.lineTo(cx + cmX + 8, cy - cmY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + cmX, cy - cmY - 8); ctx.lineTo(cx + cmX, cy - cmY + 8); ctx.stroke();
  }

  function generateShotPositions(session) {
    const count  = Math.min(session.shot_count_detected || 8, 15);
    const cx     = session.center_x_mm || 0;
    const cy_off = session.center_y_mm || 0;
    const radius = session.grouping_radius_mm || 30;
    const scale  = 1.8; // mm to canvas px
    const shots  = [];

    // Deterministic seeded random based on session id
    let seed = Array.from(session.id || 's1').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    for (let i = 0; i < count; i++) {
      const angle  = rand() * Math.PI * 2;
      const r      = rand() * radius * scale * 0.7;
      shots.push({
        x: cx * scale + Math.cos(angle) * r,
        y: cy_off * scale + Math.sin(angle) * r,
      });
    }
    return shots;
  }

  // ==========================================================================
  // CANVAS — Trend Line Chart
  // ==========================================================================
  function drawTrendChart(canvasId, sessions) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !sessions.length) return;

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth || 600;
    const H   = 160;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const PAD = { top: 16, right: 20, bottom: 28, left: 36 };
    const gW  = W - PAD.left - PAD.right;
    const gH  = H - PAD.top  - PAD.bottom;

    // Score zones
    const zones = [
      { min: 0,  max: 60,  color: 'rgba(185,28,28,.08)' },
      { min: 60, max: 75,  color: 'rgba(194,92,0,.08)' },
      { min: 75, max: 90,  color: 'rgba(34,122,72,.08)' },
      { min: 90, max: 100, color: 'rgba(201,151,58,.1)' },
    ];

    zones.forEach(z => {
      const y1 = PAD.top + gH * (1 - z.max / 100);
      const y2 = PAD.top + gH * (1 - z.min / 100);
      ctx.fillStyle = z.color;
      ctx.fillRect(PAD.left, y1, gW, y2 - y1);
    });

    // Grid lines at 60, 75, 90
    [60, 75, 90].forEach(v => {
      const y = PAD.top + gH * (1 - v / 100);
      ctx.strokeStyle = 'rgba(0,0,0,.06)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + gW, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.font = `bold ${10 * dpr / dpr}px Inter, sans-serif`;
      ctx.fillText(v, 2, y + 4);
    });

    if (sessions.length < 2) {
      ctx.fillStyle = '#9AA3AF';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload more sessions to see your trend', W / 2, H / 2);
      return;
    }

    const xs = sessions.map((_, i) => PAD.left + (i / (sessions.length - 1)) * gW);
    const ys = sessions.map(s => PAD.top + gH * (1 - s.echo_score / 100));

    // Gradient fill under the line
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + gH);
    grad.addColorStop(0, 'rgba(26,107,196,.25)');
    grad.addColorStop(1, 'rgba(26,107,196,0)');
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    sessions.forEach((_, i) => { if (i > 0) ctx.lineTo(xs[i], ys[i]); });
    ctx.lineTo(xs[xs.length - 1], PAD.top + gH);
    ctx.lineTo(xs[0], PAD.top + gH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    sessions.forEach((_, i) => { if (i > 0) ctx.lineTo(xs[i], ys[i]); });
    ctx.strokeStyle = '#1A6BC4';
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Points + labels
    sessions.forEach((s, i) => {
      const tier = scoreTier(s.echo_score);
      const dotColor = tier === 'expert' ? '#C9973A' : tier === 'proficient' ? '#227A48' : tier === 'developing' ? '#C25C00' : '#B91C1C';

      ctx.beginPath();
      ctx.arc(xs[i], ys[i], 5, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Session number below
      ctx.fillStyle = '#9AA3AF';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('#' + s.session_number, xs[i], PAD.top + gH + 14);

      // Score above
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillText(s.echo_score, xs[i], ys[i] - 9);
    });
  }

  // ==========================================================================
  // CANVAS — Challenge Card Download
  // ==========================================================================
  function downloadChallengeCard(stats, headline, topBadge) {
    const canvas = document.createElement('canvas');
    canvas.width  = 600;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0F1923';
    ctx.fillRect(0, 0, 600, 340);

    // Gold accent bar
    ctx.fillStyle = '#C9973A';
    ctx.fillRect(0, 0, 600, 4);

    // Brand
    ctx.fillStyle = '#E5B657';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('FPRMEMBERS.COM — Spotter', 32, 36);

    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('SHOT ANALYSIS CHALLENGE', 32, 52);

    // Big score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 80px Inter, sans-serif';
    ctx.fillText(stats.latest_echo_score || 0, 32, 150);

    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('/ 100  ECHO SCORE', 32 + ctx.measureText(String(stats.latest_echo_score || 0)).width + 10, 130);

    // Improvement
    const imp = Math.round(stats.overall_improvement_pct || 0);
    ctx.fillStyle = '#4ADE80';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText((imp > 0 ? '+' : '') + imp + '%', 32, 200);

    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('ACCURACY IMPROVEMENT', 32, 220);

    // Headline (wrapped)
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.font = '14px Inter, sans-serif';
    const words = headline.split(' ');
    let line = '', y = 258;
    words.forEach(w => {
      const test = line + (line ? ' ' : '') + w;
      if (ctx.measureText(test).width > 536) { ctx.fillText(line, 32, y); line = w; y += 20; }
      else { line = test; }
    });
    ctx.fillText(line, 32, y);

    // Badge
    if (topBadge) {
      ctx.font = '20px sans-serif';
      ctx.fillText(topBadge.icon_emoji || '🏅', 490, 160);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(topBadge.name, 503, 178);
      ctx.textAlign = 'left';
    }

    // Disclaimer
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText('For training purposes only. Always follow range safety rules and local firearms regulations.', 32, 322);

    // Download
    const link = document.createElement('a');
    link.download = 'EchoCoach-Challenge-Card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Challenge card downloaded!', 'success');
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function scoreTier(score) {
    if (score >= 90) return 'expert';
    if (score >= 75) return 'proficient';
    if (score >= 60) return 'developing';
    return 'poor';
  }

  function scoreTierLabel(tier) {
    return { expert: 'Expert Grouping', proficient: 'Proficient', developing: 'Developing', poor: 'Building Fundamentals' }[tier] || tier;
  }

  function patternLabel(p) {
    const map = {
      tight_centered: 'Tight & Centered', left_pull: 'Left Pull', right_push: 'Right Push',
      high: 'High', low: 'Low', low_left: 'Low Left', high_right: 'High Right',
      scattered: 'Scattered', unknown: 'Pattern Unknown', no_pattern: 'No Clear Pattern',
    };
    return map[p] || p || 'Unknown';
  }

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function showToast(msg, type = 'success') {
    let wrap = document.querySelector('.fpr-echo__toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'fpr-echo__toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = `fpr-echo__toast --${type}`;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('--out'); setTimeout(() => t.remove(), 300); }, 3800);
  }

  // -------------------------------------------------------------------------
  // Bootstrap
  // -------------------------------------------------------------------------
  async function init(root) {
    state.root       = root;
    state.apiUrl     = (root.dataset.apiUrl || '').replace(/\/$/, '');
    state.memberId   = root.dataset.memberId   || 'demo-member';
    state.memberName = root.dataset.memberName || 'Demo Member';
    root.classList.add('fpr-echo');

    render();
    await loadProfile();
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fpr-echo-mount').forEach(root => window.__fprResolveMount(root).then(function(){ init(root); }));
  });

  window.FPREchoCoach = { init };
})();
