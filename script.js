const SUPABASE_URL = "https://wpxvclssrnichxhjhdiu.supabase.co";
const SUPABASE_KEY = "sb_publishable_-DwTBZoumyW-FhutxJR5mQ_OU2LzZfA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let jobs = [];
const jobListDiv = document.getElementById("job-list");

const categories = ["All", "Tech", "Trades", "Agriculture", "Retail", "Freelance", "Informal", "Apprenticeship"];
let activeCategory = "All";
let districtQuery = "";
let currentUser = null;

const observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
});

function observeCards() {
  document.querySelectorAll(".job-card").forEach(function (card) {
    observer.observe(card);
  });
}

function observeInfoBlocks() {
  document.querySelectorAll(".info-block").forEach(function (block) {
    observer.observe(block);
  });
}

observeInfoBlocks();

async function checkAuth() {
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session ? data.session.user : null;
  updateAuthUI();
}

function updateAuthUI() {
  const loggedOut = document.getElementById("auth-logged-out");
  const loggedIn = document.getElementById("auth-logged-in");
  const userEmailSpan = document.getElementById("auth-user-email");

  if (currentUser) {
    loggedOut.classList.add("hidden");
    loggedIn.classList.remove("hidden");
    userEmailSpan.textContent = currentUser.email;
  } else {
    loggedOut.classList.remove("hidden");
    loggedIn.classList.add("hidden");
  }
}

checkAuth();

document.getElementById("signup-btn").addEventListener("click", async function () {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  const { error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account created! Check your email to confirm, then log in.");
});

document.getElementById("login-btn").addEventListener("click", async function () {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = data.user;
  updateAuthUI();
});

document.getElementById("logout-btn").addEventListener("click", async function () {
  await supabaseClient.auth.signOut();
  currentUser = null;
  updateAuthUI();
});

async function loadJobs() {
  const { data, error } = await supabaseClient
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading jobs:", error);
    return;
  }

  jobs = data;
  renderJobs();
}

function renderJobs() {
  jobListDiv.innerHTML = "";

  let filteredJobs = activeCategory === "All"
    ? jobs
    : jobs.filter(function (job) { return job.category === activeCategory; });

  if (districtQuery.trim() !== "") {
    filteredJobs = filteredJobs.filter(function (job) {
      return job.district.toLowerCase().includes(districtQuery.toLowerCase());
    });
  }

  filteredJobs.forEach(function (job) {
    const card = document.createElement("div");
    card.className = "job-card";

    card.innerHTML = `
      <h2>${job.title}</h2>
      <p>${job.poster} — ${job.district}</p>
      <p>${job.category} · ${job.pay}</p>
      <a href="https://wa.me/${(job.contact || "").replace(/[^0-9]/g, "")}" target="_blank">Contact on WhatsApp</a>
      <br>
      <input type="text" class="pin-input" placeholder="Enter PIN" maxlength="4" style="width: 80px;">
      <button type="button" class="delete-btn">Delete</button>
    `;

    const deleteBtn = card.querySelector(".delete-btn");
    const pinInput = card.querySelector(".pin-input");

    deleteBtn.addEventListener("click", async function () {
      const isOwner = currentUser && job.user_id === currentUser.id;

      if (!isOwner) {
        const enteredPin = pinInput.value;
        if (enteredPin !== job.pin) {
          alert("Incorrect PIN.");
          return;
        }
      }

      const { error } = await supabaseClient
        .from("jobs")
        .delete()
        .eq("id", job.id);

      if (error) {
        alert("Something went wrong deleting this job.");
        return;
      }

      loadJobs();
    });

    jobListDiv.appendChild(card);
  });

  observeCards();
}

function renderCategoryFilters() {
  const container = document.getElementById("category-filters");
  container.innerHTML = "";

  const categoryIcons = {
    All: "📋",
    Tech: "💻",
    Trades: "🔧",
    Agriculture: "🌾",
    Retail: "🛍️",
    Freelance: "✍️",
    Informal: "🧺",
    Apprenticeship: "🎓"
  };

  categories.forEach(function (cat) {
    const btn = document.createElement("button");
    btn.textContent = categoryIcons[cat] + " " + cat;
    btn.style.fontWeight = cat === activeCategory ? "bold" : "normal";

    btn.addEventListener("click", function () {
      activeCategory = cat;
      renderJobs();
      renderCategoryFilters();
    });

    container.appendChild(btn);
  });
}

loadJobs();
renderCategoryFilters();

const districtSearchInput = document.getElementById("district-search");

districtSearchInput.addEventListener("input", function () {
  districtQuery = districtSearchInput.value;
  renderJobs();
});

const form = document.getElementById("job-form");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const newJob = {
    title: document.getElementById("title").value,
    poster: document.getElementById("poster").value,
    district: document.getElementById("district").value,
    pay: document.getElementById("pay").value,
    contact: document.getElementById("contact").value,
    category: document.getElementById("category").value,
    pin: document.getElementById("pin").value,
    user_id: currentUser ? currentUser.id : null
  };

  const { error } = await supabaseClient.from("jobs").insert([newJob]);

  if (error) {
    console.error("Error posting job:", error);
    alert("Something went wrong posting your job.");
    return;
  }

  form.reset();
  loadJobs();
});

const heroPattern = document.querySelector(".hero-pattern");

window.addEventListener("scroll", function () {
  const scrollY = window.scrollY;
  if (heroPattern) {
    heroPattern.style.transform = `translateY(${scrollY * 0.3}px)`;
  }
});

const chatToggle = document.getElementById("chat-toggle");
const chatWindow = document.getElementById("chat-window");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");

chatToggle.addEventListener("click", function () {
  chatWindow.classList.toggle("hidden");

  if (chatMessages.children.length === 0) {
    addChatMessage("bot", "Hi! Ask me things like 'any tech jobs?' or 'jobs in Bo'.");
  }
});

function addChatMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = "chat-msg " + sender;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatQuery(text) {
  const lower = text.toLowerCase();
  let matchedCategory = null;
  let matchedDistrict = null;

  categories.forEach(function (cat) {
    if (cat !== "All" && lower.includes(cat.toLowerCase())) {
      matchedCategory = cat;
    }
  });

  jobs.forEach(function (job) {
    if (job.district && lower.includes(job.district.toLowerCase())) {
      matchedDistrict = job.district;
    }
  });

  if (matchedCategory) {
    activeCategory = matchedCategory;
    districtQuery = "";
    renderJobs();
    renderCategoryFilters();
    return `Showing ${matchedCategory} jobs for you below!`;
  }

  if (matchedDistrict) {
    districtQuery = matchedDistrict;
    document.getElementById("district-search").value = matchedDistrict;
    renderJobs();
    return `Here are jobs in ${matchedDistrict}!`;
  }

  if (lower.includes("post") || lower.includes("hire")) {
    return "Scroll up to the form at the top of the page to post a job or gig!";
  }

  return "I can help you find jobs by category (like Tech, Trades, Retail) or by district (like Freetown, Bo, Kono). Try asking!";
}

chatSend.addEventListener("click", function () {
  const text = chatInput.value.trim();
  if (text === "") return;

  addChatMessage("user", text);
  const reply = handleChatQuery(text);
  addChatMessage("bot", reply);
  chatInput.value = "";
});

chatInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    chatSend.click();
  }
});