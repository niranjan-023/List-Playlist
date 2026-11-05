const $ = id => document.getElementById(id);
let plTitle = "playlist";
let items = [];

function setStatus(msg, isErr){ const s=$("status"); s.textContent=msg; s.className=isErr?"err":""; }
const videoUrl = id => "https://www.youtube.com/watch?v=" + id;

// Plain-text output used by Download and Copy (respects the two options)
function buildText(){
  const num = $("num").checked, urls = $("urls").checked;
  return items.map((v,i) =>
    (num ? (i+1) + ". " : "") + v.title + (urls ? "  " + videoUrl(v.id) : "")
  ).join("\n");
}

// Visual track list with live filter
function renderList(){
  const q = $("filter").value.trim().toLowerCase();
  const list = $("list");
  list.textContent = "";
  const shown = items.map((v,i) => ({v,i})).filter(x => x.v.title.toLowerCase().includes(q));
  if (!shown.length){
    const li = document.createElement("li");
    li.className = "none"; li.textContent = "No tracks match your filter.";
    list.appendChild(li); return;
  }
  shown.forEach(({v,i}, k) => {
    const li = document.createElement("li");
    li.style.animationDelay = Math.min(k, 15) * 25 + "ms";
    const n = document.createElement("span"); n.className = "n"; n.textContent = i + 1;
    const t = document.createElement("span"); t.className = "t"; t.textContent = v.title; t.title = v.title;
    const a = document.createElement("a"); a.href = videoUrl(v.id); a.target = "_blank"; a.rel = "noopener"; a.textContent = "Open ↗";
    li.append(n, t, a);
    list.appendChild(li);
  });
}

async function run(){
  const link = $("url").value.trim();
  $("result").style.display = "none";
  if (!link) return setStatus("Paste a YouTube playlist link first.", true);

  $("go").disabled = true;
  document.body.classList.add("busy");
  setStatus("Fetching videos…");
  let data;
  try {
    // The server reads the API key from .env and talks to YouTube for us
    const r = await fetch("/api/playlist?url=" + encodeURIComponent(link));
    data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed (" + r.status + ")");
  } catch(e){
    $("go").disabled = false;
    document.body.classList.remove("busy");
    return setStatus("Couldn't load the playlist: " + e.message, true);
  }
  $("go").disabled = false;
  document.body.classList.remove("busy");

  items = data.videos;
  plTitle = data.title || "playlist";
  if (!items.length) return setStatus("No public videos found in this playlist.", true);

  $("filter").value = "";
  $("plname").textContent = plTitle;
  $("count").textContent = items.length + (items.length === 1 ? " track" : " tracks");
  renderList();
  $("result").style.display = "block";
  $("result").scrollIntoView({behavior:"smooth", block:"nearest"});
  setStatus("Found " + items.length + " videos in “" + plTitle + "”.");
}

$("go").addEventListener("click", run);
$("url").addEventListener("keydown", e => { if (e.key === "Enter") run(); });
$("filter").addEventListener("input", renderList);

$("dl").addEventListener("click", () => {
  const blob = new Blob([buildText() + "\n"], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = plTitle.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0,80) + ".txt";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(buildText()); setStatus("Copied to clipboard."); }
  catch(e){ setStatus("Couldn't access the clipboard. Use Download .txt instead.", true); }
});
