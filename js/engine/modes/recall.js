var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  function generateQuestionsFromFEN(fen, count) {
    count = count || 5;
    var parsed = FEN.parse(fen);
    if (!parsed) return [];
    var board = parsed.board;
    var pieces = FEN.getAllPieces(board);
    if (pieces.length === 0) return [];

    var questions = [];
    var templates = [];

    pieces.forEach(function (p) {
      templates.push({
        question: 'Where was the ' + p.piece.name + '?',
        answer: p.square,
        type: 'square-recall',
        piece: p
      });
    });

    var usedSquares = {};
    pieces.forEach(function (p) { usedSquares[p.square] = true; });

    var allSquares = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        allSquares.push(FEN.squareToAlgebraic(r, c));
      }
    }

    var shuffledSquares = allSquares.slice().sort(function () { return Math.random() - 0.5; });
    shuffledSquares.forEach(function (sq) {
      var p = getPieceAtSquare(board, sq);
      if (p) {
        templates.push({
          question: 'What piece was on ' + sq + '?',
          answer: p.piece.name,
          type: 'piece-identification',
          piece: p
        });
      }
    });

    var kings = [];
    pieces.forEach(function (p) {
      if (p.piece.type === 'K') kings.push(p);
    });
    kings.forEach(function (king) {
      var adj = getAdjacentSquares(king.rank, king.file);
      adj.forEach(function (a) {
        var sq = FEN.squareToAlgebraic(a.rank, a.file);
        var occ = getPieceAtSquare(board, sq);
        templates.push({
          question: (occ ? 'What piece was on ' : 'Was there a piece on ') + sq + ' (near the ' + king.piece.name + ')?',
          answer: occ ? occ.piece.name : 'empty',
          type: occ ? 'piece-identification' : 'boolean'
        });
      });
    });

    var seen = {};
    var selected = [];
    var shuffled = templates.sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < shuffled.length && selected.length < count; i++) {
      var key = shuffled[i].question;
      if (!seen[key]) {
        seen[key] = true;
        selected.push(shuffled[i]);
      }
    }

    return selected;
  }

  function getPieceAtSquare(board, square) {
    var sq = FEN.algebraicToSquare(square);
    if (!sq) return null;
    var p = board[sq.rank] && board[sq.rank][sq.file];
    return p ? { piece: p, rank: sq.rank, file: sq.file, square: square } : null;
  }

  function getAdjacentSquares(rank, file) {
    var adj = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var df = -1; df <= 1; df++) {
        if (dr === 0 && df === 0) continue;
        var r = rank + dr;
        var f = file + df;
        if (r >= 0 && r < 8 && f >= 0 && f < 8) {
          adj.push({ rank: r, file: f });
        }
      }
    }
    return adj;
  }

  function RecallMode(position, options) {
    options = options || {};
    this.position = position;
    this.board = FEN.fenToBoardArray(position.fen);
    this.questions = position.questions && position.questions.length > 0
      ? position.questions.slice()
      : generateQuestionsFromFEN(position.fen, options.questionCount || 5);
    this.currentIndex = 0;
    this.scores = [];
    this.userAnswers = [];
    this.results = null;
  }

  RecallMode.prototype.getStudyTime = function () {
    return 15;
  };

  RecallMode.prototype.getQuestionCount = function () {
    return this.questions.length;
  };

  RecallMode.prototype.getCurrentQuestion = function () {
    if (this.currentIndex >= this.questions.length) return null;
    return this.questions[this.currentIndex];
  };

  RecallMode.prototype.submitAnswer = function (answer) {
    var q = this.getCurrentQuestion();
    if (!q) return null;
    var score = ns.Scoring.scoreAnswer(q, answer);
    this.scores.push(score);
    this.userAnswers.push(answer);
    this.currentIndex++;
    return { correct: score >= 1, score: score, correctAnswer: q.answer };
  };

  RecallMode.prototype.isComplete = function () {
    return this.currentIndex >= this.questions.length;
  };

  RecallMode.prototype.getResults = function () {
    var session = {
      questions: this.questions,
      scores: this.scores,
      userAnswers: this.userAnswers
    };
    return ns.Scoring.sessionReport(session);
  };

  RecallMode.prototype.getPositionForStudy = function () {
    return this.board;
  };

  RecallMode.prototype.getPositionForRecall = function () {
    return null;
  };

  RecallMode.prototype.getHighlights = function () {
    var h = {};
    var qs = this.questions;
    for (var i = 0; i < qs.length && i < this.scores.length; i++) {
      var q = qs[i];
      var score = this.scores[i];
      if (q.type === 'square-recall' || q.type === 'piece-identification') {
        if (q.answer) {
          h[q.answer] = score >= 1 ? 'highlight-correct' : 'highlight-incorrect';
        }
        if (q.type === 'piece-identification' && q.answer && score < 1) {
          h[q.answer] = 'highlight-incorrect';
        }
      }
    }
    return h;
  };

  ns.Modes = ns.Modes || {};
  ns.Modes.Recall = RecallMode;

})(ChessTrainer);
