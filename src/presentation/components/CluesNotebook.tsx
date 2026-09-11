import React from 'react';
import { Clue } from '../../domain/models/Clue';
import { ClueEvaluationStatus } from '../../domain/strategies/IClueStrategy';

interface CluesNotebookProps {
  clues: readonly Clue[];
  checkedClues: Set<string>;
  onToggleClue: (clueId: string) => void;
  clueStatuses?: Map<string, ClueEvaluationStatus>;
}

export const CluesNotebook: React.FC<CluesNotebookProps> = ({
  clues,
  checkedClues,
  onToggleClue,
  clueStatuses,
}) => {
  return (
    <div className="w-full bg-[#FAF8F5] rounded-xl border-[2.5px] border-[#1E1E24] p-3 shadow-[3px_3px_0px_#1E1E24] space-y-2">
      <div className="flex items-center justify-between border-b-2 border-dashed border-[#1E1E24]/30 pb-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] flex items-center gap-1.5 font-sans">
          <span>📋</span>
          <span>Cuaderno de Pistas & Reglas ({clues.length})</span>
        </h3>
        <span className="text-[10px] font-mono bg-[#FFB703] text-black px-1.5 py-0.5 rounded font-bold border border-black shadow-[1px_1px_0px_#1E1E24]">
          {checkedClues.size}/{clues.length} marcadas
        </span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {clues.map(clue => {
          const isChecked = checkedClues.has(clue.id);
          const liveStatus = clueStatuses?.get(clue.id);

          return (
            <div
              key={clue.id}
              onClick={() => onToggleClue(clue.id)}
              className={`p-2 rounded-lg border-[1.5px] transition-all cursor-pointer flex items-start gap-2 select-none
                ${
                  liveStatus === ClueEvaluationStatus.VIOLATED
                    ? 'border-red-600 bg-red-50 ring-1 ring-red-500'
                    : liveStatus === ClueEvaluationStatus.SATISFIED
                    ? 'border-emerald-600 bg-emerald-50/60'
                    : isChecked
                    ? 'border-gray-300 bg-gray-100 opacity-60'
                    : 'border-[#1E1E24] bg-white hover:bg-[#F9F7F2]'
                }
              `}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleClue(clue.id)}
                className="mt-0.5 rounded text-red-600 focus:ring-0 border border-black cursor-pointer"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="text-sm">{clue.icon}</span>
                  {clue.tag && (
                    <span className="text-[9px] font-mono font-bold bg-[#E4E2DF] px-1.5 py-0.2 rounded border border-gray-400">
                      {clue.tag}
                    </span>
                  )}
                  {liveStatus === ClueEvaluationStatus.SATISFIED && (
                    <span className="text-[8px] font-mono bg-emerald-600 text-white font-bold px-1 rounded">
                      CUMPLIDA ✓
                    </span>
                  )}
                  {liveStatus === ClueEvaluationStatus.VIOLATED && (
                    <span className="text-[8px] font-mono bg-red-600 text-white font-bold px-1 rounded animate-pulse">
                      ¡VIOLADA! ⚠
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs font-mono leading-tight ${
                    isChecked ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {clue.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
