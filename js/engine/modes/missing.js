var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  function removeRandomPieces(fen, count) {
    var parsed = FEN.parse(fen);
    if (!parsed) return { fen: fen, removed: [] };
    var board = FEN.cloneBoard(parsed.board);
    var pieces = FEN.getAllPieces(board);
    var shuffled = pieces.sort(function () { return Math.random() - 0.5; });
    var toRemove = shuffled.slice(0, Math.min(count, pieces.length));
    var removed = [];

    toRemove.forEach(function (p) {
      removed.push({ piece: p.piece, square: p.square });
      board[p.rank][p.file] = null;
    });

    var newFen = FEN.toFEN(board) + ' ' + parsed.turn + ' ' + parsed.castling + ' ' + parsed.enPassant + ' ' + parsed.halfmove + ' ' + parsed.fullmove;
    return { fen: newFen, removed: removed };
  }

  function generateMissingQuestions(removed) {
    var questions = [];
    removed.forEach(function (r) {
      questions.push({
        question: 'Which piece is missing from ' + r.square + '?',
        answer: r.piece.name,
        type: 'piece-identification',
        removedPiece: r
      });
    });
    return questions;
  }

  function MissingMode(position) {
    this.position = position;
    this.originalBoard = FEN.fenToBoardArray(position.fen);

    var removeCount = position.difficulty === 'easy' ? 1 : (position.difficulty === 'medium' ? 2 : 3);
    var result = removeRandomPieces(position.fen, removeCount);
    this.modifiedFen = result.fen;
    this.modifiedBoard = FEN.fenToBoardArray(result.fen);
    this.removedPieces = result.removed;
    this.questions = position.questions && position.questions.length > 0
      ? position.questions.slice()
      : generateMissingQuestions(result.removed);
    this.currentIndex = 0;
    this.scores = [];
    this.userAnswers = [];
    this.results = null;
  }

  MissingMode.prototype.getStudyTime = function () {
    return 15;
  };

  MissingMode.prototype.getQuestionCount = function () {
    return this.questions.length;
  };

  MissingMode.prototype.getCurrentQuestion = function () {
    if (this.currentIndex >= this.questions.length) return null;
    return this.questions[this.currentIndex];
  };

  MissingMode.prototype.submitAnswer = function (answer) {
    var q = this.getCurrentQuestion();
    if (!q) return null;
    var score = ns.Scoring.scoreAnswer(q, answer);
    this.scores.push(score);
    this.userAnswers.push(answer);
    this.currentIndex++;
    return { correct: score >= 1, score: score, correctAnswer: q.answer };
  };

  MissingMode.prototype.isComplete = function () {
    return this.currentIndex >= this.questions.length;
  };

  MissingMode.prototype.getResults = function () {
    var session = {
      questions: this.questions,
      scores: this.scores,
      userAnswers: this.userAnswers
    };
    return ns.Scoring.sessionReport(session);
  };

  MissingMode.prototype.getPositionForStudy = function () {
    return this.originalBoard;
  };

  MissingMode.prototype.getModifiedBoard = function () {
    return this.modifiedBoard;
  };

  MissingMode.prototype.getHighlights = function () {
    var h = {};
    this.removedPieces.forEach(function (r) {
      h[r.square] = 'highlight-missing';
    });
    return h;
  };

  ns.Modes = ns.Modes || {};
  ns.Modes.Missing = MissingMode;

})(ChessTrainer);
