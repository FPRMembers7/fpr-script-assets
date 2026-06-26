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

/* FPRMembers.com — Build 14: Command Center — Power User Intelligence Dashboard
   Mount: <div class="fpr-cmd-mount" data-api-url="" data-member-id="" data-member-name="">
   Bootstrap: FPRCommandCenter.init(document.querySelector('.fpr-cmd-mount'))

   MAP RULE: Opportunity Signals follow Dealer Pulse (Build 4) rules exactly.
   No dollar figures for MAP items. "Strategic Buy Zone" language only.

   DEFAULT BEHAVIOR: Renders opt-in prompt for new members.
   Power users who have enabled Command Center see the full dark intelligence dashboard.
*/

const FPRCommandCenter = (() => {
  // ─── STATE ──────────────────────────────────────────────────────────────────
  let _el, _api, _memberId, _memberName;
  let _isEnabled    = false;
  let _dashboard    = null;
  let _notifications = [];
  let _unreadCount  = 0;
  let _notifFilter  = 'all';
  let _showNotifPanel = false;
  let _refreshTimer  = null;
  let _lastUpdated   = null;
  let _demoMode      = true;

  // ─── STATE GRID CONFIG ──────────────────────────────────────────────────────
  // [state, row, col] — standard US tile map layout (12-col grid)
  const STATE_GRID = [
    ['ME',0,11],['VT',1,9],['NH',1,10],
    ['WA',2,0],['MT',2,1],['ND',2,2],['MN',2,3],['WI',2,4],['MI',2,5],['IL',2,6],['NY',2,9],['MA',2,10],
    ['OR',3,0],['ID',3,1],['WY',3,2],['SD',3,3],['IA',3,4],['IN',3,5],['OH',3,6],['PA',3,7],['NJ',3,8],['CT',3,9],['RI',3,10],
    ['CA',4,0],['NV',4,1],['UT',4,2],['CO',4,3],['NE',4,4],['MO',4,5],['KY',4,6],['WV',4,7],['VA',4,8],['MD',4,9],['DE',4,10],
    ['AZ',5,1],['NM',5,2],['KS',5,3],['AR',5,4],['TN',5,5],['NC',5,6],['SC',5,7],
    ['OK',6,3],['LA',6,4],['MS',6,5],['AL',6,6],['GA',6,7],
    ['TX',7,3],['FL',7,7],
    ['AK',8,0],['HI',8,2],['DC',4,11],
  ];
  const GRID_ROWS = 9, GRID_COLS = 12;

  // ─── DEMO DATA ──────────────────────────────────────────────────────────────
  const DEMO = {
    isEnabled: true,
    dashboard: {
      generated_at: new Date().toISOString(),
      widget_status: { sentinel:'live', dealer_pulse:'live', arsenal_iq:'live', echo_coach:'live', shield_radius:'live', stockpile:'live', ghost_match:'live' },
      sentinel: {
        home_state: 'TX',
        highest_severity: 'HIGH',
        state_threat_map: {
          IL: { severity:'HIGH',    bills:['IL HB 3990'], threat_name:'Magazine Capacity Enforcement' },
          NJ: { severity:'MONITOR', bills:['NJ S 3102'],  threat_name:'Ammo Serialization Mandate'  },
          CA: { severity:'HIGH',    bills:['CA AB 2847'], threat_name:'.50 BMG Component Restrictions' },
          TX: { severity:'WATCH',   bills:['TX HB 2210'], threat_name:'Digital Ammo Records'         },
          NY: { severity:'HIGH',    bills:['NY S 1234'],  threat_name:'Assault Weapon Definitions'   },
          MD: { severity:'WATCH',   bills:['MD HB 567'],  threat_name:'Handgun Permitting Change'    },
          MA: { severity:'WATCH',   bills:['MA S 890'],   threat_name:'Registration Expansion'       },
          WA: { severity:'WATCH',   bills:['WA HB 112'],  threat_name:'Sale Restrictions'            },
        },
        threat_summary: { CRITICAL:0, HIGH:4, WATCH:5, MONITOR:1, NONE:42 },
        top_threats: [
          { severity:'HIGH',  bill_number:'S. 1892', threat_name:'Ammunition Background Check Act',  description:'Federal bill requiring NICS checks for purchases over 500 rounds. Passed committee.' },
          { severity:'HIGH',  bill_number:'IL HB 3990', threat_name:'IL Magazine Capacity Enforcement', description:'Illinois bill strengthening enforcement of 10-round limit with mandatory forfeiture.' },
          { severity:'WATCH', bill_number:'TX HB 2210', threat_name:'TX Digital Ammo Purchase Records',  description:'Texas bill requiring digital record-keeping for retail ammo sales over 1,000 rounds.' },
        ],
      },
      dealer_pulse: {
        signals: [
          { signal_type:'strategic_buy_zone', type_label:'Strategic Buy Zone', type_color:'#F59E0B', type_icon:'🟡', signal_name:'Glock 17 Gen5 9mm', display_text:'Availability window detected — favorable acquisition conditions across distributor network.', created_at: new Date(Date.now()-3600000).toISOString() },
          { signal_type:'supply_constraint',  type_label:'Supply Constraint',  type_color:'#EF4444', type_icon:'🔴', signal_name:'5.56 NATO / .223 — West Coast Distributors', display_text:'Shipping delays impacting 5.56 NATO availability at West Coast distributors. Southwest region affected.', created_at: new Date(Date.now()-7200000).toISOString() },
          { signal_type:'availability_window',type_label:'Availability Window',type_color:'#3B82F6', type_icon:'🔵', signal_name:'Sig Sauer P365 XL Platform', display_text:'Increased regional availability noted for P365 XL. Favorable conditions for member procurement window.', created_at: new Date(Date.now()-14400000).toISOString() },
          { signal_type:'demand_spike',       type_label:'Demand Signal',      type_color:'#8B5CF6', type_icon:'🟣', signal_name:'9mm Defensive Loads — SW Region', display_text:'Elevated regional demand signal for 9mm defensive loads. Southwest states showing 31% above baseline demand.', created_at: new Date(Date.now()-21600000).toISOString() },
          { signal_type:'fas_elevated',       type_label:'Scarcity Risk Elevated', type_color:'#F59E0B', type_icon:'⚠️', signal_name:'5.56 Platform Accessories', display_text:'Future Availability Score: 74/100 for 5.56 accessories category. Scarcity risk elevated.', created_at: new Date(Date.now()-28800000).toISOString() },
        ],
        buy_zone_count: 1, critical_count: 1,
      },
      arsenal_iq: {
        total_score: 62, score_tier: 'established',
        foundation_score:22, coverage_score:18, readiness_score:7, life_stage_score:15,
        gap_count_critical:0, gap_count_high:3,
        top_gaps: [
          { role_id:'training_platform', headline:'No .22 LR training platform — highest-ROI gap for a family of four', priority:'HIGH' },
          { role_id:'home_defense_staged', headline:'Single home defense firearm in a large home creates positional vulnerability', priority:'HIGH' },
          { role_id:'versatile_rifle', headline:'No centerfire rifle limits defensive range in rural or large-home scenarios', priority:'MEDIUM' },
        ],
        scored_at: new Date(Date.now()-86400000).toISOString(),
      },
      echo_coach: {
        total_sessions:12, latest_score:78, best_score:82, improvement_pct:34.5,
        dominant_pattern:'Left pull — elbow flare on trigger press',
        recent_scores:[52,58,61,67,72,74],
        trend:'improving',
      },
      shield_radius: {
        upcoming_trips:[
          { id:'t1', origin_address:'Austin, TX', destination_address:'Orlando, FL', status:'analyzed', stop_count:'2', caution_count:'3', total_corridors:'5' },
        ],
        recent_alerts:[], has_active_alerts:true,
      },
      stockpile: {
        resilience_score:67, score_tier:'moderate', days_of_supply:113,
        active_signals:[
          { signal_name:'West Coast Port Congestion',   severity:'HIGH',  affected_calibers:['9mm','.223 Remington'] },
          { signal_name:'Primer Manufacturing Reduction',severity:'HIGH',  affected_calibers:['9mm','.45 ACP'] },
        ],
        critical_signals:0,
      },
      ghost_match: {
        verification_status:'fully_verified', is_verified:true,
        active_groups:1, pending_responses:1,
        recent_groups:[{ id:'g1', status:'proposed', member_count:3, proposed_at:new Date(Date.now()-3600000).toISOString() }],
      },
    },
    notifications: [
      { id:'n1', source_build:'sentinel',      source:'sentinel',      label:'Sentinel',   severity:'HIGH',  title:'S. 1892 — Ammo Background Check Act',   body:'Passed committee. Awaiting floor vote. Monitor for timeline updates.',    created_at:new Date(Date.now()-3600000).toISOString(),  is_read:false },
      { id:'n2', source_build:'stockpile',     source:'stockpile',     label:'Stockpile',  severity:'HIGH',  title:'West Coast Port Congestion — HIGH',       body:'9mm and .223 availability impacted. Estimated 3-5 week delay.',           created_at:new Date(Date.now()-7200000).toISOString(),  is_read:false },
      { id:'n3', source_build:'ghost_match',   source:'ghost_match',   label:'Ghost Match',severity:'INFO',  title:'New Range Day Match Proposal',             body:'3 verified members matched near you — respond within 7 days.',           created_at:new Date(Date.now()-10800000).toISOString(), is_read:true  },
      { id:'n4', source_build:'arsenal_iq',    source:'arsenal_iq',    label:'Arsenal IQ', severity:'WATCH', title:'Arsenal IQ Recalculated — 62/100',         body:'Supply chain signals reduced your Supply Health score. 3 HIGH priority gaps.', created_at:new Date(Date.now()-21600000).toISOString(), is_read:true },
      { id:'n5', source_build:'echo_coach',    source:'echo_coach',    label:'Spotter', severity:'INFO',  title:'Session #12 Analyzed — Score: 78',         body:'Dominant pattern: Left pull. 34.5% improvement from baseline.',           created_at:new Date(Date.now()-86400000).toISOString(), is_read:true  },
      { id:'n6', source_build:'shield_radius', source:'shield_radius', label:'Shield-Radius', severity:'WATCH','title':'TX → FL Trip — 2 STOP Corridors Detected', body:'Mag restriction and FOPA compliance required in 2 states on your route.', created_at:new Date(Date.now()-172800000).toISOString(),is_read:true  },
    ],
  };

  // ─── UTILS ──────────────────────────────────────────────────────────────────
  // Demo fallback helper: in demo mode return the demo value, otherwise return
  // the empty fallback. Prevents fake "Sarah M./Austin→Orlando/Score:62" data
  // from leaking into production widgets when the real source returns null.
  function demoOr(realValue, demoValue, emptyValue = null) {
    if (realValue != null && !(Array.isArray(realValue) && realValue.length === 0)) return realValue;
    return _demoMode ? demoValue : emptyValue;
  }

  function scoreColor(s) {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    if (s >= 40) return '#F97316';
    return '#EF4444';
  }
  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.round(diff / 60000);
    const hours = Math.round(diff / 3600000);
    const days  = Math.round(diff / 86400000);
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
  function threatColor(sev) {
    const colors = { CRITICAL:'#EF4444', HIGH:'#F59E0B', WATCH:'#3B82F6', MONITOR:'#6B7280', NONE:'#1E293B' };
    return colors[sev] || colors.NONE;
  }

  // ─── CANVAS: SCORE RING ──────────────────────────────────────────────────────
  function drawScoreRing(canvas, score, color) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size/2, cy = size/2, r = size/2 - 4;
    ctx.clearRect(0,0,size,size);
    ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 5; ctx.stroke();
    const pct = (score||0)/100;
    ctx.beginPath(); ctx.arc(cx,cy,r, -Math.PI/2, -Math.PI/2 + 2*Math.PI*pct);
    ctx.strokeStyle = color || scoreColor(score); ctx.lineWidth = 5;
    ctx.lineCap = 'round'; ctx.stroke();
  }

  // ─── CANVAS: Spotter TREND LINE ──────────────────────────────────────────
  function drawTrendLine(canvas, scores) {
    if (!canvas || !scores?.length) return;
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    if (scores.length < 2) return;
    const min = Math.min(...scores) - 5;
    const max = Math.max(...scores) + 5;
    const toX = (i)  => 8 + (i / (scores.length - 1)) * (W - 16);
    const toY = (v)  => H - 6 - ((v - min) / (max - min)) * (H - 12);

    // Background gradient fill
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, 'rgba(6,182,212,.2)'); grad.addColorStop(1, 'rgba(6,182,212,.0)');
    ctx.beginPath(); ctx.moveTo(toX(0), H);
    scores.forEach((s,i) => ctx.lineTo(toX(i), toY(s)));
    ctx.lineTo(toX(scores.length-1), H); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath(); scores.forEach((s,i) => { i===0?ctx.moveTo(toX(0),toY(s)):ctx.lineTo(toX(i),toY(s)); });
    ctx.strokeStyle = '#06B6D4'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

    // Dots
    scores.forEach((s,i) => {
      ctx.beginPath(); ctx.arc(toX(i), toY(s), 3, 0, 2*Math.PI);
      ctx.fillStyle = '#06B6D4'; ctx.fill();
    });
  }

  // ─── STATE MAP ──────────────────────────────────────────────────────────────
  function buildStateGrid(stateThreatMap, homeState) {
    const cells = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const found = STATE_GRID.find(([s,r,c]) => r===row && c===col);
        if (!found) { cells.push(`<div class="fpr-cmd-state-cell empty" style="grid-area:${row+1}/${col+1}"></div>`); continue; }
        const [state] = found;
        const threat  = stateThreatMap?.[state] || {};
        const sev     = threat.severity || 'NONE';
        const isHome  = state === homeState;
        const tooltip = threat.threat_name ? `${state}: ${sev} — ${threat.threat_name}` : `${state}: No active threats`;
        cells.push(`<div class="fpr-cmd-state-cell ${sev}${isHome?' home-state':''}" style="grid-area:${row+1}/${col+1}" data-state="${state}" data-sev="${sev}" title="${tooltip}">${state}<span class="fpr-cmd-map-tooltip">${tooltip}</span></div>`);
      }
    }
    return cells.join('');
  }

  // ─── WIDGET RENDERERS ────────────────────────────────────────────────────────
  function wStatus(key) {
    const s = _dashboard?.widget_status?.[key] || 'unavailable';
    return `<span class="fpr-cmd-panel-status ${s}" title="${s}"></span>`;
  }

  function renderLegislativeMap() {
    const d = demoOr(_dashboard?.sentinel, DEMO.dashboard.sentinel, { state_threat_map: {}, threat_summary: {}, home_state: null });
    const summary = d.threat_summary || {};
    return `<div class="fpr-cmd-panel" style="grid-column:1">
      <div class="fpr-cmd-panel-header">
        <span class="fpr-cmd-panel-icon">🗺</span>
        <span class="fpr-cmd-panel-title">Legislative Threat Map</span>
        ${wStatus('sentinel')}
        <button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="sentinel">Open Sentinel →</button>
      </div>
      <div class="fpr-cmd-panel-body">
        <div class="fpr-cmd-map-summary">
          ${['CRITICAL','HIGH','WATCH','MONITOR'].map(s => summary[s]>0?`
            <div class="fpr-cmd-map-stat">
              <span class="fpr-cmd-map-stat-num" style="color:${threatColor(s)}">${summary[s]}</span>
              <span class="fpr-cmd-map-stat-label">${s}</span>
            </div>`:'').join('')}
          <div class="fpr-cmd-map-stat">
            <span class="fpr-cmd-map-stat-num" style="color:#334155">${summary.NONE||0}</span>
            <span class="fpr-cmd-map-stat-label">CLEAR</span>
          </div>
        </div>
        <div class="fpr-cmd-state-grid" style="grid-template-rows:repeat(${GRID_ROWS},1fr);grid-template-columns:repeat(${GRID_COLS},1fr);height:140px">
          ${buildStateGrid(d.state_threat_map, d.home_state)}
        </div>
        <div class="fpr-cmd-map-legend">
          ${['CRITICAL','HIGH','WATCH','MONITOR'].map(s => `<div class="fpr-cmd-legend-item"><span class="fpr-cmd-legend-dot" style="background:${threatColor(s)}"></span>${s}</div>`).join('')}
          <div class="fpr-cmd-legend-item"><span class="fpr-cmd-legend-dot" style="border:1px solid #06B6D4;background:transparent"></span>HOME STATE</div>
        </div>
      </div>
    </div>`;
  }

  function renderOpportunitySignals() {
    const d = demoOr(_dashboard?.dealer_pulse, DEMO.dashboard.dealer_pulse, { signals: [] });
    const signals = (d.signals || []).slice(0, 6);
    return `<div class="fpr-cmd-panel" style="grid-column:2">
      <div class="fpr-cmd-panel-header">
        <span class="fpr-cmd-panel-icon">📡</span>
        <span class="fpr-cmd-panel-title">Opportunity Signals</span>
        ${wStatus('dealer_pulse')}
        <button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="dealer-pulse">Open Dealer Pulse →</button>
      </div>
      <div class="fpr-cmd-panel-body">
        ${signals.length === 0
          ? `<div class="fpr-cmd-signal-empty">No active signals — market conditions are quiet.</div>`
          : `<div class="fpr-cmd-signal-list">
              ${signals.map(s => `
                <div class="fpr-cmd-signal-item">
                  <span class="fpr-cmd-signal-type-icon">${s.type_icon || '📡'}</span>
                  <div style="flex:1">
                    <div class="fpr-cmd-signal-name">${s.signal_name}</div>
                    <div class="fpr-cmd-signal-desc">${s.display_text}</div>
                    <div class="fpr-cmd-signal-meta">
                      <span class="fpr-cmd-signal-type-badge" style="background:${s.type_color}22;color:${s.type_color}">${s.type_label}</span>
                      <span class="fpr-cmd-signal-age">${timeAgo(s.created_at)}</span>
                    </div>
                  </div>
                </div>`).join('')}
            </div>
            <div class="fpr-cmd-map-rule-note" style="margin-top:8px">
              🔒 MAP-covered items: "Strategic Buy Zone" language only — no pricing shown
            </div>`}
      </div>
    </div>`;
  }

  function renderArsenalIQ() {
    const d = demoOr(_dashboard?.arsenal_iq, DEMO.dashboard.arsenal_iq, { total_score: null, score_tier: '—', gap_count_critical: 0, gap_count_high: 0, top_gaps: [] });
    if (d.total_score == null) {
      return `<div class="fpr-cmd-panel">
        <div class="fpr-cmd-panel-header"><span class="fpr-cmd-panel-icon">🔫</span><span class="fpr-cmd-panel-title">Arsenal IQ</span>${wStatus('arsenal_iq')}<button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="arsenal-iq">Open →</button></div>
        <div class="fpr-cmd-panel-body"><div style="font-size:11.5px;color:#475569">No Arsenal IQ score on file — open Arsenal IQ to build your profile.</div></div>
      </div>`;
    }
    const color = scoreColor(d.total_score);
    return `<div class="fpr-cmd-panel">
      <div class="fpr-cmd-panel-header">
        <span class="fpr-cmd-panel-icon">🔫</span>
        <span class="fpr-cmd-panel-title">Arsenal IQ</span>
        ${wStatus('arsenal_iq')}
        <button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="arsenal-iq">Open →</button>
      </div>
      <div class="fpr-cmd-panel-body">
        <div class="fpr-cmd-score-layout">
          <div class="fpr-cmd-score-ring">
            <canvas id="cmd-arsenal-ring" width="64" height="64"></canvas>
            <span class="fpr-cmd-score-ring-num" style="color:${color}">${d.total_score}</span>
          </div>
          <div class="fpr-cmd-score-meta">
            <strong style="color:${color}">${d.score_tier?.replace(/_/g,' ')?.toUpperCase()}</strong>
            <span>${d.gap_count_critical||0} critical · ${d.gap_count_high||0} high gaps</span>
          </div>
        </div>
        <div class="fpr-cmd-gap-list">
          ${(d.top_gaps||[]).slice(0,3).map(g => `
            <div class="fpr-cmd-gap-item">
              <span class="fpr-cmd-gap-priority ${g.priority}">${g.priority}</span>
              <span class="fpr-cmd-gap-name">${g.headline || g.role_id?.replace(/_/g,' ')}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderEchoCoach() {
    const d = demoOr(_dashboard?.echo_coach, DEMO.dashboard.echo_coach, { latest_score: null, total_sessions: 0, best_score: 0, improvement_pct: 0, recent_scores: [], trend: 'neutral', dominant_pattern: null });
    if (d.latest_score == null) {
      return `<div class="fpr-cmd-panel">
        <div class="fpr-cmd-panel-header"><span class="fpr-cmd-panel-icon">🎯</span><span class="fpr-cmd-panel-title">Spotter</span>${wStatus('echo_coach')}<button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="echo-coach">Open →</button></div>
        <div class="fpr-cmd-panel-body"><div style="font-size:11.5px;color:#475569">No Spotter sessions yet — analyze your first session to start tracking trends.</div></div>
      </div>`;
    }
    const trend = d.trend === 'improving' ? '▲' : d.trend === 'declining' ? '▼' : '—';
    const trendColor = d.trend === 'improving' ? '#10B981' : d.trend === 'declining' ? '#EF4444' : '#6B7280';
    return `<div class="fpr-cmd-panel">
      <div class="fpr-cmd-panel-header">
        <span class="fpr-cmd-panel-icon">🎯</span>
        <span class="fpr-cmd-panel-title">Spotter</span>
        ${wStatus('echo_coach')}
        <button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="echo-coach">Open →</button>
      </div>
      <div class="fpr-cmd-panel-body">
        <div class="fpr-cmd-echo-layout">
          <canvas id="cmd-echo-trend" class="fpr-cmd-trend-canvas" width="100" height="52"></canvas>
          <div class="fpr-cmd-echo-stats">
            <div class="fpr-cmd-echo-stat">
              <span class="fpr-cmd-echo-stat-val" style="color:${scoreColor(d.latest_score)}">${d.latest_score}<span class="fpr-cmd-trend-arrow" style="color:${trendColor};font-size:14px">${trend}</span></span>
              <div class="fpr-cmd-echo-stat-label">Latest Score</div>
            </div>
            <div class="fpr-cmd-echo-stat">
              <span class="fpr-cmd-echo-stat-val" style="font-size:14px;color:#10B981">+${d.improvement_pct?.toFixed(1)}%</span>
              <div class="fpr-cmd-echo-stat-label">Improvement</div>
            </div>
          </div>
        </div>
        ${d.dominant_pattern ? `<span class="fpr-cmd-pattern-badge">${d.dominant_pattern}</span>` : ''}
        <div style="font-size:10px;color:#475569;margin-top:8px">${d.total_sessions} sessions · Best: ${d.best_score}</div>
      </div>
    </div>`;
  }

  function renderTravelAlerts() {
    const d = demoOr(_dashboard?.shield_radius, DEMO.dashboard.shield_radius, { upcoming_trips: [], recent_alerts: [], has_active_alerts: false });
    const trips = d.upcoming_trips || [];
    return `<div class="fpr-cmd-panel">
      <div class="fpr-cmd-panel-header">
        <span class="fpr-cmd-panel-icon">🛡</span>
        <span class="fpr-cmd-panel-title">Shield-Radius</span>
        ${wStatus('shield_radius')}
        <button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="shield-radius">Open →</button>
      </div>
      <div class="fpr-cmd-panel-body">
        ${trips.length === 0
          ? `<div style="font-size:11.5px;color:#475569;padding:8px 0">No active travel plans on file.</div>`
          : `<div class="fpr-cmd-trip-list">
              ${trips.map(t => {
                const stops   = parseInt(t.stop_count)   || 0;
                const caution = parseInt(t.caution_count) || 0;
                const cls     = stops > 0 ? 'has-stop' : caution > 0 ? 'has-caution' : 'clear';
                const orig    = (t.origin_address||'').split(',')[0];
                const dest    = (t.destination_address||'').split(',')[0];
                return `<div class="fpr-cmd-trip-item ${cls}">
                  <div class="fpr-cmd-trip-route">${orig}<span class="fpr-cmd-trip-route-arrow">→</span>${dest}</div>
                  <div class="fpr-cmd-trip-flags">
                    ${stops   ? `<span class="fpr-cmd-trip-flag stop">${stops} STOP</span>` : ''}
                    ${caution ? `<span class="fpr-cmd-trip-flag caution">${caution} CAUTION</span>` : ''}
                    ${!stops && !caution ? `<span class="fpr-cmd-trip-flag ok">CLEAR</span>` : ''}
                  </div>
                </div>`;}).join('')}
            </div>`}
        <div style="font-size:10px;color:#475569;margin-top:8px">For informational purposes only — always verify current state laws before travel.</div>
      </div>
    </div>`;
  }

  function renderStockpile() {
    const d = demoOr(_dashboard?.stockpile, DEMO.dashboard.stockpile, { resilience_score: null, score_tier: null, days_of_supply: null, active_signals: [], critical_signals: 0 });
    const color = scoreColor(d.resilience_score || 0);
    return `<div class="fpr-cmd-panel">
      <div class="fpr-cmd-panel-header">
        <span class="fpr-cmd-panel-icon">📦</span>
        <span class="fpr-cmd-panel-title">Stockpile AI</span>
        ${wStatus('stockpile')}
        <button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="stockpile">Open →</button>
      </div>
      <div class="fpr-cmd-panel-body">
        ${d.resilience_score != null
          ? `<div class="fpr-cmd-mini-score" style="color:${color}">${d.resilience_score}</div>
             <div class="fpr-cmd-mini-label">Resilience Score · ${d.days_of_supply || 0}d avg supply</div>`
          : `<div style="font-size:11.5px;color:#475569">No score on file — complete your stockpile profile.</div>`}
        ${(d.active_signals||[]).length ? `
          <div class="fpr-cmd-signal-pills" style="margin-top:8px">
            ${d.active_signals.map(s => `<span class="fpr-cmd-signal-pill ${s.severity}">${s.signal_name.slice(0,24)}</span>`).join('')}
          </div>` : ''}
      </div>
    </div>`;
  }

  function renderGhostMatch() {
    const d = demoOr(_dashboard?.ghost_match, DEMO.dashboard.ghost_match, { verification_status: 'unverified', is_verified: false, active_groups: 0, pending_responses: 0, recent_groups: [] });
    return `<div class="fpr-cmd-panel">
      <div class="fpr-cmd-panel-header">
        <span class="fpr-cmd-panel-icon">🎯</span>
        <span class="fpr-cmd-panel-title">Ghost Match</span>
        ${wStatus('ghost_match')}
        <button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="ghost-match">Open →</button>
      </div>
      <div class="fpr-cmd-panel-body">
        ${d.is_verified
          ? `<div class="fpr-cmd-ghost-stat">
               <span class="fpr-cmd-ghost-num">${d.active_groups || 0}</span>
               <span class="fpr-cmd-ghost-desc">active group${d.active_groups!==1?'s':''}</span>
             </div>
             ${d.pending_responses ? `<div style="font-size:11px;color:#F59E0B;font-weight:700">⚡ ${d.pending_responses} response${d.pending_responses!==1?'s':''} pending</div>` : ''}
             <div class="fpr-cmd-mini-label" style="margin-top:6px">✓ Identity verified</div>`
          : `<div style="font-size:11.5px;color:#475569;margin-bottom:8px">Complete identity verification to join Ghost Match.</div>
             <button class="fpr-cmd-btn-navigate" data-action="navigate" data-target="ghost-match">Verify Identity →</button>`}
      </div>
    </div>`;
  }

  function renderNotificationCenter() {
    // Only fall back to demo notifications in demo mode — production
    // members with zero notifications should see the empty state.
    const allNotifs = _notifications.length ? _notifications : (_demoMode ? DEMO.notifications : []);
    const filtered  = _notifFilter === 'all' ? allNotifs
      : allNotifs.filter(n => (n.source_build || n.source) === _notifFilter);
    const sources   = [...new Set(allNotifs.map(n => n.source_build || n.source))];

    return `<div class="fpr-cmd-notif-panel">
      <div class="fpr-cmd-notif-header">
        <span class="fpr-cmd-panel-icon">🔔</span>
        <span class="fpr-cmd-notif-title">Master Notification Center</span>
        <div class="fpr-cmd-notif-filters">
          <button class="fpr-cmd-notif-filter${_notifFilter==='all'?' active':''}" data-action="filter-notif" data-filter="all">All</button>
          ${sources.slice(0,5).map(s => `<button class="fpr-cmd-notif-filter${_notifFilter===s?' active':''}" data-action="filter-notif" data-filter="${s}">${s.replace(/_/g,' ')}</button>`).join('')}
        </div>
        <button class="fpr-cmd-notif-dismiss-all" data-action="dismiss-all">Dismiss all</button>
      </div>
      <div class="fpr-cmd-notif-list" id="cmd-notif-list">
        ${filtered.length === 0
          ? `<div class="fpr-cmd-notif-empty">No notifications — all clear across all platform features.</div>`
          : filtered.map(n => `
            <div class="fpr-cmd-notif-item${!n.is_read?' unread':''}" data-notif-id="${n.id}">
              <span class="fpr-cmd-notif-source ${n.source_build||n.source}">${(n.label||(n.source_build||n.source||'').replace(/_/g,' ')).slice(0,12)}</span>
              <div class="fpr-cmd-notif-body">
                <div class="fpr-cmd-notif-title-text">${n.title}<span class="fpr-cmd-notif-sev ${n.severity}">${n.severity}</span></div>
                ${n.body ? `<div class="fpr-cmd-notif-desc">${n.body}</div>` : ''}
                <div class="fpr-cmd-notif-time">${timeAgo(n.created_at||n.generated_at)}</div>
              </div>
              <button class="fpr-cmd-notif-dismiss" data-action="dismiss-notif" data-id="${n.id}" title="Dismiss">×</button>
            </div>`).join('')}
      </div>
    </div>`;
  }

  function renderMemberStats() {
    const arsenal = demoOr(_dashboard?.arsenal_iq, DEMO.dashboard.arsenal_iq, { total_score: null });
    const echo    = demoOr(_dashboard?.echo_coach,  DEMO.dashboard.echo_coach,  { latest_score: null, improvement_pct: 0 });
    const stock   = demoOr(_dashboard?.stockpile,   DEMO.dashboard.stockpile,   { resilience_score: null });
    const ghost   = demoOr(_dashboard?.ghost_match, DEMO.dashboard.ghost_match, { is_verified: false, active_groups: 0 });
    const alertsCount = _notifications.length || (_demoMode ? DEMO.notifications.length : 0);
    return `<div class="fpr-cmd-stats-bar">
      <div class="fpr-cmd-stat-item">
        <span class="fpr-cmd-stat-val" style="color:${arsenal.total_score!=null?scoreColor(arsenal.total_score):'#475569'}">${arsenal.total_score ?? '—'}</span>
        <div class="fpr-cmd-stat-label">Arsenal IQ</div>
      </div>
      <div class="fpr-cmd-stat-item">
        <span class="fpr-cmd-stat-val" style="color:${stock.resilience_score!=null?scoreColor(stock.resilience_score):'#475569'}">${stock.resilience_score ?? '—'}</span>
        <div class="fpr-cmd-stat-label">Stockpile IQ</div>
      </div>
      <div class="fpr-cmd-stat-item">
        <span class="fpr-cmd-stat-val" style="color:${echo.latest_score!=null?scoreColor(echo.latest_score):'#475569'}">${echo.latest_score ?? '—'}</span>
        <div class="fpr-cmd-stat-label">Spotter</div>
      </div>
      <div class="fpr-cmd-stat-item">
        <span class="fpr-cmd-stat-val">${echo.improvement_pct != null ? echo.improvement_pct.toFixed(0) + '%' : '—'}</span>
        <div class="fpr-cmd-stat-label">Shooting Improvement</div>
      </div>
      <div class="fpr-cmd-stat-item">
        <span class="fpr-cmd-stat-val" style="color:${ghost.is_verified?'#10B981':'#6B7280'}">${ghost.active_groups||0}</span>
        <div class="fpr-cmd-stat-label">Ghost Groups</div>
      </div>
      <div class="fpr-cmd-stat-item">
        <span class="fpr-cmd-stat-val">${alertsCount}</span>
        <div class="fpr-cmd-stat-label">Alerts</div>
      </div>
    </div>`;
  }

  // ─── OPT-IN SCREEN ──────────────────────────────────────────────────────────
  function renderOptIn() {
    return `<div class="fpr-cmd-optin">
      <div class="fpr-cmd-optin-icon">🛰</div>
      <h1 class="fpr-cmd-optin-title">Command Center</h1>
      <p class="fpr-cmd-optin-sub">
        The power user dashboard for engaged FPRMembers. Pulls live intelligence from every platform feature into one dark-themed command view — legislative threats, opportunity signals, Arsenal IQ, Spotter progress, travel alerts, and more.
      </p>
      <div class="fpr-cmd-optin-note">
        📌 <strong>Default homepage remains clean for new members.</strong> Command Center is an opt-in toggle for power users who want a real-time intelligence overview. You can switch back at any time.
      </div>
      <div class="fpr-cmd-optin-features">
        <div class="fpr-cmd-optin-feature"><span class="fpr-cmd-optin-feature-icon">🗺</span><div><strong>Legislative Threat Map</strong><span>State-by-state heatmap from Sentinel intelligence feeds</span></div></div>
        <div class="fpr-cmd-optin-feature"><span class="fpr-cmd-optin-feature-icon">📡</span><div><strong>Live Opportunity Signals</strong><span>MAP-compliant buy zone signals from Dealer Pulse</span></div></div>
        <div class="fpr-cmd-optin-feature"><span class="fpr-cmd-optin-feature-icon">🔫</span><div><strong>Arsenal IQ Summary</strong><span>Your armory score and top priority gaps at a glance</span></div></div>
        <div class="fpr-cmd-optin-feature"><span class="fpr-cmd-optin-feature-icon">🔔</span><div><strong>Master Notification Center</strong><span>Every platform alert in one feed — filterable, dismissible</span></div></div>
      </div>
      <button class="fpr-cmd-btn fpr-cmd-btn-primary" style="font-size:15px;padding:14px 32px" data-action="enable-command-center">
        Activate Command Center →
      </button>
      <div style="font-size:11px;color:#334155;margin-top:10px">You can return to the standard homepage at any time from the header.</div>
    </div>`;
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  function render() {
    if (!_isEnabled) {
      _el.innerHTML = `<div class="fpr-cmd">${renderOptIn()}</div>`;
      attachHandlers();
      return;
    }

    const unread = (_notifications.length ? _notifications : (_demoMode ? DEMO.notifications : [])).filter(n => !n.is_read).length;
    const lastUp = _lastUpdated ? timeAgo(_lastUpdated) : 'loading…';

    _el.innerHTML = `<div class="fpr-cmd">
      <div class="fpr-cmd-header">
        <span class="fpr-cmd-brand">FPRMembers</span>
        <span class="fpr-cmd-title">Command Center</span>
        <span class="fpr-cmd-live-dot"></span>
        <span class="fpr-cmd-live-text">LIVE</span>
        <span class="fpr-cmd-updated">Updated ${lastUp}</span>
        <div class="fpr-cmd-header-right">
          <span class="fpr-cmd-member-line">
            <strong>${_memberName || 'Member'}</strong>
          </span>
          <button class="fpr-cmd-notif-btn" data-action="toggle-notif">
            🔔${unread > 0 ? `<span class="fpr-cmd-notif-badge">${unread}</span>` : ''}
          </button>
          <button class="fpr-cmd-refresh-btn" data-action="refresh">⟳ Refresh</button>
          <button class="fpr-cmd-disable-btn" data-action="disable-command-center">← Standard View</button>
        </div>
      </div>

      <div class="fpr-cmd-body" id="cmd-body">
        ${renderMemberStats()}

        <div class="fpr-cmd-row-main" style="display:grid;grid-template-columns:1.45fr 1fr;gap:12px;margin-bottom:12px">
          ${renderLegislativeMap()}
          ${renderOpportunitySignals()}
        </div>

        <div class="fpr-cmd-row-widgets" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px">
          ${renderArsenalIQ()}
          ${renderEchoCoach()}
          ${renderTravelAlerts()}
          ${renderStockpile()}
        </div>

        ${renderNotificationCenter()}

        <div style="display:flex;justify-content:flex-end;padding:8px 0 4px">
          <button onclick="FPRShare.open('Share Your Intel')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share Your Intel
          </button>
        </div>
      </div>
    </div>`;

    attachHandlers();

    // Draw canvases post-DOM. Skip draws when the widget rendered its empty
    // state (the canvas elements won't exist in the DOM either).
    requestAnimationFrame(() => {
      const aiq  = demoOr(_dashboard?.arsenal_iq, DEMO.dashboard.arsenal_iq, null);
      const echo = demoOr(_dashboard?.echo_coach,  DEMO.dashboard.echo_coach,  null);
      const arsenalCanvas = document.getElementById('cmd-arsenal-ring');
      const echoCanvas    = document.getElementById('cmd-echo-trend');
      if (arsenalCanvas && aiq?.total_score != null) drawScoreRing(arsenalCanvas, aiq.total_score, scoreColor(aiq.total_score));
      if (echoCanvas    && echo?.recent_scores?.length) drawTrendLine(echoCanvas, echo.recent_scores);
    });

    // Start auto-refresh
    startAutoRefresh();
  }

  // ─── HANDLERS ───────────────────────────────────────────────────────────────
  function attachHandlers() {
    _el.addEventListener('click', handleClick, { once: true });
  }

  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) { attachHandlers(); return; }
    const action = btn.dataset.action;

    switch (action) {
      case 'enable-command-center':
        _isEnabled = true;
        if (!_demoMode) savePreferences(true);
        _dashboard = DEMO.dashboard;
        _notifications = DEMO.notifications;
        _lastUpdated   = new Date().toISOString();
        window.fprAwardTicket('command_center_activated', {});
        render();
        break;
      case 'disable-command-center':
        _isEnabled = false;
        stopAutoRefresh();
        if (!_demoMode) savePreferences(false);
        render();
        break;
      case 'refresh':
        loadData().then(() => render());
        break;
      case 'toggle-notif':
        _showNotifPanel = !_showNotifPanel;
        render();
        break;
      case 'filter-notif':
        _notifFilter = btn.dataset.filter;
        render();
        break;
      case 'dismiss-notif':
        dismissNotification(btn.dataset.id);
        break;
      case 'dismiss-all':
        dismissAllNotifications();
        break;
      case 'navigate':
        handleNavigate(btn.dataset.target);
        attachHandlers();
        break;
      default:
        attachHandlers();
    }
  }

  function handleNavigate(target) {
    const urlMap = {
      'sentinel':      '/members/sentinel',
      'dealer-pulse':  '/members/dealer-pulse',
      'arsenal-iq':    '/members/arsenal-iq',
      'echo-coach':    '/members/echo-coach',
      'shield-radius': '/members/shield-radius',
      'stockpile':     '/members/stockpile',
      'ghost-match':   '/members/ghost-match',
    };
    const url = urlMap[target] || '/members';
    if (_demoMode) {
      // In demo: show the corresponding build's index.html if same origin
      const buildMap = { 'sentinel':'../build-07-sentinel/index.html', 'dealer-pulse':'../build-04-dealer-pulse/index.html', 'arsenal-iq':'../build-12-arsenal-iq/index.html', 'echo-coach':'../build-06-spotter/index.html', 'shield-radius':'../build-08-shield-radius/index.html', 'stockpile':'../build-10-stockpile/index.html', 'ghost-match':'../build-13-ghost-match/index.html' };
      if (buildMap[target]) window.open(buildMap[target], '_blank');
    } else {
      window.location.href = url;
    }
  }

  // ─── NOTIFICATION DISMISS ───────────────────────────────────────────────────
  // Updates local state immediately for responsive UI, then POSTs to the server.
  // In demo mode we mutate the demo array in place — but never in production.
  function dismissNotification(id) {
    _notifications = _notifications.filter(n => String(n.id) !== String(id));
    if (_demoMode) {
      const idx = DEMO.notifications.findIndex(n => String(n.id) === String(id));
      if (idx >= 0) DEMO.notifications.splice(idx, 1);
    } else {
      fetch(`${_api}/api/command/member/${_memberId}/notifications/dismiss`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      }).catch(() => {});
    }
    render();
  }

  function dismissAllNotifications() {
    _notifications = [];
    if (_demoMode) {
      DEMO.notifications.length = 0;
    } else {
      fetch(`${_api}/api/command/member/${_memberId}/notifications/dismiss`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismiss_all: true }),
      }).catch(() => {});
    }
    render();
  }

  // ─── AUTO REFRESH ────────────────────────────────────────────────────────────
  function startAutoRefresh() {
    stopAutoRefresh();
    _refreshTimer = setInterval(() => {
      if (!_demoMode) loadData().then(() => render());
    }, 300_000); // 5 minutes
  }

  function stopAutoRefresh() {
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  }

  // ─── API ────────────────────────────────────────────────────────────────────
  async function loadData() {
    if (_demoMode) {
      _dashboard     = DEMO.dashboard;
      _notifications = DEMO.notifications;
      _lastUpdated   = new Date().toISOString();
      return;
    }
    try {
      const [prefData, dashData, notifData] = await Promise.all([
        fetch(`${_api}/api/command/member/${_memberId}/preferences`).then(r=>r.json()).catch(()=>null),
        fetch(`${_api}/api/command/member/${_memberId}/dashboard`).then(r=>r.json()).catch(()=>null),
        fetch(`${_api}/api/command/member/${_memberId}/notifications`).then(r=>r.json()).catch(()=>null),
      ]);
      if (prefData?.preferences) _isEnabled = prefData.preferences.is_enabled;
      if (dashData && !dashData.error) { _dashboard = dashData; _lastUpdated = dashData.generated_at; }
      if (notifData?.notifications) {
        _notifications = notifData.notifications;
        _unreadCount   = notifData.unread_count || 0;
      }
    } catch { /* use demo */ }
  }

  async function savePreferences(enabled) {
    try {
      await fetch(`${_api}/api/command/member/${_memberId}/preferences`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: enabled }),
      });
    } catch { /* best-effort */ }
  }

  // ─── PUBLIC INIT ─────────────────────────────────────────────────────────────
  async function init(el) {
    _el          = el;
    _api         = (el.dataset.apiUrl || '').replace(/\/$/, '');
    _memberId    = el.dataset.memberId   || 'preview-member';
    _memberName  = el.dataset.memberName || 'FPR Member';
    _demoMode    = !_api;

    // Read opt-in from data attribute for preview mode
    _isEnabled   = el.dataset.enabled === 'true' || _demoMode;

    if (!_demoMode) await loadData();
    else { _dashboard = DEMO.dashboard; _notifications = DEMO.notifications; _lastUpdated = new Date().toISOString(); }

    render();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.fpr-cmd-mount');
  if (el) window.__fprResolveMount(el).then(function(){ FPRCommandCenter.init(el); });
});
