(function () {
  'use strict';
  var params = new URLSearchParams(window.location.search);
  var MODEL_URL = params.get('model') || './model/';
  if (!MODEL_URL.endsWith('/')) MODEL_URL += '/';

  var camBox = document.getElementById('webcam-container');
  var msgEl = document.getElementById('cam-msg');
  var statusEl = document.getElementById('status');
  var enableBtn = document.getElementById('enable');
  var labelEl = document.getElementById('label');
  var barsEl = document.getElementById('bars');
  var model = null, webcam = null, rows = [], busy = false;

  function status(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.className = 'status' + (isError ? ' error' : '');
  }

  function buildBars(names) {
    barsEl.innerHTML = '';
    rows = names.map(function (n) {
      var row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = '<div class="name"><span></span><span class="pct">0%</span></div><div class="track"><div class="fill"></div></div>';
      row.querySelector('.name span').textContent = n;
      barsEl.appendChild(row);
      return { row: row, pct: row.querySelector('.pct'), fill: row.querySelector('.fill') };
    });
  }

  async function loadModel() {
    if (model) return;
    try {
      model = await tmImage.load(MODEL_URL + 'model.json', MODEL_URL + 'metadata.json');
    } catch (e) {
      console.error(e);
      var err = new Error('Model not found at ' + MODEL_URL + '\nExport from Teachable Machine (Export Model → TensorFlow.js → Download) and put model.json, metadata.json and weights.bin in the model/ folder, or add ?model=<shareable link> to the URL.');
      err.fatal = true;
      throw err;
    }
    buildBars(model.getClassLabels());
  }

  function cameraError(e) {
    var name = e && e.name;
    if (!window.isSecureContext) return 'The camera needs HTTPS (or localhost).';
    if (name === 'NotAllowedError' || name === 'SecurityError') return 'Camera access was blocked.\nAllow the camera for this site, then try again.';
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera found on this device.';
    if (name === 'NotReadableError') return 'The camera is in use by another app.';
    return 'Could not start the camera.';
  }

  async function startCamera() {
    var size = Math.min(640, Math.max(240, Math.floor(camBox.clientWidth || 400)));
    var cam = new tmImage.Webcam(size, size, true); // mirrored
    await cam.setup({ facingMode: 'user' });
    if (cam.webcam) {
      cam.webcam.setAttribute('playsinline', '');
      cam.webcam.muted = true;
    }
    await cam.play();
    webcam = cam;
    msgEl.hidden = true;
    camBox.appendChild(cam.canvas);
  }

  async function loop() {
    webcam.update();
    var preds = await model.predict(webcam.canvas);
    var best = 0;
    preds.forEach(function (p, i) { if (p.probability > preds[best].probability) best = i; });
    labelEl.textContent = preds[best].className;
    preds.forEach(function (p, i) {
      var pct = Math.round(p.probability * 100);
      rows[i].pct.textContent = pct + '%';
      rows[i].fill.style.width = pct + '%';
      rows[i].row.classList.toggle('top', i === best);
    });
    window.requestAnimationFrame(loop);
  }

  async function run() {
    if (busy) return;
    busy = true;
    enableBtn.hidden = true;
    try {
      if (typeof tmImage === 'undefined') {
        var libErr = new Error('Could not load the ML libraries. Check the internet connection and reload.');
        libErr.fatal = true;
        throw libErr;
      }
      status('Loading model…');
      await loadModel();
      status('Starting camera…');
      try {
        await startCamera();
      } catch (e) {
        console.error(e);
        status(cameraError(e), true);
        enableBtn.hidden = false;
        return;
      }
      window.requestAnimationFrame(loop);
    } catch (e) {
      status(e.message, true);
      if (!e.fatal) enableBtn.hidden = false;
    } finally {
      busy = false;
    }
  }

  enableBtn.addEventListener('click', run);
  run();

  // "How this works" modal: native <dialog> gives Esc, focus trap and focus return
  var dlg = document.getElementById('how');
  var howBtn = document.getElementById('how-btn');
  var closeBtn = document.getElementById('how-close');
  howBtn.addEventListener('click', function () {
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    closeBtn.focus();
  });
  function closeDlg() {
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }
  dlg.addEventListener('close', function () { howBtn.focus(); });
  closeBtn.addEventListener('click', closeDlg);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(); });
})();
