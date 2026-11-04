# Playlist to TXT

A simple web app that turns a YouTube playlist link into a downloadable `.txt` file of video titles.

## Features

- Paste a playlist link and get every video title
- Handles playlists of any length (fetches 50 videos per request)
- Skips private and deleted videos
- Optional numbering and video links
- Download as `.txt` or copy to clipboard
- Light and dark mode

## Project structure

```
index.html   # page structure
style.css    # styling
script.js    # app logic
```

## Getting started

1. Clone or download this repo.
2. Open `index.html` in your browser. No build step or server needed.
3. Paste your YouTube playlist link and your API key.
4. Click **Get video names**, then **Download .txt**.

## Getting a YouTube API key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **YouTube Data API v3**.
3. Under **Credentials**, create an **API key**.

The key is stored only in your browser's local storage and is sent only to Google's API.

## Tech

Plain HTML, CSS and JavaScript, using the YouTube Data API v3.

