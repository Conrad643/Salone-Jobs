const SUPABASE_URL = "https://wpxvclssrnichxhjhdiu.supabase.co";
const SUPABASE_KEY = "sb_publishable_-DwTBZoumyW-FhutxJR5mQ_OU2LzZfA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let jobs = [];
const jobListDiv = document.getElementById("job-list");

const categories = ["All", "Tech", "Trades", "Agriculture", "Retail", "Freelance", "Informal", "Apprenticeship"];
let activeCategory = "All";
let districtQuery = "";

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
      <button type="button" class="delete-btn">Delete</button>
    `;

    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async function () {
      const enteredPin = prompt("Enter the 4-digit PIN to delete this listing:");
      if (enteredPin === null) return; // cancelled
      if (enteredPin !== job.pin) {
        alert("Incorrect PIN.");
        return;
      }

      const { error } = await supabaseClient.from("jobs").delete().eq("id", job.id);
      if (error) {
        alert("Something went wrong deleting the job.");
        return;
      }

      loadJobs();
    });
    jobListDiv.appendChild(card);
  });
}

function renderCategoryFilters() {
  const container = document.getElementById("category-filters");
  container.innerHTML = "";

  categories.forEach(function (cat) {
    const btn = document.createElement("button");
    btn.textContent = cat;
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
    pin: document.getElementById("pin").value
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