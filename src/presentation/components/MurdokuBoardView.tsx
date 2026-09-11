import React, { useState } from 'react';
import { Board } from '../../domain/models/Board';
import { Suspect } from '../../domain/models/Suspect';
import { RuleConflict } from '../../domain/services/RuleEngine';

interface MurdokuBoardViewProps {
  board: Board;
  suspects: readonly Suspect[];
  conflicts: RuleConflict[];
  onCellClick: (row: number, col: number) => void;
  selectedSuspect: Suspect | null;
}

// Colores de fondo por zona según la evidencia del mapa (Regla Oficial 03: "El mapa es evidencia")
const ZONE_COLORS: Record<string, { bg: string; border: string }> = {
  'LIBRARY': { bg: '#EADCF7', border: '#5A189A' }, // Púrpura biblioteca (Imagen 2)
  'DISCUSSION CIRCLE': { bg: '#D1EEF7', border: '#0077B6' }, // Cyan círculo de discusión (Imagen 2)
  'REFRESHMENTS': { bg: '#FDE2E4', border: '#E76F51' }, // Melocotón/Lila zona de refrigerios (Imagen 2)
  'PINE FOREST': { bg: '#D8F3DC', border: '#2D6A4F' },
  'SUMMIT': { bg: '#EDE0D4', border: '#7F5539' },
  "RANGER'S HUT": { bg: '#EAE4D9', border: '#6C584C' },
  'WINDY TRAIL': { bg: '#E2ECE9', border: '#415A77' },
  'BEAR WOODS': { bg: '#EDDCD2', border: '#8A5A44' },
  'LAKE': { bg: '#D0E1FD', border: '#1D3557' },
  'SEA': { bg: '#CAE9FF', border: '#1B4965' },
  'ROCKY TRAIL': { bg: '#E0E1DD', border: '#4A4E69' },
  'BOARDWALK': { bg: '#F5EBE0', border: '#8D6E63' },
  'FISH MARKET': { bg: '#FFE5D9', border: '#D4A373' },
  'WAREHOUSE': { bg: '#E9ECEF', border: '#495057' },
  'DOCK A': { bg: '#D8E2DC', border: '#4A5759' },
  'DOCK B': { bg: '#ECE4DB', border: '#605C55' },
};

