import { Board } from './Board';
import { Suspect } from './Suspect';
import { Clue } from './Clue';

/**
 * Aggregate Root: Puzzle
 * Modela un expediente o caso completo de Murdoku.
 */
export class Puzzle {
  constructor(
    public readonly id: string,
    public readonly caseNumber: number,
    public readonly title: string,
    public readonly difficulty: 'EASY' | 'NORMAL' | 'HARD',
    public readonly briefing: string,
    public readonly victimId: string,
    public readonly murdererId: string,
    public readonly suspects: readonly Suspect[],
    public readonly clues: readonly Clue[],
    public readonly initialBoard: Board
  ) {}

  public getSuspect(id: string): Suspect | undefined {
    return this.suspects.find(s => s.id === id);
  }

  public getVictim(): Suspect | undefined {
    return this.getSuspect(this.victimId);
  }

  public isMurderer(suspectId: string): boolean {
    return this.murdererId.trim().toUpperCase() === suspectId.trim().toUpperCase();
  }
}
