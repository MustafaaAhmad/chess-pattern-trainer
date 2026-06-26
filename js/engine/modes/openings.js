var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  function OpeningsMode(openingCategory, line) {
    this.categoryName = openingCategory.name;
    this.categoryId = openingCategory.id;
    this.lineName = line.name;
    this.playAs = line.playAs;
    this.moves = line.moves;
    this.totalMoves = Math.ceil(this.moves.length / 2);

    this.chess = new Chess();
    this.moveIndex = 0;
    this.correctCount = 0;
    this.totalAttempts = 0;
    this.history = [];
    this.feedback = null;
    this.completed = false;
    this.errorCount = 0;
  }

  OpeningsMode.prototype.setup = function () {
    this.chess.reset();
    this.moveIndex = 0;
    this.correctCount = 0;
    this.totalAttempts = 0;
    this.history = [];
    this.feedback = null;
    this.completed = false;
    this.errorCount = 0;

    var firstUserIndex = this.playAs === 'white' ? 0 : 1;

    while (this.moveIndex < firstUserIndex && this.moveIndex < this.moves.length) {
      this._playMove(this.moves[this.moveIndex], false);
      this.moveIndex++;
    }
  };

  OpeningsMode.prototype._playMove = function (san, isUser) {
    try {
      var result = this.chess.move(san);
      if (result) {
        this.history.push({
          san: result.san,
          isUser: isUser,
          correct: isUser ? true : null,
          from: result.from,
          to: result.to
        });
        return result;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  OpeningsMode.prototype.isUserTurn = function () {
    if (this.completed) return false;
    if (this.moveIndex >= this.moves.length) {
      this.completed = true;
      return false;
    }
    return this.playAs === 'white'
      ? this.moveIndex % 2 === 0
      : this.moveIndex % 2 === 1;
  };

  OpeningsMode.prototype.getExpectedMove = function () {
    if (this.moveIndex >= this.moves.length) return null;
    return this.moves[this.moveIndex];
  };

  OpeningsMode.prototype.submitMove = function (from, to, promotion) {
    if (!this.isUserTurn()) return { valid: false, reason: 'not-your-turn' };

    var expected = this.getExpectedMove();
    if (!expected) return { valid: false, reason: 'no-moves' };

    try {
      var result = this.chess.move({ from: from, to: to, promotion: promotion || 'q' });
      if (!result) return { valid: false, reason: 'illegal' };

      this.totalAttempts++;

      var userSan = result.san;
      if (userSan === expected) {
        this.correctCount++;
        this.history.push({ san: result.san, isUser: true, correct: true, from: from, to: to });
        this.moveIndex++;

        if (this.moveIndex < this.moves.length) {
          var oppResult = this._playMove(this.moves[this.moveIndex], false);
          if (oppResult) {
            this.moveIndex++;
          }
        }

        if (this.moveIndex >= this.moves.length) {
          this.completed = true;
        }

        this.feedback = { type: 'correct', message: 'Correct!' };
        return { valid: true, correct: true, userSan: userSan, expected: expected };
      } else {
        this.chess.undo();
        this.history.push({ san: userSan, isUser: true, correct: false, from: from, to: to });
        this.errorCount++;
        this.feedback = {
          type: 'wrong',
          message: 'Expected: ' + expected + ', you played: ' + userSan,
          expected: expected
        };
        return { valid: true, correct: false, userSan: userSan, expected: expected };
      }
    } catch (e) {
      return { valid: false, reason: 'error' };
    }
  };

  OpeningsMode.prototype.skip = function () {
    if (!this.isUserTurn() || this.completed) return null;

    var expected = this.getExpectedMove();
    this.totalAttempts++;

    this._playMove(expected, true);
    this.moveIndex++;

    if (this.moveIndex < this.moves.length) {
      var oppResult = this._playMove(this.moves[this.moveIndex], false);
      if (oppResult) this.moveIndex++;
    }

    if (this.moveIndex >= this.moves.length) {
      this.completed = true;
    }

    this.feedback = { type: 'skipped', message: 'Skipped. Move: ' + expected };
    return expected;
  };

  OpeningsMode.prototype.getBoardForRender = function () {
    var chessBoard = this.chess.board();
    var result = [];
    for (var r = 0; r < 8; r++) {
      result[r] = [];
      for (var c = 0; c < 8; c++) {
        var piece = chessBoard[r][c];
        if (piece) {
          var fenChar = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
          result[r][c] = {
            type: piece.type.toUpperCase(),
            color: piece.color,
            fenChar: fenChar
          };
        } else {
          result[r][c] = null;
        }
      }
    }
    return result;
  };

  OpeningsMode.prototype.getLegalMoves = function (square) {
    var moves = this.chess.moves({ square: square, verbose: true });
    return moves.map(function (m) { return m.to; });
  };

  OpeningsMode.prototype.getCurrentTurn = function () {
    return this.isUserTurn() ? 'user' : 'opponent';
  };

  OpeningsMode.prototype.getScore = function () {
    var total = this.totalMoves;
    var correct = this.correctCount;
    return {
      correct: correct,
      total: total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      attempts: this.totalAttempts,
      errors: this.errorCount
    };
  };

  OpeningsMode.prototype.getStatus = function () {
    var turn = this.chess.turn();
    var turnName = turn === 'w' ? 'White' : 'Black';
    if (this.completed) return 'Complete!';
    if (this.isUserTurn()) return 'Your turn (' + turnName + ' to move)';
    return 'Waiting...';
  };

  ns.Modes = ns.Modes || {};
  ns.Modes.Openings = OpeningsMode;

})(ChessTrainer);
