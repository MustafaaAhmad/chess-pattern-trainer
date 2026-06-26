const fs = require('fs');
const { Chess } = require('chess.js');

let GAME_NUMBER = 0;
const ALL_POSITIONS = [];
const SEEN_FENS = new Set();

function getPieceCount(fen) {
  return (fen.match(/[pnbrqk]/gi) || []).length;
}

function classifyDifficulty(pieceCount) {
  if (pieceCount <= 14) return 'easy';
  if (pieceCount <= 24) return 'medium';
  return 'hard';
}

function addPosition(fen, difficulty, name) {
  const parts = fen.split(' ');
  const cleanFen = parts[0] + ' ' + (parts[1] || 'w') + ' - - 0 1';
  const key = parts[0];
  if (SEEN_FENS.has(key)) return false;
  SEEN_FENS.add(key);

  const pc = getPieceCount(cleanFen);
  ALL_POSITIONS.push({
    id: 'pos-' + String(ALL_POSITIONS.length + 1).padStart(4, '0'),
    name: name || 'Chess Position ' + (ALL_POSITIONS.length + 1),
    fen: cleanFen,
    difficulty: difficulty || classifyDifficulty(pc),
    tags: [difficulty || classifyDifficulty(pc)]
  });
  return true;
}

const CLASSIC_GAMES = [
  { moves: ['e4','e5','Nf3','Nc6','Bb5','a6','Ba4','Nf6','O-O','Be7','Re1','b5','Bb3','d6','c3','O-O','h3','Nb8','d4','Nbd7','Nbd2','Bb7','Bc2','Re8','Nf1','Bf8','Ng3','g6','Bg5','Bg7','Qd2','c5','dxc5','dxc5','Rad1','Qc7','Bh6'], name: 'Classic Ruy Lopez' },
  { moves: ['d4','Nf6','c4','e6','Nf3','b6','g3','Bb7','Bg2','Be7','O-O','O-O','Nc3','Ne4','Qc2','Nxc3','Qxc3','c5','Rd1','d6','b3','Nd7','Bb2','Qc7','e4','Rfd8','Rd2','Bf6','Rad1','g6'], name: 'Classic Queen Indian' },
  { moves: ['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6','Be3','e5','Nb3','Be6','f3','Be7','Qd2','O-O','O-O-O','Nbd7','g4','b5','Bg2','Nb6','g5','Nfd7','f4','b4','Nd5','Bxd5','exd5','Qc7'], name: 'Classic Sicilian Najdorf' },
  { moves: ['e4','e5','Nf3','Nc6','Bb5','Nf6','O-O','Nxe4','d4','Be7','Qe2','Nd6','Bxc6','bxc6','dxe5','Nb7','Nc3','O-O','Rd1','Re8','Nxe4','f6','Nxf6+','Bxf6','exf6','Qxf6','Qxe8+','Rxe8','Rxe8+','Kf7','Rxc8'], name: 'Classic Ruy Berlin' },
];

