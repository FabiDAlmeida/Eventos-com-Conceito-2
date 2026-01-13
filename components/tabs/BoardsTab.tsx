
import React, { useState } from 'react';
import { Project, Board, BoardVersion, AssetType, Environment, BoardVariation } from '../../types';
import { Plus, Wand2, Check, X, Layers, Maximize2, History, Loader2, Sparkles } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

const BoardsTab: React.FC<Props> = ({ project, onUpdate }) => {
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Available base images (space photos)
  const spaceAssets = project.assets.filter(a => a.type === AssetType.SPACE_PHOTO);

  const createBoard = (envId: string, assetId: string) => {
    const newBoard: Board = {
      id: crypto.randomUUID(),
      environmentId: envId,
      baseAssetId: assetId,
      directives: {
        goal: '',
        palette: { preferred: [], avoid: [] },
        materials: [],
        lighting: 'Natural',
        must_have: [],
        avoid: [],
        level_of_sophistication: 3,
        decor_density: 'Equilibrada',
        budget_target: project.budgetRange,
        notes: ''
      },
      // Fix: history exists instead of versions in Board type
      history: [],
      fixedElements: []
    };

    onUpdate({
      ...project,
      environments: project.environments.map(e => e.id === envId ? { ...e, boards: [...e.boards, newBoard] } : e)
    });
    setActiveBoardId(newBoard.id);
  };

  const generateVisions = async (board: Board, env: Environment) => {
    setIsGenerating(true);
    try {
      const baseAsset = project.assets.find(a => a.id === board.baseAssetId);
      if (!baseAsset) throw new Error("Base asset not found");

      // 1. Build Prompt
      // Correcting promptData access by ensuring geminiService provides the expected properties
      const promptData = await geminiService.buildEditPrompt(board.directives, baseAsset.analysis, board.fixedElements);
      
      // 2. Generate variation image
      // Fix: Provided correct argument count and type consistency for generateImage
      const imageUrl = await geminiService.generateImage(
        baseAsset.data, 
        promptData.edit_prompt, 
        promptData.negative_prompt,
        false, // usePro
        "1K"   // size
      );

      // Fix: properly structure BoardVariation and BoardVersion based on generated promptData
      const variation: BoardVariation = {
        id: crypto.randomUUID(),
        name: `Versão ${board.history.length + 1}`,
        imageUrl,
        client_summary: promptData.client_summary,
        change_list: promptData.change_list,
        edit_prompt: promptData.edit_prompt,
        negative_prompt: promptData.negative_prompt,
        constraints: promptData.constraints
      };

      const newVersion: BoardVersion = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        variations: [variation]
      };

      onUpdate({
        ...project,
        environments: project.environments.map(e => e.id === env.id ? {
          ...e,
          // Fix: history instead of versions
          boards: e.boards.map(b => b.id === board.id ? { ...b, history: [...b.history, newVersion] } : b)
        } : e)
      });
    } catch (err) {
      console.error("Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const approveVariation = (boardId: string, variationId: string, envId: string) => {
    onUpdate({
      ...project,
      environments: project.environments.map(e => e.id === envId ? {
        ...e,
        boards: e.boards.map(b => b.id === boardId ? { ...b, approvedVariationId: variationId } : b)
      } : e)
    });
  };

  const activeBoard = project.environments.flatMap(e => e.boards).find(b => b.id === activeBoardId);
  const activeEnv = project.environments.find(e => e.boards.some(b => b.id === activeBoardId));

  return (
    <div className="space-y-8">
      {activeBoard && activeEnv ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Directives Sidebar */}
          <div className="w-full lg:w-96 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-y-auto max-h-[calc(100vh-12rem)] sticky top-24">
            <button onClick={() => setActiveBoardId(null)} className="text-slate-400 hover:text-slate-900 mb-6 flex items-center gap-2">
              <History size={16} /> Voltar à lista
            </button>
            <h3 className="text-xl font-bold mb-6">Comandos da Prancha</h3>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Objetivo Visual</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm"
                  rows={3}
                  value={activeBoard.directives.goal}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdate({
                      ...project,
                      environments: project.environments.map(ev => ev.id === activeEnv.id ? {
                        ...ev, boards: ev.boards.map(b => b.id === activeBoard.id ? { ...b, directives: { ...b.directives, goal: val } } : b)
                      } : ev)
                    });
                  }}
                  placeholder="Ex: Criar um jardim encantado com tons de pêssego..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Sofisticação (1-5)</label>
                <input 
                  type="range" min="1" max="5" 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  value={activeBoard.directives.level_of_sophistication}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onUpdate({
                      ...project,
                      environments: project.environments.map(ev => ev.id === activeEnv.id ? {
                        ...ev, boards: ev.boards.map(b => b.id === activeBoard.id ? { ...b, directives: { ...b.directives, level_of_sophistication: val } } : b)
                      } : ev)
                    });
                  }}
                />
              </div>

              <button 
                onClick={() => generateVisions(activeBoard, activeEnv)}
                disabled={isGenerating}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                Gerar Propostas Visuais
              </button>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="flex-1 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
              {/* Fix: use history and navigate variations structure */}
              {activeBoard.history.length > 0 ? (
                <div className="space-y-8">
                  <div className="relative group">
                    <img 
                      src={activeBoard.history[activeBoard.history.length - 1].variations[0].imageUrl} 
                      className="w-full rounded-2xl shadow-2xl"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button 
                        onClick={() => approveVariation(activeBoard.id, activeBoard.history[activeBoard.history.length - 1].variations[0].id, activeEnv.id)}
                        className={`p-3 rounded-full shadow-lg flex items-center gap-2 font-bold ${activeBoard.approvedVariationId === activeBoard.history[activeBoard.history.length - 1].variations[0].id ? 'bg-green-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                       >
                         {activeBoard.approvedVariationId === activeBoard.history[activeBoard.history.length - 1].variations[0].id ? <Check size={20} /> : 'Aprovar esta versão'}
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-50 p-6 rounded-2xl">
                       <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Sparkles size={18} /> Resumo para o Cliente</h4>
                       <p className="text-indigo-800 text-sm">{activeBoard.history[activeBoard.history.length - 1].variations[0].client_summary}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl">
                       <h4 className="font-bold text-slate-900 mb-2">Lista de Alterações</h4>
                       <ul className="text-slate-700 text-sm list-disc pl-4">
                         {activeBoard.history[activeBoard.history.length - 1].variations[0].change_list.map((c, i) => <li key={i}>{c}</li>)}
                       </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-24">
                  <Sparkles size={64} className="mb-4 text-slate-200" />
                  <p className="text-lg font-medium">Configure as diretrizes e gere a primeira proposta.</p>
                </div>
              )}
            </div>

            {/* Version History */}
            {activeBoard.history.length > 1 && (
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2"><History size={20} /> Histórico de Versões</h4>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {activeBoard.history.map(v => (
                    <div key={v.id} className="w-48 shrink-0 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                      <img src={v.variations[0].imageUrl} className="w-full aspect-video object-cover rounded-lg mb-2" />
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold">{v.variations[0].name}</span>
                        {activeBoard.approvedVariationId === v.variations[0].id && <Check size={14} className="text-green-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {project.environments.map(env => (
            <section key={env.id} className="space-y-6">
              <div className="flex items-center gap-3">
                <Layers className="text-indigo-600" />
                <h2 className="text-2xl font-bold">{env.name}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {env.boards.map(board => {
                  const baseAsset = project.assets.find(a => a.id === board.baseAssetId);
                  // Fix: find approved variation in history
                  const approvedVariation = board.history.flatMap(v => v.variations).find(varObj => varObj.id === board.approvedVariationId);
                  return (
                    <div 
                      key={board.id} 
                      onClick={() => setActiveBoardId(board.id)}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-lg transition-all group"
                    >
                      <div className="aspect-[16/9] relative bg-slate-100">
                        <img 
                          src={approvedVariation?.imageUrl || baseAsset?.data} 
                          className="w-full h-full object-cover" 
                        />
                        {board.approvedVariationId && (
                          <div className="absolute top-3 right-3 bg-green-600 text-white p-1.5 rounded-full shadow-lg">
                            <Check size={16} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="text-white" />
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <div className="text-sm font-bold text-slate-900">
                          {board.directives.goal || 'Sem objetivo definido'}
                        </div>
                        <div className="text-xs font-medium text-slate-400">
                          {board.history.length} versões
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="relative group">
                   <div className="bg-slate-50 aspect-[16/9] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:border-indigo-300 transition-all">
                      <Plus size={32} />
                      <span className="text-sm font-bold mt-2">Nova Prancha</span>
                   </div>
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity bg-indigo-900/10 rounded-3xl p-6 overflow-y-auto">
                      <div className="bg-white p-4 rounded-2xl shadow-xl w-full">
                         <p className="text-xs font-bold text-slate-400 uppercase mb-3">Escolha uma foto base</p>
                         <div className="grid grid-cols-2 gap-2">
                           {spaceAssets.map(asset => (
                             <button 
                               key={asset.id} 
                               onClick={() => createBoard(env.id, asset.id)}
                               className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-600"
                             >
                               <img src={asset.data} className="w-full h-full object-cover" />
                             </button>
                           ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardsTab;
