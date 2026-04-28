import { Owner, Difficulty, type HexCell, type AIMove } from '@/types/game';

export interface AIState {
  cells: Record<string, HexCell>;
  actionPoints: number;
  consecutiveWins: number;
}

export function getAIAttackableNeighbors(cells: Record<string, HexCell>): AIMove[] {
  const moves: AIMove[] = [];
  const aiCells = Object.values(cells).filter(cell => cell.owner === Owner.AI);

  for (const aiCell of aiCells) {
    for (const neighborId of aiCell.neighbors) {
      const neighbor = cells[neighborId];
      if (neighbor && neighbor.owner !== Owner.AI) {
        moves.push({
          fromCellId: aiCell.id,
          toCellId: neighborId,
          estimatedWinChance: 0,
        });
      }
    }
  }

  return moves;
}

function estimateWinChance(
  attackerCell: HexCell,
  defenderCell: HexCell,
  actionPoints: number,
  consecutiveWins: number,
): number {
  const attackPower = (actionPoints + attackerCell.population / 10 + attackerCell.resources / 20) * (1 + consecutiveWins * 0.1);
  const defensePower = defenderCell.defense + 3.5;
  if (attackPower + defensePower === 0) return 0.5;
  return Math.max(0, Math.min(1, attackPower / (attackPower + defensePower)));
}

export function easyAIStrategy(state: AIState): AIMove | null {
  const moves = getAIAttackableNeighbors(state.cells);
  if (moves.length === 0) return null;

  const idx = Math.floor(Math.random() * moves.length);
  const move = moves[idx]!;
  const attackerCell = state.cells[move.fromCellId]!;
  const defenderCell = state.cells[move.toCellId]!;

  return {
    ...move,
    estimatedWinChance: estimateWinChance(attackerCell, defenderCell, state.actionPoints, state.consecutiveWins),
  };
}

export function normalAIStrategy(state: AIState): AIMove | null {
  const moves = getAIAttackableNeighbors(state.cells);
  if (moves.length === 0) return null;

  moves.sort((a, b) => {
    const cellA = state.cells[a.toCellId]!;
    const cellB = state.cells[b.toCellId]!;
    return (cellA.defense + cellA.population) - (cellB.defense + cellB.population);
  });

  const move = moves[0]!;
  const attackerCell = state.cells[move.fromCellId]!;
  const defenderCell = state.cells[move.toCellId]!;

  return {
    ...move,
    estimatedWinChance: estimateWinChance(attackerCell, defenderCell, state.actionPoints, state.consecutiveWins),
  };
}

function evaluate(state: AIState): number {
  const allCells = Object.values(state.cells);
  const aiCells = allCells.filter(c => c.owner === Owner.AI);
  const playerCells = allCells.filter(c => c.owner === Owner.PLAYER);

  const aiCellCount = aiCells.length;
  const playerCellCount = playerCells.length;
  const aiTotalResources = aiCells.reduce((sum, c) => sum + c.resources, 0);
  const aiAvgDefense = aiCells.length > 0
    ? aiCells.reduce((sum, c) => sum + c.defense, 0) / aiCells.length
    : 0;

  return aiCellCount - playerCellCount + aiTotalResources * 0.1 - aiAvgDefense;
}

function applyMove(state: AIState, move: AIMove): AIState {
  const newCells: Record<string, HexCell> = {};
  for (const [id, cell] of Object.entries(state.cells)) {
    if (id === move.toCellId) {
      newCells[id] = { ...cell, owner: Owner.AI };
    } else {
      newCells[id] = { ...cell };
    }
  }
  return {
    cells: newCells,
    actionPoints: state.actionPoints,
    consecutiveWins: state.consecutiveWins + 1,
  };
}

export function getPlayerAttackableNeighbors(cells: Record<string, HexCell>): AIMove[] {
  const moves: AIMove[] = [];
  const playerCells = Object.values(cells).filter(cell => cell.owner === Owner.PLAYER);

  for (const playerCell of playerCells) {
    for (const neighborId of playerCell.neighbors) {
      const neighbor = cells[neighborId];
      if (neighbor && neighbor.owner !== Owner.PLAYER) {
        moves.push({
          fromCellId: playerCell.id,
          toCellId: neighborId,
          estimatedWinChance: 0,
        });
      }
    }
  }

  return moves;
}

