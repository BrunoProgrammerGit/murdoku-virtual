import { Board } from '../../domain/models/Board';
import { Coordinate } from '../../domain/models/Coordinate';
import { CellState } from '../../domain/models/CellState';
import { Puzzle } from '../../domain/models/Puzzle';
import { RuleEngine } from '../../domain/services/RuleEngine';
import { InvalidMoveException } from '../../domain/exceptions/DomainException';
import { IEvaluateMoveUseCase } from '../ports/input/IEvaluateMoveUseCase';
import { EvaluateMoveRequestDTO, EvaluateMoveResponseDTO } from '../dtos/EvaluateMoveDTO';
import { ClueEvaluationStatus } from '../../domain/strategies/IClueStrategy';

/**
 * Caso de Uso: EvaluateMoveUseCase
 * Orquesta la validación de una jugada intentada por el usuario en la interfaz.
 * Aplica el principio de Responsabilidad Única (SRP):
 * 1. Simula el movimiento en una copia inmutable del tablero.
 * 2. Delega en el servicio de dominio RuleEngine la detección de conflictos y violaciones.
 * 3. Retorna un DTO limpio para la capa de presentación.
 */
export class EvaluateMoveUseCase implements IEvaluateMoveUseCase {
  constructor(private readonly ruleEngine: RuleEngine = new RuleEngine()) {}

  public async execute(
    board: Board,
    puzzle: Puzzle,
    request: EvaluateMoveRequestDTO
  ): Promise<EvaluateMoveResponseDTO> {
    const coord = new Coordinate(request.row, request.col);

    if (!board.isWithinBounds(coord)) {
      return {
        isAllowed: false,
        isValidBoardState: false,
        message: `La casilla (${request.row}, ${request.col}) está fuera del tablero.`,
        conflicts: [],
        activeClueViolations: [],
        isSolved: false,
      };
    }

    const targetCell = board.getCell(coord);

    // 1. Validar ocupabilidad de la celda
    if (!targetCell.isOccupable && request.action === 'PLACE_SUSPECT') {
      return {
        isAllowed: false,
        isValidBoardState: false,
        message: `Movimiento inválido: La casilla contiene un obstáculo no ocupable (${targetCell.obstacleType || 'bloqueo'}).`,
        conflicts: [
          {
            type: 'OBSTACLE_COLLISION',
            message: `Casilla bloqueada por ${targetCell.obstacleType || 'terreno impasable'}.`,
            affectedCoordinates: [{ row: coord.row, col: coord.col }],
          },
        ],
        activeClueViolations: [],
        isSolved: false,
      };
    }

    // 2. Simular el tablero resultante tras la jugada
    let simulatedBoard: Board;
    try {
      switch (request.action) {
        case 'PLACE_SUSPECT':
          if (!request.suspectId) {
            throw new InvalidMoveException('Debe indicarse un identificador de sospechoso válido.');
          }
          simulatedBoard = board.placeSuspect(coord, request.suspectId);
          break;

        case 'PLACE_CROSS':
          simulatedBoard = board.placeCross(coord);
          break;

        case 'SET_NOTES':
          simulatedBoard = board.setNotes(coord, request.notes || []);
          break;

        case 'CLEAR':
          simulatedBoard = board.clearCell(coord);
          break;

        default:
          throw new InvalidMoveException(`Acción no reconocida: ${request.action}`);
      }
    } catch (err: any) {
      return {
        isAllowed: false,
        isValidBoardState: false,
        message: err.message || 'Error al procesar la jugada.',
        conflicts: [],
        activeClueViolations: [],
        isSolved: false,
      };
    }

    // 3. Evaluar con el servicio de dominio RuleEngine
    const report = this.ruleEngine.evaluate(simulatedBoard, puzzle);

    const violations = report.evaluatedClues
      .filter(c => c.status === ClueEvaluationStatus.VIOLATED)
      .map(c => c.clueId);

    return {
      isAllowed: true,
      isValidBoardState: report.isValid,
      message: report.isValid
        ? (report.isSolved ? '¡Caso completamente resuelto sin contradicciones!' : 'Movimiento válido.')
        : `Se detectaron ${report.conflicts.length} conflicto(s) o pistas violadas.`,
      conflicts: report.conflicts.map(c => ({
        type: c.type,
        message: c.message,
        affectedCoordinates: c.affectedCoordinates.map(coordObj => ({
          row: coordObj.row,
          col: coordObj.col,
        })),
        ruleOrClueId: c.ruleOrClueId,
      })),
      activeClueViolations: violations,
      isSolved: report.isSolved,
    };
  }
}
