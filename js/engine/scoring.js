var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  function calculateAccuracy(correct, total) {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  function scoreSquareRecall(userAnswer, correctAnswer) {
    if (!userAnswer || !correctAnswer) return 0;
    var ua = userAnswer.trim().toLowerCase();
    var ca = correctAnswer.trim().toLowerCase();
    if (ua === ca) return 1;

    var uaParsed = parseInt(ua[1], 10);
    var caParsed = parseInt(ca[1], 10);
    if (!isNaN(uaParsed) && !isNaN(caParsed)) {
      var uFile = ua.charCodeAt(0) - 97;
      var cFile = ca.charCodeAt(0) - 97;
      var uRank = 8 - uaParsed;
      var cRank = 8 - caParsed;
      var dist = Math.abs(uFile - cFile) + Math.abs(uRank - cRank);
      if (dist === 1) return 0.5;
    }
    return 0;
  }

  function scorePieceIdentification(userAnswer, correctAnswer) {
    if (!userAnswer || !correctAnswer) return 0;
    var ua = userAnswer.trim().toLowerCase();
    var ca = correctAnswer.trim().toLowerCase();
    if (ua === ca) return 1;

    var uaShort = ua.replace(/^(white|black)\s*/i, '');
    var caShort = ca.replace(/^(white|black)\s*/i, '');
    if (uaShort === caShort) return 0.5;

    return 0;
  }

  function scoreBoolean(userAnswer, correctAnswer) {
    if (userAnswer === undefined || userAnswer === null) return 0;
    return String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase() ? 1 : 0;
  }

  function scoreAnswer(question, userAnswer) {
    var type = question.type || 'square-recall';
    var correct = question.answer;
    switch (type) {
      case 'square-recall':
        return scoreSquareRecall(userAnswer, correct);
      case 'piece-identification':
        return scorePieceIdentification(userAnswer, correct);
      case 'boolean':
      case 'occupancy':
        return scoreBoolean(userAnswer, correct);
      default:
        return String(userAnswer).toLowerCase() === String(correct).toLowerCase() ? 1 : 0;
    }
  }

  function isCorrect(score) {
    return score >= 1;
  }

  function sessionReport(session) {
    var total = session.questions.length;
    var correct = 0;
    var totalScore = 0;
    var byType = {};

    session.questions.forEach(function (q, i) {
      var s = session.scores[i] || 0;
      totalScore += s;
      if (s >= 1) correct++;

      var type = q.type || 'unknown';
      if (!byType[type]) byType[type] = { total: 0, correct: 0, score: 0 };
      byType[type].total++;
      byType[type].score += s;
      if (s >= 1) byType[type].correct++;
    });

    var accuracy = calculateAccuracy(totalScore, total);
    var pctCorrect = calculateAccuracy(correct, total);

    return {
      totalQuestions: total,
      correct: correct,
      totalScore: totalScore,
      accuracy: accuracy,
      pctCorrect: pctCorrect,
      byType: byType
    };
  }

  ns.Scoring = {
    calculateAccuracy: calculateAccuracy,
    scoreSquareRecall: scoreSquareRecall,
    scorePieceIdentification: scorePieceIdentification,
    scoreBoolean: scoreBoolean,
    scoreAnswer: scoreAnswer,
    isCorrect: isCorrect,
    sessionReport: sessionReport
  };

})(ChessTrainer);
