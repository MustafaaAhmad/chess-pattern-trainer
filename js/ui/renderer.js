var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  var SVG_PATHS = {
    K: 'M 22.5,11.63 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 M 11.5,37 C 11.5,37 15.5,33 18,33 C 18,33 21,35 22.5,35 C 24,35 27,33 27,33 C 29.5,33 33.5,37 33.5,37 M 12,35 L 33,35 M 13,33 L 32,33 M 14,31 L 31,31 M 15.5,29 L 29.5,29 M 20.5,27 L 24.5,27',
    Q: 'M 22.5,10 C 22.5,10 22.5,7.5 22.5,5 C 22.5,7.5 22.5,10 22.5,10 M 18,8.5 L 20,12 M 27,8.5 L 25,12 M 14.5,11 L 16,14.5 M 30.5,11 L 29,14.5 M 12,18 L 14.5,16 M 33,18 L 30.5,16 M 11,26 C 11,26 14,22.5 17,22.5 C 17,22.5 19.5,25 22.5,25 C 25.5,25 28,22.5 28,22.5 C 31,22.5 34,26 34,26 M 11,30 C 11,30 15.5,26 18,26 C 18,26 21,28 22.5,28 C 24,28 27,26 27,26 C 29.5,26 34,30 34,30 M 12,34 L 33,34 M 13,36 L 32,36 M 14,38 L 31,38 M 15.5,40 L 29.5,40',
    R: 'M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 M 12,36 L 12,32 L 33,32 L 33,36 M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 M 34,14 L 31,17 L 14,17 L 11,14 M 14,17 L 14,32 L 31,32 L 31,17',
    B: 'M 22.5,9 C 22.5,9 22.5,6 22.5,4 C 22.5,6 22.5,9 22.5,9 M 22.5,9 C 25,9 28,18 25,22 C 22,26 19,22 22.5,22 C 26,22 23,26 20,22 C 17,18 20,9 22.5,9 M 15,33 C 15,33 18,29 22.5,29 C 27,29 30,33 30,33 M 13,36 L 32,36 M 11,39 L 34,39',
    N: 'M 22,10 C 22,10 21.5,8 23,8 C 24.5,8 24.5,9 25,9 C 25.5,9 25,10.5 25,10.5 S 27.5,8.5 29,10 C 30.5,11.5 30,14 30,14 S 32,12 33,13 C 34,14 35,18 33,21 C 31,24 27.5,25.5 24,26 C 20.5,26.5 18.5,25 17,24 C 15.5,23 14,21 14,19 C 14,17 15,15 16,15 C 17,15 17.5,16.5 18,17 C 18.5,18 19,19 20,19 C 21,19 21.5,17 21,16 C 20.5,15 17,12 16,9 C 15,6 15,5 15,4 C 15,4 12,6 11,8 C 10,10 9,13 9,13 M 12,28 C 12,28 15,25 22,25 C 29,25 33,28 33,28 M 11,32 L 34,32 M 20.5,31 L 20.5,34.5 M 24.5,31 L 24.5,34.5 M 23,34 C 23,34 22,36 22.5,37 C 23,38 24,39 23.5,40 L 21.5,40 C 21,39 22,38 22.5,37 C 23,36 23,34 23,34',
    P: 'M 22.5,9 C 22.5,9 22.5,7.5 22.5,6 C 22.5,7.5 22.5,9 22.5,9 M 22.5,9 C 23.5,9 25,10 25,12 C 25,14 23.5,15 22.5,15 C 21.5,15 20,14 20,12 C 20,10 21.5,9 22.5,9 M 17,19 C 17,19 19.5,16 22.5,16 C 25.5,16 28,19 28,19 C 28,19 30,22 30,27 C 30,32 27,34 22.5,34 C 18,34 15,32 15,27 C 15,22 17,19 17,19 M 12,39 L 33,39 M 13,37 L 32,37'
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
