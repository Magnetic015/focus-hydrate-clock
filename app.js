(function () {
  'use strict';
  const L = window.FocusLogic;
  const $ = (id) => document.getElementById(id);
  const today = new Date().toISOString().slice(0, 10);
  const KEY = 'focus-hydrate-' + today;
  const state = JSON.parse(localStorage.getItem(KEY) || 'null') || { log: [] };
  let plan, idx = 0, remain = 0, timer = null, goal = 2000;

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function settings() {
    const n = (id) => Number($(id).value);
    goal = L.dailyWaterGoal(n('weight'));
    return { focus: n('focus'), rest: n('rest'), longRest: n('longRest'), longEvery: n('longEvery'), rounds: n('rounds'), goal };
  }
  const NAMES = { focus: '专注', rest: '短休', longRest: '长休' };

  function renderPlan() {
    $('plan').innerHTML = plan.steps.map((s, i) =>
      `<li class="${s.type}">${i === idx ? '▶ ' : ''}第${s.round}轮 ${NAMES[s.type]} ${s.minutes} 分钟${s.water ? '，喝水约 ' + s.water + ' ml' : ''}</li>`).join('');
  }
  function renderWater() {
    const s = L.summarize(state.log, goal);
    $('water').style.width = s.percent + '%';
    $('waterText').textContent = `${s.water} / ${goal} ml`;
    $('summary').textContent = `今日已专注 ${s.focusMin} 分钟，补水完成 ${s.percent}%`;
  }
  function renderClock() {
    const step = plan.steps[idx];
    if (!step) { $('phase').textContent = '今日计划完成，辛苦了！'; $('clock').textContent = '00:00'; return; }
    $('phase').textContent = `第 ${step.round} 轮 · ${NAMES[step.type]}`;
    $('clock').textContent = L.formatClock(remain);
    $('progress').style.width = (100 * (1 - remain / (step.minutes * 60))) + '%';
  }
  function load(i) { idx = i; const s = plan.steps[idx]; remain = s ? s.minutes * 60 : 0; renderClock(); renderPlan(); }
  function finishStep() {
    const s = plan.steps[idx];
    if (s && s.type === 'focus') {
      state.log.push({ type: 'focus', minutes: s.minutes, at: Date.now() }); save();
      const next = plan.steps[idx + 1];
      $('tip').textContent = next ? `该休息了，起身喝约 ${next.water} ml 水吧` : '';
      beep();
    } else { $('tip').textContent = '休息结束，开始新一轮专注'; beep(); }
    renderWater(); load(idx + 1);
  }
  function beep() {
    try { const c = new (window.AudioContext || window.webkitAudioContext)(); const o = c.createOscillator(); o.connect(c.destination); o.frequency.value = 660; o.start(); o.stop(c.currentTime + 0.25); } catch (e) {}
    if (window.Notification && Notification.permission === 'granted') new Notification('专注补水钟', { body: $('tip').textContent });
  }
  function tick() { remain -= 1; if (remain <= 0) finishStep(); else renderClock(); }

  $('start').onclick = () => { if (!timer && plan.steps[idx]) timer = setInterval(tick, 1000); if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); };
  $('pause').onclick = () => { clearInterval(timer); timer = null; };
  $('skip').onclick = () => finishStep();
  $('reset').onclick = () => { clearInterval(timer); timer = null; $('tip').textContent = ''; load(0); };
  document.querySelectorAll('.sip').forEach((b) => b.onclick = () => { state.log.push({ type: 'water', ml: Number(b.dataset.ml), at: Date.now() }); save(); renderWater(); });
  $('settings').onsubmit = (e) => { e.preventDefault(); clearInterval(timer); timer = null; plan = L.buildPlan(settings()); load(0); renderWater(); };

  plan = L.buildPlan(settings()); load(0); renderWater();
})();
