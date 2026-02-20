// ---------- theme ----------
const root = document.documentElement;
const themeBtn = document.getElementById("themeBtn");

function applyTheme(mode){
  root.dataset.theme = mode;
  localStorage.setItem("theme", mode);
  themeBtn.textContent = mode === "light" ? "⚪" : "🟣";
}
const saved = localStorage.getItem("theme");
if (saved) applyTheme(saved);
else applyTheme(window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark");

themeBtn.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "light" ? "dark" : "light");
});

// ---------- mobile nav ----------
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
menuBtn.addEventListener("click", () => nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

// ---------- header scrolled ----------
const header = document.getElementById("header");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 12));

// ---------- reveal ----------
const io = new IntersectionObserver((entries)=>{
  for(const e of entries) if(e.isIntersecting) e.target.classList.add("show");
},{ threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// ---------- year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- neon background (canvas) ----------
const bg = document.getElementById("bg");
const ctx = bg.getContext("2d", { alpha: true });

let W=0,H=0,DPR=1;
function resize(){
  DPR = Math.min(2, devicePixelRatio || 1);
  W = bg.width = Math.floor(innerWidth * DPR);
  H = bg.height = Math.floor(innerHeight * DPR);
  bg.style.width = innerWidth + "px";
  bg.style.height = innerHeight + "px";
}
addEventListener("resize", resize);
resize();

// neon-ish particles
const N = 80;
const pts = Array.from({length:N}, () => ({
  x: Math.random()*W,
  y: Math.random()*H,
  vx: (Math.random()-.5)*0.35*DPR,
  vy: (Math.random()-.5)*0.35*DPR,
  r: (Math.random()*1.8 + 0.7)*DPR,
  c: ["rgba(124,58,237,.65)","rgba(34,211,238,.65)","rgba(251,113,133,.55)"][Math.floor(Math.random()*3)]
}));

function draw(){
  ctx.clearRect(0,0,W,H);

  // glow haze
  const g = ctx.createRadialGradient(W*0.25,H*0.25, 0, W*0.25,H*0.25, Math.max(W,H)*0.7);
  g.addColorStop(0, "rgba(124,58,237,.14)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // dots
  for(const p of pts){
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>W) p.vx *= -1;
    if(p.y<0||p.y>H) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = p.c;
    ctx.shadowBlur = 14*DPR;
    ctx.shadowColor = p.c;
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // lines
  for(let i=0;i<N;i++){
    for(let j=i+1;j<N;j++){
      const a = pts[i], b = pts[j];
      const dx=a.x-b.x, dy=a.y-b.y;
      const d2=dx*dx+dy*dy;
      const max=(170*DPR)**2;
      if(d2<max){
        const alpha = 1 - d2/max;
        ctx.lineWidth = 1*DPR;
        ctx.strokeStyle = `rgba(34,211,238,${0.10*alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}
draw();

// ---------- gallery ----------
const grid = document.getElementById("galleryGrid");
const search = document.getElementById("search");
const filter = document.getElementById("filter");

const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbClose = document.getElementById("lbClose");
const lbTitle = document.getElementById("lbTitle");
const lbTags = document.getElementById("lbTags");

let ALL = [];

function norm(s){ return (s || "").toLowerCase(); }

function render(items){
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  for(const item of items){
    const card = document.createElement("div");
    card.className = "cardPhoto";

    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.title || "photo";
    img.loading = "lazy";

    const cap = document.createElement("div");
    cap.className = "photoCap";

    const title = document.createElement("span");
    title.textContent = item.title || "";
    cap.appendChild(title);

    (item.tags || []).slice(0,4).forEach(t=>{
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = t;
      cap.appendChild(tag);
    });

    card.appendChild(img);
    card.appendChild(cap);

    card.addEventListener("click", () => openLB(item));
    frag.appendChild(card);
  }

  grid.appendChild(frag);
}

function applyQuery(){
  const q = norm(search.value);
  const f = filter.value;

  const items = ALL.filter(it=>{
    const tags = (it.tags || []).map(norm);
    const okFilter = (f === "all") || tags.includes(f);
    if(!okFilter) return false;

    if(!q) return true;
    const hay = norm(it.title) + " " + tags.join(" ");
    return hay.includes(q);
  });

  render(items);
}

async function loadGallery(){
  try{
    const res = await fetch("gallery.json", { cache: "no-store" });
    ALL = await res.json();
    applyQuery();
  }catch(e){
    grid.innerHTML = `<div class="card">gallery.json が読み込めないっぽい…（ファイル名や場所を確認してね）</div>`;
    console.error(e);
  }
}

search.addEventListener("input", applyQuery);
filter.addEventListener("change", applyQuery);

function openLB(item){
  lbImg.src = item.src;
  lbTitle.textContent = item.title || "";
  lbTags.innerHTML = "";
  (item.tags || []).forEach(t=>{
    const el = document.createElement("span");
    el.className = "tag";
    el.textContent = t;
    lbTags.appendChild(el);
  });
  lightbox.classList.add("show");
  lightbox.setAttribute("aria-hidden","false");
}
function closeLB(){
  lightbox.classList.remove("show");
  lightbox.setAttribute("aria-hidden","true");
  lbImg.src = "";
}
lbClose.addEventListener("click", closeLB);
lightbox.addEventListener("click", (e)=>{ if(e.target === lightbox) closeLB(); });
addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeLB(); });

loadGallery();
