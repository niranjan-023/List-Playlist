const $ = id => document.getElementById(id);
let plTitle = "playlist";

function setStatus(msg, isErr){ const s=$("status"); s.textContent=msg; s.className=isErr?"err":""; }

async function run(){
  const link = $("url").value.trim();
  $("result").style.display = "none";
  if (!link) return setStatus("Paste a YouTube playlist link first.", true);

  $("go").disabled = true;
  setStatus("Fetching videos…");
  let data;
  try {
    // The server reads the API key from .env and talks to YouTube for us
    const r = await fetch("/api/playlist?url=" + encodeURIComponent(link));
    data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed (" + r.status + ")");
  } catch(e){
    $("go").disabled = false;
    return setStatus("Couldn't load the playlist: " + e.message, true);
  }
  $("go").disabled = false;

  const items = data.videos;
  plTitle = data.title || "playlist";
  if (!items.length) return setStatus("No public videos found in this playlist.", true);

  const num = $("num").checked, urls = $("urls").checked;
  $("out").value = items.map((v,i) =>
    (num ? (i+1) + ". " : "") + v.title + (urls ? "  https://www.youtube.com/watch?v=" + v.id : "")
  ).join("\n");
  $("result").style.display = "block";
  setStatus("Found " + items.length + " videos in “" + plTitle + "”.");
}

$("go").addEventListener("click", run);
$("url").addEventListener("keydown", e => { if (e.key === "Enter") run(); });

$("dl").addEventListener("click", () => {
  const blob = new Blob([$("out").value + "\n"], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = plTitle.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0,80) + ".txt";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("out").value); setStatus("Copied to clipboard."); }
  catch(e){ $("out").select(); setStatus("Press Ctrl/Cmd+C to copy the selected text."); }
});
