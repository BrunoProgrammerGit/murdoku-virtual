import React, { useState } from 'react';
import { Suspect } from '../../domain/models/Suspect';

interface AccusationModalProps {
  isOpen: boolean;
  onClose: () => void;
  suspects: readonly Suspect[];
  victim: Suspect | undefined;
  onConfirmAccusation: (suspectId: string) => { isCorrect: boolean; reason: string } | null;
  result: { isCorrect: boolean; reason: string } | null;
}

export const AccusationModal: React.FC<AccusationModalProps> = ({
  isOpen,
  onClose,
  suspects,
  victim,
  onConfirmAccusation,
  result,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');

  if (!isOpen && !result) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#FAF8F5] w-full max-w-sm rounded-2xl border-[3px] border-[#1E1E24] p-4 shadow-[6px_6px_0px_#1E1E24] text-[#1E1E24] space-y-3 relative">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg border-[2px] border-black bg-white flex items-center justify-center font-bold text-xs hover:bg-gray-100"
        >
          ✕
        </button>

        {/* Title */}
        <div className="border-b-2 border-[#1E1E24] pb-2">
          <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest block">
            VEREDICTO FORENSE
          </span>
          <h3 className="text-base font-black uppercase font-sans">
            Acusación Formal de Asesinato
          </h3>
        </div>

        {/* Content if not yet submitted or if submitted */}
        {!result ? (
          <div className="space-y-3">
            <div className="bg-[#E76F51]/15 border border-[#E76F51] p-2 rounded-lg">
              <span className="text-[10px] font-mono font-bold text-[#D62828] block uppercase">
                Regla Oficial 04 de Murdoku:
              </span>
              <p className="text-[11px] font-mono text-gray-800 leading-tight">
                «Con el tablero resuelto, el asesino es quien queda a solas con la víctima dentro de la misma zona («Alone with»).»
              </p>
            </div>

            <p className="text-xs font-mono text-gray-700 leading-snug">
              Identifica a la persona que comparte zona en aislamiento estricto con <strong>{victim?.name || 'la víctima'}</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold block uppercase">
                Selecciona al Culpable:
              </label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full text-xs font-mono bg-white border-[2px] border-[#1E1E24] rounded-lg p-2 focus:ring-0 shadow-sm"
              >
                <option value="">-- Elige un sospechoso --</option>
                {suspects
                  .filter(s => !s.isVictim())
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.clueSummary})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-bold font-sans bg-gray-200 border-[2px] border-black rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedId}
                onClick={() => onConfirmAccusation(selectedId)}
                className="flex-1 py-2 text-xs font-black font-sans bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white border-[2px] border-black rounded-lg shadow-[2px_2px_0px_#1E1E24]"
              >
                ¡DICTAR SENTENCIA!
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-center py-2">
            <div
              className={`inline-block px-3 py-1 text-xs font-black uppercase border-[2px] border-black rounded shadow-[2px_2px_0px_#1E1E24] ${
                result.isCorrect
                  ? 'bg-emerald-500 text-white rotate-[-3deg]'
                  : 'bg-red-600 text-white rotate-[3deg]'
              }`}
            >
              {result.isCorrect ? '★ ¡CULPABLE ATRAPADO! ★' : '⚠ ERROR JUDICIAL ⚠'}
            </div>

            <h4 className="text-base font-black font-sans uppercase">
              {result.isCorrect ? '¡CASO RESUELTO CON ÉXITO!' : 'SOSPECHA INFUNDADA'}
            </h4>

            <p className="text-xs font-mono text-gray-800 bg-white p-2.5 rounded-lg border border-black shadow-inner">
              {result.reason}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-[#FFB703] hover:bg-amber-400 font-bold text-xs uppercase border-[2px] border-black rounded-lg shadow-[2px_2px_0px_#1E1E24]"
            >
              Cerrar Expediente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
