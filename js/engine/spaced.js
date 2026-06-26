var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var STAGES = [
    { name: 'same session', delayMs: 0 },
    { name: '1 day', delayMs: 24 * 60 * 60 * 1000 },
    { name: '3 days', delayMs: 3 * 24 * 60 * 60 * 1000 },
    { name: '7 days', delayMs: 7 * 24 * 60 * 60 * 1000 },
    { name: '30 days', delayMs: 30 * 24 * 60 * 60 * 1000 }
  ];

  function getPositionData(spaced, positionId) {
    return spaced[positionId] || { stage: 0, lastReview: null, correct: 0, incorrect: 0, nextReview: null };
  }

  function recordResult(spaced, positionId, isCorrectResult) {
    var data = getPositionData(spaced, positionId);
    data.lastReview = Date.now();

    if (isCorrectResult) {
      data.correct++;
      data.stage = Math.min(data.stage + 1, STAGES.length - 1);
    } else {
      data.incorrect++;
      data.stage = 0;
    }

    var delay = STAGES[data.stage].delayMs;
    data.nextReview = data.lastReview + delay;
    spaced[positionId] = data;
    return data;
  }

  function getPositionsDue(spaced) {
    var now = Date.now();
    var due = [];
    for (var id in spaced) {
      var data = spaced[id];
      if (!data.nextReview || now >= data.nextReview) {
        due.push({ id: id, data: data });
      }
    }
    return due;
  }

  function getStageName(stageIndex) {
    return STAGES[stageIndex] ? STAGES[stageIndex].name : 'unknown';
  }

  function getNextReviewDelay(data) {
    if (!data) return 'now';
    var stage = data.stage || 0;
    var delay = STAGES[stage] ? STAGES[stage].delayMs : 0;
    if (delay === 0) return 'now';
    var hours = delay / (60 * 60 * 1000);
    if (hours < 24) return Math.round(hours) + 'h';
    return Math.round(hours / 24) + 'd';
  }

  ns.Spaced = {
    STAGES: STAGES,
    getPositionData: getPositionData,
    recordResult: recordResult,
    getPositionsDue: getPositionsDue,
    getStageName: getStageName,
    getNextReviewDelay: getNextReviewDelay
  };

})(ChessTrainer);
