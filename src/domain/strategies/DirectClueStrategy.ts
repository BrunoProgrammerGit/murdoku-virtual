import { Board } from '../models/Board';
import { IClueStrategy, ClueEvaluationResult, ClueEvaluationStatus } from './IClueStrategy';

export interface DirectClueContext {
  suspectId: string;
  expectedZone?: string;
  expectedFixture?: string; // e.g. 'CHAIR', 'BOAT', 'DOCK'
  exactRow?: number;
  exactCol?: number;
}

/**
 * Estrategia Concreta: DirectClueStrategy
 * Evalúa pistas de ubicación directa o confinamiento en una zona/objeto específico.
 * Ejemplo: "Iris estaba sentada en la silla", "Delilah estaba en el Fish Market".
 */
export class DirectClueStrategy implements IClueStrategy {
  public readonly clueType = 'DIRECT';

  public evaluate(board: Board, context: DirectClueContext): ClueEvaluationResult {
    const suspectCoord = board.findSuspectCoordinate(context.suspectId);

    // Si el sospechoso aún no ha sido posicionado, el estado es inconcluso
    if (!suspectCoord) {
      return {
        status: ClueEvaluationStatus.INCONCLUSIVE,
        message: `El sospechoso "${context.suspectId}" aún no ha sido posicionado en el tablero.`,
      };
    }

    const cell = board.getCell(suspectCoord);

    // 1. Validación de Zona
    if (context.expectedZone) {
      const match = cell.zoneName.trim().toUpperCase() === context.expectedZone.trim().toUpperCase();
      if (!match) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} debe estar en "${context.expectedZone}", pero está en "${cell.zoneName}".`,
          affectedCoordinates: [suspectCoord],
        };
      }
    }

    // 2. Validación de Mueble/Accesorio (Ej: Silla, Bote)
    if (context.expectedFixture) {
      const fixture = (cell.obstacleType || cell.fixtureIcon || '').toUpperCase();
      const expected = context.expectedFixture.toUpperCase();
      const matchesFixture = fixture.includes(expected) || (expected === 'CHAIR' && cell.fixtureIcon === '🪑');

      if (!matchesFixture) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} debe estar ocupando "${context.expectedFixture}".`,
          affectedCoordinates: [suspectCoord],
        };
      }
    }

    // 3. Validación de Fila o Columna exacta
    if (context.exactRow !== undefined && suspectCoord.row !== context.exactRow) {
      return {
        status: ClueEvaluationStatus.VIOLATED,
        message: `${context.suspectId} debe estar en la fila ${context.exactRow}, pero está en la fila ${suspectCoord.row}.`,
        affectedCoordinates: [suspectCoord],
      };
    }

    if (context.exactCol !== undefined && suspectCoord.col !== context.exactCol) {
      return {
        status: ClueEvaluationStatus.VIOLATED,
        message: `${context.suspectId} debe estar en la columna ${context.exactCol}, pero está en la columna ${suspectCoord.col}.`,
        affectedCoordinates: [suspectCoord],
      };
    }

    return {
      status: ClueEvaluationStatus.SATISFIED,
      message: `Pista directa cumplida: ${context.suspectId} está ubicado correctamente en ${suspectCoord}.`,
      affectedCoordinates: [suspectCoord],
    };
  }
}
