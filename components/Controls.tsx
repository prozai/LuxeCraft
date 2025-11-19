import React, { useState } from 'react';
import { DesignState, MetalType, GemType, ProductType, ProngType, PriceBreakdown, GemCut, ShapeType } from '../types';
import { 
    Diamond, Circle, Square, Type, 
    Undo2, Save, ShoppingBag, Sparkles, 
    Layers, Hammer, Anchor, RefreshCcw, Scan, Menu, X, ChevronDown, ChevronUp, Hexagon,
    Sun, Moon, Move3d, Rotate3d
} from 'lucide-react';

interface ControlsProps {
  design: DesignState;
  setDesign: React.Dispatch<React.SetStateAction<DesignState>>;
  price: PriceBreakdown;
  onExport: () => void;
  isAIProcessing: boolean;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isAdvancedMode: boolean;
  setIsAdvancedMode: (mode: boolean) => void;
  onAddShape: (type: ShapeType) => void;
  onRemoveShape: (id: string) => void;
  selectedElement: string | 'gem' | null;
  onSelectLayer: (id: string | 'gem') => void;
  transformMode: 'translate' | 'rotate';
  setTransformMode: (mode: 'translate' | 'rotate') => void;
}

const Controls: React.FC<ControlsProps> = ({ 
    design, 
    setDesign, 
    price, 
    onExport, 
    isAIProcessing,
    isEditMode,
    setIsEditMode,
    isDarkMode,
    toggleTheme,
    isAdvancedMode,
    setIsAdvancedMode,
    onAddShape,
    onRemoveShape,
    selectedElement,
    onSelectLayer,
    transformMode,
    setTransformMode
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPriceExpanded, setIsPriceExpanded] = useState(false);

  const update = (key: keyof DesignState, value: any) => {
    setDesign(prev => ({ ...prev, [key]: value }));
  };

  const resetGemPos = () => {
      setDesign(prev => ({...prev, gemPosition: null, gemNormal: null, gemRotation: [0,0,0]}));
  }

  const sidebarClass = isDarkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-gray-200 shadow-xl';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-zinc-400' : 'text-gray-500';
  const buttonBase = isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100';
  const buttonActive = isDarkMode ? 'bg-zinc-800 border-amber-500 text-white' : 'bg-white border-amber-500 text-gray-900 shadow-md';
  const inputClass = isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';
  const panelClass = isDarkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-gray-200 shadow-2xl';

  // Helpers to get current transform values for the Properties Panel
  const getSelectedTransform = () => {
      if (!selectedElement) return { pos: [0,0,0], rot: [0,0,0] };
      if (selectedElement === 'gem') {
          return { 
              pos: design.gemPosition || [0, 0, 0], 
              rot: design.gemRotation || [0, 0, 0]
          };
      }
      const shape = design.customShapes.find(s => s.id === selectedElement);
      return shape ? { pos: shape.position, rot: shape.rotation } : { pos: [0,0,0], rot: [0,0,0] };
  };

  const updateSelectedTransform = (type: 'pos' | 'rot', axis: 0 | 1 | 2, val: number) => {
      if (!selectedElement) return;
      setDesign(prev => {
          if (selectedElement === 'gem') {
              const newPos = [...(prev.gemPosition || [0,0,0])] as [number, number, number];
              const newRot = [...(prev.gemRotation || [0,0,0])] as [number, number, number];
              if (type === 'pos') newPos[axis] = val;
              else newRot[axis] = val;
              return { ...prev, gemPosition: newPos, gemRotation: newRot };
          } else {
              return {
                  ...prev,
                  customShapes: prev.customShapes.map(s => {
                      if (s.id !== selectedElement) return s;
                      const newPos = [...s.position] as [number, number, number];
                      const newRot = [...s.rotation] as [number, number, number];
                      if (type === 'pos') newPos[axis] = val;
                      else newRot[axis] = val;
                      return { ...s, position: newPos, rotation: newRot };
                  })
              }
          }
      })
  };

  const { pos, rot } = getSelectedTransform();

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar: Tools */}
      <div className={`fixed inset-y-0 left-0 w-80 backdrop-blur-md border-r p-6 flex flex-col gap-8 overflow-y-auto z-40 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${sidebarClass}`}>
        
        <div className="mb-4 flex justify-between items-center">
            <div>
                <h1 className={`text-2xl font-bold serif tracking-wider ${textPrimary}`}>LUXECRAFT<span className="text-amber-500">.</span></h1>
                <p className={`text-xs uppercase tracking-widest mt-1 ${textSecondary}`}>Bespoke 3D Studio</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className={`md:hidden ${textSecondary} hover:text-amber-500`}><X size={24} /></button>
        </div>

        {/* Standard Tools (Product, Metal, Gem...) - Collapsed code for brevity in update but fully kept in final render */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Layers size={16} /><span className="text-xs font-bold uppercase tracking-widest">Base Type</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {Object.values(ProductType).map((t) => (
                    <button key={t} onClick={() => update('productType', t)} className={`h-20 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${design.productType === t ? `${buttonActive} shadow-[0_0_15px_rgba(245,158,11,0.3)]` : buttonBase}`}>
                        <Circle size={20} strokeWidth={1.5} className={t === ProductType.Ring ? "" : "hidden"} />
                        <Circle size={24} strokeWidth={1.5} className={t === ProductType.Bangle ? "" : "hidden"} />
                        <Square size={20} strokeWidth={1.5} className={t === ProductType.Pendant ? "rotate-45" : "hidden"} />
                        <span className="text-[10px] font-medium">{t}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Hammer size={16} /><span className="text-xs font-bold uppercase tracking-widest">Material</span>
            </div>
            <div className="flex flex-col gap-2">
                {Object.values(MetalType).map((m) => (
                    <button key={m} onClick={() => update('metal', m)} className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${design.metal === m ? buttonActive : buttonBase}`}>
                        <span className="text-sm">{m}</span>
                        <div className={`w-4 h-4 rounded-full border border-zinc-600 shadow-inner`} style={{ background: m === MetalType.Gold ? '#FFD700' : m === MetalType.RoseGold ? '#B76E79' : m === MetalType.Silver ? '#C0C0C0' : m === MetalType.BlackTitanium ? '#1a1a1a' : '#E5E4E2' }} />
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Diamond size={16} /><span className="text-xs font-bold uppercase tracking-widest">Gemstone</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {Object.values(GemType).map((g) => (
                    <button key={g} onClick={() => update('gem', g)} className={`px-3 py-2 text-left rounded-md border transition-all ${design.gem === g ? buttonActive : buttonBase}`}>
                        <span className="text-xs block">{g}</span>
                    </button>
                ))}
            </div>
            
            {design.gem !== GemType.None && (
                <div className="pt-2 space-y-4">
                    <div className="space-y-2">
                         <div className={`flex items-center gap-2 ${textSecondary} text-xs font-semibold uppercase tracking-wide`}>
                             <Hexagon size={12} /><span>Cut Style</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {Object.values(GemCut).map((c) => (
                                <button key={c} onClick={() => update('gemCut', c)} className={`px-3 py-2 text-left text-xs rounded border transition-all ${design.gemCut === c ? buttonActive : buttonBase}`}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className={`flex justify-between text-xs ${textSecondary} mb-1`}><span>Carat Size</span><span>{design.gemSize.toFixed(1)} ct</span></div>
                        <input type="range" min="0.5" max="3.0" step="0.1" value={design.gemSize} onChange={(e) => update('gemSize', parseFloat(e.target.value))} className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-amber-500 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`} />
                    </div>
                     <div className="space-y-2">
                        <div className={`flex items-center gap-2 ${textSecondary} text-xs font-semibold uppercase tracking-wide`}>
                             <Anchor size={12} /><span>Setting</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {Object.values(ProngType).map((p) => (
                                <button key={p} onClick={() => update('prong', p)} className={`px-3 py-2 text-left text-xs rounded border transition-all ${design.prong === p ? buttonActive : buttonBase}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Type size={16} /><span className="text-xs font-bold uppercase tracking-widest">Engraving</span>
            </div>
            <input type="text" maxLength={12} placeholder="Enter text (max 12)" value={design.engraving} onChange={(e) => update('engraving', e.target.value)} className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors ${inputClass}`} />
        </div>

        {/* Advanced Mode Toggle */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <button onClick={() => setIsAdvancedMode(!isAdvancedMode)} className={`w-full py-2 text-xs font-semibold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 ${isAdvancedMode ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : buttonBase}`}>
                <Hexagon size={14} /> Advanced Customization
            </button>
            {isAdvancedMode && (
                <>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        {Object.values(ShapeType).map(s => (
                            <button key={s} onClick={() => onAddShape(s)} className={`px-2 py-2 text-xs rounded border ${buttonBase} flex flex-col items-center gap-1`}><span>+ {s}</span></button>
                        ))}
                    </div>
                    {design.customShapes.length > 0 && (
                        <div className="space-y-1 pt-2">
                            <p className={`text-xs font-bold uppercase ${textSecondary}`}>Layers</p>
                            <div onClick={() => onSelectLayer('gem')} className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer border ${selectedElement === 'gem' ? buttonActive : buttonBase}`}>
                                <span>Main Gem</span>
                            </div>
                            {design.customShapes.map(shape => (
                                 <div key={shape.id} onClick={() => onSelectLayer(shape.id)} className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer border ${selectedElement === shape.id ? buttonActive : buttonBase}`}>
                                     <span>{shape.type}</span>
                                     <button onClick={(e) => { e.stopPropagation(); onRemoveShape(shape.id); }} className="text-red-500 hover:bg-red-100 rounded p-1"><X size={12} /></button>
                                 </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
      </div>

      {/* Right Properties Panel */}
      {isEditMode && isAdvancedMode && selectedElement && (
          <div className={`fixed right-4 md:right-8 top-24 w-64 p-4 rounded-xl backdrop-blur-md border z-30 ${panelClass}`}>
              <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Properties</span>
                  <div className="flex bg-zinc-800/50 rounded p-0.5">
                      <button onClick={() => setTransformMode('translate')} className={`p-1.5 rounded ${transformMode === 'translate' ? 'bg-amber-500 text-white' : 'text-zinc-400'}`} title="Move"><Move3d size={14} /></button>
                      <button onClick={() => setTransformMode('rotate')} className={`p-1.5 rounded ${transformMode === 'rotate' ? 'bg-amber-500 text-white' : 'text-zinc-400'}`} title="Rotate"><Rotate3d size={14} /></button>
                  </div>
              </div>

              <div className="space-y-4">
                  <div>
                      <label className={`text-[10px] uppercase font-semibold mb-1 block ${textSecondary}`}>Position (X, Y, Z)</label>
                      <div className="grid grid-cols-3 gap-1">
                          {[0, 1, 2].map(axis => (
                              <input 
                                key={`pos-${axis}`}
                                type="number" 
                                step="0.1"
                                value={pos[axis as 0|1|2].toFixed(2)}
                                onChange={(e) => updateSelectedTransform('pos', axis as 0|1|2, parseFloat(e.target.value))}
                                className={`w-full px-1 py-1 text-xs text-center rounded ${inputClass}`}
                              />
                          ))}
                      </div>
                  </div>
                  <div>
                      <label className={`text-[10px] uppercase font-semibold mb-1 block ${textSecondary}`}>Rotation (X, Y, Z)</label>
                      <div className="grid grid-cols-3 gap-1">
                          {[0, 1, 2].map(axis => (
                              <input 
                                key={`rot-${axis}`}
                                type="number" 
                                step="0.1"
                                value={rot[axis as 0|1|2].toFixed(2)}
                                onChange={(e) => updateSelectedTransform('rot', axis as 0|1|2, parseFloat(e.target.value))}
                                className={`w-full px-1 py-1 text-xs text-center rounded ${inputClass}`}
                              />
                          ))}
                      </div>
                  </div>
                  {selectedElement === 'gem' && (
                      <button onClick={resetGemPos} className="w-full py-1.5 mt-2 text-xs text-amber-500 border border-amber-500/30 rounded bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center gap-2">
                          <RefreshCcw size={12} /> Reset Transform
                      </button>
                  )}
              </div>
          </div>
      )}

      {/* Top Bar */}
      <div className="fixed top-0 left-0 md:left-80 right-0 h-16 bg-transparent pointer-events-none flex items-center justify-between px-4 md:px-8 z-20">
        <div className="flex items-center gap-4 pointer-events-auto">
             <button onClick={() => setIsMobileMenuOpen(true)} className={`md:hidden w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-sm ${isDarkMode ? 'bg-zinc-900/80 border-zinc-700 text-white' : 'bg-white/80 border-gray-200 text-gray-800'}`}><Menu size={20} /></button>
             <div className={`hidden sm:flex px-4 py-2 backdrop-blur rounded-full border text-xs items-center gap-2 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-white/50 border-gray-200 text-gray-600'}`}>
                <Sparkles size={12} className="text-amber-500" />
                <span>{isEditMode ? "Drag gizmo to transform selected" : "Click metal to place gem"}</span>
             </div>
        </div>

        <div className="flex gap-2 md:gap-4 pointer-events-auto mt-4 md:mt-0">
             <button onClick={toggleTheme} className={`w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-sm transition-all ${isDarkMode ? 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-white/80 border-gray-200 text-gray-600 hover:text-gray-900'}`}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
             <button onClick={() => setIsEditMode(!isEditMode)} className={`h-10 w-10 md:w-auto md:px-4 rounded-full border flex items-center justify-center gap-2 text-xs font-medium transition-all backdrop-blur-sm ${isEditMode ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : isDarkMode ? 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-white/80 border-gray-200 text-gray-600 hover:text-gray-900'}`}>
                <Scan size={16} />
                <span className="hidden md:inline">{isEditMode ? 'Edit Mode' : 'View Mode'}</span>
             </button>
             <button className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-sm ${isDarkMode ? 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-white/80 border-gray-200 text-gray-600 hover:text-gray-900'}`}><Undo2 size={18} /></button>
             <button onClick={onExport} className="px-4 md:px-6 h-10 rounded-full bg-amber-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-amber-900/50 hover:bg-amber-500 transition-all pointer-events-auto"><Save size={16} /><span className="hidden md:inline">Export</span></button>
        </div>
      </div>

      {/* Dynamic Pricing Panel */}
      <div className={`fixed md:absolute bottom-24 md:bottom-8 right-4 md:right-8 backdrop-blur-lg border rounded-2xl transition-all z-20 pointer-events-auto overflow-hidden ${panelClass} ${isPriceExpanded ? 'w-[calc(100%-2rem)] md:w-80 max-h-96' : 'w-[calc(100%-2rem)] md:w-80 max-h-20 md:max-h-96'}`}>
        <div className="flex items-center justify-between p-6 cursor-pointer md:cursor-default" onClick={() => window.innerWidth < 768 && setIsPriceExpanded(!isPriceExpanded)}>
            <div className={`flex items-center gap-2 ${textSecondary}`}><ShoppingBag size={18} /><span className="text-xs uppercase tracking-widest font-semibold">Est. Total</span></div>
            <div className="flex items-center gap-3"><span className={`text-2xl font-serif font-bold ${textPrimary}`}>${price.total.toLocaleString()}</span><div className="md:hidden text-zinc-500">{isPriceExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</div></div>
        </div>
        <div className={`px-6 pb-6 space-y-2 text-xs ${textSecondary} border-t ${isDarkMode ? 'border-zinc-800' : 'border-gray-100'} pt-4`}>
            <div className="flex justify-between"><span>{design.metal} Base</span><span>+${price.metalCost.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>{design.gem} ({design.gemCut})</span><span>+${price.gemCost.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>{design.prong}</span><span>+${price.prongCost.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Craftsmanship</span><span>+${price.labor.toLocaleString()}</span></div>
            {isAIProcessing && <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs animate-pulse"><Sparkles size={12} /><span>AI Architect updating design...</span></div>}
        </div>
      </div>
    </>
  );
};

export default Controls;