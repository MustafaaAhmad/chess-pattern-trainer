var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  function ReconstructMode(position) {
    this.position = position;
    this.board = FEN.fenToBoardArray(position.fen);
    this.userBoard = createEmptyBoard();
    this.submitted = false;
    this.diff = null;
    this.results = null;
  }

  function createEmptyBoard() {
    var b = [];
    for (var r = 0; r < 8; r++) {
      b[r] = [];
      for (var c = 0; c < 8; c++) {
        b[r][c] = null;
      }
    }
    return b;
  }

  ReconstructMode.prototype.getStudyTime = function () {
    return 20;
  };

  ReconstructMode.prototype.getPositionForStudy = function () {
    return this.board;
  };

  ReconstructMode.prototype.getUserBoard = function () {
    return this.userBoard;
  };

  ReconstructMode.prototype.placePiece = function (fenChar, rank, file) {
    if (this.submitted) return;
    var p = getPieceFromFenChar(fenChar);
    if (p) {
      this.userBoard[rank][file] = p;
    }
  };

  ReconstructMode.prototype.removePiece = function (rank, file) {
    if (this.submitted) return;
    this.userBoard[rank][file] = null;
  };

  ReconstructMode.prototype.clearBoard = function () {
    if (this.submitted) return;
    this.userBoard = createEmptyBoard();
  };

  ReconstructMode.prototype.submit = function () {
    this.submitted = true;
    this.diff = ns.Board.diff(this.board, this.userBoard);

    var totalSquares = 64;
    var correctSquares = totalSquares - this.diff.length;
    var accuracy = Math.round((correctSquares / totalSquares) * 100);

    this.results = {
      totalQuestions: totalSquares,
      correct: correctSquares,
      accuracy: accuracy,
      diff: this.diff
    };
    return this.results;
  };

  ReconstructMode.prototype.getDiffHighlights = function () {
    var h = {};
    if (!this.diff) return h;
    this.diff.forEach(function (d) {
      h[d.square] = ns.Board.getHighlightClassForDiff(d.type);
    });
    return h;
  };

  function getPieceFromFenChar(fenChar) {
    var type = fenChar.toUpperCase();
    var color = fenChar === fenChar.toUpperCase() ? 'w' : 'b';
    return {
      type: type,
      color: color,
      fenChar: fenChar,
      unicode: FEN.PIECE_UNICODE[fenChar] || '?',
      name: FEN.PIECE_NAMES[fenChar] || '?',
      short: FEN.PIECE_SHORT[fenChar] || '?'
    };
  }

  ns.Modes = ns.Modes || {};
  ns.Modes.Reconstruct = ReconstructMode;

})(ChessTrainer);
