/**
 * Value Object: Coordinate
 * Inmutable. Representa una coordenada bidimensional (fila, columna) en el tablero.
 * Sigue los principios de DDD para Value Objects (inmutabilidad e igualdad por valor).
 */
export class Coordinate {
  constructor(
    public readonly row: number,
    public readonly col: number
  ) {
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      throw new Error(`Las coordenadas deben ser números enteros. Recibido: (${row}, ${col})`);
    }
  }

  public equals(other: Coordinate | null | undefined): boolean {
    if (!other) return false;
    return this.row === other.row && this.col === other.col;
  }

  /**
   * Determina si otra coordenada es adyacente ortogonalmente (arriba, abajo, izquierda, derecha).
   * La diagonal NO es adyacente según las reglas oficiales de Murdoku.
   */
  public isOrthogonallyAdjacent(other: Coordinate): boolean {
    const dRow = Math.abs(this.row - other.row);
    const dCol = Math.abs(this.col - other.col);
    return (dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1);
  }

  /**
   * Distancia de Manhattan entre dos coordenadas.
   */
  public manhattanDistance(other: Coordinate): boolean | number {
    return Math.abs(this.row - other.row) + Math.abs(this.col - other.col);
  }

  public toString(): string {
    return `[${this.row}, ${this.col}]`;
  }
}
