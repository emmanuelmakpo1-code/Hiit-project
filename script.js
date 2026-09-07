const DB_USERS = "pl_users";
const DB_SESSIONS = "pl_sessions";
const DB_REQUESTS = "pl_requests";
const SS_CURRENT_USER = "pl_current_user";
const SS_ACTIVE_SESSION = "pl_active_session";

const LOCATIONS = ["Library", "Room A", "Study Hall", "Student Center"];

function getUsers() { return JSON.parse(localStorage.getItem(DB_USERS) || "[]"); }
function saveUsers(list) { localStorage.setItem(DB_USERS, JSON.stringify(list)); }

function getSessions() { return JSON.parse(localStorage.getItem(DB_SESSIONS) || "[]"); }
function saveSessions(list) { localStorage.setItem(DB_SESSIONS, JSON.stringify(list)); }

function getLiveSessions() { return getSessions().filter(s => s.status === "live"); }

function startLiveSession(mentor, { title, subject, description = "" }) {
  const sessions = getSessions();
  const newSession = {
    id: "s_live_" + Date.now(),
    mentorId: mentor.id,
    mentorName: mentor.name,
    title: title || `${mentor.name.split(" ")[0]}'s Live Lecture`,
    subject: subject || "General",
    description,
    locationType: "online",
    locationDetail: "",
    datetime: new Date().toISOString().slice(0, 16),
    attendees: [],
    status: "live",
    startedAt: Date.now()
  };
  sessions.push(newSession);
  saveSessions(sessions);
  return newSession;
}

function setSessionStatus(sessionId, status) {
  const sessions = getSessions();
  const s = sessions.find(x => x.id === sessionId);
  if (s) { s.status = status; saveSessions(sessions); }
}

function getRequests() { return JSON.parse(localStorage.getItem(DB_REQUESTS) || "[]"); }
function saveRequests(list) { localStorage.setItem(DB_REQUESTS, JSON.stringify(list)); }

function sendMentorshipRequest(mentee, mentor, subject, note) {
  const requests = getRequests();
  const exists = requests.some(r => r.mentorId === mentor.id && r.menteeId === mentee.id && r.status === "pending");
  if (exists) return null;
  const req = {
    id: "r_" + Date.now(), mentorId: mentor.id, menteeId: mentee.id, menteeName: mentee.name,
    subject: subject || "General mentorship", note: note || "", status: "pending"
  };
  requests.push(req);
  saveRequests(requests);
  return req;
}

function getPendingRequestsForMentor(mentorId) {
  return getRequests().filter(r => r.mentorId === mentorId && r.status === "pending");
}

function respondToRequest(requestId, accept) {
  const requests = getRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) return;
  req.status = accept ? "accepted" : "declined";
  saveRequests(requests);
  if (accept) {
    const users = getUsers();
    const mentor = users.find(u => u.id === req.mentorId);
    if (mentor) {
      mentor.students = mentor.students || [];
      if (!mentor.students.some(s => s.id === req.menteeId)) {
        mentor.students.push({ id: req.menteeId, name: req.menteeName, subject: req.subject });
      }
      saveUsers(users);
      if (getCurrentUser() && getCurrentUser().id === mentor.id) setCurrentUser(mentor);
    }
  }
}

function getRoster(mentorId) {
  const mentor = getUsers().find(u => u.id === mentorId);
  return (mentor && mentor.students) || [];
}

