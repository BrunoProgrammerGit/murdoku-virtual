import { Board } from '../../domain/models/Board';
import { Coordinate } from '../../domain/models/Coordinate';
import { CellState } from '../../domain/models/CellState';
import { Puzzle } from '../../domain/models/Puzzle';
import { RuleEngine, RuleEngineReport } from '../../domain/services/RuleEngine';
import { CommandManager } from '../../application/commands/CommandManager';
import { PlaceMarkCommand } from '../../application/commands/PlaceMarkCommand';
import { EvaluateMoveUseCase } from '../../application/use-cases/EvaluateMoveUseCase';
import { IPuzzleRepository } from '../../application/ports/output/IPuzzleRepository';
import { EvaluateMoveResponseDTO } from '../../application/dtos/EvaluateMoveDTO';

/**
 * Presenter / Controller: MurdokuGameController
 * Adaptador de Entrada Primario (Driving Adapter).
 * Actúa como intermediario entre la interfaz gráfica (React) y la capa de Aplicación/Dominio.
 * No depende de ningún framework visual, lo que facilita cambiar de React a Vue o CLI sin alterar la lógica.
 */
export class MurdokuGameController {
  private currentBoard: Board;
  private currentPuzzle: Puzzle;
  private readonly commandManager: CommandManager;
  private readonly evaluateMoveUseCase: EvaluateMoveUseCase;
  private readonly ruleEngine: RuleEngine;

  constructor(
    puzzle: Puzzle,
    private readonly puzzleRepository: IPuzzleRepository
  ) {
    this.currentPuzzle = puzzle;
    this.currentBoard = puzzle.initialBoard;
    this.commandManager = new CommandManager();
    this.ruleEngine = new RuleEngine();
    this.evaluateMoveUseCase = new EvaluateMoveUseCase(this.ruleEngine);
  }

  public getBoard(): Board {
    return this.currentBoard;
  }

  public getPuzzle(): Puzzle {
    return this.currentPuzzle;
  }

  public getCommandManager(): CommandManager {
    return this.commandManager;
  }

  /**
   * Cambia el caso de investigación actual.
   */
  public async loadCase(caseNumber: number): Promise<boolean> {
    const puzzle = await this.puzzleRepository.findByCaseNumber(caseNumber);
    if (!puzzle) return false;

    this.currentPuzzle = puzzle;
    this.currentBoard = puzzle.initialBoard;
    this.commandManager.clear();
    return true;
  }

  /**
   * Procesa una jugada en el tablero usando el Patrón Command y evaluando reglas.
   */
  public async handleCellAction(
    row: number,
    col: number,
    actionType: 'STAMP' | 'CROSS' | 'NOTES' | 'ERASE',
    suspectId?: string,
    notes?: string[]
  ): Promise<{ board: Board; evaluation: EvaluateMoveResponseDTO }> {
    const coord = new Coordinate(row, col);

    // 1. Evaluar jugada a través del caso de uso
    let targetState = CellState.empty();
    let actionDTO: 'PLACE_SUSPECT' | 'PLACE_CROSS' | 'SET_NOTES' | 'CLEAR' = 'CLEAR';

    if (actionType === 'STAMP' && suspectId) {
      targetState = CellState.check(suspectId);
      actionDTO = 'PLACE_SUSPECT';
    } else if (actionType === 'CROSS') {
      targetState = CellState.cross();
      actionDTO = 'PLACE_CROSS';
    } else if (actionType === 'NOTES') {
      targetState = CellState.notes(notes || (suspectId ? [suspectId] : []));
      actionDTO = 'SET_NOTES';
    } else if (actionType === 'ERASE') {
      targetState = CellState.empty();
      actionDTO = 'CLEAR';
    }

    const evaluation = await this.evaluateMoveUseCase.execute(
      this.currentBoard,
      this.currentPuzzle,
      {
        row,
        col,
        action: actionDTO,
        suspectId,
        notes,
      }
    );

    // Si la celda es físicamente inaccesible (obstáculo impenetrable), no aplicamos comando
    if (!evaluation.isAllowed) {
      return { board: this.currentBoard, evaluation };
    }

    // 2. Ejecutar mediante el CommandManager (soporte para Undo/Redo)
    const command = new PlaceMarkCommand(coord, targetState);
    this.currentBoard = this.commandManager.executeCommand(command, this.currentBoard);

    return { board: this.currentBoard, evaluation };
  }

  /**
   * Deshace la última jugada.
   */
  public undo(): Board | null {
    const result = this.commandManager.undo(this.currentBoard);
    if (result) {
      this.currentBoard = result.board;
      return this.currentBoard;
    }
    return null;
  }

  /**
   * Rehace la última jugada deshecha.
   */
  public redo(): Board | null {
    const result = this.commandManager.redo(this.currentBoard);
    if (result) {
      this.currentBoard = result.board;
      return this.currentBoard;
    }
    return null;
  }

  /**
   * Ejecuta el análisis forense global con el RuleEngine.
   */
  public getForensicReport(): RuleEngineReport {
    return this.ruleEngine.evaluate(this.currentBoard, this.currentPuzzle);
  }

  /**
   * Emite la acusación formal final contra un sospechoso.
   */
  public accuseCulprit(suspectId: string): { isCorrect: boolean; reason: string } {
    return this.ruleEngine.verifyAccusation(this.currentBoard, this.currentPuzzle, suspectId);
  }
}
