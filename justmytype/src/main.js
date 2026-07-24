import { createClient } from "@supabase/supabase-js";
import "../styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;
const configured = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = configured ? createClient(supabaseUrl, supabaseAnonKey) : null;

const typeOptions = ["ENFP", "INFJ", "INTJ", "ESFJ", "ISTP", "ENTJ", "ISFP", "ENFJ"];
const interests = ["books", "live music", "fitness", "film", "travel", "coffee", "cooking", "design", "hiking", "volunteering"];
let session = null;
let myProfile = null;
let candidates = [];
let matches = [];
let activeCandidate = null;
let activeMatch = null;

const demoProfiles = [
  { id: "demo-maya", display_name: "Maya", age: 41, city: "Brooklyn", intent: "Long-term", personality_type: "INFJ", bio: "Ceramicist, slow brunch defender, and person who reads every museum plaque.", interests: ["books", "coffee", "design"], compatibility: 93, photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-noah", display_name: "Noah", age: 44, city: "Queens", intent: "Intentional dating", personality_type: "INTJ", bio: "Product lead, amateur pasta scientist, excellent parallel parker.", interests: ["cooking", "fitness", "travel"], compatibility: 88, photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-sana", display_name: "Sana", age: 39, city: "Manhattan", intent: "Intentional dating", personality_type: "ENTJ", bio: "Founder, boxing class loyalist, softer than my calendar implies.", interests: ["fitness", "travel", "books"], compatibility: 84, photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80" }
];

function html(strings, ...values) {
  return strings.map((part, index) => `${part}${values[index] ?? ""}`).join("");
}

function profileText(profile) {
  return [profile.display_name, profile.age, profile.city, profile.intent, profile.personality_type, profile.bio, ...(profile.interests || [])].join(" ");
}

async function embedProfile(profile) {
  if (!configured || !session) return;
  const text = profileText(profile);
  const { error: functionError } = await supabase.functions.invoke("embed-profile", { body: { text } });
  if (!functionError) return;

  if (!openAiKey) return;
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text })
  });
  if (!response.ok) return;
  const data = await response.json();
  await supabase.from("profiles").update({ embedding: data.data[0].embedding }).eq("id", session.user.id);
}

async function loadSession() {
  if (!configured) return;
  const result = await supabase.auth.getSession();
  session = result.data.session;
  supabase.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    boot();
  });
}

async function signIn(email) {
  await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  toast("Check your email for the sign-in link.");
}

async function signOut() {
  await supabase.auth.signOut();
}

async function loadMyProfile() {
  if (!configured || !session) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
  myProfile = data;
  return data;
}

async function saveProfile(event) {
  event.preventDefault();
  if (!configured || !session) return;
  const form = new FormData(event.currentTarget);
  const picked = [...document.querySelectorAll("[data-interest]:checked")].map((box) => box.value);
  let photoUrl = myProfile?.photo_url || null;
  const photo = form.get("photo");

  if (photo?.size) {
    const path = `${session.user.id}/${crypto.randomUUID()}-${photo.name}`;
    const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, photo, { upsert: false });
    if (uploadError) throw uploadError;
    photoUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  }

  const profile = {
    id: session.user.id,
    display_name: form.get("display_name"),
    full_name: form.get("display_name"),
    age: Number(form.get("age")),
    city: form.get("city"),
    intent: form.get("intent"),
    interested_in: form.get("intent"),
    personality_type: form.get("personality_type"),
    bio: form.get("bio"),
    interests: picked,
    photo_url: photoUrl,
    avatar_url: photoUrl
  };

  const { error } = await supabase.from("profiles").upsert(profile);
  if (error) throw error;
  myProfile = profile;
  await embedProfile(profile);
  await refreshData();
  render();
}

async function refreshData() {
  if (!configured || !session || !myProfile) {
    candidates = demoProfiles;
    matches = [];
    return;
  }
  const { data: profileMatches } = await supabase.rpc("match_profiles", { limit_count: 20 });
  candidates = profileMatches || [];
  const { data: matchRows } = await supabase
    .from("matches")
    .select("id, created_at, user1_id, user2_id, profiles_1:profiles!matches_user1_id_fkey(*), profiles_2:profiles!matches_user2_id_fkey(*)")
    .order("created_at", { ascending: false });
  matches = matchRows || [];
}

