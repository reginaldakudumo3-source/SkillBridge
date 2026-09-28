import "./style.css";
import { courses } from "./data/courses.js";
import { lessons } from "./data/lessons.js";
import { questions } from "./data/questions.js";
import { resources } from "./data/resources.js";
import { subjects } from "./data/subjects.js";
import { percent } from "./data/counter.js";

const app = document.querySelector("#app");

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

let progress = store.get("skillbridge-progress", {});
let mistakes = store.get("skillbridge-mistakes", []);
let theme = localStorage.getItem("skillbridge-theme") || "light";
let quizState = null;

document.documentElement.dataset.theme = theme;

const icons = {
  home: "⌂",
  courses: "▦",
  progress: "◔",
  mistakes: "✦",
  resources: "↗",
  settings: "⚙"
};

function save() {
  store.set("skillbridge-progress", progress);
  store.set("skillbridge-mistakes", mistakes);
}

function courseById(id) {
  return courses.find(c => c.id === id);
}

function courseProgress(id) {
  const p = progress[id] || { lessons: [], quizBest: 0 };
  const totalLessons = lessons[id]?.length || 0;
  const lessonPart = totalLessons ? (p.lessons?.length || 0) / totalLessons : 0;
  const quizPart = p.quizBest > 0 ? p.quizBest / 100 : 0;
  return Math.min(100, Math.round(((lessonPart + quizPart) / 2) * 100));
}

function overallProgress() {
  if (!courses.length) return 0;
  return Math.round(courses.reduce((sum, c) => sum + courseProgress(c.id), 0) / courses.length);
}

function navigate(view, id = "") {
  const hash = id ? `#/${view}/${id}` : `#/${view}`;
  history.pushState({}, "", hash);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return { view: parts[0] || "home", id: parts[1] || "" };
}

function header(active = "home") {
  return `
    <header class="topbar">
      <a class="brand" href="#/home" data-nav="home">
        <span class="brand-mark">S</span>
        <span><strong>Skill</strong>Bridge<small>LEARN • PRACTISE • GROW</small></span>
      </a>
      <nav class="nav-links">
        <a class="${active === "home" ? "active" : ""}" href="#/home">Home</a>
        <a class="${active === "courses" ? "active" : ""}" href="#/courses">Courses</a>
        <a class="${active === "progress" ? "active" : ""}" href="#/progress">Progress</a>
        <a class="${active === "mistakes" ? "active" : ""}" href="#/mistakes">Mistake Journal</a>
      </nav>
      <button class="icon-btn" id="themeBtn" title="Toggle theme">${theme === "dark" ? "☀" : "☾"}</button>
    </header>`;
}

function footer() {
  return `<footer><div><strong>SkillBridge</strong><span>Learn smarter. Connect knowledge. Build confidence.</span></div><span>Built as a learning MVP • ${new Date().getFullYear()}</span></footer>`;
}

function homeView() {
  const featured = courses.slice(0, 3);
  return `
    ${header("home")}
    <main>
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">YOUR LEARNING. YOUR JOURNEY.</span>
          <h1>Learn a skill.<br><em>Build your future.</em></h1>
          <p>SkillBridge brings courses, lessons, practice, resources and progress tracking into one focused learning space.</p>
          <div class="hero-actions">
            <button class="btn primary" data-action="courses">Explore courses →</button>
            <button class="btn ghost-light" data-action="progress">View my progress</button>
          </div>
        </div>
        <div class="hero-panel">
          <div class="mini-window">
            <div class="mini-top"><span></span><span></span><span></span></div>
            <div class="mini-content">
              <div class="mini-label">MY LEARNING</div>
              <div class="big-number">${overallProgress()}%</div>
              <div class="progress-bar"><span style="width:${overallProgress()}%"></span></div>
              <p>Overall course progress</p>
              <div class="mini-grid"><div>📝<b>${courses.length}</b><small>Courses</small></div><div>🎯<b>${mistakes.length}</b><small>Mistakes saved</small></div></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading"><div><span class="eyebrow dark">LEARNING PATHS</span><h2>Choose where to start.</h2></div><button class="text-btn" data-action="courses">View all courses →</button></div>
        <div class="subject-grid">
          ${subjects.map(s => `<button class="subject-card" data-subject="${s.id}"><span class="subject-icon">${s.icon}</span><span><strong>${s.name}</strong><small>${s.description}</small></span><b>→</b></button>`).join("")}
        </div>
      </section>

      <section class="section soft-section">
        <div class="section-heading"><div><span class="eyebrow dark">FEATURED</span><h2>Learn, practise, measure.</h2></div></div>
        <div class="course-grid">${featured.map(courseCard).join("")}</div>
      </section>

      <section class="callout">
        <div><span class="eyebrow dark">SIGNATURE FEATURES</span><h2>Your learning should show you what to do next.</h2><p>Track lessons, test yourself, save mistakes and use trusted resources instead of studying without a plan.</p></div>
        <div class="feature-pills"><span>✓ Syllabus progress</span><span>✓ Instant quiz feedback</span><span>✓ Mistake journal</span><span>✓ Resource links</span></div>
      </section>
    </main>
    ${footer()}`;
}

