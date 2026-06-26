var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var KEYS = {
    SETTINGS: 'ct_settings',
    STATS: 'ct_stats',
    STREAK: 'ct_streak',
    SPACED: 'ct_spaced',
    DAILY: 'ct_daily',
    HISTORY: 'ct_history'
  };

  var defaults = {
    settings: {
      darkMode: false,
      difficulty: 'medium',
      studyTime: 15,
      recallTime: 30
    },
    stats: {
      totalPositions: 0,
      overallAccuracy: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      byMode: {},
      byType: {},
      trend: []
    },
    streak: {
      current: 0,
      best: 0
    },
    spaced: {},
    daily: {
      date: '',
      completed: false,
      score: 0
    },
    history: []
  };

  function get(key, fallback) {
    try {
      var val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function getSettings() {
    return get(KEYS.SETTINGS, JSON.parse(JSON.stringify(defaults.settings)));
  }

  function saveSettings(s) {
    set(KEYS.SETTINGS, s);
  }

  function getStats() {
    return get(KEYS.STATS, JSON.parse(JSON.stringify(defaults.stats)));
  }

  function saveStats(s) {
    set(KEYS.STATS, s);
  }

  function getStreak() {
    return get(KEYS.STREAK, JSON.parse(JSON.stringify(defaults.streak)));
  }

  function saveStreak(s) {
    set(KEYS.STREAK, s);
  }

  function getSpaced() {
    return get(KEYS.SPACED, {});
  }

  function saveSpaced(s) {
    set(KEYS.SPACED, s);
  }

  function getDaily() {
    return get(KEYS.DAILY, JSON.parse(JSON.stringify(defaults.daily)));
  }

  function saveDaily(d) {
    set(KEYS.DAILY, d);
  }

  function getHistory() {
    return get(KEYS.HISTORY, []);
  }

  function saveHistory(h) {
    var recent = h.slice(-200);
    set(KEYS.HISTORY, recent);
  }

  function addHistoryEntry(entry) {
    var history = getHistory();
    history.push({
      date: new Date().toISOString(),
      mode: entry.mode,
      positionName: entry.positionName,
      accuracy: entry.accuracy,
      totalQuestions: entry.totalQuestions,
      correct: entry.correct,
      difficulty: entry.difficulty
    });
    saveHistory(history);
  }

  function updateStats(sessionData) {
    var stats = getStats();
    stats.totalPositions++;

    var mode = sessionData.mode || 'unknown';
    if (!stats.byMode[mode]) {
      stats.byMode[mode] = { positionsStudied: 0, accuracy: 0, totalCorrect: 0, totalQuestions: 0 };
    }
    stats.byMode[mode].positionsStudied++;
    stats.byMode[mode].totalCorrect += sessionData.correct || 0;
    stats.byMode[mode].totalQuestions += sessionData.totalQuestions || 0;
    stats.byMode[mode].accuracy = stats.byMode[mode].totalQuestions > 0
      ? (stats.byMode[mode].totalCorrect / stats.byMode[mode].totalQuestions) * 100 : 0;

    if (sessionData.byType) {
      for (var type in sessionData.byType) {
        if (!stats.byType[type]) {
          stats.byType[type] = { total: 0, correct: 0, accuracy: 0 };
        }
        stats.byType[type].total += sessionData.byType[type].total || 0;
        stats.byType[type].correct += sessionData.byType[type].correct || 0;
        stats.byType[type].accuracy = stats.byType[type].total > 0
          ? (stats.byType[type].correct / stats.byType[type].total) * 100 : 0;
      }
    }

    stats.totalCorrect += sessionData.correct || 0;
    stats.totalQuestions += sessionData.totalQuestions || 0;
    stats.overallAccuracy = stats.totalQuestions > 0
      ? (stats.totalCorrect / stats.totalQuestions) * 100 : 0;

    stats.trend.push(sessionData.accuracy || 0);
    if (stats.trend.length > 30) stats.trend = stats.trend.slice(-30);

    saveStats(stats);
  }

  function updateStreak(accuracy, threshold) {
    threshold = threshold || 70;
    var streak = getStreak();
    if (accuracy >= threshold) {
      streak.current++;
      if (streak.current > streak.best) streak.best = streak.current;
    } else {
      streak.current = 0;
    }
    saveStreak(streak);
    return streak;
  }

  function getStreakDisplay() {
    var s = getStreak();
    return s.current > 0 ? s.current + (s.current === 1 ? ' streak' : ' streak') : '';
  }

  function clearAll() {
    try {
      Object.keys(KEYS).forEach(function (k) {
        localStorage.removeItem(KEYS[k]);
      });
    } catch (e) {}
  }

  ns.Storage = {
    getSettings: getSettings,
    saveSettings: saveSettings,
    getStats: getStats,
    saveStats: saveStats,
    getStreak: getStreak,
    saveStreak: saveStreak,
    getSpaced: getSpaced,
    saveSpaced: saveSpaced,
    getDaily: getDaily,
    saveDaily: saveDaily,
    getHistory: getHistory,
    saveHistory: saveHistory,
    addHistoryEntry: addHistoryEntry,
    updateStats: updateStats,
    updateStreak: updateStreak,
    getStreakDisplay: getStreakDisplay,
    clearAll: clearAll,
    KEYS: KEYS
  };

})(ChessTrainer);
