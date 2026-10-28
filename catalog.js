/* =========================================================
   PACKAGE INSTALLER — tool catalog
   Hand-curated, static. The /api/recommend endpoint (DeepSeek)
   is only allowed to re-rank and re-word within this set. It
   can never introduce a new tool or link. Keep it that way.
   ========================================================= */

const USE_CASES = [
  {id:"resume", label:"Tailoring resumes & cover letters", desc:"Rewriting the same resume for every application without starting from scratch.", badge:"RS"},
  {id:"interview", label:"Practicing interviews", desc:"Behavioral questions, “tell me about a time…”, or case-style prompts.", badge:"IV"},
  {id:"outreach", label:"Cold outreach & networking", desc:"Emails and LinkedIn messages to alumni, recruiters, or people in a role you want.", badge:"NW"},
  {id:"jobsearch", label:"Finding & tracking applications", desc:"Keeping track of what you've applied to so nothing falls through.", badge:"JS"},
  {id:"coursework", label:"Getting through readings & coursework faster", desc:"Summarizing dense papers, building study guides, prepping for section.", badge:"CW"},
  {id:"portfolio", label:"Building something to point to", desc:"A small AI-assisted project you can actually describe in an interview.", badge:"PF"},
  {id:"decks", label:"Making decks & presentations", desc:"Problem sets, club pitches, case comps, recruiting events.", badge:"DK"},
  {id:"data", label:"Analyzing data without being a ‘data person’", desc:"Case studies or a club project with a spreadsheet you don't want to wrangle by hand.", badge:"DA"},
];

