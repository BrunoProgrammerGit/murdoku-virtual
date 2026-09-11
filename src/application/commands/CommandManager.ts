import { Board } from '../../domain/models/Board';
import { ICommand } from './ICommand';

/**
 * Gestor del Patrón Command: CommandManager
 * Administra las pilas de operaciones para soportar Deshacer (Undo) y Rehacer (Redo).
 * Mantiene la inmutabilidad: cada acción devuelve la nueva instancia de Board generada.
 */
export class CommandManager {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];

  constructor(private readonly maxHistorySize: number = 50) {}

  /**
   * Ejecuta un nuevo comando, lo apila en Undo y vacía la pila de Redo.
   */
  public executeCommand(command: ICommand, currentBoard: Board): Board {
    const updatedBoard = command.execute(currentBoard);

    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Una nueva acción invalida la rama de rehacer
    this.redoStack = [];

    return updatedBoard;
  }

  /**
   * Deshace la última acción realizada.
   */
  public undo(currentBoard: Board): { board: Board; command: ICommand } | null {
    const commandToUndo = this.undoStack.pop();
    if (!commandToUndo) return null;

    const revertedBoard = commandToUndo.undo(currentBoard);
    this.redoStack.push(commandToUndo);

    return { board: revertedBoard, command: commandToUndo };
  }

  /**
   * Rehace la última acción deshecha.
   */
  public redo(currentBoard: Board): { board: Board; command: ICommand } | null {
    const commandToRedo = this.redoStack.pop();
    if (!commandToRedo) return null;

    const reAppliedBoard = commandToRedo.execute(currentBoard);
    this.undoStack.push(commandToRedo);

    return { board: reAppliedBoard, command: commandToRedo };
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public getRedoCount(): number {
    return this.redoStack.length;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
