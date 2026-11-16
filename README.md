# Magic Land

An offline learning and play game for a 5-year-old. Pick a **Unicorn** or **Princess**, roam a magical meadow,
and play **Learn & Play** games that teach **shapes and numbers**. Everything runs in the phone's browser and
works in airplane mode after the first visit. No ads, no accounts, no internet needed.

## Play it

**On the phone (once, needs wifi):** open the game's web address in Safari (iPhone) or Chrome (Android),
then Share → **Add to Home Screen**. Open it from the icon once while online. After that it works with no signal.

**On the Mac:**
```bash
node tools/record-server.js        # also serves the game
# open http://localhost:8766
```

## Learn & Play (the 🎮 button)

| Shapes | Numbers | More fun |
|---|---|---|
| 🧩 **Shape Sorter**: drag shapes to their homes | 🍎 **Count with Me**: tap to count aloud, then pick the number | 🩺 **Dr. Unicorn**: help a poorly animal with bandage shapes, pills to count, a heartbeat to count and a temperature to read |
| 🫧 **Pop the Shape**: pop the named shape | 🥕 **Feed the Animals**: drag exactly N treats to the plate | 📒 **Sticker book**: every win unlocks an animal sticker |
| 🏰 **Build with Shapes**: make a house, rocket, castle from shapes | 🚂 **Number Train**: put the carriages in order | |
| ✏️ **Trace It**: trace shapes and the numbers 0 to 9 | 🎈 **Balloon Pop**: pop the number, or pop 1 to 10 in order | |
| 🃏 **Memory Match**: shapes, then numerals matched to dots | ➕ **Add It Up**: adding and taking away with pictures | |

### 🎨 Colouring (in the same menu)

- **Free Draw**: marker, crayon, rainbow and sparkle brushes, eraser, paint bucket, 3 sizes, undo.
- **Colouring Pages**: pick a category (🦖 dinosaurs, 🐱 animals, 🧜‍♀️ mermaids, 🦄 unicorns, 🐠 ocean, 🚀 space, 🚗 vehicles, 🌸 garden) and a picture. Every picture is drawn by the game, so the 🎲 button makes a new variation each time. Tap a shape to fill it, or paint with the brushes.
- **My Photo**: choose or take a photo and the game turns it into a black and white colouring page (🔍 changes how detailed it is). The photo never leaves the phone.
- **Colour wheel** (the 🎨 swatch): drag on the wheel to mix any colour, slide for lighter or darker. Your mixed colours are remembered.
- 💾 saves or shares the finished picture (the share sheet on iPhone, a download elsewhere).

Each game has 3 to 4 levels and moves up automatically as she wins. There are no wrong-answer penalties: a gentle "try again".

Magic Land itself (the meadow) has a quest bar, dress-up room, build mode, pets, paint, dance floor, magic doors,
a treasure cave, weather and a race. The 🎒 toy box holds those extras.

## Your voice (recorded lines)

All spoken lines can be your own recordings. No recording yet? The phone's built-in voice covers that line.

1. `node tools/record-server.js`
2. Open **http://localhost:8766/tools/recorder.html** in Chrome or Safari on the Mac and allow the microphone.
3. Press **Space**, say the line, press **Space** again. It trims the silence, saves to `audio/`, and jumps to the next line.
   Re-record any line any time. The recorder opens on **Core lines first** (about 100 lines the games use most); switch to All lines for the rest (about 180). Start there.
4. Commit and push the new `audio/` files (see below).

Numbers are stitched together from your clips ("three hundred and forty five"), so you only record 0 to 20, the tens, and "hundred".
The full list of lines lives in `js/phrases.js`.

## Updating the offline cache

After changing anything (or recording voice lines) run:

```bash
node tools/build.js
```

It rewrites `precache.json` and stamps `sw.js` with a new version, so phones download the update next time they are online.
The recorder does this automatically after every save.

## Publishing with GitHub Pages (free)

1. Create a new repository on github.com (**public** is needed for free Pages).
2. In this folder: `git remote add origin <your-repo-url>` then `git push -u origin main`.
3. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**.
4. After a minute the game is live at `https://<your-username>.github.io/<repo-name>/`.
5. Open that address on the phone and Add to Home Screen.

There is no build step to host: GitHub Pages serves the files as they are. To update the game later, commit and push.

## Project layout

```
index.html            page shell
css/style.css         all styles
js/world.js           Magic Land (the meadow) and shared audio/sound effects
js/engine.js          mini game engine: stage, drawing kit, drag and drop, tweens
js/hub.js             Learn & Play menu and sticker book
js/games/*.js         shapes.js, numbers.js, clinic.js
js/art-lib.js         the colouring page pictures (drawn in code)
js/colour.js          free draw, colouring, photo converter, colour wheel
js/phrases.js         every spoken line (used by the game and the recorder)
js/voice.js           plays your recordings, falls back to the phone voice
audio/                your recorded lines (.m4a) and manifest.json
tools/                recorder (record-server.js, recorder.html) and build.js
sw.js, precache.json  offline support
```

## Start over

On the "Who do you want to be?" screen (🔄 button), **hold** the 🔁 Start over button for 2 seconds to clear stars, stickers, outfits and buildings.

## If there is no sound or voice on a phone

- Every spoken line now also appears as a **caption** on screen, so the game still has directions without sound.
- Sound check for grown-ups: open Learn & Play and tap the **Learn & Play** title 5 times quickly. A panel shows what the audio and voice are doing, with test buttons (Say hello, Plain voice test, Beep).
- Check the phone volume, that the silent switch is off, and (iPhone) Settings → Accessibility → Spoken Content has an English voice downloaded.

**Note:** the iPhone's built-in voice does not work inside the home-screen app on some phones. Recorded lines do not have that problem, which is why recording is the real fix.
