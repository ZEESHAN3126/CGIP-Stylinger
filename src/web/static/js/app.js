/**
 * Stylinger Web Studio — Client Orchestration Script (Phase 2 — Integration)
 *
 * Implements:
 *  - Dual image upload (portrait + garment) with drag-and-drop and file picker
 *  - Transform control sliders with live label updates
 *  - Segment-preview API call (POST /api/tryon/segment-preview)
 *  - Full try-on pipeline call (POST /api/tryon/process)
 *  - Result display with tabbed views (result / original / compare / seg overlay)
 *  - Split-screen curtain comparison slider
 *  - Pipeline stage progress animation
 *  - Backend health telemetry
 *  - Download result
 *
 * Strictly Vanilla ES6+ — Zero Framework Dependencies.
 */

'use strict';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  portraitFile: null,
  garmentFile: null,
  selectedCategory: 'T-Shirt',
  processing: false,
  lastResult: null,
  segmentOverlayUrl: null,
};

// ---------------------------------------------------------------------------
// DOM references (initialised after DOMContentLoaded)
// ---------------------------------------------------------------------------
let els = {};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  initStatusBar();
  initUploadZone('portrait', 'portrait-dropzone', 'portrait-file-input', 'portrait-browse-btn', 'portrait-preview');
  initUploadZone('garment', 'garment-dropzone', 'garment-file-input', 'garment-browse-btn', 'garment-preview');
  initSliders();
  initCategoryChips();
  initCatalogCards();
  initActionButtons();
  initResultTabs();
  initCompareSlider();
  updateActionButtons();
});

// ---------------------------------------------------------------------------
// Cache DOM elements
// ---------------------------------------------------------------------------
function cacheElements() {
  els = {
    statusDot:        document.getElementById('status-dot'),
    statusText:       document.getElementById('status-text'),
    btnRunTryon:      document.getElementById('btn-run-tryon'),
    btnSegPreview:    document.getElementById('btn-segment-preview'),
    btnResetStudio:   document.getElementById('btn-reset-studio'),
    btnResetControls: document.getElementById('reset-controls-btn'),
    progressZone:     document.getElementById('progress-zone'),
    progressFill:     document.getElementById('progress-bar-fill'),
    progressLabel:    document.getElementById('progress-label'),
    alertZone:        document.getElementById('alert-zone'),
    resultSection:    document.getElementById('result-section'),
    resultImg:        document.getElementById('result-img'),
    originalImg:      document.getElementById('original-img'),
    compareResultImg: document.getElementById('compare-result-img'),
    compareOrigImg:   document.getElementById('compare-original-img'),
    compareCurtain:   document.getElementById('compare-curtain'),
    compareSlider:    document.getElementById('compare-slider'),
    segOverlayImg:    document.getElementById('segment-overlay-img'),
    resultMetaRow:    document.getElementById('result-meta-row'),
    warningsZone:     document.getElementById('warnings-zone'),
    downloadLink:     document.getElementById('download-link'),
    telemetryPanel:   document.getElementById('telemetry-panel'),
    telemetryList:    document.getElementById('telemetry-list'),
    pipelineStepper:  document.getElementById('pipeline-stepper'),
    selectedCatVal:   document.getElementById('selected-category-value'),
  };
}

// ---------------------------------------------------------------------------
// Backend health telemetry
// ---------------------------------------------------------------------------
async function initStatusBar() {
  setStatus('checking', 'Checking tryon-service…');
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const tryon = data.tryon_service;
    if (tryon && tryon.online) {
      setStatus('online', `Tryon-service ONLINE · OpenCV ${tryon.opencv_version || '?'}`);
    } else {
      setStatus('degraded', 'Web studio online · Tryon-service OFFLINE — start it separately');
    }
  } catch {
    setStatus('offline', 'Backend offline — run: python -m flask run');
  }
}

function setStatus(mode, text) {
  const dot = els.statusDot;
  const label = els.statusText;
  dot.className = 'status-dot';
  if (mode === 'online')    { dot.classList.add('status-dot--online'); }
  else if (mode === 'degraded') { dot.classList.add('status-dot--degraded'); }
  else if (mode === 'offline')  { dot.classList.add('status-dot--offline'); }
  // 'checking' stays as default
  label.textContent = text;
}

