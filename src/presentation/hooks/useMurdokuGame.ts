import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { JsonPuzzleRepository } from '../../infrastructure/persistence/json/JsonPuzzleRepository';
import { MurdokuGameController } from '../controllers/MurdokuGameController';
import { Board } from '../../domain/models/Board';
import { Puzzle } from '../../domain/models/Puzzle';
import { Suspect } from '../../domain/models/Suspect';
import { RuleEngineReport } from '../../domain/services/RuleEngine';
import { EvaluateMoveResponseDTO } from '../../application/dtos/EvaluateMoveDTO';

export type ToolType = 'STAMP' | 'CROSS' | 'NOTES' | 'ERASE';

export function useMurdokuGame() {
  const repository = useMemo(() => new JsonPuzzleRepository(), []);
  const [availablePuzzles, setAvailablePuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('STAMP');
  const [notesMode, setNotesMode] = useState(false);
  const [strikes, setStrikes] = useState<number>(0);
  const [maxStrikes] = useState<number>(3);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [checkedClues, setCheckedClues] = useState<Set<string>>(new Set());
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [forensicReport, setForensicReport] = useState<RuleEngineReport | null>(null);
  const [accusationResult, setAccusationResult] = useState<{ isCorrect: boolean; reason: string } | null>(null);

  const controllerRef = useRef<MurdokuGameController | null>(null);

  // Inicializar casos disponibles
  useEffect(() => {
    async function init() {
      const list = await repository.findAll();
      setAvailablePuzzles(list);
      if (list.length > 0) {
        const first = list[0];
        const ctrl = new MurdokuGameController(first, repository);
        controllerRef.current = ctrl;
        setCurrentPuzzle(first);
        setBoard(ctrl.getBoard());
        setSelectedSuspect(first.suspects[0]);
        setForensicReport(ctrl.getForensicReport());
      }
    }
    init();
  }, [repository]);

  // Cronómetro de partida
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);

  // Cambiar de caso
  const selectCase = useCallback(async (caseNumber: number) => {
    if (!controllerRef.current) return;
    const ok = await controllerRef.current.loadCase(caseNumber);
    if (ok) {
      const p = controllerRef.current.getPuzzle();
      setCurrentPuzzle(p);
      setBoard(controllerRef.current.getBoard());
      setSelectedSuspect(p.suspects[0]);
      setCheckedClues(new Set());
      setStrikes(0);
      setSeconds(0);
      setLastFeedback(null);
      setAccusationResult(null);
      setForensicReport(controllerRef.current.getForensicReport());
    }
  }, []);

  // Manejo de clic en celda
  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (!controllerRef.current || !currentPuzzle) return;

    let tool: ToolType = activeTool;
    if (notesMode && tool === 'STAMP') {
      tool = 'NOTES';
    }

    const { board: newBoard, evaluation } = await controllerRef.current.handleCellAction(
      row,
      col,
      tool,
      selectedSuspect?.id
    );

    setBoard(newBoard);
    setLastFeedback(evaluation.message);

    // Si la jugada viola reglas y genera un conflicto fatal, computamos strike
    if (!evaluation.isValidBoardState && evaluation.conflicts.length > 0) {
      setStrikes(prev => Math.min(prev + 1, maxStrikes));
    }

    const report = controllerRef.current.getForensicReport();
    setForensicReport(report);
  }, [activeTool, notesMode, selectedSuspect, currentPuzzle, maxStrikes]);

  // Deshacer (Undo)
  const undo = useCallback(() => {
    if (!controllerRef.current) return;
    const newBoard = controllerRef.current.undo();
    if (newBoard) {
      setBoard(newBoard);
      setForensicReport(controllerRef.current.getForensicReport());
      setLastFeedback('Acción deshecha (Undo).');
    }
  }, []);

  // Rehacer (Redo)
  const redo = useCallback(() => {
    if (!controllerRef.current) return;
    const newBoard = controllerRef.current.redo();
    if (newBoard) {
      setBoard(newBoard);
      setForensicReport(controllerRef.current.getForensicReport());
      setLastFeedback('Acción rehecha (Redo).');
    }
  }, []);

  // Toggle pista en el checklist
  const toggleClueChecked = useCallback((clueId: string) => {
    setCheckedClues(prev => {
      const copy = new Set(prev);
      if (copy.has(clueId)) {
        copy.delete(clueId);
      } else {
        copy.add(clueId);
      }
      return copy;
    });
  }, []);

  // Acusar al asesino
  const accuseCulprit = useCallback((suspectId: string) => {
    if (!controllerRef.current) return null;
    const result = controllerRef.current.accuseCulprit(suspectId);
    setAccusationResult(result);
    if (result.isCorrect) {
      setIsTimerRunning(false);
    }
    return result;
  }, []);

  return {
    currentPuzzle,
    availablePuzzles,
    selectCase,
    board,
    selectedSuspect,
    setSelectedSuspect,
    activeTool,
    setActiveTool,
    notesMode,
    setNotesMode,
    strikes,
    maxStrikes,
    formattedTime,
    checkedClues,
    toggleClueChecked,
    handleCellClick,
    undo,
    redo,
    canUndo: controllerRef.current?.getCommandManager().canUndo() ?? false,
    canRedo: controllerRef.current?.getCommandManager().canRedo() ?? false,
    lastFeedback,
    forensicReport,
    accusationResult,
    accuseCulprit,
    closeAccusationModal: () => setAccusationResult(null),
  };
}
