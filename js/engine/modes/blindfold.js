var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  function generateBlindfoldQuestions(fen) {
    var parsed = FEN.parse(fen);
    if (!parsed) return [];
    var board = parsed.board;
    var pieces = FEN.getAllPieces(board);
    if (pieces.length === 0) return [];

    var questions = [];
    var used = {};

    pieces.forEach(function (p) {
      var q = 'Where is the ' + p.piece.name + '?';
      if (!used[q]) {
        used[q] = true;
        questions.push({
          question: q,
          answer: p.square,
          type: 'square-recall'
        });
      }
    });

    var squareQs = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var sq = FEN.squareToAlgebraic(r, c);
        var piece = board[r][c];
        if (piece) {
          squareQs.push({
            question: 'What piece is on ' + sq + '?',
            answer: piece.name,
            type: 'piece-identification'
          });
        } else {
          squareQs.push({
            question: 'Is ' + sq + ' occupied?',
            answer: 'no',
            type: 'boolean'
          });
        }
      }
    }

    var shuffledSq = squareQs.sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < Math.min(3, shuffledSq.length); i++) {
      if (!used[shuffledSq[i].question]) {
        used[shuffledSq[i].question] = true;
        questions.push(shuffledSq[i]);
      }
    }

    var kings = pieces.filter(function (p) { return p.piece.type === 'K'; });
    kings.forEach(function (king) {
      var attacked = ns.Board.isSquareAttacked(board, king.rank, king.file,
        king.piece.color === 'w' ? 'b' : 'w');
      questions.push({
        question: 'Is the ' + king.piece.name + ' in check?',
        answer: attacked ? 'yes' : 'no',
        type: 'boolean'
      });
    });

    return questions.slice(0, 7);
  }

  function BlindfoldMode(position, options) {
    options = options || {};
    this.position = position;
    this.fen = position.fen;
    this.board = FEN.fenToBoardArray(position.fen);
    this.questions = generateBlindfoldQuestions(position.fen);
    this.currentIndex = 0;
    this.scores = [];
    this.userAnswers = [];
    this.results = null;
    this.level = options.level || 1;
    this.studyTime = Math.max(5, 20 - (this.level - 1) * 2);
    this.showInitialBoard = options.showBoard !== false;
  }

  BlindfoldMode.prototype.getStudyTime = function () {
    return this.studyTime;
  };

  BlindfoldMode.prototype.getQuestionCount = function () {
    return this.questions.length;
  };

  BlindfoldMode.prototype.getCurrentQuestion = function () {
    if (this.currentIndex >= this.questions.length) return null;
    return this.questions[this.currentIndex];
  };

  BlindfoldMode.prototype.submitAnswer = function (answer) {
    var q = this.getCurrentQuestion();
    if (!q) return null;
    var score = ns.Scoring.scoreAnswer(q, answer);
    this.scores.push(score);
    this.userAnswers.push(answer);
    this.currentIndex++;
    return { correct: score >= 1, score: score, correctAnswer: q.answer };
  };

  BlindfoldMode.prototype.isComplete = function () {
    return this.currentIndex >= this.questions.length;
  };

  BlindfoldMode.prototype.getResults = function () {
    var session = {
      questions: this.questions,
      scores: this.scores,
      userAnswers: this.userAnswers
    };
    return ns.Scoring.sessionReport(session);
  };

  BlindfoldMode.prototype.getPositionForStudy = function () {
    return this.showInitialBoard ? this.board : null;
  };

  BlindfoldMode.prototype.getHighlights = function () {
    var h = {};
    var qs = this.questions;
    for (var i = 0; i < qs.length && i < this.scores.length; i++) {
      var q = qs[i];
      var score = this.scores[i];
      if (q.answer && (q.type === 'square-recall' || q.type === 'piece-identification')) {
        h[q.answer] = score >= 1 ? 'highlight-correct' : 'highlight-incorrect';
      }
    }
    return h;
  };

  ns.Modes = ns.Modes || {};
  ns.Modes.Blindfold = BlindfoldMode;

})(ChessTrainer);
