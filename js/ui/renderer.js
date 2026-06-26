var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  var SVG_PATHS = {
    K: 'M22.5 11.63V8.5h-4v3.13H15.4l1.18 4.64a11.5 11.5 0 00-6.08 9.23A11.5 11.5 0 0022 36.88a11.5 11.5 0 0011.5-11.5 11.5 11.5 0 00-6.08-9.23l1.18-4.64h-3.1zM22.5 15.5A8.5 8.5 0 1131 24a8.5 8.5 0 01-8.5 8.5A8.5 8.5 0 0114 24a8.5 8.5 0 018.5-8.5z',
    Q: 'M22.5 8.5a4 4 0 100 8 4 4 0 000-8zm-7 5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm14 0a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm-7 2a2 2 0 100 4 2 2 0 000-4zm-5 7a5.5 5.5 0 000 11h10a5.5 5.5 0 000-11z',
    R: 'M15 8.5v5h4v-5h4v5h4v-5h4v7.5l-2.5 4h-11l-2.5-4V8.5zM12 20v12h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2V20z',
    B: 'M22.5 8.5a4 4 0 100 8 4 4 0 000-8zm-3 9a4 4 0 000 8 4 4 0 000-8zm6 0a4 4 0 000 8 4 4 0 000-8zm-3 7a5 5 0 000 10 5 5 0 000-10z',
    N: 'M22.5 8.5c-3 0-5.5 2-5.5 5s1 3 1.5 3l-2 13c0 3 2 5 4 5l8-1c2-1 3-3 2-5l-3-3-1-7s-1-4-4-5z',
    P: 'M22.5 9a4 4 0 100 8 4 4 0 000-8zm-3 9a3 3 0 100 6 3 3 0 000-6zm6 0a3 3 0 100 6 3 3 0 000-6zm-3 5a5 5 0 100 10 5 5 0 000-10z'
  };

  var PIECE_COLORS = { w: '#fff', b: '#1a1a1a' };
  var PIECE_STROKES = { w: '#1a1a1a', b: '#fff' };

  function pieceSVG(fenChar, size) {
    var type = fenChar.toUpperCase();
    var color = fenChar === fenChar.toUpperCase() ? 'w' : 'b';
    var path = SVG_PATHS[type];
    if (!path) return '';
    var s = size || 45;
    return '<svg viewBox="0 0 45 45" width="' + s + '" height="' + s + '" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + path + '" fill="' + PIECE_COLORS[color] + '" stroke="' + PIECE_STROKES[color] + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function createBoardElement(board, options) {
    options = options || {};
    var container = document.createElement('div');
    container.className = 'chess-board';

    var showPieces = options.showPieces !== undefined ? options.showPieces : true;
    var showCoords = options.showCoords !== undefined ? options.showCoords : true;
    var highlights = options.highlights || {};
    var clickHandler = options.onSquareClick || null;
    var interactive = options.interactive || false;
    var emptyBoard = options.emptyBoard || false;

    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var sq = document.createElement('div');
        var isLight = (r + c) % 2 === 0;
        sq.className = 'square ' + (isLight ? 'square-light' : 'square-dark');

        var sqName = FEN.squareToAlgebraic(r, c);

        if (highlights[sqName]) {
          sq.classList.add(highlights[sqName]);
        }

        if (interactive) {
          sq.classList.add('clickable');
          sq.dataset.rank = r;
          sq.dataset.file = c;
          sq.dataset.square = sqName;
          if (clickHandler) {
            sq.addEventListener('click', function (ev) {
              var target = ev.currentTarget;
              clickHandler({
                rank: parseInt(target.dataset.rank, 10),
                file: parseInt(target.dataset.file, 10),
                square: target.dataset.square,
                el: target
              });
            });
          }
        }

        if (showPieces && !emptyBoard && board && board[r] && board[r][c]) {
          sq.innerHTML = pieceSVG(board[r][c].fenChar);
        }

        if (showCoords) {
          if (c === 7) {
            var rankLabel = document.createElement('span');
            rankLabel.className = 'coord coord-rank';
            rankLabel.textContent = 8 - r;
            sq.appendChild(rankLabel);
          }
          if (r === 7) {
            var fileLabel = document.createElement('span');
            fileLabel.className = 'coord coord-file';
            fileLabel.textContent = String.fromCharCode(97 + c);
            sq.appendChild(fileLabel);
          }
        }

        container.appendChild(sq);
      }
    }
    return container;
  }

  function createPalettePiece(fenChar) {
    var el = document.createElement('div');
    el.className = 'palette-piece';
    el.dataset.fenChar = fenChar;
    el.innerHTML = pieceSVG(fenChar, 35);
    return el;
  }

  function clearBoard(containerEl) {
    while (containerEl.firstChild) {
      containerEl.removeChild(containerEl.firstChild);
    }
  }

  function renderBoard(containerEl, board, options) {
    clearBoard(containerEl);
    var boardEl = createBoardElement(board, options);
    containerEl.appendChild(boardEl);
  }

  function renderEmptyBoard(containerEl, options) {
    clearBoard(containerEl);
    var opts = options || {};
    opts.showPieces = false;
    opts.emptyBoard = true;
    var boardEl = createBoardElement(null, opts);
    containerEl.appendChild(boardEl);
  }

  ns.Renderer = {
    pieceSVG: pieceSVG,
    createBoardElement: createBoardElement,
    createPalettePiece: createPalettePiece,
    renderBoard: renderBoard,
    renderEmptyBoard: renderEmptyBoard,
    clearBoard: clearBoard,
    SVG_PATHS: SVG_PATHS
  };

})(ChessTrainer);
