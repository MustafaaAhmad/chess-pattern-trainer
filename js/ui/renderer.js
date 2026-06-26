var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;

  var PIECE_BASE = 'assets/pieces/';

  function pieceSVG(fenChar, size) {
    var color = fenChar === fenChar.toUpperCase() ? 'w' : 'b';
    var type = fenChar.toLowerCase();
    var src = PIECE_BASE + color + type + '.png';
    var s = size || 45;
    return '<img src="' + src + '" width="' + s + '" height="' + s + '" alt="' + (fenChar) + '" style="pointer-events:none">';
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
    clearBoard: clearBoard
  };

})(ChessTrainer);
