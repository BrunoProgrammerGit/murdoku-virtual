import { Board } from '../models/Board';
import { Coordinate } from '../models/Coordinate';
import { IClueStrategy, ClueEvaluationResult, ClueEvaluationStatus } from './IClueStrategy';

export interface ExclusionClueContext {
  suspectId: string;
  besideObstacleType?: string; // e.g. 'BEAR', 'BOULDER', 'CRATE', 'SHELF', 'BOOKSHELF'
  besideSuspectId?: string;    // Oficial: "Beside" respecto a otro sospechoso
  requireSameZoneForBeside?: boolean;
  mustBeAloneInZone?: boolean; // Oficial: "Alone" o "Only person" en zona
  aloneWithSuspectId?: string; // Oficial: "Alone with": aislados juntos en la misma región
  onlyPersonInZone?: string;   // Oficial: "Only person": único sospechoso en la sala
  onlyPersonOnFixture?: string;// Oficial: "Only person": único que ocupa un tipo de mueble
  zoneName?: string;
  maxPeopleInZone?: number;
}

/**
 * Estrategia Concreta: ExclusionClueStrategy
 * Evalúa reglas de adyacencia ortogonal estricta («Beside»), exclusión («Only person») y aislamiento mutuo («Alone with»).
 * Reglas Oficiales de Murdoku:
 * - Beside: Adyacente arriba, abajo, izquierda o derecha (ortogonal estricto, sin diagonales).
 * - Only person: Ningún otro sospechoso cumple esa condición o está en esa región/mueble.
 * - Alone with: La víctima y el asesino quedan aislados juntos en la región relevante (exactamente 2 personas).
 */
export class ExclusionClueStrategy implements IClueStrategy {
  public readonly clueType = 'EXCLUSION';