export const MurdokuBoardView: React.FC<MurdokuBoardViewProps> = ({
  board,
  suspects,
  conflicts,
  onCellClick,
  selectedSuspect,
}) => {
  const [hoveredCoord, setHoveredCoord] = useState<{ row: number; col: number } | null>(null);
  const [showBlockedLines, setShowBlockedLines] = useState<boolean>(true);

  // Mapa de colores e iniciales por sospechoso
  const suspectMap = React.useMemo(() => {
    const map = new Map<string, Suspect>();
    for (const s of suspects) {
      map.set(s.id, s);
    }
    return map;
  }, [suspects]);

  // Conjunto de coordenadas en conflicto para resaltarlas en rojo pulsante
  const conflictingCoordsSet = React.useMemo(() => {
    const set = new Set<string>();
    for (const conflict of conflicts) {
      for (const coord of conflict.affectedCoordinates) {
        set.add(`${coord.row},${coord.col}`);
      }
    }
    return set;
  }, [conflicts]);

  // Regla Oficial 01: Identificar filas y columnas bloqueadas por personas confirmadas
  const blockedRowsAndCols = React.useMemo(() => {
    const blockedRows = new Set<number>();
    const blockedCols = new Set<number>();

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const cell = board.getCellAt(r, c);
        if (cell.state.isCheck() && cell.state.suspectId) {
          blockedRows.add(r);
          blockedCols.add(c);
        }
      }
    }
    return { blockedRows, blockedCols };
  }, [board]);

  // Calcular etiquetas de zona principales para mostrarlas como sellos flotantes
  const zoneTags = React.useMemo(() => {
    const seen = new Set<string>();
    const tags: { zoneName: string; row: number; col: number }[] = [];
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const cell = board.getCellAt(r, c);
        const name = cell.zoneName.trim();
        if (name && !seen.has(name)) {
          seen.add(name);
          tags.push({ zoneName: name, row: r, col: c });
        }
      }
    }
    return tags;
  }, [board]);

  return (
    <div className="w-full flex flex-col items-center bg-[#7FA18F] p-2.5 rounded-xl border-[2.5px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24]">
      {/* Header bar */}
      <div className="w-full flex flex-wrap justify-between items-center mb-2 px-1 text-[11px] font-mono font-bold text-white tracking-wider gap-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          MAPA DE EVIDENCIA ({board.rows}x{board.cols})
        </span>

        <div className="flex items-center gap-1.5">
          {/* Toggle de Regla 01: Mostrar líneas bloqueadas */}
          <button
            type="button"
            onClick={() => setShowBlockedLines(prev => !prev)}
            className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer ${
              showBlockedLines
                ? 'bg-[#FFB703] text-black border-black font-extrabold shadow-[1px_1px_0px_#1E1E24]'
                : 'bg-[#1E1E24] text-gray-300 border-gray-600'
            }`}
            title="Regla 01: Una persona confirmada bloquea fila y columna para los demás"
          >
            Regla 01: {showBlockedLines ? 'Líneas Bloqueadas ON' : 'Líneas OFF'}
          </button>

          <span className="bg-[#1E1E24] text-white px-2 py-0.5 rounded text-[10px] font-sans">
            Toca para marcar
          </span>
        </div>
      </div>

      {/* Grid container con coordenadas perimetrales */}
      <div className="relative w-full">
        {/* Column Numbers Header (1 .. N) */}
        <div
          className="grid mb-1 pl-5"
          style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: board.cols }).map((_, c) => (
            <div
              key={`col-hdr-${c}`}
              className={`text-center font-mono text-[9px] font-bold ${
                hoveredCoord?.col === c ? 'text-[#FFB703] font-black' : 'text-white/80'
              }`}
            >
              C{c + 1}
            </div>
          ))}
        </div>

        {/* Row Numbers + Grid */}
        <div className="flex">
          {/* Row Numbers Left (1 .. N) */}
          <div
            className="flex flex-col justify-around pr-1 w-5"
            style={{ height: 'auto' }}
          >
            {Array.from({ length: board.rows }).map((_, r) => (
              <div
                key={`row-hdr-${r}`}
                className={`text-center font-mono text-[9px] font-bold ${
                  hoveredCoord?.row === r ? 'text-[#FFB703] font-black' : 'text-white/80'
                }`}
              >
                F{r + 1}
              </div>
            ))}
          </div>

          {/* Actual Board Grid */}
          <div
            className="relative flex-1 aspect-square bg-[#3A5043] border-[3px] border-[#1E1E24] rounded-lg p-1 shadow-inner grid"
            style={{
              gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${board.rows}, minmax(0, 1fr))`,
              gap: '2px',
            }}
            onMouseLeave={() => setHoveredCoord(null)}
          >
            {/* Floating Zone Badges */}
            {zoneTags.map(tag => (
              <span
                key={tag.zoneName}
                className="absolute z-10 pointer-events-none bg-white/95 text-[#1E1E24] text-[8px] font-black px-1.5 py-0.5 rounded border border-[#1E1E24] shadow-[1px_1px_0px_#1E1E24] uppercase tracking-tighter"
                style={{
                  top: `${(tag.row / board.rows) * 100 + 1}%`,
                  left: `${(tag.col / board.cols) * 100 + 1}%`,
                }}
              >
                {tag.zoneName}
              </span>
            ))}

            {/* 2D Cells */}
            {Array.from({ length: board.rows }).map((_, r) =>
              Array.from({ length: board.cols }).map((_, c) => {
                const cell = board.getCellAt(r, c);
                const isConflicting = conflictingCoordsSet.has(`${r},${c}`);
                const isObstacle = !cell.isOccupable;
                const state = cell.state;
                const placedSuspect = state.suspectId ? suspectMap.get(state.suspectId) : null;

                // Detección de fronteras entre habitaciones (Regla 03: Bordes gruesos de separación)
                const topNeighbor = r > 0 ? board.getCellAt(r - 1, c) : null;
                const bottomNeighbor = r < board.rows - 1 ? board.getCellAt(r + 1, c) : null;
                const leftNeighbor = c > 0 ? board.getCellAt(r, c - 1) : null;
                const rightNeighbor = c < board.cols - 1 ? board.getCellAt(r, c + 1) : null;

                const hasThickTop = topNeighbor && topNeighbor.zoneName !== cell.zoneName;
                const hasThickBottom = bottomNeighbor && bottomNeighbor.zoneName !== cell.zoneName;
                const hasThickLeft = leftNeighbor && leftNeighbor.zoneName !== cell.zoneName;
                const hasThickRight = rightNeighbor && rightNeighbor.zoneName !== cell.zoneName;

                // Detección de líneas bloqueadas según Regla 01
                const isRowBlocked = showBlockedLines && blockedRowsAndCols.blockedRows.has(r);
                const isColBlocked = showBlockedLines && blockedRowsAndCols.blockedCols.has(c);

                // Tracking de cursor Sudoku (hover)
                const isHoveredRow = hoveredCoord?.row === r;
                const isHoveredCol = hoveredCoord?.col === c;
                const isDirectlyHovered = isHoveredRow && isHoveredCol;

                // Color según la zona de evidencia
                const zoneColorConfig = ZONE_COLORS[cell.zoneName.toUpperCase()] || {
                  bg: '#FAF8F5',
                  border: '#1E1E24',
                };

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => onCellClick(r, c)}
                    onMouseEnter={() => setHoveredCoord({ row: r, col: c })}
                    className={`relative flex flex-col items-center justify-center rounded-[3px] transition-all select-none overflow-hidden
                      ${hasThickTop ? 'border-t-[2.5px] border-t-[#1E1E24]' : 'border-t border-t-black/20'}
                      ${hasThickBottom ? 'border-b-[2.5px] border-b-[#1E1E24]' : 'border-b border-b-black/20'}
                      ${hasThickLeft ? 'border-l-[2.5px] border-l-[#1E1E24]' : 'border-l border-l-black/20'}
                      ${hasThickRight ? 'border-r-[2.5px] border-r-[#1E1E24]' : 'border-r border-r-black/20'}
                      ${
                        isConflicting
                          ? 'bg-red-200 ring-2 ring-red-600 animate-pulse'
                          : isObstacle
                          ? 'bg-[#9BB4A3] hover:bg-[#8CA895] cursor-not-allowed opacity-90'
                          : cell.fixtureIcon === '🛋️' || cell.fixtureIcon === '🪑'
                          ? 'bg-[#FFF3B0]/90 hover:bg-[#FFE699] cursor-pointer'
                          : cell.fixtureIcon === '🟪'
                          ? 'bg-[#E2D4F0] hover:bg-[#D5C2E8] cursor-pointer'
                          : 'hover:brightness-95 active:scale-95 cursor-pointer'
                      }
                      ${isDirectlyHovered ? 'ring-2 ring-[#FFB703] z-20' : ''}
                    `}
                    style={{
                      backgroundColor:
                        !isObstacle && !isConflicting
                          ? zoneColorConfig.bg
                          : undefined,
                    }}
                    title={`${cell.zoneName} [Fila ${r + 1}, Col ${c + 1}] ${cell.obstacleType || ''}`}
                  >
                    {/* Indicador sutil de línea bloqueada por Regla 01 */}
                    {(isRowBlocked || isColBlocked) && !state.isCheck() && (
                      <div className="absolute inset-0 bg-[#1E1E24]/5 pointer-events-none" />
                    )}

                    {/* Resaltado de eje por hover */}
                    {(isHoveredRow || isHoveredCol) && !isDirectlyHovered && (
                      <div className="absolute inset-0 bg-[#FFB703]/15 pointer-events-none" />
                    )}

                    {/* Obstacle/Fixture Icon */}
                    {cell.fixtureIcon && (
                      <span
                        className={`text-sm select-none ${
                          state.isCheck() ? 'opacity-20 scale-75' : 'opacity-95'
                        }`}
                      >
                        {cell.fixtureIcon}
                      </span>
                    )}

                    {/* State Markings */}
                    {state.isCheck() && placedSuspect && (
                      <div
                        className="absolute inset-1 rounded-full border-[2px] border-[#1E1E24] flex items-center justify-center font-bold text-xs text-black shadow-[1.5px_1.5px_0px_#1E1E24] animate-in zoom-in-75 duration-100 z-10"
                        style={{ backgroundColor: placedSuspect.color }}
                      >
                        {placedSuspect.initial}
                      </div>
                    )}

                    {state.isCross() && (
                      <span className="absolute text-red-600 font-mono font-black text-base leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] z-10">
                        ✕
                      </span>
                    )}

                    {state.isNotes() && state.noteCandidates.length > 0 && (
                      <div className="absolute inset-0.5 flex flex-wrap items-center justify-center gap-0.5 text-[8px] font-mono text-gray-800 leading-none z-10">
                        {state.noteCandidates.map(cand => (
                          <span key={cand} className="bg-amber-200/90 font-bold px-0.5 rounded border border-amber-400">
                            ?{cand.charAt(0)}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="w-full flex flex-wrap items-center justify-between mt-2 px-2 py-1.5 bg-[#FAF8F5] rounded border border-[#1E1E24] text-[10px] font-mono font-bold text-[#1E1E24] gap-1">
        <span className="flex items-center gap-1 text-emerald-800">
          🟢 Ocupable: 🛋️ Sillón, 🟪 Alfombra, Suelo
        </span>
        <span className="flex items-center gap-1 text-red-700">
          🚫 Bloqueo (Regla 03): 📚 Estantería, 🪴 Planta, 🐻 Oso
        </span>
      </div>
    </div>
  );
};
