var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var PIECE_UNICODE = {
    'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659',
    'k': '\u265A', 'q': '\u265B', 'r': '\u265C', 'b': '\u265D', 'n': '\u265E', 'p': '\u265F'
  };

  var PIECE_NAMES = {
    'K': 'White King', 'Q': 'White Queen', 'R': 'White Rook', 'B': 'White Bishop', 'N': 'White Knight', 'P': 'White Pawn',
    'k': 'Black King', 'q': 'Black Queen', 'r': 'Black Rook', 'b': 'Black Bishop', 'n': 'Black Knight', 'p': 'Black Pawn'
  };

  var PIECE_SHORT = {
    'K': 'K', 'Q': 'Q', 'R': 'R', 'B': 'B', 'N': 'N', 'P': 'P',
    'k': 'k', 'q': 'q', 'r': 'r', 'b': 'b', 'n': 'n', 'p': 'p'
  };

  function parseFEN(fen) {
    var parts = fen.trim().split(/\s+/);
    var boardStr = parts[0];
    var turn = parts[1] || 'w';
    var castling = parts[2] || '-';
    var enPassant = parts[3] || '-';
    var halfmove = parseInt(parts[4], 10) || 0;
    var fullmove = parseInt(parts[5], 10) || 1;

    var rows = boardStr.split('/');
    if (rows.length !== 8) return null;

    var board = [];
    var fenIndex = 0;

    for (var r = 0; r < 8; r++) {
      board[r] = [];
      var col = 0;
      for (var i = 0; i < rows[r].length; i++) {
        var ch = rows[r][i];
        if (ch >= '1' && ch <= '8') {
          var empty = parseInt(ch, 10);
          for (var e = 0; e < empty; e++) {
            board[r][col + e] = null;
          }
          col += empty;
        } else if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
          board[r][col] = {
            type: ch.toUpperCase(),
            color: ch === ch.toUpperCase() ? 'w' : 'b',
            fenChar: ch,
            unicode: PIECE_UNICODE[ch] || '?',
            name: PIECE_NAMES[ch] || '?',
            short: PIECE_SHORT[ch] || '?'
          };
          col++;
        }
      }
      fenIndex++;
    }

    return {
      board: board,
      turn: turn,
      castling: castling,
      enPassant: enPassant,
      halfmove: halfmove,
      fullmove: fullmove,
      fen: fen
    };
  }

  function toFEN(board) {
    var rows = [];
    for (var r = 0; r < 8; r++) {
      var row = '';
      var emptyCount = 0;
      for (var c = 0; c < 8; c++) {
        var piece = board[r][c];
        if (piece) {
          if (emptyCount > 0) { row += emptyCount; emptyCount = 0; }
          row += piece.fenChar;
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) row += emptyCount;
      rows.push(row);
    }
    return rows.join('/');
  }

  function isLightSquare(rank, file) {
    return (rank + file) % 2 === 0;
  }

  function squareToAlgebraic(rank, file) {
    return String.fromCharCode(97 + file) + (8 - rank);
  }

  function algebraicToSquare(sq) {
    if (!sq || sq.length < 2) return null;
    var file = sq.charCodeAt(0) - 97;
    var rank = 8 - parseInt(sq[1], 10);
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return { rank: rank, file: file };
  }

  function countPieces(board, color, type) {
    var count = 0;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = board[r][c];
        if (p && p.color === color && (!type || p.type === type)) count++;
      }
    }
    return count;
  }

  function getAllPieces(board) {
    var pieces = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = board[r][c];
        if (p) {
          pieces.push({
            piece: p,
            rank: r,
            file: c,
            square: squareToAlgebraic(r, c)
          });
        }
      }
    }
    return pieces;
  }

  function findPieces(board, color, type) {
    return getAllPieces(board).filter(function (p) {
      return p.piece.color === color && p.piece.type === type;
    });
  }

  function cloneBoard(board) {
    var b = [];
    for (var r = 0; r < 8; r++) {
      b[r] = [];
      for (var c = 0; c < 8; c++) {
        b[r][c] = board[r][c] ? {
          type: board[r][c].type,
          color: board[r][c].color,
          fenChar: board[r][c].fenChar,
          unicode: board[r][c].unicode,
          name: board[r][c].name,
          short: board[r][c].short
        } : null;
      }
    }
    return b;
  }

  function fenToBoardArray(fen) {
    var result = parseFEN(fen);
    return result ? result.board : null;
  }

  ns.FEN = {
    parse: parseFEN,
    toFEN: toFEN,
    isLightSquare: isLightSquare,
    squareToAlgebraic: squareToAlgebraic,
    algebraicToSquare: algebraicToSquare,
    countPieces: countPieces,
    getAllPieces: getAllPieces,
    findPieces: findPieces,
    cloneBoard: cloneBoard,
    fenToBoardArray: fenToBoardArray,
    PIECE_UNICODE: PIECE_UNICODE,
    PIECE_NAMES: PIECE_NAMES,
    PIECE_SHORT: PIECE_SHORT
  };

})(ChessTrainer);
