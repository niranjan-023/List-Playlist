const $ = id => document.getElementById(id);
let plTitle = "playlist";
let items = [];
let lastLink = "";
let audioOk = false;

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
  lastLink = link;
  resetAudio();
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

/* ================= MP3 .zip export ================= */
let jobId = null, pollTimer = null, pollFails = 0;

function aNote(html, isErr){ const n=$("anote"); n.innerHTML = html; n.className = "anote" + (isErr ? " err" : ""); }
function esc(t){ const d=document.createElement("div"); d.textContent=t; return d.innerHTML; }

function resetAudio(){
  clearTimeout(pollTimer); jobId = null;
  $("audio").classList.remove("on");
  $("afill").style.width = "0";
  $("mp3").disabled = !audioOk;
  $("bitrate").disabled = !audioOk;
  aNote(audioOk ? "" : "MP3 export isn't available: the server needs yt-dlp and ffmpeg installed (see the README).", !audioOk);
}

fetch("/api/capabilities").then(r => r.json()).then(c => {
  audioOk = !!c.audio;
  if (items.length) resetAudio();
}).catch(() => { audioOk = false; });

function stopAudio(){
  clearTimeout(pollTimer);
  $("mp3").disabled = false; $("bitrate").disabled = false;
  $("audio").classList.remove("on");
  document.body.classList.remove("busy");
}

async function startMp3(){
  if (!lastLink || !items.length) return;
  $("mp3").disabled = true; $("bitrate").disabled = true;
  aNote("");
  $("afill").style.width = "0";
  $("astatus").textContent = "Starting export…";
  $("acancel").disabled = false;
  $("audio").classList.add("on");
  document.body.classList.add("busy");
  try {
    const r = await fetch("/api/audio/start", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ url: lastLink, bitrate: +$("bitrate").value, numbered: $("num").checked })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Request failed (" + r.status + ")");
    jobId = d.id; pollFails = 0;
    poll();
  } catch(e){
    stopAudio();
    aNote("Couldn't start the export: " + esc(e.message), true);
  }
}

async function poll(){
  if (!jobId) return;
  try {
    const r = await fetch("/api/audio/" + jobId);
    const s = await r.json();
    if (!r.ok) throw new Error(s.error || "Request failed (" + r.status + ")");
    pollFails = 0;

    const pct = s.total ? Math.round(s.done / s.total * 100) : 0;
    $("afill").style.width = pct + "%";

    if (s.status === "running"){
      const cur = s.current.length ? " · " + s.current[0] : "";
      $("astatus").textContent = "Converting " + s.done + " / " + s.total + cur;
      pollTimer = setTimeout(poll, 1000);
      return;
    }

    const id = jobId; jobId = null;
    stopAudio();
    if (s.status === "done"){
      const skipped = s.failed ? " " + s.failed + " track" + (s.failed === 1 ? "" : "s") + " skipped." : "";
      aNote("ZIP ready with " + s.ok + " MP3" + (s.ok === 1 ? "" : "s") + "." + skipped +
        ' If the download didn\'t start, <a href="/api/audio/' + id + '/download">save it here</a>.');
      const a = document.createElement("a");
      a.href = "/api/audio/" + id + "/download";
      document.body.appendChild(a); a.click(); a.remove();
      setStatus("Your MP3 .zip is downloading.");
    } else if (s.status === "cancelled"){
      aNote("Export cancelled.");
    } else {
      aNote("Export failed: " + esc(s.error || "unknown error"), true);
    }
  } catch(e){
    if (++pollFails < 4){ pollTimer = setTimeout(poll, 1500); return; }
    jobId = null; stopAudio();
    aNote("Lost contact with the server: " + esc(e.message), true);
  }
}

$("mp3").addEventListener("click", startMp3);
$("acancel").addEventListener("click", async () => {
  if (!jobId) return;
  const id = jobId; jobId = null;
  clearTimeout(pollTimer);
  $("acancel").disabled = true;
  try { await fetch("/api/audio/" + id, { method: "DELETE" }); } catch(e){}
  stopAudio();
  aNote("Export cancelled.");
});