// ---------------------------------------------------------------------------
// Upload zones
// ---------------------------------------------------------------------------
function initUploadZone(stateKey, dropzoneId, inputId, btnId, previewId) {
  const dropzone = document.getElementById(dropzoneId);
  const input    = document.getElementById(inputId);
  const btn      = document.getElementById(btnId);
  const preview  = document.getElementById(previewId);
  const inner    = dropzone.querySelector('.dropzone-inner');

  if (!dropzone || !input) return;

  // Prevent browser default drag behavior
  const stopDefault = e => { e.preventDefault(); e.stopPropagation(); };
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
    dropzone.addEventListener(ev, stopDefault);
    document.body.addEventListener(ev, stopDefault);
  });

  // Visual hover on dragover
  ['dragenter', 'dragover'].forEach(ev => {
    dropzone.addEventListener(ev, () => dropzone.classList.add('dragover'));
  });
  ['dragleave', 'drop'].forEach(ev => {
    dropzone.addEventListener(ev, () => dropzone.classList.remove('dragover'));
  });

  // File drop
  dropzone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(stateKey, file, preview, inner);
  });

  // Keyboard activation
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  // Click on dropzone opens file picker
  dropzone.addEventListener('click', () => input.click());

  // Browse button
  btn.addEventListener('click', e => { e.stopPropagation(); input.click(); });

  // File picker change
  input.addEventListener('change', () => {
    if (input.files[0]) handleFileSelected(stateKey, input.files[0], preview, inner);
  });
}

function handleFileSelected(stateKey, file, previewImg, innerEl) {
  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showAlert('error', `Unsupported file type: ${file.type}. Please use PNG, JPG, or WEBP.`);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showAlert('error', `File "${file.name}" exceeds the 10 MB limit (${(file.size / 1048576).toFixed(1)} MB).`);
    return;
  }

  state[stateKey + 'File'] = file;

  // Show thumbnail
  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    previewImg.removeAttribute('hidden');
    if (innerEl) innerEl.style.display = 'none';
  };
  reader.readAsDataURL(file);

  clearAlert();
  updateActionButtons();
  resetPipelineStages();
}

// ---------------------------------------------------------------------------
// Slider controls
// ---------------------------------------------------------------------------
function initSliders() {
  const sliderDefs = [
    { id: 'ctrl-scale',    valId: 'val-scale',    fmt: v => `${parseFloat(v).toFixed(2)}×` },
    { id: 'ctrl-offset-x', valId: 'val-offset-x', fmt: v => `${v} px` },
    { id: 'ctrl-offset-y', valId: 'val-offset-y', fmt: v => `${v} px` },
    { id: 'ctrl-rotation', valId: 'val-rotation',  fmt: v => `${v}°` },
    { id: 'ctrl-feather',  valId: 'val-feather',   fmt: v => `${v} px` },
    { id: 'ctrl-opacity',  valId: 'val-opacity',   fmt: v => `${Math.round(v * 100)}%` },
  ];

  sliderDefs.forEach(({ id, valId, fmt }) => {
    const slider = document.getElementById(id);
    const label  = document.getElementById(valId);
    if (!slider || !label) return;
    label.textContent = fmt(slider.value);
    slider.addEventListener('input', () => { label.textContent = fmt(slider.value); });
  });

  // Reset button
  if (els.btnResetControls) {
    els.btnResetControls.addEventListener('click', () => {
      const defaults = { 'ctrl-scale': '1.0', 'ctrl-offset-x': '0', 'ctrl-offset-y': '0',
                         'ctrl-rotation': '0', 'ctrl-feather': '3', 'ctrl-opacity': '1.0' };
      sliderDefs.forEach(({ id, valId, fmt }) => {
        const slider = document.getElementById(id);
        const label  = document.getElementById(valId);
        if (slider) { slider.value = defaults[id]; if (label) label.textContent = fmt(defaults[id]); }
      });
    });
  }

  // Lighting toggle aria sync
  const lightingToggle = document.getElementById('ctrl-match-lighting');
  if (lightingToggle) {
    lightingToggle.addEventListener('change', () => {
      lightingToggle.setAttribute('aria-checked', String(lightingToggle.checked));
    });
  }
}

