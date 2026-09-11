import { Coordinate } from '../../domain/models/Coordinate';
import { Cell, ObstacleType } from '../../domain/models/Cell';
import { CellState } from '../../domain/models/CellState';
import { Board } from '../../domain/models/Board';
import { Suspect } from '../../domain/models/Suspect';
import { Clue } from '../../domain/models/Clue';
import { Puzzle } from '../../domain/models/Puzzle';
import { IClueStrategy } from '../../domain/strategies/IClueStrategy';
import { DirectClueStrategy } from '../../domain/strategies/DirectClueStrategy';
import { ConditionalClueStrategy } from '../../domain/strategies/ConditionalClueStrategy';
import { ExclusionClueStrategy } from '../../domain/strategies/ExclusionClueStrategy';

export interface RawPuzzleJSON {
  id: string;
  caseNumber: number;
  title: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  briefing: string;
  victimId: string;
  murdererId: string;
  dimensions: { rows: number; cols: number };
  grid: {
    row: number;
    col: number;
    zoneName: string;
    obstacleType?: ObstacleType;
    isOccupable?: boolean;
    fixtureIcon?: string;
    initialState?: {
      kind: 'EMPTY' | 'CHECK' | 'CROSS';
      suspectId?: string;
    };
  }[];
  suspects: {
    id: string;
    name: string;
    initial: string;
    color: string;
    attributes?: Record<string, any>;
    clueSummary?: string;
    avatarIcon?: string;
  }[];
  clues: {
    id: string;
    text: string;
    type: 'DIRECT' | 'CONDITIONAL' | 'EXCLUSION';
    context: Record<string, any>;
    suspectId?: string;
    icon?: string;
    tag?: string;
  }[];
}

/**
 * Patrón Factory: PuzzleFactory
 * Centraliza la creación compleja del Agregado Puzzle y sus entidades hijas (Board, Cell, Clue, Suspect).
 * Desacopla la representación cruda en JSON de los modelos ricos del Dominio.
 */
export class PuzzleFactory {
  /**
   * Crea una instancia de Puzzle a partir de un objeto JSON estructurado.
   */
  public static fromJSON(data: RawPuzzleJSON): Puzzle {
    const { rows, cols } = data.dimensions;

    // 1. Construir la matriz de celdas bidimensional
    const cellsMatrix: Cell[][] = Array.from({ length: rows }, () => []);

    for (const cellData of data.grid) {
      const coord = new Coordinate(cellData.row, cellData.col);
      let cellState = CellState.empty();

      if (cellData.initialState?.kind === 'CHECK' && cellData.initialState.suspectId) {
        cellState = CellState.check(cellData.initialState.suspectId);
      } else if (cellData.initialState?.kind === 'CROSS') {
        cellState = CellState.cross();
      }

      const isOccupable = cellData.isOccupable !== undefined ? cellData.isOccupable : true;
      const fixtureIcon = cellData.fixtureIcon || (cellData.obstacleType === 'BEAR' ? '🐻' : cellData.obstacleType === 'TREE' ? '🌲' : cellData.obstacleType === 'BOULDER' ? '🪨' : '');

      const cell = new Cell(
        coord,
        cellData.zoneName,
        cellData.obstacleType || null,
        isOccupable,
        fixtureIcon,
        cellState
      );

      cellsMatrix[cellData.row][cellData.col] = cell;
    }

    const initialBoard = new Board(rows, cols, cellsMatrix);

    // 2. Instanciar entidades de Sospechosos
    const suspects = data.suspects.map(
      s => new Suspect(
        s.id,
        s.name,
        s.initial,
        s.color,
        s.attributes || {},
        s.clueSummary || '',
        s.avatarIcon || '👤'
      )
    );

    // 3. Instanciar Pistas con su estrategia correspondiente
    const clues = data.clues.map(c => {
      const strategy = PuzzleFactory.resolveStrategy(c.type);
      return new Clue(
        c.id,
        c.text,
        strategy,
        c.context,
        c.suspectId,
        c.icon || '🔍',
        c.tag || ''
      );
    });

    return new Puzzle(
      data.id,
      data.caseNumber,
      data.title,
      data.difficulty,
      data.briefing,
      data.victimId,
      data.murdererId,
      suspects,
      clues,
      initialBoard
    );
  }

  /**
   * Resuelve e inyecta la estrategia adecuada según el tipo de pista.
   */
  private static resolveStrategy(type: 'DIRECT' | 'CONDITIONAL' | 'EXCLUSION'): IClueStrategy {
    switch (type) {
      case 'DIRECT':
        return new DirectClueStrategy();
      case 'CONDITIONAL':
        return new ConditionalClueStrategy();
      case 'EXCLUSION':
        return new ExclusionClueStrategy();
      default:
        throw new Error(`Tipo de estrategia de pista no soportada: ${type}`);
    }
  }
}
