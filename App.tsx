import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { DesignState, PriceBreakdown, ChatMessage, ProductType, MetalType, GemType, ProngType, ShapeType, CustomShape, ContextMenuData, MeshModification } from './types';
import { PRICES, INITIAL_STATE, SHAPE_COST } from './constants';
import JewelryModel from './components/JewelryModel';
import Controls from './components/Controls';
import { interpretDesignRequest, generateReceiptDescription } from './services/geminiService';
import { Send, Sparkles, Bot, Trash2, MoveUp, MoveDown, BoxSelect } from 'lucide-react';

const App: React.FC = () => {
  const [design, setDesign] = useState<DesignState>(INITIAL_STATE);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | 'gem' | null>(null);
  
  // Transform Mode State
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello. I am your LuxeCraft AI Architect. Tell me what you envision, e.g., "A rose gold ring with a large ruby".', isSystem: true }
  ]);

  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [meshModification, setMeshModification] = useState<MeshModification | null>(null);

  const price = useMemo((): PriceBreakdown => {
    const productMult = PRICES.PRODUCT_MULTIPLIER[design.productType];
    const metalBase = PRICES.METALS[design.metal] * productMult * (1 + (design.bandWidth - 1) * 0.2);
    const gemBase = PRICES.GEMS[design.gem];
    const cutMultiplier = PRICES.GEM_CUT_MULTIPLIERS[design.gemCut] || 1;
    const gemTotal = (gemBase * Math.pow(design.gemSize, 1.5)) * cutMultiplier;
    const prongCost = PRICES.PRONGS[design.prong] || 0;
    const labor = PRICES.BASE_LABOR * productMult;
    const shapesCost = (design.customShapes?.length || 0) * SHAPE_COST;

    return {
        base: 0,
        metalCost: Math.round(metalBase),
        gemCost: Math.round(gemTotal),
        prongCost: Math.round(prongCost),
        labor: Math.round(labor + shapesCost),
        total: Math.round(metalBase + gemTotal + prongCost + labor + shapesCost)
    };
  }, [design]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleAIChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAIProcessing) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAIProcessing(true);
    const result = await interpretDesignRequest(userMsg.text, design);
    if (result.updates) setDesign(prev => ({ ...prev, ...result.updates }));
    setMessages(prev => [...prev, { role: 'model', text: result.text }]);
    setIsAIProcessing(false);
  };

  const handleExport = async () => {
      setIsAIProcessing(true);
      const description = await generateReceiptDescription(design);
      setIsAIProcessing(false);
      const receipt = `
      LUXECRAFT 3D STUDIO
      -------------------
      Item: ${description}
      Configuration:
      - Type: ${design.productType}
      - Metal: ${design.metal}
      - Gem: ${design.gem} (${design.gemCut}, ${design.gemSize}ct)
      - Setting: ${design.prong}
      - Custom Shapes: ${design.customShapes?.length || 0}
      - Engraving: ${design.engraving || "None"}
      Total Estimate: $${price.total.toLocaleString()}
      -------------------
      Order Reference: #${Math.floor(Math.random() * 100000)}
      `;
      alert(receipt);
  };
  
  const handleGemMove = (position: THREE.Vector3, normal: THREE.Vector3) => {
      // Only handle surface clicking when NOT manually transforming via gizmo
      // This logic is mostly for initial placement.
      // If we are in transform mode for GEM, we don't want this to override unless explicitly clicking surface.
      // The JewelryModel component handles the distinction between surface click and gizmo drag.
      
      if (selectedElement === 'gem' || !selectedElement) {
        setDesign(prev => ({
            ...prev,
            gemPosition: [position.x, position.y, position.z],
            gemNormal: [normal.x, normal.y, normal.z]
        }));
        setSelectedElement('gem');
      }
  };

  // Handler for Gizmo Transforms
  const handleTransformChange = (id: string | 'gem', position: THREE.Vector3, rotation: THREE.Euler) => {
      if (id === 'gem') {
         setDesign(prev => ({
             ...prev,
             gemPosition: [position.x, position.y, position.z],
             gemRotation: [rotation.x, rotation.y, rotation.z]
         }));
      } else {
         setDesign(prev => ({
             ...prev,
             customShapes: prev.customShapes.map(s => 
                 s.id === id 
                 ? { ...s, position: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z] }
                 : s
             )
         }));
      }
  }

  const handleAddShape = (type: ShapeType) => {
      const newShape: CustomShape = {
          id: `shape-${Date.now()}`,
          type,
          position: [0, 2, 0],
          rotation: [0, 0, 0]
      };
      setDesign(prev => ({ ...prev, customShapes: [...(prev.customShapes || []), newShape] }));
      setSelectedElement(newShape.id);
  };

  const handleRemoveShape = (id: string) => {
      setDesign(prev => ({ ...prev, customShapes: prev.customShapes.filter(s => s.id !== id) }));
      if (selectedElement === id) setSelectedElement(null);
  };

  const handleSelectLayer = (id: string | 'gem') => setSelectedElement(id);
  const handleContextMenu = (data: ContextMenuData) => setContextMenu(data);
  const applyModification = (type: 'extrude' | 'intrude' | 'delete') => {
      if (contextMenu && contextMenu.faceIndex !== undefined) {
          setMeshModification({ type, meshId: contextMenu.meshId, faceIndex: contextMenu.faceIndex, timestamp: Date.now() });
          setContextMenu(null);
      }
  };

  const themeBg = isDarkMode ? '#09090b' : '#f9fafb';

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-gray-900'}`} onContextMenu={(e) => e.preventDefault()}>
      
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}>
          <color attach="background" args={[themeBg]} />
          <fog attach="fog" args={[themeBg, 10, 30]} />
          <Suspense fallback={null}>
            <PresentationControls 
                global 
                zoom={0.8} 
                rotation={[0, -Math.PI / 4, 0]} 
                polar={[-Math.PI / 4, Math.PI / 4]} 
                azimuth={[-Math.PI / 4, Math.PI / 4]}
                snap={true}
                config={{ mass: 2, tension: 500 }}
            >
                <JewelryModel 
                    design={design} 
                    onGemMove={handleGemMove} 
                    isEditMode={isEditMode} 
                    isDarkMode={isDarkMode}
                    selectedElement={selectedElement}
                    onContextMenu={handleContextMenu}
                    modification={meshModification}
                    transformMode={transformMode}
                    onTransformChange={handleTransformChange}
                />
            </PresentationControls>
            <Environment preset={isDarkMode ? "studio" : "city"} />
            <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={20} blur={2} far={4.5} color={isDarkMode ? '#000' : '#a1a1aa'} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={[512, 512]} castShadow intensity={20} color="#fff" />
            <pointLight position={[-10, -10, -10]} intensity={5} color="#ff0000" /> 
            <pointLight position={[0, -5, 5]} intensity={5} color="#0000ff" />
          </Suspense>
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} enableZoom={true} enablePan={false} />
        </Canvas>
      </div>

      {contextMenu && isEditMode && (
        <div className="fixed z-50 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 min-w-[160px] backdrop-blur-md" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-700 mb-1"><span className="text-xs font-bold uppercase text-amber-500 tracking-wider">Mesh Tools</span></div>
            <button onClick={() => applyModification('extrude')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"><MoveUp size={14} /> Extrude Face</button>
            <button onClick={() => applyModification('intrude')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"><MoveDown size={14} /> Intrude Face</button>
            <button onClick={() => applyModification('delete')} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center gap-2"><Trash2 size={14} /> Delete Polygon</button>
        </div>
      )}

      <Controls 
        design={design} 
        setDesign={setDesign} 
        price={price} 
        onExport={handleExport} 
        isAIProcessing={isAIProcessing} 
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        isAdvancedMode={isAdvancedMode}
        setIsAdvancedMode={setIsAdvancedMode}
        onAddShape={handleAddShape}
        onRemoveShape={handleRemoveShape}
        selectedElement={selectedElement}
        onSelectLayer={handleSelectLayer}
        transformMode={transformMode}
        setTransformMode={setTransformMode}
      />

      <div className={`fixed z-30 transition-all duration-300 ${chatOpen ? 'bottom-4 right-4 left-4 md:left-auto md:bottom-8 md:right-auto md:left-88 w-auto md:w-96' : 'bottom-4 left-4 md:bottom-8 md:left-88 w-auto'}`}>
        {!chatOpen && <button onClick={() => setChatOpen(true)} className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-900/40 hover:bg-amber-500 transition-all"><Sparkles size={20} /></button>}
        {chatOpen && (
            <div className={`${isDarkMode ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border rounded-xl shadow-2xl flex flex-col overflow-hidden h-[400px] max-h-[50vh] md:max-h-[500px] transition-colors duration-300`}>
                <div className={`h-12 flex items-center justify-between px-4 border-b shrink-0 ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100/50 border-gray-200'}`}>
                    <div className="flex items-center gap-2"><Bot size={16} className="text-amber-500" /><span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Design Assistant</span></div>
                    <button onClick={() => setChatOpen(false)} className={`${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-gray-800'}`}>×</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${m.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : isDarkMode ? 'bg-zinc-800 text-zinc-300 rounded-bl-none border border-zinc-700' : 'bg-gray-100 text-gray-700 rounded-bl-none border border-gray-200'}`}>{m.text}</div>
                        </div>
                    ))}
                    {isAIProcessing && <div className="flex justify-start"><div className={`${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'} px-3 py-2 rounded-lg text-xs italic animate-pulse`}>Thinking...</div></div>}
                </div>
                <form onSubmit={handleAIChat} className={`p-3 border-t flex gap-2 shrink-0 ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask to change metal, gem..." className={`flex-1 border rounded-lg px-3 text-xs focus:outline-none focus:border-amber-500 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                    <button type="submit" disabled={isAIProcessing} className={`w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 disabled:opacity-50 ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'}`}><Send size={14} /></button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;