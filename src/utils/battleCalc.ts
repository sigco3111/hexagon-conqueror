import type { HexCell, BattleResult } from '@/types/game';

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function calculateAttackPower(
  actionPoints: number,
  population: number,
  consecutiveWins: number,
  resources: number,
): number {
  return (actionPoints + population / 10 + resources / 20) * (1 + consecutiveWins * 0.1);
}

export function calculateDefensePower(baseDefense: number, diceRoll: number): number {
  return baseDefense + diceRoll;
}

export function resolveBattle(
  attackerCell: HexCell,
  defenderCell: HexCell,
  actionPoints: number,
  consecutiveWins: number,
): BattleResult {
  const diceRoll = rollDice();
  const attackPower = calculateAttackPower(actionPoints, attackerCell.population, consecutiveWins, attackerCell.resources);
  const defensePower = calculateDefensePower(defenderCell.defense, diceRoll);

  return {
    attackerCellId: attackerCell.id,
    defenderCellId: defenderCell.id,
    attackPower,
    defensePower,
    diceRoll,
    success: attackPower > defensePower,
    timestamp: Date.now(),
    attackerOwner: attackerCell.owner,
  };
}
