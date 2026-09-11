import React from 'react';
import { Suspect } from '../../domain/models/Suspect';

interface SuspectsCarouselProps {
  suspects: readonly Suspect[];
  selectedSuspect: Suspect | null;
  onSelectSuspect: (suspect: Suspect) => void;
  placedSuspectIds: Set<string>;
}

export const SuspectsCarousel: React.FC<SuspectsCarouselProps> = ({
  suspects,
  selectedSuspect,
  onSelectSuspect,
  placedSuspectIds,
}) => {
  return (
    <div className="w-full bg-[#FAF8F5] rounded-xl border-[2.5px] border-[#1E1E24] p-2.5 shadow-[3px_3px_0px_#1E1E24]">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1E24] flex items-center gap-1.5 font-sans">
          <span>👥</span>
          <span>Sospechosos & Víctima ({suspects.length})</span>
        </h3>
        <span className="text-[10px] font-mono text-gray-500">
          Ubicados: {placedSuspectIds.size}/{suspects.length}
        </span>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 select-none no-scrollbar">
        {suspects.map(suspect => {
          const isSelected = selectedSuspect?.id === suspect.id;
          const isPlaced = placedSuspectIds.has(suspect.id);
          const isVictim = suspect.isVictim();

          return (
            <button
              key={suspect.id}
              type="button"
              onClick={() => onSelectSuspect(suspect)}
              className={`flex-shrink-0 w-24 p-2 rounded-lg border-[2px] transition-all flex flex-col items-center text-center cursor-pointer relative
                ${
                  isSelected
                    ? 'border-[#1E1E24] bg-white ring-2 ring-[#FFB703] shadow-[3px_3px_0px_#1E1E24] scale-105'
                    : isVictim
                    ? 'border-red-500 bg-red-50 hover:bg-red-100 shadow-[2px_2px_0px_#1E1E24]'
                    : 'border-[#1E1E24] bg-[#F4F1EA] hover:bg-white shadow-[2px_2px_0px_#1E1E24]'
                }
              `}
            >
              {/* Avatar circle */}
              <div
                className="w-10 h-10 rounded-full border-[2px] border-[#1E1E24] flex items-center justify-center text-lg mb-1 relative shadow-sm"
                style={{ backgroundColor: suspect.color }}
              >
                <span>{suspect.avatarIcon}</span>
                {isVictim && (
                  <span className="absolute -top-1 -right-1 text-xs">💀</span>
                )}
                {isPlaced && !isVictim && (
                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[8px] font-mono font-bold px-1 rounded-full border border-black">
                    ✓
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-bold leading-tight truncate w-full ${
                  isVictim ? 'text-red-700' : 'text-[#1E1E24]'
                }`}
              >
                {suspect.name}
              </span>

              <p className="text-[8px] font-mono text-gray-600 leading-tight mt-0.5 line-clamp-2">
                {suspect.clueSummary || (isVictim ? 'VÍCTIMA' : '')}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
