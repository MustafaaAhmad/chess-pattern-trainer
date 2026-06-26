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
    CHANGE: 'change',
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
    this.changeTimer = new Timer(document.getElementById('change-timer'));
    this.missingTimer = new Timer(document.getElementById('missing-timer'));
    this.blindfoldTimer = new Timer(document.getElementById('blindfold-timer'));
    this.selectedPalettePiece = null;
    this.reconstructHighlights = {};
    this.isDailyChallenge = false;

    this.midgamePuzzles = [];
    this.endgamePuzzles = [];
    this.puzzleInstance = null;
    this.puzzleIndex = 0;
    this.puzzleScores = [];
    this.selectedPuzzleSquare = null;
    this.puzzleLegalMoves = [];

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
      change: {
        name: 'Change Detection',
        studyTimeA: 10,
        studyTimeB: 3,
        ModeClass: ns.Modes.Change,
        screens: ['change', 'results']
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
      midgame: {
        name: 'Midgame Tactics',
        studyTime: 0,
        recallTime: 0,
        ModeClass: ns.Modes.Midgame,
        screens: ['midgame']
      },
      endgame: {
        name: 'Endgame Trainer',
        studyTime: 0,
        recallTime: 0,
        ModeClass: ns.Modes.Endgame,
        screens: ['endgame']
      }
    };
  }

  App.prototype.init = function () {
    var self = this;
    ns.Theme.init();
    this.bindEvents();
    this.loadPositions();
    this.loadMidgamePuzzles();
    this.loadEndgamePuzzles();

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

  App.prototype.loadMidgamePuzzles = function () {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/midgames.json', true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          self.midgamePuzzles = data.puzzles || data || [];
        } catch (e) {
          self.midgamePuzzles = [];
        }
      }
    };
    xhr.onerror = function () {
      self.midgamePuzzles = [];
    };
    xhr.send();
  };

  App.prototype.loadEndgamePuzzles = function () {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/endgames.json', true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          self.endgamePuzzles = data.puzzles || data || [];
        } catch (e) {
          self.endgamePuzzles = [];
        }
      }
    };
    xhr.onerror = function () {
      self.endgamePuzzles = [];
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

    document.getElementById('btn-change-submit').addEventListener('click', function () {
      self.onChangeSubmit();
    });

    document.getElementById('btn-missing-submit').addEventListener('click', function () {
      self.onMissingSubmit();
    });

    document.getElementById('btn-blindfold-submit').addEventListener('click', function () {
      self.onBlindfoldSubmit();
    });

    document.getElementById('btn-midgame-hint').addEventListener('click', function () {
      self.onPuzzleHint('midgame');
    });
    document.getElementById('btn-midgame-skip').addEventListener('click', function () {
      self.onPuzzleSkip('midgame');
    });
    document.getElementById('btn-midgame-next').addEventListener('click', function () {
      self.nextPuzzle('midgame');
    });
    document.getElementById('btn-midgame-back').addEventListener('click', function () {
      self.showScreen(STATE.MENU);
    });

    document.getElementById('btn-endgame-hint').addEventListener('click', function () {
      self.onPuzzleHint('endgame');
    });
    document.getElementById('btn-endgame-skip').addEventListener('click', function () {
      self.onPuzzleSkip('endgame');
    });
    document.getElementById('btn-endgame-next').addEventListener('click', function () {
      self.nextPuzzle('endgame');
    });
    document.getElementById('btn-endgame-back').addEventListener('click', function () {
      self.showScreen(STATE.MENU);
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
      case '3': this.selectMode('change'); break;
      case '4': this.selectMode('missing'); break;
      case '5': this.selectMode('blindfold'); break;
      case '6': this.selectMode('midgame'); break;
      case '7': this.selectMode('endgame'); break;
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
        if (this.state === STATE.RECALL) this.onRecallSubmit();
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

    if (modeId === 'change') {
      this.startChangeMode();
      return;
    }

    if (modeId === 'midgame') {
      this.startPuzzleMode('midgame');
      return;
    }

    if (modeId === 'endgame') {
      this.startPuzzleMode('endgame');
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
    var modeInst = this.modeInstance;
    var q = modeInst.getCurrentQuestion();
    var total = modeInst.getQuestionCount();
    var answered = this.currentMode === 'recall' ? modeInst.scores.length : 0;

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
  };

  App.prototype.onRecallNext = function () {
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

    if (modeId === 'midgame') {
      this.nextPuzzle('midgame');
      return;
    }
    if (modeId === 'endgame') {
      this.nextPuzzle('endgame');
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

    if (pos.fenB) {
      this.startChangeMode();
    } else {
      this.selectMode('recall');
    }
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

  App.prototype.startChangeMode = function () {
    var self = this;
    if (this.positions.length < 2) {
      Components.showToast('Need at least 2 positions for Change Detection', 'error');
      return;
    }

    var idxA = Math.floor(Math.random() * this.positions.length);
    var posA = this.positions[idxA];
    var idxB;
    do {
      idxB = Math.floor(Math.random() * this.positions.length);
    } while (idxB === idxA && this.positions.length > 1);
    var posB = this.positions[idxB];

    this.currentMode = 'change';
    this.isDailyChallenge = false;
    this.currentPosition = posA;

    this.modeInstance = new ns.Modes.Change(posA, posB);

    var boardA = FEN.fenToBoardArray(posA.fen);
    var container = document.getElementById('change-board-container');
    Renderer.renderBoard(container, boardA, { showPieces: true, showCoords: true });
    document.getElementById('change-question-text').textContent = 'Study Position A';

    this.showScreen('change');
    this.changeTimer.reset();
    this.changeTimer.start(10, function () {
      self.onChangeStudyAEnd();
    });
  };

  App.prototype.onChangeStudyAEnd = function () {
    var self = this;
    var posB = this.modeInstance.positionB;
    var boardB = FEN.fenToBoardArray(posB.fen);
    var container = document.getElementById('change-board-container');

    Renderer.renderBoard(container, boardB, { showPieces: true, showCoords: true });
    document.getElementById('change-question-text').textContent = 'Position B';

    this.showScreen('change');
    this.changeTimer.reset();
    this.changeTimer.start(3, function () {
      self.onChangeStudyBEnd();
    });
  };

  App.prototype.onChangeStudyBEnd = function () {
    var container = document.getElementById('change-board-container');
    Renderer.renderBoard(container, null, { showPieces: false, showCoords: true, emptyBoard: true });

    this.showScreen('change');
    this.showChangeQuestion();
  };

  App.prototype.showChangeQuestion = function () {
    var modeInst = this.modeInstance;
    var q = modeInst.getCurrentQuestion();
    document.getElementById('change-question-text').textContent = q ? q.question : 'No more questions.';

    var inputArea = document.getElementById('change-input-area');
    inputArea.innerHTML = '';
    var self = this;

    if (q && q.type === 'square-recall') {
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'e.g. e4';
      input.style.cssText = 'padding:10px 16px;border-radius:8px;border:2px solid rgba(0,0,0,0.2);width:200px;text-align:center;font-size:1.1rem;';
      inputArea.appendChild(input);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.onChangeSubmit();
      });
    } else if (q && q.type === 'boolean') {
      var yesBtn = document.createElement('button');
      yesBtn.textContent = 'Yes';
      yesBtn.className = 'btn btn-secondary';
      yesBtn.style.marginRight = '8px';
      yesBtn.addEventListener('click', function () { self.changeAnswerValue = 'yes'; self.onChangeSubmit(); });
      inputArea.appendChild(yesBtn);
      var noBtn = document.createElement('button');
      noBtn.textContent = 'No';
      noBtn.className = 'btn btn-secondary';
      noBtn.addEventListener('click', function () { self.changeAnswerValue = 'no'; self.onChangeSubmit(); });
      inputArea.appendChild(noBtn);
    }
  };

  App.prototype.onChangeSubmit = function () {
    var modeInst = this.modeInstance;
    var q = modeInst.getCurrentQuestion();
    if (!q) return;

    var answer;
    var input = document.querySelector('#change-input-area input');
    if (input) {
      answer = input.value.trim();
    } else {
      answer = this.changeAnswerValue || '';
    }

    if (!answer) {
      Components.showToast('Please enter an answer', 'error');
      return;
    }

    modeInst.submitAnswer(answer);

    if (modeInst.isComplete()) {
      this.showResults();
    } else {
      this.showChangeQuestion();
    }
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

  App.prototype.startPuzzleMode = function (modeId) {
    var puzzles = modeId === 'midgame' ? this.midgamePuzzles : this.endgamePuzzles;
    if (!puzzles || puzzles.length === 0) {
      Components.showToast('Puzzles not loaded yet. Try again.', 'error');
      return;
    }

    this.currentMode = modeId;
    this.isDailyChallenge = false;
    this.puzzleIndex = 0;
    this.puzzleScores = [];
    this.selectedPuzzleSquare = null;
    this.puzzleLegalMoves = [];

    this.loadPuzzle(modeId, 0);
  };

  App.prototype.loadPuzzle = function (modeId, index) {
    var puzzles = modeId === 'midgame' ? this.midgamePuzzles : this.endgamePuzzles;
    if (index >= puzzles.length) {
      this.showPuzzleResults(modeId);
      return;
    }

    this.puzzleIndex = index;
    var puzzle = puzzles[index];
    this.puzzleInstance = new (modeId === 'midgame' ? ns.Modes.Midgame : ns.Modes.Endgame)(puzzle);
    this.puzzleInstance.setup();
    this.selectedPuzzleSquare = null;
    this.puzzleLegalMoves = [];

    var nameEl = document.getElementById(modeId + '-puzzle-name');
    var hintEl = document.getElementById(modeId + '-hint-text');
    var feedbackEl = document.getElementById(modeId + '-feedback');
    var nextBtn = document.getElementById('btn-' + modeId + '-next');

    nameEl.textContent = (index + 1) + '. ' + puzzle.name;
    hintEl.classList.add('hidden');
    feedbackEl.classList.add('hidden');
    nextBtn.classList.add('hidden');

    this.renderPuzzleBoard(modeId);
    this.updatePuzzleProgress(modeId);
    this.showScreen(modeId);
  };

  App.prototype.renderPuzzleBoard = function (modeId) {
    var self = this;
    var modeInst = this.puzzleInstance;
    var container = document.getElementById(modeId + '-board-container');
    var board = modeInst.getBoardForRender();

    Renderer.renderBoard(container, board, {
      showPieces: true,
      showCoords: true,
      interactive: true,
      onSquareClick: function (sqData) {
        self.onPuzzleSquareClick(modeId, sqData);
      }
    });

    if (this.selectedPuzzleSquare) {
      var squares = container.querySelectorAll('.square');
      var selSquare = this.selectedPuzzleSquare;
      var legalSet = {};
      this.puzzleLegalMoves.forEach(function (sq) { legalSet[sq] = true; });

      squares.forEach(function (el) {
        var sqName = el.dataset.square;
        if (sqName === selSquare) {
          el.classList.add('selected-piece');
        }
        if (legalSet[sqName]) {
          el.classList.add('legal-move');
          var p = modeInst.chess.get(sqName);
          if (p) el.classList.add('has-piece');
        }
      });
    }
  };

  App.prototype.onPuzzleSquareClick = function (modeId, sqData) {
    var modeInst = this.puzzleInstance;
    if (modeInst.attempted) return;

    var square = sqData.square;

    if (this.selectedPuzzleSquare === null) {
      var piece = modeInst.chess.get(square);
      if (!piece) return;
      var turn = modeInst.chess.turn();
      if (piece.color !== turn) return;

      this.selectedPuzzleSquare = square;
      this.puzzleLegalMoves = modeInst.getLegalMoves(square);
      this.renderPuzzleBoard(modeId);
    } else {
      if (square === this.selectedPuzzleSquare) {
        this.selectedPuzzleSquare = null;
        this.puzzleLegalMoves = [];
        this.renderPuzzleBoard(modeId);
        return;
      }

      var isLegal = false;
      for (var i = 0; i < this.puzzleLegalMoves.length; i++) {
        if (this.puzzleLegalMoves[i] === square) {
          isLegal = true;
          break;
        }
      }

      if (isLegal) {
        var result = modeInst.submitMove(this.selectedPuzzleSquare, square, 'q');
        this.selectedPuzzleSquare = null;
        this.puzzleLegalMoves = [];
        this.renderPuzzleBoard(modeId);
        this.showPuzzleFeedback(modeId, result);
      } else {
        var clickedPiece = modeInst.chess.get(square);
        if (clickedPiece && clickedPiece.color === modeInst.chess.turn()) {
          this.selectedPuzzleSquare = square;
          this.puzzleLegalMoves = modeInst.getLegalMoves(square);
          this.renderPuzzleBoard(modeId);
        } else {
          this.selectedPuzzleSquare = null;
          this.puzzleLegalMoves = [];
          this.renderPuzzleBoard(modeId);
        }
      }
    }
  };

  App.prototype.showPuzzleFeedback = function (modeId, result) {
    var feedbackEl = document.getElementById(modeId + '-feedback');
    var nextBtn = document.getElementById('btn-' + modeId + '-next');

    if (result && result.correct) {
      feedbackEl.textContent = 'Correct!';
      feedbackEl.className = 'puzzle-feedback correct';
      this.puzzleScores.push(1);
    } else {
      feedbackEl.textContent = result ? 'Wrong. Expected: ' + result.expected : 'Invalid move';
      feedbackEl.className = 'puzzle-feedback wrong';
      this.puzzleScores.push(0);
    }

    feedbackEl.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    this.updatePuzzleProgress(modeId);
  };

  App.prototype.onPuzzleHint = function (modeId) {
    var puzzles = modeId === 'midgame' ? this.midgamePuzzles : this.endgamePuzzles;
    var puzzle = puzzles[this.puzzleIndex];
    if (!puzzle) return;

    var hintEl = document.getElementById(modeId + '-hint-text');
    hintEl.textContent = '💡 ' + puzzle.hint;
    hintEl.classList.remove('hidden');
  };

  App.prototype.onPuzzleSkip = function (modeId) {
    var modeInst = this.puzzleInstance;
    if (modeInst.attempted) return;

    var expected = modeInst.skip();
    var feedbackEl = document.getElementById(modeId + '-feedback');
    var nextBtn = document.getElementById('btn-' + modeId + '-next');

    feedbackEl.textContent = 'Skipped. Answer: ' + expected;
    feedbackEl.className = 'puzzle-feedback skipped';
    feedbackEl.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    this.puzzleScores.push(0);
    this.updatePuzzleProgress(modeId);
  };

  App.prototype.nextPuzzle = function (modeId) {
    this.loadPuzzle(modeId, this.puzzleIndex + 1);
  };

  App.prototype.updatePuzzleProgress = function (modeId) {
    var puzzles = modeId === 'midgame' ? this.midgamePuzzles : this.endgamePuzzles;
    var el = document.getElementById(modeId + '-progress');
    var correct = 0;
    this.puzzleScores.forEach(function (s) { if (s === 1) correct++; });
    el.textContent = correct + '/' + this.puzzleScores.length + ' correct';
  };

  App.prototype.showPuzzleResults = function (modeId) {
    var self = this;
    var puzzles = modeId === 'midgame' ? this.midgamePuzzles : this.endgamePuzzles;
    var total = this.puzzleScores.length;
    var correct = 0;
    this.puzzleScores.forEach(function (s) { if (s === 1) correct++; });
    var accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    var resultsEl = document.getElementById('results-summary');
    resultsEl.innerHTML = '<div class="results-accuracy" style="color:' + (accuracy >= 70 ? 'var(--color-success)' : 'var(--color-error)') + '">' +
      accuracy + '%</div>' +
      '<div class="results-details">' + correct + ' / ' + total + ' correct</div>';

    var listEl = document.getElementById('results-list');
    listEl.innerHTML = '';
    puzzles.forEach(function (p, i) {
      var score = i < self.puzzleScores.length ? self.puzzleScores[i] : 0;
      var item = document.createElement('div');
      item.className = 'result-item ' + (score >= 1 ? 'correct' : 'incorrect');
      item.innerHTML = '<span>' + (i + 1) + '. ' + p.name + '</span>' +
        '<span class="result-status ' + (score >= 1 ? 'correct' : 'incorrect') + '">' +
        (score >= 1 ? '✓' : '✗') + '</span>';
      listEl.appendChild(item);
    });

    document.getElementById('btn-results-review').classList.add('hidden');
    document.getElementById('results-board-container').innerHTML = '';
    this.showScreen('results');
  };

  ns.App = App;

  document.addEventListener('DOMContentLoaded', function () {
    var app = new ChessTrainer.App();
    app.init();
    window.ChessTrainerApp = app;
  });

})(ChessTrainer);
