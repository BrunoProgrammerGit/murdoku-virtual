import React, { useState } from 'react';
import { BookOpen, MapPin, Compass, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface OfficialRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialRulesModal: React.FC<OfficialRulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'RULES' | 'MAP' | 'GLOSSARY'>('RULES');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-[3px] border-[#1E1E24] rounded-2xl shadow-[6px_6px_0px_#1E1E24] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#E76F51] text-white p-3.5 border-b-[2.5px] border-[#1E1E24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#1E1E24] text-[#FFB703] rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black font-sans uppercase tracking-wide">
                Reglamento Oficial de Murdoku
              </h2>
              <p className="text-[11px] text-white/90 font-mono">
                Manual de investigación y deducción criminalística
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white hover:bg-black/20 rounded-lg transition-colors"
            title="Cerrar reglamento"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex bg-[#EFECE6] border-b-2 border-[#1E1E24] p-1 gap-1 text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('RULES')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'RULES'
                ? 'bg-[#1E1E24] text-white shadow-[2px_2px_0px_#E76F51]'
                : 'text-[#1E1E24] hover:bg-white/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#FFB703]" />
            <span>4 Reglas Básicas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GLOSSARY')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'GLOSSARY'
                ? 'bg-[#1E1E24] text-white shadow-[2px_2px_0px_#E76F51]'
                : 'text-[#1E1E24] hover:bg-white/60'
            }`}
          >
            <Compass className="w-4 h-4 text-[#2A9D8F]" />
            <span>Términos y Glosario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MAP')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'MAP'
                ? 'bg-[#1E1E24] text-white shadow-[2px_2px_0px_#E76F51]'
                : 'text-[#1E1E24] hover:bg-white/60'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#E76F51]" />
            <span>Mapa del Caso</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'RULES' && (
            <div className="space-y-3.5">
              <div className="bg-[#2A9D8F]/15 border-[1.5px] border-[#2A9D8F] p-2.5 rounded-xl text-xs font-mono text-[#1E1E24] leading-relaxed">
                <span className="font-bold text-[#1E1E24]">Principio general: </span>
                Murdoku se parece al sudoku porque cada colocación presiona una fila y una columna, pero la prueba sale de la escena del crimen.
              </div>

              {/* Regla 01 */}
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[3px_3px_0px_#1E1E24]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#E76F51] text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                    01
                  </span>
                  <h3 className="font-black text-sm text-[#1E1E24]">
                    Una persona por fila y columna
                  </h3>
                </div>
                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  Cada fila y cada columna pueden contener solo un sospechoso o una víctima. Una persona confirmada bloquea esas líneas para los demás.
                </p>
              </div>

              {/* Regla 02 */}
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[3px_3px_0px_#1E1E24]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#2A9D8F] text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                    02
                  </span>
                  <h3 className="font-black text-sm text-[#1E1E24]">
                    Todas las pistas deben cumplirse
                  </h3>
                </div>
                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  Las cartas describen salas, objetos, direcciones o relaciones. Léelas como reglas obligatorias, no como sugerencias.
                </p>
              </div>

              {/* Regla 03 */}
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[3px_3px_0px_#1E1E24]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#E9C46A] text-black text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                    03
                  </span>
                  <h3 className="font-black text-sm text-[#1E1E24]">
                    El mapa es evidencia
                  </h3>
                </div>
                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  Habitaciones, muebles, objetos, regiones de color y casillas bloqueadas afectan dónde puede colocarse cada persona.
                </p>
              </div>

              {/* Regla 04 */}
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[3px_3px_0px_#1E1E24]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#D62828] text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                    04
                  </span>
                  <h3 className="font-black text-sm text-[#1E1E24]">
                    Encuentra al asesino al final
                  </h3>
                </div>
                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  Con el tablero resuelto, el asesino es quien queda a solas con la víctima dentro de la misma zona.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'GLOSSARY' && (
            <div className="space-y-3">
              <div className="bg-[#FAF8F5] border-[1.5px] border-[#1E1E24] p-2 rounded-lg text-xs font-mono text-gray-600">
                Términos clave extraídos de las tarjetas de pistas de Murdoku:
              </div>

              {/* Beside */}
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[2px_2px_0px_#1E1E24]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🧭</span>
                  <h4 className="font-bold text-sm text-[#1E1E24] font-mono">
                    Beside (Al lado)
                  </h4>
                </div>
                <p className="text-xs text-gray-800 font-sans">
                  Adyacente arriba, abajo, izquierda o derecha (ortogonalmente contiguo). Las diagonales no cuentan.
                </p>
              </div>

              {/* South of */}
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[2px_2px_0px_#1E1E24]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">⬇️</span>
                  <h4 className="font-bold text-sm text-[#1E1E24] font-mono">
                    South of (Al sur de)
                  </h4>
                </div>
                <p className="text-xs text-gray-800 font-sans">
                  Más abajo en el mapa que la persona u objeto de referencia (fila con índice numérico mayor). Del mismo modo: <span className="font-bold">North of</span> (más arriba), <span className="font-bold">East of</span> (a la derecha) y <span className="font-bold">West of</span> (a la izquierda).
                </p>
              </div>

              {/* Only person */}
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[2px_2px_0px_#1E1E24]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">👤</span>
                  <h4 className="font-bold text-sm text-[#1E1E24] font-mono">
                    Only person (Única persona)
                  </h4>
                </div>
                <p className="text-xs text-gray-800 font-sans">
                  Ningún otro sospechoso cumple esa condición u objeto. Por ejemplo, la única persona en una sala, o la única ocupando una silla.
                </p>
              </div>

              {/* Alone with */}
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[2px_2px_0px_#1E1E24]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🔪</span>
                  <h4 className="font-bold text-sm text-[#D62828] font-mono">
                    Alone with (A solas con)
                  </h4>
                </div>
                <p className="text-xs text-gray-800 font-sans">
                  La víctima y el asesino quedan aislados juntos en la región relevante. Exactamente dos personas en esa zona: la víctima y el culpable.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'MAP' && (
            <div className="space-y-3">
              <div className="bg-white border-[2px] border-[#1E1E24] p-3 rounded-xl shadow-[2px_2px_0px_#1E1E24]">
                <h4 className="font-bold text-sm text-[#1E1E24] mb-1 font-sans">
                  02 Mapa del caso
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed mb-3">
                  El mapa es una cuadrícula de posiciones posibles. Etiquetas de sala, regiones de color, muebles, plantas, alfombras, estanterías y sillas pueden aparecer en las pistas.
                </p>

                {/* Elementos clave */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#EFECE6] border border-gray-400 flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <div>
                      <span className="font-bold text-gray-900 block">Estantería</span>
                      <span className="text-[10px] text-red-700 font-bold">Bloqueado</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#EFECE6] border border-gray-400 flex items-center gap-2">
                    <span className="text-lg">🛋️</span>
                    <div>
                      <span className="font-bold text-gray-900 block">Sillón / Silla</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Ocupable</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#EFECE6] border border-gray-400 flex items-center gap-2">
                    <span className="text-lg">🪴</span>
                    <div>
                      <span className="font-bold text-gray-900 block">Planta</span>
                      <span className="text-[10px] text-red-700 font-bold">Bloqueado</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#EFECE6] border border-gray-400 flex items-center gap-2">
                    <span className="text-lg">🟪</span>
                    <div>
                      <span className="font-bold text-gray-900 block">Alfombra / Rug</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Ocupable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#EFECE6] border-t-2 border-[#1E1E24] flex items-center justify-between">
          <span className="text-[11px] font-mono text-gray-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Integrado en el Motor de Reglas Hexagonal
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#1E1E24] text-white text-xs font-mono font-bold px-4 py-1.5 rounded-lg border border-black shadow-[2px_2px_0px_#E76F51] hover:bg-black transition-all active:translate-y-0.5"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
