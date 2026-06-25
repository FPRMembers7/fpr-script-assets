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



/* FPRMembers.com — Build 11: AI Gun Matchmaker — Biometric Fitment Engine
   Mount: <div class="fpr-mm-mount" data-api-url="" data-member-id="" data-member-name="">
   Bootstrap: FPRMatchmaker.init(document.querySelector('.fpr-mm-mount'))

   MAP COMPLIANCE: No price is ever shown on the recommendation page.
   Pricing only surfaces after the member clicks "See Pricing & Availability."
*/

var FPRMatchmaker = window.FPRMatchmaker || (() => {
  // ─── STATE ──────────────────────────────────────────────────────────────────
  let _el, _api, _memberId, _memberName;
  let _view     = 'welcome';  // welcome / intake / analyzing / recommendation / history
  let _step     = 1;          // 1-3 intake steps
  let _profile  = {};
  let _handFile = null;
  let _handAnalysis = null;
  let _recommendation = null;
  let _history  = [];
  let _demoMode = true;

  // ─── DEMO DATA ──────────────────────────────────────────────────────────────
  const DEMO = {
    profile: {
      experience_level: 'intermediate', primary_intent: 'ccw',
      living_environment: 'suburban', risk_tolerance: 'moderate',
      dominant_hand: 'right', hand_size: 'M',
    },
    handAnalysis: {
      estimated_hand_size: 'M', estimated_grip_width_mm: 79,
      estimated_trigger_reach_mm: 70, finger_length_ratio: 'average',
      confidence_level: 'high',
    },
    recommendation: {
      gun_make: 'Sig Sauer', gun_model: 'P365 XL',
      overall_compatibility: 89, match_tier: 'excellent',
      scores: {
        overall: 89, grip_fit: 91, trigger_reach: 87, bore_axis: 68, recoil: 92, use_case: 90, experience_match: 95,
      },
      gun: {
        id: 'sig-p365-xl', make: 'Sig Sauer', model: 'P365 XL',
        caliber: '9mm Luger', type: 'semi-auto-pistol', category: 'compact',
        overall_length_in: 6.60, barrel_length_in: 3.70, height_in: 4.80, width_in: 1.10,
        weight_oz_unloaded: 20.7, grip_width_mm: 25, trigger_reach_mm: 63,
        bore_axis_height_mm: 38, magazine_capacity: 12,
        recoil_rating: 2, trigger_pull_lbs: 5.5,
        suitable_hand_sizes: ['S', 'M', 'L'],
        pros: ['Longer sight radius than P365', 'Better recoil management than P365', 'Optic-ready slide standard', 'Excellent balance of size and shootability'],
        not_ideal_for: ['Maximizing concealability', 'Very large hands'],
      },
      warnings: [],
      narrative: {
        headline: 'For your medium hands and suburban CCW intent, the P365 XL delivers the precision of a larger gun in a carry-ready package.',
        body: `Given your intermediate experience and commitment to everyday carry in a suburban environment, the Sig Sauer P365 XL represents a near-ideal biometric match. Your estimated grip width of 79mm pairs naturally with the P365 XL's 25mm grip — the single-stack profile means a 3-finger purchase without the bulk of a double-stack, and your trigger reach measurement places your index finger perfectly on the face of the trigger without overextension.\n\nThe P365 XL's extended sight radius compared to the standard P365 is meaningful at your experience level — a longer barrel produces a cleaner sight picture, faster target acquisition, and more consistent accuracy during timed practice sessions. The optic-ready slide means you can add a red dot as your skill level advances, keeping this firearm relevant as your proficiency grows.\n\nFor suburban CCW, the P365 XL threads the needle between concealability and capability. At 20.7 ounces loaded with its flush magazine, it disappears on a quality belt holster while still offering the 12+1 capacity you'd want in any defensive situation. Your FPR dealer can fit you with a proper holster and help you evaluate appendix, strong-side, or small-of-back carry based on your specific clothing and lifestyle.`,
        fit_highlights: [
          'Grip width (25mm) matches your medium hand profile — full purchase without spreading fingers',
          'Trigger reach at 63mm lands well within your estimated 64–72mm ideal zone',
          '12+1 capacity optimized for suburban CCW — balances concealability with defensive capability',
        ],
        dealer_cta: 'Visit your FPR dealer to handle the P365 XL in person — fit verification in-hand is the final step before any carry decision.',
      },
      alternatives: [
        { gun: { make: 'Smith & Wesson', model: 'M&P Shield Plus', caliber: '9mm', category: 'compact' }, overall_compatibility: 83, match_tier: 'excellent', rank: 1 },
        { gun: { make: 'Glock', model: '43X', caliber: '9mm', category: 'slim-compact' }, overall_compatibility: 79, match_tier: 'good', rank: 2 },
        { gun: { make: 'Springfield Armory', model: 'Hellcat OSP', caliber: '9mm', category: 'micro-compact' }, overall_compatibility: 64, match_tier: 'good', rank: 3 },
      ],
    },
    // Example of a "poor match" to power the Not Right For You section demo
    poorMatchWarnings: [
      'Trigger reach may be too long for your estimated hand size — may require grip adjustment',
      'Recoil can be challenging for intermediate-level shooters without structured training',
    ],
  };

  // ─── CANVAS: RADAR CHART ───────────────────────────────────────────────────
  function drawRadarChart(canvas, scores) {
    const size = canvas.width;
    const ctx  = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2, cy = size / 2;
    const maxR = size / 2 - 32;
    const n = 6;
    const dims = ['Grip Fit', 'Trigger Reach', 'Bore Axis', 'Recoil', 'Use-Case', 'Experience'];
    const vals = [
      (scores.grip_fit       || 0) / 100,
      (scores.trigger_reach  || 0) / 100,
      (scores.bore_axis      || 0) / 100,
      (scores.recoil         || 0) / 100,
      (scores.use_case       || 0) / 100,
      (scores.experience_match || scores.experience || 0) / 100,
    ];
    const angles = Array.from({ length: n }, (_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);

    // Grid rings
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxR;
      ctx.beginPath();
      angles.forEach((a, i) => {
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = ring === 5 ? '#D1D5DB' : '#E9ECEF';
      ctx.lineWidth = ring === 5 ? 1.5 : 1;
      ctx.stroke();
    }

    // Axes
    angles.forEach(a => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
      ctx.strokeStyle = '#E9ECEF'; ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Filled compatibility polygon
    const overall = vals.reduce((s, v) => s + v, 0) / n;
    const fillColor = overall >= .8 ? '5,150,105' : overall >= .65 ? '217,119,6' : overall >= .5 ? '234,88,12' : '220,38,38';

    ctx.beginPath();
    vals.forEach((v, i) => {
      const r = v * maxR, x = cx + r * Math.cos(angles[i]), y = cy + r * Math.sin(angles[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle   = `rgba(${fillColor},.18)`;
    ctx.fill();
    ctx.strokeStyle = `rgb(${fillColor})`;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Dots
    vals.forEach((v, i) => {
      const r = v * maxR, x = cx + r * Math.cos(angles[i]), y = cy + r * Math.sin(angles[i]);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = `rgb(${fillColor})`; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Labels
    ctx.font = 'bold 9.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#495057';
    angles.forEach((a, i) => {
      const r = maxR + 22, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      ctx.textAlign = Math.cos(a) > 0.1 ? 'left' : Math.cos(a) < -0.1 ? 'right' : 'center';
      ctx.fillText(dims[i], x, y + 3);
    });
  }

  // ─── CANVAS: GUN PROFILE DIAGRAM ──────────────────────────────────────────
  function drawGunDiagram(canvas, scores, gunData) {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const isLongGun = gunData && ['pump-shotgun','semi-auto-rifle','bolt-action-rifle'].includes(gunData.type);

    function scoreRGB(s) {
      if (s >= 80) return '5,150,105';
      if (s >= 60) return '217,119,6';
      if (s >= 40) return '234,88,12';
      return '220,38,38';
    }

    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }

    if (isLongGun) {
      // Simplified long gun: stock + receiver + barrel
      ctx.fillStyle = '#6B7280';
      rr(8, H/2-10, W-24, 20, 4); ctx.fill();         // receiver/barrel
      ctx.fillStyle = '#9CA3AF';
      rr(W-24, H/2-6, 24, 12, 3); ctx.fill();          // muzzle
      ctx.fillStyle = '#4B5563';
      rr(8, H/2-10, 40, 30, 4); ctx.fill();             // stock area

      // Bore axis line
      const boreRGB = scoreRGB(scores.bore_axis);
      ctx.strokeStyle = `rgba(${boreRGB},0.9)`; ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath(); ctx.moveTo(20, H/2-10); ctx.lineTo(W-10, H/2-10); ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#374151';
      ctx.fillText('Length of Pull & Balance', W/2, H-6);
      return;
    }

    // Pistol side profile
    // Slide
    const sX = 70, sY = 28, sW = 200, sH = 44;
    ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#374151'; rr(sX, sY, sW, sH, 6); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Barrel tip
    ctx.fillStyle = '#1F2937'; ctx.fillRect(sX + sW - 2, sY + 14, 22, 16);

    // Frame
    const fX = sX + 40, fY = sY + sH, fW = 130, fH = 32;
    ctx.fillStyle = '#6B7280'; rr(fX, fY, fW, fH, 4); ctx.fill();

    // Grip
    const gX = fX + 5, gY = fY + fH, gW = 76, gH = 62;
    const gripRGB = scoreRGB(scores.grip_fit);
    ctx.fillStyle = '#9CA3AF'; rr(gX, gY, gW, gH, [0, 0, 8, 8]); ctx.fill();
    ctx.fillStyle = `rgba(${gripRGB},.45)`; rr(gX, gY, gW, gH, [0, 0, 8, 8]); ctx.fill();
    // Grip texture dots
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.beginPath();
        ctx.arc(gX + 12 + col * 16, gY + 16 + row * 16, 2, 0, 2*Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill();
      }
    }

    // Bore axis line
    const boreY = sY + 14, boreRGB = scoreRGB(scores.bore_axis);
    ctx.strokeStyle = `rgba(${boreRGB},0.9)`; ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(sX, boreY); ctx.lineTo(sX + sW + 22, boreY); ctx.stroke();
    ctx.setLineDash([]);

    // Trigger
    const tX = fX + 65, tY = fY + 8;
    const trigRGB = scoreRGB(scores.trigger_reach);
    ctx.fillStyle = `rgba(${trigRGB},.85)`;
    ctx.fillRect(tX, tY, 5, 20);
    // Trigger guard
    ctx.strokeStyle = '#9CA3AF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(tX, tY + 26, 22, 0, Math.PI * 0.75); ctx.stroke();

    // Labels
    ctx.font = 'bold 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    // Bore axis label
    ctx.fillStyle = `rgb(${boreRGB})`;
    ctx.fillText('BORE AXIS', sX + sW / 2, sY - 6);
    // Grip label
    ctx.fillStyle = `rgb(${gripRGB})`;
    ctx.fillText('GRIP FIT', gX + gW / 2, gY + gH + 14);
    // Trigger label
    ctx.fillStyle = `rgb(${trigRGB})`;
    ctx.textAlign = 'left';
    ctx.fillText('TRIGGER REACH', tX + 12, tY + 10);
  }

  // ─── SCORE COLOR HELPERS ───────────────────────────────────────────────────
  function scoreColor(s)   { return s >= 80 ? '#059669' : s >= 65 ? '#D97706' : s >= 50 ? '#EA580C' : '#DC2626'; }
  function tierClass(tier) { return tier || 'good'; }
  function icon(name, className = 'fpr-mm-svg-icon') {
    const paths = {
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
      hand: '<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10"/><path d="M11 10V4.5a1.5 1.5 0 0 1 3 0V10"/><path d="M14 10V6.5a1.5 1.5 0 0 1 3 0V13"/><path d="M8 11V8.5a1.5 1.5 0 0 0-3 0V14c0 4 2.5 7 7 7h1c4 0 6-2.5 6-6v-2"/>',
      chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l4-4 3 3 5-7"/><circle cx="7" cy="15" r="1"/><circle cx="11" cy="11" r="1"/><circle cx="14" cy="14" r="1"/><circle cx="19" cy="7" r="1"/>',
      message: '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z"/><path d="M8 12h8M8 9h6M8 15h4"/>',
      alert: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
      lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
      clipboard: '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5a3 3 0 0 1 6 0"/><path d="M9 12h6M9 16h4"/>',
      book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M4 5.5v16"/><path d="M8 7h8"/>',
      star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2l-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
      medal: '<path d="M8 3h8l-2 5h-4L8 3Z"/><circle cx="12" cy="14" r="5"/>',
      trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 12v4M9 20h6M10 16h4"/>',
      home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
      box: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
      infinity: '<path d="M6.5 15C4.6 15 3 13.7 3 12s1.6-3 3.5-3c3.5 0 7 6 11 6 1.9 0 3.5-1.3 3.5-3s-1.6-3-3.5-3c-3.5 0-7 6-11 6Z"/>',
      building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 8h2a2 2 0 0 1 2 2v11"/><path d="M8 7h4M8 11h4M8 15h4M6 21h16"/>',
      tree: '<path d="M12 22v-6"/><path d="M7 16h10l-3-4h2l-4-6-4 6h2l-3 4Z"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
      bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      handshake: '<path d="M8 12 5 9l-3 3 5 5 5-5"/><path d="m16 12 3-3 3 3-5 5-5-5"/><path d="M8 12h8"/>',
      camera: '<path d="M4 8h4l2-3h4l2 3h4v11H4V8Z"/><circle cx="12" cy="13.5" r="3.5"/>',
      thumbsUp: '<path d="M7 11v10H3V11h4Z"/><path d="M7 11l5-8 1 1a3 3 0 0 1 .5 3L13 9h6a2 2 0 0 1 2 2l-1 7a3 3 0 0 1-3 3H7"/>',
      thumbsDown: '<path d="M7 13V3H3v10h4Z"/><path d="M7 13l5 8 1-1a3 3 0 0 0 .5-3L13 15h6a2 2 0 0 0 2-2l-1-7a3 3 0 0 0-3-3H7"/>',
    };
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.target}</svg>`;
  }

  // ─── RENDER FUNCTIONS ──────────────────────────────────────────────────────
  function renderWelcome() {
    return `<div class="fpr-mm-welcome">
      <div class="fpr-mm-welcome-icon">${icon('target')}</div>
      <h1 class="fpr-mm-welcome-title">VANGUARD GunFit</h1>
      <p class="fpr-mm-welcome-sub">
        Precision firearm matching powered by GunDNA analysis.
      </p>
      <p class="fpr-mm-welcome-sub">
The right firearm should feel natural the moment you pick it up.      </p>
      <p class="fpr-mm-welcome-sub">
Finding the right fit changes everything — comfort, confidence, and control     </p>
      <div class="fpr-mm-feature-list">
        <div class="fpr-mm-feature-item">
          <span class="fpr-mm-feature-item-icon">${icon('hand')}</span>
          <div class="fpr-mm-feature-item-text">
            <strong>Biometric Fitment</strong>
            <span>Optional hand photo maps your grip geometry to specific firearms</span>
          </div>
        </div>
        <div class="fpr-mm-feature-item">
          <span class="fpr-mm-feature-item-icon">${icon('chart')}</span>
          <div class="fpr-mm-feature-item-text">
            <strong>Compatibility Heatmap</strong>
            <span>Visual breakdown of grip fit, trigger reach, and bore axis</span>
          </div>
        </div>
        <div class="fpr-mm-feature-item">
          <span class="fpr-mm-feature-item-icon">${icon('message')}</span>
          <div class="fpr-mm-feature-item-text">
            <strong>Fitment Explanation</strong>
            <span>"Why This Gun" narrative specific to your profile</span>
          </div>
        </div>
        <div class="fpr-mm-feature-item">
          <span class="fpr-mm-feature-item-icon">${icon('alert')}</span>
          <div class="fpr-mm-feature-item-text">
            <strong>Honest Warnings</strong>
            <span>Poor matches are flagged clearly — no overselling</span>
          </div>
        </div>
      </div>
      <div class="fpr-mm-price-notice">
        ${icon('lock')} <strong>Pricing is never shown on the recommendation page.</strong>
        All recommendations are purely about fit, feel, and use-case.
        Pricing appears only after you click "See Pricing &amp; Availability."
      </div>
      <button class="fpr-mm-btn fpr-mm-btn-primary fpr-mm-btn-lg" data-action="start">Find My Match →</button>
    </div>`;
  }

  function renderStepIndicator() {
    const steps = [
      { label: 'Profile',    n: 1 },
      { label: 'Use Case',   n: 2 },
      { label: 'Hand Scan',  n: 3 },
    ];
    return `<div class="fpr-mm-steps">
      ${steps.map((s, i) => `
        ${i > 0 ? `<div class="fpr-mm-step-line${_step > i ? ' complete' : ''}"></div>` : ''}
        <div class="fpr-mm-step${_step === s.n ? ' active' : _step > s.n ? ' complete' : ''}">
          <div class="fpr-mm-step-circle">${_step > s.n ? icon('check') : s.n}</div>
          <span class="fpr-mm-step-label">${s.label}</span>
        </div>
      `).join('')}
    </div>`;
  }

  function renderIntakeStep1() {
    const p = _profile;
    const opts = (key, items) => `<div class="fpr-mm-option-grid">
      ${items.map(([val, icon, label, sub]) => `
        <div class="fpr-mm-option-card${p[key] === val ? ' selected' : ''}" data-select="${key}" data-value="${val}">
          <span class="fpr-mm-option-icon">${icon}</span>
          <span class="fpr-mm-option-label">${label}</span>
          ${sub ? `<span class="fpr-mm-option-sub">${sub}</span>` : ''}
        </div>`).join('')}
    </div>`;

    return `${renderStepIndicator()}
    <div class="fpr-mm-intake">
      <h2 class="fpr-mm-intake-title">Tell us about yourself</h2>
      <p class="fpr-mm-intake-sub">Your answers shape every dimension of the compatibility score.</p>

      <div class="fpr-mm-field">
        <label class="fpr-mm-label">Experience Level</label>
        ${opts('experience_level', [
          ['never_shot', icon('target'), 'Never Shot', 'First time buyer'],
          ['beginner',   icon('target'), 'Beginner',   'Shot a few times'],
          ['intermediate', icon('trophy'), 'Intermediate', 'Regular range time'],
          ['experienced', icon('star'), 'Experienced', '3+ years active'],
          ['expert',     icon('medal'), 'Expert',     'Competition / professional'],
        ])}
      </div>

      <div class="fpr-mm-field" style="margin-top:16px">
        <label class="fpr-mm-label">Primary Intent</label>
        ${opts('primary_intent', [
          ['home_defense', icon('home'), 'Home Defense',  'Bedside or safe'],
          ['ccw',          icon('user'), 'CCW / Carry',  'Everyday carry'],
          ['hunting',      icon('target'), 'Hunting',       'Field use'],
          ['competition',  icon('flag'), 'Competition',  'USPSA / IDPA / 3-Gun'],
          ['collection',   icon('box'), 'Collection',  'Historical / investment'],
          ['all_purpose',  icon('infinity'), 'All-Purpose',   'Versatile use'],
        ])}
      </div>

      <div class="fpr-mm-intake-nav">
        <span></span>
        <button class="fpr-mm-btn fpr-mm-btn-primary" data-action="step2">Continue →</button>
      </div>
    </div>`;
  }

  function renderIntakeStep2() {
    const p = _profile;
    const opts = (key, items) => `<div class="fpr-mm-option-grid">
      ${items.map(([val, icon, label, sub]) => `
        <div class="fpr-mm-option-card${p[key] === val ? ' selected' : ''}" data-select="${key}" data-value="${val}">
          <span class="fpr-mm-option-icon">${icon}</span>
          <span class="fpr-mm-option-label">${label}</span>
          ${sub ? `<span class="fpr-mm-option-sub">${sub}</span>` : ''}
        </div>`).join('')}
    </div>`;

    return `${renderStepIndicator()}
    <div class="fpr-mm-intake">
      <h2 class="fpr-mm-intake-title">Environment &amp; preferences</h2>
      <p class="fpr-mm-intake-sub">These factors influence use-case scoring and fit warnings.</p>

      <div class="fpr-mm-field">
        <label class="fpr-mm-label">Living Environment</label>
        ${opts('living_environment', [
          ['apartment', icon('building'), 'Apartment',  'Urban / close quarters'],
          ['suburban',  icon('home'), 'Suburban',   'Single-family home'],
          ['rural',     icon('tree'), 'Rural',      'Property / acreage'],
        ])}
      </div>

      <div class="fpr-mm-field" style="margin-top:16px">
        <label class="fpr-mm-label">Risk Tolerance / Priority</label>
        ${opts('risk_tolerance', [
          ['conservative',  icon('shield'), 'Conservative',   'Simplicity & reliability above all'],
          ['moderate',      icon('target'), 'Moderate',       'Balance of features & ease'],
          ['performance',   icon('bolt'), 'Performance',    'Maximum capability, willing to train'],
        ])}
      </div>

      <div class="fpr-mm-field" style="margin-top:16px">
        <label class="fpr-mm-label">Dominant Hand</label>
        ${opts('dominant_hand', [
          ['right',         icon('hand'), 'Right Hand',    ''],
          ['left',          icon('hand'), 'Left Hand',     ''],
          ['ambidextrous',  icon('handshake'), 'Ambidextrous',  ''],
        ])}
      </div>

      <div class="fpr-mm-field" style="margin-top:16px">
        <label class="fpr-mm-label">Self-Assessed Hand Size <span>(used if no photo uploaded)</span></label>
        ${opts('hand_size', [
          ['XS', icon('hand'), 'XS', 'Very small'],
          ['S',  icon('hand'), 'S',  'Small'],
          ['M',  icon('hand'), 'M',  'Medium / Average'],
          ['L',  icon('hand'), 'L',  'Large'],
          ['XL', icon('hand'), 'XL', 'Extra large'],
        ])}
      </div>

      <div class="fpr-mm-field" style="margin-top:12px">
        <label class="fpr-mm-label">Any grip limitations or considerations? <span>(optional)</span></label>
        <textarea class="fpr-mm-textarea" id="mm-physical-notes" placeholder="E.g., arthritis, short fingers, previous injury...">${p.physical_notes || ''}</textarea>
      </div>

      <div class="fpr-mm-intake-nav">
        <button class="fpr-mm-btn fpr-mm-btn-secondary" data-action="step1">← Back</button>
        <button class="fpr-mm-btn fpr-mm-btn-primary" data-action="step3">Continue →</button>
      </div>
    </div>`;
  }

  function renderIntakeStep3() {
    const hasFile = !!_handFile;
    const hasPriorAnalysis = !!_handAnalysis;

    return `${renderStepIndicator()}
    <div class="fpr-mm-intake">
      <h2 class="fpr-mm-intake-title">Optional: Hand Biometric Scan</h2>
      <p class="fpr-mm-intake-sub">
        A single photo dramatically improves grip fit and trigger reach scoring.
        No photo? We'll estimate from your hand size selection.
      </p>

      ${hasPriorAnalysis ? `
        <div style="background:#ECFDF5;border:1px solid rgba(5,150,105,.3);border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:#065F46">
          ${icon('check')} <strong>Previous scan on file:</strong> Hand size ${_handAnalysis.estimated_hand_size},
          grip width ~${_handAnalysis.estimated_grip_width_mm}mm — will be used automatically.
          <button class="fpr-mm-btn-outline" style="margin-top:8px;display:block" data-action="clear-analysis">Use New Photo Instead</button>
        </div>` : `
        <label class="fpr-mm-hand-upload" for="mm-hand-file">
          ${hasFile
            ? `<span class="fpr-mm-hand-upload-icon">${icon('check')}</span><div class="fpr-mm-hand-upload-title">Photo Ready</div><div class="fpr-mm-hand-upload-sub">${_handFile.name}</div>`
            : `<span class="fpr-mm-hand-upload-icon">${icon('camera')}</span><div class="fpr-mm-hand-upload-title">Upload Hand Photo</div><div class="fpr-mm-hand-upload-sub">JPEG, PNG, or WebP · Max 10MB</div>`}
        </label>
        <input type="file" id="mm-hand-file" accept="image/jpeg,image/png,image/webp" style="display:none" data-action="file-select">

        <div class="fpr-mm-hand-instructions">
          <strong>${icon('clipboard')} Best results:</strong>
          <ol>
            <li>Flatten your dominant hand against a neutral background, palm facing camera</li>
            <li>Spread fingers slightly — natural position, not strained</li>
            <li>Place a credit card beside your hand for automatic scale reference</li>
            <li>Shoot in good lighting with no blur</li>
          </ol>
        </div>

        <div class="fpr-mm-privacy-note">
          ${icon('lock')} Your photo is analyzed by AI and <strong>immediately deleted</strong> — never stored.
          Only the numerical measurements are saved.
        </div>`}

      <div class="fpr-mm-intake-nav" style="margin-top:24px">
        <button class="fpr-mm-btn fpr-mm-btn-secondary" data-action="step2">← Back</button>
        <button class="fpr-mm-btn fpr-mm-btn-primary" data-action="run-recommendation" id="mm-match-btn">
          Find My Match →
        </button>
      </div>
    </div>`;
  }

  function renderAnalyzing() {
    return `<div class="fpr-mm-analyzing">
      <div class="fpr-mm-analyzing-orb">
        <div class="fpr-mm-analyzing-inner">${icon('target')}</div>
      </div>
      <h2 class="fpr-mm-analyzing-title">Analyzing Your Profile</h2>
      <ul class="fpr-mm-analyzing-steps" id="mm-analyzing-steps">
        <li class="fpr-mm-analyzing-step done">Profile data processed</li>
        <li class="fpr-mm-analyzing-step${_handFile ? ' active' : ' done'}" id="step-hand">
          ${_handFile ? 'Analyzing hand biometrics' : 'Hand size estimated from profile'}
        </li>
        <li class="fpr-mm-analyzing-step active" id="step-score">Scoring 18-firearm database</li>
        <li class="fpr-mm-analyzing-step" id="step-ai">Generating personalized explanation</li>
      </ul>
    </div>`;
  }

  function renderRecommendation() {
    const rec = _recommendation || DEMO.recommendation;
    const gun = rec.gun;
    const scores = rec.scores;
    const narrative = rec.narrative || {};
    const tier = rec.match_tier || matchTierFromScore(rec.overall_compatibility);
    const warnings = rec.warnings || [];
    const isPoorMatch = tier === 'poor';

    const fitZones = [
      { label: 'Grip Fit',       score: scores.grip_fit       || 0 },
      { label: 'Trigger Reach',  score: scores.trigger_reach  || 0 },
      { label: 'Bore Axis',      score: scores.bore_axis      || 0 },
      { label: 'Recoil Mgmt',    score: scores.recoil         || 0 },
      { label: 'Use-Case',       score: scores.use_case       || 0 },
      { label: 'Experience',     score: scores.experience_match || scores.experience || 0 },
    ];

    const alts = rec.alternatives || [];

    const bodyParagraphs = typeof narrative.body === 'string'
      ? narrative.body.split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('')
      : '<p>' + (narrative.body || '') + '</p>';

    return `<div class="fpr-mm-rec-page">

      <div class="fpr-mm-match-banner ${tierClass(tier)}">
        <div class="fpr-mm-match-score ${tierClass(tier)}">${rec.overall_compatibility}</div>
        <div class="fpr-mm-match-meta">
          <strong>${gun.make} ${gun.model}</strong>
          <span>${gun.caliber} · ${gun.category?.replace(/-/g,' ')} · ${gun.type?.replace(/-/g,' ')}</span>
        </div>
        <span class="fpr-mm-match-tier-label" style="color:${scoreColor(rec.overall_compatibility)}">${tier.toUpperCase()} MATCH</span>
      </div>

      ${isPoorMatch ? `
        <div class="fpr-mm-warning-panel poor" style="margin-bottom:16px">
          <div class="fpr-mm-warning-header">${icon('alert')} Poor Compatibility Match</div>
          <p style="font-size:12px;color:#6B7684;margin:0 0 8px">
            Based on your profile, this firearm has significant fit concerns.
            Review our alternatives below for better-matched options.
          </p>
          ${warnings.length ? `<ul class="fpr-mm-warning-list">${warnings.map(w => `<li class="fpr-mm-warning-item">${w}</li>`).join('')}</ul>` : ''}
      </div>` : warnings.length ? `
        <div class="fpr-mm-warning-panel" style="margin-bottom:16px">
          <div class="fpr-mm-warning-header">${icon('alert')} Fit Considerations</div>
          <ul class="fpr-mm-warning-list">${warnings.map(w => `<li class="fpr-mm-warning-item">${w}</li>`).join('')}</ul>
        </div>` : ''}

      <div class="fpr-mm-rec-grid">
        <div class="fpr-mm-rec-left">

          <div class="fpr-mm-heatmap-panel">
            <h3>Compatibility Heatmap</h3>
            <div class="fpr-mm-canvas-wrap">
              <div>
                <canvas class="fpr-mm-canvas" id="mm-radar" width="200" height="200"></canvas>
                <div class="fpr-mm-canvas-label">6-Dimension Radar</div>
              </div>
              <div>
                <canvas class="fpr-mm-canvas" id="mm-gun-diagram" width="290" height="185"></canvas>
                <div class="fpr-mm-canvas-label">Fitment Profile</div>
              </div>
            </div>
            <div class="fpr-mm-fit-zones">
              ${fitZones.map(z => `
                <div class="fpr-mm-fit-zone-row">
                  <span class="fpr-mm-fit-zone-label">${z.label}</span>
                  <div class="fpr-mm-fit-track">
                    <div class="fpr-mm-fit-fill" style="width:${z.score}%;background:${scoreColor(z.score)}"></div>
                  </div>
                  <span class="fpr-mm-fit-pct" style="color:${scoreColor(z.score)}">${z.score}</span>
                </div>`).join('')}
            </div>
          </div>

          <div class="fpr-mm-why-panel">
            <h3>Why This Gun</h3>
            ${narrative.headline ? `<div class="fpr-mm-why-headline">${narrative.headline}</div>` : ''}
            <div class="fpr-mm-why-body">${bodyParagraphs}</div>
            ${narrative.fit_highlights?.length ? `
              <div class="fpr-mm-highlights">
                ${narrative.fit_highlights.map(h => `<div class="fpr-mm-highlight">${h}</div>`).join('')}
              </div>` : ''}
            ${narrative.dealer_cta ? `<p style="font-size:12.5px;color:#6B7684;font-style:italic">${narrative.dealer_cta}</p>` : ''}
          </div>

        </div>
        <div class="fpr-mm-rec-right">

          <div class="fpr-mm-specs-panel">
            <h3>Firearm Specs</h3>
            <div class="fpr-mm-specs-grid">
              ${gun.caliber ? `<div class="fpr-mm-spec-item"><div class="fpr-mm-spec-label">Caliber</div><div class="fpr-mm-spec-value">${gun.caliber}</div></div>` : ''}
              ${gun.magazine_capacity ? `<div class="fpr-mm-spec-item"><div class="fpr-mm-spec-label">Capacity</div><div class="fpr-mm-spec-value">${gun.magazine_capacity}+1</div></div>` : ''}
              ${gun.weight_oz_unloaded ? `<div class="fpr-mm-spec-item"><div class="fpr-mm-spec-label">Weight (unloaded)</div><div class="fpr-mm-spec-value">${gun.weight_oz_unloaded} oz</div></div>` : ''}
              ${gun.overall_length_in ? `<div class="fpr-mm-spec-item"><div class="fpr-mm-spec-label">Overall Length</div><div class="fpr-mm-spec-value">${gun.overall_length_in}"</div></div>` : ''}
              ${gun.barrel_length_in ? `<div class="fpr-mm-spec-item"><div class="fpr-mm-spec-label">Barrel</div><div class="fpr-mm-spec-value">${gun.barrel_length_in}"</div></div>` : ''}
              ${gun.grip_width_mm ? `<div class="fpr-mm-spec-item"><div class="fpr-mm-spec-label">Grip Width</div><div class="fpr-mm-spec-value">${gun.grip_width_mm}mm</div></div>` : ''}
              ${gun.trigger_reach_mm ? `<div class="fpr-mm-spec-item"><div class="fpr-mm-spec-label">Trigger Reach</div><div class="fpr-mm-spec-value">${gun.trigger_reach_mm}mm</div></div>` : ''}
              ${gun.trigger_pull_lbs ? `<div class="fpr-mm-spec-item"><div class="fpr-mm-spec-label">Trigger Pull</div><div class="fpr-mm-spec-value">${gun.trigger_pull_lbs} lbs</div></div>` : ''}
            </div>
          </div>

          <!-- THE ONLY PLACE PRICING IS ACCESSIBLE -->
          <div class="fpr-mm-cta-panel">
            <h3>Ready to Learn More?</h3>
            <p>Your match is scored purely on fit and use-case. When you're ready, your FPR dealer can show you availability and member pricing.</p>
            <button class="fpr-mm-cta-price-btn" data-action="see-pricing" data-gun-id="${gun.id}" data-gun-name="${gun.make} ${gun.model}">
              See Pricing &amp; Availability →
            </button>
            <div class="fpr-mm-cta-secondary">No obligation — just information</div>
          </div>

          ${alts.length ? `
            <div class="fpr-mm-alts-panel">
              <h3>Also Consider</h3>
              <div class="fpr-mm-alt-list">
                ${alts.map(a => `
                  <div class="fpr-mm-alt-card">
                    <div class="fpr-mm-alt-rank">#${a.rank}</div>
                    <div>
                      <div class="fpr-mm-alt-name">${a.gun.make} ${a.gun.model}</div>
                      <div class="fpr-mm-alt-meta">${a.gun.caliber} · ${a.gun.category?.replace(/-/g,' ')}</div>
                    </div>
                    <div class="fpr-mm-alt-score" style="color:${scoreColor(a.overall_compatibility)}">${a.overall_compatibility}</div>
                  </div>`).join('')}
              </div>
            </div>` : ''}

          <div class="fpr-mm-feedback">
            <span class="fpr-mm-feedback-label">Was this match helpful?</span>
            <button class="fpr-mm-feedback-btn" data-action="feedback" data-value="yes">${icon('thumbsUp')} Yes</button>
            <button class="fpr-mm-feedback-btn" data-action="feedback" data-value="no">${icon('thumbsDown')} Improve</button>
            <button class="fpr-mm-btn-outline" data-action="restart" style="margin-left:8px">Try Again</button>
          </div>

        </div>
      </div>

      <div style="text-align:center;font-size:11.5px;color:#9AA3AF;padding:8px 0 4px">
        For informational purposes only. Always handle any firearm at your FPR dealer before purchasing.
        Compatibility scores are estimates based on self-reported data — in-person fit verification is essential.
      </div>

      <div style="display:flex;justify-content:flex-end;padding:4px 0 8px">
        <button onclick="FPRShare.open('Share Your Match')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share Your Match
        </button>
      </div>
    </div>`;
  }

  function renderHistory() {
    const items = _history;
    if (!items.length) {
      return `<div class="fpr-mm-empty">
        <span class="fpr-mm-empty-icon">${icon('book')}</span>
        <div style="font-size:15px;font-weight:700;color:#495057">No previous matches</div>
        <div style="font-size:13px;margin-top:6px">Complete the intake to generate your first match.</div>
        <button class="fpr-mm-btn fpr-mm-btn-primary" data-action="start" style="margin-top:16px">Find My Match</button>
      </div>`;
    }
    return `<div class="fpr-mm-history-list">
      <h3 style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6B7684;margin:0 0 14px">Previous Matches</h3>
      ${items.map(r => `
        <div class="fpr-mm-history-card ${r.match_tier || 'good'}" data-action="view-rec" data-id="${r.id}">
          <div class="fpr-mm-history-score" style="color:${scoreColor(r.overall_compatibility)}">${r.overall_compatibility}</div>
          <div>
            <div class="fpr-mm-history-name">${r.gun_make} ${r.gun_model}</div>
            <div class="fpr-mm-history-date">${new Date(r.generated_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
          </div>
          <span style="margin-left:auto;font-size:12px;font-weight:700;color:${scoreColor(r.overall_compatibility)};text-transform:uppercase">${r.match_tier}</span>
        </div>`).join('')}
      <button class="fpr-mm-btn fpr-mm-btn-primary" data-action="start" style="width:100%;margin-top:8px">New Match →</button>
    </div>`;
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  function render() {
    const navItems = [
      { id: 'intake',          label: 'New Match', action: 'start' },
      { id: 'recommendation',  label: 'My Match',  action: 'show-rec' },
      { id: 'history',         label: 'History',   action: 'show-history' },
    ];

    const content = {
      welcome:        renderWelcome,
      intake:         () => _step === 1 ? renderIntakeStep1() : _step === 2 ? renderIntakeStep2() : renderIntakeStep3(),
      analyzing:      renderAnalyzing,
      recommendation: renderRecommendation,
      history:        renderHistory,
    }[_view] || renderWelcome;

    _el.innerHTML = `<div class="fpr-mm">
      <div class="fpr-mm-topbar">
        <div class="fpr-mm-brand">FPRMembers</div>
        <span class="fpr-mm-topbar-title">VANGUARD GunFit</span>
        ${_view !== 'welcome' && _view !== 'analyzing' ? `
          <div style="margin-left:auto;display:flex;gap:8px">
            ${navItems.slice(1).map(n => `
              <button class="fpr-mm-btn-outline" style="font-size:11px;padding:5px 10px" data-action="${n.action}">${n.label}</button>`).join('')}
          </div>` : `<span class="fpr-mm-topbar-badge">Biometric Fitment Engine</span>`}
      </div>
      <div class="fpr-mm-body" id="mm-body">${content()}</div>
    </div>`;

    attachHandlers();

    // Draw canvases after DOM insert
    if (_view === 'recommendation') {
      requestAnimationFrame(() => {
        const rec = _recommendation || DEMO.recommendation;
        const radar = document.getElementById('mm-radar');
        const diag  = document.getElementById('mm-gun-diagram');
        if (radar) drawRadarChart(radar, rec.scores);
        if (diag)  drawGunDiagram(diag, rec.scores, rec.gun);
      });
    }
  }

  // ─── EVENT HANDLING ──────────────────────────────────────────────────────────
  function attachHandlers() {
    const body = _el.querySelector('#mm-body');
    if (!body) return;

    body.addEventListener('click', handleClick);
    body.addEventListener('change', handleChange);

    const fileInput = body.querySelector('#mm-hand-file');
    if (fileInput) fileInput.addEventListener('change', e => {
      _handFile = e.target.files[0] || null;
      render();
    });
  }

  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    // Option card selection
    const card = e.target.closest('[data-select]');
    if (card && !btn.dataset.action) return;

    switch (action) {
      case 'start':            _view = 'intake'; _step = 1; render(); break;
      case 'step2':            saveStep1(); _step = 2; render(); break;
      case 'step3':            saveStep2(); _step = 3; render(); break;
      case 'step1':            _step = 1; render(); break;
      case 'clear-analysis':   _handAnalysis = null; render(); break;
      case 'run-recommendation': handleRunRecommendation(); break;
      case 'show-rec':         if (_recommendation) { _view = 'recommendation'; render(); } break;
      case 'show-history':     handleShowHistory(); break;
      case 'restart':          _view = 'welcome'; _recommendation = null; _handFile = null; render(); break;
      case 'see-pricing':      handleSeePricing(btn); break;
      case 'feedback':         handleFeedback(btn.dataset.value); break;
      case 'file-select':      break;
    }
  }

  function handleChange(e) {
    const card = e.target.closest('[data-select]');
    if (!card) return;
    const key = card.dataset.select, val = card.dataset.value;
    _profile[key] = val;
    // Re-render option cards in-place for selection state
    render();
  }

  // Option card clicks (not button clicks)
  document.addEventListener('click', e => {
    if (!_el) return;
    const card = e.target.closest('.fpr-mm-option-card');
    if (!card || !_el.contains(card)) return;
    _profile[card.dataset.select] = card.dataset.value;
    render();
  });

  function saveStep1() {
    // Values already saved via option card clicks
  }

  function saveStep2() {
    const notes = document.getElementById('mm-physical-notes');
    if (notes) _profile.physical_notes = notes.value;
  }

  async function handleRunRecommendation() {
    _view = 'analyzing';
    render();

    if (_demoMode) {
      // Simulate analysis steps
      await delay(800);
      markStep('step-hand', 'done');
      await delay(700);
      markStep('step-score', 'done');
      markStep('step-ai', 'active');
      await delay(900);
      _recommendation = { ...DEMO.recommendation, scores: { ...DEMO.recommendation.scores } };
      _handAnalysis   = DEMO.handAnalysis;
      _view = 'recommendation';
      awardTicket('match_generated', {});
      render();
      return;
    }

    try {
      // Real API flow
      // 1. Save profile
      await apiPost('/api/matchmaker/profile', { member_id: _memberId, ..._profile });

      // 2. Analyze hand photo if uploaded
      if (_handFile && !_handAnalysis) {
        markStep('step-hand', 'active');
        const formData = new FormData();
        formData.append('hand_photo', _handFile);
        const res = await fetch(`${_api}/api/matchmaker/member/${_memberId}/analyze-hand`, {
          method: 'POST', body: formData,
        });
        if (res.ok) { const d = await res.json(); _handAnalysis = d.analysis; }
        markStep('step-hand', 'done');
      }

      // 3. Generate recommendation
      markStep('step-score', 'active');
      await delay(300);
      markStep('step-score', 'done');
      markStep('step-ai', 'active');

      const recData = await apiPost(`/api/matchmaker/member/${_memberId}/recommend`, {});
      _recommendation = recData.recommendation;
      _view = 'recommendation';
      awardTicket('match_generated', {});
      render();
    } catch (err) {
      _el.querySelector('#mm-body').innerHTML = `<div class="fpr-mm-empty">
        <span class="fpr-mm-empty-icon">${icon('alert')}</span>
        <div style="font-size:15px;font-weight:700">Match failed</div>
        <div style="font-size:13px;color:#6B7684;margin-top:6px">${err.message}</div>
        <button class="fpr-mm-btn fpr-mm-btn-secondary" data-action="step1" style="margin-top:16px">Try Again</button>
      </div>`;
    }
  }

  async function handleShowHistory() {
    _view = 'history';
    if (!_demoMode) {
      try {
        const d = await apiGet(`/api/matchmaker/member/${_memberId}/recommendations`);
        _history = d.recommendations || [];
      } catch { _history = []; }
    }
    render();
  }

  function handleSeePricing(btn) {
    const gunName = btn.dataset.gunName || 'this firearm';
    if (!_demoMode) {
      apiPost(`/api/matchmaker/member/${_memberId}/behavior`, {
        event_type: 'add_to_cart', gun_id: btn.dataset.gunId,
        recommendation_id: _recommendation?.id,
      }).catch(() => {});
    }
    // In production, navigate to the dealer pricing/cart page.
    // In demo mode, show an informational alert.
    alert(`Pricing for the ${gunName} is available through your FPR dealer.\n\nThis would navigate to the member pricing page where MAP-compliant pricing is displayed.`);
  }

  function handleFeedback(value) {
    if (!_demoMode && _recommendation?.id) {
      apiPost(`/api/matchmaker/recommendation/${_recommendation.id}/feedback`, {
        member_id: _memberId, helpful: value === 'yes',
      }).catch(() => {});
    }
    const fb = _el.querySelector('.fpr-mm-feedback');
    if (fb) fb.innerHTML = `<span style="color:#059669;font-size:13px;font-weight:700">${icon('check')} Thanks for the feedback</span>`;
  }

  function markStep(id, state) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'fpr-mm-analyzing-step ' + state;
    if (state === 'done') {
      el.textContent = el.textContent.replace('⟳ ', '');
    }
  }

  function matchTierFromScore(s) {
    if (s >= 85) return 'excellent';
    if (s >= 70) return 'good';
    if (s >= 50) return 'fair';
    return 'poor';
  }

  // ─── API HELPERS ────────────────────────────────────────────────────────────
  async function apiPost(path, body) {
    const res = await fetch(apiUrl(path), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  async function apiGet(path) {
    const res = await fetch(apiUrl(path));
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  function awardTicket(action, ctx) {
    if (typeof window.fprAwardTicket === 'function') {
      window.fprAwardTicket(action, ctx || {});
    }
  }

  function normalizeApiUrl(value) {
    const api = (value || '').trim();
    if (!api || api === 'YOUR_API_URL' || api === '#') return '';
    return api.replace(/\/$/, '');
  }

  function apiUrl(path) {
    if (!_api) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (_api.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${_api}${cleanPath.slice(4)}`;
    }
    return `${_api}${cleanPath}`;
  }

  // ─── LOAD DATA ───────────────────────────────────────────────────────────────
  async function loadData() {
    if (_demoMode) return;
    try {
      const [profData, histData] = await Promise.all([
        apiGet(`/api/matchmaker/member/${_memberId}/profile`).catch(() => null),
        apiGet(`/api/matchmaker/member/${_memberId}/recommendations`).catch(() => ({ recommendations: [] })),
      ]);
      if (profData?.profile) _profile = { ..._profile, ...profData.profile };
      _history = histData?.recommendations || [];
    } catch { /* fall through to demo */ }
  }

  // ─── PUBLIC INIT ─────────────────────────────────────────────────────────────
  async function init(el, options = {}) {
    if (!el) return;
    if (el.dataset.fprMmInitialized === 'true' && !options.force) return;

    _el         = el;
    _api        = normalizeApiUrl(el.dataset.apiUrl);
    _memberId   = el.dataset.memberId   || 'preview-member';
    _memberName = el.dataset.memberName || 'Demo Member';
    _demoMode   = !_api;

    try {
      render();
      el.dataset.fprMmInitialized = 'true';
    } catch (err) {
      console.error('[FPRMatchmaker] Render failed:', err);
      el.innerHTML = `<div style="min-height:240px;padding:24px;border:1px solid #e5e7eb;background:#fff;color:#111827;font-family:Inter,system-ui,sans-serif">
        <strong>FPR Matchmaker could not render.</strong>
        <div style="margin-top:8px;color:#6b7280;font-size:13px">${err.message || 'Unknown script error'}</div>
      </div>`;
      throw err;
    }

    if (!_demoMode) {
      loadData()
        .then(render)
        .catch(err => console.warn('[FPRMatchmaker] Initial data load skipped:', err));
    }
  }

  return { init };
})();

window.FPRMatchmaker = FPRMatchmaker;

function initFPRMatchmakerMounts(options = {}) {
  const mounts = document.querySelectorAll(options.selector || '.fpr-mm-mount');
  if (!mounts.length) {
    console.warn('[FPRMatchmaker] No .fpr-mm-mount element found yet.');
    return false;
  }
  mounts.forEach(function(el){ window.__fprResolveMount(el).then(function(){ FPRMatchmaker.init(el, options); }); });
  return true;
}

function bootFPRMatchmaker() {
  if (initFPRMatchmakerMounts()) return;

  let tries = 0;
  const retry = window.setInterval(() => {
    tries += 1;
    if (initFPRMatchmakerMounts() || tries >= 120) {
      window.clearInterval(retry);
    }
  }, 250);

  if ('MutationObserver' in window) {
    const observer = new MutationObserver(() => {
      if (initFPRMatchmakerMounts()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 30000);
  }
}

window.initFPRMatchmakerMounts = initFPRMatchmakerMounts;
window.bootFPRMatchmaker = bootFPRMatchmaker;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootFPRMatchmaker);
} else {
  bootFPRMatchmaker();
}
