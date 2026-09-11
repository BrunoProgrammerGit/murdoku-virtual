import { Board } from '../models/Board';
import { Coordinate } from '../models/Coordinate';
import { Puzzle } from '../models/Puzzle';
import { ClueEvaluationStatus, ClueEvaluationResult } from '../strategies/IClueStrategy';

export interface RuleConflict {
  type: 'ROW_COLLISION' | 'COL_COLLISION' | 'DUPLICATE_SUSPECT' | 'OBSTACLE_COLLISION' | 'CLUE_VIOLATION';
  message: string;
  affectedCoordinates: Coordinate[];
  ruleOrClueId?: string;
}

export interface RuleEngineReport {
  isValid: boolean;
  conflicts: RuleConflict[];
  evaluatedClues: {
    clueId: string;
    status: ClueEvaluationStatus;
    message: string;
  }[];
  totalSuspectsPlaced: number;
  allSuspectsPlaced: boolean;
  isSolved: boolean;
}

/**
 * Domain Service: RuleEngine
 * Servicio de dominio puro (sin dependencias de frameworks ni UI).
 * Aplica la lógica de reglas fundamentales de Murdoku y coordina la evaluación
 * de todas las pistas del caso.
 */
export class RuleEngine {
  /**
   * Ejecuta una auditoría forense completa sobre el tablero actual.
   */
  public evaluate(board: Board, puzzle: Puzzle): RuleEngineReport {
    const conflicts: RuleConflict[] = [];

    // 1. Regla Oficial 01: Una persona por fila y columna
    for (let r = 0; r < board.rows; r++) {
      const suspectsInRow = board.getSuspectsInRow(r);
      if (suspectsInRow.length > 1) {
        conflicts.push({
          type: 'ROW_COLLISION',
          message: `Violación de la Regla Oficial 01 (Una persona por fila): Hay ${suspectsInRow.length} personas en la Fila ${r + 1} (${suspectsInRow.map(s => s.suspectId).join(', ')}). Cada fila solo puede contener a una persona.`,
          affectedCoordinates: suspectsInRow.map(s => s.coordinate),
        });
      }
    }

    // 2. Regla Oficial 01: Máximo 1 persona por columna
    for (let c = 0; c < board.cols; c++) {
      const suspectsInCol = board.getSuspectsInCol(c);
      if (suspectsInCol.length > 1) {
        conflicts.push({
          type: 'COL_COLLISION',
          message: `Violación de la Regla Oficial 01 (Una persona por columna): Hay ${suspectsInCol.length} personas en la Columna ${c + 1} (${suspectsInCol.map(s => s.suspectId).join(', ')}). Cada columna solo puede contener a una persona.`,
          affectedCoordinates: suspectsInCol.map(s => s.coordinate),
        });
      }
    }

    // 3. Regla Fundamental de Identidad: Un sospechoso no puede estar en dos casillas a la vez
    const seenSuspects = new Map<string, Coordinate[]>();
    for (const cell of board.getAllCells()) {
      if (cell.state.isCheck() && cell.state.suspectId) {
        const list = seenSuspects.get(cell.state.suspectId) || [];
        list.push(cell.coordinate);
        seenSuspects.set(cell.state.suspectId, list);
      }
    }

    for (const [suspectId, coords] of seenSuspects.entries()) {
      if (coords.length > 1) {
        conflicts.push({
          type: 'DUPLICATE_SUSPECT',
          message: `Sospechoso duplicado: "${suspectId}" aparece marcado en múltiples casillas (${coords.join(', ')}).`,
          affectedCoordinates: coords,
        });
      }
    }

    // 4. Regla Oficial 02: Todas las pistas deben cumplirse (Patrón Strategy)
    const evaluatedClues: { clueId: string; status: ClueEvaluationStatus; message: string }[] = [];

    for (const clue of puzzle.clues) {
      const result: ClueEvaluationResult = clue.evaluate(board);
      evaluatedClues.push({
        clueId: clue.id,
        status: result.status,
        message: result.message,
      });

      if (result.status === ClueEvaluationStatus.VIOLATED) {
        conflicts.push({
          type: 'CLUE_VIOLATION',
          message: `Regla Oficial 02 (Pista rota) [${clue.id}]: ${result.message}`,
          affectedCoordinates: result.affectedCoordinates || [],
          ruleOrClueId: clue.id,
        });
      }
    }

    // 5. Estado de resolución
    const totalPlaced = seenSuspects.size;
    const allSuspectsPlaced = totalPlaced === puzzle.suspects.length;
    const allCluesSatisfied = evaluatedClues.every(
      c => c.status === ClueEvaluationStatus.SATISFIED
    );
    const noConflicts = conflicts.length === 0;

    const isSolved = allSuspectsPlaced && allCluesSatisfied && noConflicts;

    return {
      isValid: noConflicts,
      conflicts,
      evaluatedClues,
      totalSuspectsPlaced: totalPlaced,
      allSuspectsPlaced,
      isSolved,
    };
  }

