/* =========================================================
   PACKAGE INSTALLER, v1 (static + serverless build)
   Persistence: localStorage only (per-browser). No shared
   backend database in this build. See README for why.
   AI personalization: POSTs to /api/recommend, which calls
   DeepSeek server-side. If that endpoint/key isn't configured,
   this fails open and falls back to the static catalog copy.
   ========================================================= */

/* ---------- survey question config ---------- */
const COMFORT_OPTS = [
  {id:"curious", label:"Interested, but mostly casual chat so far", desc:"You use ChatGPT or Claude for random questions, haven't applied it to real tasks yet."},
  {id:"casual", label:"Already use it for a few real tasks", desc:"Some schoolwork or job-search stuff, just not consistently."},
  {id:"regular", label:"Use several tools regularly", desc:"You've got a bit of a toolkit already and want to add to it."},
];
const BLOCKER_OPTS = [
  {id:"discovery", label:"I don't really know what's out there", desc:"Hard to find tools worth trying."},
  {id:"setup", label:"I know tools exist but not how to set them up for this", desc:"Discovery isn't the problem. Getting started is."},
  {id:"habit", label:"I've set things up but don't actually use them", desc:"They're installed somewhere and then I forget."},
  {id:"speed", label:"Nothing's really stopped me, I just want to go faster", desc:"Already fairly comfortable, looking to level up."},
];
const BUDGET_OPTS = [
  {id:"free", label:"Free tools only", desc:"No subscriptions right now."},
  {id:"trial", label:"Open to paid, if there's a free trial", desc:"Willing to pay later if it's clearly worth it."},
];
const YEAR_OPTS = [
  {id:"first", label:"First-year"},{id:"soph", label:"Sophomore"},{id:"junior", label:"Junior"},
  {id:"senior", label:"Senior"},{id:"grad", label:"Grad student"},
];

/* ---------- state ---------- */
let state = {
  user: null,
  survey: { useCases: [], comfort: null, blocker: null, budget: null, year: null, notes: "", name: "", email: "" },
  surveyStep: 0,
  pendingBundle: null,
  personalized: {},     // toolId -> AI-personalized one-liner (optional enhancement)
  route: location.hash || "#",
};

const SURVEY_STEPS = ["usecases","comfort","blocker","budget","year","freeform","identity"];

/* ---------- persistence (localStorage only) ---------- */
const LS_ACTIVE = "pkginstaller.activeEmail";
function docKey(email){ return "pkginstaller.user."+email; }
function loadUser(email){
  try{ const raw = localStorage.getItem(docKey(email)); return raw?JSON.parse(raw):null; }catch(e){ return null; }
}
function saveUser(doc){
  try{ localStorage.setItem(docKey(doc.email), JSON.stringify(doc)); localStorage.setItem(LS_ACTIVE, doc.email); }catch(e){}
}
function bumpSession(doc){
  const now = Date.now();
  const last = doc.lastSeenAt || 0;
  const HOUR = 1000*60*60;
  if(!doc.sessionCount){ doc.sessionCount = 1; }
  else if(now - last > HOUR){ doc.sessionCount += 1; }
  doc.lastSeenAt = now;
  return doc;
}

/* ---------- AI personalization (DeepSeek, server-side) ---------- */
async function enrichWithAI(){
  const s = state.survey;
  const toolIds = Array.from(state.pendingBundle || []);
  if(toolIds.length === 0) return;
  const tools = toolIds.map(id=>{
    const t = toolById(id);
    return t ? {id:t.id, name:t.name, blurb:t.blurb, strength:t.strength, useCase:t.useCase} : null;
  }).filter(Boolean);

  try{
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        survey: {
          useCases: s.useCases, comfort: s.comfort, blocker: s.blocker, budget: s.budget, year: s.year, notes: s.notes,
        },
        tools,
      }),
    });
    if(!res.ok) return; // fail open; static strengths already rendered
    const data = await res.json();
    if(data && data.personalized && typeof data.personalized === "object"){
      state.personalized = {...state.personalized, ...data.personalized};
      render();
    }
  }catch(e){
    // Offline, no backend deployed, or key not configured. Keep the static copy.
  }
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 2200);
}

/* ---------- router ---------- */
window.addEventListener("hashchange", ()=>{ state.route = location.hash || "#"; render(); });
function nav(hash){ location.hash = hash; }

