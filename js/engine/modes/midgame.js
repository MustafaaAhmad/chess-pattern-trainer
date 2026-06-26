var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  function MidgameMode(puzzle) {
    this.puzzle = puzzle;
    this.chess = new Chess();
    this.attempted = false;
    this.correct = null;
    this.skipped = false;
  }

  MidgameMode.prototype.setup = function () {
    this.chess.load(this.puzzle.fen);
    this.attempted = false;
    this.correct = null;
    this.skipped = false;
  };

  MidgameMode.prototype.submitMove = function (from, to, promotion) {
    if (this.attempted) return { valid: false, reason: 'already-answered' };

    try {
      var result = this.chess.move({ from: from, to: to, promotion: promotion || 'q' });
      if (!result) return { valid: false, reason: 'illegal' };

      this.attempted = true;
      var userSan = result.san;
      var isCorrect = false;

      this.puzzle.moves.forEach(function (m) {
        if (m === userSan) isCorrect = true;
      });

      this.correct = isCorrect;
      this.chess.undo();

      return { valid: true, correct: isCorrect, userSan: userSan, expected: this.puzzle.moves[0] };
    } catch (e) {
      return { valid: false, reason: 'error' };
    }
  };

  MidgameMode.prototype.skip = function () {
    if (this.attempted) return null;
    this.attempted = true;
    this.skipped = true;
    this.correct = false;
    return this.puzzle.moves[0];
  };

  MidgameMode.prototype.getBoardForRender = function () {
    var chessBoard = this.chess.board();
    var result = [];
    for (var r = 0; r < 8; r++) {
      result[r] = [];
      for (var c = 0; c < 8; c++) {
        var piece = chessBoard[r][c];
        if (piece) {
          var fenChar = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
          result[r][c] = { type: piece.type.toUpperCase(), color: piece.color, fenChar: fenChar };
        } else {
          result[r][c] = null;
        }
      }
    }
    return result;
  };

  MidgameMode.prototype.getLegalMoves = function (square) {
    var moves = this.chess.moves({ square: square, verbose: true });
    return moves.map(function (m) { return m.to; });
  };

  ns.Modes = ns.Modes || {};
  ns.Modes.Midgame = MidgameMode;

})(ChessTrainer);
