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

/* FPRMembers.com — Build 10: Crisis Stockpile AI — Resilience Planning
   Mount: <div class="fpr-spile-mount" data-api-url="" data-member-id="" data-member-name="">
   Bootstrap: FPRStockpileAI.init(document.querySelector('.fpr-spile-mount'))
*/

const FPRStockpileAI = (() => {
  // ─── STATE ─────────────────────────────────────────────────────────────────
  let _el, _api, _memberId, _memberName;
  let _view       = 'dashboard';
  let _profile    = null;
  let _inventory  = [];
  let _signals    = [];
  let _threats    = [];
  let _score      = null;
  let _recs       = [];
  let _plan       = null;
  let _catalog    = [];
  let _demoMode   = true;
  let _addFormOpen = false;

  // ─── DEMO DATA ──────────────────────────────────────────────────────────────
  const DEMO = {
    profile: {
      household_size: 3, shooters_in_household: 2,
      home_state: 'TX', zip_code: '78701', shooting_frequency: 'monthly', primary_purpose: 'defense',
    },
    inventory: [
      { caliber: '9mm',             brand: 'Federal/Winchester', rounds_on_hand: 450,  monthly_usage_rounds: 200, target_days_supply: 90,  is_primary: true  },
      { caliber: '.223 Remington',  brand: 'Federal',            rounds_on_hand: 300,  monthly_usage_rounds: 60,  target_days_supply: 90,  is_primary: true  },
      { caliber: '.308 Winchester', brand: 'Hornady',            rounds_on_hand: 60,   monthly_usage_rounds: 20,  target_days_supply: 120, is_primary: true  },
      { caliber: '12 Gauge',        brand: 'Federal/Rio',        rounds_on_hand: 150,  monthly_usage_rounds: 25,  target_days_supply: 90,  is_primary: false },
      { caliber: '.22 LR',          brand: 'CCI/Aguila',         rounds_on_hand: 1500, monthly_usage_rounds: 250, target_days_supply: 60,  is_primary: false },
    ],
    // 9mm: 450/(200/30)=67d (74% of 90d) | .223: 300/(60/30)=150d | .308: 60/(20/30)=90d (75% of 120d)
    // 12ga: 150/(25/30)=180d | .22LR: 1500/(250/30)=180d
    signals: [
      { signal_type: 'shipping',     signal_name: 'West Coast Port Congestion',      severity: 'HIGH',    affected_calibers: ['9mm', '.223 Remington', '5.56 NATO'],  description: 'Container throughput at LA/Long Beach down 18%. Small arms components experiencing 3–5 week additional lead times.' },
      { signal_type: 'manufacturer', signal_name: 'Domestic Primer Capacity Reduction', severity: 'HIGH', affected_calibers: ['9mm', '.45 ACP', '.38 Special'],        description: 'Two domestic primer facilities at reduced capacity. Estimated 8–12 week impact on handgun caliber availability.' },
      { signal_type: 'fuel',         signal_name: 'Diesel Fuel Index +22%',          severity: 'WATCH',   affected_calibers: null,                                     description: 'Nationwide diesel surcharges increasing. Affecting distributor restocking cadence across all calibers.' },
      { signal_type: 'demand',       signal_name: 'Southwest Regional Demand +31%',  severity: 'WATCH',   affected_calibers: ['9mm', '.223 Remington', '12 Gauge'],    description: 'Retail demand spike in TX/AZ/NM/NV. Distributor allocation constraints beginning for select calibers.' },
      { signal_type: 'tariff',       signal_name: 'Import Duty Review — Eastern European Ammo', severity: 'MONITOR', affected_calibers: ['7.62x39mm'],              description: 'Trade review initiated on Eastern European ammo imports. No restriction in place — monitoring.' },
    ],
    threats: [
      { threat_name: 'S. 1892 — Ammunition Background Check Act', severity: 'HIGH',    bill_number: 'S. 1892',    description: 'Federal bill requiring NICS checks for purchases over 500 rounds. Passed committee, awaiting floor vote.',               affects_ammo: true, affects_imports: false, affects_magazines: false, affected_states: null },
      { threat_name: 'H.R. 4401 — Import Restrictions on Steel-Core Ammo', severity: 'WATCH', bill_number: 'H.R. 4401', description: 'Proposed ATF reclassification of steel-core pistol ammo as armor-piercing. Affects select 9mm loads.', affects_ammo: true, affects_imports: true, affects_magazines: false, affected_states: null },
      { threat_name: 'TX HB 2210 — Digital Ammo Purchase Records', severity: 'MONITOR', bill_number: 'TX HB 2210', description: 'Texas bill requiring digital records for retail ammo sales over 1,000 rounds.',                                       affects_ammo: true, affects_imports: false, affects_magazines: false, affected_states: ['TX'] },
    ],
    score: {
      overall_score: 62, inventory_coverage_score: 25,
      supply_health_score: 12, legislative_score: 25,
      primary_vulnerabilities: ['active_supply_disruption'], days_of_supply_avg: 113,
    },
    catalog: [
      { caliber: '9mm',            brand: 'Federal',    is_map_covered: true,  display_price_per_round: null,   pricing_note: 'Member pricing available at checkout', unit_size: 50  },
      { caliber: '9mm',            brand: 'Blazer Brass', is_map_covered: false, display_price_per_round: 0.29, unit_size: 50  },
      { caliber: '.223 Remington', brand: 'Federal',    is_map_covered: true,  display_price_per_round: null,   pricing_note: 'Member pricing available at checkout', unit_size: 20  },
      { caliber: '.223 Remington', brand: 'Tulammo',    is_map_covered: false, display_price_per_round: 0.22,  unit_size: 40  },
      { caliber: '.308 Winchester',brand: 'Hornady',    is_map_covered: true,  display_price_per_round: null,   pricing_note: 'Member pricing available at checkout', unit_size: 20  },
      { caliber: '.308 Winchester',brand: 'PMC',        is_map_covered: false, display_price_per_round: 0.89,  unit_size: 20  },
      { caliber: '12 Gauge',       brand: 'Federal',    is_map_covered: true,  display_price_per_round: null,   pricing_note: 'Member pricing available at checkout', unit_size: 25  },
      { caliber: '.22 LR',         brand: 'CCI',        is_map_covered: true,  display_price_per_round: null,   pricing_note: 'Member pricing available at checkout', unit_size: 100 },
      { caliber: '.22 LR',         brand: 'Aguila',     is_map_covered: false, display_price_per_round: 0.065, unit_size: 50  },
    ],
    plan: {
      plan_narrative: `Your current resilience score of 62/100 reflects solid preparation in several calibers with meaningful opportunities to strengthen your 9mm and .308 Winchester coverage before active supply chain signals tighten further. Your .223 Remington, 12 Gauge, and .22 LR positions are all well above target — these calibers are in strong shape and require only normal rotation and practice maintenance.\n\nThe two HIGH-severity signals — West Coast port congestion affecting 9mm and primer manufacturing reductions — are the most relevant factors to your household's profile. With 9mm inventory at approximately 67 days of supply against your 90-day target, a proactive restocking action within the next 30 days is advisable while current availability windows remain open.\n\nYour .308 Winchester position at 90 days versus a 120-day target is worth addressing within the next 60 days. With only one HIGH signal directly affecting this caliber (port congestion for shipped components), there is reasonable time to act — but the combination of legislative monitoring and freight delays makes this a medium priority worth planning now.\n\nOverall, your household is well-positioned relative to many members in your region. Addressing the 9mm and .308 gaps will move your resilience score into the Strong zone and provide meaningful coverage depth through any extended disruption period.`,
      key_actions: [
        'Restock 9mm within 30 days — inventory is at 67 days vs. your 90-day target while HIGH supply signals are active',
        'Plan .308 Winchester restock within 60 days to reach your 120-day target',
        'Check current availability for Federal HST or Winchester USA 9mm through your FPR dealer (member pricing at checkout)',
        'Monitor S. 1892 — Ammunition Background Check Act for committee updates that may accelerate purchase timelines',
        'Rotate and date-mark your .22 LR cache — at 180 days on hand, FIFO rotation keeps ammunition fresh',
      ],
      preparedness_window: 'Current inventory availability remains open for your priority calibers — the next 30 days represent a favorable restocking window before shipping delays and primer capacity reductions fully propagate to retail.',
      outlook: 'Supply chain signals for 9mm are likely to intensify over the next 60–90 days as port congestion and primer shortages compound. .308 and .22 LR supply remains more stable. Plan proactive restocking actions now while distributor inventory is accessible.',
    },
    recommendations: [
      { caliber: '9mm', action_type: 'restock', priority: 'HIGH', recommended_rounds: 450, timeline_days: 30, resilience_impact: 10, reasoning: '9mm at 67 days — below the halfway point of your 90-day target. HIGH supply signals make proactive restocking advisable within the next 30 days.', map_pricing_note: 'Member pricing available at checkout — contact your FPR dealer for current availability.' },
      { caliber: '.308 Winchester', action_type: 'restock', priority: 'MEDIUM', recommended_rounds: 30, timeline_days: 60, resilience_impact: 5, reasoning: '.308 Winchester at 90 days — approaching your 120-day target. Topping off within 60 days keeps your coverage optimal.', map_pricing_note: 'Member pricing available at checkout — contact your FPR dealer for current availability.' },
      { caliber: '.223 Remington',  action_type: 'maintain', priority: 'LOW', recommended_rounds: 0, timeline_days: 90, resilience_impact: 0, reasoning: '.223 Remington meets your 90-day target at 150 days. Continue normal rotation and practice schedule.', map_pricing_note: null },
      { caliber: '12 Gauge',        action_type: 'maintain', priority: 'LOW', recommended_rounds: 0, timeline_days: 90, resilience_impact: 0, reasoning: '12 Gauge meets your 90-day target at 180 days. Continue normal rotation and practice schedule.', map_pricing_note: null },
      { caliber: '.22 LR',          action_type: 'maintain', priority: 'LOW', recommended_rounds: 0, timeline_days: 60, resilience_impact: 0, reasoning: '.22 LR meets your 60-day target at 180 days. Continue normal rotation and practice schedule.', map_pricing_note: null },
    ],
  };

  // ─── UTILS ──────────────────────────────────────────────────────────────────
  function getDaysOfSupply(item) {
    const dailyUsage = (item.monthly_usage_rounds || 50) / 30;
    return Math.round(item.rounds_on_hand / dailyUsage);
  }

  function scoreColor(score) {
    if (score >= 75) return '#16A34A';
    if (score >= 50) return '#D97706';
    if (score >= 25) return '#EA580C';
    return '#DC2626';
  }

  function scoreLabel(score) {
    if (score >= 75) return 'Strong';
    if (score >= 50) return 'Moderate';
    if (score >= 25) return 'Vulnerable';
    return 'Critical';
  }

  function sevClass(severity) {
    return `fpr-spile-sev fpr-spile-sev-${(severity || 'monitor').toLowerCase()}`;
  }

  function barColor(pct) {
    if (pct >= 100) return '#16A34A';
    if (pct >= 50)  return '#D97706';
    if (pct >= 25)  return '#EA580C';
    return '#DC2626';
  }

  function signalIcon(type) {
    const map = { fuel: '⛽', shipping: '🚢', manufacturer: '🏭', demand: '📈', tariff: '📋', legislative: '⚖️' };
    return map[type] || '📡';
  }

  function fmt(n) { return '$' + n.toFixed(2); }

  function buildScoreGauge(score) {
    const ARC = 283;
    const offset = (ARC * (1 - score / 100)).toFixed(1);
    const color  = scoreColor(score);
    const label  = scoreLabel(score);
    return `<svg viewBox="0 0 200 118" class="fpr-spile-gauge" aria-label="Resilience score ${score} out of 100">
      <path d="M 15 105 A 90 90 0 0 1 185 105" fill="none" stroke="#E9ECEF" stroke-width="14" stroke-linecap="round"/>
      <path d="M 15 105 A 90 90 0 0 1 185 105" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"
            stroke-dasharray="${ARC}" stroke-dashoffset="${offset}"
            style="transition:stroke-dashoffset .7s ease,stroke .4s ease"/>
      <text x="100" y="86" text-anchor="middle" font-size="38" font-weight="800" fill="${color}" font-family="Inter,system-ui,sans-serif">${score}</text>
      <text x="100" y="105" text-anchor="middle" font-size="12" font-weight="700" fill="#6B7684" font-family="Inter,system-ui,sans-serif">${label} Resilience</text>
      <text x="15"  y="118" font-size="10" fill="#ADB5BD" font-family="Inter,system-ui,sans-serif">0</text>
      <text x="185" y="118" text-anchor="end" font-size="10" fill="#ADB5BD" font-family="Inter,system-ui,sans-serif">100</text>
    </svg>`;
  }

  function buildBreakdownBar(score, max, label) {
    const pct = Math.round((score / max) * 100);
    const color = barColor(pct);
    return `<div class="fpr-spile-breakdown-row">
      <span class="fpr-spile-breakdown-label">${label}</span>
      <div class="fpr-spile-breakdown-bar">
        <div class="fpr-spile-breakdown-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="fpr-spile-breakdown-pts">${score}/${max}</span>
    </div>`;
  }

  function buildInvBar(item) {
    const days   = getDaysOfSupply(item);
    const target = item.target_days_supply || 90;
    const pct    = Math.min(100, Math.round((days / target) * 100));
    const color  = barColor(pct);
    return `<div class="fpr-spile-inv-row" data-caliber="${item.caliber}">
      <div class="fpr-spile-inv-top">
        <span class="fpr-spile-inv-caliber">${item.caliber}</span>
        ${item.is_primary ? '<span class="fpr-spile-primary-tag">Primary</span>' : ''}
        <div>
          <div class="fpr-spile-inv-days" style="color:${color}">${days}</div>
          <div class="fpr-spile-inv-days-label">days</div>
        </div>
      </div>
      <div class="fpr-spile-bar-track">
        <div class="fpr-spile-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="fpr-spile-inv-meta">
        <span>${item.rounds_on_hand.toLocaleString()} rounds on hand</span>
        <span>${pct}% of ${target}-day target</span>
      </div>
      ${_demoMode ? '' : `<div class="fpr-spile-inv-edit">
        <div><label class="fpr-spile-label">Rounds on Hand</label><input class="fpr-spile-input" type="number" data-field="rounds_on_hand" value="${item.rounds_on_hand}"></div>
        <div><label class="fpr-spile-label">Monthly Usage</label><input class="fpr-spile-input" type="number" data-field="monthly_usage_rounds" value="${item.monthly_usage_rounds}"></div>
        <div><label class="fpr-spile-label">Target Days</label><input class="fpr-spile-input" type="number" data-field="target_days_supply" value="${item.target_days_supply || 90}"></div>
        <div class="fpr-spile-inv-edit-actions">
          <button class="fpr-spile-btn fpr-spile-btn-primary fpr-spile-btn-sm" data-action="save-inv" data-caliber="${item.caliber}">Save</button>
          <button class="fpr-spile-btn fpr-spile-btn-danger fpr-spile-btn-sm" data-action="delete-inv" data-caliber="${item.caliber}">Remove</button>
        </div>
      </div>`}
    </div>`;
  }

  function buildSmallSignalCard(signal) {
    const icon = signalIcon(signal.signal_type);
    const calibers = signal.affected_calibers && signal.affected_calibers.length
      ? signal.affected_calibers.map(c => `<span class="fpr-spile-cal-tag">${c}</span>`).join('')
      : '<span class="fpr-spile-cal-tag">All calibers</span>';
    return `<div class="fpr-spile-signal-card">
      <div class="fpr-spile-signal-header">
        <span class="fpr-spile-signal-icon">${icon}</span>
        <span class="fpr-spile-signal-name">${signal.signal_name}</span>
        <span class="${sevClass(signal.severity)}">${signal.severity}</span>
      </div>
      <p class="fpr-spile-signal-desc">${signal.description}</p>
      <div class="fpr-spile-caliber-tags">${calibers}</div>
    </div>`;
  }

  function buildFullSignalCard(signal) {
    const icon = signalIcon(signal.signal_type);
    const calibers = signal.affected_calibers && signal.affected_calibers.length
      ? signal.affected_calibers.map(c => `<span class="fpr-spile-cal-tag">${c}</span>`).join('')
      : '<span class="fpr-spile-cal-tag">All calibers</span>';
    const sevLower = (signal.severity || 'monitor').toLowerCase();
    return `<div class="fpr-spile-full-signal-card severity-${sevLower}">
      <span class="fpr-spile-full-signal-icon">${icon}</span>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span class="fpr-spile-full-signal-name">${signal.signal_name}</span>
        <span class="${sevClass(signal.severity)}">${signal.severity}</span>
      </div>
      <p class="fpr-spile-full-signal-desc">${signal.description}</p>
      <div class="fpr-spile-caliber-tags" style="margin-bottom:8px">${calibers}</div>
      <div class="fpr-spile-full-signal-meta">Type: ${signal.signal_type.replace(/_/g,' ')}</div>
    </div>`;
  }

  function buildThreatCard(threat) {
    const sevLower = (threat.severity || 'monitor').toLowerCase();
    const states = threat.affected_states && threat.affected_states.length
      ? threat.affected_states.join(', ')
      : 'Federal / Nationwide';
    const tags = [
      threat.affects_ammo      ? 'Affects Ammo' : null,
      threat.affects_imports   ? 'Affects Imports' : null,
      threat.affects_magazines ? 'Affects Magazines' : null,
    ].filter(Boolean).map(t => `<span class="fpr-spile-threat-tag">${t}</span>`).join('');
    return `<div class="fpr-spile-threat-card severity-${sevLower}">
      <div class="fpr-spile-threat-sev-bar"></div>
      <div class="fpr-spile-threat-body">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
          <span class="fpr-spile-threat-name">${threat.threat_name}</span>
          <span class="${sevClass(threat.severity)}" style="margin-left:auto">${threat.severity}</span>
        </div>
        <div class="fpr-spile-threat-bill">${threat.bill_number || ''} · ${states}</div>
        <div class="fpr-spile-threat-desc">${threat.description}</div>
        ${tags ? `<div class="fpr-spile-threat-tags">${tags}</div>` : ''}
      </div>
    </div>`;
  }

  function buildRecCard(rec) {
    const priorityLabel = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
    const sevLower = (rec.priority || 'low').toLowerCase();
    if (rec.action_type === 'maintain') {
      return `<div class="fpr-spile-rec-card priority-low">
        <div class="fpr-spile-rec-header">
          <span class="fpr-spile-rec-caliber">${rec.caliber}</span>
          <span class="${sevClass('MONITOR')}" style="font-size:10px">MAINTAIN</span>
        </div>
        <p class="fpr-spile-rec-reasoning">${rec.reasoning}</p>
      </div>`;
    }

    const priceHtml = rec.map_pricing_note
      ? `<div class="fpr-spile-map-note">${rec.map_pricing_note}</div>`
      : '';

    return `<div class="fpr-spile-rec-card priority-${sevLower}">
      <div class="fpr-spile-rec-header">
        <span class="fpr-spile-rec-caliber">${rec.caliber}</span>
        <span class="${sevClass(rec.priority)}">${priorityLabel[rec.priority] || rec.priority}</span>
        ${rec.recommended_rounds ? `<span class="fpr-spile-rec-rounds" style="margin-left:auto">+${rec.recommended_rounds.toLocaleString()} rounds</span>` : ''}
      </div>
      <p class="fpr-spile-rec-reasoning">${rec.reasoning}</p>
      <div class="fpr-spile-rec-timeline">🕐 Within ${rec.timeline_days} days</div>
      ${priceHtml}
      ${rec.resilience_impact ? `<div class="fpr-spile-resilience-impact">+${rec.resilience_impact} resilience points if completed</div>` : ''}
    </div>`;
  }

  // ─── VIEWS ───────────────────────────────────────────────────────────────────
  function renderDashboard() {
    const score = _score || DEMO.score;
    const inv   = _inventory.length ? _inventory : DEMO.inventory;
    const sigs  = _signals.length   ? _signals   : DEMO.signals;
    const color  = scoreColor(score.overall_score);

    const topSignals = sigs.slice(0, 4);

    return `
      <div class="fpr-spile-disclaimer">
        <strong>Disclaimer:</strong> For informational purposes only. FPRMembers.com does not guarantee supply availability or pricing.
        Always make purchasing decisions based on your own research and financial situation.
      </div>

      <div class="fpr-spile-stats-row">
        <div class="fpr-spile-stat-card">
          <div class="fpr-spile-stat-num" style="color:${color}">${score.overall_score}</div>
          <div class="fpr-spile-stat-label">Resilience Score</div>
          <div class="fpr-spile-stat-sub">${scoreLabel(score.overall_score)}</div>
        </div>
        <div class="fpr-spile-stat-card">
          <div class="fpr-spile-stat-num">${score.days_of_supply_avg}d</div>
          <div class="fpr-spile-stat-label">Avg Days of Supply</div>
          <div class="fpr-spile-stat-sub">across ${inv.length} calibers</div>
        </div>
        <div class="fpr-spile-stat-card">
          <div class="fpr-spile-stat-num" style="color:${sigs.filter(s=>s.severity==='HIGH'||s.severity==='CRITICAL').length>0?'#EA580C':'#16A34A'}">${sigs.filter(s=>s.severity==='HIGH'||s.severity==='CRITICAL').length}</div>
          <div class="fpr-spile-stat-label">Active HIGH+ Signals</div>
          <div class="fpr-spile-stat-sub">${sigs.length} total monitored</div>
        </div>
      </div>

      <div class="fpr-spile-dashboard-grid">
        <div class="fpr-spile-score-panel">
          <h3>Resilience Score</h3>
          ${buildScoreGauge(score.overall_score)}
          <div class="fpr-spile-score-breakdown">
            ${buildBreakdownBar(score.inventory_coverage_score, 40, 'Inventory Coverage')}
            ${buildBreakdownBar(score.supply_health_score,      30, 'Supply Chain Health')}
            ${buildBreakdownBar(score.legislative_score,        30, 'Legislative Environment')}
          </div>
          ${score.primary_vulnerabilities && score.primary_vulnerabilities.length ? `
            <div class="fpr-spile-vulns">
              ${score.primary_vulnerabilities.map(v => `<span class="fpr-spile-vuln-tag">${v.replace(/_/g,' ')}</span>`).join('')}
            </div>` : `<div class="fpr-spile-vulns"><span class="fpr-spile-vuln-tag none">No critical vulnerabilities</span></div>`}
        </div>

        <div class="fpr-spile-signal-panel">
          <h3>Active Supply Chain Signals</h3>
          <div class="fpr-spile-signal-list">
            ${topSignals.map(buildSmallSignalCard).join('')}
            ${sigs.length > 4 ? `<button class="fpr-spile-btn-outline" style="width:100%" data-action="nav" data-view="signals">View all ${sigs.length} signals →</button>` : ''}
          </div>
        </div>
      </div>

      <div class="fpr-spile-inventory-panel">
        <div class="fpr-spile-inv-header-row">
          <h3>Inventory Quick View</h3>
          <button class="fpr-spile-btn-outline" data-action="nav" data-view="inventory">Manage Inventory</button>
        </div>
        <div class="fpr-spile-inv-list">
          ${inv.slice(0,4).map(buildInvBar).join('')}
          ${inv.length > 4 ? `<button class="fpr-spile-btn-outline" style="width:100%;margin-top:4px" data-action="nav" data-view="inventory">See all ${inv.length} calibers</button>` : ''}
        </div>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="fpr-spile-btn fpr-spile-btn-primary" data-action="nav" data-view="plan" style="flex:1;min-width:200px">
          📋 View Resilience Plan
        </button>
        <button class="fpr-spile-btn fpr-spile-btn-secondary" data-action="nav" data-view="recommendations" style="flex:1;min-width:200px">
          📦 Restocking Recommendations
        </button>
      </div>

      ${_demoMode ? '<div style="text-align:center;margin-top:16px;font-size:11.5px;color:#9AA3AF">Preview mode — connect API for live data</div>' : ''}
    `;
  }

  function renderInventory() {
    const inv = _inventory.length ? _inventory : DEMO.inventory;
    return `
      <div class="fpr-spile-inventory-panel" style="margin-bottom:0">
        <div class="fpr-spile-inv-header-row">
          <h3>Caliber Inventory</h3>
          <button class="fpr-spile-btn fpr-spile-btn-primary fpr-spile-btn-sm" data-action="toggle-add-form">+ Add Caliber</button>
        </div>
        <div class="fpr-spile-add-form${_addFormOpen?' visible':''}" id="spile-add-form">
          <div>
            <label class="fpr-spile-label">Caliber *</label>
            <input class="fpr-spile-input" id="add-caliber" placeholder="e.g. 9mm">
          </div>
          <div>
            <label class="fpr-spile-label">Brand</label>
            <input class="fpr-spile-input" id="add-brand" placeholder="e.g. Federal">
          </div>
          <div>
            <label class="fpr-spile-label">Rounds on Hand *</label>
            <input class="fpr-spile-input" type="number" id="add-rounds" value="0">
          </div>
          <div>
            <label class="fpr-spile-label">Monthly Usage (rounds)</label>
            <input class="fpr-spile-input" type="number" id="add-usage" value="50">
          </div>
          <div>
            <label class="fpr-spile-label">Target Days of Supply</label>
            <input class="fpr-spile-input" type="number" id="add-target" value="90">
          </div>
          <div>
            <label class="fpr-spile-label">Primary Caliber?</label>
            <select class="fpr-spile-select" id="add-primary"><option value="false">No</option><option value="true">Yes</option></select>
          </div>
          <div class="fpr-spile-add-form-actions">
            <button class="fpr-spile-btn fpr-spile-btn-primary fpr-spile-btn-sm" data-action="add-inv">Save Caliber</button>
            <button class="fpr-spile-btn fpr-spile-btn-secondary fpr-spile-btn-sm" data-action="toggle-add-form">Cancel</button>
          </div>
        </div>
        <div class="fpr-spile-inv-list" style="margin-top:12px">
          ${inv.map(buildInvBar).join('')}
        </div>
        ${inv.length === 0 ? `<div class="fpr-spile-empty"><span class="fpr-spile-empty-icon">📦</span><div class="fpr-spile-empty-title">No calibers tracked yet</div><div class="fpr-spile-empty-sub">Add your first caliber to start tracking inventory coverage.</div></div>` : ''}
      </div>

      <div class="fpr-spile-disclaimer" style="margin-top:14px">
        For informational purposes only. FPRMembers.com does not guarantee supply availability or pricing.
        Always make purchasing decisions based on your own research and financial situation.
      </div>
    `;
  }

  function renderRecommendations() {
    const recs = _recs.length ? _recs : DEMO.recommendations;
    const restocking = recs.filter(r => r.action_type === 'restock');
    const maintain   = recs.filter(r => r.action_type === 'maintain');

    return `
      <p style="font-size:13px;color:#6B7684;margin:0 0 16px">
        Recommendations are based on your current inventory levels, monthly usage rates, target coverage goals, and active supply chain signals.
        All pricing guidance follows MAP compliance rules — member pricing for MAP-covered brands is available at checkout.
      </p>

      ${restocking.length ? `
        <p class="fpr-spile-section-header">Action Required</p>
        <div class="fpr-spile-recs-grid" style="margin-bottom:20px">
          ${restocking.map(buildRecCard).join('')}
        </div>` : ''}

      ${maintain.length ? `
        <p class="fpr-spile-section-header">Maintain — On Target</p>
        <div class="fpr-spile-recs-grid">
          ${maintain.map(buildRecCard).join('')}
        </div>` : ''}

      <div class="fpr-spile-disclaimer" style="margin-top:16px">
        For informational purposes only. FPRMembers.com does not guarantee supply availability or pricing.
        Always make purchasing decisions based on your own research and financial situation.
      </div>
    `;
  }

  function renderSignals() {
    const sigs    = _signals.length ? _signals   : DEMO.signals;
    const threats = _threats.length ? _threats   : DEMO.threats;

    return `
      <p class="fpr-spile-section-header">Supply Chain Signals</p>
      <div class="fpr-spile-signals-grid" style="margin-bottom:24px">
        ${sigs.map(buildFullSignalCard).join('')}
      </div>

      <p class="fpr-spile-section-header">Legislative Threat Monitor</p>
      <div class="fpr-spile-threat-list" style="margin-bottom:16px">
        ${threats.map(buildThreatCard).join('')}
      </div>

      <div class="fpr-spile-disclaimer">
        For informational purposes only. Monitoring legislative activity does not constitute legal advice.
        Always verify current law before making purchasing decisions.
      </div>
    `;
  }

  function renderPlan() {
    const plan = _plan;
    if (!plan) {
      return `
        <div class="fpr-spile-plan-generate">
          <div class="fpr-spile-plan-generate-icon">📋</div>
          <div class="fpr-spile-plan-generate-title">Generate Your Resilience Plan</div>
          <div class="fpr-spile-plan-generate-sub">
            AI analyzes your inventory, supply chain signals, and legislative environment to build a personalized preparedness plan.
            ${_demoMode ? '<br>Connect your API to generate a live plan via Claude.' : ''}
          </div>
          ${_demoMode
            ? `<button class="fpr-spile-btn fpr-spile-btn-primary" data-action="show-demo-plan">View Sample Resilience Plan</button>`
            : `<button class="fpr-spile-btn fpr-spile-btn-primary" data-action="generate-plan">Generate Resilience Plan</button>`}
        </div>
      `;
    }

    const score = _score || DEMO.score;
    const color  = scoreColor(score.overall_score);
    const now    = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const narrativeParagraphs = plan.narrative
      ? plan.narrative.split('\n').filter(p=>p.trim()).map(p=>`<p>${p}</p>`).join('')
      : '<p>' + (plan.plan_narrative||'').split('\n').filter(p=>p.trim()).join('</p><p>') + '</p>';

    const actions = Array.isArray(plan.key_actions) ? plan.key_actions : [];

    return `
      <div class="fpr-spile-plan-panel">
        <div class="fpr-spile-plan-header">
          <div>
            <div class="fpr-spile-plan-title">Your Resilience Plan</div>
            <div class="fpr-spile-plan-date">Generated ${now}</div>
          </div>
          <div class="fpr-spile-plan-score-badge" style="color:${color}">
            ${score.overall_score}
            <span class="fpr-spile-plan-score-sub">/100</span>
          </div>
        </div>

        <div class="fpr-spile-plan-narrative">${narrativeParagraphs}</div>

        ${actions.length ? `
          <div class="fpr-spile-plan-section">
            <p class="fpr-spile-plan-section-title">Key Actions</p>
            <ul class="fpr-spile-key-actions">
              ${actions.map(a => `<li class="fpr-spile-key-action">${a}</li>`).join('')}
            </ul>
          </div>` : ''}

        ${(plan.preparedness_window || plan.preparedness_window) ? `
          <div class="fpr-spile-plan-section">
            <p class="fpr-spile-plan-section-title">Preparedness Window</p>
            <div class="fpr-spile-outlook-box">${plan.preparedness_window}</div>
          </div>` : ''}

        ${plan.outlook ? `
          <div class="fpr-spile-plan-section">
            <p class="fpr-spile-plan-section-title">30-Day Supply Outlook</p>
            <p style="font-size:13px;color:#495057;line-height:1.6">${plan.outlook}</p>
          </div>` : ''}
      </div>

      ${!_demoMode ? `<button class="fpr-spile-btn fpr-spile-btn-secondary" data-action="generate-plan" style="margin-bottom:16px">🔄 Regenerate Plan</button>` : ''}

      <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button onclick="FPRShare.open('Share Your Plan')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share Your Plan
        </button>
      </div>

      <div class="fpr-spile-disclaimer">
        For informational purposes only. FPRMembers.com does not guarantee supply availability or pricing.
        Always make purchasing decisions based on your own research and financial situation.
      </div>
    `;
  }

  function renderProfile() {
    const p = _profile || DEMO.profile;
    return `
      <div class="fpr-spile-profile-panel">
        <h3 style="margin:0 0 16px;font-size:16px;font-weight:800">Household Profile</h3>
        <div class="fpr-spile-profile-grid">
          <div>
            <label class="fpr-spile-label">Home State</label>
            <input class="fpr-spile-input" id="p-state" value="${p.home_state||'TX'}" maxlength="2" placeholder="TX">
          </div>
          <div>
            <label class="fpr-spile-label">ZIP Code</label>
            <input class="fpr-spile-input" id="p-zip" value="${p.zip_code||''}" placeholder="78701">
          </div>
          <div>
            <label class="fpr-spile-label">Household Size</label>
            <input class="fpr-spile-input" type="number" id="p-household" value="${p.household_size||1}" min="1">
          </div>
          <div>
            <label class="fpr-spile-label">Shooters in Household</label>
            <input class="fpr-spile-input" type="number" id="p-shooters" value="${p.shooters_in_household||1}" min="1">
          </div>
          <div>
            <label class="fpr-spile-label">Shooting Frequency</label>
            <select class="fpr-spile-select" id="p-freq">
              <option value="daily" ${p.shooting_frequency==='daily'?'selected':''}>Daily</option>
              <option value="weekly" ${p.shooting_frequency==='weekly'?'selected':''}>Weekly</option>
              <option value="monthly" ${p.shooting_frequency==='monthly'?'selected':''}>Monthly</option>
              <option value="quarterly" ${p.shooting_frequency==='quarterly'?'selected':''}>Quarterly</option>
            </select>
          </div>
          <div>
            <label class="fpr-spile-label">Primary Purpose</label>
            <select class="fpr-spile-select" id="p-purpose">
              <option value="sport"   ${p.primary_purpose==='sport'?'selected':''}>Sport / Range</option>
              <option value="defense" ${p.primary_purpose==='defense'?'selected':''}>Home Defense</option>
              <option value="hunting" ${p.primary_purpose==='hunting'?'selected':''}>Hunting</option>
              <option value="all"     ${p.primary_purpose==='all'?'selected':''}>All of the Above</option>
            </select>
          </div>
          <div class="full">
            <button class="fpr-spile-btn fpr-spile-btn-primary" data-action="save-profile">Save Profile</button>
          </div>
        </div>
      </div>

      <div class="fpr-spile-push-panel" style="margin-top:16px">
        <div class="fpr-spile-push-icon">🔔</div>
        <div class="fpr-spile-push-text">
          <strong>Supply Alert Notifications</strong>
          <span>Get push notifications when new HIGH or CRITICAL supply signals are detected for your calibers.</span>
        </div>
        <button class="fpr-spile-btn fpr-spile-btn-primary fpr-spile-btn-sm" data-action="enable-push" id="push-btn">Enable Alerts</button>
      </div>
    `;
  }

  // ─── MAIN RENDER ─────────────────────────────────────────────────────────────
  function render() {
    const nav = [
      { id: 'dashboard',       label: 'Dashboard' },
      { id: 'inventory',       label: 'Inventory' },
      { id: 'recommendations', label: 'Restock Plan' },
      { id: 'signals',         label: 'Supply Signals' },
      { id: 'plan',            label: 'AI Plan' },
      { id: 'profile',         label: 'Profile' },
    ];

    const score = _score || DEMO.score;
    const color  = scoreColor(score.overall_score);

    const viewContent = {
      dashboard:       renderDashboard,
      inventory:       renderInventory,
      recommendations: renderRecommendations,
      signals:         renderSignals,
      plan:            renderPlan,
      profile:         renderProfile,
    }[_view] || renderDashboard;

    _el.innerHTML = `<div class="fpr-spile">
      <div class="fpr-spile-topbar">
        <div class="fpr-spile-brand">FPRMembers</div>
        <nav class="fpr-spile-nav" role="navigation" aria-label="Stockpile AI navigation">
          ${nav.map(n => `<button class="fpr-spile-nav-btn${_view===n.id?' active':''}" data-action="nav" data-view="${n.id}">${n.label}</button>`).join('')}
        </nav>
        <span class="fpr-spile-score-badge" style="color:${color};border-color:${color}40">${score.overall_score}/100</span>
      </div>
      <div class="fpr-spile-body" id="spile-body">
        ${viewContent()}
      </div>
    </div>`;
  }

  // ─── EVENT HANDLERS ───────────────────────────────────────────────────────────
  // Attached exactly once in init() — delegation survives innerHTML rewrites.
  function attachHandlers() {
    _el.addEventListener('click', handleClick);
    _el.addEventListener('click', handleRowExpand);
  }

  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'nav') {
      _view = btn.dataset.view;
      render();
      return;
    }
    if (action === 'toggle-add-form') { _addFormOpen = !_addFormOpen; render(); return; }
    if (action === 'show-demo-plan')  { _plan = DEMO.plan;            render(); return; }
    if (action === 'generate-plan')   { handleGeneratePlan();          return; }
    if (action === 'save-profile')    { handleSaveProfile();           return; }
    if (action === 'add-inv')         { handleAddInventory();          return; }
    if (action === 'save-inv')        { handleSaveInventory(btn.dataset.caliber); return; }
    if (action === 'delete-inv')      { handleDeleteInventory(btn.dataset.caliber); return; }
    if (action === 'enable-push')     { handlePush();                  return; }
  }

  // Toggle inv row expansion for editing (event delegation on _el).
  function handleRowExpand(e) {
    const row = e.target.closest('.fpr-spile-inv-row');
    if (!row || e.target.closest('[data-action]')) return;
    row.classList.toggle('expanded');
  }

  async function apiRequest(path, opts = {}) {
    const res = await fetch(`${_api}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  async function handleSaveProfile() {
    if (_demoMode) { alert('Connect API to save your profile.'); return; }
    try {
      const body = {
        member_id: _memberId,
        home_state:            document.getElementById('p-state').value.toUpperCase(),
        zip_code:              document.getElementById('p-zip').value,
        household_size:        parseInt(document.getElementById('p-household').value),
        shooters_in_household: parseInt(document.getElementById('p-shooters').value),
        shooting_frequency:    document.getElementById('p-freq').value,
        primary_purpose:       document.getElementById('p-purpose').value,
      };
      const data = await apiRequest('/api/stockpile/profile', { method: 'POST', body });
      _profile = data.profile;
      alert('Profile saved.');
    } catch (err) { alert('Error: ' + err.message); }
  }

  async function handleAddInventory() {
    if (_demoMode) { alert('Connect API to manage your inventory.'); return; }
    try {
      const body = {
        caliber:              document.getElementById('add-caliber').value.trim(),
        brand:                document.getElementById('add-brand').value.trim(),
        rounds_on_hand:       parseInt(document.getElementById('add-rounds').value),
        monthly_usage_rounds: parseInt(document.getElementById('add-usage').value),
        target_days_supply:   parseInt(document.getElementById('add-target').value),
        is_primary:           document.getElementById('add-primary').value === 'true',
      };
      if (!body.caliber) { alert('Caliber is required.'); return; }
      const data = await apiRequest(`/api/stockpile/member/${_memberId}/inventory`, { method: 'POST', body });
      _inventory.push(data.item);
      _addFormOpen = false;
      render();
    } catch (err) { alert('Error: ' + err.message); }
  }

  async function handleSaveInventory(caliber) {
    if (_demoMode) return;
    const row = _el.querySelector(`[data-caliber="${caliber}"]`);
    if (!row) return;
    const body = {
      rounds_on_hand:       parseInt(row.querySelector('[data-field="rounds_on_hand"]').value),
      monthly_usage_rounds: parseInt(row.querySelector('[data-field="monthly_usage_rounds"]').value),
      target_days_supply:   parseInt(row.querySelector('[data-field="target_days_supply"]').value),
    };
    try {
      const data = await apiRequest(`/api/stockpile/member/${_memberId}/inventory/${encodeURIComponent(caliber)}`, { method: 'PUT', body });
      const idx = _inventory.findIndex(i => i.caliber === caliber);
      if (idx !== -1) _inventory[idx] = data.item;
      render();
    } catch (err) { alert('Error: ' + err.message); }
  }

  async function handleDeleteInventory(caliber) {
    if (_demoMode) return;
    if (!confirm(`Remove ${caliber} from your inventory?`)) return;
    try {
      await apiRequest(`/api/stockpile/member/${_memberId}/inventory/${encodeURIComponent(caliber)}`, { method: 'DELETE' });
      _inventory = _inventory.filter(i => i.caliber !== caliber);
      render();
    } catch (err) { alert('Error: ' + err.message); }
  }

  async function handleGeneratePlan() {
    if (_demoMode) { _plan = DEMO.plan; window.fprAwardTicket('stockpile_plan_generated', {}); render(); return; }
    const body = _el.querySelector('#spile-body');
    if (body) body.innerHTML = `<div class="fpr-spile-loading"><div class="fpr-spile-spinner"></div><div class="fpr-spile-loading-text">Generating your personalized Resilience Plan…</div></div>`;
    try {
      const data = await apiRequest(`/api/stockpile/member/${_memberId}/generate-plan`, { method: 'POST', body: {} });
      _plan = data.plan;
      _score = data.scoreData;
      _recs  = data.recommendations;
      window.fprAwardTicket('stockpile_plan_generated', {});
      render();
    } catch (err) {
      if (body) body.innerHTML = `<div class="fpr-spile-empty"><span class="fpr-spile-empty-icon">⚠️</span><div class="fpr-spile-empty-title">Plan generation failed</div><div class="fpr-spile-empty-sub">${err.message}</div></div>`;
    }
  }

  async function handlePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }
    try {
      if (_demoMode) { alert('Connect API to enable push notifications.'); return; }
      const reg = await navigator.serviceWorker.register('/stockpile-sw.js');
      const keyData = await apiRequest('/api/stockpile/vapid-public-key');
      const appKey = keyData.publicKey;
      const rawKey = Uint8Array.from(atob(appKey.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: rawKey });
      await apiRequest(`/api/stockpile/member/${_memberId}/push-subscribe`, { method: 'POST', body: sub.toJSON() });
      const btn = document.getElementById('push-btn');
      if (btn) { btn.textContent = '✓ Alerts Enabled'; btn.disabled = true; }
    } catch (err) { alert('Push setup error: ' + err.message); }
  }

  async function loadData() {
    if (_demoMode) return;
    try {
      const [profData, invData, sigData, thrData, scoreData, recData] = await Promise.all([
        apiRequest(`/api/stockpile/member/${_memberId}/profile`).catch(() => null),
        apiRequest(`/api/stockpile/member/${_memberId}/inventory`).catch(() => ({ inventory: [] })),
        apiRequest('/api/stockpile/supply-signals').catch(() => ({ signals: [] })),
        apiRequest('/api/stockpile/legislative-threats').catch(() => ({ threats: [] })),
        apiRequest(`/api/stockpile/member/${_memberId}/resilience`).catch(() => null),
        apiRequest(`/api/stockpile/member/${_memberId}/recommendations`).catch(() => ({ recommendations: [] })),
      ]);
      _profile   = profData?.profile   || null;
      _inventory = invData?.inventory  || [];
      _signals   = sigData?.signals    || [];
      _threats   = thrData?.threats    || [];
      _score     = scoreData?.score    || null;
      _recs      = recData?.recommendations || [];
    } catch { /* use demo data */ }
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────────
  async function init(el) {
    _el         = el;
    _api        = (el.dataset.apiUrl || '').replace(/\/$/, '');
    _memberId   = el.dataset.memberId   || 'preview-member';
    _memberName = el.dataset.memberName || 'Demo Member';
    _demoMode   = !_api;

    if (!_demoMode) await loadData();
    attachHandlers();
    render();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.fpr-spile-mount');
  if (el) window.__fprResolveMount(el).then(function(){ FPRStockpileAI.init(el); });
});
