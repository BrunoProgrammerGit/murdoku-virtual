import { Board } from '../models/Board';
import { Coordinate } from '../models/Coordinate';

export enum ClueEvaluationStatus {
  SATISFIED = 'SATISFIED',         // La pista se cumple de forma irrefutable
  VIOLATED = 'VIOLATED',           // El estado actual del tablero rompe la regla
  INCONCLUSIVE = 'INCONCLUSIVE',   // Aún faltan datos para evaluar con certeza
}

export interface ClueEvaluationResult {
  status: ClueEvaluationStatus;
  message: string;
  affectedCoordinates?: Coordinate[];
}

/**
 * Patrón Strategy: IClueStrategy
 * Define el contrato desacoplado para cualquier algoritmo de validación de pistas.
 * Permite agregar nuevos tipos de pistas sin modificar el motor de reglas (Open/Closed Principle).
 */
export interface IClueStrategy {
  readonly clueType: 'DIRECT' | 'CONDITIONAL' | 'EXCLUSION' | 'GLOBAL_TOPOLOGY';
  
  /**
   * Evalúa la pista contra el estado actual del tablero.
   * @param board Tablero inmutable con las marcas actuales.
   * @param context Objeto con parámetros específicos de la pista.
   */
  evaluate(board: Board, context: Record<string, any>): ClueEvaluationResult;
}