// ---------------------------------------------------------------------------
// Category chips + catalog cards
// ---------------------------------------------------------------------------
function initCategoryChips() {
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      state.selectedCategory = chip.dataset.category;
      if (els.selectedCatVal) els.selectedCatVal.textContent = state.selectedCategory;
    });
  });
}

function initCatalogCards() {
  document.querySelectorAll('.catalog-card').forEach(card => {
    card.addEventListener('click', () => selectCatalogCard(card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCatalogCard(card); }
    });
  });
}

function selectCatalogCard(card) {
  document.querySelectorAll('.catalog-card').forEach(c => {
    c.classList.remove('selected');
    c.setAttribute('aria-selected', 'false');
  });
  card.classList.add('selected');
  card.setAttribute('aria-selected', 'true');

  // Sync category chip
  const cat = card.dataset.category;
  if (cat) {
    state.selectedCategory = cat;
    if (els.selectedCatVal) els.selectedCatVal.textContent = cat;
    document.querySelectorAll('.category-chip').forEach(chip => {
      const isMatch = chip.dataset.category === cat;
      chip.classList.toggle('active', isMatch);
      chip.setAttribute('aria-pressed', String(isMatch));
    });
  }
}

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------
function initActionButtons() {
  if (els.btnRunTryon) els.btnRunTryon.addEventListener('click', runTryon);
  if (els.btnSegPreview) els.btnSegPreview.addEventListener('click', runSegmentPreview);
  if (els.btnResetStudio) els.btnResetStudio.addEventListener('click', resetStudio);
}

function updateActionButtons() {
  const hasPortrait = !!state.portraitFile;
  const hasGarment  = !!state.garmentFile;
  const busy        = state.processing;

  if (els.btnRunTryon) {
    els.btnRunTryon.disabled = !(hasPortrait && hasGarment && !busy);
  }
  if (els.btnSegPreview) {
    els.btnSegPreview.disabled = !(hasPortrait && !busy);
  }
}

// ---------------------------------------------------------------------------
// Segment preview
// ---------------------------------------------------------------------------
async function runSegmentPreview() {
  if (!state.portraitFile || state.processing) return;

  state.processing = true;
  updateActionButtons();
  clearAlert();
  showProgress('Segmenting body regions…', 40);
  activatePipelineStages(['upload', 'preprocess', 'hsv', 'segment', 'morphology', 'contours', 'anchors']);

  try {
    const fd = new FormData();
    fd.append('user_image', state.portraitFile);

    const res = await fetch('/api/tryon/segment-preview', { method: 'POST', body: fd });
    const data = await res.json();

    hideProgress();

    if (!data.success) {
      showAlert('error', data.error || 'Segmentation preview failed.');
      return;
    }

    // Store and show in the segment tab
    state.segmentOverlayUrl = data.overlay_base64;
    if (els.segOverlayImg) els.segOverlayImg.src = data.overlay_base64;

    // Show result section with segment tab active
    showResultSection();
    switchTab('segment');

    completePipelineStages(['upload', 'preprocess', 'hsv', 'segment', 'morphology', 'contours', 'anchors']);
    showAlert('success', 'Segmentation preview complete. Shoulder anchors and torso bounding box are overlaid in green.');

  } catch (err) {
    hideProgress();
    showAlert('error', `Network error during segmentation: ${err.message}`);
  } finally {
    state.processing = false;
    updateActionButtons();
  }
}