const TOOLS = {
  resume: [
    {id:"resume-teal", name:"Teal", blurb:"Free resume builder built around tailoring one resume per job posting.", strength:"Scores your resume against a specific job description and flags missing keywords.", setup:5, free:true, link:"https://www.tealhq.com/",
      guide:["Create a free account with your email.","Upload your current resume, or build one from their template.","Paste a job description into the Job Tracker to get a match score.","Apply the suggested edits before you submit that application."]},
    {id:"resume-chatgpt", name:"ChatGPT", blurb:"General-purpose AI chat that works fine for a first tailored draft in minutes.", strength:"Free, zero setup beyond an account, and good at matching tone to a posting.", setup:2, free:true, link:"https://chatgpt.com/",
      guide:["Create a free account.","Open a new chat.","Paste the prompt below with your resume and the job description swapped in.","Copy the rewritten bullets into your actual resume file."],
      prompt:"Here is my resume: [paste resume]. Here is the job description: [paste job description]. Rewrite my bullet points to mirror the language and priorities of this job description, without inventing experience I don't have. Flag anything you changed."},
    {id:"resume-grammarly", name:"Grammarly", blurb:"Catches tone, clarity, and grammar issues before a human reader does.", strength:"Runs in the background as you write, so there's no separate step once it's installed.", setup:3, free:true, link:"https://www.grammarly.com/",
      guide:["Install the free browser extension.","Sign in with your email.","Open your cover letter in Google Docs or wherever you draft it.","Accept or dismiss its suggestions as you go."]},
  ],
  interview: [
    {id:"interview-finalround", name:"Final Round AI", blurb:"AI mock interviewer that asks real behavioral/technical questions and scores your answers.", strength:"Simulates the pressure of an actual interview, not just a question list.", setup:5, free:"Limited free tier", link:"https://www.finalroundai.com/",
      guide:["Create a free account.","Pick a role and interview type (behavioral, case, technical).","Answer out loud as you would live.","Read the feedback and redo your weakest answer."]},
    {id:"interview-yoodli", name:"Yoodli", blurb:"AI speech coach that reviews how you deliver an answer out loud.", strength:"Flags filler words, pacing, and rambling, which matters most in behavioral rounds.", setup:5, free:true, link:"https://app.yoodli.ai/",
      guide:["Create a free account.","Record yourself answering a practice question.","Review the filler-word and pacing feedback.","Re-record the same answer and compare."]},
    {id:"interview-chatgpt", name:"ChatGPT", blurb:"Turn it into a mock interviewer with the right prompt. Free and always available.", strength:"You control exactly which role or company it role-plays.", setup:2, free:true, link:"https://chatgpt.com/",
      guide:["Open a new chat.","Paste the prompt below, filling in the role.","Answer each question as it comes, one at a time.","Ask it to rate your overall answer set at the end."],
      prompt:"Act as an interviewer for a [role] internship at a [industry] company. Ask me one behavioral question at a time. After each answer, give me brief feedback using the STAR format, then ask the next question. Start now."},
  ],
  outreach: [
    {id:"outreach-claude", name:"Claude", blurb:"Strong at drafting outreach that doesn't sound like a template.", strength:"Good at landing a specific, less generic tone for cold emails.", setup:2, free:true, link:"https://claude.ai/",
      guide:["Create a free account.","Open a new chat.","Paste the prompt below with your details filled in.","Read it out loud once before sending, and edit anything that doesn't sound like you."],
      prompt:"Help me write a short cold email to [name], a [role] at [company]. I'm a [year] at Yale studying [major]. I want to ask for 15 minutes to learn about their path into [field], not to ask for a job directly. Keep it under 120 words and make it sound like a real person, not a template."},
    {id:"outreach-chatgpt", name:"ChatGPT", blurb:"Same job as Claude above. Use whichever account you already have.", strength:"Free, fast, and fine for a first draft of a short message.", setup:2, free:true, link:"https://chatgpt.com/",
      guide:["Create a free account.","Open a new chat.","Paste the same prompt style, filling in your details.","Trim it to under 120 words before sending."],
      prompt:"Help me write a short cold email to [name], a [role] at [company]. I'm a [year] at Yale studying [major]. I want to ask for 15 minutes to learn about their path into [field], not to ask for a job directly. Keep it under 120 words and make it sound like a real person, not a template."},
    {id:"outreach-grammarly", name:"Grammarly", blurb:"Keeps networking messages polished without sounding stiff.", strength:"Catches the overly-formal phrasing that makes cold emails read as mass-sent.", setup:3, free:true, link:"https://www.grammarly.com/",
      guide:["Install the free browser extension.","Sign in with your email.","Draft your message in Gmail or LinkedIn.","Accept the tone suggestions that make it sound more natural."]},
  ],
  jobsearch: [
    {id:"jobsearch-teal", name:"Teal", blurb:"Tracks every application in one place instead of a messy spreadsheet.", strength:"Browser extension that auto-logs jobs as you apply.", setup:5, free:true, link:"https://www.tealhq.com/",
      guide:["Create a free account.","Install the browser extension.","Add each job you're applying to as a card in the tracker.","Set a follow-up reminder for two weeks out."]},
    {id:"jobsearch-simplify", name:"Simplify", blurb:"Chrome extension that autofills job applications across sites.", strength:"Cuts repetitive form-filling on sites like Workday and Greenhouse.", setup:5, free:true, link:"https://simplify.jobs/",
      guide:["Install the free Chrome extension.","Fill in your profile once (school, grad date, resume).","Use “Autofill” on the next application form you hit.","Double-check anything it fills before submitting."]},
  ],
  coursework: [
    {id:"coursework-notebooklm", name:"NotebookLM", blurb:"Upload your actual readings and ask questions grounded only in them.", strength:"Citations point back to the exact page in your source, which makes it harder to misquote a text.", setup:5, free:true, link:"https://notebooklm.google/",
      guide:["Create a free account with a Google login.","Upload the PDF or reading for one class.","Ask it to summarize the argument or generate study questions.","Click any citation to jump to the exact passage."]},
    {id:"coursework-claude", name:"Claude", blurb:"Good at turning a dense reading into a study guide you'd actually use.", strength:"Handles long PDFs in one pass without losing the thread.", setup:2, free:true, link:"https://claude.ai/",
      guide:["Create a free account.","Upload or paste the reading.","Paste the prompt below.","Save the output somewhere you'll actually look before the exam."],
      prompt:"I'm attaching a reading for my [course name] class. Summarize the argument in 5 bullet points, list any terms I'd need to define on an exam, and write 3 discussion questions a professor might ask about it."},
  ],
  portfolio: [
    {id:"portfolio-replit", name:"Replit", blurb:"Build and run a small AI-assisted project entirely in the browser.", strength:"No local install required, good if you've never set up a dev environment.", setup:10, free:true, link:"https://replit.com/",
      guide:["Create a free account.","Start a new app from a template close to your idea.","Describe what you want changed in the built-in AI chat.","Share the live link. That's your portfolio piece."]},
    {id:"portfolio-cursor", name:"Cursor", blurb:"AI code editor for a slightly more serious project you want on your resume.", strength:"Explains the code it writes, which helps if you're learning as you go.", setup:15, free:"Free tier, limited usage", link:"https://www.cursor.com/",
      guide:["Download and install the editor.","Open or create a project folder.","Ask the built-in chat to build one small feature at a time.","Push the result to GitHub so you have a link to share."]},
    {id:"portfolio-copilot", name:"GitHub Copilot", blurb:"Free for students through GitHub Education. Pairs with most editors.", strength:"The verified-student discount makes this the cheapest ‘real’ coding assistant.", setup:15, free:"Free for verified students", link:"https://education.github.com/",
      guide:["Apply for GitHub Education with your Yale email.","Once approved, enable Copilot on your GitHub account.","Install it as an extension in your editor.","Start typing, then accept or reject its suggestions as you go."]},
  ],
  decks: [
    {id:"decks-gamma", name:"Gamma", blurb:"Describe your deck in a sentence and get an actual first draft of slides.", strength:"Fastest way to get past a blank slide one.", setup:3, free:true, link:"https://gamma.app/",
      guide:["Create a free account.","Describe the deck's topic and audience in one prompt.","Pick a generated layout you like.","Swap in your real content and sources."]},
    {id:"decks-canva", name:"Canva Magic Design", blurb:"AI layout suggestions inside a tool most people already know.", strength:"Easiest way to make something that looks designed without needing design skills.", setup:3, free:true, link:"https://www.canva.com/",
      guide:["Create a free account.","Choose “Magic Design” and describe your deck.","Pick a template from the options it generates.","Replace the placeholder text and images with your own."]},
  ],
  data: [
    {id:"data-julius", name:"Julius AI", blurb:"Upload a spreadsheet and ask questions about it in plain English.", strength:"Shows the actual chart or calculation behind its answer.", setup:5, free:"Limited free tier", link:"https://julius.ai/",
      guide:["Create a free account.","Upload your CSV or spreadsheet.","Ask a plain-English question about it.","Download the chart it produces for your writeup."]},
    {id:"data-chatgpt", name:"ChatGPT", blurb:"Upload a CSV and ask it to analyze or chart it directly in the chat.", strength:"One tool for both the analysis and explaining it back in plain English.", setup:3, free:true, link:"https://chatgpt.com/",
      guide:["Create a free account.","Start a new chat and upload your spreadsheet.","Paste the prompt below.","Ask follow-up questions on anything that looks off."],
      prompt:"Here's a spreadsheet of [describe the data]. Without changing the underlying numbers, tell me: 1) the three most notable patterns, 2) one thing that looks like an outlier or error worth double-checking, and 3) one simple chart I should make and why."},
  ],
};

function toolById(id){
  for(const uc in TOOLS){ const t = TOOLS[uc].find(t=>t.id===id); if(t) return {...t, useCase: uc}; }
  return null;
}
function allToolIds(){ return Object.values(TOOLS).flat().map(t=>t.id); }