const OPENING_SEQS = [
  ['e4','e5','Nf3','Nc6','Bb5','a6','Ba4','Nf6','O-O','Be7','Re1','b5','Bb3','d6','c3','O-O'],
  ['e4','e5','Nf3','Nc6','Bb5','Nf6','O-O','Be7','Re1','b5','Bb3','d6','c3','Na5','Bc2','c5'],
  ['e4','e5','Nf3','Nc6','Bc4','Bc5','c3','Nf6','d3','O-O','O-O','d6'],
  ['e4','e5','Nf3','Nc6','Bc4','Nf6','d3','Be7','O-O','O-O'],
  ['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6','Be3','e5'],
  ['e4','c5','Nf3','Nc6','d4','cxd4','Nxd4','Nf6','Nc3','d6','Be3','e5'],
  ['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','g6','Be3','Bg7'],
  ['e4','e6','d4','d5','Nc3','Bb4','e5','c5','a3','Bxc3+','bxc3','Ne7'],
  ['e4','e6','d4','d5','Nd2','Nf6','e5','Nfd7','Bd3','c5','c3','Nc6'],
  ['e4','c6','d4','d5','e5','Bf5','Nf3','e6','Be2','Nd7','O-O','Ne7'],
  ['d4','d5','c4','e6','Nc3','Nf6','Bg5','Be7','e3','O-O','Nf3','Nbd7'],
  ['d4','d5','c4','c6','Nf3','Nf6','Nc3','e6','e3','Nbd7','Bd3','dxc4'],
  ['d4','Nf6','c4','g6','Nc3','Bg7','e4','d6','Nf3','O-O','Be2','e5'],
  ['d4','Nf6','c4','e6','Nc3','Bb4','e3','O-O','Bd3','c5','Nf3','d5'],
  ['d4','Nf6','c4','e6','Nf3','b6','g3','Bb7','Bg2','Be7','O-O','O-O'],
  ['e4','e5','Nf3','d6','d4','exd4','Nxd4','Nf6','Nc3','Be7','Be2','O-O'],
  ['d4','d5','c4','dxc4','e3','e5','Bxc4','exd4','exd4','Nf6','Nf3','Bd6'],
  ['d4','f5','g3','Nf6','Bg2','e6','Nf3','Be7','O-O','O-O','c4','d6'],
  ['c4','e5','Nc3','Nf6','g3','Bb4','Bg2','O-O','e4','c6','Nge2','d6'],
  ['Nf3','d5','g3','Nf6','Bg2','e6','O-O','Be7','c4','O-O','b3','c5'],
  ['e4','d5','exd5','Nf6','Nf3','Nxd5','Be2','Nc6','O-O','e5','c4','Ndb4'],
  ['d4','Nf6','c4','c5','d5','e6','Nc3','exd5','cxd5','d6','Nf3','g6'],
  ['e4','g6','d4','Bg7','Nc3','d6','Be3','Nf6','f3','O-O','Qd2','e5'],
  ['e4','b6','d4','Bb7','Bd3','e6','Nf3','Nf6','Qe2','Be7','O-O','O-O'],
  ['d4','d5','Bf4','c5','e3','Nc6','Nf3','Bg4','Be2','e6','O-O','Nf6'],
  ['d4','d5','e3','Nf6','Bd3','e6','Nf3','Be7','O-O','O-O','b3','c5'],
  ['c4','c5','Nf3','Nf6','Nc3','d5','cxd5','Nxd5','e4','Nb4','Bc4','Nd3+'],
];

const ENDGAME_FENS = [
  '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', '8/8/8/4k3/8/8/4K3/8 w - - 0 1',
  '8/8/8/3k4/8/4K3/8/8 w - - 0 1', '8/2k5/8/8/8/5K2/8/8 w - - 0 1',
  '8/8/3k4/8/8/4K3/8/8 w - - 0 1', 'k7/8/8/8/8/3K4/8/8 w - - 0 1',
  '8/8/5k2/8/8/5K2/8/8 w - - 0 1', '8/8/k7/8/8/5K2/8/8 w - - 0 1',
  '4k3/8/8/8/8/3Q4/8/4K3 w - - 0 1', '3k4/8/8/8/8/4R3/8/4K3 w - - 0 1',
  '4k3/8/8/8/8/4P3/8/4K3 w - - 0 1', '8/8/8/3k4/3P4/8/8/4K3 w - - 0 1',
  '8/8/3k4/8/3P4/4K3/8/8 w - - 0 1', '8/5k2/8/8/5P2/5K2/8/8 w - - 0 1',
  '4k3/8/8/8/4P3/4K3/8/8 w - - 0 1', '8/8/3k4/8/5P2/5K2/8/8 w - - 0 1',
  '8/8/8/3k4/8/5PK1/8/8 w - - 0 1', '8/8/8/4k3/8/4PK2/8/8 w - - 0 1',
  'k7/8/8/8/8/6K1/8/8 w - - 0 1', '8/8/8/k7/8/6K1/8/8 w - - 0 1',
  '8/1k6/8/8/8/5K2/8/8 w - - 0 1', '8/8/8/2k5/8/5K2/8/8 w - - 0 1',
  '8/8/8/8/2k5/5K2/8/8 w - - 0 1', '8/8/8/8/5k2/5K2/8/8 w - - 0 1',
  '8/8/8/8/5k2/6K1/8/8 w - - 0 1', '8/8/8/8/2k5/6K1/8/8 w - - 0 1',
  '8/8/8/3k4/8/6K1/8/8 w - - 0 1', '8/8/8/5k2/8/5K2/8/8 w - - 0 1',
  '8/8/8/k7/8/5K2/8/8 w - - 0 1', '8/8/3k4/8/8/6K1/8/8 w - - 0 1',
  '8/8/8/4k3/8/6K1/8/8 w - - 0 1', '8/1k6/8/8/8/6K1/8/8 w - - 0 1',
  '8/8/2k5/8/8/6K1/8/8 w - - 0 1', '8/8/1k6/8/8/5K2/8/8 w - - 0 1',
  '8/8/8/5k2/8/6K1/8/8 w - - 0 1', '8/8/8/6k1/8/5K2/8/8 w - - 0 1',
];