/* ================= RENDER ================= */
const app = document.getElementById("app");

function render(){
  const route = state.route;
  let body = "";
  if(route.startsWith("#survey")) body = renderSurvey();
  else if(route.startsWith("#results")) body = renderResults();
  else if(route.startsWith("#dashboard")) body = renderDashboard();
  else body = renderLanding();

  app.innerHTML = `
    ${renderTopbar()}
    ${route.startsWith("#survey") ? renderSurveyProgress() : ""}
    <main>${body}</main>
    ${renderFooter()}
  `;
  wireEvents();
}

function renderTopbar(){
  const showUser = state.user && !state.route.startsWith("#survey");
  const initials = state.user ? (state.user.name||state.user.email||"?").trim().slice(0,1).toUpperCase() : "";
  return `
  <div class="topbar">
    <button class="wordmark" data-home><span class="dot"></span> Package Installer</button>
    <div class="topnav">
      ${state.user ? `<a href="#dashboard" data-link>Dashboard</a>` : ``}
      ${showUser ? `<div class="pill-user"><span class="avatar">${initials}</span>${esc(state.user.name||state.user.email)}</div>` : ``}
    </div>
  </div>`;
}

function renderFooter(){
  return `<footer>V1 pilot build · tool data saved on this device only.</footer>`;
}

/* ---- landing ---- */
function renderLanding(){
  const wb = state.user ? `
    <div class="welcomeback">
      <p>Welcome back, <strong>${esc(state.user.name||state.user.email)}</strong>. Your toolkit has ${ (state.user.bundle||[]).length } tool${(state.user.bundle||[]).length===1?'':'s'} saved.</p>
      <button class="btn btn-primary btn-sm" data-link href="#dashboard">Go to dashboard</button>
    </div>` : "";

  return `<div class="wrap">
    ${wb}
    <div class="hero">
      <div class="eyebrow">■ v1 pilot · Yale</div>
      <h1 class="hero-title">A two-minute survey, then a personal AI toolkit, ready to set up.</h1>
      <p class="hero-sub">Tell us what you're actually working on this month. We'll hand back 1–3 real tools per task, with setup time, free-tier info, a setup guide, and a prompt you can paste in immediately.</p>
      <button class="btn btn-primary" data-link href="#survey">Start the survey →</button>
    </div>
    <div class="howrow">
      <div class="howcard"><div class="num mono">01</div><h3>Answer 5–6 quick questions</h3><p>What's on your plate, how comfortable you already are, and what's actually stopped you so far.</p></div>
      <div class="howcard"><div class="num mono">02</div><h3>Get a personal bundle</h3><p>1–3 tools per task, each with a plain-English reason it fits. No generic top-10 list.</p></div>
      <div class="howcard"><div class="num mono">03</div><h3>Install & track</h3><p>One click to the signup page, a short setup guide, a ready-to-paste prompt, and a dashboard to mark what you've actually tried.</p></div>
    </div>
  </div>`;
}

