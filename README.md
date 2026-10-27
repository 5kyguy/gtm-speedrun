# gtm-speedrun
Demo of using exported model from Google Teachable Machine

A static page that runs a Teachable Machine image model (thumbs up / thumbs down) on your webcam, live in the browser. Class names come from the model's `metadata.json`. Video never leaves the device.

## Add your model
1. In Teachable Machine (Image project), click **Export Model → TensorFlow.js → Download my model**.
2. Unzip it and put `model.json`, `metadata.json` and `weights.bin` in a `model/` folder at the repo root.

Or use a hosted model: click **Upload my model** in Teachable Machine, then open
`https://5kyguy.github.io/gtm-speedrun/?model=https://teachablemachine.withgoogle.com/models/XXXX/`

## Deploy on GitHub Pages
1. Push to `main`.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch `main`, folder `/ (root)` → Save.
3. It goes live at `https://5kyguy.github.io/gtm-speedrun/` in about a minute. Pages serves HTTPS, which the camera needs.

## Run locally
`python3 -m http.server 8000`, then open http://localhost:8000.

Uses @tensorflow/tfjs 1.3.1 and @teachablemachine/image 0.8.5 from jsDelivr.