function courseCard(c) {
  const p = courseProgress(c.id);
  return `
    <article class="course-card">
      <div class="course-icon">${c.icon}</div>
      <div class="course-meta">${c.subject} · ${c.level}</div>
      <h3>${c.title}</h3>
      <p>${c.description}</p>
      <div class="course-progress"><div><span>Progress</span><strong>${p}%</strong></div><div class="progress-bar"><span style="width:${p}%"></span></div></div>
      <button class="btn small" data-course="${c.id}">Open course →</button>
    </article>`;
}

function coursesView() {
  return `
    ${header("courses")}
    <main class="page">
      <section class="page-heading"><span class="eyebrow dark">COURSES</span><h1>Build knowledge that moves with you.</h1><p>Choose a course, study the lesson, practise with a quiz and track your progress.</p>
        <div class="search-wrap"><input id="courseSearch" placeholder="Search courses, subjects or skills..." /><span>⌕</span></div>
      </section>
      <div id="courseResults" class="course-grid">${courses.map(courseCard).join("")}</div>
    </main>
    ${footer()}`;
}

function courseView(id) {
  const c = courseById(id);
  if (!c) return notFound();
  const ls = lessons[id] || [];
  const p = progress[id] || { lessons: [], quizBest: 0 };
  return `
    ${header("courses")}
    <main class="page">
      <button class="back-btn" data-action="courses">← Back to courses</button>
      <section class="course-hero">
        <div class="course-icon large">${c.icon}</div><div><span class="eyebrow dark">${c.subject} • ${c.level}</span><h1>${c.title}</h1><p>${c.description}</p></div>
      </section>
      <div class="course-layout">
        <section>
          <div class="section-heading compact"><div><span class="eyebrow dark">LESSONS</span><h2>Work through the material.</h2></div><span class="score-chip">${courseProgress(id)}% complete</span></div>
          <div class="lesson-list">
            ${ls.map((l, i) => `<button class="lesson-row" data-lesson="${id}:${i}"><span class="lesson-num">${String(i+1).padStart(2,"0")}</span><span><strong>${l.title}</strong><small>${l.sections.length} learning sections</small></span><span>${p.lessons?.includes(i) ? "✓" : "→"}</span></button>`).join("")}
          </div>
          <div class="quiz-launch"><div><span class="eyebrow dark">PRACTICE</span><h2>Ready to test yourself?</h2><p>${(questions[id] || []).length} questions • score capped at 100%</p></div><button class="btn primary" data-quiz="${id}">Start quiz →</button></div>
        </section>
        <aside class="side-card"><span class="eyebrow dark">COURSE SNAPSHOT</span><div class="stat-line"><span>Best quiz score</span><strong>${p.quizBest || 0}%</strong></div><div class="stat-line"><span>Lessons completed</span><strong>${p.lessons?.length || 0}/${ls.length}</strong></div><div class="stat-line"><span>Skills</span><strong>${c.skills.length}</strong></div><h3>Skills you'll practise</h3><div class="tag-list">${c.skills.map(x => `<span>${x}</span>`).join("")}</div></aside>
      </div>
    </main>
    ${footer()}`;
}

