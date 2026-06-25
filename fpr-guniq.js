/**
 * FPRMembers.com — Build 5: Increase Your Gun IQ — Education Hub
 * File: fpr-guniq.js
 *
 * Usage:
 *   <div class="fpr-guniq"
 *        data-api-url="https://your-api.com"
 *        data-member-id="MEMBER_ID"
 *        data-member-name="MEMBER_NAME">
 *   </div>
 *   <script src="fpr-guniq.js"></script>
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // SVG icon library
  // -------------------------------------------------------------------------
  const ICONS = {
    shield:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    target:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    parts:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    types:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    gavel:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>`,
    trophy:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 17 8 19 16 19 16 17"/><path d="M12 17V11"/><path d="M17 5V3H7v2H4c0 4 2 7 4.5 8H12c2.5-1 4.5-4 4.5-8z"/><line x1="12" y1="11" x2="12" y2="11"/></svg>`,
    cert:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="15" r="2"/><path d="m9 18 1.5-1.5M14.5 18 13 16.5"/></svg>`,
    fire:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    x:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    chevron:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
    arrow:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    clock:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    share:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    map:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    lock:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    star:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    user:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  };

  function icon(name, cls = '') {
    return `<span class="fpr-guniq__icon${cls ? ' ' + cls : ''}">${ICONS[name] || ''}</span>`;
  }

  // -------------------------------------------------------------------------
  // Embedded demo data (used when API is not connected)
  // -------------------------------------------------------------------------
  const DEMO_COURSES = [
    { id: 'c1', slug: 'gun-safety',      title: 'Gun Safety Fundamentals',        subtitle: 'Master the rules every responsible owner lives by.',          icon_name: 'shield', estimated_mins: 40, lesson_count: 8,  module_count: 3 },
    { id: 'c2', slug: 'how-to-shoot',    title: 'How to Shoot',                   subtitle: 'Stance, grip, trigger control — the fundamentals that build accuracy.', icon_name: 'target', estimated_mins: 45, lesson_count: 7, module_count: 2 },
    { id: 'c3', slug: 'firearm-parts',   title: 'Firearm Parts & Anatomy',        subtitle: 'Know your firearm inside and out.',                           icon_name: 'parts',  estimated_mins: 35, lesson_count: 6,  module_count: 2 },
    { id: 'c4', slug: 'types-firearms',  title: 'Types of Firearms',              subtitle: 'Handguns, long guns, NFA items, and everything between.',     icon_name: 'types',  estimated_mins: 40, lesson_count: 7,  module_count: 3 },
    { id: 'c5', slug: 'legal-scenarios', title: 'Legal Scenarios: Know Before You Draw', subtitle: 'Zip-code aware situational law in your state.',         icon_name: 'gavel',  estimated_mins: 50, lesson_count: 8,  module_count: 2 },
  ];

  const DEMO_LESSONS = [
    { id: 'l1', courseId: 'c1', title: 'Treat Every Firearm as Loaded', estimated_mins: 5, points_value: 10,
      content_html: `<h2>Rule 1: Treat Every Firearm as if It's Loaded</h2>
<p>This is the most fundamental safety rule and the cornerstone of responsible gun ownership. Even if you have just unloaded a firearm, continue to treat it as if it contains live ammunition.</p>
<h3>Why This Rule Exists</h3>
<p>Human memory is fallible. People have been seriously injured or killed by firearms they believed were unloaded. By ingraining this habit, you eliminate the single most dangerous assumption in gun handling.</p>
<h3>Practical Application</h3>
<ul>
<li>Never assume — always verify the chamber is clear before handling</li>
<li>After clearing a firearm, continue handling it with the same care as a loaded one</li>
<li>If someone hands you a firearm, verify it yourself — never rely solely on their word</li>
<li>This rule applies equally in the field, at the range, and at home</li>
</ul>
<blockquote>A gun doesn't know whether it's supposed to be empty.</blockquote>`,
      questions: [
        { id: 'q1', question_text: 'Why should you treat a firearm as loaded even after you\'ve unloaded it?', explanation: 'Human memory is unreliable. The habit of treating every gun as loaded eliminates the most dangerous assumption in gun handling.',
          answers: [{ id: 'a1', answer_text: 'Because you might need it loaded quickly' }, { id: 'a2', answer_text: 'Because human memory is fallible — the habit eliminates dangerous assumptions' }, { id: 'a3', answer_text: 'Because the gun could spontaneously reload' }, { id: 'a4', answer_text: 'Only new gun owners need to follow this rule' }], correctId: 'a2' },
        { id: 'q2', question_text: 'If someone hands you a firearm and says "it\'s unloaded," what should you do?', explanation: 'Always verify the chamber yourself. Never rely solely on another person\'s word.',
          answers: [{ id: 'a5', answer_text: 'Trust them — they already checked' }, { id: 'a6', answer_text: 'Thank them and put it away' }, { id: 'a7', answer_text: 'Verify the chamber is clear yourself' }, { id: 'a8', answer_text: 'Ask them again to be sure' }], correctId: 'a7' },
      ]
    },
    { id: 'l2', courseId: 'c1', title: 'Never Point at Anything You Don\'t Intend to Shoot', estimated_mins: 5, points_value: 10,
      content_html: `<h2>Rule 2: Never Point at Anything You Don't Intend to Shoot</h2>
<p>The muzzle must always be pointed in a safe direction — one where an unintended discharge would cause no injury or serious property damage.</p>
<h3>What Is a Safe Direction?</h3>
<ul>
<li><strong>At the range:</strong> Downrange toward the target berm</li>
<li><strong>At home:</strong> Toward a concrete floor or exterior wall, away from people</li>
<li><strong>In the field:</strong> Toward the ground, angled away from others</li>
</ul>
<p>Experienced shooters develop constant muzzle awareness — a subconscious tracking of where the muzzle is pointed at all times. This takes deliberate practice but becomes automatic with repetition.</p>`,
      questions: [
        { id: 'q3', question_text: 'What is a "safe direction" for a muzzle?', explanation: 'A safe direction is one where an unintended discharge causes no injury or serious damage.',
          answers: [{ id: 'a9', answer_text: 'Toward the ground always' }, { id: 'a10', answer_text: 'Toward an unoccupied wall' }, { id: 'a11', answer_text: 'A direction where an unintended discharge causes no injury or serious damage' }, { id: 'a12', answer_text: 'Away from yourself only' }], correctId: 'a11' },
      ]
    },
    { id: 'l3', courseId: 'c1', title: 'Keep Your Finger Off the Trigger', estimated_mins: 5, points_value: 10,
      content_html: `<h2>Rule 3: Keep Your Finger Off the Trigger Until Ready to Shoot</h2>
<p>Your trigger finger must rest along the frame, outside and above the trigger guard, until your sights are on the target and you have made a conscious decision to fire.</p>
<h3>The Sympathetic Grip Reflex</h3>
<p>Under stress, the human body causes all fingers to contract simultaneously. If your index finger is on the trigger during a startle or stumble, a negligent discharge can occur. This is physiological — not a character flaw — which is why the rule is so important.</p>
<h3>High-Register Position</h3>
<p>Rest your trigger finger high on the frame, above the trigger guard, pointing forward. This position is visually verifiable by any range officer or training partner.</p>`,
      questions: [
        { id: 'q4', question_text: 'Where should your trigger finger rest when not actively shooting?', explanation: 'The index finger rests along the frame, outside and above the trigger guard — the "high register" position.',
          answers: [{ id: 'a13', answer_text: 'On the trigger guard' }, { id: 'a14', answer_text: 'Lightly touching the trigger' }, { id: 'a15', answer_text: 'Along the frame, outside and above the trigger guard' }, { id: 'a16', answer_text: 'Behind the trigger' }], correctId: 'a15' },
        { id: 'q5', question_text: 'What is the sympathetic grip reflex?', explanation: 'Under stress, all fingers contract together — if the index finger is on the trigger, a negligent discharge can result.',
          answers: [{ id: 'a17', answer_text: 'A technique for faster shooting' }, { id: 'a18', answer_text: 'Under stress, all fingers contract together — dangerous if the finger is on the trigger' }, { id: 'a19', answer_text: 'The natural tendency to grip harder in cold weather' }, { id: 'a20', answer_text: 'A training method for beginners' }], correctId: 'a18' },
      ]
    },
    { id: 'l4', courseId: 'c2', title: 'Stance', estimated_mins: 7, points_value: 10,
      content_html: `<h2>Shooting Stance</h2>
<p>A proper stance provides a stable shooting platform, manages recoil, and allows natural target transitions.</p>
<h3>Isosceles Stance</h3>
<p>Both arms extend equally toward the target, forming a triangle. Feet shoulder-width apart, knees slightly bent, weight forward. The most widely taught modern stance.</p>
<h3>Weaver Stance</h3>
<p>Bladed body position. Strong arm pushes forward, support arm pulls back (push-pull tension). Developed by Deputy Sheriff Jack Weaver in the 1950s.</p>
<h3>Modified Weaver (Chapman)</h3>
<p>Bladed body with strong arm extended straight, support arm bent at ~45°. A hybrid of the two above, popularized by competitive shooter Ray Chapman.</p>`,
      questions: [
        { id: 'q6', question_text: 'Which stance forms a triangle shape with both arms extended equally?', explanation: 'The Isosceles stance gets its name from the triangle formed by both arms and the shooter\'s chest.',
          answers: [{ id: 'a21', answer_text: 'Weaver' }, { id: 'a22', answer_text: 'Chapman' }, { id: 'a23', answer_text: 'Isosceles' }, { id: 'a24', answer_text: 'Bullseye' }], correctId: 'a23' },
      ]
    },
    { id: 'l5', courseId: 'c2', title: 'Trigger Control', estimated_mins: 8, points_value: 10,
      content_html: `<h2>Trigger Control</h2>
<p>Pressing the trigger straight rearward in a smooth, consistent manner without disturbing sight alignment. It is the fundamental most likely to limit your accuracy.</p>
<h3>Press, Not Pull</h3>
<p>Use "press" — not "pull." Pulling implies yanking. Pressing implies a controlled, deliberate rearward movement.</p>
<h3>Slack and Wall</h3>
<p>Most triggers have initial slack (free travel) before resistance at the "wall." Taking up slack before aligning sights and completing the press at the wall allows for more precise shots.</p>
<h3>Common Errors</h3>
<ul>
<li><strong>Anticipating recoil (flinching):</strong> Most common accuracy killer — pushing muzzle down before firing</li>
<li><strong>Heeling:</strong> Applying rearward pressure with the palm heel before the trigger breaks</li>
<li><strong>Jerking:</strong> Rapid, inconsistent trigger movement</li>
</ul>`,
      questions: [
        { id: 'q7', question_text: 'What is "anticipating recoil" and how does it affect accuracy?', explanation: 'Anticipating recoil causes the shooter to push the muzzle down before the shot breaks, moving impact low.',
          answers: [{ id: 'a25', answer_text: 'Leaning forward before shooting — improves stability' }, { id: 'a26', answer_text: 'Pushing the muzzle down before the shot — causes low shots' }, { id: 'a27', answer_text: 'Watching the target while pressing' }, { id: 'a28', answer_text: 'Gripping too tightly' }], correctId: 'a26' },
      ]
    },
  ];

  const DEMO_LEGAL_SCENARIOS = [
    { id: 's1', title: 'Home Invasion', scenario_text: 'It is 2 AM. You wake to the sound of your back door being kicked open. An unknown person enters your home. You do not know if they are armed. You are in your bedroom with your family. Is it legal to use deadly force to stop the intruder?' },
    { id: 's2', title: 'Defense of Property Only', scenario_text: 'You observe someone breaking into your car in your driveway. The person grabs your laptop and starts running away — they make no threats toward you personally. Is it legal to shoot them?' },
    { id: 's3', title: 'Warning Shot', scenario_text: 'Someone is approaching aggressively and threatening you verbally but has not attacked. You fire into the ground to warn them away. Is this likely legal?' },
    { id: 's4', title: 'Brandishing / Displaying a Firearm', scenario_text: 'You are in a heated argument. You lift your shirt to reveal your holstered firearm hoping to end the confrontation without firing. Is this legal?' },
  ];

  const STATE_SCENARIO_ANSWERS = {
    s1: {
      AZ: { verdict: 'likely-yes', text: 'Arizona has both Castle Doctrine and Stand Your Ground laws. An unauthorized person forcibly entering your home while you have a reasonable belief of threat to you or your family generally justifies deadly force under A.R.S. § 13-411. No duty to retreat exists inside your home.' },
      TX: { verdict: 'likely-yes', text: 'Texas Penal Code § 9.32 allows deadly force to protect yourself or others from death or serious bodily injury. Inside your home, you have no duty to retreat when attacked or threatened. The forced entry and unknown intent of the intruder would support justification.' },
      CA: { verdict: 'depends', text: 'California has Castle Doctrine (Penal Code § 198.5) creating a presumption of reasonable fear inside your home. Deadly force may be justified, but California does NOT have Stand Your Ground — the circumstances must clearly support a reasonable belief of imminent death or GBH. Courts apply substantial scrutiny.' },
      NY: { verdict: 'depends', text: 'New York has Castle Doctrine but retains duty to retreat in public. Inside your home, you may use deadly force if you reasonably believe the intruder intends to commit a felony or seriously harm someone. However, NY prosecutors are aggressive and the standard is applied strictly.' },
      FL: { verdict: 'likely-yes', text: 'Florida has strong Castle Doctrine (F.S. § 776.013) and Stand Your Ground (F.S. § 776.012). A forcible entry creates a presumption that you held a reasonable fear of imminent death or great bodily harm. Deadly force would likely be justified.' },
    },
    s2: {
      AZ: { verdict: 'likely-no', text: 'Arizona does not authorize deadly force solely to protect property. Under A.R.S. § 13-408, force (not deadly force) may be used to prevent theft. Shooting someone running away with your property — who poses no personal physical threat — would not be justified and could result in criminal charges.' },
      TX: { verdict: 'likely-no', text: 'Texas Penal Code § 9.42 allows deadly force to prevent theft — but only at NIGHTTIME, and only when you reasonably believe that lesser force is inadequate. Even in Texas, shooting someone running away with property in daylight is legally risky and has resulted in prosecutions.' },
      CA: { verdict: 'likely-no', text: 'California law does not permit deadly force to protect property. Shooting a fleeing thief would almost certainly result in murder or manslaughter charges.' },
      NY: { verdict: 'likely-no', text: 'New York law is clear: deadly force cannot be used solely to protect property. Shooting a fleeing thief would result in serious felony charges.' },
      FL: { verdict: 'likely-no', text: 'Florida\'s Stand Your Ground law applies to personal safety, not property. Shooting a fleeing thief with no personal threat would not be protected and could result in manslaughter charges.' },
    },
    s3: {
      AZ: { verdict: 'likely-no', text: 'Warning shots are legally problematic in Arizona. Firing a gun in public may violate A.R.S. § 13-2904 (disorderly conduct) or § 13-1203 (assault). Deadly force is only justified when you reasonably believe it is immediately necessary — a verbal threat alone rarely meets this standard.' },
      TX: { verdict: 'likely-no', text: 'Warning shots are not explicitly authorized under Texas self-defense law. Discharging a firearm at someone without full justification for deadly force exposes you to criminal liability. Texas courts have found warning shots to be evidence of unlawful use of force.' },
      CA: { verdict: 'likely-no', text: 'Warning shots in California are illegal in most circumstances. Penal Code § 246.3 makes it a crime to willfully discharge a firearm in a grossly negligent manner. Additionally, discharging toward the ground creates ricochet risk and is treated seriously.' },
      FL: { verdict: 'likely-no', text: 'Warning shots are legally complicated in Florida. Aggravated assault statutes have been applied to warning shot situations. The famous Marissa Alexander case, though ultimately overturned, illustrated this risk. Warning shots should be avoided.' },
      NY: { verdict: 'likely-no', text: 'Warning shots are illegal in New York in virtually all circumstances. Discharging a firearm in public — even away from people — constitutes reckless endangerment and other charges.' },
    },
    s4: {
      AZ: { verdict: 'likely-no', text: 'Arizona A.R.S. § 13-2904 and § 13-1202 may apply to brandishing. Exposing a weapon to intimidate, even without pointing it, can constitute disorderly conduct with a weapon or threatening or intimidating. Context matters, but it is a legally risky action.' },
      TX: { verdict: 'likely-no', text: 'Texas Penal Code § 42.01(8) makes it a crime to display a firearm in a public place in a manner calculated to alarm. "Flashing" your gun in an argument can result in disorderly conduct charges.' },
      CA: { verdict: 'likely-no', text: 'California Penal Code § 417 (brandishing a weapon) specifically makes it illegal to exhibit or display a firearm in a threatening manner. This applies even to arguments without a fight — it is a misdemeanor or felony depending on context.' },
      FL: { verdict: 'likely-no', text: 'Florida Statute § 790.10 prohibits exhibiting a firearm in a rude, careless, angry, or threatening manner. Displaying a firearm during an argument falls squarely within this statute and constitutes a first-degree misdemeanor.' },
      NY: { verdict: 'likely-no', text: 'New York has extremely strict laws on displaying firearms. Menacing with a weapon (Penal Law § 120.14) applies to displaying a firearm to intimidate. Combined with NYC\'s firearm regulations, this could result in serious felony charges.' },
    },
  };

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  let state = {
    apiUrl:     '',
    memberId:   '',
    memberName: '',
    view:       'catalog',        // catalog | lesson | quiz | legal | leaderboard | certs
    activeCourseId: null,
    activeLessonId: null,
    activeLesson:   null,         // full lesson object (with content_html) for the open lesson
    courses:    [],
    lessonsByCourse: {},          // { courseId: [lessonRow, ...] } — real API lessons, flattened across modules in order
    progress:   {},               // { lessonId: { completed, bestScore } }
    stats:      { total_points: 0, current_streak: 0, lessons_completed: 0, courses_completed: 0 },
    leaderboard: { weekly: [], allTime: [] },
    certificates: [],
    quizState: null,              // { questions, answers: {qId: aId}, submitted, feedback }
    legalState: { stateCode: null, stateLaw: null },
    lessonStartTime: null,
    lessonReadPct: 0,
    root: null,
  };

  // -------------------------------------------------------------------------
  // API helpers
  // -------------------------------------------------------------------------
  async function api(path, opts = {}) {
    if (!state.apiUrl) return null;
    try {
      const res = await fetch(state.apiUrl + path, {
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
        ...opts,
      });
      return res.ok ? res.json() : null;
    } catch { return null; }
  }

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------
  async function loadCourses() {
    const data = await api('/api/guniq/courses');
    state.courses = (data && data.courses) || DEMO_COURSES;
    return state.courses;
  }

  // Load a course's modules → lessons from the real API and flatten them into a
  // single ordered lesson list. Mirrors loadCourses()'s graceful-fallback style:
  // only falls back to demo data when there is no API configured (offline).
  async function loadCourseLessons(courseId) {
    if (!state.apiUrl) {
      state.lessonsByCourse[courseId] = getDemoLessonsForCourse(courseId);
      return state.lessonsByCourse[courseId];
    }
    const detail  = await api(`/api/guniq/courses/${courseId}`);
    const modules = (detail && detail.modules)
      ? detail.modules.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      : null;
    if (!modules) {                       // API genuinely unreachable → offline fallback
      state.lessonsByCourse[courseId] = getDemoLessonsForCourse(courseId);
      return state.lessonsByCourse[courseId];
    }
    const perModule = await Promise.all(modules.map(m =>
      api(`/api/guniq/modules/${m.id}/lessons`).then(r => {
        const lessons = (r && r.lessons)
          ? r.lessons.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          : [];
        // tag courseId so getCourseProgress() / lesson rows can resolve their course
        return lessons.map(l => ({ ...l, courseId }));
      })
    ));
    state.lessonsByCourse[courseId] = perModule.flat();   // module order preserved, lessons in sort_order
    return state.lessonsByCourse[courseId];
  }

  // Open a course: set it active, render immediately (shows "Lessons loading…"
  // while the array is undefined), then fetch real lessons and re-render.
  async function openCourse(courseId) {
    state.activeCourseId = courseId;
    state.view = 'catalog';                               // also covers opening from the sidebar course nav
    render();                                             // in-flight: lessonsByCourse[courseId] is undefined
    if (!state.lessonsByCourse[courseId]) {
      await loadCourseLessons(courseId);
    }
    if (state.activeCourseId === courseId) render();      // settled: rows, or distinct empty state
  }

  // Render the lesson list for a course, distinguishing "loading" (fetch in
  // flight → array undefined) from "loaded but empty" (distinct error state).
  function renderLessonList(courseId) {
    const lessons = state.lessonsByCourse[courseId];
    if (Array.isArray(lessons)) {
      if (lessons.length) return lessons.map((l, i) => buildLessonListRow(l, i + 1)).join('');
      return '<p style="color:var(--fpr-gray-400);font-size:14px">No lessons are available for this course yet. Please try again later.</p>';
    }
    return '<p style="color:var(--fpr-gray-400);font-size:14px">Lessons loading…</p>';
  }

  async function loadProgress() {
    if (!state.memberId) return;
    const data = await api(`/api/guniq/member/${state.memberId}/progress`);
    if (!data) return;
    if (data.stats)   state.stats = data.stats;
    if (data.lessonProgress) {
      data.lessonProgress.forEach(lp => {
        state.progress[lp.lesson_id] = { completed: !!lp.completed_at, bestScore: lp.best_score };
      });
    }
  }

  async function loadLeaderboard() {
    const data = await api('/api/guniq/leaderboard');
    if (data) state.leaderboard = data;
  }

  async function loadCertificates() {
    const data = await api(`/api/guniq/member/${state.memberId}/certificates`);
    if (data) state.certificates = data.certificates || [];
  }

  async function lookupZip(zip) {
    const data = await api(`/api/guniq/legal/zip/${zip}`);
    if (data) {
      state.legalState.stateCode = data.stateCode;
      state.legalState.stateLaw  = data.stateLaw;
    }
    return data;
  }

  // -------------------------------------------------------------------------
  // Rendering — top-level
  // -------------------------------------------------------------------------
  function render() {
    const root = state.root;
    root.innerHTML = '';
    root.appendChild(buildShell());
  }

  function buildShell() {
    const shell = el('div', 'fpr-guniq__shell');
    shell.appendChild(buildTopbar());
    shell.appendChild(buildSidebarLeft());
    shell.appendChild(buildMain());
    shell.appendChild(buildSidebarRight());
    return shell;
  }

  // ——— Topbar ———
  function buildTopbar() {
    const bar = el('div', 'fpr-guniq__topbar');
    bar.innerHTML = `
      <div class="fpr-guniq__topbar-logo">FPRMembers.com</div>
      <div class="fpr-guniq__topbar-divider"></div>
      <div class="fpr-guniq__topbar-title">Increase Your Gun IQ</div>
      <div class="fpr-guniq__streak-badge">${ICONS.fire} ${state.stats.current_streak || 0}-Day Streak</div>
      <div class="fpr-guniq__topbar-pts">${icon('star')} <span>${(state.stats.total_points || 0).toLocaleString()}</span> pts</div>
    `;
    return bar;
  }

  // ——— Left Sidebar ———
  function buildSidebarLeft() {
    const sb = el('div', 'fpr-guniq__sidebar-left');
    sb.innerHTML = `
      <div class="fpr-guniq__sidebar-heading">Navigation</div>
      <div class="fpr-guniq__nav">
        <button class="fpr-guniq__nav-tab${state.view === 'catalog' || state.view === 'lesson' || state.view === 'quiz' ? ' --active' : ''}" data-view="catalog">
          ${ICONS.target} My Learning
        </button>
        <button class="fpr-guniq__nav-tab${state.view === 'legal' ? ' --active' : ''}" data-view="legal">
          ${ICONS.map} Legal Lookup
        </button>
        <button class="fpr-guniq__nav-tab${state.view === 'leaderboard' ? ' --active' : ''}" data-view="leaderboard">
          ${ICONS.trophy} Leaderboard
        </button>
        <button class="fpr-guniq__nav-tab${state.view === 'certs' ? ' --active' : ''}" data-view="certs">
          ${ICONS.cert} My Certificates
        </button>
      </div>

      <div class="fpr-guniq__sidebar-heading">Courses</div>
      <div class="fpr-guniq__course-list">
        ${state.courses.map(c => buildCourseListItem(c)).join('')}
      </div>
    `;

    sb.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    sb.querySelectorAll('.fpr-guniq__course-item').forEach(item => {
      item.addEventListener('click', () => {
        loadLeaderboard();                 // switchView used to refresh this; preserve it
        openCourse(item.dataset.courseId); // load real lessons (was: bare activeCourseId + render)
      });
    });

    return sb;
  }

  function buildCourseListItem(course) {
    const pct   = getCourseProgress(course.id);
    const done  = pct >= 100;
    return `
      <div class="fpr-guniq__course-item${state.activeCourseId === course.id ? ' --active' : ''}" data-course-id="${course.id}">
        <div class="fpr-guniq__course-item-header">
          <div class="fpr-guniq__course-icon">${ICONS[course.icon_name] || ICONS.shield}</div>
          <div class="fpr-guniq__course-name">${esc(course.title)}</div>
        </div>
        <div class="fpr-guniq__course-progress-bar">
          <div class="fpr-guniq__course-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="fpr-guniq__course-progress-label">
          <span>${done ? '✓ Complete' : `${Math.round(pct)}%`}</span>
          <span>${course.estimated_mins || '?'} min</span>
        </div>
      </div>
    `;
  }

  // ——— Main panel ———
  function buildMain() {
    const main = el('div', 'fpr-guniq__main');
    if (state.view === 'catalog')      main.appendChild(buildCatalog());
    else if (state.view === 'lesson')  main.appendChild(buildLessonView());
    else if (state.view === 'quiz')    main.appendChild(buildQuizView());
    else if (state.view === 'legal')   main.appendChild(buildLegalView());
    else if (state.view === 'leaderboard') main.appendChild(buildLeaderboardView());
    else if (state.view === 'certs')   main.appendChild(buildCertsView());
    return main;
  }

  function buildCatalog() {
    const wrap = el('div', 'fpr-guniq__catalog');
    const activeCourse = state.courses.find(c => c.id === state.activeCourseId);

    if (activeCourse) {
      wrap.innerHTML = `
        <button class="fpr-guniq__back-btn" id="fpr-back-catalog">${ICONS.arrow} All Courses</button>
        <h2 class="fpr-guniq__catalog-heading" style="margin-top:16px">${esc(activeCourse.title)}</h2>
        <p class="fpr-guniq__catalog-sub">${esc(activeCourse.subtitle || '')}</p>
        <div class="fpr-guniq__lesson-list-view">
          ${renderLessonList(activeCourse.id)}
        </div>
      `;
      wrap.querySelector('#fpr-back-catalog')?.addEventListener('click', () => {
        state.activeCourseId = null;
        render();
      });
      wrap.querySelectorAll('[data-lesson-id]').forEach(btn => {
        btn.addEventListener('click', () => openLesson(btn.dataset.lessonId));
      });
    } else {
      wrap.innerHTML = `
        <h2 class="fpr-guniq__catalog-heading">Your Learning Center</h2>
        <p class="fpr-guniq__catalog-sub">Choose a course to begin. Complete all 5 to earn your Gun IQ Diploma.</p>
        <div class="fpr-guniq__catalog-grid">
          ${state.courses.map(c => buildCatalogCard(c)).join('')}
        </div>
      `;
      wrap.querySelectorAll('.fpr-guniq__catalog-card').forEach(card => {
        card.addEventListener('click', () => {
          openCourse(card.dataset.courseId);
        });
      });
    }
    return wrap;
  }

  function buildCatalogCard(course) {
    const pct  = getCourseProgress(course.id);
    const done = pct >= 100;
    return `
      <div class="fpr-guniq__catalog-card" data-course-id="${course.id}">
        <div class="fpr-guniq__catalog-card-icon">${ICONS[course.icon_name] || ICONS.shield}</div>
        <div class="fpr-guniq__catalog-card-title">${esc(course.title)}</div>
        <div class="fpr-guniq__catalog-card-sub">${esc(course.subtitle || '')}</div>
        <div class="fpr-guniq__catalog-card-meta">
          <span>${ICONS.clock} ${course.estimated_mins || '?'} min</span>
          <span>${ICONS.star} ${course.points_on_complete || 50} pts</span>
        </div>
        <div class="fpr-guniq__catalog-card-progress">
          <div class="fpr-guniq__catalog-card-pbar">
            <div class="fpr-guniq__catalog-card-pfill" style="width:${pct}%"></div>
          </div>
          ${done
            ? `<div class="fpr-guniq__complete-badge">${ICONS.check} Complete</div>`
            : `<div class="fpr-guniq__catalog-card-plabel">${Math.round(pct)}% complete</div>`
          }
        </div>
      </div>
    `;
  }

  function buildLessonListRow(lesson, num) {
    const prog = state.progress[lesson.id];
    const done = prog && prog.completed;
    return `
      <div class="fpr-guniq__catalog-card" data-lesson-id="${lesson.id}" style="display:flex;align-items:center;gap:14px;padding:14px 18px;cursor:pointer;margin-bottom:8px">
        <div style="width:32px;height:32px;border-radius:50%;background:${done ? 'var(--fpr-green-mid)' : 'var(--fpr-gray-200)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${done ? '#fff' : 'var(--fpr-gray-400)'};font-weight:800;font-size:13px">
          ${done ? ICONS.check : num}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;color:var(--fpr-gray-900)">${esc(lesson.title)}</div>
          <div style="font-size:12px;color:var(--fpr-gray-400);margin-top:2px">${lesson.estimated_mins} min · ${lesson.points_value} pts${prog && prog.bestScore ? ` · Best quiz: ${Math.round(prog.bestScore)}%` : ''}</div>
        </div>
        <div style="font-size:12px;font-weight:600;color:var(--fpr-gray-400)">${done ? '<span style="color:var(--fpr-green-mid)">Done</span>' : 'Start →'}</div>
      </div>
    `;
  }

  // ——— Lesson view ———
  function buildLessonView() {
    const lesson = (state.activeLesson && state.activeLesson.id === state.activeLessonId)
      ? state.activeLesson
      : getDemoLesson(state.activeLessonId);
    if (!lesson) return buildCatalog();

    const wrapper = el('div', 'fpr-guniq__lesson-view');
    wrapper.innerHTML = `
      <div class="fpr-guniq__lesson-topbar">
        <button class="fpr-guniq__back-btn" id="fpr-lesson-back">${ICONS.arrow} Back</button>
        <div class="fpr-guniq__lesson-breadcrumb"><strong>${esc(lesson.title)}</strong></div>
        <div class="fpr-guniq__lesson-timer">${ICONS.clock} ${lesson.estimated_mins} min</div>
      </div>
      <div class="fpr-guniq__lesson-body fpr-guniq__prose" id="fpr-lesson-body">
        ${lesson.content_html}
      </div>
      <div class="fpr-guniq__lesson-footer">
        <div class="fpr-guniq__lesson-progress-track">
          <div class="fpr-guniq__lesson-progress-fill" id="fpr-read-progress" style="width:0%"></div>
        </div>
        <button class="fpr-btn fpr-btn--primary" id="fpr-lesson-quiz-btn" disabled>Take Quiz</button>
      </div>
    `;

    // Track scroll progress → unlock quiz button
    const body     = wrapper.querySelector('#fpr-lesson-body');
    const progFill = wrapper.querySelector('#fpr-read-progress');
    const quizBtn  = wrapper.querySelector('#fpr-lesson-quiz-btn');
    state.lessonStartTime = Date.now();

    body.addEventListener('scroll', () => {
      const pct = Math.min(100, Math.round((body.scrollTop / (body.scrollHeight - body.clientHeight)) * 100) || 0);
      progFill.style.width = pct + '%';
      if (pct >= 80) quizBtn.disabled = false;
    });

    // Auto-unlock after 15s (for short content)
    setTimeout(() => { quizBtn.disabled = false; }, 15000);

    wrapper.querySelector('#fpr-lesson-back')?.addEventListener('click', () => {
      state.view = 'catalog';
      render();
    });

    quizBtn.addEventListener('click', () => openQuiz(lesson));
    return wrapper;
  }

  // ——— Quiz view ———
  function buildQuizView() {
    const qs = state.quizState;
    if (!qs) return buildCatalog();

    if (qs.loading) {
      const loading = el('div', 'fpr-guniq__quiz');
      loading.innerHTML = `<p style="color:var(--fpr-gray-400);font-size:14px;padding:24px 0">Loading quiz…</p>`;
      return loading;
    }

    if (qs.submitted) return buildQuizResults(qs);

    const wrap = el('div', 'fpr-guniq__quiz');
    wrap.innerHTML = `
      <div class="fpr-guniq__quiz-header">
        <h2 class="fpr-guniq__quiz-heading">Knowledge Check</h2>
        <div class="fpr-guniq__quiz-counter">${qs.questions.length} Question${qs.questions.length !== 1 ? 's' : ''}</div>
      </div>
      ${qs.questions.map((q, qi) => buildQuestion(q, qi)).join('')}
      <div style="display:flex;gap:10px;margin-top:24px">
        <button class="fpr-btn fpr-btn--secondary" id="fpr-quiz-back">${ICONS.arrow} Back to Lesson</button>
        <button class="fpr-btn fpr-btn--primary" id="fpr-quiz-submit" disabled>Submit Answers</button>
      </div>
    `;

    wrap.querySelector('#fpr-quiz-back')?.addEventListener('click', () => {
      state.view = 'lesson';
      state.quizState = null;
      render();
    });

    const submitBtn = wrap.querySelector('#fpr-quiz-submit');

    wrap.querySelectorAll('.fpr-guniq__answer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = btn.dataset.questionId;
        const aId = btn.dataset.answerId;
        state.quizState.answers[qId] = aId;

        // Update UI for this question
        wrap.querySelectorAll(`[data-question-id="${qId}"]`).forEach(b => {
          b.classList.toggle('--selected', b.dataset.answerId === aId);
        });

        // Enable submit if all answered
        const allAnswered = qs.questions.every(q => qs.answers[q.id]);
        submitBtn.disabled = !allAnswered;
      });
    });

    submitBtn.addEventListener('click', () => submitQuiz(qs));
    return wrap;
  }

  function buildQuestion(q, idx) {
    const letters = ['A', 'B', 'C', 'D'];
    return `
      <div class="fpr-guniq__question">
        <div class="fpr-guniq__question-text">${idx + 1}. ${esc(q.question_text)}</div>
        <div class="fpr-guniq__answer-list">
          ${(q.answers || []).map((a, ai) => `
            <button class="fpr-guniq__answer-btn" data-question-id="${q.id}" data-answer-id="${a.id}">
              <div class="fpr-guniq__answer-indicator">${letters[ai] || ai + 1}</div>
              ${esc(a.answer_text)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function buildQuizResults(qs) {
    const correct = qs.feedback.filter(f => f.yourAnswer === f.correctAnswer).length;
    const total   = qs.feedback.length;
    const pct     = total ? Math.round((correct / total) * 100) : 0;
    const passed  = pct >= 70;
    if (passed) { window.fprAwardTicket('quiz_completed', { score: pct }); }
    const radius  = 50;
    const circ    = 2 * Math.PI * radius;
    const offset  = circ - (pct / 100) * circ;

    const wrap = el('div', 'fpr-guniq__quiz fpr-guniq__quiz-result');
    wrap.innerHTML = `
      <div class="fpr-guniq__score-ring">
        <svg viewBox="0 0 120 120">
          <circle class="ring-bg" cx="60" cy="60" r="${radius}" />
          <circle class="ring-fill${passed ? ' --pass' : ''}" cx="60" cy="60" r="${radius}"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}" />
        </svg>
        <div class="fpr-guniq__score-label">
          <div class="fpr-guniq__score-pct">${pct}%</div>
          <div class="fpr-guniq__score-sub">${correct}/${total}</div>
        </div>
      </div>

      <h2 class="fpr-guniq__result-heading">${passed ? '🎉 Nice Work!' : '📖 Review & Try Again'}</h2>
      <p class="fpr-guniq__result-sub">
        ${passed
          ? `You passed! ${qs.bonusPoints > 0 ? `+${qs.bonusPoints} bonus points earned.` : ''}`
          : 'Score 70% or higher to pass. Re-read the lesson and try again.'}
      </p>

      <div style="text-align:left;max-width:500px;margin:0 auto 24px">
        ${qs.feedback.map(f => {
          const wasCorrect = f.yourAnswer === f.correctAnswer;
          return `
            <div style="margin-bottom:16px">
              <div style="font-size:14px;font-weight:700;color:var(--fpr-gray-900);margin-bottom:6px">${esc(f.questionText)}</div>
              <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:${wasCorrect ? 'var(--fpr-green-muted)' : 'var(--fpr-red-muted)'}">
                <span style="color:${wasCorrect ? 'var(--fpr-green)' : 'var(--fpr-red)'};">${wasCorrect ? ICONS.check : ICONS.x}</span>
                <span style="font-size:13px;color:${wasCorrect ? 'var(--fpr-green)' : 'var(--fpr-red)'}">
                  ${esc((f.answers || []).find(a => a.id === (wasCorrect ? f.correctAnswer : f.yourAnswer))?.answer_text || 'Your answer')}
                </span>
              </div>
              ${!wasCorrect ? `<div style="margin-top:6px;padding:8px 12px;background:var(--fpr-green-muted);border-radius:8px;font-size:13px;color:var(--fpr-green)">
                ${ICONS.check} Correct: ${esc((f.answers || []).find(a => a.id === f.correctAnswer)?.answer_text || '')}
              </div>` : ''}
              ${f.explanation ? `<div class="fpr-guniq__explanation">${esc(f.explanation)}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        ${!passed ? `<button class="fpr-btn fpr-btn--secondary" id="fpr-retake-btn">${ICONS.arrow} Try Again</button>` : ''}
        <button class="fpr-btn fpr-btn--dark" id="fpr-next-btn">${passed ? 'Next Lesson →' : 'Review Lesson'}</button>
        ${passed ? `<button class="fpr-btn fpr-btn--primary" id="fpr-cert-btn">${ICONS.cert} View Certificate</button>` : ''}
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <button onclick="FPRShare.open('Share Your Score')" style="display:inline-flex;align-items:center;gap:6px;background:#E5B657;color:#0F1923;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share Your Score
        </button>
      </div>
    `;

    wrap.querySelector('#fpr-retake-btn')?.addEventListener('click', () => {
      state.quizState = { ...state.quizState, answers: {}, submitted: false, feedback: [] };
      render();
    });

    wrap.querySelector('#fpr-next-btn')?.addEventListener('click', () => {
      if (!passed) { state.view = 'lesson'; state.quizState = null; }
      else { state.view = 'catalog'; state.quizState = null; }
      render();
    });

    wrap.querySelector('#fpr-cert-btn')?.addEventListener('click', () => {
      openCertificateModal({ type: 'course', courseTitle: 'Gun Safety Fundamentals' });
    });

    return wrap;
  }

  // ——— Legal view ———
  function buildLegalView() {
    const wrap   = el('div', 'fpr-guniq__legal');
    const sc     = state.legalState.stateCode;
    const sl     = state.legalState.stateLaw;

    wrap.innerHTML = `
      <h2 class="fpr-guniq__legal-heading">Local Law Mode</h2>
      <p class="fpr-guniq__legal-sub">Enter your zip code to see how firearm laws apply in your state — then explore real legal scenarios.</p>
      <div class="fpr-disclaimer">⚠️ For informational and educational purposes only. Always follow local laws and consult a qualified attorney for legal advice specific to your situation.</div>

      <div class="fpr-guniq__zip-row">
        <input type="text" class="fpr-guniq__zip-input" id="fpr-zip-input" placeholder="Enter ZIP code" maxlength="10" value="${sc ? '' : ''}">
        <button class="fpr-guniq__zip-submit" id="fpr-zip-btn">Look Up My State</button>
      </div>

      ${sc ? buildStateSummary(sc, sl) : ''}

      <div style="margin-top:24px">
        <h3 style="font-size:16px;font-weight:700;margin:0 0 14px;color:var(--fpr-gray-900)">Legal Scenarios</h3>
        ${sc ? '' : '<p style="font-size:13px;color:var(--fpr-gray-500);margin-bottom:14px">Enter your zip code above to see state-specific answers.</p>'}
        <div class="fpr-guniq__scenario-list" id="fpr-scenario-list">
          ${DEMO_LEGAL_SCENARIOS.map(sc2 => buildScenarioCard(sc2, sc)).join('')}
        </div>
      </div>
    `;

    wrap.querySelector('#fpr-zip-btn')?.addEventListener('click', async () => {
      const zip = wrap.querySelector('#fpr-zip-input').value.trim();
      if (zip.length < 5) return showToast('Please enter a valid zip code.', 'gold');
      showToast('Looking up your state…', 'gold');
      const data = await lookupZip(zip);
      if (data) { showToast(`State: ${data.stateCode}`, 'success'); render(); }
      else {
        // Demo fallback
        state.legalState.stateCode = zip.startsWith('8') ? 'AZ' : zip.startsWith('7') ? 'TX' : zip.startsWith('9') ? 'CA' : zip.startsWith('1') ? 'NY' : 'FL';
        state.legalState.stateLaw  = null;
        showToast(`State set to ${state.legalState.stateCode} (demo mode)`, 'success');
        render();
      }
    });

    wrap.querySelectorAll('.fpr-guniq__scenario-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const card = hdr.closest('.fpr-guniq__scenario-card');
        card.classList.toggle('--open');
      });
    });

    return wrap;
  }

  function buildStateSummary(stateCode, law) {
    const chips = [
      { label: 'Stand Your Ground', val: law ? law.stand_your_ground : true },
      { label: 'Castle Doctrine',   val: law ? law.castle_doctrine   : true },
      { label: 'Duty to Retreat',   val: law ? law.duty_to_retreat   : false },
      { label: 'Open Carry',        val: law ? law.open_carry_legal  : true },
      { label: 'Red Flag Law',      val: law ? law.red_flag_law      : false },
    ];
    return `
      <div style="margin-bottom:16px">
        <div class="fpr-guniq__state-chip" style="margin-bottom:12px">${ICONS.map} ${stateCode} State Laws</div>
        <div class="fpr-guniq__law-grid">
          ${chips.map(c => `
            <div class="fpr-guniq__law-chip ${c.val ? '--yes' : '--no'}">
              ${c.val ? ICONS.check : ICONS.x} ${c.label}: ${c.val ? 'Yes' : 'No'}
            </div>
          `).join('')}
          ${law ? `<div class="fpr-guniq__law-chip --neutral">${ICONS.lock} CC: ${law.concealed_carry || 'shall-issue'}</div>` : ''}
        </div>
      </div>
    `;
  }

  function buildScenarioCard(scenario, stateCode) {
    const answers   = STATE_SCENARIO_ANSWERS[scenario.id] || {};
    const stateAns  = stateCode ? (answers[stateCode] || null) : null;

    return `
      <div class="fpr-guniq__scenario-card" data-scenario-id="${scenario.id}">
        <div class="fpr-guniq__scenario-header">
          <div class="fpr-guniq__scenario-title">${esc(scenario.title)}</div>
          <div class="fpr-guniq__scenario-chevron">${ICONS.chevron}</div>
        </div>
        <div class="fpr-guniq__scenario-body">
          <div class="fpr-guniq__scenario-situation">${esc(scenario.scenario_text)}</div>
          ${stateAns ? `
            <div class="fpr-guniq__scenario-verdict --${stateAns.verdict}">
              ${stateAns.verdict === 'likely-yes' ? ICONS.check + ' Likely Legal in ' + stateCode : stateAns.verdict === 'likely-no' ? ICONS.x + ' Likely Not Legal in ' + stateCode : '⚠️ Depends on Circumstances in ' + stateCode}
            </div>
            <div class="fpr-guniq__scenario-answer">${esc(stateAns.text)}</div>
          ` : !stateCode ? `<p style="font-size:13px;color:var(--fpr-gray-500)">Enter your zip code to see the answer for your state.</p>` : `<p style="font-size:13px;color:var(--fpr-gray-500)">Detailed answer for your state coming soon. Consult a local firearms attorney.</p>`}
          <div class="fpr-disclaimer" style="margin-top:12px">⚠️ For informational and educational purposes only. Always follow local laws and consult a qualified attorney for legal advice.</div>
        </div>
      </div>
    `;
  }

  // ——— Leaderboard view ———
  function buildLeaderboardView() {
    const wrap = el('div', 'fpr-guniq__leaderboard-view');
    const demo = [
      { display_name: 'BobM_AZ', points: 2840, current_streak: 22, courses_completed: 4, certificates_earned: 4 },
      { display_name: 'SarahK',  points: 2310, current_streak: 15, courses_completed: 3, certificates_earned: 3 },
      { display_name: 'Mike_TX', points: 1990, current_streak: 8,  courses_completed: 3, certificates_earned: 2 },
      { display_name: 'JaneDoe', points: 1650, current_streak: 5,  courses_completed: 2, certificates_earned: 2 },
      { member_id: state.memberId, display_name: state.memberName || 'You', points: state.stats.total_points || 650, current_streak: state.stats.current_streak || 3, courses_completed: state.stats.courses_completed || 1, certificates_earned: state.stats.certificates_earned || 0 },
      { display_name: 'GunnerP', points: 420,  current_streak: 2,  courses_completed: 1, certificates_earned: 1 },
    ].sort((a, b) => b.points - a.points);

    const ranks = ['🥇', '🥈', '🥉'];

    wrap.innerHTML = `
      <h2 style="font-size:22px;font-weight:800;margin:0 0 6px;color:var(--fpr-gray-900)">Leaderboard</h2>
      <p style="font-size:14px;color:var(--fpr-gray-500);margin:0 0 20px">Top Gun IQ earners this week. Earn points by completing lessons, passing quizzes, and sharing your certificates.</p>

      <div class="fpr-guniq__lb-tabs" style="margin-bottom:20px">
        <button class="fpr-guniq__lb-tab --active">Weekly</button>
        <button class="fpr-guniq__lb-tab">All Time</button>
      </div>

      <div>
        ${demo.map((row, i) => {
          const isYou = row.member_id === state.memberId || row.display_name === (state.memberName || 'You');
          return `
            <div class="fpr-guniq__lb-row${isYou ? ' --you' : ''}">
              <div class="fpr-guniq__lb-rank${i === 0 ? ' --gold' : i === 1 ? ' --silver' : i === 2 ? ' --bronze' : ''}">${ranks[i] || '#' + (i + 1)}</div>
              <div class="fpr-guniq__lb-avatar">${(row.display_name || 'U').slice(0, 2).toUpperCase()}</div>
              <div class="fpr-guniq__lb-info">
                <div class="fpr-guniq__lb-name">${esc(row.display_name)}${isYou ? ' <span style="font-size:10px;background:var(--fpr-gold-muted);color:var(--fpr-gold);padding:2px 6px;border-radius:99px;font-weight:700">YOU</span>' : ''}</div>
                <div class="fpr-guniq__lb-meta">${ICONS.fire} ${row.current_streak}d streak · ${row.courses_completed} courses · ${row.certificates_earned} certs</div>
              </div>
              <div class="fpr-guniq__lb-pts">${(row.points || 0).toLocaleString()} pts</div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top:24px;padding:16px;background:var(--fpr-gold-muted);border-radius:var(--fpr-radius);border:1px solid rgba(201,151,58,.2)">
        <div style="font-size:13px;font-weight:700;color:var(--fpr-gray-900);margin-bottom:6px">${ICONS.star} How to Earn Points</div>
        <div style="font-size:12px;color:var(--fpr-gray-700);line-height:1.7">
          Complete a lesson: <b>10 pts</b> · Quiz bonus (70%+): <b>5–15 pts</b> · Complete a course: <b>50 pts</b> · 7-day streak: <b>50 pts</b> · 30-day streak: <b>200 pts</b> · Share a certificate: <b>25 pts</b>
        </div>
      </div>
    `;
    return wrap;
  }

  // ——— Certificates view ———
  function buildCertsView() {
    const wrap = el('div', 'fpr-guniq__certs-view');
    wrap.innerHTML = `
      <h2 style="font-size:22px;font-weight:800;margin:0 0 6px;color:var(--fpr-gray-900)">My Certificates</h2>
      <p style="font-size:14px;color:var(--fpr-gray-500);margin:0 0 24px">Earn a certificate for each completed course. Earn your Diploma by completing all 5.</p>

      <div class="fpr-guniq__cert-list">
        ${buildDemoCertCard('Gun Safety Fundamentals', 'FPR-2026-GS4X9K', 'course')}
        ${buildLockedCertCard('How to Shoot')}
        ${buildLockedCertCard('Firearm Parts & Anatomy')}
        ${buildLockedCertCard('Types of Firearms')}
        ${buildLockedCertCard('Legal Scenarios')}
        ${buildDiplomaTeaserCard()}
      </div>
    `;

    wrap.querySelectorAll('[data-cert-download]').forEach(btn => {
      btn.addEventListener('click', () => {
        openCertificateModal({ type: btn.dataset.certType || 'course', courseTitle: btn.dataset.certTitle, certId: btn.dataset.certId });
      });
    });

    wrap.querySelectorAll('[data-cert-share]').forEach(btn => {
      btn.addEventListener('click', () => {
        openShareDialog(btn.dataset.certTitle, btn.dataset.certId);
      });
    });

    return wrap;
  }

  function buildDemoCertCard(courseTitle, certId, type) {
    return `
      <div class="fpr-guniq__cert-card">
        <div class="fpr-guniq__cert-top">
          <div class="fpr-guniq__cert-brand">FPRMembers.com</div>
          <div class="fpr-guniq__cert-type-badge">${type === 'diploma' ? 'Diploma' : 'Certificate'}</div>
        </div>
        <div class="fpr-guniq__cert-title">Certificate of Completion</div>
        <div class="fpr-guniq__cert-course">${esc(courseTitle)}</div>
        <div class="fpr-guniq__cert-id">${certId}</div>
        <div class="fpr-guniq__cert-actions">
          <button class="fpr-guniq__cert-btn --download" data-cert-download data-cert-title="${esc(courseTitle)}" data-cert-id="${certId}" data-cert-type="${type}">
            ${ICONS.download} Download
          </button>
          <button class="fpr-guniq__cert-btn --share" data-cert-share data-cert-title="${esc(courseTitle)}" data-cert-id="${certId}">
            ${ICONS.share} Challenge
          </button>
        </div>
      </div>
    `;
  }

  function buildLockedCertCard(courseTitle) {
    return `
      <div class="fpr-guniq__cert-card" style="opacity:.5">
        <div class="fpr-guniq__cert-top">
          <div class="fpr-guniq__cert-brand">FPRMembers.com</div>
          <div class="fpr-guniq__cert-type-badge">Locked</div>
        </div>
        <div class="fpr-guniq__cert-title">Certificate of Completion</div>
        <div class="fpr-guniq__cert-course">${esc(courseTitle)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:8px;display:flex;align-items:center;gap:6px">${ICONS.lock} Complete the course to unlock</div>
      </div>
    `;
  }

  function buildDiplomaTeaserCard() {
    return `
      <div class="fpr-guniq__cert-card" style="background:linear-gradient(135deg,#7B1E00 0%,#1A2433 100%);grid-column:1/-1;opacity:.6">
        <div class="fpr-guniq__cert-top">
          <div class="fpr-guniq__cert-brand" style="color:#E5B657">FPRMembers.com</div>
          <div class="fpr-guniq__cert-type-badge" style="background:rgba(201,151,58,.25);color:#E5B657">🏆 Diploma</div>
        </div>
        <div class="fpr-guniq__cert-title" style="font-size:13px">GUN IQ MASTERY DIPLOMA</div>
        <div class="fpr-guniq__cert-course">Complete All 5 Courses to Unlock</div>
        <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:8px;line-height:1.5">
          The ultimate credential for responsible firearm owners. Includes a social challenge mechanic to inspire others.
        </div>
      </div>
    `;
  }

  // ——— Right sidebar ———
  function buildSidebarRight() {
    const sb = el('div', 'fpr-guniq__sidebar-right');

    // Streak section
    const streakDays = buildStreakCalendar(state.stats.current_streak || 3);

    sb.innerHTML = `
      <div>
        <div class="fpr-guniq__widget-heading">Your Progress</div>
        <div class="fpr-guniq__stats-grid">
          <div class="fpr-guniq__stat-chip">
            <div class="fpr-guniq__stat-value --gold">${(state.stats.total_points || 0).toLocaleString()}</div>
            <div class="fpr-guniq__stat-label">Points</div>
          </div>
          <div class="fpr-guniq__stat-chip">
            <div class="fpr-guniq__stat-value" style="color:var(--fpr-amber)">${state.stats.current_streak || 0}🔥</div>
            <div class="fpr-guniq__stat-label">Day Streak</div>
          </div>
          <div class="fpr-guniq__stat-chip">
            <div class="fpr-guniq__stat-value">${state.stats.lessons_completed || 0}</div>
            <div class="fpr-guniq__stat-label">Lessons</div>
          </div>
          <div class="fpr-guniq__stat-chip">
            <div class="fpr-guniq__stat-value --green">${state.stats.courses_completed || 0}</div>
            <div class="fpr-guniq__stat-label">Courses</div>
          </div>
        </div>
      </div>

      <div>
        <div class="fpr-guniq__widget-heading">14-Day Activity</div>
        <div class="fpr-guniq__streak-calendar">${streakDays}</div>
      </div>

      <div>
        <div class="fpr-guniq__widget-heading">Top This Week</div>
        <div>
          ${[
            { name: 'BobM_AZ', pts: 840 },
            { name: 'SarahK',  pts: 610 },
            { name: 'Mike_TX', pts: 490 },
            { name: state.memberName || 'You', pts: state.stats.weekly_points || 120 },
          ].sort((a, b) => b.pts - a.pts).map((r, i) => `
            <div class="fpr-guniq__mini-lb-row">
              <div class="fpr-guniq__mini-rank">${['🥇','🥈','🥉','#4'][i]}</div>
              <div class="fpr-guniq__mini-name">${esc(r.name)}</div>
              <div class="fpr-guniq__mini-pts">${r.pts.toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <div class="fpr-guniq__widget-heading">Next Up</div>
        <div style="background:var(--fpr-white);border:1px solid var(--fpr-gray-200);border-radius:var(--fpr-radius);padding:12px;cursor:pointer" id="fpr-next-up">
          <div style="font-size:12px;font-weight:700;color:var(--fpr-gray-900);margin-bottom:4px">Keep Your Finger Off the Trigger</div>
          <div style="font-size:11px;color:var(--fpr-gray-400)">Gun Safety · 5 min · 10 pts</div>
          <div style="margin-top:8px"><button class="fpr-btn fpr-btn--primary fpr-btn--sm" style="width:100%">Continue →</button></div>
        </div>
      </div>
    `;

    sb.querySelector('#fpr-next-up')?.addEventListener('click', () => openLesson('l3'));
    return sb;
  }

  function buildStreakCalendar(currentStreak) {
    const days  = 14;
    const cells = [];
    for (let i = days - 1; i >= 0; i--) {
      const active = i < (currentStreak || 0);
      const today  = i === 0;
      cells.push(`<div class="fpr-guniq__streak-day${active ? ' --active' : ''}${today ? ' --today' : ''}"></div>`);
    }
    return cells.reverse().join('');
  }

  // -------------------------------------------------------------------------
  // Certificate modal
  // -------------------------------------------------------------------------
  function openCertificateModal({ type, courseTitle, certId }) {
    const overlay = el('div', 'fpr-cert-overlay');
    const modal   = el('div', 'fpr-cert-modal');

    const displayId = certId || 'FPR-2026-DEMO01';
    const today     = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const name      = state.memberName || 'Gun IQ Graduate';
    const isDiploma = type === 'diploma';

    modal.innerHTML = `
      <div class="fpr-cert-modal__header">
        <h2 class="fpr-cert-modal__title">${isDiploma ? 'Gun IQ Mastery Diploma' : 'Course Certificate'}</h2>
        <button class="fpr-cert-modal__close" id="fpr-close-cert">✕</button>
      </div>
      <div class="fpr-cert-canvas-wrap">
        <canvas id="fpr-cert-canvas" width="580" height="400"></canvas>
      </div>
      <div class="fpr-cert-modal__footer">
        <button class="fpr-btn fpr-btn--primary" id="fpr-dl-cert">${ICONS.download} Download PNG</button>
        <button class="fpr-btn fpr-btn--dark" id="fpr-share-cert">${ICONS.share} Share & Challenge</button>
        <button class="fpr-btn fpr-btn--secondary" id="fpr-close-cert2">Close</button>
      </div>
      <textarea class="fpr-cert-modal__share-text" id="fpr-share-text" rows="3" readonly></textarea>
      <div class="fpr-cert-modal__share-btns" style="display:none" id="fpr-share-btns">
        <button class="fpr-btn fpr-btn--primary fpr-btn--sm" id="fpr-copy-text">${ICONS.share} Copy Text</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Draw certificate
    setTimeout(() => {
      drawCertificate('fpr-cert-canvas', { name, courseTitle, certId: displayId, date: today, isDiploma });
    }, 50);

    // Populate share text
    const shareText = isDiploma
      ? `🏆 I just earned my FPRMembers.com GUN IQ MASTERY DIPLOMA! I completed all 5 firearm education courses. I challenge you to do the same — become a more educated, responsible gun owner. Start at FPRMembers.com | Certificate: ${displayId}`
      : `🎓 I just earned my FPRMembers.com Gun Safety Certificate for completing "${courseTitle}"! Can you match it? I challenge you to take the Gun IQ quiz at FPRMembers.com | Cert: ${displayId} #GunIQ #ResponsibleGunOwner #FPRMembers`;

    modal.querySelector('#fpr-share-text').value = shareText;

    // Events
    const closeModal = () => overlay.remove();
    modal.querySelector('#fpr-close-cert')?.addEventListener('click', closeModal);
    modal.querySelector('#fpr-close-cert2')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    modal.querySelector('#fpr-dl-cert')?.addEventListener('click', () => {
      const canvas = document.getElementById('fpr-cert-canvas');
      const link   = document.createElement('a');
      link.download = `FPR-GunIQ-Certificate-${displayId}.png`;
      link.href    = canvas.toDataURL('image/png');
      link.click();
      showToast('Certificate downloaded!', 'success');
    });

    modal.querySelector('#fpr-share-cert')?.addEventListener('click', () => {
      const btns = modal.querySelector('#fpr-share-btns');
      btns.style.display = btns.style.display === 'none' ? 'flex' : 'none';
    });

    modal.querySelector('#fpr-copy-text')?.addEventListener('click', () => {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Challenge text copied! Paste it anywhere to share.', 'success');
      });
    });
  }

  function openShareDialog(courseTitle, certId) {
    openCertificateModal({ courseTitle, certId, type: 'course' });
  }

  // -------------------------------------------------------------------------
  // Canvas certificate renderer
  // -------------------------------------------------------------------------
  function drawCertificate(canvasId, { name, courseTitle, certId, date, isDiploma }) {
    const canvas  = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx     = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Background
    ctx.fillStyle = '#0F1923';
    ctx.fillRect(0, 0, W, H);

    // Corner decorations
    const cornerSize = 40;
    ctx.strokeStyle = '#C9973A';
    ctx.lineWidth   = 2;
    const corners = [[12, 12], [W - 12, 12], [12, H - 12], [W - 12, H - 12]];
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (cx < W / 2 ? cornerSize : -cornerSize), cy);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + (cy < H / 2 ? cornerSize : -cornerSize));
      ctx.stroke();
    });

    // Outer border
    ctx.strokeStyle = '#C9973A';
    ctx.lineWidth   = 1;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = 'rgba(201,151,58,.3)';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(26, 26, W - 52, H - 52);

    // Header seal ring
    ctx.beginPath();
    ctx.arc(W / 2, 70, 36, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(201,151,58,.12)';
    ctx.fill();
    ctx.strokeStyle = '#C9973A';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Shield icon (simplified)
    ctx.fillStyle = '#C9973A';
    ctx.font      = '28px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🛡', W / 2, 81);

    // FPRMembers.com
    ctx.fillStyle  = '#E5B657';
    ctx.font       = 'bold 11px Inter, sans-serif';
    ctx.letterSpacing = '0.08em';
    ctx.fillText('FPRMEMBERS.COM', W / 2, 122);

    // Certificate or Diploma label
    ctx.fillStyle  = 'rgba(255,255,255,.4)';
    ctx.font       = '10px Inter, sans-serif';
    ctx.fillText(isDiploma ? 'GUN IQ MASTERY DIPLOMA' : 'CERTIFICATE OF COMPLETION', W / 2, 145);

    // Decorative line
    ctx.strokeStyle = 'rgba(201,151,58,.35)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, 155); ctx.lineTo(W / 2 + 100, 155);
    ctx.stroke();

    // "Awarded to"
    ctx.fillStyle  = 'rgba(255,255,255,.45)';
    ctx.font       = 'italic 12px Georgia, serif';
    ctx.fillText('Awarded to', W / 2, 178);

    // Member name
    ctx.fillStyle  = '#FFFFFF';
    ctx.font       = 'bold 28px Georgia, serif';
    ctx.fillText(name, W / 2, 215);

    // "For successfully completing"
    ctx.fillStyle  = 'rgba(255,255,255,.5)';
    ctx.font       = 'italic 12px Georgia, serif';
    ctx.fillText('for successfully completing', W / 2, 242);

    // Course title
    ctx.fillStyle  = '#E5B657';
    const fontSize = courseTitle && courseTitle.length > 30 ? 15 : 18;
    ctx.font       = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillText(isDiploma ? 'All 5 Gun IQ Courses' : (courseTitle || 'Gun IQ Course'), W / 2, 272);

    // Decorative line
    ctx.strokeStyle = 'rgba(201,151,58,.35)';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 80, 288); ctx.lineTo(W / 2 + 80, 288);
    ctx.stroke();

    // Date
    ctx.fillStyle  = 'rgba(255,255,255,.5)';
    ctx.font       = '11px Inter, sans-serif';
    ctx.fillText(date, W / 2, 310);

    // Certificate ID
    ctx.fillStyle  = 'rgba(255,255,255,.25)';
    ctx.font       = '9px Courier New, monospace';
    ctx.fillText(certId, W / 2, 330);

    // Social challenge text
    ctx.fillStyle  = 'rgba(255,255,255,.35)';
    ctx.font       = 'italic 10px Inter, sans-serif';
    ctx.fillText('Share this certificate and challenge a friend to become more educated.', W / 2, 360);
    ctx.fillText('For informational purposes only. Always follow local laws.', W / 2, 375);
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  function switchView(view) {
    state.view = view;
    render();
    loadLeaderboard();
  }

  async function openLesson(lessonId) {
    state.activeLessonId = lessonId;
    state.view           = 'lesson';
    state.quizState      = null;
    // Seed from the already-loaded lesson list (rows include content_html), else demo.
    const fromList = Object.values(state.lessonsByCourse).flat().find(l => l && l.id === lessonId);
    state.activeLesson = fromList || getDemoLesson(lessonId) || null;
    render();
    api(`/api/guniq/lessons/${lessonId}/start`, { method: 'POST', body: JSON.stringify({ memberId: state.memberId }) });

    // Fetch the authoritative lesson (content_html) and re-render if still viewing it.
    if (state.apiUrl) {
      const data = await api(`/api/guniq/lessons/${lessonId}`);
      if (data && data.lesson) {
        state.activeLesson = { ...(state.activeLesson || {}), ...data.lesson };
        if (state.activeLessonId === lessonId && state.view === 'lesson') render();
      }
    }
  }

  async function openQuiz(lesson) {
    state.view = 'quiz';
    // Offline/demo: questions are embedded on the lesson object (with correctId).
    if (!state.apiUrl) {
      state.quizState = {
        lessonId: lesson.id, questions: lesson.questions || [],
        answers: {}, submitted: false, feedback: [], bonusPoints: 0,
      };
      render();
      return;
    }
    // Real path: show a loading state, fetch the quiz (answers carry NO is_correct —
    // scoring happens server-side in submitQuiz), then render.
    state.quizState = {
      lessonId: lesson.id, questions: [], answers: {},
      submitted: false, feedback: [], bonusPoints: 0, loading: true,
    };
    render();
    const data = await api(`/api/guniq/lessons/${lesson.id}/quiz`);
    const questions = (data && Array.isArray(data.questions))
      ? data.questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          explanation: q.explanation,
          answers: (q.answers || []).map(a => ({ id: a.id, answer_text: a.answer_text })),
        }))
      : (lesson.questions || []);
    if (!state.quizState || state.quizState.lessonId !== lesson.id) return;  // user navigated away
    state.quizState.questions = questions;
    state.quizState.loading   = false;
    render();
  }

  async function submitQuiz(qs) {
    const answersJson = qs.answers;

    // ---- Real path: authoritative server-side scoring ----
    // The quiz GET endpoint never exposes is_correct, so the client cannot score
    // locally; POST /quiz/submit scores and returns the answer key + feedback.
    if (state.apiUrl) {
      const result = await api('/api/guniq/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ memberId: state.memberId, lessonId: qs.lessonId, answersJson }),
      });
      if (result && Array.isArray(result.feedback)) {
        const scorePct = Math.round(result.scorePct);
        const passed   = !!result.passed;
        const bonus    = result.bonusPoints || 0;

        state.stats.total_points = (state.stats.total_points || 0) + 10 + bonus;
        if (passed) state.stats.lessons_completed = (state.stats.lessons_completed || 0) + 1;

        state.quizState.submitted   = true;
        state.quizState.bonusPoints = bonus;
        state.quizState.feedback    = result.feedback.map(f => ({
          questionText:  f.questionText,
          yourAnswer:    f.yourAnswer,
          correctAnswer: f.correctAnswer,
          // server feedback answers use `text`; normalize to answer_text for buildQuizResults
          answers:       (f.answers || []).map(a => ({ id: a.id, answer_text: a.answer_text != null ? a.answer_text : a.text, is_correct: a.is_correct })),
          explanation:   f.explanation,
        }));

        if (passed) {
          state.progress[qs.lessonId] = { completed: true, bestScore: scorePct };
          await api(`/api/guniq/lessons/${qs.lessonId}/complete`, {
            method: 'POST',
            body: JSON.stringify({ memberId: state.memberId, timeSpentSeconds: Math.round((Date.now() - state.lessonStartTime) / 1000) }),
          });
        }

        render();
        showToast(passed ? `+${10 + bonus} pts earned! ${bonus > 0 ? `(+${bonus} bonus)` : ''}` : 'Score 70% to pass — review and try again.', passed ? 'success' : 'gold');
        return;
      }
      // server unreachable/unexpected → fall through to local scoring as a last resort
    }

    // ---- Offline/demo fallback: local scoring via correctId ----
    let correct = 0;
    qs.questions.forEach(q => {
      if (answersJson[q.id] === q.correctId) correct++;
    });
    const scorePct = qs.questions.length ? Math.round((correct / qs.questions.length) * 100) : 0;
    const passed   = scorePct >= 70;
    const bonus    = passed ? (scorePct >= 90 ? 15 : scorePct >= 80 ? 10 : 5) : 0;

    state.stats.total_points = (state.stats.total_points || 0) + 10 + bonus;
    if (passed) state.stats.lessons_completed = (state.stats.lessons_completed || 0) + 1;

    state.quizState.submitted   = true;
    state.quizState.bonusPoints = bonus;
    state.quizState.feedback    = qs.questions.map(q => ({
      questionText:  q.question_text,
      yourAnswer:    answersJson[q.id],
      correctAnswer: q.correctId,
      answers:       q.answers,
      explanation:   q.explanation,
    }));
    if (passed) state.progress[qs.lessonId] = { completed: true, bestScore: scorePct };

    render();
    showToast(passed ? `+${10 + bonus} pts earned! ${bonus > 0 ? `(+${bonus} bonus)` : ''}` : 'Score 70% to pass — review and try again.', passed ? 'success' : 'gold');
  }

  // -------------------------------------------------------------------------
  // Toasts
  // -------------------------------------------------------------------------
  function showToast(message, type = 'success') {
    let wrap = document.querySelector('.fpr-guniq__toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'fpr-guniq__toast-wrap';
      document.body.appendChild(wrap);
    }
    const toast = document.createElement('div');
    toast.className = `fpr-guniq__toast --${type}`;
    toast.textContent = message;
    wrap.appendChild(toast);
    setTimeout(() => { toast.classList.add('--out'); setTimeout(() => toast.remove(), 300); }, 3500);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getCourseProgress(courseId) {
    const real = state.lessonsByCourse[courseId];
    const lessons = (Array.isArray(real) && real.length) ? real : getDemoLessonsForCourse(courseId);
    if (!lessons.length) return 0;
    const done = lessons.filter(l => state.progress[l.id]?.completed).length;
    return (done / lessons.length) * 100;
  }

  function getDemoLessonsForCourse(courseId) {
    const map = { c1: ['l1','l2','l3'], c2: ['l4','l5'], c3: [], c4: [], c5: [] };
    return (map[courseId] || []).map(id => DEMO_LESSONS.find(l => l.id === id)).filter(Boolean);
  }

  function getDemoLesson(id) {
    return DEMO_LESSONS.find(l => l.id === id);
  }

  // -------------------------------------------------------------------------
  // Bootstrap
  // -------------------------------------------------------------------------
  async function init(root) {
    state.root       = root;
    state.apiUrl     = (root.dataset.apiUrl     || '').replace(/\/$/, '');
    state.memberId   = root.dataset.memberId   || 'demo-member';
    state.memberName = root.dataset.memberName || 'Guest Member';

    root.classList.add('fpr-guniq');

    // Initial render with placeholder data
    state.courses = DEMO_COURSES;
    render();

    // Load real data in background
    await Promise.all([loadCourses(), loadProgress(), loadLeaderboard(), loadCertificates()]);
    render();
  }

  // Auto-init all matching elements
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fpr-guniq[data-api-url], .fpr-guniq-mount').forEach(root => init(root));
  });

  // Expose for manual init
  window.FPRGunIQ = { init };
})();