async function swipe(liked) {
  if (!activeCandidate) return;
  if (!configured || !session) {
    candidates = candidates.filter((candidate) => candidate.id !== activeCandidate.id);
    activeCandidate = candidates[0] || null;
    render();
    return;
  }
  if (liked) {
    await supabase.from("likes").upsert({ liker_id: session.user.id, liked_id: activeCandidate.id });
  }
  await refreshData();
  render();
}

async function sendMessage(event) {
  event.preventDefault();
  if (!configured || !session || !activeMatch) return;
  const input = document.querySelector("#message-input");
  const body = input.value.trim();
  if (!body) return;
  await supabase.from("messages").insert({ match_id: activeMatch.id, sender_id: session.user.id, message: body });
  input.value = "";
  await loadMessages(activeMatch);
}

async function loadMessages(match) {
  activeMatch = match;
  if (!configured || !session) return;
  const { data } = await supabase.from("messages").select("*").eq("match_id", match.id).order("created_at");
  document.querySelector("#chat-body").innerHTML = (data || []).map((message) => `<div class="bubble ${message.sender_id === session.user.id ? "me" : ""}">${message.message}</div>`).join("");
}

function otherProfile(match) {
  if (!session) return null;
  return match.user1_id === session.user.id ? match.profiles_2 : match.profiles_1;
}

function renderAuth() {
  document.querySelector("#app").innerHTML = html`
    <main class="auth-screen">
      <section class="auth-panel">
        <p class="eyebrow">VibeMatch</p>
        <h1>Meet people who match how you actually think.</h1>
        <p>Email sign-in, Supabase profiles, photo uploads, AI embeddings, swipe matching, and chat are ready once your environment is connected.</p>
        ${configured ? html`
          <form id="login-form" class="auth-form">
            <input name="email" type="email" placeholder="you@example.com" required>
            <button class="primary-button" type="submit">Send sign-in link</button>
          </form>` : html`
          <div class="empty">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable live auth. Demo mode is available below.</div>
          <button class="primary-button" id="demo-mode" type="button">Open demo mode</button>`}
      </section>
    </main>`;

  document.querySelector("#login-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    signIn(new FormData(event.currentTarget).get("email"));
  });
  document.querySelector("#demo-mode")?.addEventListener("click", () => {
    myProfile = { display_name: "Julia", age: 38, city: "New York", intent: "Intentional dating", personality_type: "ENFP", bio: "Thoughtful and funny, with follow-through.", interests: ["books", "coffee", "design"] };
    render();
  });
}

function renderShell() {
  document.querySelector("#app").innerHTML = html`
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#discover"><span class="brand-mark">J</span><span><strong>VibeMatch</strong><small>dating, less guessing</small></span></a>
        <nav class="nav-list">
          <button class="nav-link active" data-view="discover">Discover</button>
          <button class="nav-link" data-view="matches">Matches</button>
          <button class="nav-link" data-view="profile">Profile</button>
        </nav>
        <section class="mini-panel"><p class="eyebrow">Status</p><p>${configured ? "Live Supabase mode" : "Demo mode"}</p></section>
      </aside>
      <main class="main">
        <header class="topbar">
          <div><p class="eyebrow" id="screen-eyebrow">Today in your type</p><h1 id="screen-title">Discover</h1></div>
          <div class="top-actions">${configured ? `<button class="primary-button" id="sign-out" type="button">Sign out</button>` : ""}</div>
        </header>
        <section id="discover-view" class="view active-view"></section>
        <section id="matches-view" class="view"></section>
        <section id="profile-view" class="view"></section>
      </main>
    </div>`;

  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.querySelector("#sign-out")?.addEventListener("click", signOut);
  renderDiscover();
  renderMatches();
  renderProfile();
}