function lessonView(courseId, index) {
  const c = courseById(courseId);
  const list = lessons[courseId] || [];
  const i = Number(index);
  const lesson = list[i];
  if (!c || !lesson) return notFound();
  const done = progress[courseId]?.lessons?.includes(i);
  return `
    ${header("courses")}
    <main class="page lesson-page">
      <button class="back-btn" data-course="${courseId}">← Back to course</button>
      <div class="lesson-label">LESSON ${i + 1}</div>
      <h1>${lesson.title}</h1>
      <p class="lead">${c.title} · ${c.subject}</p>
      <div class="lesson-content">
        ${lesson.sections.map((s, n) => `<section class="lesson-section"><span>${String(n+1).padStart(2,"0")}</span><div><h2>${s[0]}</h2><p>${s[1]}</p></div></section>`).join("")}
      </div>
      <div class="lesson-actions">
        <button class="btn ${done ? "secondary" : "primary"}" data-complete="${courseId}:${i}">${done ? "✓ Lesson completed" : "Mark lesson complete"}</button>
        ${i < list.length - 1 ? `<button class="btn outline" data-lesson="${courseId}:${i+1}">Next lesson →</button>` : `<button class="btn outline" data-quiz="${courseId}">Take quiz →</button>`}
      </div>
    </main>
    ${footer()}`;
}

function quizView(id) {
  const c = courseById(id);
  const qs = questions[id] || [];
  if (!c || !qs.length) return notFound();
  if (!quizState || quizState.courseId !== id) quizState = { courseId: id, current: 0, answers: Array(qs.length).fill(null), submitted: false };
  const q = qs[quizState.current];
  const answered = quizState.answers[quizState.current] !== null;
  return `
    ${header("courses")}
    <main class="page quiz-page">
      <button class="back-btn" data-course="${id}">← Back to course</button>
      <div class="quiz-top"><div><span class="eyebrow dark">PRACTICE QUIZ</span><h1>${c.title}</h1></div><span class="score-chip">Question ${quizState.current + 1} / ${qs.length}</span></div>
      <div class="quiz-progress"><span style="width:${((quizState.current)/qs.length)*100}%"></span></div>
      <section class="question-card">
        <span class="question-number">QUESTION ${quizState.current + 1}</span>
        <h2>${q.question}</h2>
        <div class="options">${q.options.map((opt, i) => `<button class="option ${quizState.answers[quizState.current] === i ? "selected" : ""}" data-answer="${i}"><span>${String.fromCharCode(65+i)}</span>${opt}</button>`).join("")}</div>
        ${answered ? `<div class="answer-note">Answer selected. You can change it before moving on.</div>` : ""}
        <div class="quiz-actions">
          <button class="btn outline" data-quiz-prev ${quizState.current === 0 ? "disabled" : ""}>← Previous</button>
          ${quizState.current < qs.length - 1 ? `<button class="btn primary" data-quiz-next ${answered ? "" : "disabled"}>Next →</button>` : `<button class="btn primary" data-submit-quiz ${answered ? "" : "disabled"}>Finish quiz</button>`}
        </div>
      </section>
    </main>
    ${footer()}`;
}

