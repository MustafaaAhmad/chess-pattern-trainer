var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  function Timer(containerEl) {
    this.el = containerEl;
    this.remaining = 0;
    this.duration = 0;
    this.intervalId = null;
    this.callback = null;
    this.running = false;
  }

  Timer.prototype.start = function (seconds, onEnd) {
    this.stop();
    this.remaining = seconds;
    this.duration = seconds;
    this.callback = onEnd || null;
    this.running = true;
    this.updateDisplay();
    var self = this;
    this.intervalId = setInterval(function () {
      self.remaining--;
      self.updateDisplay();
      if (self.remaining <= 0) {
        self.stop();
        if (self.callback) self.callback();
      }
    }, 1000);
  };

  Timer.prototype.stop = function () {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };

  Timer.prototype.reset = function () {
    this.stop();
    this.remaining = 0;
    this.duration = 0;
    this.updateDisplay();
  };

  Timer.prototype.updateDisplay = function () {
    if (!this.el) return;
    var m = Math.floor(Math.max(0, this.remaining) / 60);
    var s = Math.floor(Math.max(0, this.remaining) % 60);
    this.el.textContent = m + ':' + (s < 10 ? '0' : '') + s;

    this.el.classList.remove('timer-warning', 'timer-danger');
    if (this.remaining > 0 && this.remaining <= 5) {
      this.el.classList.add('timer-danger');
    } else if (this.remaining > 0 && this.remaining <= 10) {
      this.el.classList.add('timer-warning');
    }
  };

  Timer.prototype.getRemaining = function () {
    return Math.max(0, this.remaining);
  };

  Timer.prototype.getElapsed = function () {
    return this.duration - Math.max(0, this.remaining);
  };

  ns.Timer = Timer;

})(ChessTrainer);