console.log('Generating 1000 chess positions...\n');

// Phase 1: Classic games (sequentially play through, extract at each move)
CLASSIC_GAMES.forEach(function (game) {
  const chess = new Chess();
  game.moves.forEach(function (move, idx) {
    try { chess.move(move); } catch (e) { return; }
    if (idx >= 4 && idx % 2 === 0) {
      const fen = chess.fen();
      if (addPosition(fen, classifyDifficulty(getPieceCount(fen)), game.name + ' (Move ' + (idx + 1) + ')')) {
        GAME_NUMBER++;
      }
    }
  });
});
console.log('  After classic games:', ALL_POSITIONS.length, '(easy/med/hard target)');

// Phase 2: Opening sequences
OPENING_SEQS.forEach(function (seq, si) {
  const chess = new Chess();
  seq.forEach(function (move, idx) {
    try { chess.move(move); } catch (e) { return; }
    if (idx >= 4 && idx % 2 === 0) {
      const fen = chess.fen();
      const pc = getPieceCount(fen);
      const diff = classifyDifficulty(pc);
      if (addPosition(fen, diff, 'Opening ' + (si + 1) + ' (Move ' + Math.floor(idx / 2 + 1) + ', ' + pc + 'pcs)')) {
        GAME_NUMBER++;
      }
    }
  });
});
console.log('  After openings:', ALL_POSITIONS.length);

// Phase 3: Random games with strong capture preference
for (let i = 0; i < 400; i++) {
  if (ALL_POSITIONS.length >= 700) break;
  const chess = new Chess();
  for (let moveCount = 0; moveCount < 80 && !chess.isGameOver(); moveCount++) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) break;

    let candidates = moves;
    const captures = moves.filter(function (m) { return m.flags && m.flags.includes('c'); });
    if (captures.length > 0 && Math.random() < 0.7) candidates = captures;

    try { chess.move(candidates[Math.floor(Math.random() * candidates.length)].san); } catch (e) { break; }

    if (moveCount >= 4 && moveCount % 2 === 0) {
      const fen = chess.fen();
      const pc = getPieceCount(fen);
      if (pc >= 4 && pc <= 30) {
        if (addPosition(fen, classifyDifficulty(pc), 'Game ' + (i + 1) + ' (Move ' + (moveCount + 1) + ', ' + pc + 'pcs)')) {
          GAME_NUMBER++;
        }
      }
    }
  }
}
console.log('  After random games:', ALL_POSITIONS.length);

