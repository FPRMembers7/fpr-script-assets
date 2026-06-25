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
 * FPRMembers.com — Build 8: Shield-Radius CCW Travel Compliance
 * File: fpr-shield.js
 *
 * Requires: Leaflet.js (loaded via CDN in index.html)
 *
 * Usage:
 *   <div class="fpr-shield-mount"
 *        data-api-url="https://your-api.com"
 *        data-member-id="MEMBER_ID"
 *        data-member-name="MEMBER_NAME">
 *   </div>
 */

(function () {
  'use strict';

  const DISCLAIMER = 'For informational purposes only. Not legal advice. Laws change frequently. Always verify current laws before traveling. Consult a qualified firearms attorney for guidance specific to your situation.';

  const COMPLY_COLORS = { green: '#15803D', yellow: '#D97706', orange: '#EA580C', red: '#B91C1C' };
  const COMPLY_FILLS  = { green: 'rgba(21,128,61,.15)', yellow: 'rgba(217,119,6,.15)', orange: 'rgba(234,88,12,.15)', red: 'rgba(185,28,28,.18)' };

  // -------------------------------------------------------------------------
  // SVG Icons
  // -------------------------------------------------------------------------
  const IC = {
    shield:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    route:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`,
    list:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    setup:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    print:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    nav:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
    warning:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    x:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    map:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
    share:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    chevron:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
    location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    gun:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h11l3 3h2v4h-3l-1.5-2H12l-1 5H7l1-5H4z"/><path d="M15 9V6h5v3"/></svg>`,
  };

  function ic(name) { return `<span style="display:inline-flex;align-items:center;width:1em;height:1em">${IC[name] || ''}</span>`; }
  function iconSpan(name, size = 16) {
    return `<span class="fpr-shield__svg-icon" style="width:${size}px;height:${size}px">${IC[name] || ''}</span>`;
  }

  // -------------------------------------------------------------------------
  // DEMO DATA — realistic complete trip analysis for standalone preview
  // -------------------------------------------------------------------------
  const DEMO_TRIP = {
    tripId: 'demo-trip-001',
    origin:      { address: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, state: 'AZ' },
    destination: { address: 'Washington, DC', lat: 38.9072, lng: -77.0369, state: 'DC' },
    distanceMiles: 2074.3,
    durationHours: 29.4,
    statesCrossed: ['AZ','NM','TX','OK','AR','TN','VA','MD','DC'],
    polyline: null, // Will be drawn as a simplified line in demo
    corridors: [
      {
        id: 'c1', stateCode: 'AZ', stateName: 'Arizona', entryOrder: 1,
        entryLat: 33.4484, entryLng: -112.0740, entryMile: 0,
        ccwStatus: 'constitutional_carry', magStatus: 'compliant', overallStatus: 'green',
        coachingNarrative: 'Arizona is a constitutional carry state — no permit required for any legal US firearm owner. No magazine capacity restrictions. No AWB. You are fully compliant from the moment you depart Phoenix. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: ['Constitutional carry - no permit required.', 'Standard capacity magazines: no restriction.', 'No special actions required at departure.'],
        alert100mi: 'Approaching New Mexico border in ~100 miles. NM is a constitutional carry state — carry continues normally.',
        alert10mi: 'Approaching New Mexico — constitutional carry state. No action required.',
        alertCrossing: 'Entering New Mexico. Constitutional carry state. No action required.',
        fopaRequired: false, magNonCompliant: false,
      },
      {
        id: 'c2', stateCode: 'NM', stateName: 'New Mexico', entryOrder: 2,
        entryLat: 31.7900, entryLng: -106.4424, entryMile: 280,
        ccwStatus: 'constitutional_carry', magStatus: 'compliant', overallStatus: 'green',
        coachingNarrative: 'New Mexico adopted constitutional carry in 2024. No magazine capacity restrictions. Your carry continues uninterrupted. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: ['Constitutional carry since 2024.', 'No magazine restrictions.'],
        alert100mi: '', alert10mi: '', alertCrossing: 'Entering New Mexico — constitutional carry. No action required.',
        fopaRequired: false, magNonCompliant: false,
      },
      {
        id: 'c3', stateCode: 'TX', stateName: 'Texas', entryOrder: 3,
        entryLat: 31.9686, entryLng: -99.9018, entryMile: 620,
        ccwStatus: 'constitutional_carry', magStatus: 'compliant', overallStatus: 'green',
        coachingNarrative: 'Texas adopted constitutional carry in 2021. No magazine restrictions. No AWB. If stopped by law enforcement and you have a License to Carry (LTC), you must inform the officer. If you do not have an LTC, no duty to inform. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: ['Constitutional carry since 2021.', 'If you hold a Texas LTC: inform officer if stopped and you are carrying.', 'No magazine or AWB restrictions.'],
        alert100mi: '', alert10mi: '', alertCrossing: 'Entering Texas — constitutional carry. No action required.',
        fopaRequired: false, magNonCompliant: false,
      },
      {
        id: 'c4', stateCode: 'OK', stateName: 'Oklahoma', entryOrder: 4,
        entryLat: 34.5071, entryLng: -97.5200, entryMile: 910,
        ccwStatus: 'constitutional_carry', magStatus: 'compliant', overallStatus: 'green',
        coachingNarrative: 'Oklahoma constitutional carry since 2019. No magazine or AWB restrictions. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: ['Constitutional carry since 2019.', 'No restrictions.'],
        alert100mi: '', alert10mi: '', alertCrossing: 'Entering Oklahoma — constitutional carry.',
        fopaRequired: false, magNonCompliant: false,
      },
      {
        id: 'c5', stateCode: 'AR', stateName: 'Arkansas', entryOrder: 5,
        entryLat: 35.2010, entryLng: -91.8318, entryMile: 1120,
        ccwStatus: 'constitutional_carry', magStatus: 'compliant', overallStatus: 'green',
        coachingNarrative: 'Arkansas constitutional carry. No magazine or AWB restrictions. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: ['Constitutional carry.', 'No magazine restrictions.'],
        alert100mi: '', alert10mi: '', alertCrossing: 'Entering Arkansas — constitutional carry.',
        fopaRequired: false, magNonCompliant: false,
      },
      {
        id: 'c6', stateCode: 'TN', stateName: 'Tennessee', entryOrder: 6,
        entryLat: 35.5175, entryLng: -86.5804, entryMile: 1340,
        ccwStatus: 'constitutional_carry', magStatus: 'compliant', overallStatus: 'green',
        coachingNarrative: 'Tennessee constitutional carry since 2021. Must inform officer if asked and you are armed. No magazine or AWB restrictions. Nashville and other cities cannot enact stricter local laws due to state preemption. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: ['Constitutional carry since 2021.', 'Duty to inform if asked by law enforcement.', 'No magazine restrictions.'],
        alert100mi: '', alert10mi: '', alertCrossing: 'Entering Tennessee — constitutional carry. Inform officer if asked.',
        fopaRequired: false, magNonCompliant: false,
      },
      {
        id: 'c7', stateCode: 'VA', stateName: 'Virginia', entryOrder: 7,
        entryLat: 36.8529, entryLng: -75.9780, entryMile: 1680,
        ccwStatus: 'recognized', magStatus: 'compliant', overallStatus: 'yellow',
        coachingNarrative: 'Virginia is a shall-issue state that honors all valid US CCW permits. Your Arizona CCW (or any valid permit) is recognized here. Concealed carry required (no open carry with loaded handgun in vehicle without a permit). No magazine restrictions statewide. Some Northern Virginia localities restrict firearms in government buildings. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: ['Your CCW permit is recognized in Virginia.', 'No magazine capacity restrictions.', 'Some Northern Virginia localities (Arlington, Fairfax) restrict firearms in certain public buildings.'],
        alert100mi: 'Approaching Virginia — your CCW permit is recognized. Concealed carry permitted. No action required.',
        alert10mi: 'Virginia border ahead — your CCW permit recognized. No action required.',
        alertCrossing: 'Entering Virginia. Your CCW permit is recognized. Concealed carry normal.',
        fopaRequired: false, magNonCompliant: false,
      },
      {
        id: 'c8', stateCode: 'MD', stateName: 'Maryland', entryOrder: 8,
        entryLat: 39.0458, entryLng: -76.6413, entryMile: 1890,
        ccwStatus: 'not_recognized', magStatus: 'non_compliant', overallStatus: 'red',
        coachingNarrative: 'ALERT: Maryland does NOT recognize any out-of-state CCW permits. 10-round magazine limit — your standard-capacity 17-round Glock magazine EXCEEDS this limit. FOPA required for transport. Firearm must be unloaded in a locked container in your trunk. Maryland law enforcement is aggressive toward travelers. If carrying 17-round magazines, you must store them in a locked container as well — the magazine restriction applies even to FOPA travelers. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: [
          'FOPA Transport Required - Disarm NOW before crossing into Maryland.',
          'Unload your Glock 17 completely.',
          'Place unloaded firearm in a LOCKED hard-sided container.',
          'MAGAZINE ALERT: Maryland\'s 10-round limit applies to all firearms in the state. Secure your 17-round magazine in the locked container.',
          'Store the locked container in your trunk or locked cargo area — NOT in the glove box or console.',
          'Do NOT stop overnight in Maryland if FOPA is your only protection.',
          'Consider routing through Virginia (I-95 south of DC) to avoid Maryland entirely.',
        ],
        alert100mi: 'Sentinel Alert: Maryland border in ~100 miles. MD does NOT recognize your CCW permit and has a 10-round magazine limit. Your 17-round magazine exceeds the limit. Begin planning your compliance procedure.',
        alert10mi: 'ACTION REQUIRED - Maryland border in ~10 miles. DISARM NOW. Unload firearm, lock in hard-sided container in trunk. Secure 17-round magazine in locked container. Maryland enforces aggressively.',
        alertCrossing: 'ENTERING MARYLAND. Confirm your firearm is unloaded and locked in trunk. 10-round magazine limit in effect. FOPA transport applies. Do not stop except for fuel/emergency.',
        fopaRequired: true, magNonCompliant: true,
      },
      {
        id: 'c9', stateCode: 'DC', stateName: 'District of Columbia', entryOrder: 9,
        entryLat: 38.9072, entryLng: -77.0369, entryMile: 2074,
        ccwStatus: 'not_recognized', magStatus: 'non_compliant', overallStatus: 'red',
        coachingNarrative: 'ALERT: Washington DC does not recognize ANY out-of-state carry permits. Non-residents effectively cannot carry or possess loaded firearms in DC. 10-round magazine limit. FOPA applies for transit only. DC Metropolitan Police aggressively enforces against out-of-state visitors. If your destination is in DC, you will need to store your firearm at a licensed FFL or at your accommodations before entering. For informational purposes only. Laws change frequently. Always verify current laws before traveling. This is not legal advice. Consult a qualified firearms attorney for guidance specific to your situation.',
        requiredActions: [
          'FOPA required - DC does not recognize any out-of-state carry permits.',
          '10-round magazine limit - your 17-round magazine is non-compliant.',
          'Firearm must remain unloaded in locked container for entire DC transit/stay.',
          'If staying overnight in DC, arrange secure storage at a licensed FFL BEFORE arrival.',
          'Consider routing around DC entirely via I-495 Beltway (Maryland ring road) — note Maryland compliance still applies.',
          'Consult a DC-licensed firearms attorney before bringing a firearm into the District.',
        ],
        alert100mi: 'Washington DC ahead in ~100 miles. DC does not recognize your CCW and has a 10-round mag limit. Plan firearm storage at licensed FFL if staying overnight.',
        alert10mi: 'DC border in ~10 miles. Confirm firearm is unloaded, locked, and magazine compliant. No exceptions.',
        alertCrossing: 'ENTERING WASHINGTON DC. Firearm must be completely secured per FOPA. No carry permitted for non-residents. Contact local FFL if storing firearm.',
        fopaRequired: true, magNonCompliant: true,
      },
    ],
  };

  const DEMO_PROFILE = {
    member_id: 'demo-member', display_name: 'Demo Member', home_state: 'AZ',
    ccw_permits: [{ state: 'AZ', permit_type: 'resident' }],
  };

  const DEMO_FIREARM = {
    id: 'f1', make: 'Glock', model: '17 Gen5', caliber: '9mm',
    firearm_type: 'pistol', magazine_capacity: 17,
  };

  const FALLBACK_STATE_LAWS = {
    AZ: { name: 'Arizona', lat: 33.1911, lng: -111.5647, mile: 0, status: 'green', ccw: 'constitutional_carry', mag: 'compliant', note: 'Constitutional carry. No statewide magazine capacity restriction listed in this build.' },
    UT: { name: 'Utah', lat: 37.0965, lng: -113.5684, mile: 380, status: 'green', ccw: 'constitutional_carry', mag: 'compliant', note: 'Constitutional carry. No statewide magazine capacity restriction listed in this build. Inform law enforcement if asked.' },
    CO: { name: 'Colorado', lat: 39.5501, lng: -105.7821, mile: 685, status: 'yellow', ccw: 'recognized', mag: 'non_compliant', note: 'Permit recognition may apply, but Colorado has a 15-round magazine limit in this build. Verify route and current law before travel.' },
    WY: { name: 'Wyoming', lat: 42.7559, lng: -107.3025, mile: 975, status: 'green', ccw: 'constitutional_carry', mag: 'compliant', note: 'Constitutional carry. No statewide magazine capacity restriction listed in this build.' },
    SD: { name: 'South Dakota', lat: 44.0805, lng: -103.2310, mile: 1268, status: 'green', ccw: 'constitutional_carry', mag: 'compliant', note: 'Constitutional carry. No statewide magazine capacity restriction listed in this build.' },
  };

  function buildFallbackTrip(origin, dest, reason) {
    const isClientRoute = /san tan valley|arizona|az/i.test(origin) && /rapid city|south dakota|sd/i.test(dest);
    const stateCodes = isClientRoute ? ['AZ', 'UT', 'CO', 'WY', 'SD'] : ['AZ', 'UT', 'CO', 'WY', 'SD'];
    const corridors = stateCodes.map((code, idx) => {
      const law = FALLBACK_STATE_LAWS[code];
      const fopaRequired = law.status === 'red';
      const magNonCompliant = law.mag === 'non_compliant';
      const actions = [];
      if (fopaRequired) actions.push('FOPA Transport Required - unload and lock the firearm before entering this state.');
      else if (law.ccw === 'constitutional_carry') actions.push('Constitutional carry - no permit required to carry here.');
      else actions.push('Your listed permit may be recognized here. Verify before crossing.');
      if (magNonCompliant) actions.push('Magazine restriction warning - use compliant magazines or secure the firearm and magazine before entering.');
      actions.push('Verify current law before travel.');

      return {
        id: `fallback-${code}`,
        stateCode: code,
        stateName: law.name,
        entryOrder: idx + 1,
        entryLat: law.lat,
        entryLng: law.lng,
        entryMile: law.mile,
        ccwStatus: law.ccw,
        magStatus: law.mag,
        overallStatus: law.status,
        coachingNarrative: `${law.note} ${DISCLAIMER}`,
        requiredActions: actions,
        alert100mi: '',
        alert10mi: '',
        alertCrossing: `Entering ${law.name}. ${law.note}`,
        fopaRequired,
        magNonCompliant,
      };
    });

    return {
      tripId: `fallback-${Date.now()}`,
      origin: { address: origin, lat: 33.1911, lng: -111.5647, state: 'AZ' },
      destination: { address: dest, lat: 44.0805, lng: -103.2310, state: 'SD' },
      distanceMiles: 1268.6,
      durationHours: 23.0,
      statesCrossed: stateCodes,
      corridors,
      disclaimer: DISCLAIMER,
      fallbackReason: reason || 'Live API unavailable',
    };
  }

  const FOPA_RULES = [
    'Firearm must be UNLOADED.',
    'Firearm must be in a LOCKED HARD-SIDED CONTAINER.',
    'Container must NOT be accessible from the passenger compartment.',
    'Ammunition must be in a SEPARATE locked container or in the same locked firearm container.',
    'Possession must be legal in both origin and destination states.',
    'Transport must be reasonably direct — avoid unnecessary stops.',
    'Do NOT stop overnight in a state where possession would be illegal.',
    'Lodging in a restricted state for non-travel purposes may void FOPA protection.',
  ];

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  let state = {
    apiUrl: '', memberId: '', memberName: '',
    view: 'planner',    // setup | planner | result | alerts
    profile: DEMO_PROFILE,
    firearms: [DEMO_FIREARM],
    activeTrip: DEMO_TRIP,
    activeCorridor: null,
    map: null,
    mapLayers: {},
    routeLayer: null,
    markerLayers: [],
    originInput: '', destInput: '',
    stops: [],
    travelDate: '',
    isRoundTrip: false,
    analyzing: false,
    errorMessage: null,
    geoWatchId: null,
    leafletLoading: null,
    root: null,
  };

  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------
  async function api(path, opts = {}) {
    if (!state.apiUrl) return null;
    const cleanPath = String(path || '').replace(/^\/+/, '');
    const base = state.apiUrl.replace(/\/$/, '');
    const url = base.endsWith('/api') && cleanPath.startsWith('api/')
      ? `${base}/${cleanPath.slice(4)}`
      : `${base}/${cleanPath}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeout || 90000);
    try {
      const r = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
        ...opts,
        signal: controller.signal,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = new Error(data?.error || `Request failed (${r.status})`);
        err.status = r.status;
        err.data = data;
        if (opts.silent) return null;
        throw err;
      }
      return data;
    } catch (err) {
      if (opts.silent) return null;
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  // -------------------------------------------------------------------------
  // Init + Render
  // -------------------------------------------------------------------------
  function render() {
    const root = state.root;
    const prev = root.querySelector('.fpr-shield__shell');
    destroyMap();
    if (prev) prev.remove();
    root.appendChild(buildShell());
    initMap();
  }

  function hasUsableMemberId() {
    const id = String(state.memberId || '').trim();
    return !!id && !/(^MEMBER_ID_VAR$|_VAR$|{{|}}|undefined|null|demo-member|preview-member)/i.test(id);
  }

  function canUseLiveApi() {
    return !!state.apiUrl && hasUsableMemberId();
  }

  function buildShell() {
    const shell = el('div', 'fpr-shield__shell');
    shell.appendChild(buildTopbar());
    shell.appendChild(buildLeftPanel());
    shell.appendChild(buildMapPanel());
    return shell;
  }

  // ——— Topbar ———
  function buildTopbar() {
    const bar = el('div', 'fpr-shield__topbar');
    const trip = state.activeTrip;
    const statuses = trip ? countStatuses(trip.corridors) : {};

    bar.innerHTML = `
      <div class="fpr-shield__topbar-logo">FPRMembers.com</div>
      <div class="fpr-shield__topbar-divider"></div>
      <div class="fpr-shield__topbar-title">
        <span class="fpr-shield__shield-icon">${IC.shield}</span> Shield-Radius Travel Compliance
      </div>
      ${trip ? `
        <div class="fpr-shield__status-pills">
          ${statuses.green  ? `<div class="fpr-shield__status-pill --green">${IC.check} ${statuses.green} Clear</div>` : ''}
          ${statuses.yellow ? `<div class="fpr-shield__status-pill --yellow">${IC.warning} ${statuses.yellow} Caution</div>` : ''}
          ${statuses.orange ? `<div class="fpr-shield__status-pill --orange">${IC.warning} ${statuses.orange} Restricted</div>` : ''}
          ${statuses.red    ? `<div class="fpr-shield__status-pill --red">${IC.warning} ${statuses.red} FOPA Required</div>` : ''}
        </div>
      ` : ''}
    `;
    return bar;
  }

  function countStatuses(corridors) {
    const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
    (corridors || []).forEach(c => {
      const k = c.overallStatus || c.overall_status;
      if (counts[k] !== undefined) counts[k]++;
    });
    return counts;
  }

  // ——— Left Panel ———
  function buildLeftPanel() {
    const panel = el('div', 'fpr-shield__left');

    // Nav tabs
    const nav = el('div', 'fpr-shield__nav');
    const tabs = [
      { view: 'planner', label: 'Route', icon: 'route' },
      { view: 'alerts',  label: 'Compliance', icon: 'list' },
      { view: 'setup',   label: 'Profile', icon: 'setup' },
    ];
    tabs.forEach(t => {
      const btn = el('button', `fpr-shield__nav-tab${state.view === t.view ? ' --active' : ''}`);
      btn.innerHTML = `<span style="width:13px;height:13px;display:flex">${IC[t.icon]||''}</span>${t.label}`;
      btn.addEventListener('click', () => { state.view = t.view; render(); });
      nav.appendChild(btn);
    });
    panel.appendChild(nav);

    if (state.view === 'planner') panel.appendChild(buildPlannerView());
    else if (state.view === 'alerts') panel.appendChild(buildAlertsView());
    else if (state.view === 'setup') panel.appendChild(buildSetupView());

    // Sticky disclaimer
    const disc = el('div', 'fpr-shield__disclaimer fpr-shield__disclaimer--sticky');
    disc.textContent = DISCLAIMER;
    panel.appendChild(disc);

    return panel;
  }

  // ——— Route Planner View ———
  function buildPlannerView() {
    const wrap = el('div', 'fpr-shield__planner');

    wrap.innerHTML = `
      <div class="fpr-shield__section-title" style="margin-bottom:14px">Plan Your Route</div>
      ${state.errorMessage ? `<div class="fpr-shield__alert-box --error">${esc(state.errorMessage)}</div>` : ''}

      <div class="fpr-shield__route-input">
        <div class="fpr-shield__route-dot --origin"></div>
        <input class="fpr-shield__input" id="fpr-origin" placeholder="Origin (city, state or address)"
          value="${esc(state.originInput)}" />
      </div>
      <div class="fpr-shield__route-connector"></div>

      <div id="fpr-stops-list">
        ${state.stops.map((s, i) => `
          <div class="fpr-shield__route-input" style="position:relative;margin-bottom:4px">
            <div class="fpr-shield__route-dot --stop"></div>
            <input class="fpr-shield__input" placeholder="Stop ${i+1}" value="${esc(s)}" data-stop-idx="${i}" style="padding-right:36px" />
            <button style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9AA3AF;width:24px;height:24px;display:flex;align-items:center;justify-content:center" data-remove-stop="${i}" aria-label="Remove stop">${IC.x}</button>
          </div>
        `).join('')}
      </div>
      <div style="margin-bottom:4px">
        <button class="fpr-btn fpr-btn--ghost fpr-btn--xs" id="fpr-add-stop" style="gap:4px">${IC.plus} Add Stop</button>
      </div>
      <div class="fpr-shield__route-connector"></div>

      <div class="fpr-shield__route-input" style="margin-bottom:14px">
        <div class="fpr-shield__route-dot --dest"></div>
        <input class="fpr-shield__input" id="fpr-dest" placeholder="Destination (city, state or address)"
          value="${esc(state.destInput)}" />
      </div>

      <div class="fpr-shield__options-row">
        <input class="fpr-shield__date-input" id="fpr-date" type="date"
          value="${esc(state.travelDate)}" placeholder="Travel date" />
        <label class="fpr-shield__toggle-wrap">
          <input type="checkbox" id="fpr-round-trip" ${state.isRoundTrip ? 'checked' : ''} />
          Round trip
        </label>
      </div>

      ${state.firearms.length ? `
        <div style="background:var(--fpr-gray-50);border-radius:8px;padding:10px 12px;margin-bottom:14px;display:flex;align-items:center;gap:10px;font-size:12px;color:var(--fpr-gray-700)">
          <span style="width:28px;height:28px;color:#1b2f4e;display:flex">${IC.gun}</span>
          <div>
            <strong>${esc(state.firearms[0].make)} ${esc(state.firearms[0].model)}</strong>
            <div style="color:var(--fpr-gray-400)">${esc(state.firearms[0].caliber)} · ${state.firearms[0].magazine_capacity}rd magazine</div>
          </div>
          <div style="margin-left:auto">
            <button class="fpr-btn fpr-btn--ghost fpr-btn--xs" id="fpr-change-firearm">Change</button>
          </div>
        </div>
      ` : `
        <div style="background:var(--fpr-red-muted);border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12px;color:var(--fpr-red);font-weight:600">
          ${iconSpan('warning', 14)} No firearm registered. Go to Profile to add your travel firearm for accurate magazine compliance analysis.
        </div>
      `}

      <button class="fpr-btn fpr-btn--shield" id="fpr-analyze-btn" style="width:100%">
        ${state.analyzing ? '<span style="width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:shield-spin .8s linear infinite"></span> Analyzing...' : IC.shield + ' Analyze Compliance Corridor'}
      </button>
      ${state.analyzing ? `<div style="font-size:11px;text-align:center;color:var(--fpr-gray-400);margin-top:8px">Routing + state detection may take 30–60 seconds due to geocoding rate limits</div>` : ''}

      <div class="fpr-shield__disclaimer" style="margin-top:14px">${DISCLAIMER}</div>
    `;

    // Event wiring
    wrap.querySelector('#fpr-add-stop')?.addEventListener('click', () => {
      state.stops.push('');
      state.originInput = wrap.querySelector('#fpr-origin')?.value || '';
      state.destInput   = wrap.querySelector('#fpr-dest')?.value   || '';
      render();
    });

    wrap.querySelectorAll('[data-remove-stop]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.stops.splice(parseInt(btn.dataset.removeStop), 1);
        render();
      });
    });

    wrap.querySelector('#fpr-change-firearm')?.addEventListener('click', () => { state.view = 'setup'; render(); });

    wrap.querySelector('#fpr-analyze-btn')?.addEventListener('click', async () => {
      const origin = wrap.querySelector('#fpr-origin')?.value?.trim();
      const dest   = wrap.querySelector('#fpr-dest')?.value?.trim();
      if (!origin || !dest) { showToast('Enter origin and destination.', 'red'); return; }
      state.originInput = origin;
      state.destInput   = dest;
      state.travelDate  = wrap.querySelector('#fpr-date')?.value || '';
      state.isRoundTrip = wrap.querySelector('#fpr-round-trip')?.checked || false;
      await analyzeTrip(origin, dest);
    });

    return wrap;
  }

  // ——— Compliance Alerts View ———
  function buildAlertsView() {
    const trip = state.activeTrip;
    if (!trip) {
      const wrap = el('div', 'fpr-shield__planner');
      wrap.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--fpr-gray-400)"><div style="width:32px;height:32px;margin:0 auto 12px">${IC.map}</div><div style="font-size:14px;font-weight:600">Plan a route first</div><div style="font-size:12px;margin-top:6px">Enter origin and destination, then click Analyze.</div></div>`;
      return wrap;
    }

    const wrap = el('div', 'fpr-shield__corridor-list');

    // Summary bar
    const counts  = countStatuses(trip.corridors);
    const total   = trip.corridors.length || 1;
    const summBar = el('div', 'fpr-shield__summary-bar');
    ['green','yellow','orange','red'].forEach(c => {
      if (counts[c]) {
        const seg = el('div', `fpr-shield__summary-segment --${c}`);
        seg.style.width = ((counts[c] / total) * 100) + '%';
        summBar.appendChild(seg);
      }
    });
    wrap.appendChild(summBar);

    // Trip summary row
    if (state.errorMessage) {
      const errorRow = el('div', 'fpr-shield__alert-box --error');
      errorRow.textContent = state.errorMessage;
      wrap.appendChild(errorRow);
    }

    const sumRow = el('div');
    sumRow.style.cssText = 'padding:12px 16px;font-size:12px;color:var(--fpr-gray-500);border-bottom:1px solid var(--fpr-gray-100);display:flex;justify-content:space-between;gap:8px';
    sumRow.innerHTML = `
      <span><strong style="color:var(--fpr-gray-900)">${trip.origin.address} to ${trip.destination.address}</strong></span>
      <span>${trip.distanceMiles.toLocaleString()} mi · ${trip.durationHours.toFixed(1)}h</span>
    `;
    wrap.appendChild(sumRow);

    // Per-state corridors
    (trip.corridors || []).forEach(corridor => {
      const color = corridor.overallStatus || corridor.overall_status || 'green';
      const label = {
        green: 'Clear', yellow: 'Caution', orange: 'Restricted', red: 'FOPA Required'
      }[color] || color;

      const item = el('div', `fpr-shield__corridor-item${state.activeCorridor === corridor.id ? ' --open' : ''}`);
      const actions = (typeof corridor.requiredActions === 'string'
        ? JSON.parse(corridor.requiredActions)
        : corridor.requiredActions || corridor.required_actions || []);

      item.innerHTML = `
        <div class="fpr-shield__corridor-header">
          <div class="fpr-shield__corridor-status-dot --${color}"></div>
          <div class="fpr-shield__corridor-info">
            <div class="fpr-shield__corridor-state">${esc(corridor.stateName || corridor.state_name)}</div>
            <div class="fpr-shield__corridor-meta">
              Entry: mi ${(corridor.entryMile || corridor.entry_mile || 0).toFixed(0)}
              ${corridor.fopaRequired ? ' · FOPA Required' : ''}
              ${corridor.magNonCompliant ? ' · Mag Non-Compliant' : ''}
            </div>
          </div>
          <div class="fpr-shield__corridor-badge --${color}">${label}</div>
          <span style="width:16px;height:16px;display:flex;color:var(--fpr-gray-400)">${IC.chevron}</span>
        </div>
        <div class="fpr-shield__corridor-detail">
          <div class="fpr-shield__corridor-narrative">${esc(corridor.coachingNarrative || corridor.coaching_narrative || '')}</div>

          ${corridor.fopaRequired ? `
            <div class="fpr-shield__fopa-box">
              <div class="fpr-shield__fopa-title">${iconSpan('warning', 14)} FOPA Transport Required (18 U.S.C. § 926A)</div>
              <ul class="fpr-shield__fopa-list">
                ${FOPA_RULES.map(r => `<li>${esc(r)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="fpr-shield__action-list">
            ${actions.map(a => {
              const cls = getActionClass(a);
              return `<div class="fpr-shield__action-item ${cls}">${getActionIcon(a)}<span>${esc(cleanActionText(a))}</span></div>`;
            }).join('')}
          </div>
          <div class="fpr-shield__disclaimer" style="margin-top:10px;font-size:11px">${DISCLAIMER}</div>
        </div>
      `;

      item.querySelector('.fpr-shield__corridor-header')?.addEventListener('click', () => {
        state.activeCorridor = state.activeCorridor === corridor.id ? null : corridor.id;
        item.classList.toggle('--open');
        // Pan map to this state
        if (corridor.entryLat && corridor.entryLng && state.map) {
          state.map.setView([corridor.entryLat, corridor.entryLng], 7, { animate: true });
        }
        updateMapInfo(corridor);
      });

      wrap.appendChild(item);
    });

    // Print button
    const printRow = el('div');
    printRow.style.cssText = 'padding:12px 16px;border-top:1px solid var(--fpr-gray-100)';
    printRow.innerHTML = `
      <button class="fpr-btn fpr-btn--dark fpr-btn--sm" id="fpr-print-btn" style="width:100%">
        <span style="width:14px;height:14px;display:flex">${IC.print}</span> Print Trip Compliance Card
      </button>
    `;
    printRow.querySelector('#fpr-print-btn')?.addEventListener('click', () => printComplianceCard(trip));
    wrap.appendChild(printRow);

    const shareRow = el('div');
    shareRow.style.cssText = 'padding:8px 16px 16px;display:flex;justify-content:flex-end';
    shareRow.innerHTML = `<button id="fpr-share-route" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">${iconSpan('share', 14)}Share Your Route</button>`;
    shareRow.querySelector('#fpr-share-route')?.addEventListener('click', () => {
      shareRoute(trip);
    });
    wrap.appendChild(shareRow);

    return wrap;
  }

  // ——— Profile Setup View ———
  function buildSetupView() {
    const wrap = el('div', 'fpr-shield__setup');
    const permits = state.profile?.ccw_permits || [];

    wrap.innerHTML = `
      <div class="fpr-shield__section-title">CCW Permits</div>
      <div style="margin-bottom:12px">
        <div style="font-size:12px;color:var(--fpr-gray-500);margin-bottom:8px">Your carry permits drive the reciprocity analysis for every state along your route.</div>
        <div id="fpr-permits-display" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
          ${permits.map((p, i) => `
            <div class="fpr-shield__permit-tag">
              ${iconSpan('shield', 12)} ${esc(p.state)} ${esc(p.permit_type || 'resident')}
              <span class="fpr-shield__permit-tag-remove" data-remove-permit="${i}" aria-label="Remove permit">${IC.x}</span>
            </div>
          `).join('')}
          ${!permits.length ? '<span style="font-size:12px;color:var(--fpr-gray-400)">No permits added</span>' : ''}
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <select class="fpr-shield__select" id="fpr-permit-state" style="max-width:90px">
            ${['AZ','TX','FL','GA','TN','NC','VA','OH','IN','PA','NV','UT','WA','CO','MI','WI','MN','OR','ID','MT','WY','SD','ND','NM','OK','KS','MO','AR','LA','MS','AL','KY','WV','SC','DE','NH','ME','VT','AK','HI'].map(s =>
              `<option value="${s}">${s}</option>`
            ).join('')}
          </select>
          <select class="fpr-shield__select" id="fpr-permit-type" style="max-width:130px">
            <option value="resident">Resident</option>
            <option value="non-resident">Non-Resident</option>
          </select>
          <button class="fpr-btn fpr-btn--shield fpr-btn--sm" id="fpr-add-permit">${IC.plus} Add</button>
        </div>
      </div>

      <div class="fpr-shield__section-title" style="margin-top:14px">Home State</div>
      <div class="fpr-shield__field">
        <select class="fpr-shield__select" id="fpr-home-state" style="max-width:100px">
          ${Object.keys({AZ:'Arizona',TX:'Texas',FL:'Florida',GA:'Georgia',TN:'Tennessee',NC:'North Carolina',VA:'Virginia',OH:'Ohio',IN:'Indiana',PA:'Pennsylvania',NV:'Nevada',UT:'Utah',WA:'Washington',CO:'Colorado',CA:'California',NY:'New York',IL:'Illinois',NJ:'New Jersey',MD:'Maryland',MA:'Massachusetts'}).map(s =>
            `<option value="${s}" ${state.profile?.home_state === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>

      <div class="fpr-shield__section-title" style="margin-top:14px">Travel Firearm</div>
      ${state.firearms.map(f => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--fpr-gray-50);border-radius:8px;margin-bottom:8px;font-size:13px">
          <span style="width:22px;height:22px;color:var(--fpr-navy);display:flex">${IC.gun}</span>
          <div style="flex:1">
            <strong>${esc(f.make)} ${esc(f.model)}</strong>
            <div style="color:var(--fpr-gray-400);font-size:11px">${esc(f.caliber)} · ${f.magazine_capacity}rd std capacity · ${esc(f.firearm_type)}</div>
          </div>
          <button class="fpr-btn fpr-btn--ghost fpr-btn--xs" data-remove-firearm="${f.id}">Remove</button>
        </div>
      `).join('')}

      <!-- Add firearm form -->
      <div style="background:var(--fpr-gray-50);border:1.5px solid var(--fpr-gray-200);border-radius:8px;padding:12px;margin-top:4px">
        <div style="font-size:12px;font-weight:700;color:var(--fpr-gray-700);margin-bottom:10px">Add Travel Firearm</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="fpr-shield__field"><label class="fpr-shield__label">Make</label><input class="fpr-shield__input" id="fpr-make" placeholder="Glock" /></div>
          <div class="fpr-shield__field"><label class="fpr-shield__label">Model</label><input class="fpr-shield__input" id="fpr-model" placeholder="17 Gen5" /></div>
          <div class="fpr-shield__field"><label class="fpr-shield__label">Caliber</label><input class="fpr-shield__input" id="fpr-caliber" placeholder="9mm" /></div>
          <div class="fpr-shield__field"><label class="fpr-shield__label">Std Mag Cap *</label><input class="fpr-shield__input" id="fpr-magcap" type="number" placeholder="17" min="1" max="200" /></div>
          <div class="fpr-shield__field">
            <label class="fpr-shield__label">Type</label>
            <select class="fpr-shield__select" id="fpr-ftype">
              <option value="pistol">Pistol</option><option value="revolver">Revolver</option>
              <option value="rifle">Rifle</option><option value="shotgun">Shotgun</option>
            </select>
          </div>
        </div>
        <div style="font-size:11px;color:var(--fpr-red);font-weight:600;margin:6px 0">* Magazine capacity drives compliance analysis — enter what you plan to carry loaded.</div>
        <button class="fpr-btn fpr-btn--shield fpr-btn--sm" id="fpr-add-firearm" style="margin-top:6px">${IC.plus} Add Firearm</button>
      </div>

      <button class="fpr-btn fpr-btn--gold" id="fpr-save-profile" style="width:100%;margin-top:14px">Save Profile</button>
    `;

    // Add permit
    wrap.querySelector('#fpr-add-permit')?.addEventListener('click', () => {
      const s = wrap.querySelector('#fpr-permit-state')?.value;
      const t = wrap.querySelector('#fpr-permit-type')?.value;
      if (s && !state.profile.ccw_permits.find(p => p.state === s)) {
        state.profile.ccw_permits.push({ state: s, permit_type: t });
        render();
      }
    });

    // Remove permit
    wrap.querySelectorAll('[data-remove-permit]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.profile.ccw_permits.splice(parseInt(btn.dataset.removePermit), 1);
        render();
      });
    });

    // Add firearm
    wrap.querySelector('#fpr-add-firearm')?.addEventListener('click', async () => {
      const make    = wrap.querySelector('#fpr-make')?.value?.trim();
      const model   = wrap.querySelector('#fpr-model')?.value?.trim();
      const caliber = wrap.querySelector('#fpr-caliber')?.value?.trim();
      const magcap  = parseInt(wrap.querySelector('#fpr-magcap')?.value) || 0;
      const ftype   = wrap.querySelector('#fpr-ftype')?.value;
      if (!make || !model || !caliber || !magcap) { showToast('Fill in all firearm fields.', 'red'); return; }

      const newF = { id: 'local-' + Date.now(), make, model, caliber, magazine_capacity: magcap, firearm_type: ftype };
      let data = null;
      if (canUseLiveApi()) {
        try {
          data = await api(`/api/shield/member/${state.memberId}/firearms`, {
            method: 'POST',
            body: JSON.stringify({ make, model, caliber, firearmType: ftype, magazineCapacity: magcap }),
          });
        } catch (err) {
          showToast('Firearm saved locally for this session; profile API is unavailable.', 'blue');
        }
      }
      state.firearms = data?.firearm ? [...state.firearms, data.firearm] : [...state.firearms, newF];
      showToast(`${make} ${model} added.`, 'green');
      render();
    });

    wrap.querySelectorAll('[data-remove-firearm]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.firearms = state.firearms.filter(f => f.id !== btn.dataset.removeFirearm);
        if (canUseLiveApi()) api(`/api/shield/member/${state.memberId}/firearms/${btn.dataset.removeFirearm}`, { method: 'DELETE' }).catch(() => {});
        render();
      });
    });

    wrap.querySelector('#fpr-save-profile')?.addEventListener('click', async () => {
      const homeState = wrap.querySelector('#fpr-home-state')?.value;
      state.profile.home_state = homeState;
      if (canUseLiveApi()) {
        try {
          await api('/api/shield/profile', {
            method: 'POST',
            body: JSON.stringify({ memberId: state.memberId, memberName: state.memberName, homeState, ccwPermits: state.profile.ccw_permits }),
          });
        } catch (err) {
          showToast('Profile saved locally for this session; profile API is unavailable.', 'blue');
        }
      }
      showToast('Profile saved!', 'green');
      state.view = 'planner';
      render();
    });

    return wrap;
  }

  // -------------------------------------------------------------------------
  // Trip Analysis
  // -------------------------------------------------------------------------
  async function analyzeTrip(origin, dest) {
    state.analyzing = true;
    state.errorMessage = null;
    render();

    if (!canUseLiveApi()) {
      await new Promise(r => setTimeout(r, 500));
      state.activeTrip = state.apiUrl
        ? buildFallbackTrip(origin, dest, 'Member ID is not connected yet.')
        : { ...DEMO_TRIP, origin: { address: origin, lat: 33.45, lng: -112.07 }, destination: { address: dest, lat: 38.90, lng: -77.04 } };
      state.errorMessage = state.apiUrl ? 'Live API unavailable: Member ID is not connected.' : null;
      state.analyzing = false;
      state.view = 'alerts';
      render();
      updateMapWithTrip(state.activeTrip);
      showToast(state.apiUrl ? 'Preview member ID detected; offline review route loaded.' : 'Demo analysis loaded. Connect API for live routing.', 'blue');
      return;
    }

    try {
      const firearmsId = state.firearms[0]?.id;
      const data = await api('/api/shield/trips/analyze', {
        method: 'POST',
        body: JSON.stringify({
          memberId: state.memberId,
          origin, destination: dest,
          stops: state.stops.filter(Boolean),
          travelDate: state.travelDate || null,
          isRoundTrip: state.isRoundTrip,
          firearmsId: firearmsId || null,
        }),
      });

      if (!data?.tripId) throw new Error('Analysis failed - check API connection.');

      state.activeTrip = data;
      state.errorMessage = null;
      state.view = 'alerts';
      if (typeof window.fprAwardTicket === 'function') window.fprAwardTicket('route_analyzed', {});
      render();
      updateMapWithTrip(data);
    } catch (err) {
      state.errorMessage = err?.message || 'Live routing is unavailable.';
      state.activeTrip = buildFallbackTrip(origin, dest, state.errorMessage);
      state.view = 'alerts';
      showToast(`Live routing unavailable: ${state.errorMessage}`, 'red');
      render();
      updateMapWithTrip(state.activeTrip);
    } finally {
      state.analyzing = false;
      render();
      if (state.activeTrip) updateMapWithTrip(state.activeTrip);
    }
  }

  // -------------------------------------------------------------------------
  // Leaflet Map
  // -------------------------------------------------------------------------
  function ensureLeaflet() {
    if (window.L) return Promise.resolve();
    if (state.leafletLoading) return state.leafletLoading;

    state.leafletLoading = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-fpr-leaflet-css]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.setAttribute('data-fpr-leaflet-css', 'true');
        document.head.appendChild(css);
      }

      const existing = document.querySelector('script[data-fpr-leaflet-js], script[src*="leaflet"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        setTimeout(() => window.L ? resolve() : reject(new Error('Leaflet did not initialize.')), 6000);
        return;
      }

      const js = document.createElement('script');
      js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      js.async = true;
      js.setAttribute('data-fpr-leaflet-js', 'true');
      js.onload = resolve;
      js.onerror = () => reject(new Error('Leaflet failed to load.'));
      document.head.appendChild(js);
    }).catch(err => {
      showMapFallback(err.message || 'Map library failed to load.');
      throw err;
    });

    return state.leafletLoading;
  }

  function destroyMap() {
    if (!state.map) return;
    try { state.map.remove(); } catch {}
    state.map = null;
    state.routeLayer = null;
    state.markerLayers = [];
  }

  function initMap() {
    const container = state.root.querySelector('#fpr-map-container');
    if (!container) return;
    if (!window.L) {
      ensureLeaflet()
        .then(() => initMap())
        .catch(() => {});
      return;
    }
    if (state.map) {
      setTimeout(() => state.map.invalidateSize(true), 80);
      return;
    }

    state.map = L.map(container, {
      center:          [38.5, -97],
      zoom:            4,
      zoomControl:     true,
      attributionControl: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    });
    let tilesReady = false;
    tileLayer.on('load', () => { tilesReady = true; });
    tileLayer.on('tileerror', () => {
      if (!tilesReady && state.activeTrip) showRouteOverview(state.activeTrip, 'Map tiles are blocked or unavailable.');
    });
    tileLayer.addTo(state.map);

    if (state.activeTrip) updateMapWithTrip(state.activeTrip);
    setTimeout(() => {
      try { state.map.invalidateSize(true); } catch {}
    }, 120);
    setTimeout(() => {
      if (!tilesReady && state.activeTrip) showRouteOverview(state.activeTrip, 'Map tiles are taking too long to load.');
    }, 4500);
  }

  function reinitMap() {
    // Map already initialized — just update layers
    if (state.activeTrip) updateMapWithTrip(state.activeTrip);
  }

  function updateMapWithTrip(trip) {
    if (!state.map || !window.L) {
      initMap();
      return;
    }

    // Clear existing layers
    state.markerLayers.forEach(l => state.map.removeLayer(l));
    state.markerLayers = [];
    if (state.routeLayer) { state.map.removeLayer(state.routeLayer); state.routeLayer = null; }

    const corridors = trip.corridors || [];
    const bounds    = [];

    // Draw colored route segments between corridor entry points
    const points = [];
    corridors.forEach(c => {
      if (c.entryLat && c.entryLng) points.push({ lat: c.entryLat, lng: c.entryLng, color: COMPLY_COLORS[c.overallStatus || c.overall_status] || '#15803D' });
    });
    if (trip.destination?.lat) {
      points.push({ lat: trip.destination.lat, lng: trip.destination.lng, color: '#1E4D8C' });
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i], p2 = points[i + 1];
      const seg = L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
        color: p1.color, weight: 5, opacity: .85,
      }).addTo(state.map);
      state.markerLayers.push(seg);
      bounds.push([p1.lat, p1.lng]);
    }

    // Draw state entry markers
    corridors.forEach((c, i) => {
      if (!c.entryLat || !c.entryLng) return;
      const color = COMPLY_COLORS[c.overallStatus || c.overall_status] || '#15803D';
      const icon  = L.divIcon({
        html: `<div style="background:${color};color:#fff;font-size:10px;font-weight:800;padding:3px 7px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25)">${esc(c.stateCode || c.state_code)}</div>`,
        className: '',
        iconAnchor: [20, 10],
      });
      const marker = L.marker([c.entryLat, c.entryLng], { icon })
        .addTo(state.map)
        .bindPopup(`<strong>${esc(c.stateName || c.state_name)}</strong><br>${esc(statusLabel(c.overallStatus || c.overall_status))}<br><small>${DISCLAIMER}</small>`, { maxWidth: 280 });

      marker.on('click', () => updateMapInfo(c));
      state.markerLayers.push(marker);
      bounds.push([c.entryLat, c.entryLng]);
    });

    // Origin marker
    if (trip.origin?.lat) {
      const originIcon = L.divIcon({
        html: `<div style="background:#1E4D8C;color:#fff;font-size:11px;font-weight:800;padding:4px 9px;border-radius:99px;box-shadow:0 2px 6px rgba(0,0,0,.3)">START</div>`,
        className: '', iconAnchor: [24, 10],
      });
      state.markerLayers.push(L.marker([trip.origin.lat, trip.origin.lng], { icon: originIcon }).addTo(state.map));
      bounds.push([trip.origin.lat, trip.origin.lng]);
    }

    // Destination marker
    if (trip.destination?.lat) {
      const destIcon = L.divIcon({
        html: `<div style="background:#B91C1C;color:#fff;font-size:11px;font-weight:800;padding:4px 9px;border-radius:99px;box-shadow:0 2px 6px rgba(0,0,0,.3)">DEST</div>`,
        className: '', iconAnchor: [22, 10],
      });
      state.markerLayers.push(L.marker([trip.destination.lat, trip.destination.lng], { icon: destIcon }).addTo(state.map));
      bounds.push([trip.destination.lat, trip.destination.lng]);
    }

    if (bounds.length) {
      try { state.map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] }); }
      catch {}
    }
    setTimeout(() => {
      try { state.map.invalidateSize(true); } catch {}
    }, 80);
  }

  function showMapFallback(message) {
    const container = state.root?.querySelector('#fpr-map-container');
    if (!container) return;
    container.innerHTML = `
      <div class="fpr-shield__map-fallback">
        <div class="fpr-shield__map-fallback-icon">${IC.map}</div>
        <div>
          <strong>Map could not load</strong>
          <span>${esc(message)} Check that Leaflet is allowed to load on this page.</span>
        </div>
      </div>
    `;
  }

  function showRouteOverview(trip, message) {
    const container = state.root?.querySelector('#fpr-map-container');
    if (!container || container.querySelector('.leaflet-tile-loaded')) return;
    const corridors = trip?.corridors || [];
    const states = corridors.length ? corridors : [{ stateCode: 'ROUTE', stateName: 'Route', overallStatus: 'green' }];
    container.innerHTML = `
      <div class="fpr-shield__route-overview">
        <div class="fpr-shield__route-overview-head">
          <strong>${esc(trip?.origin?.address || 'Origin')}</strong>
          <span>to</span>
          <strong>${esc(trip?.destination?.address || 'Destination')}</strong>
        </div>
        <div class="fpr-shield__route-overview-line">
          ${states.map(c => {
            const color = c.overallStatus || c.overall_status || 'green';
            return `<div class="fpr-shield__route-overview-state --${color}">
              <span>${esc(c.stateCode || c.state_code || '')}</span>
              <small>${esc(statusLabel(color))}</small>
            </div>`;
          }).join('')}
        </div>
        <div class="fpr-shield__route-overview-note">${esc(message || 'Interactive map unavailable; route overview is shown.')}</div>
      </div>
    `;
  }

  function updateMapInfo(corridor) {
    const info = state.root.querySelector('#fpr-map-info-text');
    if (!info) return;
    if (!corridor) {
      info.className = 'fpr-shield__map-info-text --select';
      info.innerHTML = 'Click a state marker to see compliance details on the map.';
      return;
    }
    const color = corridor.overallStatus || corridor.overall_status || 'green';
    const label = { green: 'Clear to carry', yellow: 'Caution - see details', orange: 'Restricted', red: 'FOPA Required - disarm before entry' }[color] || '';
    info.className = 'fpr-shield__map-info-text';
    info.innerHTML = `<strong style="color:${COMPLY_COLORS[color]}">${esc(corridor.stateName || corridor.state_name)}: ${label}</strong><br><span style="font-size:11px">${esc((corridor.coachingNarrative || corridor.coaching_narrative || '').slice(0, 120))}...</span>`;
  }

  // -------------------------------------------------------------------------
  // Map Panel
  // -------------------------------------------------------------------------
  function buildMapPanel() {
    const panel = el('div', 'fpr-shield__map-panel');

    // Map container
    const mapEl = el('div', 'fpr-shield__map');
    mapEl.id = 'fpr-map-container';
    mapEl.style.flex = '1';
    panel.appendChild(mapEl);

    // Legend
    const legend = el('div', 'fpr-shield__map-legend');
    legend.innerHTML = `
      <div class="fpr-shield__map-legend-title">Compliance Corridor</div>
      ${[['green','Clear to carry'],['yellow','Caution'],['orange','Restricted'],['red','FOPA Required']].map(([c, l]) =>
        `<div class="fpr-shield__map-legend-item"><div class="fpr-shield__map-legend-dot" style="background:${COMPLY_COLORS[c]}"></div>${l}</div>`
      ).join('')}
    `;
    panel.appendChild(legend);

    // Map info strip
    const info = el('div', 'fpr-shield__map-info');
    info.innerHTML = `
      <div class="fpr-shield__map-info-state">${IC.shield}</div>
      <div class="fpr-shield__map-info-text --select" id="fpr-map-info-text">Click a state marker to see compliance details</div>
    `;
    panel.appendChild(info);

    return panel;
  }

  // -------------------------------------------------------------------------
  // Print Compliance Card
  // -------------------------------------------------------------------------
  function printComplianceCard(trip) {
    const corridors  = trip.corridors || [];
    const firearm    = state.firearms[0];
    const permits    = state.profile?.ccw_permits || [];
    const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let printView = document.querySelector('.fpr-shield-print-view');
    if (!printView) { printView = el('div', 'fpr-shield-print-view'); document.body.appendChild(printView); }

    const fopaStates = corridors.filter(c => c.fopaRequired).map(c => c.stateName || c.state_name);
    const magStates  = corridors.filter(c => c.magNonCompliant).map(c => c.stateName || c.state_name);

    printView.innerHTML = `
      <div class="shield-print__header">
        <div class="shield-print__logo">FPR<span>Members</span>.com</div>
        <div class="shield-print__title">${iconSpan('shield', 18)} Shield-Radius<br>CCW Travel Compliance Card</div>
      </div>

      <div class="shield-print__trip-bar">
        <div class="shield-print__trip-bar-item">Route: <span>${esc(trip.origin.address)}</span> to <span>${esc(trip.destination.address)}</span></div>
        <div class="shield-print__trip-bar-item">${trip.distanceMiles.toLocaleString()} mi · ${trip.durationHours.toFixed(1)}h</div>
        <div class="shield-print__trip-bar-item">Generated: <span>${generatedDate}</span></div>
      </div>

      <div class="shield-print__profile-row">
        <div class="shield-print__profile-box">
          <div class="shield-print__profile-label">CCW Permits</div>
          <div class="shield-print__profile-value">${permits.map(p => `${p.state} (${p.permit_type || 'resident'})`).join(', ') || 'None listed'}</div>
        </div>
        <div class="shield-print__profile-box">
          <div class="shield-print__profile-label">Travel Firearm</div>
          <div class="shield-print__profile-value">${firearm ? `${esc(firearm.make)} ${esc(firearm.model)}, ${esc(firearm.caliber)}, ${firearm.magazine_capacity}rd` : 'Not specified'}</div>
        </div>
        <div class="shield-print__profile-box">
          <div class="shield-print__profile-label">States Requiring FOPA</div>
          <div class="shield-print__profile-value" style="color:${fopaStates.length ? '#B91C1C' : '#15803D'}">${fopaStates.length ? fopaStates.join(', ') : 'None'}</div>
        </div>
      </div>

      ${fopaStates.length ? `
        <div class="shield-print__fopa-section">
          <div class="shield-print__fopa-title">${iconSpan('warning', 14)} FOPA Transport Required in: ${fopaStates.join(', ')}</div>
          <ul class="shield-print__fopa-rules">
            ${FOPA_RULES.map(r => `<li>${esc(r)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${corridors.map(c => {
        const color   = c.overallStatus || c.overall_status || 'green';
        const label   = { green: 'CLEAR', yellow: 'CAUTION', orange: 'RESTRICTED', red: 'FOPA REQUIRED' }[color] || color;
        const actions = typeof c.requiredActions === 'string' ? JSON.parse(c.requiredActions) : (c.requiredActions || c.required_actions || []);
        const sl      = {}; // simplified — use corridor data
        return `
          <div class="shield-print__state-card --${color}">
            <div class="shield-print__state-header">
              <div class="shield-print__state-name">${esc(c.stateName || c.state_name)}</div>
              <div class="shield-print__state-status">${label}</div>
            </div>
            <div class="shield-print__state-body">
              <div class="shield-print__state-facts">
                <div class="shield-print__fact">CCW: ${esc(c.ccwStatus?.replace('_',' ') || c.ccw_status || '?')}</div>
                <div class="shield-print__fact">Magazine: ${esc(c.magStatus?.replace('_',' ') || c.mag_status || 'compliant')}</div>
                <div class="shield-print__fact">Entry: mi ${(c.entryMile || c.entry_mile || 0).toFixed(0)}</div>
              </div>
              <ul class="shield-print__state-actions">
                ${actions.map(a => `<li>${esc(cleanActionText(a))}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }).join('')}

      <div class="shield-print__disclaimer">
        <div class="shield-print__disclaimer-title">${iconSpan('warning', 14)} Required Disclaimer</div>
        ${DISCLAIMER} Law data version: ${state.activeTrip?.lawVersion || 1}. Generated: ${generatedDate}. This card does not constitute legal advice. State and local laws change frequently. Verify all information against official state sources before travel.
      </div>

      <div class="shield-print__footer">
        <span>FPRMembers.com Shield-Radius · Carry Responsibly</span>
        <span>NOT LEGAL ADVICE · For Informational Purposes Only</span>
      </div>
    `;

    printView.style.display = 'block';
    window.print();
    setTimeout(() => { printView.style.display = 'none'; }, 1000);
  }

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function statusLabel(color) {
    return { green: 'Clear', yellow: 'Caution', orange: 'Restricted', red: 'FOPA Required' }[color] || 'Review';
  }
  function cleanActionText(text) {
    return String(text || '')
      .replace(/^[\u2705\u26d4\u26a0\ufe0f\u2139\ufe0f\ud83d\udea8\ud83d\udccb]\s*/u, '')
      .trim();
  }
  function getActionClass(text) {
    const raw = String(text || '');
    if (/FOPA|Disarm|non-compliant|EXCEEDS|Required/i.test(raw) || raw.charCodeAt(0) === 0x26D4) return '--critical';
    if (/Warning|Restriction|Duty|AWB|Verify/i.test(raw) || raw.charCodeAt(0) === 0x26A0) return '--warn';
    return '';
  }
  function getActionIcon(text) {
    const cls = getActionClass(text);
    if (cls === '--critical' || cls === '--warn') return iconSpan('warning', 13);
    if (/Inform|Note|Verify/i.test(String(text || ''))) return iconSpan('info', 13);
    return iconSpan('check', 13);
  }

  function showToast(msg, type = 'blue') {
    let wrap = document.querySelector('.fpr-shield__toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'fpr-shield__toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = `fpr-shield__toast --${type}`;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('--out'); setTimeout(() => t.remove(), 300); }, 4200);
  }

  async function shareRoute(trip) {
    const title = 'Shield-Radius Route';
    const from = trip?.origin?.address || state.originInput || 'Origin';
    const to = trip?.destination?.address || state.destInput || 'Destination';
    const text = `Shield-Radius compliance route: ${from} to ${to}`;
    const url = window.location.href;

    try {
      if (window.FPRShare?.open) {
        window.FPRShare.open('Share Your Route');
        return;
      }
    } catch {}

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        if (typeof window.fprAwardTicket === 'function') window.fprAwardTicket('route_shared', { source: 'native' });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast('Route share link copied.', 'green');
      if (typeof window.fprAwardTicket === 'function') window.fprAwardTicket('route_shared', { source: 'clipboard' });
    } catch {
      showToast('Share is unavailable in this browser. Copy the page URL to share this route.', 'blue');
    }
  }

  async function loadProfile() {
    if (!canUseLiveApi()) return;
    try {
      const data = await api(`/api/shield/member/${state.memberId}/profile`, { timeout: 20000, silent: true });
      if (data?.profile) { state.profile = { ...state.profile, ...data.profile, ccw_permits: data.profile.ccw_permits || [] }; }
      if (data?.firearms?.length) state.firearms = data.firearms;
    } catch (err) {
      showToast('Profile API unavailable; demo profile is loaded for this session.', 'blue');
    }
  }

  // -------------------------------------------------------------------------
  // Bootstrap
  // -------------------------------------------------------------------------
  async function init(root) {
    state.root       = root;
    state.apiUrl     = (root.dataset.apiUrl || '').replace(/\/$/, '');
    state.memberId   = root.dataset.memberId   || 'demo-member';
    state.memberName = root.dataset.memberName || 'Demo Member';
    if (!hasUsableMemberId()) {
      state.memberId = 'demo-member';
      root.dataset.memberId = 'demo-member';
    }
    root.classList.add('fpr-shield');

    render();
    await loadProfile();
    render();

    // Initialize map after DOM is ready
    setTimeout(() => { if (!state.map) initMap(); }, 100);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fpr-shield-mount').forEach(function(root){ window.__fprResolveMount(root).then(function(){ init(root); }); });
  });

  window.FPRShieldRadius = { init };
})();
