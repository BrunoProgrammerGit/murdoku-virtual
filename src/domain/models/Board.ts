import { Coordinate } from './Coordinate';
import { Cell } from './Cell';
import { CellState } from './CellState';
import { InvalidMoveException } from '../exceptions/DomainException';

/**
 * Entity / Aggregate Root: Board
 * Representa la cuadrícula ortogonal del juego Murdoku.
 * Implementa métodos puramente inmutables para realizar marcas, respetando
 * los principios funcionales y de DDD.
 */
export class Board {
  private readonly matrix: readonly (readonly Cell[])[];

  constructor(
    public readonly rows: number,
    public readonly cols: number,
    cellsMatrix: Cell[][]
  ) {
    if (rows <= 0 || cols <= 0) {
      throw new Error(`Dimensiones del tablero inválidas: ${rows}x${cols}`);
    }
    if (cellsMatrix.length !== rows) {
      throw new Error(`La matriz debe tener exactamente ${rows} filas.`);
    }

    // Clonamos profundamente de forma inmutable para evitar efectos secundarios
    this.matrix = Object.freeze(
      cellsMatrix.map(row => Object.freeze([...row]))
    );
  }

  /**
   * Obtiene la celda en la coordenada dada.
   */
  public getCell(coordinate: Coordinate): Cell {
    this.validateBounds(coordinate);
    return this.matrix[coordinate.row][coordinate.col];
  }

  public getCellAt(row: number, col: number): Cell {
    return this.getCell(new Coordinate(row, col));
  }

  /**
   * Método inmutable para actualizar el estado de una celda.
   * Retorna una NUEVA instancia de Board sin alterar la actual.
   */
  public setCellState(coordinate: Coordinate, newState: CellState): Board {
    this.validateBounds(coordinate);

    const currentCell = this.getCell(coordinate);
    const updatedCell = currentCell.withState(newState);

    const newMatrix: Cell[][] = this.matrix.map((rowCells, rIdx) => {
      if (rIdx !== coordinate.row) {
        return [...rowCells];
      }
      return rowCells.map((cell, cIdx) => (cIdx === coordinate.col ? updatedCell : cell));
    });

    return new Board(this.rows, this.cols, newMatrix);
  }

  /**
   * Fija a un sospechoso en la casilla especificada (Inmutable).
   */
  public placeSuspect(coordinate: Coordinate, suspectId: string): Board {
    return this.setCellState(coordinate, CellState.check(suspectId));
  }

  /**
   * Tacha una celda con cruz de descarte (Inmutable).
   */
  public placeCross(coordinate: Coordinate): Board {
    return this.setCellState(coordinate, CellState.cross());
  }

  /**
   * Limpia el estado de una celda devolviéndola a EMPTY (Inmutable).
   */
  public clearCell(coordinate: Coordinate): Board {
    return this.setCellState(coordinate, CellState.empty());
  }

  /**
   * Establece candidatos preliminares / notas en una celda (Inmutable).
   */
  public setNotes(coordinate: Coordinate, candidates: string[]): Board {
    return this.setCellState(coordinate, CellState.notes(candidates));
  }

  /**
   * Encuentra la coordenada donde un sospechoso está fijado (o null si aún no está posicionado).
   */
  public findSuspectCoordinate(suspectId: string): Coordinate | null {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.matrix[r][c];
        if (cell.state.isCheck() && cell.state.suspectId === suspectId) {
          return cell.coordinate;
        }
      }
    }
    return null;
  }

  /**
   * Retorna todas las celdas pertenecientes a una zona específica (ej: "PINE FOREST", "SUMMIT").
   */
  public getCellsInZone(zoneName: string): Cell[] {
    const normalized = zoneName.trim().toUpperCase();
    const result: Cell[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.matrix[r][c];
        if (cell.zoneName.trim().toUpperCase() === normalized) {
          result.push(cell);
        }
      }
    }
    return result;
  }

  /**
   * Retorna una lista plana con todas las celdas del tablero.
   */
  public getAllCells(): Cell[] {
    const cells: Cell[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        cells.push(this.matrix[r][c]);
      }
    }
    return cells;
  }

  /**
   * Retorna todos los sospechosos fijados en una fila determinada.
   */
  public getSuspectsInRow(row: number): { suspectId: string; coordinate: Coordinate }[] {
    if (row < 0 || row >= this.rows) return [];
    const results: { suspectId: string; coordinate: Coordinate }[] = [];
    for (let c = 0; c < this.cols; c++) {
      const cell = this.matrix[row][c];
      if (cell.state.isCheck() && cell.state.suspectId) {
        results.push({ suspectId: cell.state.suspectId, coordinate: cell.coordinate });
      }
    }
    return results;
  }

  /**
   * Retorna todos los sospechosos fijados en una columna determinada.
   */
  public getSuspectsInCol(col: number): { suspectId: string; coordinate: Coordinate }[] {
    if (col < 0 || col >= this.cols) return [];
    const results: { suspectId: string; coordinate: Coordinate }[] = [];
    for (let r = 0; r < this.rows; r++) {
      const cell = this.matrix[r][col];
      if (cell.state.isCheck() && cell.state.suspectId) {
        results.push({ suspectId: cell.state.suspectId, coordinate: cell.coordinate });
      }
    }
    return results;
  }

  /**
   * Valida si una coordenada cae dentro de las dimensiones del tablero.
   */
  public isWithinBounds(coordinate: Coordinate): boolean {
    return (
      coordinate.row >= 0 &&
      coordinate.row < this.rows &&
      coordinate.col >= 0 &&
      coordinate.col < this.cols
    );
  }

  private validateBounds(coordinate: Coordinate): void {
    if (!this.isWithinBounds(coordinate)) {
      throw new InvalidMoveException(
        `Coordenada ${coordinate} fuera de los límites del tablero (${this.rows}x${this.cols}).`,
        { row: coordinate.row, col: coordinate.col }
      );
    }
  }
}
