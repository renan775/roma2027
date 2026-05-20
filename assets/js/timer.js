'use strict';

// ─── Rest Timer ───────────────────────────────────────────────────────────────
// Manages the rest countdown overlay shown between sets.

const Timer = (() => {
  let _intervalId  = null;
  let _remaining   = 0;
  let _total       = 0;
  let _onComplete  = null;

  const CIRCUMFERENCE = 2 * Math.PI * 54; // radius 54 matches SVG in overlay

  // DOM refs (resolved lazily after page load)
  function overlay()    { return document.getElementById('rest-timer-overlay'); }
  function ringFill()   { return document.querySelector('.timer-ring-fill'); }
  function labelEl()    { return document.querySelector('.timer-ring-label'); }

  function fmt(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0
      ? `${m}:${String(s).padStart(2, '0')}`
      : `${s}s`;
  }

  function updateRing() {
    const fill = ringFill();
    const label = labelEl();
    if (!fill || !label) return;

    const pct = _total > 0 ? _remaining / _total : 0;
    fill.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct);
    label.textContent = fmt(_remaining);
  }

  function tick() {
    _remaining--;
    updateRing();

    if (_remaining <= 0) {
      stop();
      haptic('success');
      if (_onComplete) _onComplete();
    } else if (_remaining <= 3) {
      haptic('light');
    }
  }

  function start(seconds, onComplete) {
    stop(); // clear any running timer
    _total      = seconds;
    _remaining  = seconds;
    _onComplete = onComplete || null;

    const el = overlay();
    if (el) el.classList.add('visible');

    // Set up ring
    const fill = ringFill();
    if (fill) {
      fill.style.strokeDasharray  = CIRCUMFERENCE;
      fill.style.strokeDashoffset = 0;
    }

    updateRing();
    _intervalId = setInterval(tick, 1000);
    haptic('medium');
  }

  function stop() {
    if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
    const el = overlay();
    if (el) el.classList.remove('visible');
  }

  function skip() {
    stop();
    if (_onComplete) _onComplete();
  }

  function add(seconds) {
    _remaining = Math.min(_remaining + seconds, 599);
    updateRing();
  }

  function isRunning() { return _intervalId !== null; }

  // ─── Haptic feedback ──────────────────────────────────────────────────────
  function haptic(type = 'medium') {
    if (!navigator.vibrate) return;
    const patterns = {
      light:   [10],
      medium:  [30],
      heavy:   [60],
      success: [30, 60, 30],
      error:   [100, 50, 100],
    };
    navigator.vibrate(patterns[type] || patterns.medium);
  }

  // ─── Wake Lock ────────────────────────────────────────────────────────────
  let _wakeLock = null;

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', () => { _wakeLock = null; });
    } catch (e) {
      // Wake lock not granted — non-fatal
    }
  }

  function releaseWakeLock() {
    if (_wakeLock) { _wakeLock.release(); _wakeLock = null; }
  }

  // Re-acquire on page visibility change (iOS releases it when tab hides)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _wakeLock === null) {
      // Only re-acquire if a workout is active (checked via global flag)
      if (window.AppState && window.AppState.workoutActive) requestWakeLock();
    }
  });

  return { start, stop, skip, add, isRunning, haptic, requestWakeLock, releaseWakeLock, fmt };
})();

window.Timer = Timer;
