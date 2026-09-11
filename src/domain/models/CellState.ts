/**
 * Value Object / Enum: CellState
 * Representa el estado de una casilla en el tablero de Murdoku.
 * - EMPTY: Casilla vacía / sin marcas
 * - CHECK: Confirmado / sospechoso fijado
 * - CROSS: Casilla tachada / descartada (X)
 * - NOTES: Nota tentativa / lápiz borrador
 */
export enum CellStateKind {
  EMPTY = 'EMPTY',
  CHECK = 'CHECK',
  CROSS = 'CROSS',
  NOTES = 'NOTES',
}

export class CellState {
  private constructor(
    public readonly kind: CellStateKind,
    public readonly suspectId: string | null = null,
    public readonly noteCandidates: readonly string[] = []
  ) {}

  public static empty(): CellState {
    return new CellState(CellStateKind.EMPTY, null, []);
  }

  public static check(suspectId: string): CellState {
    if (!suspectId || suspectId.trim() === '') {
      throw new Error('Un estado CHECK requiere especificar el identificador del sospechoso.');
    }
    return new CellState(CellStateKind.CHECK, suspectId, []);
  }

  public static cross(): CellState {
    return new CellState(CellStateKind.CROSS, null, []);
  }

  public static notes(candidates: string[]): CellState {
    return new CellState(CellStateKind.NOTES, null, Object.freeze([...candidates]));
  }

  public isEmpty(): boolean {
    return this.kind === CellStateKind.EMPTY;
  }

  public isCheck(): boolean {
    return this.kind === CellStateKind.CHECK;
  }

  public isCross(): boolean {
    return this.kind === CellStateKind.CROSS;
  }

  public isNotes(): boolean {
    return this.kind === CellStateKind.NOTES;
  }

  public equals(other: CellState | null | undefined): boolean {
    if (!other) return false;
    if (this.kind !== other.kind) return false;
    if (this.suspectId !== other.suspectId) return false;
    if (this.noteCandidates.length !== other.noteCandidates.length) return false;
    return this.noteCandidates.every((c, i) => c === other.noteCandidates[i]);
  }
}
