var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  function generateChangeQuestions(fenA, fenB) {
    var boardA = FEN.fenToBoardArray(fenA);
    var boardB = FEN.fenToBoardArray(fenB);
    if (!boardA || !boardB) return [];

    var changes = ns.Board.compare(boardA, boardB);
    if (changes.length === 0) {
      return [{ question: 'Did anything change?', answer: 'no', type: 'boolean' }];
    }

    var questions = [];
    changes.forEach(function (ch) {
      var fromName = ch.from ? ch.from.name : 'empty';
      var toName = ch.to ? ch.to.name : 'empty';
      questions.push({
        question: 'What changed on ' + ch.square + '?',
        answer: fromName + ' → ' + toName,
        type: 'change',
        change: ch
      });
    });

    var randomChange = changes[Math.floor(Math.random() * changes.length)];
    questions.push({
      question: 'Which square changed?',
      answer: randomChange.square,
      type: 'square-recall',
      change: randomChange
    });

    return questions.slice(0, 5);
  }

  function ChangeMode(positionA, positionB) {
    this.positionA = positionA;
    this.positionB = positionB;
    this.boardA = FEN.fenToBoardArray(positionA.fen);
    this.boardB = FEN.fenToBoardArray(positionB.fen);
    this.questions = generateChangeQuestions(positionA.fen, positionB.fen);
    this.currentIndex = 0;
    this.scores = [];
    this.userAnswers = [];
    this.results = null;
    this.phase = 'studyA';
  }

  ChangeMode.prototype.getStudyTimeA = function () {
    return 10;
  };

  ChangeMode.prototype.getStudyTimeB = function () {
    return 3;
  };

  ChangeMode.prototype.getQuestionCount = function () {
    return this.questions.length;
  };

  ChangeMode.prototype.getCurrentQuestion = function () {
    if (this.currentIndex >= this.questions.length) return null;
    return this.questions[this.currentIndex];
  };

  ChangeMode.prototype.submitAnswer = function (answer) {
    var q = this.getCurrentQuestion();
    if (!q) return null;
    var score = ns.Scoring.scoreAnswer(q, answer);
    this.scores.push(score);
    this.userAnswers.push(answer);
    this.currentIndex++;
    return { correct: score >= 1, score: score, correctAnswer: q.answer };
  };

  ChangeMode.prototype.isComplete = function () {
    return this.currentIndex >= this.questions.length;
  };

  ChangeMode.prototype.getResults = function () {
    var session = {
      questions: this.questions,
      scores: this.scores,
      userAnswers: this.userAnswers
    };
    return ns.Scoring.sessionReport(session);
  };

  ChangeMode.prototype.getPositionForStudy = function () {
    return this.boardA;
  };

  ChangeMode.prototype.getHighlights = function () {
    var changes = ns.Board.compare(this.boardA, this.boardB);
    var h = {};
    changes.forEach(function (ch) {
      h[ch.square] = 'highlight-missing';
    });
    var qs = this.questions;
    for (var i = 0; i < qs.length && i < this.scores.length; i++) {
      var q = qs[i];
      if (q.answer && q.type === 'square-recall') {
        h[q.answer] = this.scores[i] >= 1 ? 'highlight-correct' : 'highlight-incorrect';
      }
    }
    return h;
  };

  ns.Modes = ns.Modes || {};
  ns.Modes.Change = ChangeMode;

})(ChessTrainer);