  /**
   * Verifica la acusación final aplicando la Regla Oficial 04:
   * "Con el tablero resuelto, el asesino es quien queda a solas con la víctima dentro de la misma zona."
   */
  public verifyAccusation(board: Board, puzzle: Puzzle, accusedSuspectId: string): {
    isCorrect: boolean;
    reason: string;
  } {
    const victimCoord = board.findSuspectCoordinate(puzzle.victimId);
    const murdererCoord = board.findSuspectCoordinate(accusedSuspectId);

    if (!victimCoord) {
      return {
        isCorrect: false,
        reason: `Regla Oficial 04: La víctima (${puzzle.victimId}) aún no ha sido ubicada en el tablero.`,
      };
    }

    if (!murdererCoord) {
      return {
        isCorrect: false,
        reason: `Regla Oficial 04: El sospechoso acusado (${accusedSuspectId}) debe estar ubicado en el tablero para comprobar el contacto con la víctima.`,
      };
    }

    const victimCell = board.getCell(victimCoord);
    const murdererCell = board.getCell(murdererCoord);

    // 1. Deben estar en la misma zona
    if (victimCell.zoneName.trim().toUpperCase() !== murdererCell.zoneName.trim().toUpperCase()) {
      return {
        isCorrect: false,
        reason: `Violación de la Regla Oficial 04 («Alone with»): El asesino y la víctima deben compartir la misma zona ("${victimCell.zoneName}"), pero ${accusedSuspectId} está en "${murdererCell.zoneName}".`,
      };
    }

    // 2. Deben estar estrictamente A SOLAS en esa zona (exactamente 2 personas: víctima y asesino)
    const suspectsInZone = board.getAllCells()
      .filter(c => c.state.isCheck() && c.state.suspectId && c.zoneName.trim().toUpperCase() === victimCell.zoneName.trim().toUpperCase())
      .map(c => c.state.suspectId!);

    if (suspectsInZone.length > 2) {
      return {
        isCorrect: false,
        reason: `Violación de la Regla Oficial 04 («Alone with»): En la zona "${victimCell.zoneName}" hay ${suspectsInZone.length} personas presentes (${suspectsInZone.join(', ')}). El asesino debe quedar estrictamente A SOLAS con la víctima.`,
      };
    }

    // 3. Verificar si el acusado es el asesino designado
    if (!puzzle.isMurderer(accusedSuspectId)) {
      return {
        isCorrect: false,
        reason: `Aunque ${accusedSuspectId} comparte la zona con la víctima, las coartadas y pistas lo descartan como el autor material del crimen.`,
      };
    }

    return {
      isCorrect: true,
      reason: `¡Veredicto confirmado según las 4 Reglas Oficiales de Murdoku! ${accusedSuspectId} quedó a solas («Alone with») con la víctima ${puzzle.victimId} en ${victimCell.zoneName} y perpetró el asesinato.`,
    };
  }
}