// ---------------------------------------------------------------------------
// Full try-on pipeline
// ---------------------------------------------------------------------------
async function runTryon() {
  if (!state.portraitFile || !state.garmentFile || state.processing) return;

  state.processing = true;
  updateActionButtons();
  clearAlert();

  // Stage animation
  resetPipelineStages();
  showProgress('Initialising pipeline…', 5);
  await animatePipelineStages();

  try {
    const fd = new FormData();
    fd.append('user_image',  state.portraitFile);
    fd.append('garment_image', state.garmentFile);
    fd.append('category', state.selectedCategory);
    fd.append('scale',    document.getElementById('ctrl-scale').value);
    fd.append('offset_x', document.getElementById('ctrl-offset-x').value);
    fd.append('offset_y', document.getElementById('ctrl-offset-y').value);
    fd.append('rotation', document.getElementById('ctrl-rotation').value);
    fd.append('feather_radius', document.getElementById('ctrl-feather').value);
    fd.append('opacity',  document.getElementById('ctrl-opacity').value);
    fd.append('match_lighting', document.getElementById('ctrl-match-lighting').checked ? 'true' : 'false');

    setProgress(70, 'Running affine transform & compositing…');

    const res = await fetch('/api/tryon/process', { method: 'POST', body: fd });
    const data = await res.json();

    setProgress(100, 'Done.');
    await sleep(300);
    hideProgress();

    if (!data.success) {
      showAlert('error', data.error || 'Try-on processing failed.');
      return;
    }

    state.lastResult = data;
    renderResult(data);
    completePipelineStages(['upload', 'preprocess', 'hsv', 'segment', 'morphology', 'contours', 'anchors', 'transform', 'composite', 'compare']);
    renderTelemetry(data.telemetry);

  } catch (err) {
    hideProgress();
    showAlert('error', `Network error: ${err.message}. Make sure the tryon-service is running on port 5001.`);
    resetPipelineStages();
  } finally {
    state.processing = false;
    updateActionButtons();
  }
}

// ---------------------------------------------------------------------------
// Render result
// ---------------------------------------------------------------------------
function renderResult(data) {
  // Set images
  if (els.resultImg)        els.resultImg.src = data.image_base64;
  if (els.originalImg)      els.originalImg.src = data.original_base64;
  if (els.compareResultImg) els.compareResultImg.src = data.image_base64;
  if (els.compareOrigImg)   els.compareOrigImg.src = data.original_base64;

  // Download link
  if (els.downloadLink) {
    els.downloadLink.href = data.image_base64;
  }

  // Metadata row
  if (els.resultMetaRow) {
    const dim = data.dimensions || {};
    const torso = data.torso_bbox || {};
    const items = [
      { label: 'Category', value: data.garment_kind || state.selectedCategory },
      { label: 'Dimensions', value: dim.width && dim.height ? `${dim.width}×${dim.height}px` : '—' },
      { label: 'Method', value: data.method || 'approximate_2d_compositing' },
      { label: 'Reliable', value: data.preview_reliable ? '✓ Yes' : '⚠ Approximate' },
    ];
    els.resultMetaRow.innerHTML = items.map(i =>
      `<div class="meta-item"><span class="meta-label">${i.label}</span><span class="meta-value">${i.value}</span></div>`
    ).join('');
  }

  // Warnings
  const warnings = data.warnings || [];
  if (els.warningsZone) {
    if (warnings.length > 0) {
      els.warningsZone.removeAttribute('hidden');
      els.warningsZone.innerHTML = warnings.map(w =>
        `<div class="warning-item">⚠ ${escHtml(w)}</div>`
      ).join('');
    } else {
      els.warningsZone.setAttribute('hidden', '');
      els.warningsZone.innerHTML = '';
    }
  }

  showResultSection();
  switchTab('result');
}

// ---------------------------------------------------------------------------
// Result tabs
// ---------------------------------------------------------------------------
function initResultTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabName) {
  const panels = { result: 'panel-result', original: 'panel-original', compare: 'panel-compare', segment: 'panel-segment' };
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
  Object.entries(panels).forEach(([name, panelId]) => {
    const panel = document.getElementById(panelId);
    if (panel) {
      if (name === tabName) { panel.classList.add('active'); panel.removeAttribute('hidden'); }
      else                  { panel.classList.remove('active'); panel.setAttribute('hidden', ''); }
    }
  });
  if (tabName === 'compare' && els.compareSlider) {
    updateCompareCurtain(els.compareSlider.value);
  }
}

function showResultSection() {
  if (els.resultSection) els.resultSection.removeAttribute('hidden');
}

// ---------------------------------------------------------------------------
// Split-screen compare slider
// ---------------------------------------------------------------------------
function initCompareSlider() {
  if (!els.compareSlider) return;
  els.compareSlider.addEventListener('input', () => updateCompareCurtain(els.compareSlider.value));
}

function updateCompareCurtain(val) {
  if (!els.compareCurtain) return;
  const pct = parseInt(val, 10);
  els.compareCurtain.style.left = `${pct}%`;
  // Clip the result image to show left side only
  const resultImg = document.getElementById('compare-result-img');
  if (resultImg) resultImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
}

