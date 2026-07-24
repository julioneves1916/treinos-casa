// Blacksheep Treinos — PWA
// Leitura de data/workouts.json + UI + timer + historico local

'use strict';

const STORAGE_KEYS = {
  foco: 'bs.filter.foco',
  history: 'bs.history',
  checks: 'bs.checks', // map workoutId -> [boolean]
  weights: 'bs.weights', // map nome do exercício -> última carga usada (string)
};

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const state = {
  data: null,
  currentFoco: 'Todos',
  currentWorkout: null,
  timer: null,
};

// ---------- Loading ----------
async function loadData(){
  const res = await fetch('data/workouts.json', {cache:'no-cache'});
  if (!res.ok) throw new Error('Nao foi possivel carregar workouts.json');
  state.data = await res.json();
  $('#version-label').textContent = `Treinos · atualizado em ${state.data.version}`;
}

// ---------- Utils ----------
function fmtMMSS(totalSec){
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s/60);
  const r = s % 60;
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}
function youtubeSearchUrl(name){
  const q = encodeURIComponent(name);
  return `https://www.youtube.com/@CrossFit/search?query=${q}`;
}
function getWeights(){
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.weights) || '{}');
}
function setWeight(name, value){
  const all = getWeights();
  if (value === '' || value == null) delete all[name];
  else all[name] = value;
  localStorage.setItem(STORAGE_KEYS.weights, JSON.stringify(all));
}
function getChecks(id){
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.checks) || '{}');
  return all[id] || [];
}
function setChecks(id, arr){
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.checks) || '{}');
  all[id] = arr;
  localStorage.setItem(STORAGE_KEYS.checks, JSON.stringify(all));
}

// ---------- View switching ----------
function showView(name){
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#view-${name}`).classList.add('active');
  window.scrollTo({top:0, behavior:'instant'});
}
function setTab(view){
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
}

// ---------- List view ----------
function renderFocos(){
  const chips = $('#foco-chips');
  const focos = ['Todos', ...state.data.focos];
  const saved = localStorage.getItem(STORAGE_KEYS.foco) || 'Todos';
  state.currentFoco = focos.includes(saved) ? saved : 'Todos';

  chips.innerHTML = '';
  focos.forEach(f => {
    const b = document.createElement('button');
    b.className = 'chip' + (f === state.currentFoco ? ' active' : '');
    b.textContent = f;
    b.setAttribute('role','radio');
    b.setAttribute('aria-checked', f === state.currentFoco ? 'true' : 'false');
    b.addEventListener('click', () => {
      state.currentFoco = f;
      localStorage.setItem(STORAGE_KEYS.foco, f);
      renderFocos();
      renderList();
    });
    chips.appendChild(b);
  });
}

function matchesSearch(w, q){
  if (!q) return true;
  const hay = [
    `treino ${w.id}`, String(w.id), w.foco, w.estrutura,
    ...w.exercises.map(e => e.name),
    w.metabolico.raw,
  ].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every(tok => hay.includes(tok));
}

function renderList(){
  const ul = $('#workout-list');
  ul.innerHTML = '';
  const q = ($('#search-input')?.value || '').trim();
  const items = state.data.workouts.filter(w =>
    (state.currentFoco === 'Todos' || w.foco === state.currentFoco) && matchesSearch(w, q)
  );
  if (items.length === 0){
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Nenhum treino neste grupamento.';
    ul.appendChild(li);
    return;
  }
  items.forEach(w => {
    const li = document.createElement('li');
    li.className = 'workout-card';
    li.innerHTML = `
      <div class="wc-row1">
        <span class="wc-id">${w.id}</span>
        <div class="wc-main">
          <span class="wc-title">${w.estrutura}</span>
          <span class="wc-foco">${w.foco}</span>
        </div>
      </div>
      <span class="wc-arrow" aria-hidden="true">›</span>
    `;
    li.addEventListener('click', () => openDetail(w));
    ul.appendChild(li);
  });
}

