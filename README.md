# Playlist to TXT

Paste a YouTube playlist link and download every video title as a `.txt` file. The YouTube API key lives in a `.env` file on the server, so visitors never have to enter one.

## Features

- Glassy, music-inspired UI: animated equalizer, floating colour orbs and a cursor-following glow
- Get every video title from a playlist of any length
- Scrollable track list with a live filter and an "Open" link per video
- Skips private and deleted videos
- Optional numbering and video links
- Download as `.txt` or copy to clipboard
- API key stays on the server, never sent to the browser

## Project structure

```
index.html     # page structure
style.css      # styling
script.js      # front-end logic (track list, filter, download, copy)
server.js      # Node/Express server, reads .env and calls YouTube
package.json   # dependencies
.env.example   # template for your secret key
```

## Setup

### 1. Install Node.js
Version 18 or newer. Check with `node -v`.

### 2. Get a YouTube Data API key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and sign in.
2. Create a new project (top bar, **New Project**).
3. Open **APIs & Services > Library**, search for **YouTube Data API v3** and click **Enable**.
4. Open **APIs & Services > Credentials**, click **Create Credentials > API key**, and copy the key.
5. (Recommended) Click the key, then under **API restrictions** choose **YouTube Data API v3** only.

### 3. Add the key to `.env`
In the project folder, copy the example file:

```bash
cp .env.example .env
```

Open `.env` and set the variable **`YOUTUBE_API_KEY`**:

```
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

No quotes, no spaces around `=`. You can also set `PORT` (default `3000`).

### 4. Install and run

```bash
npm install
npm start
```

Open **http://localhost:3000**, paste a playlist link, and click **Get video names**.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Server is missing YOUTUBE_API_KEY" | Make sure the file is named exactly `.env` (not `.env.txt`), sits next to `server.js`, and you restarted the server. |
| "API key not valid" | Re-copy the key and check that YouTube Data API v3 is enabled for the project. |
| "Playlist not found" | The playlist must be public or unlisted. |
| Quota exceeded | The free quota is 10,000 units per day. Each page of 50 videos costs about 1 unit. Try again tomorrow. |

## Tech

HTML, CSS, vanilla JavaScript, Node.js, Express, and the YouTube Data API v3.

