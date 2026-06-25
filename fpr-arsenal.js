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

/* FPRMembers.com — Build 12: Arsenal IQ — Armory Builder & Life-Stage Optimizer
   Mount: <div class="fpr-iq-mount" data-api-url="" data-member-id="" data-member-name="">
   Bootstrap: FPRArsenalIQ.init(document.querySelector('.fpr-iq-mount'))

   MAP COMPLIANCE: Arsenal IQ Score and gap analysis NEVER display specific prices.
   Pricing only appears when member clicks through to ShopFPR.
*/

const FPRArsenalIQ = (() => {
  // ─── STATE ──────────────────────────────────────────────────────────────────
  let _el, _api, _memberId, _memberName;
  let _view     = 'welcome';   // welcome / quick / intake / dashboard / scorecard
  let _step     = 1;           // 1-6 intake steps
  let _profile  = {};
  let _inventory  = [];        // array of role objects
  let _iq         = null;
  let _analysis   = null;
  let _history    = [];
  let _shareCard  = null;
  let _demoMode   = true;
  let _shopfprBase = 'https://shopfpr.com';

  // ─── ARMORY ROLES (client-side mirror of armory-database.js) ────────────────
  const ROLES = [
    { id: 'primary_home_defense',  name: 'Primary Home Defense',      tier: 'CRITICAL', icon: '<i class="ti ti-home" style=" color:#1b2f4e;"></i>', shopfpr: 'home-defense'       },
    { id: 'ccw_primary',           name: 'Primary CCW Firearm',        tier: 'CRITICAL', icon: '<i class="ti ti-pistol" style=" color:#1b2f4e;"></i>', shopfpr: 'ccw-pistols'        },
    { id: 'training_platform',     name: 'Training Platform (.22 LR)', tier: 'HIGH',     icon: '<i class="ti ti-crosshair" style=" color:#1b2f4e;"></i>', shopfpr: 'rimfire-training'    },
    { id: 'versatile_rifle',       name: 'Centerfire Rifle',           tier: 'HIGH',     icon: '<i class="ti ti-gun" style=" color:#1b2f4e;"></i>', shopfpr: 'modern-sporting-rifles' },
    { id: 'defensive_shotgun',     name: 'Defensive Shotgun',          tier: 'HIGH',     icon: '<i class="ti ti-flame" style=" color:#1b2f4e;"></i>', shopfpr: 'defensive-shotguns'  },
    { id: 'hunting_rifle',         name: 'Hunting Rifle',              tier: 'MEDIUM',   icon: '<i class="ti ti-pistol" style=" color:#1b2f4e;"></i>', shopfpr: 'hunting-rifles'      },
    { id: 'competition_pistol',    name: 'Competition Pistol',         tier: 'MEDIUM',   icon: '<i class="ti ti-prize" style=" color:#1b2f4e;"></i>', shopfpr: 'competition-pistols' },
    { id: 'youth_trainer',         name: 'Youth / Family Trainer',     tier: 'MEDIUM',   icon: '<i class="ti ti-firearm" style=" color:#1b2f4e;"></i>', shopfpr: 'youth-firearms'     },
    { id: 'home_defense_staged',   name: 'Staged Secondary HD',        tier: 'MEDIUM',   icon: '<i class="ti ti-lock" style=" color:#1b2f4e;"></i>', shopfpr: 'home-defense'        },
    { id: 'backup_ccw',            name: 'Backup CCW Pocket Pistol',   tier: 'LOW',      icon: '<i class="ti ti-shop" style=" color:#1b2f4e;"></i>', shopfpr: 'pocket-pistols'      },
    { id: 'rural_long_range',      name: 'Long-Range Ranch Rifle',     tier: 'MEDIUM',   icon: '<i class="ti ti-shoot" style=" color:#1b2f4e;"></i>', shopfpr: 'precision-rifles'   },
  ];

  const TIER_COLORS = {
    elite:         '#B45309', complete:  '#2563EB',
    well_armed:    '#059669', established:'#D97706',
    building:      '#DC2626', just_starting:'#6B7280',
  };
  const TIER_LABELS = {
    elite: 'Elite Armory', complete: 'Armory Complete',
    well_armed: 'Well-Armed', established: 'Established',
    building: 'Building', just_starting: 'Just Starting',
  };

  // ─── DEMO DATA ──────────────────────────────────────────────────────────────
  const DEMO = {
    profile: {
      life_stage: 'family_young', family_size: 4, home_layout: 'large_house',
      home_state: 'TX', physical_capabilities: 'none', primary_concerns: ['home_defense','ccw_carry','recreation'],
      has_safe_storage: false, training_commitment: 'moderate', experience_level: 'intermediate',
      other_household_users: true,
    },
    inventory: [
      { role_id: 'primary_home_defense', firearm_type: 'semi-auto-pistol', caliber_category: 'handgun-9mm', is_primary: true },
      { role_id: 'ccw_primary',          firearm_type: 'semi-auto-pistol', caliber_category: 'handgun-9mm', is_primary: false },
    ],
    iq: {
      total_score: 52, score_tier: 'established', tier_label: 'Established',
      foundation_score: 22, coverage_score: 18, readiness_score: 7, life_stage_score: 5,
      roles_covered: 2, roles_total: 9,
      gap_count_critical: 0, gap_count_high: 3, gap_count_medium: 2,
      gaps: [
        { role_id: 'training_platform',  role_name: 'Training Platform (.22 LR)', priority: 'HIGH',   shopfpr_category: 'rimfire-training',    why_matters: 'A .22 LR platform cuts practice cost by 85%, enabling the repetition needed to build and maintain defensive skills — critical for a family of 4 where multiple users may need proficiency.', points_missing: 10 },
        { role_id: 'youth_trainer',      role_name: 'Youth / Family Trainer',     priority: 'HIGH',   shopfpr_category: 'youth-firearms',      why_matters: 'With children in the home, a purpose-sized trainer introduces safe handling early and builds family proficiency together.', points_missing: 6 },
        { role_id: 'home_defense_staged',role_name: 'Staged Secondary HD',        priority: 'HIGH',   shopfpr_category: 'home-defense',        why_matters: 'In a large house, you may not be near your primary HD firearm when a threat occurs. A second staged firearm in a biometric safe addresses this gap.', points_missing: 5 },
        { role_id: 'versatile_rifle',    role_name: 'Centerfire Rifle',           priority: 'MEDIUM', shopfpr_category: 'modern-sporting-rifles', why_matters: 'A modern sporting rifle extends your defensive capability significantly beyond what handguns provide for a large-home scenario.', points_missing: 10 },
        { role_id: 'defensive_shotgun',  role_name: 'Defensive Shotgun',          priority: 'MEDIUM', shopfpr_category: 'defensive-shotguns',  why_matters: 'Shotguns are often the most intuitive platform for household members with minimal training — valuable when multiple family members may need access.', points_missing: 8 },
      ],
      priorities: [
        { rank: 1, role_id: 'training_platform',   role_name: 'Training Platform (.22 LR)', priority: 'HIGH',   shopfpr_category: 'rimfire-training',    score_impact: 10 },
        { rank: 2, role_id: 'home_defense_staged',  role_name: 'Staged Secondary HD',        priority: 'HIGH',   shopfpr_category: 'home-defense',        score_impact: 5  },
        { rank: 3, role_id: 'youth_trainer',        role_name: 'Youth / Family Trainer',     priority: 'HIGH',   shopfpr_category: 'youth-firearms',       score_impact: 6  },
        { rank: 4, role_id: 'versatile_rifle',      role_name: 'Centerfire Rifle',           priority: 'MEDIUM', shopfpr_category: 'modern-sporting-rifles', score_impact: 10 },
      ],
    },
    analysis: {
      configuration_summary: 'For a 4-person family in a large Texas home with young children, the complete armory prioritizes defensive layering, family training infrastructure, and safe storage before expanding into specialty roles.',
      overall_assessment: `You've established a solid defensive foundation with your primary home defense and CCW firearms — that covers the critical baseline for your family. The 52/100 score reflects real opportunity: with young children in the home, the absence of safe storage is the most significant gap in your current setup, and adding a training platform will dramatically improve your family's overall readiness without the expense of your primary calibers.\n\nFor a large home with four family members, a single staged firearm creates a positional vulnerability you may not have considered. A second biometric quick-access safe at a different location in the home — one your spouse is trained and authorized to access — addresses this directly. This alone would move your Readiness score meaningfully.\n\nYour priority sequence is built around filling the gaps that have the most impact for a family of four in your home layout. Each addition directly improves your armory's ability to protect your household across more scenarios.`,
      priority_reasoning: 'The training platform comes first because it makes every other firearm in your armory more effective — regular practice with all family members is the highest-leverage investment. The staged secondary HD and youth trainer follow because they directly address the family-of-four vulnerabilities your current two-gun setup leaves open.',
      safe_storage_note: 'With young children in your home, secure storage is not optional. A critical gap in your Readiness score is directly tied to the absence of a safe — this should be addressed before or alongside any additional firearm purchases.',
    },
  };

  // ─── UTILS ──────────────────────────────────────────────────────────────────
  function tierColor(tier)  { return TIER_COLORS[tier] || '#6B7280'; }
  function tierLabel(tier)  { return TIER_LABELS[tier] || tier; }
  function roleById(id)     { return ROLES.find(r => r.id === id); }
  function priorityColor(p) {
    return p === 'CRITICAL' ? '#DC2626' : p === 'HIGH' ? '#EA580C' : p === 'MEDIUM' ? '#D97706' : '#059669';
  }

  function getRolesForProfile(profile) {
    const concerns = profile.primary_concerns || ['home_defense'];
    const relevant = new Set(['primary_home_defense', 'training_platform']);
    if (concerns.includes('ccw_carry'))     { relevant.add('ccw_primary'); relevant.add('backup_ccw'); }
    if (concerns.includes('home_defense'))  { relevant.add('defensive_shotgun'); relevant.add('versatile_rifle'); }
    if (concerns.includes('hunting'))       { relevant.add('hunting_rifle'); }
    if (concerns.includes('competition'))   { relevant.add('competition_pistol'); }
    if (concerns.includes('recreation'))    { relevant.add('youth_trainer'); }
    if (concerns.includes('rural_threats')) { relevant.add('rural_long_range'); relevant.add('versatile_rifle'); }
    if (['family_young','family_teen','couple'].includes(profile.life_stage)) { relevant.add('home_defense_staged'); }
    if (['family_young','family_teen'].includes(profile.life_stage))          { relevant.add('youth_trainer'); }
    if (['large_house','rural_property'].includes(profile.home_layout))       { relevant.add('versatile_rifle'); relevant.add('home_defense_staged'); }
    return ROLES.filter(r => relevant.has(r.id));
  }

  // Simple client-side IQ estimate (matches server logic closely)
  function estimateIQ(profile, inventory) {
    const coveredIds   = inventory.map(i => i.role_id);
    const relevantRoles = getRolesForProfile(profile);

    const hasPrimaryHD = coveredIds.includes('primary_home_defense');
    const hasCCW       = coveredIds.includes('ccw_primary');
    const wantsCCW     = (profile.primary_concerns || []).includes('ccw_carry');

    let foundation = 0;
    if (hasPrimaryHD) foundation += 22;
    if (wantsCCW && hasCCW) foundation += 8;
    else if (!wantsCCW) foundation += 8;
    foundation = Math.min(30, foundation);

    const totalPts  = relevantRoles.reduce((s, r) => s + 8, 0) || 1;
    const earnedPts = relevantRoles.filter(r => coveredIds.includes(r.id)).reduce((s) => s + 8, 0);
    const coverage  = Math.min(35, Math.round((earnedPts / totalPts) * 35));

    let readiness = 5;
    if (profile.has_safe_storage) readiness += (profile.life_stage === 'family_young' ? 12 : 6);
    else if (profile.life_stage === 'family_young') readiness = Math.max(0, readiness - 4);
    if (profile.training_commitment === 'high')     readiness += 5;
    else if (profile.training_commitment === 'moderate') readiness += 3;
    readiness = Math.min(20, readiness);

    let lifeStage = 8;
    if (profile.state_laws_verified) lifeStage = Math.min(15, lifeStage + 5);
    lifeStage = Math.min(15, lifeStage);

    const total = Math.min(100, Math.max(0, foundation + coverage + readiness + lifeStage));
    const tiers = [
      [95,'elite'],[85,'complete'],[70,'well_armed'],[50,'established'],[25,'building'],[0,'just_starting']
    ];
    const tier = (tiers.find(([t]) => total >= t) || [0,'just_starting'])[1];

    const coveredRoles   = relevantRoles.filter(r => coveredIds.includes(r.id));
    const missingRoles   = relevantRoles.filter(r => !coveredIds.includes(r.id));

    const PRANK = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 };
    const gaps  = missingRoles.map(r => ({
      role_id: r.id, role_name: r.name, priority: r.tier, shopfpr_category: r.shopfpr,
      why_matters: '', points_missing: 8,
    })).sort((a,b) => (PRANK[a.priority]||4) - (PRANK[b.priority]||4));

    const priorities = gaps.slice(0,4).map((g,i) => ({
      rank: i+1, role_id: g.role_id, role_name: g.role_name,
      priority: g.priority, shopfpr_category: g.shopfpr_category, score_impact: 8,
    }));

    return {
      total_score: total, score_tier: tier, tier_label: tierLabel(tier),
      foundation_score: foundation, coverage_score: coverage,
      readiness_score: readiness, life_stage_score: lifeStage,
      roles_covered: coveredRoles.length, roles_total: relevantRoles.length,
      gap_count_critical: gaps.filter(g=>g.priority==='CRITICAL').length,
      gap_count_high:     gaps.filter(g=>g.priority==='HIGH').length,
      gap_count_medium:   gaps.filter(g=>g.priority==='MEDIUM').length,
      gaps, priorities,
    };
  }

  // ─── CANVAS SCORE CARD ─────────────────────────────────────────────────────
  function drawScoreCard(canvas, iq, memberName) {
    const W = 560, H = 280;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0F1923');
    bg.addColorStop(1, '#1C2B3A');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Orange accent bar (top)
    ctx.fillStyle = '#EA580C'; ctx.fillRect(0, 0, W, 5);

    // Gold accent bar (left)
    const goldBar = ctx.createLinearGradient(0, 5, 0, H);
    goldBar.addColorStop(0, '#C9973A'); goldBar.addColorStop(1, '#B45309');
    ctx.fillStyle = goldBar; ctx.fillRect(0, 5, 4, H - 5);

    // Left section: BIG SCORE
    const scoreColor = tierColor(iq.score_tier);
    ctx.font = 'bold 96px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = scoreColor;
    ctx.fillText(String(iq.total_score), 130, 170);

    // Score label
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fillText('ARSENAL IQ™', 130, 200);

    // Tier label
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = scoreColor;
    ctx.fillText((iq.tier_label || '').toUpperCase(), 130, 222);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(260, 40); ctx.lineTo(260, H - 40); ctx.stroke();

    // Right section: stats
    ctx.textAlign = 'left';

    // Member name
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#C9973A';
    ctx.fillText(memberName || 'FPR Member', 280, 62);

    // Subtitle
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fillText('FPRMembers.com • Armory Builder', 280, 82);

    // Breakdown bars
    const comps = [
      { label: 'Foundation',    score: iq.foundation_score,   max: 30 },
      { label: 'Role Coverage', score: iq.coverage_score,     max: 35 },
      { label: 'Readiness',     score: iq.readiness_score,    max: 20 },
      { label: 'Life-Stage',    score: iq.life_stage_score,   max: 15 },
    ];
    comps.forEach((c, i) => {
      const y = 108 + i * 32;
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillText(c.label, 280, y);
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.textAlign = 'right';
      ctx.fillText(`${c.score}/${c.max}`, 540, y);
      ctx.textAlign = 'left';

      // Bar track
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.fillRect(280, y + 5, 260, 8);
      // Bar fill
      const pct = c.score / c.max;
      const barColor = pct >= .8 ? '#059669' : pct >= .6 ? '#D97706' : pct >= .4 ? '#EA580C' : '#DC2626';
      ctx.fillStyle = barColor;
      ctx.fillRect(280, y + 5, Math.round(260 * pct), 8);
    });

    // Roles stat
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.textAlign = 'left';
    ctx.fillText(`${iq.roles_covered}/${iq.roles_total} roles covered  •  ${iq.gap_count_critical + iq.gap_count_high} priority gaps`, 280, 244);

    // Footer URL
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.fillText('fprmembers.com/arsenal-iq', 280, 264);

    // FPR logo text (bottom left)
    ctx.font = 'bold 10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(201,151,58,.6)';
    ctx.fillText('FPRMEMBERS.COM', 24, 264);
  }

  // ─── VIEWS ──────────────────────────────────────────────────────────────────
  function renderWelcome() {
    const hasSavedScoreOnly = _iq && Array.isArray(_iq.gaps) && _iq.gaps.length === 0 && Array.isArray(_iq.priorities) && _iq.priorities.length === 0 && !_analysis;
    return `<div class="fpr-iq-welcome">
      <div class="fpr-iq-welcome-icon">🔫</div>
      <h1 class="fpr-iq-welcome-title">Arsenal IQ™</h1>
      <p class="fpr-iq-welcome-sub">
        Your personalized armory readiness score. Arsenal IQ analyzes your life stage, family,
        home, and concerns to identify gaps in your armory — then builds a priority purchase
        sequence to complete it. Score updates dynamically as your life changes.
      </p>

       <p class="fpr-iq-welcome-sub">
        Most gun owners own firearms. Few have a complete strategy.</p>
      <div class="fpr-iq-map-rule-notice">
        🔒 <strong>Arsenal IQ Score and gap analysis never display specific prices.</strong>
        All pricing appears exclusively on ShopFPR after you click through.
        The score is about preparedness completeness — never about cost.
      </div>
      <div class="fpr-iq-mode-grid">
        <div class="fpr-iq-mode-card" data-action="mode-quick">
          <div class="fpr-iq-mode-icon">⚡</div>
          <div class="fpr-iq-mode-title">Quick Score</div>
          <div class="fpr-iq-mode-sub">5 questions, instant estimated Arsenal IQ. Get your baseline in 60 seconds.</div>
          <div class="fpr-iq-mode-time">⏱ ~1 minute</div>
        </div>
        <div class="fpr-iq-mode-card" data-action="mode-full">
          <div class="fpr-iq-mode-icon">📋</div>
          <div class="fpr-iq-mode-title">Full Armory Builder</div>
          <div class="fpr-iq-mode-sub">Complete life-stage intake, gap analysis, and a personalized priority purchase sequence.</div>
          <div class="fpr-iq-mode-time">⏱ ~5 minutes</div>
        </div>
      </div>
      ${_iq ? `<button class="fpr-iq-btn fpr-iq-btn-outline" ${hasSavedScoreOnly ? 'disabled style="opacity:.45;cursor:not-allowed"' : ''} data-action="show-dashboard">View My Current Score (${_iq.total_score}/100) →</button>` : ''}
    </div>`;
  }

  function renderQuickWidget() {
    const p = _profile;
    function opts(key, items) {
      return `<div class="fpr-iq-option-grid">${items.map(([v,icon,label,sub]) =>
        `<div class="fpr-iq-option${p[key]===v?' selected':''}" data-select="${key}" data-value="${v}">
          <span class="fpr-iq-option-icon">${icon}</span>
          <span class="fpr-iq-option-label">${label}</span>
          ${sub?`<span class="fpr-iq-option-sub">${sub}</span>`:''}
        </div>`).join('')}</div>`;
    }
    return `<div class="fpr-iq-quick">
      <h2 class="fpr-iq-quick-title">Quick Arsenal IQ</h2>
      <p class="fpr-iq-quick-sub">5 questions • Instant estimated score • Upgrade to Full Armory Builder anytime</p>

      <div class="fpr-iq-section">
        <div class="fpr-iq-section-title">Current Firearm Count</div>
        ${opts('quick_count', [['0','0️⃣','None',''],['1-2','🔫','1–2',''],['3-5','🔫🔫','3–5',''],['6+','💼','6+','']])}
      </div>
      <div class="fpr-iq-section">
        <div class="fpr-iq-section-title">Home Type</div>
        ${opts('quick_home', [['apartment','🏙️','Apartment','Urban'],['house','🏡','House','Suburban'],['rural','🌾','Rural/Property','']])}
      </div>
      <div class="fpr-iq-section">
        <div class="fpr-iq-section-title">Family Situation</div>
        ${opts('quick_life', [['single','👤','Single',''],['couple','👫','Couple',''],['family','👨‍👩‍👧','Family w/ Kids',''],['senior','🧓','Senior','']])}
      </div>
      <div class="fpr-iq-section">
        <div class="fpr-iq-section-title">Primary Concern</div>
        ${opts('quick_concern', [['home_defense','🏠','Home Defense',''],['ccw','🕵️','CCW Carry',''],['hunting','🦌','Hunting',''],['all','🎯','All-Around','']])}
      </div>
      <div class="fpr-iq-section">
        <div class="fpr-iq-section-title">Experience Level</div>
        ${opts('quick_exp', [['new','🆕','New',''],['some','🎯','Some',''],['regular','🏆','Regular',''],['advanced','⭐','Advanced','']])}
      </div>
      <button class="fpr-iq-btn fpr-iq-btn-primary fpr-iq-btn-lg" data-action="run-quick" style="margin-top:8px">Calculate My Score →</button>
      <button class="fpr-iq-btn fpr-iq-btn-secondary" data-action="welcome" style="margin-top:8px;width:100%">← Back</button>
    </div>`;
  }

  function renderQuickResult() {
    const iq = _iq;
    const color = tierColor(iq.score_tier);
    return `<div class="fpr-iq-quick">
      <div class="fpr-iq-quick-result">
        <div class="fpr-iq-quick-score" style="color:${color}">${iq.total_score}</div>
        <div class="fpr-iq-quick-tier" style="color:${color}">${tierLabel(iq.score_tier)}</div>
        <div class="fpr-iq-quick-est">Estimated score based on 5 inputs — upgrade to Full Armory Builder for your precise score and AI gap analysis</div>
        <div class="fpr-iq-quick-cta-row">
          <button class="fpr-iq-btn fpr-iq-btn-primary" data-action="mode-full">Build Full Armory Plan →</button>
          <button class="fpr-iq-btn fpr-iq-btn-secondary" data-action="show-scorecard">View Score Card</button>
        </div>
      </div>
      ${renderPriorityMini(iq.priorities)}
      <div style="text-align:center;font-size:11.5px;color:#9AA3AF;margin-top:14px">
        For informational purposes only. Upgrade to Full Armory Builder for your complete gap analysis.
      </div>
    </div>`;
  }

  function renderPriorityMini(priorities) {
    if (!priorities?.length) return '';
    return `<div style="margin-top:16px">
      <div class="fpr-iq-section-title" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#EA580C;margin-bottom:10px">Priority Next Purchases</div>
      ${priorities.map(p => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fff;border-radius:8px;margin-bottom:6px;border:1px solid #E9ECEF">
          <span style="font-size:11px;font-weight:900;color:#fff;background:#EA580C;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">${p.rank}</span>
          <span style="font-size:13px;font-weight:700;color:#212529;flex:1">${p.role_name}</span>
          <button class="fpr-iq-gap-shopfpr" data-action="shopfpr" data-category="${p.shopfpr_category}" data-role="${p.role_id}" style="font-size:11px;padding:4px 10px">ShopFPR →</button>
        </div>`).join('')}
    </div>`;
  }

  function renderIntakeStep(step) {
    const p = _profile;
    const steps = ['Life Stage','Current Armory','Concerns','Capabilities','Training & Storage','Review'];
    const indicators = steps.map((s, i) => `
      ${i > 0 ? `<div class="fpr-iq-step-line${step > i+1?' complete':''}"></div>` : ''}
      <div class="fpr-iq-step${step===i+1?' active':step>i+1?' complete':''}">
        <div class="fpr-iq-step-dot">${step>i+1?'✓':i+1}</div>
        <span class="fpr-iq-step-label">${s}</span>
      </div>`).join('');

    const navRow = (prevAction, nextAction, nextLabel='Continue →') => `
      <div class="fpr-iq-nav-row">
        <button class="fpr-iq-btn fpr-iq-btn-secondary" data-action="${prevAction}">← Back</button>
        <button class="fpr-iq-btn fpr-iq-btn-primary" data-action="${nextAction}">${nextLabel}</button>
      </div>`;

    function opts(key, items, multi=false) {
      return `<div class="fpr-iq-option-grid">${items.map(([v,icon,label,sub])=>{
        const sel = multi ? (p[key]||[]).includes(v) : p[key]===v;
        return `<div class="fpr-iq-option${sel?' selected':''}" data-select="${key}" data-value="${v}" data-multi="${multi}">
          <span class="fpr-iq-option-icon">${icon}</span>
          <span class="fpr-iq-option-label">${label}</span>
          ${sub?`<span class="fpr-iq-option-sub">${sub}</span>`:''}
        </div>`;
      }).join('')}</div>`;
    }

    const content = {
      1: `
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Life Stage</div>
          ${opts('life_stage', [
            ['single','👤','Single',''],['couple','👫','Couple',''],
            ['family_young','👨‍👩‍👧','Young Family','Children under 12'],
            ['family_teen','👨‍👩‍👦‍👦','Teen Family','Children 13–18'],
            ['empty_nester','🏡','Empty Nester',''],['senior','🧓','Senior',''],
          ])}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div><label class="fpr-iq-label">Household Size</label>
            <input class="fpr-iq-input" type="number" id="s1-size" min="1" max="20" value="${p.family_size||1}">
          </div>
          <div><label class="fpr-iq-label">Home State</label>
            <input class="fpr-iq-input" id="s1-state" maxlength="2" placeholder="TX" value="${p.home_state||''}">
          </div>
        </div>
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Home Layout</div>
          ${opts('home_layout', [
            ['apartment','🏙️','Apartment','Urban / close quarters'],
            ['small_house','🏘️','Small House','<1,500 sq ft'],
            ['large_house','🏡','Large House','>1,500 sq ft'],
            ['rural_property','🌾','Rural / Property','Acreage, farm'],
          ])}
        </div>`,

      2: `
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Current Armory — Check Every Role You Have Covered</div>
          <p style="font-size:12px;color:#6B7684;margin:0 0 12px">Don't worry about specific makes and models — just which roles your firearms fill.</p>
          <div class="fpr-iq-checkbox-grid" id="s2-roles">
            ${ROLES.map(r => {
              const checked = (_inventory||[]).some(i=>i.role_id===r.id);
              return `<label class="fpr-iq-checkbox-item${checked?' checked':''}" data-role="${r.id}">
                <input type="checkbox" ${checked?'checked':''} data-role-check="${r.id}">
                <span class="fpr-iq-checkbox-label">${r.icon} ${r.name}</span>
              </label>`;
            }).join('')}
          </div>
        </div>`,

      3: `
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Primary Concerns — Select All That Apply</div>
          ${opts('primary_concerns', [
            ['home_defense','🏠','Home Defense',''],['ccw_carry','🕵️','CCW Carry',''],
            ['hunting','🦌','Hunting',''],['competition','🥇','Competition',''],
            ['recreation','🎯','Recreation',''],['natural_disaster','⚡','Natural Disaster',''],
            ['rural_threats','🌾','Rural Threats',''],
          ], true)}
        </div>
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Experience Level</div>
          ${opts('experience_level', [
            ['never_shot','🆕','Never Shot',''],['beginner','🎯','Beginner',''],
            ['intermediate','🏆','Intermediate',''],['experienced','⭐','Experienced',''],['expert','🥇','Expert',''],
          ])}
        </div>`,

      4: `
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Physical Capabilities</div>
          ${opts('physical_capabilities', [
            ['none','💪','No Limitations',''],['limited_strength','🦾','Limited Strength',''],
            ['limited_mobility','🦽','Limited Mobility',''],['arthritis','🤲','Arthritis',''],
          ])}
        </div>
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Other Household Users</div>
          <div class="fpr-iq-toggle">
            <input type="checkbox" id="s4-other-users" ${p.other_household_users?'checked':''}>
            <div><div class="fpr-iq-toggle-label">Other adults in my household may need to access these firearms</div>
              <div class="fpr-iq-toggle-sub">Affects Readiness score — all users should be trained</div>
            </div>
          </div>
          <div class="fpr-iq-toggle" style="margin-top:10px">
            <input type="checkbox" id="s4-laws" ${p.state_laws_verified?'checked':''}>
            <div><div class="fpr-iq-toggle-label">I have verified my planned armory complies with ${p.home_state||'my state'} laws</div>
              <div class="fpr-iq-toggle-sub">Affects Life-Stage score — always verify local laws before purchasing</div>
            </div>
          </div>
        </div>`,

      5: `
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Safe Storage</div>
          <div class="fpr-iq-toggle">
            <input type="checkbox" id="s5-safe" ${p.has_safe_storage?'checked':''}>
            <div><div class="fpr-iq-toggle-label">I have at least one secure gun safe or biometric quick-access safe</div>
              <div class="fpr-iq-toggle-sub">Significantly improves Readiness score — critical for households with children</div>
            </div>
          </div>
        </div>
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Training Commitment</div>
          ${opts('training_commitment', [
            ['low','📅','Low','1–2x per year'],['moderate','🎯','Moderate','Monthly range time'],
            ['high','🏆','High','Weekly or more'],
          ])}
        </div>
        <div class="fpr-iq-section">
          <label class="fpr-iq-label">Budget Tier <span>(stored confidentially — never shown in your score or gap analysis)</span></label>
          <select class="fpr-iq-select" id="s5-budget">
            <option value="budget" ${p.budget_tier==='budget'?'selected':''}>Budget-conscious</option>
            <option value="mid" ${(!p.budget_tier||p.budget_tier==='mid')?'selected':''}>Mid-range</option>
            <option value="premium" ${p.budget_tier==='premium'?'selected':''}>Premium</option>
            <option value="unlimited" ${p.budget_tier==='unlimited'?'selected':''}>Unlimited</option>
          </select>
        </div>`,

      6: `
        <div class="fpr-iq-section">
          <div class="fpr-iq-section-title">Review Your Profile</div>
          <div style="background:#fff;border-radius:10px;padding:16px;border:1px solid #E9ECEF;font-size:13px;line-height:1.8">
            <div><strong>Life Stage:</strong> ${p.life_stage?.replace(/_/g,' ')||'—'} (${p.family_size||1} person household)</div>
            <div><strong>Home:</strong> ${p.home_layout?.replace(/_/g,' ')||'—'} · ${p.home_state||'—'}</div>
            <div><strong>Concerns:</strong> ${(p.primary_concerns||[]).join(', ')||'—'}</div>
            <div><strong>Current Armory:</strong> ${_inventory.length} role(s) covered</div>
            <div><strong>Safe Storage:</strong> ${p.has_safe_storage?'Yes':'No'}</div>
            <div><strong>Training:</strong> ${p.training_commitment||'—'}</div>
          </div>
          <p style="font-size:12.5px;color:#6B7684;margin:14px 0 0">
            Clicking "Calculate Arsenal IQ" will score your armory and generate an AI gap analysis.
            <strong>No pricing will appear in the score or gap analysis.</strong>
            Pricing is only revealed on ShopFPR.
          </p>
        </div>`,
    }[step] || '';

    const prevActions = {1:'welcome',2:'intake-1',3:'intake-2',4:'intake-3',5:'intake-4',6:'intake-5'};
    const nextActions = {1:'intake-2',2:'intake-3',3:'intake-4',4:'intake-5',5:'intake-6',6:'run-full'};
    const nextLabels  = {6: 'Calculate Arsenal IQ →'};

    return `<div style="padding:20px;max-width:700px;margin:0 auto">
      <h2 style="font-size:18px;font-weight:800;color:#0F1923;margin:0 0 4px">
        ${steps[step-1]}
      </h2>
      <p style="font-size:12.5px;color:#9AA3AF;margin:0 0 16px">Step ${step} of ${steps.length}</p>
      <div class="fpr-iq-steps">${indicators}</div>
      ${content}
      ${navRow(prevActions[step], nextActions[step], nextLabels[step])}
    </div>`;
  }

  function renderDashboard() {
    const iq = _iq || DEMO.iq;
    const analysis = _analysis || DEMO.analysis;
    const inv  = _inventory.length ? _inventory : DEMO.inventory;
    const profile = Object.keys(_profile).length > 1 ? _profile : (_demoMode ? DEMO.profile : {});
    const relevantRoles = getRolesForProfile(profile);
    const coveredIds = inv.map(i => i.role_id);
    const color = tierColor(iq.score_tier);

    const showSafeAlert = profile.life_stage && (profile.life_stage === 'family_young' || profile.life_stage === 'family_teen') && !profile.has_safe_storage;
    const gapRows = Array.isArray(iq.gaps) ? iq.gaps : [];
    const priorityRows = Array.isArray(iq.priorities) ? iq.priorities : [];
    const noDetailedAnalysis = gapRows.length === 0 && priorityRows.length === 0;

    const breakdowns = [
      { label: 'Foundation',    v: iq.foundation_score,  max: 30 },
      { label: 'Role Coverage', v: iq.coverage_score,    max: 35 },
      { label: 'Readiness',     v: iq.readiness_score,   max: 20 },
      { label: 'Life-Stage',    v: iq.life_stage_score,  max: 15 },
    ];

    return `
      ${showSafeAlert ? `<div class="fpr-iq-storage-alert">
        <div class="fpr-iq-storage-alert-icon">🔐</div>
        <div class="fpr-iq-storage-alert-text">
          <strong>Safe Storage Gap Detected</strong>
          <span>With young children in your home, securing your firearms is your single most important next step before any additional purchases. This is actively suppressing your Readiness score.</span>
        </div>
      </div>` : ''}

      <div class="fpr-iq-dashboard-header">
        <div class="fpr-iq-score-panel">
          <div class="fpr-iq-score-big" style="color:${color}">${iq.total_score}</div>
          <div class="fpr-iq-score-meta">
            <strong>${tierLabel(iq.score_tier)}</strong>
            <span>${iq.roles_covered} of ${iq.roles_total} roles covered</span>
            <span class="tier-label" style="border-color:${color}40;color:${color}">${iq.score_tier.replace(/_/g,' ').toUpperCase()}</span>
          </div>
          <div class="fpr-iq-score-breakdown" style="flex:1">
            ${breakdowns.map(b => `
              <div class="fpr-iq-breakdown-row">
                <span class="fpr-iq-breakdown-label">${b.label}</span>
                <div class="fpr-iq-breakdown-track">
                  <div class="fpr-iq-breakdown-fill" style="width:${Math.round((b.v/b.max)*100)}%;background:${b.v/b.max>=.8?'#059669':b.v/b.max>=.6?'#D97706':b.v/b.max>=.4?'#EA580C':'#DC2626'}"></div>
                </div>
                <span class="fpr-iq-breakdown-pts">${b.v}/${b.max}</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="fpr-iq-roles-panel">
          <div class="fpr-iq-roles-title">Armory Role Coverage</div>
          ${relevantRoles.map(r => {
            const has = coveredIds.includes(r.id);
            return `<div class="fpr-iq-role-row">
              <div class="fpr-iq-role-check ${has?'have':'miss'}">${has?'✓':'○'}</div>
              <span class="fpr-iq-role-name${has?'':' miss'}">${r.icon} ${r.name}</span>
              ${!has ? `<span class="fpr-iq-role-tier ${r.tier}">${r.tier}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>

      ${analysis.overall_assessment ? `
        <div class="fpr-iq-analysis-panel">
          <div class="fpr-iq-analysis-title">Arsenal IQ Analysis</div>
          ${analysis.configuration_summary ? `<div class="fpr-iq-config-box">${analysis.configuration_summary}</div>` : ''}
          <div class="fpr-iq-analysis-body">${analysis.overall_assessment.split('\n').filter(p=>p.trim()).map(p=>`<p>${p}</p>`).join('')}</div>
        </div>` : ''}

      <div class="fpr-iq-dashboard-grid">
        <div>
          <div class="fpr-iq-gaps-panel">
            <div class="fpr-iq-gaps-title">Gap Analysis — What's Missing & Why</div>
            ${noDetailedAnalysis
              ? `<div style="text-align:center;padding:20px;color:#0F1923;font-weight:700">Run the Full Armory Builder for detailed gap analysis.</div>`
              : gapRows.map(gap => {
                  const narrative = (_analysis?.gap_narratives || DEMO.analysis.gap_narratives||[]).find(n=>n.role_id===gap.role_id);
                  return `<div class="fpr-iq-gap-card ${gap.priority}">
                    <div class="fpr-iq-gap-header">
                      <span class="fpr-iq-gap-priority">${gap.priority}</span>
                      <span class="fpr-iq-gap-name">${gap.role_name}</span>
                    </div>
                    ${narrative?.headline ? `<div class="fpr-iq-gap-headline">${narrative.headline}</div>` : ''}
                    <div class="fpr-iq-gap-why">${narrative?.explanation || gap.why_matters}</div>
                    <button class="fpr-iq-gap-shopfpr" data-action="shopfpr" data-category="${gap.shopfpr_category}" data-role="${gap.role_id}">
                      View Options on ShopFPR →
                    </button>
                  </div>`;
                }).join('')}
          </div>
        </div>

        <div>
          <div class="fpr-iq-priority-panel" style="margin-bottom:14px">
            <div class="fpr-iq-priority-title">Priority Purchase Sequence</div>
            <div class="fpr-iq-priority-list">
              ${iq.priorities.map(p => `
                <div class="fpr-iq-priority-item">
                  <div class="fpr-iq-priority-rank">${p.rank}</div>
                  <div class="fpr-iq-priority-body">
                    <div class="fpr-iq-priority-name">${p.role_name}</div>
                    <div class="fpr-iq-priority-pts">+${p.score_impact} Arsenal IQ points</div>
                    <button class="fpr-iq-priority-shopfpr" data-action="shopfpr" data-category="${p.shopfpr_category}" data-role="${p.role_id}">
                      View on ShopFPR →
                    </button>
                  </div>
                </div>`).join('')}
            </div>
          </div>

          <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.07);margin-bottom:14px">
            <div class="fpr-iq-roles-title" style="margin-bottom:10px">Score Actions</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <button class="fpr-iq-btn fpr-iq-btn-primary" data-action="show-scorecard" style="width:100%">📊 View & Share Score Card</button>
              <button class="fpr-iq-btn fpr-iq-btn-secondary" data-action="mode-full" style="width:100%">🔄 Update Profile & Rescore</button>
              ${!_demoMode ? `<button class="fpr-iq-btn fpr-iq-btn-secondary" data-action="generate-analysis" style="width:100%">🤖 Regenerate AI Analysis</button>` : ''}
            </div>
          </div>

          ${analysis.safe_storage_note ? `
            <div style="background:#FFF7ED;border:1px solid rgba(234,88,12,.25);border-radius:10px;padding:12px 14px;font-size:12px;color:#92400E;font-weight:600">
              💡 ${analysis.safe_storage_note}
            </div>` : ''}
        </div>
      </div>

      <div style="text-align:center;font-size:11.5px;color:#9AA3AF;margin-top:12px;padding-bottom:4px">
        For informational purposes only. All pricing exclusively on ShopFPR. Always verify local laws before purchasing.
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:8px;padding-bottom:4px">
        <button onclick="FPRShare.open('Share Your Build')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share Your Build
        </button>
      </div>
    `;
  }

  function renderScoreCard() {
    const iq = _iq || DEMO.iq;
    return `<div class="fpr-iq-scorecard-panel">
      <h2 style="font-size:16px;font-weight:800;color:#0F1923;margin:0 0 14px">Arsenal IQ™ Score Card</h2>
      <div class="fpr-iq-scorecard-canvas-wrap">
        <canvas class="fpr-iq-scorecard-canvas" id="iq-scorecard-canvas"></canvas>
      </div>
      <div class="fpr-iq-scorecard-actions">
        <button class="fpr-iq-btn fpr-iq-btn-primary" data-action="download-card">⬇ Download PNG</button>
        <button class="fpr-iq-btn fpr-iq-btn-secondary" data-action="share-card">🔗 Generate Share Link</button>
        <button class="fpr-iq-btn fpr-iq-btn-secondary" data-action="show-dashboard">← Back to Dashboard</button>
      </div>
      ${_shareCard?.share_url ? `<div class="fpr-iq-scorecard-share-url">${_shareCard.share_url}</div>` : ''}
      <div style="margin-top:14px;font-size:11.5px;color:#9AA3AF">
        The Arsenal IQ Score represents armory preparedness completeness for your profile.
        It is not an endorsement or guarantee. For informational purposes only.
      </div>
    </div>`;
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  function render() {
    const iq = _iq || (_demoMode ? DEMO.iq : null);
    const scoreChip = iq ? `${iq.total_score}/100` : 'Not scored';
    const chipColor = iq ? tierColor(iq.score_tier) : '#6B7280';

    const navBtns = _view !== 'welcome' && _view !== 'quick' && _view !== 'quick-result' ? `
      <div class="fpr-iq-topbar-nav">
        ${iq || _demoMode ? `<button class="fpr-iq-topbar-btn${_view==='dashboard'?' active':''}" data-action="show-dashboard">Dashboard</button>` : ''}
        <button class="fpr-iq-topbar-btn${_view==='scorecard'?' active':''}" data-action="show-scorecard">Score Card</button>
        <button class="fpr-iq-topbar-btn" data-action="mode-full">Update Profile</button>
      </div>` : '';

    const content = {
      welcome:      renderWelcome,
      quick:        renderQuickWidget,
      'quick-result': renderQuickResult,
      dashboard:    () => (_demoMode || _iq) ? renderDashboard() : renderWelcome(),
      scorecard:    renderScoreCard,
      intake:       () => renderIntakeStep(_step),
    }[_view] || renderWelcome;

    _el.innerHTML = `<div class="fpr-iq">
      <div class="fpr-iq-topbar">
        <div class="fpr-iq-brand">FPRMembers</div>
        <span class="fpr-iq-topbar-title">Arsenal IQ™</span>
        ${navBtns}
        ${iq ? `<span class="fpr-iq-score-chip" style="border-color:${chipColor}40;color:${chipColor}">${scoreChip}</span>` : ''}
      </div>
      <div class="fpr-iq-body" id="iq-body">${content()}</div>
    </div>`;

    attachHandlers();

    if (_view === 'scorecard') {
      requestAnimationFrame(() => {
        const canvas = document.getElementById('iq-scorecard-canvas');
        if (canvas) drawScoreCard(canvas, iq || DEMO.iq, _memberName || 'FPR Member');
      });
    }
  }

  // ─── HANDLERS ───────────────────────────────────────────────────────────────
  function attachHandlers() {
    const body = _el.querySelector('#iq-body');
    if (!body) return;
    body.addEventListener('click', handleClick);
  }

  // Option card and checkbox selection
  document.addEventListener('click', e => {
    if (!_el) return;
    const card = e.target.closest('.fpr-iq-option[data-select]');
    if (card && _el.contains(card)) {
      const key = card.dataset.select, val = card.dataset.value;
      const isMulti = card.dataset.multi === 'true';
      if (isMulti) {
        const arr = Array.isArray(_profile[key]) ? [..._profile[key]] : [];
        const idx = arr.indexOf(val);
        if (idx >= 0) arr.splice(idx, 1); else arr.push(val);
        _profile[key] = arr;
      } else {
        _profile[key] = val;
      }
      render();
    }
  });

  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case 'welcome':       _view = 'welcome';   render(); break;
      case 'mode-quick':    _view = 'quick';     render(); break;
      case 'mode-full':     _view = 'intake'; _step = 1; render(); break;
      case 'show-dashboard': _view = 'dashboard'; if (_demoMode && !_iq) { _iq = DEMO.iq; _analysis = DEMO.analysis; _inventory = DEMO.inventory; _profile = { ...DEMO.profile }; } window.fprAwardTicket('arsenal_analyzed', {}); render(); break;
      case 'show-scorecard': _view = 'scorecard'; render(); break;
      case 'run-quick':     handleQuickScore(); break;
      case 'intake-1': case 'intake-2': case 'intake-3':
      case 'intake-4': case 'intake-5': case 'intake-6':
        saveCurrentStep(); _step = parseInt(action.split('-')[1]); render(); break;
      case 'run-full':       handleFullScore(); break;
      case 'generate-analysis': handleGenerateAnalysis(); break;
      case 'shopfpr':        handleShopFPR(btn); break;
      case 'download-card':  handleDownloadCard(); break;
      case 'share-card':     handleShareCard(); break;
    }
  }

  function saveCurrentStep() {
    // Persist step-specific field values before navigating
    const g = id => document.getElementById(id);
    if (_step === 1) {
      if (g('s1-size'))  _profile.family_size = parseInt(g('s1-size').value) || 1;
      if (g('s1-state')) _profile.home_state  = g('s1-state').value.toUpperCase();
    }
    if (_step === 2) {
      // Checkbox roles
      const checks = document.querySelectorAll('[data-role-check]');
      _inventory = [];
      checks.forEach(cb => {
        if (cb.checked) _inventory.push({ role_id: cb.dataset.roleCheck, firearm_type: 'unknown', caliber_category: null });
      });
    }
    if (_step === 4) {
      if (g('s4-other-users')) _profile.other_household_users = g('s4-other-users').checked;
      if (g('s4-laws'))        _profile.state_laws_verified   = g('s4-laws').checked;
    }
    if (_step === 5) {
      if (g('s5-safe'))   _profile.has_safe_storage = g('s5-safe').checked;
      if (g('s5-budget')) _profile.budget_tier      = g('s5-budget').value;
    }
  }

  function handleQuickScore() {
    // Map quick answers to full profile for estimation
    const qp = _profile;
    const lifeMap = { single:'single', couple:'couple', family:'family_young', senior:'senior' };
    const iq = {
      total_score: estimateScore(qp),
    };
    // Lightweight estimate
    const mapCount = { '0':0,'1-2':15,'3-5':28,'6+':42 };
    const mapHome  = { apartment:5, house:8, rural:6 };
    const mapLife  = { single:10, couple:8, family:5, senior:9 };
    const mapExp   = { new:0, some:3, regular:6, advanced:9 };
    let s = (mapCount[qp.quick_count]||0) + (mapHome[qp.quick_home]||6) + (mapLife[qp.quick_life]||8) + 6 + (mapExp[qp.quick_exp]||3);
    s = Math.min(92, Math.max(8, s));
    const tiers = [[95,'elite'],[85,'complete'],[70,'well_armed'],[50,'established'],[25,'building'],[0,'just_starting']];
    const tier  = (tiers.find(([t]) => s >= t) || [0,'just_starting'])[1];
    _iq = {
      total_score: s, score_tier: tier, tier_label: tierLabel(tier),
      foundation_score: Math.round(s*0.3), coverage_score: Math.round(s*0.35),
      readiness_score: Math.round(s*0.2), life_stage_score: Math.round(s*0.15),
      roles_covered: Math.round((qp.quick_count==='6+'?8:qp.quick_count==='3-5'?4:qp.quick_count==='1-2'?1:0)),
      roles_total: 6, gap_count_critical: 0, gap_count_high: 2, gap_count_medium: 1,
      gaps: [], priorities: [],
    };
    _view = 'quick-result';
    render();
  }

  function estimateScore(qp) { return 0; } // placeholder — handled inline above

  async function handleFullScore() {
    saveCurrentStep();
    const body = _el.querySelector('#iq-body');
    if (body) body.innerHTML = `<div class="fpr-iq-loading"><div class="fpr-iq-spinner"></div><div class="fpr-iq-loading-text">Calculating your Arsenal IQ…</div></div>`;

    if (_demoMode) {
      await delay(1200);
      _iq       = { ...DEMO.iq, ...estimateIQ(_profile.life_stage ? _profile : DEMO.profile, _inventory.length ? _inventory : DEMO.inventory) };
      _analysis = DEMO.analysis;
      _view     = 'dashboard';
      render();
      return;
    }

    try {
      await apiPost('/api/arsenal/profile', { member_id: _memberId, ..._profile });
      for (const item of _inventory) {
        await apiPost(`/api/arsenal/member/${_memberId}/inventory`, item);
      }
      const calcData = await apiPost(`/api/arsenal/member/${_memberId}/generate-analysis`, {});
      _iq       = calcData.iq;
      _analysis = calcData.analysis;
      _view     = 'dashboard';
      render();
    } catch (err) {
      if (body) body.innerHTML = `<div class="fpr-iq-loading" style="color:#DC2626">⚠️ ${err.message}<br><button class="fpr-iq-btn fpr-iq-btn-secondary" data-action="intake-6" style="margin-top:12px">← Back</button></div>`;
    }
  }

  async function handleGenerateAnalysis() {
    if (_demoMode) { _analysis = DEMO.analysis; render(); return; }
    const body = _el.querySelector('#iq-body');
    if (body) body.innerHTML = `<div class="fpr-iq-loading"><div class="fpr-iq-spinner"></div><div class="fpr-iq-loading-text">Regenerating AI analysis…</div></div>`;
    try {
      const d  = await apiPost(`/api/arsenal/member/${_memberId}/generate-analysis`, {});
      _iq       = d.iq;
      _analysis = d.analysis;
      _view     = 'dashboard';
      render();
    } catch (err) { render(); }
  }

  function handleShopFPR(btn) {
    const cat    = btn.dataset.category;
    const roleId = btn.dataset.role;
    if (!_demoMode) {
      apiPost(`/api/arsenal/member/${_memberId}/behavior`, { event_type: 'shopfpr_click', role_id: roleId, shopfpr_category: cat }).catch(()=>{});
    }
    const url = `${_shopfprBase}/collections/${cat}`;
    if (_demoMode) {
      alert(`In production, this opens:\n${url}\n\nPricing is ONLY shown on ShopFPR — never in the Arsenal IQ dashboard.`);
    } else {
      window.open(url, '_blank');
    }
  }

  function handleDownloadCard() {
    const canvas = document.getElementById('iq-scorecard-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `arsenal-iq-${(_iq||DEMO.iq).total_score}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (!_demoMode) {
      apiPost(`/api/arsenal/member/${_memberId}/behavior`, { event_type: 'scorecard_download' }).catch(()=>{});
    }
  }

  async function handleShareCard() {
    if (_demoMode) {
      alert('Connect API to generate a shareable score card link.');
      return;
    }
    try {
      const d = await apiPost(`/api/arsenal/member/${_memberId}/share-card`, { display_name: _memberName });
      _shareCard = d;
      render();
    } catch (err) { alert('Share card error: ' + err.message); }
  }

  // ─── API HELPERS ─────────────────────────────────────────────────────────────
  async function apiPost(path, body) {
    const res = await fetch(`${_api}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }
  async function apiGet(path) {
    const res = await fetch(`${_api}${path}`);
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }
  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function loadData() {
    if (_demoMode) return;
    try {
      const [prof, inv, score, analysis] = await Promise.all([
        apiGet(`/api/arsenal/member/${_memberId}/profile`).catch(()=>null),
        apiGet(`/api/arsenal/member/${_memberId}/inventory`).catch(()=>({ inventory:[] })),
        apiGet(`/api/arsenal/member/${_memberId}/score`).catch(()=>null),
        apiGet(`/api/arsenal/member/${_memberId}/analysis`).catch(()=>null),
      ]);
      if (prof?.profile)  _profile   = prof.profile;
      if (inv?.inventory) _inventory = inv.inventory;
      if (score?.score)   _iq        = { ...score.score, gaps: [], priorities: [] };
      if (analysis?.analysis) _analysis = analysis.analysis;
    } catch { /* use demo */ }
  }

  // ─── PUBLIC INIT ─────────────────────────────────────────────────────────────
  async function init(el) {
    _el          = el;
    _api         = (el.dataset.apiUrl || '').replace(/\/$/, '');
    _memberId    = el.dataset.memberId   || 'preview-member';
    _memberName  = el.dataset.memberName || 'FPR Member';
    _shopfprBase = el.dataset.shopfprUrl || 'https://shopfpr.com';
    _demoMode    = !_api;

    if (!_demoMode) await loadData();

    // Auto-show dashboard if returning member already has a score
    if (_iq && !_demoMode) _view = 'dashboard';

    render();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.fpr-iq-mount');
  if (el) window.__fprResolveMount(el).then(function(){ FPRArsenalIQ.init(el); });
});