// ---------- Detail view ----------
function openDetail(w){
  state.currentWorkout = w;
  $('#detail-foco').textContent = w.foco;
  $('#detail-title').textContent = `Treino ${w.id} · ${w.estrutura}`;
  $('#detail-estrutura').textContent = '';

  const list = $('#exercise-list');
  list.innerHTML = '';
  const checks = getChecks(w.id);

  const weights = getWeights();
  w.exercises.forEach((ex, i) => {
    const li = document.createElement('li');
    li.className = 'exercise-item' + (checks[i] ? ' done' : '');
    const id = `ex-${w.id}-${i}`;
    const setsHtml = ex.sets_raw ? `<div class="ex-sets">${ex.sets_raw}</div>` : '';

    // Vídeo: embutido (curado, <=30s) com mostrar/esconder; senão, busca externa
    const videoBtn = ex.video
      ? `<button type="button" class="ex-video" data-video="${ex.video.id}">▶ Ver execução</button>`
      : (ex.name !== 'Mobilidade'
          ? `<a class="ex-video" href="${youtubeSearchUrl(ex.name)}" target="_blank" rel="noopener">Ver execução ↗</a>`
          : '');

    // Carga: memória da última usada, por nome de exercício
    const showWeight = ex.weight !== false && ex.name !== 'Mobilidade';
    const savedWeight = weights[ex.name] || '';
    const weightHtml = showWeight ? `
      <span class="ex-weight">
        <input type="text" inputmode="decimal" class="ex-weight-input"
               placeholder="carga" value="${savedWeight.replace(/"/g,'&quot;')}"
               aria-label="Carga de ${ex.name}"/>
        <span class="ex-weight-unit">kg</span>
      </span>` : '';

    li.innerHTML = `
      <input type="checkbox" class="ex-check" id="${id}" ${checks[i] ? 'checked' : ''}/>
      <div class="ex-body">
        <label class="ex-name" for="${id}">${ex.name}</label>
        ${setsHtml}
        <div class="ex-actions">${videoBtn}${weightHtml}</div>
        <div class="ex-player" hidden></div>
      </div>
    `;
    const cb = li.querySelector('input.ex-check');
    cb.addEventListener('change', () => {
      const arr = getChecks(w.id);
      arr[i] = cb.checked;
      setChecks(w.id, arr);
      li.classList.toggle('done', cb.checked);
    });

    const wInput = li.querySelector('.ex-weight-input');
    if (wInput){
      wInput.addEventListener('click', e => e.stopPropagation());
      wInput.addEventListener('change', () => setWeight(ex.name, wInput.value.trim()));
      wInput.addEventListener('blur', () => setWeight(ex.name, wInput.value.trim()));
    }

    const vBtn = li.querySelector('button.ex-video');
    if (vBtn){
      const player = li.querySelector('.ex-player');
      vBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const open = !player.hidden;
        if (open){
          player.hidden = true;
          player.innerHTML = ''; // descarrega o iframe (pausa o vídeo)
          vBtn.textContent = '▶ Ver execução';
        } else {
          player.innerHTML = `<iframe
            src="https://www.youtube-nocookie.com/embed/${vBtn.dataset.video}?rel=0&modestbranding=1&playsinline=1"
            title="Execução: ${ex.name}" frameborder="0" allowfullscreen
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
          player.hidden = false;
          vBtn.textContent = '✕ Esconder vídeo';
        }
      });
    }
    list.appendChild(li);
  });

  const m = w.metabolico;
  const labelByType = {
    amrap:'AMRAP', emom:'EMOM', interval:'Intervalos',
    rounds_fortime:'Rounds For Time', fortime:'For Time', custom:'Metabólico',
  };
  $('#metab-card').innerHTML = `
    <span class="metab-type">${labelByType[m.type] || 'Metabólico'}</span>
    <div class="metab-raw">${m.raw}</div>
  `;

  showView('detail');
  setTab('list');
}

// ---------- Timer ----------
function openTimer(w){
  const m = w.metabolico;
  state.currentWorkout = w;
  $('#timer-eyebrow').textContent = w.foco;
  const labelByType = {
    amrap:'AMRAP', emom:'EMOM', interval:'Intervalos',
    rounds_fortime:'Rounds For Time', fortime:'For Time', custom:'Metabólico',
  };
  $('#timer-title').textContent = `${labelByType[m.type] || 'Timer'} · Treino ${w.id}`;
  $('#timer-raw').textContent = m.raw;

  stopTimer();
  configureTimer(m);
  renderTimerDisplay();
  showView('timer');
}

function configureTimer(m){
  // Monta o "plano" do timer conforme tipo
  state.timer = {
    type: m.type,
    running: false,
    intervalId: null,
    elapsed: 0,
    targetSec: m.duration_sec,
    rounds: m.rounds,
    on: m.interval_on,
    off: m.interval_off,
    currentRound: 0,
    phase: '', // ON/OFF para interval
  };
  if (m.type === 'interval'){
    state.timer.currentRound = 1;
    state.timer.phase = 'ON';
    state.timer.phaseRemaining = m.interval_on;
  }
}

function tick(){
  const t = state.timer;
  if (!t || !t.running) return;

  if (t.type === 'amrap' || t.type === 'emom'){
    // countdown
    const remaining = t.targetSec - t.elapsed;
    if (remaining <= 0){
      stopTimer(true);
      beep(3);
      return;
    }
    t.elapsed += 1;
    // Para EMOM: avisar a cada minuto
    if (t.type === 'emom' && t.elapsed % 60 === 0 && t.elapsed < t.targetSec){
      beep(1);
    }
  } else if (t.type === 'interval'){
    t.phaseRemaining -= 1;
    t.elapsed += 1;
    if (t.phaseRemaining <= 0){
      // trocar fase
      if (t.phase === 'ON'){
        t.phase = 'OFF';
        t.phaseRemaining = t.off;
        beep(1);
      } else {
        // proxima round
        t.currentRound += 1;
        if (t.currentRound > t.rounds){
          stopTimer(true);
          beep(3);
          return;
        }
        t.phase = 'ON';
        t.phaseRemaining = t.on;
        beep(2);
      }
    }
  } else {
    // count-up: fortime, rounds_fortime, custom
    t.elapsed += 1;
  }
  renderTimerDisplay();
}

function renderTimerDisplay(){
  const t = state.timer;
  if (!t){ $('#timer-clock').textContent = '00:00'; return; }

  let primary = '00:00';
  let phase = '';
  let round = '';

  if (t.type === 'amrap' || t.type === 'emom'){
    primary = fmtMMSS(t.targetSec - t.elapsed);
    phase = t.type.toUpperCase();
    round = t.type === 'emom' ? `Minuto ${Math.floor(t.elapsed/60) + 1} / ${Math.floor(t.targetSec/60)}` : '';
  } else if (t.type === 'interval'){
    primary = fmtMMSS(t.phaseRemaining);
    phase = t.phase;
    round = `Round ${Math.min(t.currentRound, t.rounds)} / ${t.rounds}`;
  } else {
    primary = fmtMMSS(t.elapsed);
    phase = 'FOR TIME';
    round = t.rounds ? `${t.rounds} rounds` : '';
  }
  $('#timer-clock').textContent = primary;
  $('#timer-phase').textContent = phase;
  $('#timer-round').textContent = round;
}

function startTimer(){
  const t = state.timer;
  if (!t || t.running) return;
  t.running = true;
  t.intervalId = setInterval(tick, 1000);
  $('#timer-start').textContent = 'Start';
}
function pauseTimer(){
  const t = state.timer;
  if (!t) return;
  t.running = false;
  if (t.intervalId) clearInterval(t.intervalId);
}
function stopTimer(finished=false){
  if (!state.timer) return;
  pauseTimer();
  if (finished){
    $('#timer-phase').textContent = 'FIM';
  }
}
function resetTimer(){
  const w = state.currentWorkout;
  if (!w) return;
  configureTimer(w.metabolico);
  renderTimerDisplay();
}

// Beep simples via WebAudio (sem arquivo)
function beep(times=1){
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    for (let i=0; i<times; i++){
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.0001;
      const t0 = ctx.currentTime + i * 0.18;
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      o.start(t0); o.stop(t0 + 0.16);
    }
  } catch(e){}
}

// ---------- History ----------
function loadHistory(){
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]');
}
function saveHistory(entries){
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(entries));
}
function addHistory(w){
  const entries = loadHistory();
  entries.unshift({
    id: w.id,
    foco: w.foco,
    estrutura: w.estrutura,
    date: new Date().toISOString(),
  });
  saveHistory(entries.slice(0, 300));
}
function renderHistory(){
  const ul = $('#history-list');
  const empty = $('#history-empty');
  const entries = loadHistory();
  ul.innerHTML = '';
  empty.style.display = entries.length ? 'none' : 'block';
  entries.forEach(e => {
    const li = document.createElement('li');
    li.className = 'history-item';
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}) +
      ' · ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    li.innerHTML = `
      <div>
        <div><strong>Treino ${e.id}</strong> · ${e.estrutura}</div>
        <div class="history-date">${e.foco}</div>
      </div>
      <div class="history-date">${dateStr}</div>
    `;
    ul.appendChild(li);
  });
}

// ---------- Finish / reset checks ----------
function finishWorkout(){
  const w = state.currentWorkout;
  if (!w) return;
  addHistory(w);
  setChecks(w.id, []); // limpa checkboxes
  stopTimer();
  renderHistory();
  showView('history');
  setTab('history');
}

// ---------- Boot ----------
function bindUI(){
  $$('.tab').forEach(t => {
    t.addEventListener('click', () => {
      const v = t.dataset.view;
      setTab(v);
      if (v === 'list') { renderList(); showView('list'); }
      else if (v === 'history') { renderHistory(); showView('history'); }
    });
  });
  $('#back-from-detail').addEventListener('click', () => { showView('list'); setTab('list'); });
  $('#back-from-timer').addEventListener('click', () => { stopTimer(); showView('detail'); });
  $('#start-timer-btn').addEventListener('click', () => {
    if (state.currentWorkout) openTimer(state.currentWorkout);
  });
  $('#finish-btn').addEventListener('click', finishWorkout);

  $('#timer-start').addEventListener('click', startTimer);
  $('#timer-pause').addEventListener('click', pauseTimer);
  $('#timer-reset').addEventListener('click', resetTimer);

  $('#search-input').addEventListener('input', renderList);

  $('#clear-history').addEventListener('click', () => {
    if (confirm('Limpar todo o histórico?')) {
      saveHistory([]);
      renderHistory();
    }
  });
}

async function boot(){
  bindUI();
  try {
    await loadData();
  } catch(e){
    document.body.innerHTML = `<div style="padding:24px">Falha ao carregar dados: ${e.message}</div>`;
    return;
  }
  renderFocos();
  renderList();
  renderHistory();
  showView('list');
}
boot();
