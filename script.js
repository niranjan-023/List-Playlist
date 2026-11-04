const $ = id => document.getElementById(id);
let plTitle = "playlist";

try { $("key").value = localStorage.getItem("yt_api_key") || ""; } catch(e){}

function setStatus(msg, isErr){ const s=$("status"); s.textContent=msg; s.className=isErr?"err":""; }

function getPlaylistId(text){
  text = text.trim();
  try { const id = new URL(text).searchParams.get("list"); if (id) return id; } catch(e){}
  return /^(PL|UU|LL|FL|OL)[\w-]{10,}$/.test(text) ? text : null;
}

async function api(path, params){
  const q = new URLSearchParams(params).toString();
  const r = await fetch("https://www.googleapis.com/youtube/v3/" + path + "?" + q);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error && j.error.message ? j.error.message : "Request failed (" + r.status + ")");
  return j;
}

async function run(){
  const id = getPlaylistId($("url").value);
  const key = $("key").value.trim();
  $("result").style.display = "none";
  if (!id) return setStatus("That doesn't look like a playlist link. It should contain ?list=...", true);
  if (!key) return setStatus("Add your YouTube Data API key to continue.", true);
  try { localStorage.setItem("yt_api_key", key); } catch(e){}

  $("go").disabled = true;
  const items = [];
  try {
    const info = await api("playlists", {part:"snippet", id, key});
    plTitle = info.items && info.items[0] ? info.items[0].snippet.title : "playlist";
    let token = "";
    do {
      setStatus("Fetching videos… " + items.length + " so far");
      const p = {part:"snippet", playlistId:id, maxResults:50, key};
      if (token) p.pageToken = token;
      const j = await api("playlistItems", p);
      j.items.forEach(it => {
        const t = it.snippet.title;
        if (t === "Private video" || t === "Deleted video") return;
        items.push({title:t, id:it.snippet.resourceId.videoId});
      });
      token = j.nextPageToken || "";
    } while (token);
  } catch(e){
    $("go").disabled = false;
    return setStatus("Couldn't load the playlist: " + e.message, true);
  }
  $("go").disabled = false;
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