function quizResult(id) {
  const c = courseById(id);
  const qs = questions[id];
  if (!c || !qs || !quizState || quizState.courseId !== id) {
    return `${header("courses")}<main class="page empty-state"><div>📝</div><h1>Quiz session not found.</h1><p>Start the quiz again to generate a result.</p><button class="btn primary" data-course="${id}">Back to course</button></main>${footer()}`;
  }
  let correct = 0;
  qs.forEach((q, i) => { if (quizState.answers[i] === q.answer) correct++; });
  const score = percent(correct, qs.length);
  const p = progress[id] || { lessons: [], quizBest: 0 };
  if (!quizState.resultSaved) {
    p.quizBest = Math.max(p.quizBest || 0, score);
    progress[id] = p;
    qs.forEach((q, i) => {
      if (quizState.answers[i] !== q.answer) {
        mistakes.unshift({ id: `${id}-${q.id}-${Date.now()}-${i}`, courseId: id, question: q.question, chosen: q.options[quizState.answers[i]] ?? "No answer", correct: q.options[q.answer], explanation: q.explanation });
      }
    });
    mistakes = mistakes.slice(0, 50);
    save();
    quizState.resultSaved = true;
  }
  return `
    ${header("courses")}
    <main class="page result-page">
      <div class="result-icon">${score >= 70 ? "✓" : "↻"}</div>
      <span class="eyebrow dark">QUIZ COMPLETE</span>
      <h1>${score}%</h1>
      <p class="result-lead">You got <strong>${correct} out of ${qs.length}</strong> correct.</p>
      <div class="result-card"><div><span>Best score</span><strong>${p.quizBest}%</strong></div><div><span>Mistakes saved</span><strong>${qs.length - correct}</strong></div><div><span>Maximum score</span><strong>100%</strong></div></div>
      <p class="small-note">Your score is calculated as correct answers ÷ total questions × 100, then capped between 0% and 100%.</p>
      <div class="lesson-actions"><button class="btn primary" data-course="${id}">Back to course</button><button class="btn outline" data-action="mistakes">Review mistake journal</button></div>
    </main>
    ${footer()}`;
}

function progressView() {
  const overall = overallProgress();
  return `
    ${header("progress")}
    <main class="page">
      <section class="page-heading"><span class="eyebrow dark">MY PROGRESS</span><h1>See your learning at a glance.</h1><p>Your progress is saved locally in this browser.</p></section>
      <div class="progress-overview"><div class="ring" style="--p:${overall}%"><span>${overall}%</span><small>overall</small></div><div><h2>Keep building.</h2><p>Course progress combines completed lessons and your best quiz score.</p><div class="progress-bar big"><span style="width:${overall}%"></span></div></div></div>
      <div class="progress-list">${courses.map(c => `<div class="progress-row"><span class="course-icon">${c.icon}</span><div><strong>${c.title}</strong><small>${c.subject}</small></div><div class="progress-bar"><span style="width:${courseProgress(c.id)}%"></span></div><b>${courseProgress(c.id)}%</b><button class="text-btn" data-course="${c.id}">Open</button></div>`).join("")}</div>
    </main>
    ${footer()}`;
}

function mistakesView() {
  return `
    ${header("mistakes")}
    <main class="page">
      <section class="page-heading"><span class="eyebrow dark">PERSONAL MISTAKE JOURNAL</span><h1>Turn mistakes into revision.</h1><p>Incorrect quiz answers are saved here automatically so you can revisit them.</p></section>
      ${mistakes.length ? `<div class="mistake-list">${mistakes.map((m, i) => `<article class="mistake-card"><div class="mistake-head"><span>${courseById(m.courseId)?.icon || "📝"} ${courseById(m.courseId)?.title || "Course"}</span><button class="delete-mistake" data-delete-mistake="${i}" title="Remove">×</button></div><h3>${m.question}</h3><p><strong>Your answer:</strong> ${m.chosen}</p><p><strong>Correct answer:</strong> ${m.correct}</p><div class="explanation">${m.explanation}</div></article>`).join("")}</div>` : `<div class="empty-state"><div>✦</div><h2>No mistakes saved yet.</h2><p>Take a quiz. Incorrect answers will appear here automatically.</p><button class="btn primary" data-action="courses">Find a quiz →</button></div>`}
    </main>
    ${footer()}`;
}

function resourcesView() {
  return `
    ${header("resources")}
    <main class="page">
      <section class="page-heading"><span class="eyebrow dark">RESOURCES</span><h1>Useful places to keep learning.</h1><p>SkillBridge points learners toward external educational resources. Always check material against your syllabus and teacher guidance.</p></section>
      <div class="resource-grid">${resources.map(r => `<article class="resource-card"><span class="resource-type">${r.type}</span><h3>${r.title}</h3><p>${r.description}</p><small>Source: ${r.source}</small><a href="${r.url}" target="_blank" rel="noopener noreferrer" class="btn small">Open resource ↗</a></article>`).join("")}</div>
    </main>
    ${footer()}`;
}

