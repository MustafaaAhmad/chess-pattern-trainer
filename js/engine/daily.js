var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  function getTodayString() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getDailyPositionIndex(positions) {
    if (!positions || positions.length === 0) return 0;
    var today = getTodayString();
    return hashCode(today) % positions.length;
  }

  function getDailyStatus() {
    var today = getTodayString();
    var daily = ns.Storage.getDaily();
    if (daily.date !== today) {
      daily.date = today;
      daily.completed = false;
      daily.score = 0;
      ns.Storage.saveDaily(daily);
    }
    return daily;
  }

  function completeDaily(accuracy) {
    var today = getTodayString();
    var daily = { date: today, completed: true, score: accuracy };
    ns.Storage.saveDaily(daily);
    return daily;
  }

  function isDailyCompleted() {
    var daily = getDailyStatus();
    return daily.completed;
  }

  ns.Daily = {
    getTodayString: getTodayString,
    getDailyPositionIndex: getDailyPositionIndex,
    getDailyStatus: getDailyStatus,
    completeDaily: completeDaily,
    isDailyCompleted: isDailyCompleted
  };

})(ChessTrainer);
