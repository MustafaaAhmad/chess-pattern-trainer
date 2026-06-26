var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var FEN = ns.FEN;
  var Renderer = ns.Renderer;
  var Timer = ns.Timer;
  var Storage = ns.Storage;
  var Scoring = ns.Scoring;
  var Spaced = ns.Spaced;
  var Daily = ns.Daily;
  var Components = ns.Components;

  var STATE = {
    MENU: 'menu',
    STUDY: 'study',
    RECALL: 'recall',
    RESULTS: 'results',
    RECONSTRUCT: 'reconstruct',
    STATS: 'stats',
    REVIEW: 'review'
  };

  function App() {
    this.positions = [];
    this.state = STATE.MENU;
    this.currentMode = null;
    this.modeInstance = null;
    this.currentPosition = null;
    this.currentPositionIndex = -1;
    this.studyTimer = new Timer(document.getElementById('study-timer'));
    this.recallTimer = new Timer(document.getElementById('recall-timer'));
    this.reconstructTimer = new Timer(document.getElementById('reconstruct-timer'));
    this.missingTimer = new Timer(document.getElementById('missing-timer'));
    this.blindfoldTimer = new Timer(document.getElementById('blindfold-timer'));
    this.selectedPalettePiece = null;
    this.reconstructHighlights = {};
    this.isDailyChallenge = false;

    this.openingsData = null;
    this.selectedOpeningsSquare = null;
    this.openingsLegalMoves = [];

    var self = this;
    this.modeConfig = {
      recall: {
        name: 'Position Recall',
        studyTime: 15,
        recallTime: 0,
        ModeClass: ns.Modes.Recall,
        screens: ['study', 'recall', 'results']
      },
      reconstruct: {
        name: 'Board Reconstruction',
        studyTime: 20,
        recallTime: 0,
        ModeClass: ns.Modes.Reconstruct,
        screens: ['study', 'reconstruct', 'results']
      },
      missing: {
        name: 'Missing Piece',
        studyTime: 15,
        recallTime: 0,
        ModeClass: ns.Modes.Missing,
        screens: ['study', 'recall', 'results']
      },
      blindfold: {
        name: 'Blindfold Trainer',
        studyTime: 15,
        recallTime: 0,
        ModeClass: ns.Modes.Blindfold,
        screens: ['study', 'recall', 'results']
      },
      openings: {
        name: 'Openings Trainer',
        studyTime: 0,
        recallTime: 0,
        ModeClass: ns.Modes.Openings,
        screens: ['openings', 'results']
      }
    };
  }

  App.prototype.init = function () {
    var self = this;
    ns.Theme.init();
    this.bindEvents();
    this.loadPositions();
    this.loadOpenings();

    document.getElementById('shortcuts-hint').addEventListener('click', function () {
      document.getElementById('shortcuts-modal').classList.remove('hidden');
    });
    document.querySelector('#shortcuts-modal .modal-close').addEventListener('click', function () {
      document.getElementById('shortcuts-modal').classList.add('hidden');
    });
    document.getElementById('shortcuts-modal').addEventListener('click', function (e) {
      if (e.target === this) this.classList.add('hidden');
    });

    this.updateStreakDisplay();

    self.showScreen(STATE.MENU);
  };

  App.prototype.loadPositions = function () {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/positions.json', true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          self.positions = data.positions || data || [];
        } catch (e) {
          self.positions = [];
        }
      }
    };
    xhr.onerror = function () {
      self.positions = [];
    };
    xhr.send();
  };

  App.prototype.loadOpenings = function () {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/openings.json', true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          self.openingsData = data.openings || data || [];
        } catch (e) {
          self.openingsData = [];
        }
      }
    };
    xhr.onerror = function () {
      self.openingsData = [];
    };
    xhr.send();
  };

  App.prototype.bindEvents = function () {
    var self = this;

    document.querySelectorAll('.mode-card').forEach(function (card) {
      card.addEventListener('click', function () {
        self.selectMode(this.dataset.mode);
      });
    });

    document.getElementById('btn-daily').addEventListener('click', function () {
      self.startDailyChallenge();
    });

    document.getElementById('btn-review').addEventListener('click', function () {
      self.showReviewScreen();
    });

    document.getElementById('btn-stats').addEventListener('click', function () {
      self.showStatsScreen();
    });

    document.getElementById('btn-stats-back').addEventListener('click', function () {
      self.showScreen(STATE.MENU);
    });

    document.querySelector('.logo').addEventListener('click', function () {
      self.showScreen(STATE.MENU);
    });
    document.querySelector('.logo').style.cursor = 'pointer';

    document.getElementById('btn-review-back').addEventListener('click', function () {
      self.showScreen(STATE.MENU);
    });

    document.getElementById('btn-study-skip').addEventListener('click', function () {
      self.onStudyEnd();
    });

    document.getElementById('btn-recall-submit').addEventListener('click', function () {
      self.onRecallSubmit();
    });

    document.getElementById('btn-recall-next').addEventListener('click', function () {
      self.onRecallNext();
    });

    document.getElementById('btn-results-next').addEventListener('click', function () {
      self.nextPosition();
    });

    document.getElementById('btn-results-menu').addEventListener('click', function () {
      self.showScreen(STATE.MENU);
    });

    document.getElementById('btn-results-review').addEventListener('click', function () {
      self.reviewCurrentPosition();
    });

    document.getElementById('btn-reconstruct-submit').addEventListener('click', function () {
      self.onReconstructSubmit();
    });

    document.getElementById('btn-reconstruct-clear').addEventListener('click', function () {
      self.onReconstructClear();
    });

    document.getElementById('btn-missing-submit').addEventListener('click', function () {
      self.onMissingSubmit();
    });

    document.getElementById('btn-blindfold-submit').addEventListener('click', function () {
      self.onBlindfoldSubmit();
    });

    document.getElementById('btn-openings-back').addEventListener('click', function () {
      self.showScreen(STATE.MENU);
    });
    document.getElementById('btn-openings-back-play').addEventListener('click', function () {
      self.showScreen(STATE.MENU);
    });
    document.getElementById('btn-openings-hint').addEventListener('click', function () {
      self.onOpeningsHint();
    });
    document.getElementById('difficulty-select').addEventListener('change', function () {
      var settings = Storage.getSettings();
      settings.difficulty = this.value;
      Storage.saveSettings(settings);
    });

    var recallInput = document.querySelector('#recall-input-area input');
    if (recallInput) {
      recallInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.onRecallSubmit();
      });
    }

    document.addEventListener('keydown', function (e) {
      self.onKeyDown(e);
    });
  };

  App.prototype.onKeyDown = function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key) {
      case '1': this.selectMode('recall'); break;
      case '2': this.selectMode('reconstruct'); break;
      case '3': this.selectMode('missing'); break;
      case '4': this.selectMode('blindfold'); break;
      case '5': this.selectMode('openings'); break;
      case 'd':
      case 'D':
        ns.Theme.toggle();
        break;
      case 'Escape':
        if (this.state !== STATE.MENU) this.showScreen(STATE.MENU);
        break;
      case 'r':
      case 'R':
        if (this.state === STATE.STUDY) this.onStudyEnd();
        break;
      case 'n':
      case 'N':
        if (this.state === STATE.RESULTS) this.nextPosition();
        break;
      case 'Enter':
        if (this.state === STATE.RECALL) {
          var submitBtn = document.getElementById('btn-recall-submit');
          if (!submitBtn.classList.contains('hidden')) {
            this.onRecallSubmit();
          } else {
            this.onRecallNext();
          }
        }
        break;
    }
  };

  App.prototype.showScreen = function (screen) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('active');
    });
    this.state = screen;

    var el = document.getElementById('screen-' + screen);
    if (el) el.classList.add('active');
  };

  App.prototype.selectMode = function (modeId) {
    var self = this;
    this.currentMode = modeId;
    this.isDailyChallenge = false;

    if (modeId === 'openings') {
      this.showOpeningsList();
      return;
    }

    this.selectRandomPosition(function (pos) {
      if (!pos) {
        Components.showToast('No positions available. Check data/positions.json', 'error');
        return;
      }
      self.currentPosition = pos;
      self.startMode(modeId, pos);
    });
  };

  App.prototype.selectRandomPosition = function (callback) {
    if (this.positions.length === 0) {
      if (callback) callback(null);
      return;
    }
    var settings = Storage.getSettings();
    var diff = settings.difficulty;
    var candidates = this.positions.filter(function (p) {
      return p.difficulty === diff || !diff;
    });
    if (candidates.length === 0) candidates = this.positions;
    var idx = Math.floor(Math.random() * candidates.length);
    if (callback) callback(candidates[idx]);
  };

  App.prototype.selectPositionByIndex = function (index, callback) {
    if (index >= 0 && index < this.positions.length) {
      if (callback) callback(this.positions[index]);
    } else {
      this.selectRandomPosition(callback);
    }
  };

  App.prototype.startMode = function (modeId, position) {
    var config = this.modeConfig[modeId];
    if (!config) return;

    var self = this;
    var ModeClass = config.ModeClass;

    var options = {};
    if (modeId === 'blindfold') {
      options.level = parseInt(document.getElementById('difficulty-select').value === 'hard' ? 3 : 
        document.getElementById('difficulty-select').value === 'medium' ? 2 : 1, 10);
    }

    this.modeInstance = new ModeClass(position, options);
    this.currentPosition = position;

    if (modeId === 'reconstruct') {
      this.startReconstructStudy();
    } else if (modeId === 'missing') {
      this.startMissingStudy();
    } else if (modeId === 'blindfold') {
      this.startBlindfoldStudy();
    } else {
      this.startStudyPhase();
    }
  };

  App.prototype.startStudyPhase = function () {
    var self = this;
    var board = this.modeInstance.getPositionForStudy();
    var container = document.getElementById('study-board-container');

    document.getElementById('study-position-name').textContent = this.currentPosition.name || 'Position';

    Renderer.renderBoard(container, board, {
      showPieces: true,
      showCoords: true,
      emptyBoard: false,
      interactive: false
    });

    this.showScreen('study');
    this.studyTimer.reset();

    var studyTime = this.modeInstance.getStudyTime ? this.modeInstance.getStudyTime() : 15;
    this.studyTimer.start(studyTime, function () {
      self.onStudyEnd();
    });
  };

  App.prototype.onStudyEnd = function () {
    var self = this;
    this.studyTimer.stop();

    var modeId = this.currentMode;
    if (modeId === 'reconstruct') {
      this.startReconstructRecall();
    } else if (modeId === 'missing') {
      this.startMissingRecall();
    } else if (modeId === 'blindfold') {
      this.startBlindfoldRecall();
    } else {
      this.startRecallPhase();
    }
  };

  App.prototype.startRecallPhase = function () {
    var self = this;
    var modeInst = this.modeInstance;
    var container = document.getElementById('recall-board-container');

    Renderer.renderBoard(container, null, {
      showPieces: false,
      showCoords: true,
      emptyBoard: true,
      interactive: false
    });

    this.recallTimer.reset();
    this.showScreen('recall');
    this.showCurrentQuestion();
  };

  App.prototype.showCurrentQuestion = function () {
    var self = this;
    var modeInst = this.modeInstance;
    var q = modeInst.getCurrentQuestion();
    var total = modeInst.getQuestionCount();

    document.getElementById('recall-progress').textContent = (modeInst.currentIndex + 1) + ' / ' + total;
    document.getElementById('recall-question-text').textContent = q ? q.question : 'No more questions.';
    document.getElementById('btn-recall-submit').classList.remove('hidden');
    document.getElementById('btn-recall-next').classList.add('hidden');

    var inputArea = document.getElementById('recall-input-area');
    inputArea.innerHTML = '';

    if (q && (q.type === 'square-recall' || q.type === 'piece-identification')) {
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = q.type === 'square-recall' ? 'e.g. e4' : 'e.g. White Queen';
      input.className = 'recall-input';
      input.style.cssText = 'padding:10px 16px;border-radius:8px;border:2px solid rgba(0,0,0,0.2);background:var(--color-surface);color:var(--color-text);width:200px;text-align:center;font-size:1.1rem;';
      input.autofocus = true;
      inputArea.appendChild(input);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.onRecallSubmit();
      });
      setTimeout(function () { input.focus(); }, 100);
    } else if (q && q.type === 'boolean') {
      var yesBtn = document.createElement('button');
      yesBtn.textContent = 'Yes';
      yesBtn.className = 'btn btn-secondary';
      yesBtn.style.marginRight = '8px';
      yesBtn.addEventListener('click', function () { self.recallAnswerValue = 'yes'; self.onRecallSubmit(); });
      inputArea.appendChild(yesBtn);

      var noBtn = document.createElement('button');
      noBtn.textContent = 'No';
      noBtn.className = 'btn btn-secondary';
      noBtn.addEventListener('click', function () { self.recallAnswerValue = 'no'; self.onRecallSubmit(); });
      inputArea.appendChild(noBtn);
    }
  };

  App.prototype.onRecallSubmit = function () {
    var modeInst = this.modeInstance;
    var q = modeInst.getCurrentQuestion();
    if (!q) return;

    var answer;
    var input = document.querySelector('#recall-input-area input');
    if (input) {
      answer = input.value.trim();
    } else {
      answer = this.recallAnswerValue || '';
    }

    if (!answer) {
      Components.showToast('Please enter an answer', 'error');
      return;
    }

    if (input) input.value = '';
    this.recallAnswerValue = '';

    var result = modeInst.submitAnswer(answer);
    if (!result) return;

    var isCorrect = result.correct;
    var correctAnswer = result.correctAnswer;

    var questionTextEl = document.getElementById('recall-question-text');
    var feedback = document.createElement('div');
    feedback.style.cssText = 'text-align:center;margin-top:8px;font-weight:600;';
    feedback.style.color = isCorrect ? 'var(--color-success)' : 'var(--color-error)';
    feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect. Answer: ' + correctAnswer;
    questionTextEl.parentNode.insertBefore(feedback, questionTextEl.nextSibling);

    document.getElementById('btn-recall-submit').classList.add('hidden');

    if (modeInst.isComplete()) {
      document.getElementById('btn-recall-next').textContent = 'See Results';
    } else {
      document.getElementById('btn-recall-next').textContent = 'Next Question';
    }
    document.getElementById('btn-recall-next').classList.remove('hidden');

    if (isCorrect && !modeInst.isComplete()) {
      self._autoAdvanceTimer = setTimeout(function () { self._autoAdvanceTimer = null; self.onRecallNext(); }, 800);
    }
  };

  App.prototype.onRecallNext = function () {
    if (this._autoAdvanceTimer) {
      clearTimeout(this._autoAdvanceTimer);
      this._autoAdvanceTimer = null;
    }
    var modeInst = this.modeInstance;
    var feedback = document.querySelector('#recall-question-area > div:not(.recall-question-text):not(.recall-input-area):not(.recall-buttons)');
    if (feedback) feedback.remove();

    if (modeInst.isComplete()) {
      this.showResults();
    } else {
      this.showCurrentQuestion();
    }
  };

  App.prototype.showResults = function () {
    var self = this;
    var modeInst = this.modeInstance;
    var results = modeInst.getResults ? modeInst.getResults() : null;
    if (!results) return;

    var boardContainer = document.getElementById('results-board-container');
    var origBoard = this.modeInstance.getPositionForStudy ? this.modeInstance.getPositionForStudy() : null;

    var highlights = {};
    if (this.modeInstance.getHighlights) {
      highlights = this.modeInstance.getHighlights();
    }

    if (origBoard) {
      Renderer.renderBoard(boardContainer, origBoard, {
        showPieces: true,
        showCoords: true,
        highlights: highlights,
        interactive: false
      });
    } else {
      Renderer.renderBoard(boardContainer, null, {
        showPieces: false,
        showCoords: true,
        emptyBoard: true
      });
    }

    var summaryEl = document.getElementById('results-summary');
    summaryEl.innerHTML = '<div class="results-accuracy" style="color:' + (results.accuracy >= 70 ? 'var(--color-success)' : 'var(--color-error)') + '">' +
      results.accuracy + '%</div>' +
      '<div class="results-details">' + results.correct + ' / ' + results.totalQuestions + ' correct</div>';

    var listEl = document.getElementById('results-list');
    listEl.innerHTML = '';
    if (modeInst.questions) {
      modeInst.questions.forEach(function (q, i) {
        var score = modeInst.scores[i] || 0;
        var ua = modeInst.userAnswers[i] || '';
        var isC = score >= 1;

        var item = document.createElement('div');
        item.className = 'result-item ' + (isC ? 'correct' : 'incorrect');
        item.innerHTML = '<span>' + q.question + '</span>' +
          '<span><span class="result-status ' + (isC ? 'correct' : 'incorrect') + '">' +
          (isC ? '✓' : '✗') + '</span> ' +
          '<span style="font-size:0.8rem;color:var(--color-text-secondary)">(' + q.answer + ')</span></span>';
        listEl.appendChild(item);
      });
    }

    var reviewBtn = document.getElementById('btn-results-review');
    if (results.accuracy < 100) {
      reviewBtn.classList.remove('hidden');
    } else {
      reviewBtn.classList.add('hidden');
    }

    this.processSessionResults(results);

    this.showScreen('results');
  };

  App.prototype.processSessionResults = function (results) {
    var modeId = this.currentMode || 'recall';
    var position = this.currentPosition;

    Storage.updateStats({
      mode: modeId,
      totalQuestions: results.totalQuestions,
      correct: results.correct,
      accuracy: results.accuracy,
      byType: results.byType
    });

    var streak = Storage.updateStreak(results.accuracy);
    this.updateStreakDisplay();

    if (position) {
      var spaced = Storage.getSpaced();
      var posId = position.id || position.name || position.fen;
      Spaced.recordResult(spaced, posId, results.accuracy >= 70);
      Storage.saveSpaced(spaced);
    }

    Storage.addHistoryEntry({
      mode: modeId,
      positionName: position ? position.name : 'Unknown',
      accuracy: results.accuracy,
      totalQuestions: results.totalQuestions,
      correct: results.correct,
      difficulty: document.getElementById('difficulty-select').value
    });

    if (this.isDailyChallenge) {
      Daily.completeDaily(results.accuracy);
    }
  };

  App.prototype.updateStreakDisplay = function () {
    var badge = document.getElementById('streak-badge');
    var streakText = Storage.getStreakDisplay();
    if (streakText) {
      badge.textContent = '🔥 ' + streakText;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  };

  App.prototype.nextPosition = function () {
    var self = this;
    var modeId = this.currentMode;

    if (modeId === 'openings') {
      self.showOpeningsList();
      return;
    }

    this.selectRandomPosition(function (pos) {
      if (!pos) {
        self.showScreen(STATE.MENU);
        return;
      }
      self.currentPosition = pos;
      self.startMode(modeId, pos);
    });
  };

  App.prototype.reviewCurrentPosition = function () {
    this.startMode(this.currentMode, this.currentPosition);
  };

  App.prototype.startDailyChallenge = function () {
    var self = this;
    var status = Daily.getDailyStatus();
    if (status.completed) {
      Components.showModal('<p style="text-align:center;margin:16px 0;">Daily challenge completed!</p>' +
        '<p style="text-align:center;color:var(--color-text-secondary)">Score: ' + status.score + '%</p>' +
        '<p style="text-align:center;color:var(--color-text-secondary);font-size:0.85rem;">Come back tomorrow for a new challenge.</p>');
      return;
    }

    if (this.positions.length === 0) {
      Components.showToast('Positions loading...', 'error');
      return;
    }

    this.isDailyChallenge = true;
    var idx = Daily.getDailyPositionIndex(this.positions);
    var pos = this.positions[idx];
    if (!pos) {
      Components.showToast('No position for today', 'error');
      return;
    }
    this.currentPosition = pos;
    this.selectMode('recall');
  };

  App.prototype.showStatsScreen = function () {
    var stats = Storage.getStats();
    var streak = Storage.getStreak();
    stats.streak = streak.current;
    stats.bestStreak = streak.best;

    document.getElementById('stats-container').innerHTML = Components.buildStatsHTML(stats);
    this.showScreen('stats');
  };

  App.prototype.showReviewScreen = function () {
    var self = this;
    var spaced = Storage.getSpaced();
    var ids = Object.keys(spaced);
    var weak = ids.filter(function (id) {
      return spaced[id].incorrect > spaced[id].correct;
    }).sort(function (a, b) {
      return (spaced[b].incorrect - spaced[b].correct) - (spaced[a].incorrect - spaced[a].correct);
    });

    var container = document.getElementById('review-list');
    container.innerHTML = '';

    if (weak.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--color-text-secondary);padding:24px;">No positions to review. Great job!</p>';
    } else {
      weak.slice(0, 20).forEach(function (id) {
        var found = null;
        for (var i = 0; i < self.positions.length; i++) {
          if (self.positions[i].id === id || self.positions[i].name === id || self.positions[i].fen === id) {
            found = self.positions[i];
            break;
          }
        }
        if (!found) return;

        var item = document.createElement('div');
        item.className = 'review-item';
        var data = spaced[id];
        item.innerHTML = '<h4>' + (found.name || id) + '</h4>' +
          '<p>Incorrect: ' + data.incorrect + ' | Correct: ' + data.correct +
          ' | Next: ' + Spaced.getNextReviewDelay(data) + '</p>';
        item.addEventListener('click', function () {
          self.currentPosition = found;
          self.isDailyChallenge = false;
          self.startMode('recall', found);
        });
        container.appendChild(item);
      });
    }

    this.showScreen('review');
  };

  App.prototype.startReconstructStudy = function () {
    var self = this;
    var board = this.modeInstance.getPositionForStudy();
    var container = document.getElementById('study-board-container');
    document.getElementById('study-position-name').textContent = this.currentPosition.name || 'Reconstruction';
    Renderer.renderBoard(container, board, { showPieces: true, showCoords: true });
    this.showScreen('study');
    this.studyTimer.reset();
    this.studyTimer.start(20, function () {
      self.startReconstructRecall();
    });
  };

  App.prototype.startReconstructRecall = function () {
    var self = this;
    this.showScreen('reconstruct');
    this.renderReconstructBoard();
    this.renderPalette();
    this.reconstructTimer.reset();
  };

  App.prototype.renderReconstructBoard = function () {
    var self = this;
    var container = document.getElementById('reconstruct-board-container');
    var board = this.modeInstance.getUserBoard();

    Renderer.renderBoard(container, null, {
      showPieces: false,
      showCoords: true,
      emptyBoard: false,
      interactive: true,
      highlights: this.reconstructHighlights,
      onSquareClick: function (sqData) {
        self.onReconstructSquareClick(sqData);
      }
    });

    var userBoard = this.modeInstance.getUserBoard();
    var squares = container.querySelectorAll('.square');
    squares.forEach(function (el, idx) {
      var rank = Math.floor(idx / 8);
      var file = idx % 8;
      var piece = userBoard[rank] && userBoard[rank][file];
      if (piece) {
        el.innerHTML = Renderer.pieceSVG(piece.fenChar) + el.innerHTML;
      }
    });
  };

  App.prototype.renderPalette = function () {
    var self = this;
    var paletteEl = document.getElementById('piece-palette');
    paletteEl.innerHTML = '';
    var fenChars = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'];
    fenChars.forEach(function (ch) {
      var el = Renderer.createPalettePiece(ch);
      el.addEventListener('click', function () {
        paletteEl.querySelectorAll('.palette-piece').forEach(function (p) {
          p.classList.remove('selected');
        });
        el.classList.add('selected');
        self.selectedPalettePiece = ch;
      });
      paletteEl.appendChild(el);
    });

    var clearBtn = document.createElement('div');
    clearBtn.className = 'palette-piece';
    clearBtn.textContent = '✕';
    clearBtn.style.fontSize = '1.2rem';
    clearBtn.title = 'Eraser (remove piece)';
    clearBtn.addEventListener('click', function () {
      paletteEl.querySelectorAll('.palette-piece').forEach(function (p) { p.classList.remove('selected'); });
      self.selectedPalettePiece = 'erase';
    });
    paletteEl.appendChild(clearBtn);
  };

  App.prototype.onReconstructSquareClick = function (sqData) {
    if (!this.selectedPalettePiece) {
      Components.showToast('Select a piece from the palette first', 'error');
      return;
    }
    if (this.selectedPalettePiece === 'erase') {
      this.modeInstance.removePiece(sqData.rank, sqData.file);
    } else {
      this.modeInstance.placePiece(this.selectedPalettePiece, sqData.rank, sqData.file);
    }
    this.renderReconstructBoard();
  };

  App.prototype.onReconstructClear = function () {
    this.modeInstance.clearBoard();
    this.reconstructHighlights = {};
    this.renderReconstructBoard();
  };

  App.prototype.onReconstructSubmit = function () {
    var result = this.modeInstance.submit();
    this.reconstructHighlights = this.modeInstance.getDiffHighlights();

    var boardContainer = document.getElementById('results-board-container');
    var origBoard = this.modeInstance.getPositionForStudy();
    Renderer.renderBoard(boardContainer, origBoard, {
      showPieces: true,
      showCoords: true,
      highlights: this.reconstructHighlights
    });

    var summaryEl = document.getElementById('results-summary');
    summaryEl.innerHTML = '<div class="results-accuracy" style="color:' + (result.accuracy >= 70 ? 'var(--color-success)' : 'var(--color-error)') + '">' +
      result.accuracy + '%</div>' +
      '<div class="results-details">' + result.correct + ' / ' + result.totalQuestions + ' squares correct</div>';

    var listEl = document.getElementById('results-list');
    listEl.innerHTML = '<p style="text-align:center;color:var(--color-text-secondary);font-size:0.85rem;">' +
      result.diff.length + ' incorrect squares</p>';
    result.diff.slice(0, 10).forEach(function (d) {
      var item = document.createElement('div');
      item.className = 'result-item incorrect';
      var msg = d.square + ': expected ' + (d.expected ? d.expected.name : 'empty') + ', got ' + (d.got ? d.got.name : 'empty');
      item.innerHTML = '<span>' + msg + '</span><span class="result-status incorrect">✗</span>';
      listEl.appendChild(item);
    });

    document.getElementById('btn-results-review').classList.add('hidden');

    this.processSessionResults({
      totalQuestions: result.totalQuestions,
      correct: result.correct,
      accuracy: result.accuracy,
      byType: { 'square-recall': { total: result.totalQuestions, correct: result.correct } }
    });

    this.showScreen('results');
  };

  App.prototype.startMissingStudy = function () {
    var self = this;
    var board = FEN.fenToBoardArray(this.currentPosition.fen);
    var container = document.getElementById('study-board-container');
    document.getElementById('study-position-name').textContent = (this.currentPosition.name || 'Position') + ' (Memorize!)';
    Renderer.renderBoard(container, board, { showPieces: true, showCoords: true });
    this.showScreen('study');
    this.studyTimer.reset();
    this.studyTimer.start(15, function () {
      self.startMissingRecall();
    });
  };

  App.prototype.startMissingRecall = function () {
    var self = this;
    var modifiedBoard = this.modeInstance.getModifiedBoard();
    var container = document.getElementById('missing-board-container');
    Renderer.renderBoard(container, modifiedBoard, { showPieces: true, showCoords: true });

    this.showScreen('missing');
    this.showMissingQuestion();
  };

  App.prototype.showMissingQuestion = function () {
    var self = this;
    var q = this.modeInstance.getCurrentQuestion();
    document.getElementById('missing-question-text').textContent = q ? q.question : 'No more questions.';

    var inputArea = document.getElementById('missing-input-area');
    inputArea.innerHTML = '';

    if (q && q.type === 'piece-identification') {
      var pieceGrid = Components.pieceButtons(function (fenChar, label) {
        self.missingAnswerValue = label;
        self.onMissingSubmit();
      });
      inputArea.appendChild(pieceGrid);
    }
  };

  App.prototype.onMissingSubmit = function () {
    var modeInst = this.modeInstance;
    var q = modeInst.getCurrentQuestion();
    if (!q) return;

    var answer = this.missingAnswerValue || '';
    if (!answer) {
      var input = document.querySelector('#missing-input-area input');
      if (input) answer = input.value.trim();
    }
    if (!answer) {
      Components.showToast('Select or enter a piece', 'error');
      return;
    }

    modeInst.submitAnswer(answer);

    if (modeInst.isComplete()) {
      this.showResults();
    } else {
      this.showMissingQuestion();
    }
  };

  App.prototype.startBlindfoldStudy = function () {
    var self = this;
    var board = this.modeInstance.getPositionForStudy();
    var container = document.getElementById('study-board-container');
    document.getElementById('study-position-name').textContent = (this.currentPosition.name || 'Blindfold') + ' (Visualize!)';
    Renderer.renderBoard(container, board, { showPieces: true, showCoords: true });
    this.showScreen('study');
    this.studyTimer.reset();
    this.studyTimer.start(this.modeInstance.getStudyTime(), function () {
      self.startBlindfoldRecall();
    });
  };

  App.prototype.startBlindfoldRecall = function () {
    var self = this;
    this.showScreen('blindfold');
    this.showBlindfoldQuestion();
  };

  App.prototype.showBlindfoldQuestion = function () {
    var self = this;
    var q = this.modeInstance.getCurrentQuestion();
    document.getElementById('blindfold-question-text').textContent = q ? q.question : 'No more questions.';

    var inputArea = document.getElementById('blindfold-input-area');
    inputArea.innerHTML = '';

    if (q && (q.type === 'square-recall' || q.type === 'piece-identification')) {
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = q.type === 'square-recall' ? 'e.g. e4' : 'e.g. White Queen';
      input.style.cssText = 'padding:10px 16px;border-radius:8px;border:2px solid rgba(0,0,0,0.2);width:200px;text-align:center;font-size:1.1rem;';
      inputArea.appendChild(input);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.onBlindfoldSubmit();
      });
    } else if (q && q.type === 'boolean') {
      var yesBtn = document.createElement('button');
      yesBtn.textContent = 'Yes';
      yesBtn.className = 'btn btn-secondary';
      yesBtn.style.marginRight = '8px';
      yesBtn.addEventListener('click', function () { self.blindfoldAnswerValue = 'yes'; self.onBlindfoldSubmit(); });
      inputArea.appendChild(yesBtn);
      var noBtn = document.createElement('button');
      noBtn.textContent = 'No';
      noBtn.className = 'btn btn-secondary';
      noBtn.addEventListener('click', function () { self.blindfoldAnswerValue = 'no'; self.onBlindfoldSubmit(); });
      inputArea.appendChild(noBtn);
    }
  };

  App.prototype.onBlindfoldSubmit = function () {
    var modeInst = this.modeInstance;
    var q = modeInst.getCurrentQuestion();
    if (!q) return;

    var answer;
    var input = document.querySelector('#blindfold-input-area input');
    if (input) {
      answer = input.value.trim();
    } else {
      answer = this.blindfoldAnswerValue || '';
    }

    if (!answer) {
      Components.showToast('Please enter an answer', 'error');
      return;
    }

    modeInst.submitAnswer(answer);

    if (modeInst.isComplete()) {
      this.showResults();
    } else {
      this.showBlindfoldQuestion();
    }
  };

  App.prototype.showOpeningsList = function () {
    if (!this.openingsData || this.openingsData.length === 0) {
      Components.showToast('Openings data not loaded yet. Try again.', 'error');
      return;
    }

    var self = this;
    var listEl = document.getElementById('openings-list');
    listEl.innerHTML = '';

    this.openingsData.forEach(function (opening) {
      var card = document.createElement('div');
      card.className = 'opening-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');

      var numLines = opening.lines ? opening.lines.length : 0;
      var diff = opening.difficulty || 'easy';

      card.innerHTML =
        '<h3>' + opening.name + '</h3>' +
        '<span class="opening-difficulty ' + diff + '">' + diff + '</span>' +
        '<p>' + (opening.description || '') + '</p>' +
        '<div class="opening-lines-count">' + numLines + ' line' + (numLines > 1 ? 's' : '') + '</div>';

      card.addEventListener('click', function () {
        self.startOpeningsMode(opening);
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.startOpeningsMode(opening);
      });

      listEl.appendChild(card);
    });

    document.getElementById('openings-play-phase').classList.add('hidden');
    document.getElementById('openings-select-phase').classList.remove('hidden');
    this.showScreen('openings');
  };

  App.prototype.startOpeningsMode = function (openingCategory) {
    if (!openingCategory.lines || openingCategory.lines.length === 0) {
      Components.showToast('No lines available for this opening', 'error');
      return;
    }

    var lineIdx = Math.floor(Math.random() * openingCategory.lines.length);
    var line = openingCategory.lines[lineIdx];

    this.currentMode = 'openings';
    this.isDailyChallenge = false;
    this.modeInstance = new ns.Modes.Openings(openingCategory, line);
    this.modeInstance.setup();
    this.selectedOpeningsSquare = null;
    this.openingsLegalMoves = [];

    document.getElementById('openings-title').textContent = openingCategory.name;
    document.getElementById('openings-line-name').textContent = line.name + ' (' + (line.playAs === 'white' ? 'Play White' : 'Play Black') + ')';

    document.getElementById('openings-select-phase').classList.add('hidden');
    document.getElementById('openings-play-phase').classList.remove('hidden');

    this.renderOpeningsBoard();
    this.updateOpeningsUI();
  };

  App.prototype.renderOpeningsBoard = function () {
    var self = this;
    var modeInst = this.modeInstance;
    var container = document.getElementById('openings-board-container');
    var board = modeInst.getBoardForRender();

    Renderer.renderBoard(container, board, {
      showPieces: true,
      showCoords: true,
      interactive: true,
      onSquareClick: function (sqData) {
        self.onOpeningsSquareClick(sqData);
      }
    });

    if (this.selectedOpeningsSquare) {
      var squares = container.querySelectorAll('.square');
      var selSquare = this.selectedOpeningsSquare;

      var legalSet = {};
      this.openingsLegalMoves.forEach(function (sq) { legalSet[sq] = true; });

      squares.forEach(function (el) {
        var sqName = el.dataset.square;

        if (sqName === selSquare) {
          el.classList.add('selected-piece');
        }

        if (legalSet[sqName]) {
          el.classList.add('legal-move');
          var p = modeInst.chess.get(sqName);
          if (p) {
            el.classList.add('has-piece');
          }
        }
      });
    }
  };

  App.prototype.onOpeningsSquareClick = function (sqData) {
    var modeInst = this.modeInstance;
    if (!modeInst.isUserTurn() || modeInst.completed) return;

    var square = sqData.square;

    if (this.selectedOpeningsSquare === null) {
      var piece = modeInst.chess.get(square);
      if (!piece) return;
      var turn = modeInst.chess.turn();
      if (piece.color !== turn) return;

      this.selectedOpeningsSquare = square;
      this.openingsLegalMoves = modeInst.getLegalMoves(square);
      this.renderOpeningsBoard();
    } else {
      if (square === this.selectedOpeningsSquare) {
        this.selectedOpeningsSquare = null;
        this.openingsLegalMoves = [];
        this.renderOpeningsBoard();
        return;
      }

      var isLegal = false;
      for (var i = 0; i < this.openingsLegalMoves.length; i++) {
        if (this.openingsLegalMoves[i] === square) {
          isLegal = true;
          break;
        }
      }

      if (isLegal) {
        var result = modeInst.submitMove(this.selectedOpeningsSquare, square, 'q');
        this.selectedOpeningsSquare = null;
        this.openingsLegalMoves = [];
        this.renderOpeningsBoard();
        this.updateOpeningsUI();

        if (result && result.correct) {
          if (modeInst.completed) {
            this.onOpeningsComplete();
          }
        }
      } else {
        var clickedPiece = modeInst.chess.get(square);
        if (clickedPiece && clickedPiece.color === modeInst.chess.turn()) {
          this.selectedOpeningsSquare = square;
          this.openingsLegalMoves = modeInst.getLegalMoves(square);
          this.renderOpeningsBoard();
        } else {
          this.selectedOpeningsSquare = null;
          this.openingsLegalMoves = [];
          this.renderOpeningsBoard();
        }
      }
    }
  };

  App.prototype.onOpeningsHint = function () {
    var modeInst = this.modeInstance;
    if (!modeInst.isUserTurn() || modeInst.completed) return;

    var expected = modeInst.getExpectedMove();
    if (expected) {
      Components.showToast('Expected move: ' + expected, 'info');
    }
  };

  App.prototype.onOpeningsSkip = function () {
    var modeInst = this.modeInstance;
    if (!modeInst.isUserTurn() || modeInst.completed) return;

    modeInst.skip();
    this.selectedOpeningsSquare = null;
    this.openingsLegalMoves = [];
    this.renderOpeningsBoard();
    this.updateOpeningsUI();

    if (modeInst.completed) {
      this.onOpeningsComplete();
    }
  };

  App.prototype.updateOpeningsUI = function () {
    var modeInst = this.modeInstance;
    var score = modeInst.getScore();
    document.getElementById('openings-score').textContent = score.correct + '/' + score.total;
    document.getElementById('openings-status').textContent = modeInst.getStatus();

    var feedbackEl = document.getElementById('openings-feedback');
    var fb = modeInst.feedback;
    if (fb) {
      feedbackEl.textContent = fb.message;
      feedbackEl.className = 'openings-feedback ' + fb.type;
      feedbackEl.classList.remove('hidden');
    } else {
      feedbackEl.classList.add('hidden');
    }

    this.updateOpeningsMoveHistory();
  };

  App.prototype.updateOpeningsMoveHistory = function () {
    var modeInst = this.modeInstance;
    var historyEl = document.getElementById('openings-move-history');
    historyEl.innerHTML = '';

    var rows = [];
    var row = {};

    modeInst.history.forEach(function (h, idx) {
      var sanClass = h.isUser ? (h.correct ? 'correct' : 'wrong') : 'opponent';
      var sanHtml = '<span class="move-san ' + sanClass + '">' + h.san + '</span>';

      if (idx % 2 === 0) {
        row = { number: Math.floor(idx / 2) + 1, white: sanHtml, black: '' };
        if (idx + 1 >= modeInst.history.length) {
          rows.push(row);
        }
      } else {
        row.black = sanHtml;
        rows.push(row);
      }
    });

    rows.forEach(function (r) {
      var div = document.createElement('div');
      div.className = 'move-row';
      div.innerHTML =
        '<span class="move-number">' + r.number + '.</span>' +
        '<span class="move-white">' + (r.white || '') + '</span>' +
        '<span class="move-black">' + (r.black || '') + '</span>';
      historyEl.appendChild(div);
    });

    historyEl.scrollTop = historyEl.scrollHeight;
  };

  App.prototype.onOpeningsComplete = function () {
    var modeInst = this.modeInstance;
    var score = modeInst.getScore();

    this.processSessionResults({
      mode: 'openings',
      totalQuestions: score.total,
      correct: score.correct,
      accuracy: score.accuracy,
      byType: { 'opening-move': { total: score.total, correct: score.correct } }
    });

    var boardContainer = document.getElementById('results-board-container');
    var board = modeInst.getBoardForRender();
    Renderer.renderBoard(boardContainer, board, { showPieces: true, showCoords: true });

    var summaryEl = document.getElementById('results-summary');
    summaryEl.innerHTML = '<div class="results-accuracy" style="color:' + (score.accuracy >= 70 ? 'var(--color-success)' : 'var(--color-error)') + '">' +
      score.accuracy + '%</div>' +
      '<div class="results-details">' + score.correct + ' / ' + score.total + ' correct (' + score.errors + ' errors)</div>';

    var listEl = document.getElementById('results-list');
    listEl.innerHTML = '';
    modeInst.history.forEach(function (h) {
      if (h.isUser) {
        var item = document.createElement('div');
        item.className = 'result-item ' + (h.correct ? 'correct' : 'incorrect');
        item.innerHTML = '<span>' + h.san + '</span><span class="result-status ' + (h.correct ? 'correct' : 'incorrect') + '">' +
          (h.correct ? '✓' : '✗') + '</span>';
        listEl.appendChild(item);
      }
    });

    document.getElementById('btn-results-review').classList.add('hidden');
    this.showScreen('results');
  };

  ns.App = App;

  document.addEventListener('DOMContentLoaded', function () {
    var app = new ChessTrainer.App();
    app.init();
    window.ChessTrainerApp = app;
  });

})(ChessTrainer);