/* ---- survey ---- */
function renderSurveyProgress(){
  const idx = state.surveyStep;
  const pct = Math.round(((idx)/(SURVEY_STEPS.length))*100);
  return `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}

function renderSurvey(){
  const step = SURVEY_STEPS[state.surveyStep];
  const s = state.survey;
  let inner = "";

  if(step === "usecases"){
    inner = `
      <div class="q-step mono">STEP ${state.surveyStep+1} OF ${SURVEY_STEPS.length}</div>
      <h2 class="q-title">What's actually on your plate right now?</h2>
      <p class="q-help">Pick everything that applies. This is what decides your bundle.</p>
      <div class="opt-grid">
        ${USE_CASES.map(uc=>`
          <button class="opt ${s.useCases.includes(uc.id)?'selected':''}" data-toggle-uc="${uc.id}">
            <span class="box">${s.useCases.includes(uc.id)?'✓':''}</span>
            <span><span class="opt-label">${uc.label}</span><div class="opt-desc">${uc.desc}</div></span>
          </button>`).join("")}
      </div>`;
  } else if(step === "comfort"){
    inner = `
      <div class="q-step mono">STEP ${state.surveyStep+1} OF ${SURVEY_STEPS.length}</div>
      <h2 class="q-title">How are you already using AI tools?</h2>
      <p class="q-help">You're clearly interested. This just tells us which tools to lead with.</p>
      <div class="opt-grid">
        ${COMFORT_OPTS.map(o=>`
          <button class="opt ${s.comfort===o.id?'selected':''}" data-set-single="comfort" data-value="${o.id}">
            <span class="box round">${s.comfort===o.id?'✓':''}</span>
            <span><span class="opt-label">${o.label}</span><div class="opt-desc">${o.desc}</div></span>
          </button>`).join("")}
      </div>`;
  } else if(step === "blocker"){
    inner = `
      <div class="q-step mono">STEP ${state.surveyStep+1} OF ${SURVEY_STEPS.length}</div>
      <h2 class="q-title">What's actually stopped you so far?</h2>
      <p class="q-help">Be honest. This is the whole point of the pilot.</p>
      <div class="opt-grid">
        ${BLOCKER_OPTS.map(o=>`
          <button class="opt ${s.blocker===o.id?'selected':''}" data-set-single="blocker" data-value="${o.id}">
            <span class="box round">${s.blocker===o.id?'✓':''}</span>
            <span><span class="opt-label">${o.label}</span><div class="opt-desc">${o.desc}</div></span>
          </button>`).join("")}
      </div>`;
  } else if(step === "budget"){
    inner = `
      <div class="q-step mono">STEP ${state.surveyStep+1} OF ${SURVEY_STEPS.length}</div>
      <h2 class="q-title">Free tools only, or open to paid?</h2>
      <p class="q-help">We'll still show paid tools either way. This just affects what we lead with.</p>
      <div class="opt-grid">
        ${BUDGET_OPTS.map(o=>`
          <button class="opt ${s.budget===o.id?'selected':''}" data-set-single="budget" data-value="${o.id}">
            <span class="box round">${s.budget===o.id?'✓':''}</span>
            <span><span class="opt-label">${o.label}</span><div class="opt-desc">${o.desc}</div></span>
          </button>`).join("")}
      </div>`;
  } else if(step === "year"){
    inner = `
      <div class="q-step mono">STEP ${state.surveyStep+1} OF ${SURVEY_STEPS.length}</div>
      <h2 class="q-title">What year are you?</h2>
      <p class="q-help">Optional. It just helps us read the pilot results.</p>
      <div class="opt-grid">
        ${YEAR_OPTS.map(o=>`
          <button class="opt ${s.year===o.id?'selected':''}" data-set-single="year" data-value="${o.id}">
            <span class="box round">${s.year===o.id?'✓':''}</span>
            <span class="opt-label">${o.label}</span>
          </button>`).join("")}
      </div>`;
  } else if(step === "freeform"){
    inner = `
      <div class="q-step mono">STEP ${state.surveyStep+1} OF ${SURVEY_STEPS.length}</div>
      <h2 class="q-title">Anything else?</h2>
      <p class="q-help">Optional. A specific company, class, or situation helps us personalize your bundle further.</p>
      <div class="field">
        <textarea id="f-notes" rows="4" maxlength="500" placeholder="e.g. I'm applying to consulting internships and my biggest issue is case interviews." style="width:100%;padding:11px 13px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--text);font-size:14.5px;font-family:inherit;resize:vertical;">${esc(s.notes)}</textarea>
        <div class="field-hint">${500 - s.notes.length} characters left.</div>
      </div>`;
  } else if(step === "identity"){
    inner = `
      <div class="q-step mono">LAST STEP</div>
      <h2 class="q-title">Where should we save your bundle?</h2>
      <p class="q-help">So it's still here next time you open this on this device. No password needed.</p>
      <div class="field">
        <label>Name</label>
        <input type="text" id="f-name" placeholder="e.g. Jordan Lee" value="${esc(s.name)}">
      </div>
      <div class="field">
        <label>Email</label>
        <input type="email" id="f-email" placeholder="you@yale.edu" value="${esc(s.email)}">
        <div class="field-hint">Any email works. It's just your save key on this device.</div>
      </div>`;
  }

  const isFirst = state.surveyStep === 0;
  const isLast = state.surveyStep === SURVEY_STEPS.length - 1;
  const canAdvance = stepValid(step);

  return `<div class="wrap">
    ${inner}
    <div class="step-nav">
      <button class="btn btn-ghost btn-sm" ${isFirst?'disabled':''} data-survey-back>← Back</button>
      <button class="btn btn-primary" ${canAdvance?'':'disabled'} data-survey-next>${isLast?'See my bundle →':'Next →'}</button>
    </div>
  </div>`;
}

function stepValid(step){
  const s = state.survey;
  if(step==="usecases") return s.useCases.length>0;
  if(step==="comfort") return !!s.comfort;
  if(step==="blocker") return !!s.blocker;
  if(step==="budget") return !!s.budget;
  if(step==="year") return true;
  if(step==="freeform") return true;
  if(step==="identity") return !!s.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim());
  return false;
}

/* ---- results / bundle builder ---- */
function renderResults(){
  if(!state.pendingBundle) state.pendingBundle = new Set(allSuggestedToolIds());
  const s = state.survey;

  return `<div class="wrap-wide">
    <div class="results-head">
      <h1>Your bundle, ${esc(s.name.split(" ")[0]||"there")}.</h1>
      <p>Built from ${s.useCases.length} task${s.useCases.length===1?'':'s'} you picked. Uncheck anything you don't want. Everything starts selected.</p>
    </div>
    <div class="bundle-controls">
      <button class="btn btn-ghost btn-sm" data-bundle-all>Select full bundle</button>
      <button class="btn btn-ghost btn-sm" data-bundle-none>Clear all</button>
    </div>
    ${s.useCases.map(renderUcGroup).join("")}
    <div class="save-bar">
      <span style="align-self:center;font-size:12.5px;color:var(--text-muted);margin-right:auto;">${state.pendingBundle.size} tool${state.pendingBundle.size===1?'':'s'} selected</span>
      <button class="btn btn-primary" data-save-bundle ${state.pendingBundle.size===0?'disabled':''}>Save my toolkit →</button>
    </div>
  </div>`;
}

function allSuggestedToolIds(){
  const ids = [];
  state.survey.useCases.forEach(uc => (TOOLS[uc]||[]).forEach(t => ids.push(t.id)));
  return ids;
}

function renderUcGroup(ucId){
  const uc = USE_CASES.find(u=>u.id===ucId);
  const tools = TOOLS[ucId] || [];
  return `<div class="uc-group">
    <div class="uc-head">
      <div class="uc-badge mono">${uc.badge}</div>
      <div><h2>${uc.label}</h2><div class="uc-desc">${uc.desc}</div></div>
    </div>
    <div class="tool-grid">${tools.map(t=>renderToolCard(t, ucId)).join("")}</div>
  </div>`;
}

function renderToolCard(t, ucId, opts){
  opts = opts || {};
  const onDashboard = !!opts.dashboard;
  const inBundle = state.pendingBundle ? state.pendingBundle.has(t.id) : false;
  const tried = state.user && (state.user.toolsTried||[]).includes(t.id);
  const freeChip = t.free===true ? `<span class="chip free">free tier</span>` : (t.free ? `<span class="chip free">${esc(t.free)}</span>` : `<span class="chip">paid</span>`);
  const ai = state.personalized[t.id];

  return `<div class="tool-card" data-tool-card="${t.id}">
    <div class="tool-card-top">
      <div class="tool-name">${esc(t.name)}</div>
      ${onDashboard
        ? `<button class="toggle ${tried?'on':''}" data-toggle-tried="${t.id}" title="Mark as tried"><span class="knob"></span></button>`
        : `<button class="toggle ${inBundle?'on':''}" data-toggle-bundle="${t.id}" title="Add to my toolkit"><span class="knob"></span></button>`
      }
    </div>
    <div class="tool-blurb">${esc(t.blurb)}</div>
    <div class="tool-strength ${ai?'ai-personalized':''}">
      ${ai ? `<span class="ai-tag">Personalized for you</span>${esc(ai)}` : `<b>Why this one:</b> ${esc(t.strength)}`}
    </div>
    <div class="chip-row">
      <span class="chip">~${t.setup} min setup</span>
      ${freeChip}
      ${tried ? `<span class="chip tried">✓ tried</span>` : ``}
    </div>
    <div class="tool-actions">
      <a class="btn btn-ghost btn-sm" href="${t.link}" target="_blank" rel="noopener">Visit & sign up ↗</a>
    </div>
    <details class="guide">
      <summary>Setup guide${t.prompt ? ' & prompt template' : ''}</summary>
      <ol class="guide-steps">${(t.guide||[]).map(g=>`<li>${esc(g)}</li>`).join("")}</ol>
      ${t.prompt ? `
        <div class="prompt-box">
          <div class="prompt-label">Paste-ready prompt</div>
          <p>${esc(t.prompt)}</p>
          <button class="copy-btn" data-copy="${encodeURIComponent(t.prompt)}">Copy prompt</button>
        </div>` : ``}
    </details>
  </div>`;
}

/* ---- dashboard ---- */
function renderDashboard(){
  if(!state.user){
    return `<div class="wrap"><div class="empty"><h3>No saved toolkit yet</h3><p>Take the survey first. It takes about two minutes.</p><br><button class="btn btn-primary" data-link href="#survey">Start the survey</button></div></div>`;
  }
  const u = state.user;
  const bundle = u.bundle || [];
  const tried = u.toolsTried || [];
  const byUc = {};
  bundle.forEach(id=>{ const t = toolById(id); if(!t) return; (byUc[t.useCase] = byUc[t.useCase]||[]).push(t); });

  const pct = bundle.length ? Math.round((tried.length/bundle.length)*100) : 0;

  return `<div class="wrap-wide">
    <div class="dash-head">
      <h1 class="display" style="font-size:26px;margin:0;">Your toolkit</h1>
      <button class="btn btn-ghost btn-sm" data-link href="#survey-more">Explore more tasks →</button>
    </div>
    <div class="stats-row">
      <div class="stat-tile"><div class="num mono">${bundle.length}</div><div class="label">Tools in your toolkit</div></div>
      <div class="stat-tile"><div class="num mono">${tried.length}</div><div class="label">Tools tried</div><div class="sub">${pct}% of your bundle</div></div>
      <div class="stat-tile"><div class="num mono">${u.sessionCount||1}</div><div class="label">Sessions here</div></div>
      <div class="stat-tile"><div class="num mono">${(u.useCases||[]).length}</div><div class="label">Tasks covered</div></div>
    </div>
    ${bundle.length===0 ? `<div class="empty"><h3>Your toolkit is empty</h3><p>You cleared everything on the last step. Go back and add a few.</p></div>` :
      Object.keys(byUc).map(ucId=>{
        const uc = USE_CASES.find(x=>x.id===ucId);
        return `<div class="uc-group">
          <div class="uc-head"><div class="uc-badge mono">${uc.badge}</div><div><h2>${uc.label}</h2></div></div>
          <div class="tool-grid">${byUc[ucId].map(t=>renderToolCard(t, ucId, {dashboard:true})).join("")}</div>
        </div>`;
      }).join("")
    }
  </div>`;
}

/* ================= EVENTS ================= */
function wireEvents(){
  app.querySelectorAll("[data-link]").forEach(el=>{
    el.addEventListener("click", e=>{
      e.preventDefault();
      const h = el.getAttribute("href");
      if(h === "#survey-more"){ startSurveyMore(); return; }
      nav(h);
    });
  });
  const home = app.querySelector("[data-home]");
  if(home) home.addEventListener("click", ()=>nav("#"));

  app.querySelectorAll("[data-toggle-uc]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.getAttribute("data-toggle-uc");
      const arr = state.survey.useCases;
      const i = arr.indexOf(id);
      if(i>=0) arr.splice(i,1); else arr.push(id);
      render();
    });
  });
  app.querySelectorAll("[data-set-single]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const key = el.getAttribute("data-set-single");
      state.survey[key] = el.getAttribute("data-value");
      render();
    });
  });
  const back = app.querySelector("[data-survey-back]");
  if(back) back.addEventListener("click", ()=>{ state.surveyStep = Math.max(0,state.surveyStep-1); render(); });
  const next = app.querySelector("[data-survey-next]");
  if(next) next.addEventListener("click", onSurveyNext);

  const fname = document.getElementById("f-name");
  const femail = document.getElementById("f-email");
  const fnotes = document.getElementById("f-notes");
  if(fname) fname.addEventListener("input", e=>{ state.survey.name = e.target.value; refreshNextButton(); });
  if(femail) femail.addEventListener("input", e=>{ state.survey.email = e.target.value; refreshNextButton(); });
  if(fnotes) fnotes.addEventListener("input", e=>{
    state.survey.notes = e.target.value;
    const hint = app.querySelector(".field-hint");
    if(hint) hint.textContent = `${500 - state.survey.notes.length} characters left.`;
  });

  app.querySelectorAll("[data-toggle-bundle]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.getAttribute("data-toggle-bundle");
      if(state.pendingBundle.has(id)) state.pendingBundle.delete(id); else state.pendingBundle.add(id);
      render();
    });
  });
  const ba = app.querySelector("[data-bundle-all]");
  if(ba) ba.addEventListener("click", ()=>{ state.pendingBundle = new Set(allSuggestedToolIds()); render(); });
  const bn = app.querySelector("[data-bundle-none]");
  if(bn) bn.addEventListener("click", ()=>{ state.pendingBundle = new Set(); render(); });
  const sb = app.querySelector("[data-save-bundle]");
  if(sb) sb.addEventListener("click", onSaveBundle);

  app.querySelectorAll("[data-toggle-tried]").forEach(el=>{
    el.addEventListener("click", ()=>onToggleTried(el.getAttribute("data-toggle-tried")));
  });

  app.querySelectorAll("[data-copy]").forEach(el=>{
    el.addEventListener("click", async ()=>{
      const text = decodeURIComponent(el.getAttribute("data-copy"));
      try{ await navigator.clipboard.writeText(text); toast("Prompt copied"); }
      catch(e){ toast("Couldn't copy. Select and copy manually"); }
    });
  });
}

function refreshNextButton(){
  const btn = app.querySelector("[data-survey-next]");
  if(btn) btn.disabled = !stepValid(SURVEY_STEPS[state.surveyStep]);
}

function onSurveyNext(){
  const step = SURVEY_STEPS[state.surveyStep];
  if(!stepValid(step)) return;
  if(state.surveyStep < SURVEY_STEPS.length-1){
    state.surveyStep += 1;
    render();
  } else {
    finishSurvey();
  }
}

function finishSurvey(){
  const s = state.survey;
  const email = s.email.trim().toLowerCase();
  let existing = loadUser(email);
  const doc = existing || {email, createdAt: Date.now(), bundle:[], toolsTried:[], sessionCount:0};
  doc.name = s.name.trim();
  doc.year = s.year;
  doc.comfort = s.comfort;
  doc.blocker = s.blocker;
  doc.budget = s.budget;
  doc.notes = s.notes.trim();
  doc.useCases = Array.from(new Set([...(doc.useCases||[]), ...s.useCases]));
  doc.surveyCompletedAt = Date.now();
  bumpSession(doc);
  state.user = doc;
  state.pendingBundle = new Set([...(doc.bundle||[]), ...allSuggestedToolIds()]);
  state.personalized = {};
  nav("#results");
  enrichWithAI();
}

function onSaveBundle(){
  const doc = state.user;
  doc.bundle = Array.from(state.pendingBundle);
  saveUser(doc);
  toast("Saved to your dashboard");
  nav("#dashboard");
}

function onToggleTried(toolId){
  const doc = state.user;
  doc.toolsTried = doc.toolsTried || [];
  const i = doc.toolsTried.indexOf(toolId);
  if(i>=0) doc.toolsTried.splice(i,1); else doc.toolsTried.push(toolId);
  saveUser(doc);
  render();
}

function startSurveyMore(){
  state.survey.useCases = [...(state.user.useCases||[])];
  state.survey.comfort = state.user.comfort;
  state.survey.blocker = state.user.blocker;
  state.survey.budget = state.user.budget;
  state.survey.year = state.user.year;
  state.survey.notes = state.user.notes || "";
  state.survey.name = state.user.name;
  state.survey.email = state.user.email;
  state.surveyStep = 0;
  state.pendingBundle = null;
  nav("#survey");
}

/* ---------- utils ---------- */
function esc(str){
  return String(str==null?"":str).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* ---------- boot ---------- */
function boot(){
  const activeEmail = (()=>{ try{ return localStorage.getItem(LS_ACTIVE); }catch(e){ return null; } })();
  if(activeEmail){
    const doc = loadUser(activeEmail);
    if(doc){
      bumpSession(doc);
      state.user = doc;
      saveUser(doc);
    }
  }
  render();
}
boot();