function getCurrentUser() {
  const raw = sessionStorage.getItem(SS_CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}
function setCurrentUser(user) { sessionStorage.setItem(SS_CURRENT_USER, JSON.stringify(user)); }
function logout() { sessionStorage.removeItem(SS_CURRENT_USER); window.location.href = "index.html"; }

function initials(name) {
  return (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function seedData() {
  if (getUsers().length) return;
  const mentors = [
    {
      id: "u_amara", role: "mentor", name: "Amara Chukwu", email: "amara@school.edu", password: "demo1234",
      bio: "Final-year Computer Science student who loves breaking down algorithms into everyday language.",
      cgpa: 4.85, subjects: ["Data Structures", "Algorithms", "Python"],
      awards: ["Dean's List x3", "Best Final Year Project 2025"],
      merits: ["Peer Tutor of the Year"], certifications: ["AWS Cloud Practitioner"],
      rating: 4.9, sessionsHosted: 34
    },
    {
      id: "u_daniel", role: "mentor", name: "Daniel Okafor", email: "daniel@school.edu", password: "demo1234",
      bio: "300-level Mechanical Engineering student, big on thermodynamics and exam strategy.",
      cgpa: 4.5, subjects: ["Thermodynamics", "Calculus II", "Statics"],
      awards: ["Faculty Merit Award 2024"], merits: ["100% mentee satisfaction, Fall 2025"],
      certifications: [], rating: 4.7, sessionsHosted: 21
    },
    {
      id: "u_zainab", role: "mentor", name: "Zainab Bello", email: "zainab@school.edu", password: "demo1234",
      bio: "Economics major and debate captain — mentors in micro/macro econ and academic writing.",
      cgpa: 4.62, subjects: ["Microeconomics", "Academic Writing", "Statistics"],
      awards: ["Vice Chancellor's Honour Roll"], merits: ["Writing Center Star Tutor"],
      certifications: ["Google Data Analytics"], rating: 4.8, sessionsHosted: 28
    }
  ];
  const mentees = [
    { id: "u_tife", role: "mentee", name: "Tife Adeyemi", email: "tife@school.edu", password: "demo1234" }
  ];
  saveUsers([...mentors, ...mentees]);

  const now = Date.now();
  const sessions = [
    {
      id: "s1", mentorId: "u_amara", mentorName: "Amara Chukwu", title: "Big-O Notation, Demystified",
      subject: "Algorithms", description: "We'll work through common time-complexity traps with live examples.",
      locationType: "online", locationDetail: "", datetime: new Date(now + 86400000).toISOString().slice(0,16),
      attendees: ["u_tife"], status: "scheduled"
    },
    {
      id: "s2", mentorId: "u_daniel", mentorName: "Daniel Okafor", title: "Thermo Exam Crunch Session",
      subject: "Thermodynamics", description: "Rapid-fire past questions before Friday's test.",
      locationType: "in-person", locationDetail: "Study Hall", datetime: new Date(now + 172800000).toISOString().slice(0,16),
      attendees: [], status: "scheduled"
    },
    {
      id: "s3", mentorId: "u_zainab", mentorName: "Zainab Bello", title: "Macroeconomics: Inflation Explained",
      subject: "Microeconomics", description: "A live walkthrough of this week's inflation problem set — join any time, it's happening now.",
      locationType: "online", locationDetail: "", datetime: new Date(now).toISOString().slice(0,16),
      attendees: [], status: "live", startedAt: now - 4 * 60000
    }
  ];
  saveSessions(sessions);

  saveRequests([
    { id: "r1", mentorId: "u_amara", menteeId: "u_tife", menteeName: "Tife Adeyemi", subject: "Data Structures", note: "Struggling with linked lists ahead of Monday's quiz.", status: "pending" },
    { id: "r2", mentorId: "u_amara", menteeId: "u_chidi_demo", menteeName: "Chidi Umeh", subject: "Algorithms", note: "Would love consistent weekly check-ins this semester.", status: "pending" }
  ]);
}

function requireRole(role) {
  const u = getCurrentUser();
  if (!u || u.role !== role) {
    window.location.href = "auth.html";
    return null;
  }
  return u;
}

function renderNavbar(mountId, opts = {}) {
  const el = document.getElementById(mountId);
  if (!el) return;
  const u = getCurrentUser();
  let right = `<a href="auth.html" class="btn btn-outline-tm btn-sm me-2">Log in</a>`;
  if (u) {
    right = `
      <span class="me-3 d-none d-sm-inline text-ink-soft" style="color:var(--gray); font-size:.9rem;">
        ${u.role === "mentor" ? "🎓" : "📘"} ${u.name.split(" ")[0]}
      </span>
      <button class="btn btn-outline-tm btn-sm" onclick="logout()">Log out</button>`;
  }
  el.innerHTML = `
  <nav class="navbar navbar-expand-lg tm-navbar">
    <div class="container">
      <a class="navbar-brand tm-brand" href="index.html">
        <svg class="logomark" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6" cy="14" r="5" fill="url(#lg-blue)"/>
          <circle cx="26" cy="6" r="5" fill="url(#lg-purple)"/>
          <path d="M10 12 Q18 2 22 8" stroke="#c7ccff" stroke-width="1.6" fill="none" stroke-dasharray="1 4" stroke-linecap="round"/>
          <defs>
            <linearGradient id="lg-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b6dff"/><stop offset="1" stop-color="#3b5bff"/></linearGradient>
            <linearGradient id="lg-purple" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>
          </defs>
        </svg>
        TutorMeet
      </a>
      <div class="d-flex align-items-center">${right}</div>
    </div>
  </nav>`;
}

document.addEventListener("DOMContentLoaded", seedData);
