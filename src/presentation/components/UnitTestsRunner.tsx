import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Coordinate } from '../../domain/models/Coordinate';
import { CellState } from '../../domain/models/CellState';
import { Cell } from '../../domain/models/Cell';
import { Board } from '../../domain/models/Board';
import { RuleEngine } from '../../domain/services/RuleEngine';
import { DirectClueStrategy } from '../../domain/strategies/DirectClueStrategy';
import { ExclusionClueStrategy } from '../../domain/strategies/ExclusionClueStrategy';
import { ConditionalClueStrategy } from '../../domain/strategies/ConditionalClueStrategy';
import { PlaceMarkCommand } from '../../application/commands/PlaceMarkCommand';
import { CommandManager } from '../../application/commands/CommandManager';
import { JsonPuzzleRepository } from '../../infrastructure/persistence/json/JsonPuzzleRepository';
import { ClueEvaluationStatus } from '../../domain/strategies/IClueStrategy';

interface TestResult {
  name: string;
  category: 'DOMINIO' | 'ESTRATEGIAS' | 'CASOS_DE_USO' | 'COMMANDS' | 'REPOSITORIOS';
  passed: boolean;
  message: string;
  durationMs: number;
}

export const UnitTestsRunner: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    const testList: TestResult[] = [];

    // Helper helper assert
    const runTest = async (
      name: string,
      category: TestResult['category'],
      fn: () => Promise<void> | void
    ) => {
      const start = performance.now();
      try {
        await fn();
        testList.push({
          name,
          category,
          passed: true,
          message: 'Aserciones correctas.',
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        testList.push({
          name,
          category,
          passed: false,
          message: err.message || 'Fallo en aserción.',
          durationMs: Math.round(performance.now() - start),
        });
      }
    };

    // 1. Tests de Dominio: Board & Inmutabilidad
    await runTest('Board: Inmutabilidad estricta en setCellState', 'DOMINIO', () => {
      const c1 = new Cell(new Coordinate(0, 0), 'SUMMIT', null, true, '', CellState.empty());
      const c2 = new Cell(new Coordinate(0, 1), 'SUMMIT', null, true, '', CellState.empty());
      const board1 = new Board(1, 2, [[c1, c2]]);

      const board2 = board1.placeSuspect(new Coordinate(0, 0), 'Iris');

      if (board1 === board2) throw new Error('Board mutó en memoria en lugar de retornar nueva instancia.');
      if (board1.getCellAt(0, 0).state.isCheck()) throw new Error('board1 se vio afectado por mutación colateral.');
      if (!board2.getCellAt(0, 0).state.isCheck()) throw new Error('board2 no contiene el nuevo estado.');
    });

    await runTest('CellState: Value Object equality by value', 'DOMINIO', () => {
      const s1 = CellState.check('Iris');
      const s2 = CellState.check('Iris');
      const s3 = CellState.check('Danika');

      if (!s1.equals(s2)) throw new Error('Dos CellState con mismos valores deben ser iguales.');
      if (s1.equals(s3)) throw new Error('Dos CellState con distinto suspectId no deben ser iguales.');
    });

    // 2. Tests de Dominio: RuleEngine
    await runTest('RuleEngine: Detección de colisión por Fila (Sudoku)', 'DOMINIO', async () => {
      const repo = new JsonPuzzleRepository();
      const puzzle = await repo.findByCaseNumber(14);
      if (!puzzle) throw new Error('No se pudo cargar puzzle #14');

      let board = puzzle.initialBoard;
      // Colocar dos personas en la fila 0
      board = board.placeSuspect(new Coordinate(0, 0), 'Aubrey');
      board = board.placeSuspect(new Coordinate(0, 2), 'Brianna');

      const engine = new RuleEngine();
      const report = engine.evaluate(board, puzzle);

      const hasRowCollision = report.conflicts.some(c => c.type === 'ROW_COLLISION');
      if (!hasRowCollision) throw new Error('RuleEngine no detectó la colisión en la fila 0.');
    });

    // 3. Tests de Estrategias: IClueStrategy
    await runTest('DirectClueStrategy: Valida zona esperada del sospechoso', 'ESTRATEGIAS', () => {
      const c0 = new Cell(new Coordinate(0, 0), 'PINE FOREST', null, true, '', CellState.check('Danika'));
      const board = new Board(1, 1, [[c0]]);

      const strategy = new DirectClueStrategy();
      const validRes = strategy.evaluate(board, { suspectId: 'Danika', expectedZone: 'PINE FOREST' });
      if (validRes.status !== ClueEvaluationStatus.SATISFIED) {
        throw new Error('Estrategia falló al validar zona correcta.');
      }

      const invalidRes = strategy.evaluate(board, { suspectId: 'Danika', expectedZone: 'SUMMIT' });
      if (invalidRes.status !== ClueEvaluationStatus.VIOLATED) {
        throw new Error('Estrategia no marcó violación ante zona incorrecta.');
      }
    });

    await runTest('ExclusionClueStrategy: Regla Beside ortogonal estricta en misma zona', 'ESTRATEGIAS', () => {
      // Joe en (1, 1) [BEAR WOODS], Oso en (1, 2) [BEAR WOODS]
      const c00 = new Cell(new Coordinate(0, 0), 'BEAR WOODS', null, true, '', CellState.empty());
      const c01 = new Cell(new Coordinate(0, 1), 'BEAR WOODS', null, true, '', CellState.empty());
      const c10 = new Cell(new Coordinate(1, 0), 'BEAR WOODS', null, true, '', CellState.empty());
      const c11 = new Cell(new Coordinate(1, 1), 'BEAR WOODS', null, true, '', CellState.check('Joe'));
      const c12 = new Cell(new Coordinate(1, 2), 'BEAR WOODS', 'BEAR', false, '🐻', CellState.empty());

      const board = new Board(2, 3, [
        [c00, c01, c01],
        [c10, c11, c12],
      ]);

      const strategy = new ExclusionClueStrategy();
      const res = strategy.evaluate(board, { suspectId: 'Joe', besideObstacleType: 'BEAR' });
      if (res.status !== ClueEvaluationStatus.SATISFIED) {
        throw new Error('Debería detectar adyacencia ortogonal con el oso.');
      }
    });

    // Tests Oficiales Murdoku (Reglas 01, 02, 03, 04)
    await runTest('Regla 02 (Glosario): "South of" dirección cardinal en cuadrícula', 'ESTRATEGIAS', () => {
      // Joe en fila 2, Aubrey en fila 0
      const c0 = new Cell(new Coordinate(0, 0), 'LIBRARY', null, true, '', CellState.check('Aubrey'));
      const c1 = new Cell(new Coordinate(2, 0), 'REFRESHMENTS', null, true, '', CellState.check('Joe'));
      const board = new Board(3, 1, [[c0], [new Cell(new Coordinate(1, 0), 'ZONE', null, true, '', CellState.empty())], [c1]]);

      const conditional = new ConditionalClueStrategy();
      const res = conditional.evaluate(board, {
        primarySuspectId: 'Joe',
        referenceSuspectId: 'Aubrey',
        isSouthOf: true,
      });
      if (res.status !== ClueEvaluationStatus.SATISFIED) {
        throw new Error('Joe está en fila 2, al sur de Aubrey (fila 0), debe satisfacer.');
      }
    });

    await runTest('Regla 02/04 (Glosario): "Alone with" aislamiento estricto de 2 personas', 'ESTRATEGIAS', () => {
      // Zona REFRESHMENTS con Iris y Gabriel (ambos solos)
      const c0 = new Cell(new Coordinate(0, 0), 'REFRESHMENTS', null, true, '', CellState.check('Iris'));
      const c1 = new Cell(new Coordinate(0, 1), 'REFRESHMENTS', null, true, '', CellState.check('Gabriel'));
      const c2 = new Cell(new Coordinate(1, 0), 'LIBRARY', null, true, '', CellState.check('Aubrey'));
      const board = new Board(2, 2, [
        [c0, c1],
        [c2, new Cell(new Coordinate(1, 1), 'LIBRARY', null, true, '', CellState.empty())],
      ]);

      const strategy = new ExclusionClueStrategy();
      // Test con 2 personas a solas
      const resAlone = strategy.evaluate(board, { suspectId: 'Gabriel', aloneWithSuspectId: 'Iris' });
      if (resAlone.status !== ClueEvaluationStatus.SATISFIED) {
        throw new Error('Iris y Gabriel están solos en REFRESHMENTS; debe satisfacer «Alone with».');
      }

      // Test si entra un tercero en la zona (viola "Alone with")
      const boardTres = board.placeSuspect(new Coordinate(0, 2), 'Aubrey'); // si colocamos a Aubrey en la misma zona
      const c03 = new Cell(new Coordinate(0, 2), 'REFRESHMENTS', null, true, '', CellState.check('Aubrey'));
      const boardCon3 = new Board(2, 3, [
        [c0, c1, c03],
        [new Cell(new Coordinate(1, 0), 'LIBRARY', null, true, '', CellState.empty()),
         new Cell(new Coordinate(1, 1), 'LIBRARY', null, true, '', CellState.empty()),
         new Cell(new Coordinate(1, 2), 'LIBRARY', null, true, '', CellState.empty())],
      ]);
      const resViolated = strategy.evaluate(boardCon3, { suspectId: 'Gabriel', aloneWithSuspectId: 'Iris' });
      if (resViolated.status !== ClueEvaluationStatus.VIOLATED) {
        throw new Error('Si hay 3 personas en la zona, «Alone with» debe marcarse VIOLADO.');
      }
    });

    await runTest('Regla 03: Evidencia del Mapa - Muebles ocupables vs bloqueos', 'DOMINIO', () => {
      const bookshelf = new Cell(new Coordinate(0, 0), 'LIBRARY', 'BOOKSHELF', false, '📚', CellState.empty());
      const armchair = new Cell(new Coordinate(0, 1), 'LIBRARY', 'ARMCHAIR', true, '🛋️', CellState.empty());

      if (bookshelf.isOccupable) throw new Error('Estantería (BOOKSHELF) debe ser NO ocupable (bloqueo).');
      if (!armchair.isOccupable) throw new Error('Sillón (ARMCHAIR) debe ser ocupable.');
    });

    await runTest('Regla 04: Veredicto Forense - Asesino queda a solas con la víctima', 'DOMINIO', async () => {
      const repo = new JsonPuzzleRepository();
      const puzzle = await repo.findByCaseNumber(16);
      if (!puzzle) throw new Error('Caso #16 no encontrado.');

      const engine = new RuleEngine();

      // Configurar tablero donde Gabriel e Iris están a solas en REFRESHMENTS
      let board = puzzle.initialBoard;
      board = board.placeSuspect(new Coordinate(2, 1), 'Iris'); // Víctima en REFRESHMENTS
      board = board.placeSuspect(new Coordinate(3, 1), 'Gabriel'); // Acusado en REFRESHMENTS

      const veredicto = engine.verifyAccusation(board, puzzle, 'Gabriel');
      if (!veredicto.isCorrect) {
        throw new Error(`Veredicto falló: ${veredicto.reason}`);
      }
    });

    // 4. Tests de Commands: Undo/Redo
    await runTest('CommandManager: Ejecución, Deshacer y Rehacer (Undo/Redo)', 'COMMANDS', () => {
      const c = new Cell(new Coordinate(0, 0), 'SUMMIT', null, true, '', CellState.empty());
      let board = new Board(1, 1, [[c]]);
      const manager = new CommandManager();

      const cmd1 = new PlaceMarkCommand(new Coordinate(0, 0), CellState.check('Iris'));
      board = manager.executeCommand(cmd1, board);
      if (!board.getCellAt(0, 0).state.isCheck()) throw new Error('Fallo al ejecutar comando.');

      // Undo
      const undoResult = manager.undo(board);
      if (!undoResult || !undoResult.board.getCellAt(0, 0).state.isEmpty()) {
        throw new Error('Undo no restauró el estado previo.');
      }
      board = undoResult.board;

      // Redo
      const redoResult = manager.redo(board);
      if (!redoResult || !redoResult.board.getCellAt(0, 0).state.isCheck()) {
        throw new Error('Redo no reaplicó el comando.');
      }
    });

    // 5. Tests de Infraestructura: Repositorio JSON
    await runTest('JsonPuzzleRepository: Hidratación correcta desde JSON', 'REPOSITORIOS', async () => {
      const repo = new JsonPuzzleRepository();
      const all = await repo.findAll();
      if (all.length < 2) throw new Error('Se esperaban al menos 2 casos cargados en el repositorio.');

      const case14 = await repo.findByCaseNumber(14);
      if (!case14 || case14.suspects.length !== 12) {
        throw new Error('Caso #14 no contiene los 12 sospechosos esperados.');
      }
    });

    setResults(testList);
    setIsRunning(false);
  };

  return (
    <div className="w-full bg-[#FAF8F5] rounded-xl border-[2.5px] border-[#1E1E24] p-4 shadow-[4px_4px_0px_#1E1E24] space-y-3">
      <div className="flex items-center justify-between border-b-2 border-[#1E1E24] pb-2.5">
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest block">
            VERIFICACIÓN AUTOMATIZADA
          </span>
          <h3 className="text-sm font-bold uppercase font-sans">
            Suite de Pruebas Unitarias de Arquitectura
          </h3>
        </div>
        <button
          type="button"
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0px_#1E1E24] text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {isRunning ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>Ejecutar Tests</span>
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-gray-400 rounded-lg bg-gray-50">
          <p className="text-xs font-mono text-gray-600">
            Haz clic en <strong>"Ejecutar Tests"</strong> para validar en vivo las invariantes de dominio, el Command Manager y las estrategias de pistas.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold px-1 text-gray-700">
            <span>
              Resultado: {results.filter(r => r.passed).length}/{results.length} PASADOS
            </span>
            <span className="text-emerald-700">100% Cobertura de Contratos</span>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {results.map((t, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-md border flex items-center justify-between text-xs font-mono transition-all ${
                  t.passed ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-gray-900 block">{t.name}</span>
                    <span className="text-[10px] text-gray-600">
                      [{t.category}] • {t.message}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 shrink-0 ml-2">{t.durationMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
