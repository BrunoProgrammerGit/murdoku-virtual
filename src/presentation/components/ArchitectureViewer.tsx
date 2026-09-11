import React, { useState } from 'react';
import { Check, Copy, Layers, ShieldCheck, Box, Code, GitBranch, Database, Layout } from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'TREE' | 'SOLID' | 'BOILERPLATE'>('TREE');
  const [selectedSnippet, setSelectedSnippet] = useState<string>('Board');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeSnippets: Record<string, { title: string; layer: string; path: string; code: string; notes: string }> = {
    Board: {
      title: 'Entity: Board (Inmutable)',
      layer: 'Dominio (Hexágono Interior)',
      path: 'src/domain/models/Board.ts',
      notes: 'Garantiza inmutabilidad matemática: ninguna operación muta el arreglo interno. Toda acción devuelve una nueva instancia congelada de Board.',
      code: `export class Board {
  private readonly matrix: readonly (readonly Cell[])[];

  constructor(
    public readonly rows: number,
    public readonly cols: number,
    cellsMatrix: Cell[][]
  ) {
    this.matrix = Object.freeze(
      cellsMatrix.map(row => Object.freeze([...row]))
    );
  }

  public getCell(coordinate: Coordinate): Cell {
    this.validateBounds(coordinate);
    return this.matrix[coordinate.row][coordinate.col];
  }

  // Método inmutable: Devuelve un nuevo Board con la celda actualizada
  public setCellState(coordinate: Coordinate, newState: CellState): Board {
    this.validateBounds(coordinate);
    const updatedCell = this.getCell(coordinate).withState(newState);

    const newMatrix: Cell[][] = this.matrix.map((rowCells, rIdx) => {
      if (rIdx !== coordinate.row) return [...rowCells];
      return rowCells.map((cell, cIdx) => (cIdx === coordinate.col ? updatedCell : cell));
    });

    return new Board(this.rows, this.cols, newMatrix);
  }

  public placeSuspect(coord: Coordinate, suspectId: string): Board {
    return this.setCellState(coord, CellState.check(suspectId));
  }

  public placeCross(coord: Coordinate): Board {
    return this.setCellState(coord, CellState.cross());
  }

  public clearCell(coord: Coordinate): Board {
    return this.setCellState(coord, CellState.empty());
  }
}`,
    },
    CellState: {
      title: 'Value Object: CellState',
      layer: 'Dominio (Hexágono Interior)',
      path: 'src/domain/models/CellState.ts',
      notes: 'Encapsula los estados posibles (EMPTY, CHECK, CROSS, NOTES). Igualdad basada en sus valores internos, no en identidad de memoria.',
      code: `export enum CellStateKind {
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
    if (!suspectId?.trim()) throw new Error('Se requiere suspectId');
    return new CellState(CellStateKind.CHECK, suspectId, []);
  }

  public static cross(): CellState {
    return new CellState(CellStateKind.CROSS, null, []);
  }

  public static notes(candidates: string[]): CellState {
    return new CellState(CellStateKind.NOTES, null, Object.freeze([...candidates]));
  }

  public equals(other: CellState | null | undefined): boolean {
    if (!other || this.kind !== other.kind) return false;
    return this.suspectId === other.suspectId;
  }
}`,
    },
    RuleEngine: {
      title: 'Domain Service: RuleEngine',
      layer: 'Dominio (Servicio de Dominio)',
      path: 'src/domain/services/RuleEngine.ts',
      notes: 'Auditor forense sin acoplamiento a frameworks. Verifica la regla Sudoku (1 por fila y columna) y evalúa todas las pistas polimórficas.',
      code: `export class RuleEngine {
  public evaluate(board: Board, puzzle: Puzzle): RuleEngineReport {
    const conflicts: RuleConflict[] = [];

    // 1. Regla: Máximo 1 persona por fila
    for (let r = 0; r < board.rows; r++) {
      const suspects = board.getSuspectsInRow(r);
      if (suspects.length > 1) {
        conflicts.push({
          type: 'ROW_COLLISION',
          message: \`Violación: \${suspects.length} sospechosos en fila \${r + 1}.\`,
          affectedCoordinates: suspects.map(s => s.coordinate),
        });
      }
    }

    // 2. Regla: Máximo 1 persona por columna
    for (let c = 0; c < board.cols; c++) {
      const suspects = board.getSuspectsInCol(c);
      if (suspects.length > 1) {
        conflicts.push({
          type: 'COL_COLLISION',
          message: \`Violación: \${suspects.length} sospechosos en columna \${c + 1}.\`,
          affectedCoordinates: suspects.map(s => s.coordinate),
        });
      }
    }

    // 3. Evaluar Pistas polimórficas mediante Strategy Pattern
    const evaluatedClues = puzzle.clues.map(clue => {
      const res = clue.evaluate(board);
      if (res.status === ClueEvaluationStatus.VIOLATED) {
        conflicts.push({
          type: 'CLUE_VIOLATION',
          message: \`Pista rota: \${res.message}\`,
          affectedCoordinates: res.affectedCoordinates || [],
          ruleOrClueId: clue.id,
        });
      }
      return { clueId: clue.id, status: res.status, message: res.message };
    });

    return {
      isValid: conflicts.length === 0,
      conflicts,
      evaluatedClues,
      totalSuspectsPlaced: board.getAllCells().filter(c => c.state.isCheck()).length,
      allSuspectsPlaced: false,
      isSolved: false,
    };
  }
}`,
    },
    EvaluateMoveUseCase: {
      title: 'Use Case: EvaluateMoveUseCase',
      layer: 'Aplicación (Casos de Uso)',
      path: 'src/application/use-cases/EvaluateMoveUseCase.ts',
      notes: 'Orquestador del flujo: simula el movimiento en una copia del tablero, consulta al RuleEngine y retorna un DTO desacoplado a la UI.',
      code: `export class EvaluateMoveUseCase implements IEvaluateMoveUseCase {
  constructor(private readonly ruleEngine: RuleEngine = new RuleEngine()) {}

  public async execute(
    board: Board,
    puzzle: Puzzle,
    request: EvaluateMoveRequestDTO
  ): Promise<EvaluateMoveResponseDTO> {
    const coord = new Coordinate(request.row, request.col);
    const targetCell = board.getCell(coord);

    // 1. Validar ocupabilidad de celda
    if (!targetCell.isOccupable && request.action === 'PLACE_SUSPECT') {
      return {
        isAllowed: false,
        isValidBoardState: false,
        message: 'Casilla bloqueada por obstáculo no ocupable.',
        conflicts: [{ type: 'OBSTACLE_COLLISION', message: 'Bloqueo físico', affectedCoordinates: [coord] }],
        activeClueViolations: [],
        isSolved: false,
      };
    }

    // 2. Simular jugada de forma pura
    const simulatedBoard = request.action === 'PLACE_SUSPECT'
      ? board.placeSuspect(coord, request.suspectId!)
      : request.action === 'PLACE_CROSS'
      ? board.placeCross(coord)
      : board.clearCell(coord);

    // 3. Auditar con el motor de reglas de dominio
    const report = this.ruleEngine.evaluate(simulatedBoard, puzzle);

    return {
      isAllowed: true,
      isValidBoardState: report.isValid,
      message: report.isValid ? 'Movimiento válido.' : \`\${report.conflicts.length} conflicto(s) detectado(s).\`,
      conflicts: report.conflicts.map(c => ({
        type: c.type,
        message: c.message,
        affectedCoordinates: c.affectedCoordinates.map(co => ({ row: co.row, col: co.col })),
      })),
      activeClueViolations: report.evaluatedClues.filter(c => c.status === 'VIOLATED').map(c => c.clueId),
      isSolved: report.isSolved,
    };
  }
}`,
    },
    IPuzzleRepository: {
      title: 'Port & Adapter: IPuzzleRepository & JsonPuzzleRepository',
      layer: 'Aplicación (Puerto) / Infraestructura (Adaptador)',
      path: 'src/application/ports/output/IPuzzleRepository.ts & JsonPuzzleRepository.ts',
      notes: 'Ports & Adapters: La interfaz reside en Application/Ports; la implementación concreta en Infrastructure/Persistence leyendo JSON.',
      code: `// PUERTO DE SALIDA (src/application/ports/output/IPuzzleRepository.ts)
export interface IPuzzleRepository {
  findAll(): Promise<Puzzle[]>;
  findById(id: string): Promise<Puzzle | null>;
  findByCaseNumber(caseNumber: number): Promise<Puzzle | null>;
}

// ADAPTADOR SECUNDARIO CONCRETO (src/infrastructure/persistence/json/JsonPuzzleRepository.ts)
export class JsonPuzzleRepository implements IPuzzleRepository {
  private cache: Puzzle[] | null = null;

  private loadAll(): Puzzle[] {
    if (!this.cache) {
      this.cache = PUZZLES_DATA.map(raw => PuzzleFactory.fromJSON(raw));
    }
    return this.cache;
  }

  public async findAll(): Promise<Puzzle[]> {
    return [...this.loadAll()];
  }

  public async findByCaseNumber(caseNumber: number): Promise<Puzzle | null> {
    const found = this.loadAll().find(p => p.caseNumber === caseNumber);
    return found || null;
  }
}`,
    },
    CommandManager: {
      title: 'Command Pattern: CommandManager & PlaceMarkCommand',
      layer: 'Aplicación (Patrón Command)',
      path: 'src/application/commands/CommandManager.ts',
      notes: 'Manejo formal de Deshacer / Rehacer (Undo/Redo). Encapsula las mutaciones como objetos reversibles preservando inmutabilidad.',
      code: `export interface ICommand {
  readonly description: string;
  execute(currentBoard: Board): Board;
  undo(currentBoard: Board): Board;
}

export class PlaceMarkCommand implements ICommand {
  private previousCellState: CellState | null = null;

  constructor(
    public readonly coordinate: Coordinate,
    public readonly targetState: CellState
  ) {}

  public execute(currentBoard: Board): Board {
    this.previousCellState = currentBoard.getCell(this.coordinate).state;
    return currentBoard.setCellState(this.coordinate, this.targetState);
  }

  public undo(currentBoard: Board): Board {
    return currentBoard.setCellState(this.coordinate, this.previousCellState!);
  }
}

export class CommandManager {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];

  public executeCommand(command: ICommand, currentBoard: Board): Board {
    const updated = command.execute(currentBoard);
    this.undoStack.push(command);
    this.redoStack = [];
    return updated;
  }

  public undo(currentBoard: Board): { board: Board; command: ICommand } | null {
    const cmd = this.undoStack.pop();
    if (!cmd) return null;
    const reverted = cmd.undo(currentBoard);
    this.redoStack.push(cmd);
    return { board: reverted, command: cmd };
  }
}`,
    },
    Strategy: {
      title: 'Strategy Pattern: IClueStrategy & ExclusionClueStrategy',
      layer: 'Dominio (Estrategias de Pistas)',
      path: 'src/domain/strategies/IClueStrategy.ts & ExclusionClueStrategy.ts',
      notes: 'Permite desacoplar y extender las reglas de deducción (Directa, Condicional, Exclusión «Beside») sin modificar el RuleEngine (OCP).',
      code: `export interface IClueStrategy {
  readonly clueType: 'DIRECT' | 'CONDITIONAL' | 'EXCLUSION' | 'GLOBAL_TOPOLOGY';
  evaluate(board: Board, context: Record<string, any>): ClueEvaluationResult;
}

// Ejemplo de Evaluación de Exclusión / «Beside» ortogonal en la misma área:
export class ExclusionClueStrategy implements IClueStrategy {
  public readonly clueType = 'EXCLUSION';

  public evaluate(board: Board, context: ExclusionClueContext): ClueEvaluationResult {
    const coord = board.findSuspectCoordinate(context.suspectId);
    if (!coord) return { status: ClueEvaluationStatus.INCONCLUSIVE, message: 'No posicionado' };

    const cell = board.getCell(coord);

    if (context.besideObstacleType) {
      const deltas = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];
      const found = deltas.some(d => {
        const neighbor = new Coordinate(coord.row + d.r, coord.col + d.c);
        if (!board.isWithinBounds(neighbor)) return false;
        const nCell = board.getCell(neighbor);
        const sameZone = nCell.zoneName.toUpperCase() === cell.zoneName.toUpperCase();
        return sameZone && (nCell.obstacleType || '').includes(context.besideObstacleType!);
      });

      return found
        ? { status: ClueEvaluationStatus.SATISFIED, message: 'Al lado del obstáculo' }
        : { status: ClueEvaluationStatus.VIOLATED, message: 'Debe estar al lado en la misma área' };
    }
    return { status: ClueEvaluationStatus.INCONCLUSIVE, message: 'Inconcluso' };
  }
}`,
    },
  };

  return (
    <div className="w-full bg-[#FAF8F5] rounded-xl border-[2.5px] border-[#1E1E24] p-4 shadow-[4px_4px_0px_#1E1E24] space-y-4 text-[#1E1E24]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#1E1E24] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#FFB703] rounded-lg border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24]">
            <Layers className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest block">
              INGENIERÍA DE SOFTWARE II
            </span>
            <h2 className="text-base font-bold uppercase tracking-tight font-sans">
              Arquitectura Hexagonal, DDD & SOLID
            </h2>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#E4E2DF] px-2 py-1 rounded border border-[#1E1E24]">
          TypeScript ES6+
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#E4E2DF] p-1 rounded-lg border border-[#1E1E24]">
        <button
          type="button"
          onClick={() => setActiveTab('TREE')}
          className={`flex-1 py-1.5 px-2 rounded-md font-sans text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'TREE'
              ? 'bg-white border border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24]'
              : 'hover:bg-white/60'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Árbol Hexagonal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SOLID')}
          className={`flex-1 py-1.5 px-2 rounded-md font-sans text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'SOLID'
              ? 'bg-white border border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24]'
              : 'hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Principios SOLID</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('BOILERPLATE')}
          className={`flex-1 py-1.5 px-2 rounded-md font-sans text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'BOILERPLATE'
              ? 'bg-white border border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24]'
              : 'hover:bg-white/60'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Código Fuente</span>
        </button>
      </div>

      {/* Tab 1: Tree */}
      {activeTab === 'TREE' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <p className="text-xs text-gray-700 font-mono">
            Estructura estricta de <strong>Puertos y Adaptadores (Alistair Cockburn)</strong> y <strong>Domain-Driven Design (Eric Evans)</strong>. La capa de dominio está 100% aislada de frameworks y bibliotecas externas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Hexágono Interior: Dominio */}
            <div className="bg-emerald-50 border-[2px] border-emerald-800 rounded-lg p-3 space-y-1.5 shadow-[2px_2px_0px_#1E1E24]">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs font-sans">
                <Box className="w-4 h-4" />
                <span>1. DOMINIO (src/domain)</span>
              </div>
              <p className="text-[10px] font-mono text-emerald-800">
                Lógica pura de negocio. Sin dependencias externas ni de bases de datos.
              </p>
              <ul className="text-[11px] font-mono space-y-1 text-gray-800">
                <li>• <strong>models/Coordinate.ts</strong> (Value Object)</li>
                <li>• <strong>models/CellState.ts</strong> (Value Object: EMPTY, CHECK, CROSS, NOTES)</li>
                <li>• <strong>models/Cell.ts</strong> (Sub-Entity / VO)</li>
                <li>• <strong>models/Board.ts</strong> (Aggregate Root / Inmutable)</li>
                <li>• <strong>models/Suspect.ts</strong> (Entity)</li>
                <li>• <strong>models/Clue.ts</strong> & <strong>Puzzle.ts</strong> (Agregados)</li>
                <li>• <strong>strategies/IClueStrategy.ts</strong> (Strategy Pattern)</li>
                <li>• <strong>services/RuleEngine.ts</strong> (Domain Service)</li>
                <li>• <strong>exceptions/DomainException.ts</strong></li>
              </ul>
            </div>

            {/* Capa de Aplicación */}
            <div className="bg-amber-50 border-[2px] border-amber-800 rounded-lg p-3 space-y-1.5 shadow-[2px_2px_0px_#1E1E24]">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs font-sans">
                <GitBranch className="w-4 h-4" />
                <span>2. APLICACIÓN (src/application)</span>
              </div>
              <p className="text-[10px] font-mono text-amber-800">
                Casos de uso, orquestación de reglas y definición de Puertos de Entrada/Salida.
              </p>
              <ul className="text-[11px] font-mono space-y-1 text-gray-800">
                <li>• <strong>ports/input/IEvaluateMoveUseCase.ts</strong> (Puerto Primario)</li>
                <li>• <strong>ports/output/IPuzzleRepository.ts</strong> (Puerto Secundario)</li>
                <li>• <strong>use-cases/EvaluateMoveUseCase.ts</strong> (Caso de Uso)</li>
                <li>• <strong>commands/CommandManager.ts</strong> (Command Pattern / Undo-Redo)</li>
                <li>• <strong>commands/PlaceMarkCommand.ts</strong></li>
                <li>• <strong>factories/PuzzleFactory.ts</strong> (Factory Pattern)</li>
                <li>• <strong>dtos/EvaluateMoveDTO.ts</strong></li>
              </ul>
            </div>

            {/* Adaptadores de Infraestructura */}
            <div className="bg-blue-50 border-[2px] border-blue-800 rounded-lg p-3 space-y-1.5 shadow-[2px_2px_0px_#1E1E24]">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs font-sans">
                <Database className="w-4 h-4" />
                <span>3. INFRAESTRUCTURA (src/infrastructure)</span>
              </div>
              <p className="text-[10px] font-mono text-blue-800">
                Adaptadores secundarios (Driven). Implementan puertos de salida.
              </p>
              <ul className="text-[11px] font-mono space-y-1 text-gray-800">
                <li>• <strong>persistence/json/puzzlesData.ts</strong> (Dataset estático)</li>
                <li>• <strong>persistence/json/JsonPuzzleRepository.ts</strong> (Adaptador)</li>
                <li>• <strong>persistence/localstorage/LocalStorageGameSessionRepository.ts</strong></li>
              </ul>
            </div>

            {/* Adaptadores de Presentación */}
            <div className="bg-purple-50 border-[2px] border-purple-800 rounded-lg p-3 space-y-1.5 shadow-[2px_2px_0px_#1E1E24]">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs font-sans">
                <Layout className="w-4 h-4" />
                <span>4. PRESENTACIÓN (src/presentation)</span>
              </div>
              <p className="text-[10px] font-mono text-purple-800">
                Adaptadores primarios (Driving). Controladores y vistas visuales.
              </p>
              <ul className="text-[11px] font-mono space-y-1 text-gray-800">
                <li>• <strong>controllers/MurdokuGameController.ts</strong> (Presenter desacoplado)</li>
                <li>• <strong>hooks/useMurdokuGame.ts</strong></li>
                <li>• <strong>components/MurdokuBoardView.tsx</strong></li>
                <li>• <strong>components/SuspectsCarousel.tsx</strong></li>
                <li>• <strong>components/CluesNotebook.tsx</strong></li>
                <li>• <strong>components/ActionToolbar.tsx</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SOLID Principles */}
      {activeTab === 'SOLID' && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="p-2.5 bg-white border border-[#1E1E24] rounded-lg shadow-sm">
            <span className="font-bold text-xs text-red-600 block font-mono">S - Single Responsibility Principle (SRP)</span>
            <p className="text-xs text-gray-800 mt-1 font-mono">
              <strong>Board:</strong> solo gestiona inmutabilidad de la matriz.<br />
              <strong>RuleEngine:</strong> solo audita reglas y colisiones.<br />
              <strong>EvaluateMoveUseCase:</strong> orquesta la simulación y consulta sin manipular la UI.
            </p>
          </div>

          <div className="p-2.5 bg-white border border-[#1E1E24] rounded-lg shadow-sm">
            <span className="font-bold text-xs text-amber-600 block font-mono">O - Open/Closed Principle (OCP)</span>
            <p className="text-xs text-gray-800 mt-1 font-mono">
              Gracias a <strong>IClueStrategy</strong>, se pueden crear infinitos tipos de pistas nuevas (Topología, Rango, Exclusión) sin tener que modificar una sola línea del <strong>RuleEngine</strong>.
            </p>
          </div>

          <div className="p-2.5 bg-white border border-[#1E1E24] rounded-lg shadow-sm">
            <span className="font-bold text-xs text-emerald-600 block font-mono">L - Liskov Substitution Principle (LSP)</span>
            <p className="text-xs text-gray-800 mt-1 font-mono">
              Cualquier implementación de <strong>IClueStrategy</strong> (DirectClue, ConditionalClue, ExclusionClue) puede sustituir a la interfaz base sin alterar la correctitud del cálculo.
            </p>
          </div>

          <div className="p-2.5 bg-white border border-[#1E1E24] rounded-lg shadow-sm">
            <span className="font-bold text-xs text-blue-600 block font-mono">I - Interface Segregation Principle (ISP)</span>
            <p className="text-xs text-gray-800 mt-1 font-mono">
              Interfaces pequeñas y focalizadas: <strong>ICommand</strong> solo tiene <code>execute</code> y <code>undo</code>; <strong>IPuzzleRepository</strong> solo maneja lectura de casos; <strong>IEvaluateMoveUseCase</strong> solo expone <code>execute</code>.
            </p>
          </div>

          <div className="p-2.5 bg-white border border-[#1E1E24] rounded-lg shadow-sm">
            <span className="font-bold text-xs text-purple-600 block font-mono">D - Dependency Inversion Principle (DIP)</span>
            <p className="text-xs text-gray-800 mt-1 font-mono">
              El <strong>MurdokuGameController</strong> y la capa de Aplicación dependen del puerto abstracto <code>IPuzzleRepository</code>. Nunca dependen directamente de <code>JsonPuzzleRepository</code> ni de archivos de disco.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Boilerplate Code Viewer */}
      {activeTab === 'BOILERPLATE' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {Object.keys(codeSnippets).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedSnippet(key)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded border whitespace-nowrap transition-all ${
                  selectedSnippet === key
                    ? 'bg-[#FFB703] border-black shadow-[2px_2px_0px_#1E1E24]'
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          {codeSnippets[selectedSnippet] && (
            <div className="bg-[#1E1E24] text-gray-100 p-3 rounded-lg border-[2px] border-black shadow-[3px_3px_0px_#1E1E24] space-y-2">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-[#FFB703] font-sans">
                    {codeSnippets[selectedSnippet].title}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {codeSnippets[selectedSnippet].path}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      codeSnippets[selectedSnippet].code,
                      selectedSnippet
                    )
                  }
                  className="px-2.5 py-1 bg-white text-black text-xs font-mono font-bold rounded hover:bg-[#FFB703] active:scale-95 flex items-center gap-1 transition-all"
                >
                  {copiedKey === selectedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] font-mono text-emerald-300 bg-black/40 p-2 rounded border border-gray-800">
                💡 <strong>Nota del Arquitecto:</strong> {codeSnippets[selectedSnippet].notes}
              </div>

              <pre className="text-[11px] font-mono overflow-x-auto p-2 bg-black/60 rounded max-h-72 leading-relaxed text-gray-200">
                {codeSnippets[selectedSnippet].code}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
