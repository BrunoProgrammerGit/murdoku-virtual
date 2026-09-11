import { Coordinate } from '../../domain/models/Coordinate';
import { CellState } from '../../domain/models/CellState';
import { Board } from '../../domain/models/Board';
import { ICommand } from './ICommand';

/**
 * Comando Concreto: PlaceMarkCommand
 * Aplica o remueve una marca (CHECK, CROSS, NOTES, EMPTY) en una coordenada específica.
 * Almacena el estado previo de la celda para permitir su reversión exacta (Undo).
 */
export class PlaceMarkCommand implements ICommand {
  public readonly description: string;
  private previousCellState: CellState | null = null;

  constructor(
    public readonly coordinate: Coordinate,
    public readonly targetState: CellState,
    description?: string
  ) {
    this.description = description || `Modificar celda en ${coordinate.toString()} a estado ${targetState.kind}`;
  }

  public execute(currentBoard: Board): Board {
    // Guardamos el estado previo antes de aplicar la transformación
    const targetCell = currentBoard.getCell(this.coordinate);
    this.previousCellState = targetCell.state;

    return currentBoard.setCellState(this.coordinate, this.targetState);
  }

  public undo(currentBoard: Board): Board {
    if (!this.previousCellState) {
      throw new Error('No es posible revertir un comando que no ha sido ejecutado previamente.');
    }

    return currentBoard.setCellState(this.coordinate, this.previousCellState);
  }
}
