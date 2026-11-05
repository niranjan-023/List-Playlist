require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

// Serve only the three public front-end files (never the whole folder, so .env stays private)
["index.html", "style.css", "script.js"].forEach(f => {
  app.get(f === "index.html" ? ["/", "/index.html"] : "/" + f, (req, res) =>
    res.sendFile(path.join(__dirname, f)));
});

function getPlaylistId(text){
  text = (text || "").trim();
  try { const id = new URL(text).searchParams.get("list"); if (id) return id; } catch(e){}
  return /^(PL|UU|LL|FL|OL)[\w-]{10,}$/.test(text) ? text : null;
}

async function yt(endpoint, params){
  const q = new URLSearchParams({ ...params, key: API_KEY }).toString();
  const r = await fetch("https://www.googleapis.com/youtube/v3/" + endpoint + "?" + q);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error && j.error.message ? j.error.message : "YouTube API error (" + r.status + ")");
  return j;
}

app.get("/api/playlist", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "Server is missing YOUTUBE_API_KEY. Add it to your .env file and restart." });

  const id = getPlaylistId(req.query.url);
  if (!id) return res.status(400).json({ error: "That doesn't look like a playlist link. It should contain ?list=..." });

  try {
    const info = await yt("playlists", { part: "snippet", id });
    if (!info.items || !info.items.length) return res.status(404).json({ error: "Playlist not found. Is it public or unlisted?" });
    const title = info.items[0].snippet.title;

    const videos = [];
    let token = "";
    do {
      const p = { part: "snippet", playlistId: id, maxResults: 50 };
      if (token) p.pageToken = token;
      const j = await yt("playlistItems", p);
      j.items.forEach(it => {
        const t = it.snippet.title;
        if (t === "Private video" || t === "Deleted video") return;
        videos.push({ title: t, id: it.snippet.resourceId.videoId });
      });
      token = j.nextPageToken || "";
    } while (token);

    res.json({ title, videos });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log("Playlist to TXT running at http://localhost:" + PORT);
  if (!API_KEY) console.warn("Warning: YOUTUBE_API_KEY is not set. Create a .env file (see .env.example).");
});
