const QUESTIONS = [
  {
    id:'goal',
    title:"What's your #1 goal right now?",
    sub:"Pick the one that matters most. We'll build everything around this.",
    options:[
      { val:'lose_fat', emoji:'🔥', title:'Lose body fat', desc:'Cut calories, drop weight, see definition' },
      { val:'build_muscle', emoji:'📈', title:'Build muscle', desc:'Gain size, get stronger, eat more' },
      { val:'recomp', emoji:'⚖️', title:'Recomposition', desc:'Lose fat AND build muscle at the same time' },
      { val:'compete', emoji:'🏆', title:'Compete on stage', desc:"I want to prepare for a physique competition" },
      { val:'health', emoji:'❤️', title:'Improve health & energy', desc:'Feel better, sleep better, get stronger' }
    ]
  },
  {
    id:'experience',
    title:'How long have you been training seriously?',
    sub:"Your experience helps shape the right starting point.",
    options:[
      { val:'beginner', emoji:'🌱', title:'Less than 1 year', desc:'Newer to consistent training' },
      { val:'intermediate', emoji:'🌳', title:'1–3 years', desc:'Have a foundation, ready to dial it in' },
      { val:'advanced', emoji:'⚡', title:'3–5 years', desc:'Know my way around — need a real plan' },
      { val:'elite', emoji:'👑', title:'5+ years', desc:'Experienced, looking for next-level coaching' }
    ]
  },
  {
    id:'compete_intent',
    title:"Are you considering competing in the next 12 months?",
    sub:"Your show timeline helps determine the support you need.",
    options:[
      { val:'no', emoji:'❌', title:'No competition plans', desc:"Just want to look and feel my best" },
      { val:'maybe_future', emoji:'💭', title:'Maybe someday', desc:'Open to it down the road, not yet' },
      { val:'12mo_plan', emoji:'📅', title:"Yes, planning a show in 6–12 months", desc:'Want to set up the foundation now' },
      { val:'active_prep', emoji:'🔥', title:'Yes, prepping for a show now', desc:"Show is on the calendar — let's go" }
    ]
  },
  {
    id:'commitment',
    title:'How many days per week can you train?',
    sub:'Be realistic about your actual schedule, not your ideal one.',
    options:[
      { val:'2_3', emoji:'⏱️', title:'2–3 days', desc:'Limited time — make every session count' },
      { val:'4', emoji:'🎯', title:'4 days', desc:'A solid balanced split' },
      { val:'5', emoji:'🔋', title:'5 days', desc:'Most-bang-for-buck training frequency' },
      { val:'6_plus', emoji:'🚀', title:'6+ days', desc:"I'm in the gym almost every day" }
    ]
  },
  {
    id:'obstacle',
    title:"What's your biggest obstacle right now?",
    sub:'The one thing holding you back from your goal.',
    options:[
      { val:'consistency', emoji:'📌', title:'Consistency & accountability', desc:"I know what to do — I just don't always do it" },
      { val:'nutrition', emoji:'🥗', title:'Nutrition / dieting', desc:"Training is fine, eating is the struggle" },
      { val:'training', emoji:'🏋️', title:'Training program design', desc:"I'm spinning my wheels in the gym" },
      { val:'plateau', emoji:'📊', title:'Plateaued progress', desc:'Been doing the same thing too long with no results' },
      { val:'time', emoji:'⏰', title:'Lack of time / structure', desc:'Need an efficient plan that fits my life' }
    ]
  }
];


function recommend(a){
  // Active prep → Contest, no question
  if(a.compete_intent === 'active_prep') return 'contest';

  // Show planned 6-12mo + experience >= intermediate → Contest
  if(a.compete_intent === '12mo_plan' && (a.experience === 'advanced' || a.experience === 'elite')) return 'contest';

  // 12mo plan but newer → Coaching first (build foundation)
  if(a.compete_intent === '12mo_plan') return 'coaching';

  // Goal = compete but not yet committed → Coaching (foundation)
  if(a.goal === 'compete') return 'coaching';

  // Consistency / accountability or plateau → Full Coaching
  if(a.obstacle === 'consistency' || a.obstacle === 'plateau') return 'coaching';

  // Time/structure obstacle + 4+ days → Coaching
  if(a.obstacle === 'time' && (a.commitment === '4' || a.commitment === '5' || a.commitment === '6_plus')) return 'coaching';

  // Pure nutrition struggle → Nutrition
  if(a.obstacle === 'nutrition') return 'nutrition';

  // Pure training struggle → Training
  if(a.obstacle === 'training') return 'training';

  // Recomp goal — needs both — Coaching
  if(a.goal === 'recomp') return 'coaching';

  // Health goal + low frequency → Coaching (general guidance)
  if(a.goal === 'health' && a.commitment === '2_3') return 'coaching';

  // Default fallback
  return 'coaching';
}

