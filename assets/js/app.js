'use strict';

// ─── Global state ─────────────────────────────────────────────────────────────
window.AppState = {
  workoutActive: false,
  currentRoute:  'home',
  theme:         'dark',
  weekNumber:    null,
  block:         null,
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, duration = 2400) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}
window.showToast = showToast;

// ─── Router ───────────────────────────────────────────────────────────────────
const Router = {
  _screens: {},

  register(name, renderFn) { this._screens[name] = renderFn; },

  async navigate(name, params = {}) {
    const screen = this._screens[name];
    if (!screen) { console.warn('Unknown route:', name); return; }

    // Release wake lock when leaving workout
    if (AppState.currentRoute === 'workout' && name !== 'workout') {
      AppState.workoutActive = false;
      Timer.releaseWakeLock();
    }

    AppState.currentRoute = name;
    window.location.hash = name === 'home' ? '' : name;

    document.querySelectorAll('.nav-item').forEach(btn => {
      const tab = ['home','calendar','history','settings'];
      btn.classList.toggle('active', btn.dataset.route === name && tab.includes(name));
    });

    const container = document.getElementById('screen');
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:60px"><div class="loading-spinner"></div></div>';

    try {
      const html = await screen(params);
      container.innerHTML = html;
      container.scrollTop = 0;
      if (typeof window._screenDidMount === 'function') {
        window._screenDidMount();
        window._screenDidMount = null;
      }
    } catch (err) {
      console.error('Screen error:', err);
      container.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Erro ao carregar</h3>
        <p style="font-size:13px;word-break:break-all">${err.message}</p>
        <button class="btn btn-secondary" onclick="Router.navigate('home')" style="margin-top:8px">Voltar</button>
      </div>`;
    }
  },
};
window.Router = Router;

// ─── Bottom nav ───────────────────────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      if (route) Router.navigate(route);
    });
  });
}

// ─── Muscle emoji ─────────────────────────────────────────────────────────────
const MUSCLE_EMOJI = {
  quadriceps: '🦵', gluteo: '🍑', gluteo_med: '🦵',
  isquiotibial: '🦵', panturrilha: '🦶', core: '🔩',
  peitoral: '💪', costas: '🔙', deltoides: '🙌',
  biceps: '💪', triceps: '💪', adutores: '🦵',
  mobilidade: '🧘', geral: '⚙️',
};
window.muscleEmoji = (m) => MUSCLE_EMOJI[m] || '💪';
window.ytLink = (name) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' técnica execução')}`;

// ─── Rest timer overlay (injected once) ──────────────────────────────────────
function injectRestTimerOverlay() {
  if (document.getElementById('rest-timer-overlay')) return;
  const div = document.createElement('div');
  div.id = 'rest-timer-overlay';
  div.innerHTML = `
    <div class="rest-timer-title">Descanse</div>
    <div class="timer-ring">
      <svg viewBox="0 0 120 120">
        <circle class="timer-ring-bg"   cx="60" cy="60" r="54"/>
        <circle class="timer-ring-fill" cx="60" cy="60" r="54"/>
      </svg>
      <div class="timer-ring-label">—</div>
    </div>
    <div class="rest-timer-actions">
      <button class="btn btn-secondary btn-full" onclick="Timer.add(15)">+15s</button>
      <button class="btn btn-primary btn-full"   onclick="Timer.skip()">Pular ↩</button>
    </div>`;
  document.body.appendChild(div);
}

window.startRestTimer = (seconds) => {
  Timer.start(seconds, () => showToast('✓ Descanse concluído!'));
};

// ─── Exercise card renderer ───────────────────────────────────────────────────
window.renderExerciseCard = (ex, index, setsDone = []) => {
  const totalSets = ex.sets;
  const restStr   = ex.restSeconds > 0 ? ` · ${ex.restSeconds}s` : '';
  const meta      = `${ex.sets}×${ex.reps}${restStr}`;
  const isDone    = setsDone.length >= totalSets && setsDone.length > 0 && setsDone.every(Boolean);
  const safeName  = ex.name.replace(/'/g, "\\'");

  let setsHtml = '';
  for (let s = 0; s < totalSets; s++) {
    const checked = !!setsDone[s];
    setsHtml += `
      <div class="set-row">
        <span class="set-number">${s + 1}</span>
        <span class="set-reps">${ex.reps}</span>
        <div class="set-weight-wrap">
          <input class="input input-weight" type="number" min="0" max="999" step="0.5"
            inputmode="decimal" placeholder="—"
            aria-label="Carga série ${s+1}"
            data-ex="${index}" data-set="${s}"/>
          <span class="set-weight-unit">kg</span>
        </div>
        <div class="check-box ${checked ? 'checked' : ''}"
          role="checkbox" aria-checked="${checked}"
          data-ex="${index}" data-set="${s}"
          aria-label="Série ${s+1}">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="2 7 5.5 10.5 12 3.5"/>
          </svg>
        </div>
      </div>`;
  }

  return `
    <div class="exercise-card ${isDone ? 'completed' : ''}"
      data-ex-index="${index}" id="ex-card-${index}">
      <div class="exercise-header" onclick="toggleExCard(${index})">
        <div class="exercise-muscle-icon">${muscleEmoji(ex.muscle)}</div>
        <div class="exercise-info">
          <div class="exercise-name"
            onclick="event.stopPropagation();Router.navigate('exercise',{name:'${safeName}'})"
            style="cursor:pointer">
            ${ex.name}
          </div>
          <div class="exercise-meta">${meta}</div>
        </div>
        ${isDone ? '<span style="color:var(--success);font-size:18px;flex-shrink:0">✓</span>' : ''}
        <svg class="exercise-chevron" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="exercise-body">
        ${ex.tip ? `<div class="exercise-tip">${ex.tip}</div>` : ''}
        <a class="exercise-yt-link"
          href="${ytLink(ex.name)}" target="_blank" rel="noopener">
          ▶ Ver técnica no YouTube
        </a>
        ${ex.restSeconds > 0 ? `
          <button class="btn btn-secondary"
            style="font-size:13px;min-height:36px;padding:6px 14px;align-self:flex-start"
            onclick="startRestTimer(${ex.restSeconds})">
            ⏱ Iniciar descanso (${ex.restSeconds}s)
          </button>` : ''}
        <div class="sets-grid">${setsHtml}</div>
      </div>
    </div>`;
};

window.toggleExCard = (index) => {
  const card = document.getElementById(`ex-card-${index}`);
  if (card) card.classList.toggle('open');
};

// ─── HOME ─────────────────────────────────────────────────────────────────────
Router.register('home', async () => {
  const { getDaysUntil, getCurrentWeek, getBlockForWeek, RACE, SPECIAL_EVENTS,
          WEEK_NOTES, getWeekStart, formatDate, getWorkoutTypeForDate, PLAN_START } = AppData;

  const today       = new Date();
  const weekNum     = getCurrentWeek(); // 0 = before plan start (25/05/2026)
  const block       = getBlockForWeek(weekNum);
  const weekNote    = WEEK_NOTES[weekNum] || {};
  const daysToRoma  = getDaysUntil(RACE.date);
  const terra       = SPECIAL_EVENTS.find(e => e.name.includes('Terra da Luz'));
  const daysToTerra = getDaysUntil(terra.date);
  const todaySched  = getWorkoutTypeForDate(today);

  const [totalDone, weekLogs, completedMap] = await Promise.all([
    DB.WorkoutLogs.countCompleted(),
    DB.WorkoutLogs.getByWeek(weekNum),   // returns [] when weekNum = 0
    DB.WorkoutLogs.getCompletedByWeekMap(),
  ]);

  const weekDone = weekLogs.filter(w => w.completed).length;

  let streak = 0;
  for (let w = weekNum; w >= 1; w--) {
    if (completedMap[w] && completedMap[w].length > 0) streak++;
    else break;
  }

  const blockColor  = block ? `var(--block-${block.id})` : 'var(--accent)';
  const progressPct = Math.max(2, Math.round((1 - daysToRoma / 660) * 100));

  const terraAlert = daysToTerra > 0 && daysToTerra <= 14 ? `
    <div class="alert alert-accent">
      <span class="alert-icon">🏁</span>
      <div>
        <strong>Terra da Luz 21k em ${daysToTerra} dia${daysToTerra !== 1 ? 's' : ''}!</strong>
        <div style="font-size:12px;margin-top:2px">06/09/2026 · Prova de meia maratona</div>
      </div>
    </div>` : '';

  const block3Alert = block?.id === 3 ? `
    <div class="alert alert-warning">
      <span class="alert-icon">⚠️</span>
      <span style="font-size:12px">${block.alert}</span>
    </div>` : '';

  const weekNoteHtml = weekNote.type && ['deload','deload-pre-race','race-week','recovery','holiday','taper','marathon-week'].includes(weekNote.type) ? `
    <div class="alert ${weekNote.type === 'marathon-week' ? 'alert-accent' : 'alert-warning'}">
      <span class="alert-icon">${weekNote.type === 'marathon-week' ? '🏁' : '📌'}</span>
      <span style="font-size:13px">${weekNote.label}</span>
    </div>` : '';

  return `
    <div class="screen-header">
      <div style="flex:1">
        <h1 class="display" style="font-size:24px;line-height:1">Roma 2027</h1>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
          ${weekNum > 0 ? `${formatDate(getWeekStart(weekNum))} · Semana ${weekNum}` : 'Plano inicia em 18/05/2026'}
        </div>
      </div>
      <div style="font-family:var(--font-mono);font-size:13px;color:var(--accent);font-weight:600">sub-4h</div>
    </div>

    <div style="padding:12px 20px 24px;display:flex;flex-direction:column;gap:12px">

      <!-- Countdown -->
      <div class="card card-padded"
        style="background:linear-gradient(135deg,#150505 0%,#200a0a 100%);
               border-color:rgba(214,61,47,0.25)">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;
                    color:rgba(214,61,47,.7);margin-bottom:6px">🏁 Maratona de Roma</div>
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
          <span style="font-family:var(--font-mono);font-size:56px;font-weight:600;
                       color:var(--accent);line-height:1">${daysToRoma}</span>
          <div>
            <div style="font-size:18px;color:var(--text-muted)">dias</div>
            <div style="font-size:11px;color:var(--text-faint)">14/03/2027</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:10px">
          Pace alvo 5:41/km · FC 165–172 bpm
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${progressPct}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:5px">
          <span style="font-size:11px;color:var(--text-faint)">Início 25/05/2026</span>
          <span style="font-size:11px;color:var(--text-faint)">${progressPct}% do plano</span>
        </div>
      </div>

      ${terraAlert}
      ${weekNoteHtml}
      ${block3Alert}

      <!-- Semana atual / pré-plano -->
      ${weekNum < 1 ? `
      <div class="card card-padded" style="border-color:rgba(214,61,47,0.25)">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;
                    color:var(--text-muted);margin-bottom:6px">Plano começa em</div>
        <div style="display:flex;align-items:baseline;gap:8px">
          <span style="font-family:var(--font-mono);font-size:40px;font-weight:600;
                       color:var(--accent);line-height:1">
            ${getDaysUntil(PLAN_START)}
          </span>
          <span style="font-size:16px;color:var(--text-muted)">dias</span>
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
          18/05/2026 · Fundação Anatômica (Semana 1)
        </div>
        <div class="alert alert-accent" style="margin-top:12px;font-size:12px">
          <span class="alert-icon">💡</span>
          <span>Use este tempo para preparar seu material de treino e calibrar as cargas iniciais.</span>
        </div>
      </div>` : `
      <div class="card card-padded">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;
                        color:var(--text-muted)">Semana atual</div>
            <div style="font-size:22px;font-weight:700;margin-top:1px">Semana ${weekNum}</div>
            ${weekNote.label && !['deload','deload-pre-race','race-week','recovery','holiday','taper','marathon-week'].includes(weekNote.type)
              ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${weekNote.label}</div>` : ''}
          </div>
          ${block ? `
            <div style="text-align:right">
              <div style="width:10px;height:10px;border-radius:50%;
                          background:${blockColor};margin-left:auto;margin-bottom:3px"></div>
              <div style="font-size:11px;color:var(--text-muted)">Bloco ${block.id}</div>
              <div style="font-size:10px;color:var(--text-faint)">${block.intensity}</div>
            </div>` : ''}
        </div>
        ${block ? `<div class="badge" style="background:${blockColor}22;color:${blockColor};
                    margin-bottom:10px">${block.name}</div>` : ''}
        <div class="progress-bar">
          <div class="progress-fill success"
            style="width:${Math.round((weekDone / 4) * 100)}%"></div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:5px">
          ${weekDone} de 4 treinos desta semana ·
          ${weekDone >= 4
            ? '<span style="color:var(--success);font-weight:600">✓ Semana completa!</span>'
            : `${4 - weekDone} restante${4 - weekDone !== 1 ? 's' : ''}`}
        </div>
      </div>`}

      <!-- Treino de hoje -->
      <div class="card card-padded" style="cursor:pointer"
        onclick="Router.navigate('workout')">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;
                    color:var(--text-muted);margin-bottom:10px">Treino de hoje</div>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
          <div style="font-size:40px;line-height:1">${todaySched.icon}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:16px;line-height:1.3">${todaySched.label}</div>
            ${todaySched.educativos
              ? '<div style="font-size:12px;color:var(--info);margin-top:4px;font-weight:500">✓ Educativos de corrida (manhã)</div>'
              : ''}
          </div>
        </div>
        <button class="btn btn-primary btn-full btn-lg"
          onclick="event.stopPropagation();Router.navigate('workout')">
          Começar treino →
        </button>
      </div>

      <!-- Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value mono">${daysToRoma}</div>
          <div class="stat-label">Dias p/ Roma</div>
        </div>
        <div class="stat-card">
          <div class="stat-value mono">${totalDone}</div>
          <div class="stat-label">Treinos feitos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value mono">${streak}</div>
          <div class="stat-label">Streak (sem.)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value mono">${weekNum > 0 ? weekNum : '—'}<span style="font-size:14px;color:var(--text-muted)">${weekNum > 0 ? '/42' : ''}</span></div>
          <div class="stat-label">Semana do plano</div>
        </div>
      </div>

      <!-- HR Zones quick ref -->
      <div class="section-label" style="padding:4px 0 8px">Zonas de FC calibradas</div>
      <div class="card" style="overflow:hidden">
        ${AppData.HR_ZONES.map(z => `
          <div style="display:flex;align-items:center;gap:10px;padding:9px 14px;
                      border-bottom:1px solid var(--border)">
            <div style="width:4px;height:28px;border-radius:2px;
                        background:${z.color};flex-shrink:0"></div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">${z.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">
                ${z.hrMin > 0 ? z.hrMin + '–' : '< '}${z.hrMax < 999 ? z.hrMax : '+'} bpm
              </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:12px;
                        color:var(--text-muted);text-align:right">
              ${z.paceMin}–${z.paceMax}<br>
              <span style="font-size:10px">/km</span>
            </div>
          </div>`).join('')}
      </div>

    </div>`;
});

// ─── WORKOUT ──────────────────────────────────────────────────────────────────
Router.register('workout', async () => {
  const { getCurrentWeek, getBlockForWeek, getWorkoutTypeForDate,
          getWorkoutForWeek, DAY_SCHEDULE, WEEK_NOTES } = AppData;

  const today      = new Date();
  const dow        = today.getDay();
  const sched      = DAY_SCHEDULE[dow];
  const weekNum    = getCurrentWeek();
  const block      = getBlockForWeek(weekNum);
  const workoutType = sched.gym;
  const weekNote   = WEEK_NOTES[weekNum] || {};

  if (!workoutType) {
    const msgs = {
      0: { icon: '😴', msg: 'Dia de descanso total. Recuperação ativa.' },
      5: { icon: '🚴', msg: 'Bike Z2 hoje — 45 a 60 minutos. Sem academia.' },
      6: { icon: '🏃', msg: 'Longão hoje. Sem academia.' },
    };
    const info = msgs[dow] || { icon: sched.icon, msg: 'Sem academia hoje.' };
    return `
      <div class="screen-header">
        <h1 class="display">Treino</h1>
      </div>
      <div class="empty-state" style="padding-top:80px">
        <div class="empty-state-icon">${info.icon}</div>
        <h3>${sched.label}</h3>
        <p>${info.msg}</p>
        <button class="btn btn-secondary" style="margin-top:8px"
          onclick="Router.navigate('home')">Voltar ao início</button>
      </div>`;
  }

  const workoutData = getWorkoutForWeek(weekNum, workoutType);

  if (!workoutData) {
    return `<div class="empty-state" style="padding-top:80px">
      <div class="empty-state-icon">📋</div>
      <h3>Sem treino programado</h3>
      <p>Semana ${weekNum} — verifique o calendário.</p>
    </div>`;
  }

  if (workoutData.type === 'race') {
    return `
      <div class="screen-header"><h1 class="display">Treino</h1></div>
      <div class="empty-state" style="padding-top:80px">
        <div class="empty-state-icon">🏁</div>
        <h3>Semana de prova!</h3>
        <p>${workoutData.message}</p>
      </div>`;
  }

  // Build sections
  const sections = [];
  if (workoutData.plyometrics?.length)
    sections.push({ title: '⚡ Pliometria', key: 'plyometrics' });
  if (workoutData.activation?.length)
    sections.push({ title: '🔥 Ativação (5 min)', key: 'activation' });
  if (workoutData.strength?.length)
    sections.push({ title: '💪 Força Principal', key: 'strength' });
  if (workoutData.exercises?.length)
    sections.push({ title: '🧘 Exercícios', key: 'exercises' });
  if (workoutData.core?.length)
    sections.push({ title: '🔩 Core (10 min)', key: 'core' });

  // Flatten all exercises with global index
  let globalIdx = 0;
  const allExercises = [];
  const sectionsHtml = sections.map(({ title, key }) => {
    const exList = workoutData[key] || [];
    const cards = exList.map(ex => {
      const html = renderExerciseCard(ex, globalIdx);
      allExercises.push({ ...ex, _idx: globalIdx });
      globalIdx++;
      return html;
    }).join('');
    return `
      <div class="section-label">${title}</div>
      <div style="padding:0 20px;display:flex;flex-direction:column;gap:8px">
        ${cards}
      </div>`;
  }).join('');

  const typeLabels = {
    inferior_a: 'Inferior A — Quadríceps e Glúteo',
    inferior_b: 'Inferior B — Cadeia Posterior',
    superior_a: 'Superior A — Empurrar',
    superior_b: 'Superior B — Puxar',
  };
  const title = typeLabels[workoutType] || 'Treino';
  const blockLabel = block
    ? `Bloco ${block.id}: ${block.name} · Sem. ${weekNum}`
    : `Semana ${weekNum}`;

  const educativosHtml = sched.educativos ? `
    <div style="padding:12px 20px 0">
      <div class="educativos-check" id="educativos-check"
        onclick="toggleEducativos(this)">
        <div class="educativos-check-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div class="educativos-check-text">✓ Educativos de corrida (manhã)</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:1px">
            Strides, elevação do joelho, skipping — antes deste treino
          </div>
        </div>
      </div>
    </div>` : '';

  const alertHtml = workoutData.isDeload ? `
    <div style="padding:8px 20px 0">
      <div class="alert alert-warning">
        <span class="alert-icon">⚠️</span>
        <span>Semana de DELOAD — volume reduzido conforme programado.</span>
      </div>
    </div>` :
    weekNote.label && weekNote.type === 'peak' ? `
    <div style="padding:8px 20px 0">
      <div class="alert alert-accent">
        <span class="alert-icon">🔥</span>
        <span>${weekNote.label}</span>
      </div>
    </div>` : '';

  window._screenDidMount = () => {
    AppState.workoutActive = true;
    Timer.requestWakeLock();

    // Wire checkboxes
    document.querySelectorAll('.check-box').forEach(box => {
      box.addEventListener('click', () => {
        const isChecked = box.classList.toggle('checked');
        box.setAttribute('aria-checked', String(isChecked));
        Timer.haptic('light');

        if (isChecked) {
          const exI = parseInt(box.dataset.ex);
          const ex = allExercises[exI];
          if (ex?.restSeconds > 0) startRestTimer(ex.restSeconds);
        }
        updateCompleteBtn();
      });
    });

    // Restore saved weights from sessionStorage
    document.querySelectorAll('.input-weight').forEach(inp => {
      const key = `w-${weekNum}-${workoutType}-${inp.dataset.ex}-${inp.dataset.set}`;
      inp.value = sessionStorage.getItem(key) || '';
      inp.addEventListener('input', () => sessionStorage.setItem(key, inp.value));
    });

    updateCompleteBtn();
  };

  function updateCompleteBtn() {
    const btn = document.getElementById('btn-complete');
    if (!btn) return;
    const boxes = document.querySelectorAll('.check-box');
    btn.disabled = boxes.length === 0 || !Array.from(boxes).every(b => b.classList.contains('checked'));
  }

  window.updateCompleteBtn = updateCompleteBtn;

  window.toggleEducativos = (el) => {
    el.classList.toggle('checked');
    Timer.haptic('light');
  };

  window.completeWorkout = async () => {
    const exercisesDone = allExercises.map((ex, i) => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, (_, s) => {
        const wInp = document.querySelector(`.input-weight[data-ex="${i}"][data-set="${s}"]`);
        const chk  = document.querySelector(`.check-box[data-ex="${i}"][data-set="${s}"]`);
        return {
          reps:      typeof ex.reps === 'number' ? ex.reps : 0,
          weight_kg: wInp ? parseFloat(wInp.value) || 0 : 0,
          completed: !!chk?.classList.contains('checked'),
        };
      }),
    }));

    const logId = await DB.WorkoutLogs.add({
      week_number:  weekNum,
      block_number: block?.id || 0,
      workout_type: workoutType,
      completed:    true,
      exercises_done: exercisesDone,
    });

    await Promise.all(exercisesDone.map(ex =>
      DB.ExerciseLogs.add({ workout_log_id: logId, exercise_name: ex.name, sets: ex.sets })
    ));

    Timer.haptic('success');
    AppState.workoutActive = false;
    Timer.releaseWakeLock();

    // Auto-sync to GitHub Gist in background (silent on failure)
    DB.GitHubSync.autoSync();

    document.getElementById('screen').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;
                  justify-content:center;min-height:70vh;padding:40px 24px;text-align:center;gap:20px">
        <div class="complete-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <h2 class="display" style="font-size:28px">Treino concluído!</h2>
          <p style="color:var(--text-muted);margin-top:6px">${title}</p>
          <p style="color:var(--text-faint);font-size:13px;margin-top:2px">${blockLabel}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px">
          <button class="btn btn-primary btn-full btn-lg"
            onclick="Router.navigate('home')">
            Voltar ao início
          </button>
          <button class="btn btn-secondary btn-full"
            onclick="Router.navigate('history')">
            Ver histórico
          </button>
        </div>
      </div>`;
    showToast('✅ Treino salvo com sucesso!');
  };

  return `
    <div class="screen-header">
      <button class="btn-icon" onclick="Router.navigate('home')" aria-label="Voltar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div style="flex:1;min-width:0">
        <div style="font-size:16px;font-weight:700;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${title}
        </div>
        <div style="font-size:11px;color:var(--text-muted)">${blockLabel}</div>
      </div>
    </div>

    ${educativosHtml}
    ${alertHtml}
    ${sectionsHtml}

    <div class="workout-footer">
      <button id="btn-complete" class="btn btn-success btn-full btn-lg"
        disabled onclick="completeWorkout()">
        ✓ Concluir treino
      </button>
    </div>
    <div style="height:90px"></div>`;
});

// ─── EXERCISE DETAIL ──────────────────────────────────────────────────────────
Router.register('exercise', async ({ name = 'Exercício' }) => {
  const [logs, maxWeight, progression] = await Promise.all([
    DB.ExerciseLogs.getByExercise(name),
    DB.ExerciseLogs.getMaxWeight(name),
    DB.ExerciseLogs.getProgressionData(name),
  ]);

  const totalExec  = logs.length;
  const totalSets  = logs.reduce((s, l) => s + (l.sets?.length || 0), 0);
  const totalReps  = logs.reduce((s, l) =>
    s + (l.sets || []).reduce((r, set) => r + (set.reps || 0), 0), 0);

  // Build load chart (last 12 sessions)
  const recent = progression.slice(-12);
  const maxW   = Math.max(...recent.map(p => p.maxWeight), 1);
  const chartHtml = recent.length > 0
    ? `<div class="bar-chart" style="height:72px;padding:0 4px">
        ${recent.map(p => {
          const h = Math.round((p.maxWeight / maxW) * 68) || 2;
          const dt = new Date(p.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
          return `<div class="bar-chart-col">
            <div class="bar filled" style="height:${h}px" title="${p.maxWeight}kg"></div>
            <div class="bar-label" style="font-size:8px">${dt}</div>
          </div>`;
        }).join('')}
      </div>`
    : `<div style="color:var(--text-faint);font-size:13px;padding:20px 0;text-align:center">
        Sem dados de carga ainda
      </div>`;

  const histRows = logs.slice(0, 20).reverse().map(log => {
    const dt   = new Date(log.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
    const mw   = Math.max(0, ...(log.sets || []).map(s => s.weight_kg || 0));
    const reps = (log.sets || []).reduce((s, set) => s + (set.reps || 0), 0);
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;
                  border-bottom:1px solid var(--border)">
        <div style="font-family:var(--font-mono);font-size:12px;
                    color:var(--text-muted);width:48px;flex-shrink:0">${dt}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:500">${log.sets?.length || 0} séries · ${reps} reps</div>
        </div>
        ${mw > 0 ? `<div style="font-family:var(--font-mono);font-size:13px;
                                color:var(--accent);font-weight:600">${mw}kg</div>` : ''}
      </div>`;
  }).join('') || `<div style="color:var(--text-faint);font-size:13px;
                              padding:20px 0;text-align:center">Sem execuções registradas</div>`;

  const muscle = AppData.BLOCKS.length > 0 ? '' : '';

  return `
    <div class="screen-header">
      <button class="btn-icon" onclick="history.back()" aria-label="Voltar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 style="font-size:15px;font-weight:700;flex:1;
                 white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        ${name}
      </h1>
      <a class="btn-icon" href="${ytLink(name)}" target="_blank" rel="noopener"
        aria-label="Ver no YouTube"
        style="color:var(--accent);text-decoration:none">
        ▶
      </a>
    </div>

    <div style="padding:14px 20px 24px;display:flex;flex-direction:column;gap:14px">

      <!-- Stats strip -->
      <div class="stat-grid stat-grid-3">
        <div class="stat-card">
          <div class="stat-value mono">${totalExec}</div>
          <div class="stat-label">Sessões</div>
        </div>
        <div class="stat-card">
          <div class="stat-value mono">${maxWeight > 0 ? maxWeight + 'kg' : '—'}</div>
          <div class="stat-label">Carga máx.</div>
        </div>
        <div class="stat-card">
          <div class="stat-value mono">${totalSets}</div>
          <div class="stat-label">Total séries</div>
        </div>
      </div>

      <!-- Load progression chart -->
      <div class="card card-padded">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;
                    color:var(--text-muted);margin-bottom:10px">
          Progressão de carga
        </div>
        ${chartHtml}
      </div>

      <!-- History -->
      <div class="section-label" style="padding:0">Histórico de execuções</div>
      <div class="card card-padded">
        ${histRows}
      </div>

      <a class="btn btn-secondary btn-full"
        href="${ytLink(name)}" target="_blank" rel="noopener">
        ▶ Ver técnica no YouTube
      </a>

    </div>`;
});

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
Router.register('calendar', async ({ showAll = false } = {}) => {
  const { getCurrentWeek, getWeekStart, WEEK_NOTES, SPECIAL_EVENTS,
          getBlockForWeek, DAY_SCHEDULE, formatDate } = AppData;

  const currentWeek  = getCurrentWeek();
  const completedMap = await DB.WorkoutLogs.getCompletedByWeekMap();
  const DAY_NAMES    = ['D','S','T','Q','Q','S','S'];
  const today        = new Date(); today.setHours(0,0,0,0);

  function renderWeekRow(wNum) {
    const note  = WEEK_NOTES[wNum] || {};
    const block = getBlockForWeek(wNum);
    const start = getWeekStart(wNum);
    const done  = completedMap[wNum] || [];
    const isCurrent = wNum === currentWeek;

    const special = SPECIAL_EVENTS.find(e => {
      const d  = new Date(e.date); d.setHours(0,0,0,0);
      const ws = new Date(start);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return d >= ws && d <= we;
    });

    let dayDots = '';
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      date.setHours(0,0,0,0);
      const sched   = DAY_SCHEDULE[date.getDay()];
      const isToday = date.getTime() === today.getTime();
      const gymType = sched.gym;
      const isDone  = gymType && done.includes(gymType);
      const isRace  = special && date.toISOString().startsWith(special.date);
      const isPast  = date < today;

      const dotClass = isRace    ? 'race'
                     : isDone    ? 'done'
                     : !gymType  ? 'rest'
                     : isPast    ? 'pending'
                     : '';

      dayDots += `
        <div class="day-cell ${isToday ? 'today' : ''}">
          <span class="day-name">${DAY_NAMES[date.getDay()]}</span>
          <span class="day-number">${date.getDate()}</span>
          <div class="day-dot ${dotClass}"></div>
        </div>`;
    }

    const badgeHtml =
      special                           ? `<span class="badge badge-accent">${special.badge}</span>`
      : note.type === 'deload' || note.type === 'deload-pre-race'
                                        ? `<span class="badge badge-warning">Deload</span>`
      : note.type === 'race-week'       ? `<span class="badge badge-accent">🏁 Prova</span>`
      : note.type === 'recovery'        ? `<span class="badge badge-success">Recuperação</span>`
      : note.type === 'holiday'         ? `<span class="badge badge-warning">🎄 Feriado</span>`
      : note.type === 'taper'           ? `<span class="badge badge-info">Taper</span>`
      : note.type === 'pre-marathon'    ? `<span class="badge badge-accent">Pré-Roma</span>`
      : note.type === 'marathon-week'   ? `<span class="badge badge-accent">🏁 ROMA</span>`
      : done.length >= 4                ? `<span class="badge badge-success">✓ Completa</span>`
      : '';

    const blockColor = block ? `var(--block-${block.id})` : 'var(--surface-3)';

    return `
      <div class="card"
        style="border-color:${isCurrent ? 'var(--accent)' : 'var(--border)'};
               ${isCurrent ? 'box-shadow:0 0 0 1px var(--accent);' : ''}">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px 4px">
          <div style="width:4px;height:22px;border-radius:2px;
                      background:${blockColor};flex-shrink:0"></div>
          <span style="font-size:13px;font-weight:700">Semana ${wNum}</span>
          <span style="font-size:11px;color:var(--text-faint)">${formatDate(start)}</span>
          <div style="flex:1"></div>
          ${badgeHtml}
        </div>
        ${note.label
          ? `<div style="font-size:11px;color:var(--text-muted);padding:0 14px 4px;
                         padding-left:26px">${note.label}</div>`
          : ''}
        <div class="week-strip" style="padding:4px 14px">${dayDots}</div>
        <div style="height:6px"></div>
      </div>`;
  }

  // Weeks to show
  const weekNums = showAll
    ? Array.from({ length: 42 }, (_, i) => i + 1)
    : Array.from({ length: 11 }, (_, i) =>
        Math.min(42, Math.max(1, currentWeek - 2 + i)));

  const weeksHtml = weekNums.map(renderWeekRow).join('');

  return `
    <div class="screen-header">
      <h1 class="display">Calendário</h1>
      <div style="display:flex;gap:8px;align-items:center">
        <div style="display:flex;align-items:center;gap:4px">
          <div class="day-dot done"></div>
          <span style="font-size:11px;color:var(--text-muted)">Feito</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <div class="day-dot pending"></div>
          <span style="font-size:11px;color:var(--text-muted)">Faltou</span>
        </div>
      </div>
    </div>

    <div style="padding:12px 20px 24px;display:flex;flex-direction:column;gap:10px">

      <!-- Block legend -->
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${AppData.BLOCKS.map(b => `
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;
                        background:var(--block-${b.id})"></div>
            <span style="font-size:11px;color:var(--text-muted)">B${b.id}: ${b.name.split(' ')[0]}</span>
          </div>`).join('')}
      </div>

      <div class="alert alert-accent" style="font-size:12px">
        <span class="alert-icon">📍</span>
        <span>Semana atual: <strong>Sem. ${currentWeek}</strong>
          ${AppData.getBlockForWeek(currentWeek)
            ? ` · Bloco ${AppData.getBlockForWeek(currentWeek).id}: ${AppData.getBlockForWeek(currentWeek).name}`
            : ''}</span>
      </div>

      ${weeksHtml}

      ${!showAll ? `
        <button class="btn btn-secondary btn-full"
          onclick="Router.navigate('calendar',{showAll:true})">
          Ver todas as 42 semanas do plano
        </button>` : ''}

      <div style="height:8px"></div>
    </div>`;
});

// ─── HISTORY ──────────────────────────────────────────────────────────────────
Router.register('history', async () => {
  const currentWeek = AppData.getCurrentWeek();

  const [logs, adherence] = await Promise.all([
    DB.WorkoutLogs.getAll(),
    DB.WorkoutLogs.getWeeklyAdherence(42),
  ]);

  if (logs.length === 0) {
    return `
      <div class="screen-header"><h1 class="display">Histórico</h1></div>
      <div class="empty-state" style="padding-top:80px">
        <div class="empty-state-icon">📊</div>
        <h3>Nenhum treino registrado</h3>
        <p>Complete seu primeiro treino e ele aparecerá aqui.</p>
        <button class="btn btn-primary" style="margin-top:12px"
          onclick="Router.navigate('workout')">
          Começar agora
        </button>
      </div>`;
  }

  // Adherence chart — last 12 weeks with data
  const chartWeeks = Array.from({ length: 12 }, (_, i) =>
    Math.max(1, currentWeek - 11 + i));
  const maxAdh = Math.max(...chartWeeks.map(w => adherence[w] || 0), 1);

  const chartBars = chartWeeks.map(w => {
    const pct = adherence[w] || 0;
    const h   = Math.round((pct / 100) * 64);
    return `<div class="bar-chart-col">
      <div class="bar ${pct > 0 ? 'filled' : ''}" style="height:${Math.max(2,h)}px"></div>
      <div class="bar-label">S${w}</div>
    </div>`;
  }).join('');

  const typeLabels = {
    inferior_a: 'Inferior A', inferior_b: 'Inferior B',
    superior_a: 'Superior A', superior_b: 'Superior B',
  };

  const totalDone = logs.filter(l => l.completed).length;
  const blockCounts = logs.reduce((acc, l) => {
    const k = `B${l.block_number}`;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const logRows = logs.slice(0, 50).map(log => {
    const date = new Date(log.date).toLocaleDateString('pt-BR',
      { day:'2-digit', month:'2-digit', year:'2-digit' });
    const blockColor = log.block_number
      ? `var(--block-${log.block_number})` : 'var(--surface-3)';
    return `
      <div class="settings-row" onclick="showWorkoutDetail(${log.id})">
        <div class="settings-row-icon"
          style="background:${blockColor}22;color:${blockColor};
                 font-size:12px;font-weight:700">
          B${log.block_number || '?'}
        </div>
        <div class="settings-row-text">
          <div class="settings-row-title">
            ${typeLabels[log.workout_type] || log.workout_type}
          </div>
          <div class="settings-row-subtitle">
            Sem. ${log.week_number} · ${date}
            ${log.completed ? ' · <span style="color:var(--success)">✓</span>' : ''}
          </div>
        </div>
        <svg class="settings-chevron" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>`;
  }).join('');

  window.showWorkoutDetail = async (id) => {
    const log    = await DB.WorkoutLogs.getById(id);
    const exLogs = await DB.ExerciseLogs.getByWorkout(id);
    const date   = new Date(log.date).toLocaleDateString('pt-BR', { dateStyle:'full' });

    const exRows = exLogs.length > 0
      ? exLogs.map(ex => {
          const mw   = Math.max(0, ...(ex.sets||[]).map(s => s.weight_kg||0));
          const sets = ex.sets?.length || 0;
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 0;
                        border-bottom:1px solid var(--border);cursor:pointer"
              onclick="Router.navigate('exercise',{name:'${ex.exercise_name.replace(/'/g,"\\'")}' })">
              <div style="flex:1">
                <div style="font-size:14px;font-weight:600">${ex.exercise_name}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:1px">
                  ${sets} série${sets !== 1 ? 's' : ''}
                  ${mw > 0 ? ` · max ${mw}kg` : ''}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-faint)" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>`;
        }).join('')
      : '<div style="color:var(--text-faint);font-size:14px;padding:12px 0">Sem detalhes registrados</div>';

    document.getElementById('screen').innerHTML = `
      <div class="screen-header">
        <button class="btn-icon" onclick="Router.navigate('history')" aria-label="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style="font-size:16px;font-weight:700;flex:1">Detalhe do treino</h1>
      </div>
      <div style="padding:14px 20px 24px;display:flex;flex-direction:column;gap:12px">
        <div class="card card-padded">
          <div style="font-size:12px;color:var(--text-muted)">${date}</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px">
            ${typeLabels[log.workout_type] || log.workout_type}
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">
            Semana ${log.week_number} · Bloco ${log.block_number}
          </div>
        </div>
        <div class="section-label" style="padding:0">Exercícios realizados</div>
        <div class="card card-padded">${exRows}</div>
      </div>`;
  };

  return `
    <div class="screen-header">
      <h1 class="display">Histórico</h1>
      <div style="font-family:var(--font-mono);font-size:13px;color:var(--accent);font-weight:600">
        ${totalDone}
      </div>
    </div>

    <div style="padding:12px 20px 24px;display:flex;flex-direction:column;gap:14px">

      <!-- Summary stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value mono">${totalDone}</div>
          <div class="stat-label">Treinos totais</div>
        </div>
        <div class="stat-card">
          <div class="stat-value mono">${currentWeek}</div>
          <div class="stat-label">Semanas ativas</div>
        </div>
      </div>

      <!-- Adherence chart -->
      <div class="card card-padded">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;
                    color:var(--text-muted);margin-bottom:10px">
          Aderência semanal (últimas 12 semanas)
        </div>
        <div class="bar-chart" style="height:80px">${chartBars}</div>
      </div>

      <!-- Log list -->
      <div style="font-size:11px;text-transform:uppercase;
                  letter-spacing:.08em;color:var(--text-muted)">
        Treinos realizados
      </div>
      <div class="card settings-list">${logRows}</div>

      ${logs.length >= 50
        ? `<div style="font-size:12px;color:var(--text-faint);text-align:center">
             Mostrando os 50 mais recentes
           </div>`
        : ''}
      <div style="height:8px"></div>
    </div>`;
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
Router.register('settings', async () => {
  const [theme, planStart, totalWorkouts, syncCfg] = await Promise.all([
    DB.Settings.get('theme', 'dark'),
    DB.Settings.get('plan_start_date', '2026-05-18'),
    DB.WorkoutLogs.count(),
    DB.GitHubSync.getConfig(),
  ]);

  const currentWeek  = AppData.getCurrentWeek();
  const daysToRoma   = AppData.getDaysUntil(AppData.RACE.date);
  const syncOk       = DB.GitHubSync.isConfigured(syncCfg);
  const lastSyncFmt  = syncCfg.lastSync
    ? new Date(syncCfg.lastSync).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' })
    : 'Nunca';

  // ── Sync helpers ────────────────────────────────────────────────────────────
  window.saveGistConfig = async () => {
    const token  = document.getElementById('gh-token').value.trim();
    const gistId = document.getElementById('gh-gist-id').value.trim();
    if (!token) { showToast('Informe o Token do GitHub'); return; }
    if (!gistId) { showToast('Informe o Gist ID'); return; }
    await DB.Settings.set('gh_token',   token);
    await DB.Settings.set('gh_gist_id', gistId);
    showToast('✅ Configuração salva!');
    Router.navigate('settings');
  };

  window.createAndSaveGist = async () => {
    const token = document.getElementById('gh-token').value.trim();
    if (!token) { showToast('Informe o Token primeiro'); return; }
    const btn = document.getElementById('btn-create-gist');
    btn.disabled = true; btn.textContent = 'Criando…';
    try {
      const gistId = await DB.GitHubSync.createGist(token);
      document.getElementById('gh-gist-id').value = gistId;
      await DB.Settings.set('gh_token',   token);
      await DB.Settings.set('gh_gist_id', gistId);
      showToast('✅ Gist criado! ID salvo automaticamente.');
      Router.navigate('settings');
    } catch (e) {
      showToast('Erro: ' + e.message);
      btn.disabled = false; btn.textContent = 'Criar Gist agora';
    }
  };

  window.syncPush = async () => {
    const btn = document.getElementById('btn-push');
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      await DB.GitHubSync.push();
      showToast('✅ Dados enviados ao Gist!');
      Router.navigate('settings');
    } catch (e) {
      showToast('Erro ao enviar: ' + e.message);
      btn.disabled = false; btn.textContent = '↑ Enviar para o Gist';
    }
  };

  window.syncPull = async () => {
    if (!confirm('Isso substituirá os dados locais pelos dados do Gist. Continuar?')) return;
    const btn = document.getElementById('btn-pull');
    btn.disabled = true; btn.textContent = 'Baixando…';
    try {
      await DB.GitHubSync.pull();
      showToast('✅ Dados restaurados do Gist!');
      Router.navigate('home');
    } catch (e) {
      showToast('Erro ao baixar: ' + e.message);
      btn.disabled = false; btn.textContent = '↓ Restaurar do Gist';
    }
  };

  window.clearGistConfig = async () => {
    await Promise.all([
      DB.Settings.delete('gh_token'),
      DB.Settings.delete('gh_gist_id'),
    ]);
    showToast('Sync desconectado');
    Router.navigate('settings');
  };

  window.toggleTheme = async () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    await DB.Settings.set('theme', next);
    AppState.theme = next;
    const inp = document.getElementById('theme-toggle');
    if (inp) inp.checked = (next === 'light');
  };

  window.exportBackup = async () => {
    try {
      const data     = await DB.Backup.export();
      const json     = JSON.stringify(data, null, 2);
      const blob     = new Blob([json], { type: 'application/json' });
      const filename = `roma2027-backup-${new Date().toISOString().slice(0,10)}.json`;
      const file     = new File([blob], filename, { type: 'application/json' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Roma 2027 — Backup' });
      } else {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      showToast('✅ Backup exportado!');
    } catch (e) {
      if (!e.message.includes('cancel')) showToast('Erro: ' + e.message);
    }
  };

  window.importBackup = () => {
    const inp = Object.assign(document.createElement('input'),
      { type: 'file', accept: 'application/json' });
    inp.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        await DB.Backup.import(text);
        showToast('✅ Backup importado!');
        Router.navigate('settings');
      } catch (err) { showToast('Erro: ' + err.message); }
    };
    inp.click();
  };

  window.confirmReset = () => {
    if (!confirm('⚠️ Apagar TODOS os treinos? Esta ação é irreversível.')) return;
    if (!confirm('Última confirmação — tem certeza absoluta?')) return;
    DB.resetAll().then(() => { showToast('App resetado.'); Router.navigate('home'); });
  };

  return `
    <div class="screen-header"><h1 class="display">Configurações</h1></div>

    <div style="padding:12px 20px 24px;display:flex;flex-direction:column;gap:14px">

      <!-- App card -->
      <div class="card card-padded" style="text-align:center;
        background:linear-gradient(135deg,#150505,#200a0a);
        border-color:rgba(214,61,47,0.25)">
        <div style="font-size:44px;margin-bottom:10px">🏁</div>
        <div class="display" style="font-size:22px">Roma 2027</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
          Maratona de Roma · 14/03/2027 · sub-4h
        </div>
        <div style="display:flex;justify-content:center;gap:16px;margin-top:12px">
          <div style="text-align:center">
            <div style="font-family:var(--font-mono);font-size:20px;
                        font-weight:600;color:var(--accent)">${daysToRoma}</div>
            <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase">dias</div>
          </div>
          <div style="text-align:center">
            <div style="font-family:var(--font-mono);font-size:20px;
                        font-weight:600;color:var(--text)">${currentWeek}</div>
            <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase">semana</div>
          </div>
          <div style="text-align:center">
            <div style="font-family:var(--font-mono);font-size:20px;
                        font-weight:600;color:var(--success)">${totalWorkouts}</div>
            <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase">treinos</div>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div style="font-size:11px;text-transform:uppercase;
                  letter-spacing:.08em;color:var(--text-muted)">
        Preferências
      </div>
      <div class="card settings-list">
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon"
            style="background:var(--surface-3);font-size:16px">🌙</div>
          <div class="settings-row-text">
            <div class="settings-row-title">Tema escuro</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="theme-toggle"
              ${theme !== 'light' ? 'checked' : ''}
              onchange="toggleTheme()"/>
            <div class="toggle-track"></div>
          </label>
        </div>
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon"
            style="background:var(--surface-3);font-size:16px">📅</div>
          <div class="settings-row-text">
            <div class="settings-row-title">Início do plano</div>
            <div class="settings-row-subtitle">${planStart}</div>
          </div>
        </div>
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon"
            style="background:var(--surface-3);font-size:16px">📲</div>
          <div class="settings-row-text">
            <div class="settings-row-title">Armazenamento</div>
            <div class="settings-row-subtitle">IndexedDB local no dispositivo</div>
          </div>
        </div>
      </div>

      <!-- Data -->
      <div style="font-size:11px;text-transform:uppercase;
                  letter-spacing:.08em;color:var(--text-muted)">
        Dados
      </div>
      <div class="card settings-list">
        <div class="settings-row" onclick="exportBackup()">
          <div class="settings-row-icon"
            style="background:var(--info-dim);color:var(--info);font-size:16px">📤</div>
          <div class="settings-row-text">
            <div class="settings-row-title">Exportar backup</div>
            <div class="settings-row-subtitle">JSON via AirDrop / iMessage / E-mail</div>
          </div>
          <svg class="settings-chevron" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
        <div class="settings-row" onclick="importBackup()">
          <div class="settings-row-icon"
            style="background:var(--success-dim);color:var(--success);font-size:16px">📥</div>
          <div class="settings-row-text">
            <div class="settings-row-title">Importar backup</div>
            <div class="settings-row-subtitle">Restaurar de arquivo .json</div>
          </div>
          <svg class="settings-chevron" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- GitHub Gist Sync -->
      <div style="font-size:11px;text-transform:uppercase;
                  letter-spacing:.08em;color:var(--text-muted)">
        Sync entre dispositivos (GitHub Gist)
      </div>

      ${syncOk ? `
      <div class="card card-padded" style="border-color:rgba(45,110,78,0.4)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--success)"></div>
          <div>
            <div style="font-size:14px;font-weight:600">Sync ativo ✓</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:1px">
              Último sync: ${lastSyncFmt}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <button id="btn-push" class="btn btn-primary"
            style="flex:1;min-height:44px;font-size:14px" onclick="syncPush()">
            ↑ Enviar p/ Gist
          </button>
          <button id="btn-pull" class="btn btn-secondary"
            style="flex:1;min-height:44px;font-size:14px" onclick="syncPull()">
            ↓ Baixar do Gist
          </button>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
          Sync automático ao concluir cada treino.
        </div>
        <button class="btn btn-ghost"
          style="font-size:13px;min-height:36px;color:var(--text-muted)"
          onclick="clearGistConfig()">Desconectar</button>
      </div>` : `
      <div class="card card-padded">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;line-height:1.6">
          Sincronize entre iPhone, iPad e qualquer navegador via um
          <strong style="color:var(--text)">Gist secreto</strong> no seu GitHub —
          gratuito, seus dados, seu controle.
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div>
            <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">
              1. GitHub Token
              <span style="color:var(--text-faint)"> · Fine-grained PAT → permissão: Gists</span>
            </label>
            <input id="gh-token" class="input" type="password"
              placeholder="github_pat_…" value="${syncCfg.token || ''}"
              autocomplete="off"
              style="font-family:var(--font-mono);font-size:13px"/>
          </div>
          <div>
            <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">
              2. Gist ID
              <span style="color:var(--text-faint)"> · deixe vazio para criar um novo</span>
            </label>
            <input id="gh-gist-id" class="input" type="text"
              placeholder="a1b2c3d4e5f6…" value="${syncCfg.gistId || ''}"
              autocomplete="off"
              style="font-family:var(--font-mono);font-size:13px"/>
          </div>
          <div style="display:flex;gap:8px">
            <button id="btn-create-gist" class="btn btn-secondary"
              style="flex:1;min-height:44px;font-size:13px"
              onclick="createAndSaveGist()">Criar Gist novo</button>
            <button class="btn btn-primary"
              style="flex:1;min-height:44px;font-size:13px"
              onclick="saveGistConfig()">Salvar</button>
          </div>
        </div>
      </div>`}

      <!-- Danger zone -->
      <div class="card card-padded" style="border-color:rgba(214,61,47,0.3)">
        <div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:10px">
          ⚠️ Zona de perigo
        </div>
        <button class="btn btn-full"
          style="background:var(--accent-dim);color:var(--accent);min-height:44px;"
          onclick="confirmReset()">
          🗑 Apagar todos os dados
        </button>
      </div>

      <div style="text-align:center;color:var(--text-faint);font-size:12px;padding:4px 0">
        PWA · offline-first · IndexedDB + GitHub Gist sync
      </div>
      <div style="height:8px"></div>
    </div>`;
});

// ─── Service Worker ────────────────────────────────────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Nova versão disponível — reabra o app');
        }
      });
    });
  } catch (e) {
    console.warn('SW registration failed:', e.message);
  }
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    await DB.init();

    const theme = await DB.Settings.get('theme', 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    AppState.theme = theme;

    injectRestTimerOverlay();
    initNav();

    // Initial route from hash
    const hash = window.location.hash.replace(/^#/, '') || 'home';
    const validRoutes = ['home', 'calendar', 'history', 'settings', 'workout', 'exercise'];
    await Router.navigate(validRoutes.includes(hash) ? hash : 'home');

    registerSW();

    // Auto-sync on open (runs after render so the UI already shows)
    DB.GitHubSync.syncOnOpen().then(result => {
      if (result === 'pulled') {
        showToast('🔄 Dados atualizados do Gist!');
        // Re-render current screen to reflect pulled data
        Router.navigate(AppState.currentRoute);
      }
      // 'pushed', 'in_sync', 'skipped', 'error' → all silent
    });
  } catch (err) {
    console.error('Boot failed:', err);
    document.getElementById('screen').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💥</div>
        <h3>Erro ao iniciar o app</h3>
        <p style="font-size:12px;word-break:break-all">${err.message}</p>
      </div>`;
  } finally {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) { overlay.classList.add('hidden'); }
  }
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace(/^#/, '') || 'home';
  Router.navigate(hash);
});

document.addEventListener('DOMContentLoaded', boot);