function renderDiscover() {
  activeCandidate = candidates[0] || null;
  const view = document.querySelector("#discover-view");
  if (!activeCandidate) {
    view.innerHTML = `<div class="empty">No more profiles yet. Invite people to sign up or reset swipes in Supabase.</div>`;
    return;
  }
  view.innerHTML = html`
    <div class="discover-layout">
      <article class="profile-card">
        <div class="profile-photo" style="background-image:url('${activeCandidate.photo_url || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"}')">
          <div><h2>${activeCandidate.display_name}, ${activeCandidate.age}</h2><p>${activeCandidate.city} - ${activeCandidate.personality_type}</p></div>
        </div>
        <div class="profile-body">
          <p class="card-meta">${activeCandidate.intent} - ${activeCandidate.compatibility || 70}% fit</p>
          <p>${activeCandidate.bio}</p>
          <div class="tag-row">${(activeCandidate.interests || []).map((item) => `<span class="tag">${item}</span>`).join("")}</div>
        </div>
      </article>
      <aside class="insights">
        <h2>Why this match</h2>
        <ul>
          <li>AI similarity compares profile text, intent, personality type, and interests.</li>
          <li>${sharedInterests(activeCandidate)} shared interests.</li>
          <li>Mutual likes automatically create a match.</li>
        </ul>
        <div class="action-row">
          <button class="pass-button" id="pass-profile" type="button">Pass</button>
          <button class="like-button" id="like-profile" type="button">Like</button>
        </div>
      </aside>
    </div>`;
  document.querySelector("#pass-profile").addEventListener("click", () => swipe(false));
  document.querySelector("#like-profile").addEventListener("click", () => swipe(true));
}

function sharedInterests(profile) {
  const mine = myProfile?.interests || [];
  return (profile.interests || []).filter((item) => mine.includes(item)).length;
}

function renderMatches() {
  const view = document.querySelector("#matches-view");
  view.innerHTML = html`
    <div class="messages-layout">
      <div class="thread-list">
        ${matches.length ? matches.map((match) => {
          const profile = otherProfile(match);
          return `<button class="thread-item" data-match="${match.id}" type="button"><strong>${profile?.display_name || "Match"}</strong><p>Open chat</p></button>`;
        }).join("") : `<div class="empty">Matches appear after two people like each other.</div>`}
      </div>
      <div class="chat-panel">
        <div class="chat-head">Messages</div>
        <div class="chat-body" id="chat-body"></div>
        <form class="chat-form" id="chat-form"><input id="message-input" placeholder="Write a message..."><button class="primary-button" type="submit">Send</button></form>
      </div>
    </div>`;
  document.querySelectorAll("[data-match]").forEach((button) => button.addEventListener("click", () => loadMessages(matches.find((match) => String(match.id) === button.dataset.match))));
  document.querySelector("#chat-form").addEventListener("submit", sendMessage);
}

function renderProfile() {
  const view = document.querySelector("#profile-view");
  const p = myProfile || {};
  view.innerHTML = html`
    <form class="profile-summary" id="profile-form">
      <p class="eyebrow">Your profile</p>
      <div class="form-grid">
        <label>Name <input name="display_name" value="${p.display_name || ""}" required></label>
        <label>Age <input name="age" type="number" min="35" max="99" value="${p.age || 38}" required></label>
        <label>City <input name="city" value="${p.city || ""}" required></label>
        <label>Intent <select name="intent">${["Long-term", "Intentional dating", "New friends first", "Still figuring it out"].map((item) => `<option ${p.intent === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label>Personality <select name="personality_type">${typeOptions.map((item) => `<option ${p.personality_type === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label>Photo <input name="photo" type="file" accept="image/*"></label>
      </div>
      <label>Bio <textarea name="bio" rows="4" required>${p.bio || ""}</textarea></label>
      <fieldset><legend>Interests</legend><div class="chip-grid">${interests.map((item) => `<label><input type="checkbox" data-interest value="${item}" ${(p.interests || []).includes(item) ? "checked" : ""}>${item}</label>`).join("")}</div></fieldset>
      <button class="primary-button full" type="submit">Save profile</button>
    </form>`;
  document.querySelector("#profile-form").addEventListener("submit", (event) => saveProfile(event).catch((error) => toast(error.message)));
}

function switchView(viewName) {
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active-view"));
  document.querySelector(`#${viewName}-view`).classList.add("active-view");
  document.querySelector("#screen-title").textContent = viewName[0].toUpperCase() + viewName.slice(1);
}

function toast(message) {
  const old = document.querySelector(".toast");
  old?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 4500);
}

async function boot() {
  await loadMyProfile();
  await refreshData();
  if (!session && !myProfile) renderAuth();
  else renderShell();
}

await loadSession();
await boot();
