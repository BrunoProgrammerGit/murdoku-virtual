import { Coordinate } from './Coordinate';
import { CellState } from './CellState';
import { InvalidMoveException } from '../exceptions/DomainException';

export type ObstacleType = 'BEAR' | 'TREE' | 'BOULDER' | 'SHRUB' | 'BENCH' | 'LAKE' | 'CRATE' | 'SHELF' | 'BOX' | 'TABLE' | 'BOOKSHELF' | 'PLANT' | 'ARMCHAIR' | 'RUG' | null;

/**
 * Value Object / Sub-Entity: Cell
 * Representa una celda indivisible del tablero.
 * Sigue inmutabilidad: el cambio de estado retorna una nueva instancia de Cell.
 */
export class Cell {
  constructor(
    public readonly coordinate: Coordinate,
    public readonly zoneName: string,
    public readonly obstacleType: ObstacleType = null,
    public readonly isOccupable: boolean = true,
    public readonly fixtureIcon: string = '',
    public readonly state: CellState = CellState.empty()
  ) {}

  /**
   * Genera una nueva celda con el nuevo estado especificado garantizando inmutabilidad.
   */
  public withState(newState: CellState): Cell {
    if (!this.isOccupable && (newState.isCheck() || newState.isNotes())) {
      throw new InvalidMoveException(
        `No es posible ubicar sospechosos ni notas en la casilla ${this.coordinate} porque contiene un obstáculo no ocupable (${this.obstacleType || 'bloqueado'}).`,
        { row: this.coordinate.row, col: this.coordinate.col }
      );
    }

    return new Cell(
      this.coordinate,
      this.zoneName,
      this.obstacleType,
      this.isOccupable,
      this.fixtureIcon,
      newState
    );
  }

  public hasSuspect(suspectId?: string): boolean {
    if (!this.state.isCheck()) return false;
    if (suspectId) return this.state.suspectId === suspectId;
    return this.state.suspectId !== null;
  }
}
