var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  function diffBoards(original, reconstructed) {
    var diff = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var orig = original[r][c];
        var recon = reconstructed[r][c];
        var sq = FEN.squareToAlgebraic(r, c);

        if (orig && recon) {
          if (orig.type !== recon.type || orig.color !== recon.color) {
            diff.push({ square: sq, rank: r, file: c, type: 'wrong-piece', expected: orig, got: recon });
          }
        } else if (orig && !recon) {
          diff.push({ square: sq, rank: r, file: c, type: 'missing', expected: orig, got: null });
        } else if (!orig && recon) {
          diff.push({ square: sq, rank: r, file: c, type: 'extra', expected: null, got: recon });
        }
      }
    }
    return diff;
  }

  function getHighlightClassForDiff(diffType) {
    switch (diffType) {
      case 'wrong-piece': return 'highlight-incorrect';
      case 'missing': return 'highlight-missing';
      case 'extra': return 'highlight-incorrect';
      default: return '';
    }
  }

  function comparePositions(posA, posB) {
    var changes = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var a = posA[r][c];
        var b = posB[r][c];
        var sq = FEN.squareToAlgebraic(r, c);
        if ((a && !b) || (!a && b) || (a && b && (a.type !== b.type || a.color !== b.color))) {
          changes.push({
            square: sq,
            rank: r,
            file: c,
            from: a,
            to: b
          });
        }
      }
    }
    return changes;
  }

  function isSquareAttacked(board, rank, file, byColor) {
    var piece = board[rank][file];
    if (piece && piece.color === byColor) return false;

    var d, r, c;

    for (d = -1; d <= 1; d += 2) {
      for (r = -1; r <= 1; r += 2) {
        var kr = rank + r;
        var kf = file + d;
        if (kr >= 0 && kr < 8 && kf >= 0 && kf < 8) {
          var kp = board[kr][kf];
          if (kp && kp.color === byColor && kp.type === 'N') return true;
        }
      }
    }

    var knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (var ni = 0; ni < knightMoves.length; ni++) {
      var nr = rank + knightMoves[ni][0];
      var nf = file + knightMoves[ni][1];
      if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
        var np = board[nr][nf];
        if (np && np.color === byColor && np.type === 'N') return true;
      }
    }

    var directions = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (var di = 0; di < directions.length; di++) {
      for (var step = 1; step < 8; step++) {
        var dr = rank + directions[di][0] * step;
        var df = file + directions[di][1] * step;
        if (dr < 0 || dr >= 8 || df < 0 || df >= 8) break;
        var bp = board[dr][df];
        if (bp) {
          if (bp.color === byColor && (bp.type === 'B' || bp.type === 'Q')) return true;
          break;
        }
      }
    }

    var straight = [[-1,0],[1,0],[0,-1],[0,1]];
    for (var si = 0; si < straight.length; si++) {
      for (var sstep = 1; sstep < 8; sstep++) {
        var sr = rank + straight[si][0] * sstep;
        var sf = file + straight[si][1] * sstep;
        if (sr < 0 || sr >= 8 || sf < 0 || sf >= 8) break;
        var sp = board[sr][sf];
        if (sp) {
          if (sp.color === byColor && (sp.type === 'R' || sp.type === 'Q')) return true;
          break;
        }
      }
    }

    var pawnDir = byColor === 'w' ? -1 : 1;
    var pr = rank + pawnDir;
    if (pr >= 0 && pr < 8) {
      if (file - 1 >= 0) {
        var pp = board[pr][file - 1];
        if (pp && pp.color === byColor && pp.type === 'P') return true;
      }
      if (file + 1 < 8) {
        var pp2 = board[pr][file + 1];
        if (pp2 && pp2.color === byColor && pp2.type === 'P') return true;
      }
    }

    return false;
  }

  ns.Board = {
    diff: diffBoards,
    getHighlightClassForDiff: getHighlightClassForDiff,
    compare: comparePositions,
    isSquareAttacked: isSquareAttacked
  };

})(ChessTrainer);
