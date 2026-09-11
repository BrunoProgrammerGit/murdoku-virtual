import { Board } from './Board';
import { IClueStrategy, ClueEvaluationResult } from '../strategies/IClueStrategy';

/**
 * Entity: Clue
 * Representa una pista del caso de investigación.
 * Delega la validación algorítmica en una estrategia inyectada (Strategy Pattern).
 */
export class Clue {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly strategy: IClueStrategy,
    public readonly context: Record<string, any>,
    public readonly suspectId?: string,
    public readonly icon: string = '🔍',
    public readonly tag: string = ''
  ) {}

  /**
   * Ejecuta la evaluación de la regla usando la estrategia asociada.
   */
  public evaluate(board: Board): ClueEvaluationResult {
    return this.strategy.evaluate(board, this.context);
  }
}
