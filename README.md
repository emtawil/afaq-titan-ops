# منصة القيادة والمراقبة — آفاق تيتان (نسخة العرض)

## Setup on your Mac (one time, needs internet)
    npm install
    npm run tiles          # downloads Misrata map tiles (zoom 11-15, ~700 tiles) into public/tiles
                           # if slow/failing:  node scripts/download-tiles.mjs 14
## Run
    npm start              # builds the static export, opens Electron fullscreen (F11 toggles)
    npm run windowed       # same, but maximized window instead of fullscreen (after a build)

## Your videos (auto-detected, otherwise a synthetic feed is shown)
Put MP4 files in public/feeds/ then run `npm start` again:
    front.mp4  front-zoom.mp4  rear.mp4  side-right.mp4  side-left.mp4  cabin.mp4  body.mp4
(body.mp4 = officer chest-cam.) 10-30 s loops, 1280x720 H.264 recommended.

## Hidden demo keys (layout-independent, never shown in UI)
    S = SOS from the officer nearest the selected unit  -> then use «استقبال» / «إرسال أقرب دورية»
    A = AI person-detection alert
    K = dual-authorization engine-stop dialog
Sound is muted by default (speaker icon in the top bar).

## Offline proof
The Electron shell cancels every http/https/ws request. Turn WiFi off and the app behaves identically.

## Notes
- Routes/waypoints live in data/fleet.ts (approximate Tripoli geography — review on the real map and adjust).
- Simulation runs 3x visual time-scale (lib/simulation/engine.ts, SCALE) so movement is visible.
- Proposal: proposal/index.html (Cmd+P -> Save as PDF) — PDF already generated beside it.
