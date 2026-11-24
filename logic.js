// 专注补水钟 —— 纯逻辑模块（浏览器与 Node 通用）
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FocusLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** 根据体重（kg）估算每日建议饮水量（ml），按 30ml/kg，限制在 1500~3500 之间，取整到 50ml */
  function dailyWaterGoal(weightKg) {
    const w = Number(weightKg);
    if (!Number.isFinite(w) || w <= 0) return 2000;
    const raw = Math.min(3500, Math.max(1500, w * 30));
    return Math.round(raw / 50) * 50;
  }

  /**
   * 生成一天的节奏计划：focus 分钟专注 + rest 分钟休息，每 longEvery 轮后长休息 longRest 分钟。
   * 每次休息安排一次喝水，把每日目标平均分到所有休息里。
   */
  function buildPlan(opts) {
    const o = Object.assign({ focus: 25, rest: 5, longRest: 15, longEvery: 4, rounds: 8, goal: 2000 }, opts || {});
    if (o.focus <= 0 || o.rest <= 0 || o.rounds <= 0) throw new Error('参数必须为正数');
    const sips = o.rounds; // 每轮专注后一次补水
    const perSip = Math.round(o.goal / sips / 10) * 10;
    const steps = [];
    let t = 0;
    for (let i = 1; i <= o.rounds; i++) {
      steps.push({ type: 'focus', round: i, start: t, minutes: o.focus });
      t += o.focus;
      const isLong = i % o.longEvery === 0;
      const m = isLong ? o.longRest : o.rest;
      steps.push({ type: isLong ? 'longRest' : 'rest', round: i, start: t, minutes: m, water: perSip });
      t += m;
    }
    return { steps, totalMinutes: t, perSip, plannedWater: perSip * sips };
  }

  /** 把秒数格式化为 mm:ss */
  function formatClock(sec) {
    const s = Math.max(0, Math.floor(sec));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  /** 汇总当天记录：已专注分钟、已喝水量、完成度 */
  function summarize(log, goal) {
    let focusMin = 0, water = 0;
    for (const e of log || []) {
      if (e.type === 'focus') focusMin += e.minutes || 0;
      if (e.type === 'water') water += e.ml || 0;
    }
    const g = goal > 0 ? goal : 2000;
    return { focusMin, water, percent: Math.min(100, Math.round((water / g) * 100)) };
  }

  return { dailyWaterGoal, buildPlan, formatClock, summarize };
});