function notFound() {
  return `${header()}<main class="page empty-state"><div>404</div><h1>That page isn't here.</h1><button class="btn primary" data-action="home">Go home</button></main>${footer()}`;
}

function render() {
  const { view, id } = parseRoute();
  if (view === "quiz-result") app.innerHTML = quizResult(id);
  else if (view === "course") app.innerHTML = courseView(id);
  else if (view === "lesson") app.innerHTML = lessonView(id.split(":")[0], id.split(":")[1]);
  else if (view === "quiz") app.innerHTML = quizView(id);
  else if (view === "courses") app.innerHTML = coursesView();
  else if (view === "progress") app.innerHTML = progressView();
  else if (view === "mistakes") app.innerHTML = mistakesView();
  else if (view === "resources") app.innerHTML = resourcesView();
  else if (view === "home") app.innerHTML = homeView();
  else app.innerHTML = notFound();
  bind();
}

function bind() {
  document.querySelector("#themeBtn")?.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("skillbridge-theme", theme);
    render();
  });

  document.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.action)));
  document.querySelectorAll("[data-course]").forEach(btn => btn.addEventListener("click", () => navigate("course", btn.dataset.course)));
  document.querySelectorAll("[data-quiz]").forEach(btn => btn.addEventListener("click", () => { quizState = null; navigate("quiz", btn.dataset.quiz); }));
  document.querySelectorAll("[data-lesson]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [courseId, index] = btn.dataset.lesson.split(":");
      navigate("lesson", `${courseId}:${index}`);
    });
  });
  document.querySelectorAll("[data-complete]").forEach(btn => btn.addEventListener("click", () => {
    const [courseId, index] = btn.dataset.complete.split(":");
    progress[courseId] ||= { lessons: [], quizBest: 0 };
    const i = Number(index);
    if (!progress[courseId].lessons.includes(i)) progress[courseId].lessons.push(i);
    save();
    render();
  }));
  document.querySelectorAll("[data-subject]").forEach(btn => btn.addEventListener("click", () => {
    const subject = btn.dataset.subject;
    navigate("courses");
    setTimeout(() => {
      const input = document.querySelector("#courseSearch");
      if (input) { input.value = subject; input.dispatchEvent(new Event("input")); }
    }, 0);
  }));
  document.querySelectorAll("[data-delete-mistake]").forEach(btn => btn.addEventListener("click", () => {
    mistakes.splice(Number(btn.dataset.deleteMistake), 1);
    save();
    render();
  }));

  const search = document.querySelector("#courseSearch");
  if (search) search.addEventListener("input", () => {
    const q = search.value.toLowerCase().trim();
    const filtered = courses.filter(c => [c.title, c.subject, c.category, c.level, ...c.skills, ...c.topics].join(" ").toLowerCase().includes(q));
    document.querySelector("#courseResults").innerHTML = filtered.length ? filtered.map(courseCard).join("") : `<div class="empty-state compact-empty"><div>⌕</div><h2>No courses found.</h2><p>Try a subject, topic or skill.</p></div>`;
    document.querySelectorAll("[data-course]").forEach(btn => btn.addEventListener("click", () => navigate("course", btn.dataset.course)));
  });

  document.querySelectorAll("[data-answer]").forEach(btn => btn.addEventListener("click", () => {
    if (!quizState || quizState.submitted) return;
    quizState.answers[quizState.current] = Number(btn.dataset.answer);
    render();
  }));
  document.querySelector("[data-quiz-prev]")?.addEventListener("click", () => {
    if (quizState.current > 0) quizState.current--;
    render();
  });
  document.querySelector("[data-quiz-next]")?.addEventListener("click", () => {
    if (quizState.answers[quizState.current] !== null) quizState.current++;
    render();
  });
  document.querySelector("[data-submit-quiz]")?.addEventListener("click", () => {
    if (quizState.answers[quizState.current] !== null) navigate("quiz-result", quizState.courseId);
  });
}

window.addEventListener("hashchange", render);
window.addEventListener("popstate", render);

if (!location.hash) history.replaceState({}, "", "#/home");
render();