import { Board } from '../models/Board';
import { IClueStrategy, ClueEvaluationResult, ClueEvaluationStatus } from './IClueStrategy';

export interface ConditionalClueContext {
  primarySuspectId: string;
  referenceSuspectId?: string;
  referenceObstacle?: string;
  relativeRows?: number; // Desplazamiento exacto de filas: Negativo = Norte (arriba), Positivo = Sur (abajo)
  relativeCols?: number; // Desplazamiento exacto de columnas: Negativo = Oeste (izquierda), Positivo = Este (derecha)
  isSouthOf?: boolean;   // Regla Oficial Murdoku: "Más abajo en el mapa que la referencia" (row > ref.row)
  isNorthOf?: boolean;   // Regla Oficial Murdoku: "Más arriba en el mapa que la referencia" (row < ref.row)
  isEastOf?: boolean;    // Regla Oficial Murdoku: "Más a la derecha en el mapa" (col > ref.col)
  isWestOf?: boolean;    // Regla Oficial Murdoku: "Más a la izquierda en el mapa" (col < ref.col)
  sameColumn?: boolean;
  sameRow?: boolean;
}

/**
 * Estrategia Concreta: ConditionalClueStrategy
 * Evalúa relaciones de distancia geométrica o dirección cardinal entre dos entidades.
 * Ejemplo: "Brianna estaba exactamente 2 filas al norte de Finlay", "Claire estaba al este de Antonio".
 */
export class ConditionalClueStrategy implements IClueStrategy {
  public readonly clueType = 'CONDITIONAL';

  public evaluate(board: Board, context: ConditionalClueContext): ClueEvaluationResult {
    const primaryCoord = board.findSuspectCoordinate(context.primarySuspectId);

    if (!primaryCoord) {
      return {
        status: ClueEvaluationStatus.INCONCLUSIVE,
        message: `Falta posicionar al sospechoso principal "${context.primarySuspectId}".`,
      };
    }

    // 1. Relación respecto a otro sospechoso
    if (context.referenceSuspectId) {
      const refCoord = board.findSuspectCoordinate(context.referenceSuspectId);
      if (!refCoord) {
        return {
          status: ClueEvaluationStatus.INCONCLUSIVE,
          message: `Falta posicionar al sospechoso de referencia "${context.referenceSuspectId}".`,
        };
      }

      // Validar término oficial "South of" (Más abajo en el mapa: row > refCoord.row)
      if (context.isSouthOf && primaryCoord.row <= refCoord.row) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.primarySuspectId} debe estar más abajo en el mapa («South of») que ${context.referenceSuspectId}.`,
          affectedCoordinates: [primaryCoord, refCoord],
        };
      }

      // Validar término oficial "North of" (Más arriba en el mapa: row < refCoord.row)
      if (context.isNorthOf && primaryCoord.row >= refCoord.row) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.primarySuspectId} debe estar más arriba en el mapa («North of») que ${context.referenceSuspectId}.`,
          affectedCoordinates: [primaryCoord, refCoord],
        };
      }

      // Validar término oficial "East of" (Más a la derecha: col > refCoord.col)
      if (context.isEastOf && primaryCoord.col <= refCoord.col) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.primarySuspectId} debe estar al este («East of») de ${context.referenceSuspectId}.`,
          affectedCoordinates: [primaryCoord, refCoord],
        };
      }

      // Validar término oficial "West of" (Más a la izquierda: col < refCoord.col)
      if (context.isWestOf && primaryCoord.col >= refCoord.col) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.primarySuspectId} debe estar al oeste («West of») de ${context.referenceSuspectId}.`,
          affectedCoordinates: [primaryCoord, refCoord],
        };
      }

      // Validar misma columna o misma fila
      if (context.sameColumn && primaryCoord.col !== refCoord.col) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.primarySuspectId} y ${context.referenceSuspectId} deben compartir la misma columna.`,
          affectedCoordinates: [primaryCoord, refCoord],
        };
      }

      if (context.sameRow && primaryCoord.row !== refCoord.row) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.primarySuspectId} y ${context.referenceSuspectId} deben compartir la misma fila.`,
          affectedCoordinates: [primaryCoord, refCoord],
        };
      }

      // Validar filas relativas con desplazamiento numérico (Norte / Sur)
      if (context.relativeRows !== undefined) {
        const expectedRow = refCoord.row + context.relativeRows;
        if (primaryCoord.row !== expectedRow) {
          const dirName = context.relativeRows < 0 ? 'norte' : 'sur';
          return {
            status: ClueEvaluationStatus.VIOLATED,
            message: `${context.primarySuspectId} debe estar ${Math.abs(context.relativeRows)} fila(s) al ${dirName} de ${context.referenceSuspectId}.`,
            affectedCoordinates: [primaryCoord, refCoord],
          };
        }
      }

      // Validar columnas relativas con desplazamiento numérico (Oeste / Este)
      if (context.relativeCols !== undefined) {
        if (context.relativeCols > 0 && primaryCoord.col <= refCoord.col) {
          return {
            status: ClueEvaluationStatus.VIOLATED,
            message: `${context.primarySuspectId} debe estar al este de ${context.referenceSuspectId}.`,
            affectedCoordinates: [primaryCoord, refCoord],
          };
        }
        if (context.relativeCols < 0 && primaryCoord.col >= refCoord.col) {
          return {
            status: ClueEvaluationStatus.VIOLATED,
            message: `${context.primarySuspectId} debe estar al oeste de ${context.referenceSuspectId}.`,
            affectedCoordinates: [primaryCoord, refCoord],
          };
        }
      }

      return {
        status: ClueEvaluationStatus.SATISFIED,
        message: `Pista condicional cumplida entre ${context.primarySuspectId} y ${context.referenceSuspectId}.`,
        affectedCoordinates: [primaryCoord, refCoord],
      };
    }

    // 2. Relación respecto a un obstáculo en el mapa (ej. oso 4 filas al norte)
    if (context.referenceObstacle) {
      const obstacleName = context.referenceObstacle.toUpperCase();
      const allCells = board.getAllCells();
      const matchingObstacles = allCells.filter(
        c => (c.obstacleType || '').toUpperCase() === obstacleName
      );

      if (matchingObstacles.length === 0) {
        return {
          status: ClueEvaluationStatus.INCONCLUSIVE,
          message: `No se encontraron obstáculos de tipo "${context.referenceObstacle}".`,
        };
      }

      // Comprobar si algún obstáculo cumple la relación
      const matches = matchingObstacles.some(obsCell => {
        if (context.sameColumn && obsCell.coordinate.col !== primaryCoord.col) return false;
        if (context.relativeRows !== undefined) {
          const expectedRow = primaryCoord.row + context.relativeRows;
          return obsCell.coordinate.row === expectedRow;
        }
        return true;
      });

      if (!matches) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.primarySuspectId} no cumple la distancia requerida con respecto al obstáculo (${context.referenceObstacle}).`,
          affectedCoordinates: [primaryCoord],
        };
      }

      return {
        status: ClueEvaluationStatus.SATISFIED,
        message: `Pista condicional respecto a ${context.referenceObstacle} cumplida.`,
        affectedCoordinates: [primaryCoord],
      };
    }

    return {
      status: ClueEvaluationStatus.INCONCLUSIVE,
      message: 'Información insuficiente en el contexto de la pista condicional.',
    };
  }
}