  public evaluate(board: Board, context: ExclusionClueContext): ClueEvaluationResult {
    const suspectCoord = board.findSuspectCoordinate(context.suspectId);

    if (!suspectCoord) {
      return {
        status: ClueEvaluationStatus.INCONCLUSIVE,
        message: `Falta posicionar al sospechoso "${context.suspectId}".`,
      };
    }

    const currentCell = board.getCell(suspectCoord);

    // 1. Caso Oficial «Alone with»: dos personas aisladas juntas en una región
    if (context.aloneWithSuspectId) {
      const partnerCoord = board.findSuspectCoordinate(context.aloneWithSuspectId);
      if (!partnerCoord) {
        return {
          status: ClueEvaluationStatus.INCONCLUSIVE,
          message: `Falta posicionar al sospechoso acompañante "${context.aloneWithSuspectId}".`,
        };
      }

      const partnerCell = board.getCell(partnerCoord);

      // Deben compartir la misma zona
      if (currentCell.zoneName.trim().toUpperCase() !== partnerCell.zoneName.trim().toUpperCase()) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} y ${context.aloneWithSuspectId} deben estar en la misma zona para cumplir «Alone with», pero están en "${currentCell.zoneName}" y "${partnerCell.zoneName}".`,
          affectedCoordinates: [suspectCoord, partnerCoord],
        };
      }

      // No debe haber ninguna tercera persona en esa zona
      const suspectsInZone = board.getAllCells()
        .filter(c => c.state.isCheck() && c.state.suspectId && c.zoneName.trim().toUpperCase() === currentCell.zoneName.trim().toUpperCase())
        .map(c => c.state.suspectId!);

      if (suspectsInZone.length > 2) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} y ${context.aloneWithSuspectId} no están a solas («Alone with»): hay ${suspectsInZone.length} personas en ${currentCell.zoneName} (${suspectsInZone.join(', ')}).`,
          affectedCoordinates: [suspectCoord, partnerCoord],
        };
      }

      return {
        status: ClueEvaluationStatus.SATISFIED,
        message: `${context.suspectId} y ${context.aloneWithSuspectId} se encuentran a solas («Alone with») en "${currentCell.zoneName}".`,
        affectedCoordinates: [suspectCoord, partnerCoord],
      };
    }

    // 2. Caso Oficial «Only person» en Zona o Mueble
    const targetZone = context.onlyPersonInZone || (context.mustBeAloneInZone ? context.zoneName : undefined);
    if (targetZone) {
      const zoneCells = board.getCellsInZone(targetZone);
      const suspectsInZone = zoneCells.filter(c => c.state.isCheck() && c.state.suspectId);

      // Verificar si el sospechoso está en la zona requerida
      if (currentCell.zoneName.trim().toUpperCase() !== targetZone.trim().toUpperCase()) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} debe ser la única persona («Only person») en "${targetZone}", pero se encuentra en "${currentCell.zoneName}".`,
          affectedCoordinates: [suspectCoord],
        };
      }

      if (suspectsInZone.length > 1) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} debe ser la única persona («Only person») en "${targetZone}", pero hay ${suspectsInZone.length} sospechosos presentes.`,
          affectedCoordinates: suspectsInZone.map(c => c.coordinate),
        };
      }

      return {
        status: ClueEvaluationStatus.SATISFIED,
        message: `${context.suspectId} es la única persona («Only person») en "${targetZone}".`,
        affectedCoordinates: [suspectCoord],
      };
    }

    // 3. Caso Oficial «Beside» a otro sospechoso (Adyacente ortogonal: arriba, abajo, izq, der)
    if (context.besideSuspectId) {
      const refCoord = board.findSuspectCoordinate(context.besideSuspectId);
      if (!refCoord) {
        return {
          status: ClueEvaluationStatus.INCONCLUSIVE,
          message: `Falta posicionar al sospechoso de referencia "${context.besideSuspectId}".`,
        };
      }

      const orthogonalDist = Math.abs(suspectCoord.row - refCoord.row) + Math.abs(suspectCoord.col - refCoord.col);
      const refCell = board.getCell(refCoord);

      if (orthogonalDist !== 1) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} debe estar inmediatamente al lado («Beside»: adyacente ortogonal) de ${context.besideSuspectId}.`,
          affectedCoordinates: [suspectCoord, refCoord],
        };
      }

      if (context.requireSameZoneForBeside && currentCell.zoneName.trim().toUpperCase() !== refCell.zoneName.trim().toUpperCase()) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} debe estar al lado de ${context.besideSuspectId} dentro de la misma zona.`,
          affectedCoordinates: [suspectCoord, refCoord],
        };
      }

      return {
        status: ClueEvaluationStatus.SATISFIED,
        message: `${context.suspectId} está al lado («Beside») de ${context.besideSuspectId}.`,
        affectedCoordinates: [suspectCoord, refCoord],
      };
    }

    // 4. Caso Oficial «Beside» a un obstáculo (ej: estantería, oso, roca)
    if (context.besideObstacleType) {
      const obstacleUpper = context.besideObstacleType.toUpperCase();
      const orthogonalDeltas = [
        { r: -1, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: -1 },
        { r: 0, c: 1 },
      ];

      let foundBeside = false;
      const matchingCoords: Coordinate[] = [];

      for (const delta of orthogonalDeltas) {
        const neighborCoord = new Coordinate(suspectCoord.row + delta.r, suspectCoord.col + delta.c);
        if (board.isWithinBounds(neighborCoord)) {
          const neighborCell = board.getCell(neighborCoord);
          const sameZone = neighborCell.zoneName.trim().toUpperCase() === currentCell.zoneName.trim().toUpperCase();
          const obsType = (neighborCell.obstacleType || neighborCell.fixtureIcon || '').toUpperCase();

          if (sameZone && obsType.includes(obstacleUpper)) {
            foundBeside = true;
            matchingCoords.push(neighborCoord);
          }
        }
      }

      if (!foundBeside) {
        return {
          status: ClueEvaluationStatus.VIOLATED,
          message: `${context.suspectId} debe estar al lado («Beside»: adyacente arriba, abajo, izq o der) de un obstáculo ${context.besideObstacleType} dentro de la misma área ("${currentCell.zoneName}").`,
          affectedCoordinates: [suspectCoord],
        };
      }

      return {
        status: ClueEvaluationStatus.SATISFIED,
        message: `${context.suspectId} cumple la regla «Beside» respecto a ${context.besideObstacleType} en su zona.`,
        affectedCoordinates: [suspectCoord, ...matchingCoords],
      };
    }

    return {
      status: ClueEvaluationStatus.INCONCLUSIVE,
      message: 'Evaluación de exclusión inconclusa.',
    };
  }
}