// ---------------------------------------------------------------------------
// Pipeline stage animations
// ---------------------------------------------------------------------------
const STAGE_ORDER = ['upload', 'preprocess', 'hsv', 'segment', 'morphology', 'contours', 'anchors', 'transform', 'composite', 'compare'];

function resetPipelineStages() {
  STAGE_ORDER.forEach(id => {
    const el = document.getElementById(`stage-${id}`);
    if (el) el.className = 'pipeline-step';
  });
}

function activatePipelineStages(ids) {
  ids.forEach(id => {
    const el = document.getElementById(`stage-${id}`);
    if (el) el.classList.add('active');
  });
}

function completePipelineStages(ids) {
  ids.forEach(id => {
    const el = document.getElementById(`stage-${id}`);
    if (el) { el.classList.remove('active'); el.classList.add('done'); }
  });
}

async function animatePipelineStages() {
  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const id = STAGE_ORDER[i];
    const el = document.getElementById(`stage-${id}`);
    if (el) el.classList.add('active');
    setProgress(5 + Math.round((i / STAGE_ORDER.length) * 65), `Stage ${i + 1}/10: ${el ? el.querySelector('.step-title').textContent : id}…`);
    await sleep(120);
  }
}

// ---------------------------------------------------------------------------
// Telemetry panel
// ---------------------------------------------------------------------------
function renderTelemetry(telemetry) {
  if (!telemetry || !els.telemetryPanel || !els.telemetryList) return;
  const labels = {
    decode_ms:       'Image Decode',
    preprocess_ms:   'Preprocessing',
    segmentation_ms: 'Segmentation',
    transform_ms:    'Affine Transform',
    composite_ms:    'Compositing',
    total_time_ms:   'Total Pipeline',
  };
  els.telemetryList.innerHTML = Object.entries(labels)
    .filter(([k]) => telemetry[k] !== undefined)
    .map(([k, label]) => `
      <li class="telemetry-item">
        <span class="telemetry-label">${label}</span>
        <span class="telemetry-value">${telemetry[k]} ms</span>
      </li>`)
    .join('');
  els.telemetryPanel.removeAttribute('hidden');
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function showProgress(label, pct) {
  if (!els.progressZone) return;
  els.progressZone.removeAttribute('hidden');
  setProgress(pct, label);
}

function setProgress(pct, label) {
  if (els.progressFill) els.progressFill.style.width = `${pct}%`;
  if (els.progressLabel && label) els.progressLabel.textContent = label;
}

function hideProgress() {
  if (els.progressZone) els.progressZone.setAttribute('hidden', '');
}

// ---------------------------------------------------------------------------
// Alert messages
// ---------------------------------------------------------------------------
function showAlert(type, message) {
  if (!els.alertZone) return;
  const icons = {
    error:   '✕',
    success: '✓',
    warning: '⚠',
  };
  els.alertZone.removeAttribute('hidden');
  els.alertZone.className = `alert-zone alert-zone--${type}`;
  els.alertZone.innerHTML = `<span class="alert-icon">${icons[type] || '!'}</span><span class="alert-msg">${escHtml(message)}</span>`;
}

function clearAlert() {
  if (!els.alertZone) return;
  els.alertZone.setAttribute('hidden', '');
  els.alertZone.innerHTML = '';
}

// ---------------------------------------------------------------------------
// Reset studio
// ---------------------------------------------------------------------------
function resetStudio() {
  state.portraitFile = null;
  state.garmentFile = null;
  state.processing = false;
  state.lastResult = null;
  state.segmentOverlayUrl = null;

  // Reset upload zones
  ['portrait', 'garment'].forEach(key => {
    const preview = document.getElementById(`${key}-preview`);
    const inner   = document.getElementById(`${key}-dropzone-inner`);
    const input   = document.getElementById(`${key}-file-input`);
    if (preview) { preview.src = ''; preview.setAttribute('hidden', ''); }
    if (inner)   { inner.style.display = ''; }
    if (input)   { input.value = ''; }
  });

  if (els.resultSection) els.resultSection.setAttribute('hidden', '');
  if (els.telemetryPanel) els.telemetryPanel.setAttribute('hidden', '');
  clearAlert();
  hideProgress();
  resetPipelineStages();
  updateActionButtons();
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