export function playerAutoPlayStrategy(state: AIState): AIMove | null {
  const moves = getPlayerAttackableNeighbors(state.cells);
  if (moves.length === 0) return null;

  moves.sort((a, b) => {
    const cellA = state.cells[a.toCellId]!;
    const cellB = state.cells[b.toCellId]!;
    return (cellA.defense + cellA.population) - (cellB.defense + cellB.population);
  });

  const move = moves[0]!;
  const attackerCell = state.cells[move.fromCellId]!;
  const defenderCell = state.cells[move.toCellId]!;

  return {
    ...move,
    estimatedWinChance: estimateWinChance(attackerCell, defenderCell, state.actionPoints, state.consecutiveWins),
  };
}

function applyPlayerMove(state: AIState, move: AIMove): AIState {
  const newCells: Record<string, HexCell> = {};
  for (const [id, cell] of Object.entries(state.cells)) {
    if (id === move.toCellId) {
      newCells[id] = { ...cell, owner: Owner.PLAYER };
    } else {
      newCells[id] = { ...cell };
    }
  }
  return {
    cells: newCells,
    actionPoints: state.actionPoints,
    consecutiveWins: 0,
  };
}

const MAX_MOVES_TO_EVALUATE = 5;

function minimax(state: AIState, depth: number, isMaximizing: boolean): number {
  if (depth === 0) return evaluate(state);

  if (isMaximizing) {
    const moves = getAIAttackableNeighbors(state.cells);
    if (moves.length === 0) return evaluate(state);

    moves.sort((a, b) => {
      const cellA = state.cells[a.toCellId]!;
      const cellB = state.cells[b.toCellId]!;
      return cellA.defense - cellB.defense;
    });
    const topMoves = moves.slice(0, MAX_MOVES_TO_EVALUATE);

    let maxScore = -Infinity;
    for (const move of topMoves) {
      const newState = applyMove(state, move);
      const score = minimax(newState, depth - 1, false);
      maxScore = Math.max(maxScore, score);
    }
    return maxScore;
  } else {
    const moves = getPlayerAttackableNeighbors(state.cells);
    if (moves.length === 0) return evaluate(state);

    moves.sort((a, b) => {
      const cellA = state.cells[a.toCellId]!;
      const cellB = state.cells[b.toCellId]!;
      return cellA.defense - cellB.defense;
    });
    const topMoves = moves.slice(0, MAX_MOVES_TO_EVALUATE);

    let minScore = Infinity;
    for (const move of topMoves) {
      const newState = applyPlayerMove(state, move);
      const score = minimax(newState, depth - 1, true);
      minScore = Math.min(minScore, score);
    }
    return minScore;
  }
}

export function hardAIStrategy(state: AIState): AIMove | null {
  const moves = getAIAttackableNeighbors(state.cells);
  if (moves.length === 0) return null;

  moves.sort((a, b) => {
    const cellA = state.cells[a.toCellId]!;
    const cellB = state.cells[b.toCellId]!;
    return cellA.defense - cellB.defense;
  });
  const topMoves = moves.slice(0, MAX_MOVES_TO_EVALUATE);

  let bestScore = -Infinity;
  let bestMove: AIMove | null = null;

  for (const move of topMoves) {
    const newState = applyMove(state, move);
    const score = minimax(newState, 1, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (bestMove) {
    const attackerCell = state.cells[bestMove.fromCellId]!;
    const defenderCell = state.cells[bestMove.toCellId]!;
    return {
      ...bestMove,
      estimatedWinChance: estimateWinChance(attackerCell, defenderCell, state.actionPoints, state.consecutiveWins),
    };
  }

  return null;
}

export function getAIStrategy(difficulty: Difficulty): (state: AIState) => AIMove | null {
  switch (difficulty) {
    case Difficulty.EASY:
      return easyAIStrategy;
    case Difficulty.NORMAL:
      return normalAIStrategy;
    case Difficulty.HARD:
      return hardAIStrategy;
  }
}
