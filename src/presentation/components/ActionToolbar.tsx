import React from 'react';
import { ToolType } from '../hooks/useMurdokuGame';

interface ActionToolbarProps {
  activeTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  notesMode: boolean;
  onToggleNotesMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenAccusation: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  activeTool,
  onChangeTool,
  notesMode,
  onToggleNotesMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenAccusation,
}) => {
  return (
    <div className="w-full bg-[#FAF8F5] border-[2.5px] border-[#1E1E24] rounded-xl p-2 shadow-[4px_4px_0px_#1E1E24] flex items-center justify-between gap-1 select-none">
      {/* Tool 1: Stamp */}
      <button
        type="button"
        onClick={() => onChangeTool('STAMP')}
        className={`flex-1 py-1.5 px-2 rounded-lg border-[2px] border-[#1E1E24] flex flex-col items-center justify-center transition-all ${
          activeTool === 'STAMP' && !notesMode
            ? 'bg-[#FFB703] shadow-[2px_2px_0px_#1E1E24] translate-y-[-2px]'
            : 'bg-white hover:bg-gray-100'
        }`}
      >
        <span className="text-sm">👤</span>
        <span className="text-[9px] font-bold uppercase tracking-tight font-sans">Fijar</span>
      </button>

      {/* Tool 2: Cross */}
      <button
        type="button"
        onClick={() => onChangeTool('CROSS')}
        className={`flex-1 py-1.5 px-2 rounded-lg border-[2px] border-[#1E1E24] flex flex-col items-center justify-center transition-all ${
          activeTool === 'CROSS'
            ? 'bg-[#FFB703] shadow-[2px_2px_0px_#1E1E24] translate-y-[-2px]'
            : 'bg-white hover:bg-gray-100'
        }`}
      >
        <span className="text-sm text-red-600 font-black font-mono">✖</span>
        <span className="text-[9px] font-bold uppercase tracking-tight font-sans">Tachar</span>
      </button>

      {/* Tool 3: Notes Mode */}
      <button
        type="button"
        onClick={onToggleNotesMode}
        className={`flex-1 py-1.5 px-2 rounded-lg border-[2px] border-[#1E1E24] flex flex-col items-center justify-center relative transition-all ${
          notesMode
            ? 'bg-[#FFB703] shadow-[2px_2px_0px_#1E1E24] translate-y-[-2px]'
            : 'bg-white hover:bg-gray-100'
        }`}
      >
        <span className="text-sm">✏️</span>
        <span className="text-[9px] font-bold uppercase tracking-tight font-sans">Notas</span>
        {notesMode && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 border border-black"></span>
        )}
      </button>

      {/* Tool 4: Eraser */}
      <button
        type="button"
        onClick={() => onChangeTool('ERASE')}
        className={`flex-1 py-1.5 px-2 rounded-lg border-[2px] border-[#1E1E24] flex flex-col items-center justify-center transition-all ${
          activeTool === 'ERASE'
            ? 'bg-[#FFB703] shadow-[2px_2px_0px_#1E1E24] translate-y-[-2px]'
            : 'bg-white hover:bg-gray-100'
        }`}
      >
        <span className="text-sm">🧽</span>
        <span className="text-[9px] font-bold uppercase tracking-tight font-sans">Borrar</span>
      </button>

      {/* Separator */}
      <div className="h-8 w-[1.5px] bg-[#1E1E24]/30 mx-0.5"></div>

      {/* Undo */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded-lg border-[2px] border-[#1E1E24] flex items-center justify-center transition-all ${
          canUndo
            ? 'bg-white hover:bg-[#FFB703] active:translate-y-0.5 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 opacity-60'
        }`}
        title="Deshacer (Undo)"
      >
        <span className="text-xs font-black">↩</span>
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded-lg border-[2px] border-[#1E1E24] flex items-center justify-center transition-all ${
          canRedo
            ? 'bg-white hover:bg-[#FFB703] active:translate-y-0.5 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 opacity-60'
        }`}
        title="Rehacer (Redo)"
      >
        <span className="text-xs font-black">↪</span>
      </button>

      {/* Accusation CTA */}
      <button
        type="button"
        onClick={onOpenAccusation}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] active:translate-y-0.5 text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
      >
        <span>⚖️</span>
        <span className="font-sans">Acusar</span>
      </button>
    </div>
  );
};
