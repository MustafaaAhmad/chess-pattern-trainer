var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  function showModal(html) {
    var existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'modal modal-overlay';
    overlay.innerHTML = '<div class="modal-content">' +
      '<span class="modal-close">&times;</span>' +
      html +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
    return overlay;
  }

  function showToast(message, type) {
    type = type || 'info';
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      padding: '10px 20px', borderRadius: '8px', background: type === 'error' ? 'var(--color-error)' : 'var(--color-primary)',
      color: '#fff', fontWeight: '600', zIndex: '300', fontSize: '0.9rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'opacity 0.3s'
    });
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 300);
    }, 2000);
  }

  function createInput(labelText, placeholder) {
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';

    if (labelText) {
      var label = document.createElement('label');
      label.textContent = labelText;
      label.style.cssText = 'font-size:0.85rem;color:var(--color-text-secondary);';
      wrapper.appendChild(label);
    }

    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder || 'e.g. e4';
    input.className = 'recall-input';
    wrapper.appendChild(input);

    return { wrapper: wrapper, input: input };
  }

  function squareButtons(onSelect) {
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:grid;grid-template-columns:repeat(8,36px);gap:2px;';

    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var btn = document.createElement('button');
        var sq = String.fromCharCode(97 + c) + (8 - r);
        btn.textContent = sq;
        btn.className = 'btn btn-small';
        btn.dataset.square = sq;
        btn.style.cssText = 'padding:4px;font-size:0.7rem;min-width:36px;';
        btn.addEventListener('click', function () {
          if (onSelect) onSelect(this.dataset.square);
        });
        wrapper.appendChild(btn);
      }
    }
    return wrapper;
  }

  function pieceButtons(onSelect) {
    var pieces = [
      { char: 'K', label: 'White King' },
      { char: 'Q', label: 'White Queen' },
      { char: 'R', label: 'White Rook' },
      { char: 'B', label: 'White Bishop' },
      { char: 'N', label: 'White Knight' },
      { char: 'P', label: 'White Pawn' },
      { char: 'k', label: 'Black King' },
      { char: 'q', label: 'Black Queen' },
      { char: 'r', label: 'Black Rook' },
      { char: 'b', label: 'Black Bishop' },
      { char: 'n', label: 'Black Knight' },
      { char: 'p', label: 'Black Pawn' }
    ];

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-width:400px;';

    pieces.forEach(function (p) {
      var btn = document.createElement('button');
      btn.innerHTML = ns.Renderer.pieceSVG(p.char, 30);
      btn.className = 'btn btn-small';
      btn.dataset.fenChar = p.char;
      btn.dataset.label = p.label;
      btn.style.cssText = 'padding:4px;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;';
      btn.title = p.label;
      btn.addEventListener('click', function () {
        if (onSelect) onSelect(this.dataset.fenChar, this.dataset.label);
      });
      wrapper.appendChild(btn);
    });
    return wrapper;
  }

  function buildStatsHTML(stats) {
    var html = '<div class="stat-card">';
    html += '<h3>Overall</h3>';
    html += '<div class="stat-row"><span>Positions Studied</span><span class="stat-value">' + (stats.totalPositions || 0) + '</span></div>';
    html += '<div class="stat-row"><span>Overall Accuracy</span><span class="stat-value">' + Math.round(stats.overallAccuracy || 0) + '%</span></div>';
    html += '<div class="stat-row"><span>Current Streak</span><span class="stat-value">' + (stats.streak || 0) + '</span></div>';
    html += '<div class="stat-row"><span>Best Streak</span><span class="stat-value">' + (stats.bestStreak || 0) + '</span></div>';
    html += '</div>';

    if (stats.byType) {
      html += '<div class="stat-card"><h3>By Question Type</h3>';
      for (var type in stats.byType) {
        var t = stats.byType[type];
        html += '<div class="stat-row"><span>' + type + '</span><span class="stat-value">' + Math.round(t.accuracy || 0) + '% (' + (t.correct || 0) + '/' + (t.total || 0) + ')</span></div>';
      }
      html += '</div>';
    }

    if (stats.trend && stats.trend.length > 0) {
      html += '<div class="stat-card"><h3>Improvement Trend</h3><div class="stat-trend">';
      var maxVal = Math.max.apply(null, stats.trend);
      stats.trend.forEach(function (val) {
        var h = Math.max(4, (val / (maxVal || 100)) * 56);
        html += '<div class="trend-bar" style="height:' + h + 'px" title="' + Math.round(val) + '%"></div>';
      });
      html += '</div></div>';
    }

    html += '<div class="stat-card"><h3>By Mode</h3>';
    if (stats.byMode) {
      for (var mode in stats.byMode) {
        var m = stats.byMode[mode];
        html += '<div class="stat-row"><span>' + mode + '</span><span class="stat-value">' + Math.round(m.accuracy || 0) + '% (' + (m.positionsStudied || 0) + ' studied)</span></div>';
      }
    } else {
      html += '<div class="stat-row"><span>No mode data yet</span></div>';
    }
    html += '</div>';

    return html;
  }

  ns.Components = {
    showModal: showModal,
    showToast: showToast,
    createInput: createInput,
    squareButtons: squareButtons,
    pieceButtons: pieceButtons,
    buildStatsHTML: buildStatsHTML
  };

})(ChessTrainer);
