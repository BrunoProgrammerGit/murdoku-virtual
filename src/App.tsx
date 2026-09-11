import React, { useState } from 'react';
import { useMurdokuGame } from './presentation/hooks/useMurdokuGame';
import { MurdokuBoardView } from './presentation/components/MurdokuBoardView';
import { SuspectsCarousel } from './presentation/components/SuspectsCarousel';
import { CluesNotebook } from './presentation/components/CluesNotebook';
import { ActionToolbar } from './presentation/components/ActionToolbar';
import { ArchitectureViewer } from './presentation/components/ArchitectureViewer';
import { UnitTestsRunner } from './presentation/components/UnitTestsRunner';
import { AccusationModal } from './presentation/components/AccusationModal';
import { OfficialRulesModal } from './presentation/components/OfficialRulesModal';
import { ClueEvaluationStatus } from './domain/strategies/IClueStrategy';
import { Shield, Gamepad2, FileCode2, TestTube2, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';

export default function App() {
  const {
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
    canUndo,
    canRedo,
    lastFeedback,
    forensicReport,
    accusationResult,
    accuseCulprit,
    closeAccusationModal,
  } = useMurdokuGame();

  const [activeScreen, setActiveScreen] = useState<'GAME' | 'ARCHITECTURE' | 'TESTS'>('GAME');
  const [isAccusationModalOpen, setIsAccusationModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Conjunto de sospechosos colocados
  const placedSuspectIds = React.useMemo(() => {
    const set = new Set<string>();
    if (!board) return set;
    for (const cell of board.getAllCells()) {
      if (cell.state.isCheck() && cell.state.suspectId) {
        set.add(cell.state.suspectId);
      }
    }
    return set;
  }, [board]);

  // Mapa de status de pistas
  const clueStatusMap = React.useMemo(() => {
    const map = new Map<string, ClueEvaluationStatus>();
    if (forensicReport) {
      for (const ec of forensicReport.evaluatedClues) {
        map.set(ec.clueId, ec.status);
      }
    }
    return map;
  }, [forensicReport]);

  if (!currentPuzzle || !board) {
    return (
      <div className="min-h-screen bg-[#5B7B6D] flex items-center justify-center p-4">
        <div className="bg-[#FAF8F5] p-6 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#1E1E24] text-center font-mono">
          <div className="animate-spin text-2xl mb-2">🔍</div>
          <p className="font-bold text-sm">Cargando expediente forense...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#5B7B6D] flex flex-col items-center justify-start text-[#1E1E24] font-sans antialiased pb-12">
      {/* Top Header / App Bar */}
      <header className="sticky top-0 z-40 w-full max-w-md bg-[#FAF8F5] border-b-[3px] border-[#1E1E24] px-3.5 py-2.5 shadow-[0_3px_0px_rgba(0,0,0,0.15)] flex items-center justify-between">
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFB703] border-[2px] border-[#1E1E24] flex items-center justify-center font-black text-sm shadow-[1.5px_1.5px_0px_#1E1E24]">
            🔍
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-base text-red-600 tracking-tight flex items-center font-sans">
                MURD<span className="text-black">O</span>KU
              </span>
              <span className="bg-red-600 text-white text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border border-black">
                {currentPuzzle.difficulty}
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-700 font-bold uppercase truncate max-w-[140px]">
              Caso #{currentPuzzle.caseNumber}: {currentPuzzle.title}
            </p>
          </div>
        </div>

        {/* Timer & Strikes */}
        <div className="flex items-center gap-2">
          {/* Timer */}
          <div className="bg-white px-2 py-1 rounded-md border-[1.5px] border-[#1E1E24] flex items-center gap-1 shadow-sm text-xs font-mono font-bold">
            <span>⏱️</span>
            <span>{formattedTime}</span>
          </div>

          {/* Strikes */}
          <div className="bg-white px-1.5 py-1 rounded-md border-[1.5px] border-[#1E1E24] flex items-center gap-1 shadow-sm" title={`Errores: ${strikes}/${maxStrikes}`}>
            {Array.from({ length: maxStrikes }).map((_, i) => (
              <span
                key={i}
                className={`text-xs ${
                  i < strikes ? 'opacity-30 line-through grayscale' : 'text-red-600 font-bold'
                }`}
              >
                🐾
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main Nav Switches between Game, Architecture & Tests */}
      <nav className="w-full max-w-md px-3.5 pt-2.5 flex gap-1.5">
        <button
          type="button"
          onClick={() => setActiveScreen('GAME')}
          className={`flex-1 py-1.5 px-2 rounded-lg border-[2px] border-[#1E1E24] text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition-all ${
            activeScreen === 'GAME'
              ? 'bg-[#FFB703] shadow-[2px_2px_0px_#1E1E24] translate-y-[-1px]'
              : 'bg-[#FAF8F5]/80 hover:bg-[#FAF8F5]'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Tablero</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('ARCHITECTURE')}
          className={`flex-1 py-1.5 px-2 rounded-lg border-[2px] border-[#1E1E24] text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition-all ${
            activeScreen === 'ARCHITECTURE'
              ? 'bg-[#FFB703] shadow-[2px_2px_0px_#1E1E24] translate-y-[-1px]'
              : 'bg-[#FAF8F5]/80 hover:bg-[#FAF8F5]'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Hexagonal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('TESTS')}
          className={`flex-1 py-1.5 px-2 rounded-lg border-[2px] border-[#1E1E24] text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition-all ${
            activeScreen === 'TESTS'
              ? 'bg-[#FFB703] shadow-[2px_2px_0px_#1E1E24] translate-y-[-1px]'
              : 'bg-[#FAF8F5]/80 hover:bg-[#FAF8F5]'
          }`}
        >
          <TestTube2 className="w-3.5 h-3.5" />
          <span>Tests TDD</span>
        </button>
      </nav>

      {/* Main Screen Container */}
      <main className="w-full max-w-md px-3.5 pt-2.5 space-y-3">
        {activeScreen === 'GAME' && (
          <>
            {/* Case Selector & Official Rules Trigger */}
            <div className="flex items-center justify-between bg-[#FAF8F5] p-2 rounded-xl border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase text-gray-700 shrink-0">
                  Caso:
                </span>
                <select
                  value={currentPuzzle.caseNumber}
                  onChange={e => selectCase(Number(e.target.value))}
                  className="text-xs font-mono font-bold bg-white border border-black rounded px-1.5 py-1 w-full truncate"
                >
                  {availablePuzzles.map(p => (
                    <option key={p.id} value={p.caseNumber}>
                      #{p.caseNumber}: {p.title} ({p.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsRulesModalOpen(true)}
                className="bg-[#E76F51] hover:bg-[#D45D40] text-white text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg border border-black shadow-[1.5px_1.5px_0px_#1E1E24] flex items-center gap-1 shrink-0 transition-transform active:translate-y-0.5 cursor-pointer"
                title="Abrir reglamento oficial de Murdoku"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Reglas</span>
              </button>
            </div>

            {/* Briefing Card con las 4 Reglas Oficiales */}
            <section className="bg-[#FAF8F5] rounded-xl border-[2.5px] border-[#1E1E24] p-3 shadow-[3px_3px_0px_#1E1E24] space-y-2 relative">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xs text-gray-900 leading-snug">
                    <span className="text-red-600 font-black">¡{currentPuzzle.victimId} fue asesinada!</span> El asesino está <span className="underline decoration-red-600 font-black bg-amber-100 px-0.5">a solas con ella</span> en la misma zona.
                  </p>
                </div>
              </div>

              {/* Badges de las 4 Reglas Oficiales */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-dashed border-gray-300">
                <div className="bg-white p-1.5 rounded border border-[#1E1E24] text-[9px] font-mono">
                  <span className="font-black text-[#E76F51] block">01 FILA Y COLUMNA</span>
                  1 persona por línea. Bloquea líneas para los demás.
                </div>
                <div className="bg-white p-1.5 rounded border border-[#1E1E24] text-[9px] font-mono">
                  <span className="font-black text-[#2A9D8F] block">02 PISTAS OBLIGATORIAS</span>
                  Direcciones y salas son reglas estrictas.
                </div>
                <div className="bg-white p-1.5 rounded border border-[#1E1E24] text-[9px] font-mono">
                  <span className="font-black text-[#E9C46A] text-black block">03 MAPA ES EVIDENCIA</span>
                  Muebles, objetos y casillas bloqueadas.
                </div>
                <div className="bg-white p-1.5 rounded border border-[#1E1E24] text-[9px] font-mono">
                  <span className="font-black text-[#D62828] block">04 ALONE WITH</span>
                  Asesino a solas con la víctima en su zona.
                </div>
              </div>

              {/* Live Rule Status Feedback */}
              {forensicReport && !forensicReport.isValid && (
                <div className="mt-2 p-2 bg-red-100 rounded border border-red-500 text-[10px] font-mono text-red-900 flex items-start gap-1.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Conflicto Forense: </span>
                    {forensicReport.conflicts[0]?.message}
                  </div>
                </div>
              )}

              {forensicReport?.isValid && forensicReport.isSolved && (
                <div className="mt-2 p-2 bg-emerald-100 rounded border border-emerald-500 text-[10px] font-mono text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">¡Todas las pistas y ubicaciones son válidas! Listo para acusar.</span>
                </div>
              )}
            </section>

            {/* Board View */}
            <MurdokuBoardView
              board={board}
              suspects={currentPuzzle.suspects}
              conflicts={forensicReport?.conflicts || []}
              onCellClick={handleCellClick}
              selectedSuspect={selectedSuspect}
            />

            {/* Action Toolbar */}
            <ActionToolbar
              activeTool={activeTool}
              onChangeTool={setActiveTool}
              notesMode={notesMode}
              onToggleNotesMode={() => setNotesMode(prev => !prev)}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onOpenAccusation={() => setIsAccusationModalOpen(true)}
            />

            {/* Suspects Carousel */}
            <SuspectsCarousel
              suspects={currentPuzzle.suspects}
              selectedSuspect={selectedSuspect}
              onSelectSuspect={s => {
                setSelectedSuspect(s);
                setActiveTool('STAMP');
              }}
              placedSuspectIds={placedSuspectIds}
            />

            {/* Clues Notebook */}
            <CluesNotebook
              clues={currentPuzzle.clues}
              checkedClues={checkedClues}
              onToggleClue={toggleClueChecked}
              clueStatuses={clueStatusMap}
            />
          </>
        )}

        {activeScreen === 'ARCHITECTURE' && <ArchitectureViewer />}

        {activeScreen === 'TESTS' && <UnitTestsRunner />}
      </main>

      {/* Accusation Modal */}
      <AccusationModal
        isOpen={isAccusationModalOpen}
        onClose={() => {
          setIsAccusationModalOpen(false);
          closeAccusationModal();
        }}
        suspects={currentPuzzle.suspects}
        victim={currentPuzzle.getVictim()}
        onConfirmAccusation={accuseCulprit}
        result={accusationResult}
      />

      {/* Official Rules Modal */}
      <OfficialRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