// Phase 4: Long capture-happy games for easier positions
for (let i = 0; i < 300; i++) {
  if (ALL_POSITIONS.length >= 900) break;
  const chess = new Chess();

  for (let m = 0; m < 14; m++) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) break;
    const captures = moves.filter(function (m) { return m.flags && m.flags.includes('c'); });
    try { chess.move(captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)].san : moves[Math.floor(Math.random() * moves.length)].san); } catch (e) { break; }
  }

  for (let phase = 0; phase < 6 && !chess.isGameOver() && ALL_POSITIONS.length < 900; phase++) {
    for (let m = 0; m < 4; m++) {
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) break;
      const captures = moves.filter(function (m) { return m.flags && m.flags.includes('c'); });
      const candidates = captures.length > 0 && Math.random() < 0.6 ? captures : moves;
      try { chess.move(candidates[Math.floor(Math.random() * candidates.length)].san); } catch (e) { break; }
    }
    if (chess.isGameOver()) break;
    const fen = chess.fen();
    const pc = getPieceCount(fen);
    if (pc >= 4 && pc <= 26) {
      if (addPosition(fen, classifyDifficulty(pc), 'Middlegame ' + (i + 1) + ' (Phase ' + (phase + 1) + ', ' + pc + 'pcs)')) {
        GAME_NUMBER++;
      }
    }
  }
}
console.log('  After middlegames:', ALL_POSITIONS.length);

// Phase 5: Endgames
ENDGAME_FENS.forEach(function (fen) {
  if (ALL_POSITIONS.length >= 980) return;
  if (addPosition(fen, 'easy', 'Endgame ' + (GAME_NUMBER + 1))) {
    GAME_NUMBER++;
  }
  const chess = new Chess(fen);
  for (let i = 0; i < 2; i++) {
    const moves = chess.moves();
    if (moves.length === 0) break;
    try { chess.move(moves[Math.floor(Math.random() * moves.length)]); } catch (e) { break; }
    if (ALL_POSITIONS.length >= 995) break;
    if (addPosition(chess.fen(), 'easy', 'Endgame ' + (GAME_NUMBER + 1))) {
      GAME_NUMBER++;
    }
  }
});
console.log('  After endgames:', ALL_POSITIONS.length);

// Phase 6: Generate easy/medium by playing aggressive capture games from known positions
var seedFens = [];
for (var s = 0; s < ALL_POSITIONS.length && seedFens.length < 30; s++) {
  var p = ALL_POSITIONS[s];
  if (getPieceCount(p.fen) >= 26) seedFens.push(p.fen);
}

for (var si = 0; si < seedFens.length && ALL_POSITIONS.length < 1000; si++) {
  var chess = new Chess(seedFens[si].split(' ').slice(0, -2).join(' ') + ' 0 1');
  for (var capPhase = 0; capPhase < 4 && !chess.isGameOver() && ALL_POSITIONS.length < 1000; capPhase++) {
    for (var cm = 0; cm < 3; cm++) {
      var moves = chess.moves({ verbose: true });
      if (moves.length === 0) break;
      var captures = moves.filter(function (m) { return m.flags && m.flags.includes('c'); });
      try { chess.move(captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)].san : moves[Math.floor(Math.random() * moves.length)].san); } catch (e) { break; }
    }
    if (chess.isGameOver()) break;
    var fen = chess.fen();
    var pc = getPieceCount(fen);
    if (pc <= 26) {
      addPosition(fen, classifyDifficulty(pc), 'Reduced ' + (si + 1) + ' (Phase ' + (capPhase + 1) + ', ' + pc + 'pcs)');
    }
  }
}
console.log('  After reductions:', ALL_POSITIONS.length);

// Shuffle and slice to 1000
ALL_POSITIONS.sort(function () { return Math.random() - 0.5; });

const output = { positions: ALL_POSITIONS.slice(0, 1000) };
output.positions.forEach(function (pos, i) {
  pos.id = 'pos-' + String(i + 1).padStart(4, '0');
});

fs.writeFileSync('data/positions.json', JSON.stringify(output, null, 2));

const diffCounts = { easy: 0, medium: 0, hard: 0 };
output.positions.forEach(function (p) { diffCounts[p.difficulty]++; });
console.log('\n=== Final Stats ===');
console.log('Total: ' + output.positions.length + ' positions');
console.log('Easy: ' + diffCounts.easy + ' | Medium: ' + diffCounts.medium + ' | Hard: ' + diffCounts.hard);
