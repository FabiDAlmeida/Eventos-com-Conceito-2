
import React, { useState, useRef } from 'react';
import { Project, Environment, AssetType, Asset, BoardVariation, BoardVersion } from '../../types';
import { Plus, Layout, Wand2, Upload, Trash2, RotateCcw, Check, Mic, Square, Loader2, Info, Sparkles, Image as ImageIcon, BrainCircuit, Languages, ChevronRight, Settings2 } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

const EnvironmentsTab: React.FC<Props> = ({ project, onUpdate }) => {
  const [newEnvName, setNewEnvName] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [refinedPrompts, setRefinedPrompts] = useState<Record<string, any>>({});
  
  // Gen Config
  const [useProModel, setUseProModel] = useState(false);
  const [selectedSize, setSelectedSize] = useState<"1K" | "2K" | "4K">("1K");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const furnitureInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [activeUploadContext, setActiveUploadContext] = useState<{ envId: string, type: AssetType } | null>(null);

  const addEnvironment = () => {
    if (!newEnvName.trim()) return;
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name: newEnvName,
      goal: '',
      priority: 'medium',
      referenceAssetIds: [],
      furnitureAssetIds: [],
      boards: []
    };
    onUpdate({ ...project, environments: [...project.environments, newEnv] });
    setNewEnvName('');
  };

  const updateEnvironment = (id: string, fields: Partial<Environment>) => {
    onUpdate({
      ...project,
      environments: project.environments.map(e => e.id === id ? { ...e, ...fields } : e)
    });
  };

  const handleUploadClick = (envId: string, type: AssetType) => {
    setActiveUploadContext({ envId, type });
    if (type === AssetType.SPACE_PHOTO) fileInputRef.current?.click();
    else if (type === AssetType.FURNITURE) furnitureInputRef.current?.click();
    else if (type === AssetType.REFERENCE) referenceInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: AssetType) => {
    const files = e.target.files;
    if (!files || !activeUploadContext) return;

    const fileList = Array.from(files) as File[];

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newAsset: Asset = {
          id: crypto.randomUUID(),
          type: type,
          data: base64,
          tags: [activeUploadContext.type === AssetType.SPACE_PHOTO ? 'Original' : activeUploadContext.type === AssetType.FURNITURE ? 'Mobília' : 'Referência']
        };

        const updatedAssets = [...project.assets, newAsset];
        const updatedEnvs = project.environments.map(env => {
          if (env.id === activeUploadContext.envId) {
            if (type === AssetType.SPACE_PHOTO) return { ...env, beforeAssetId: newAsset.id };
            if (type === AssetType.FURNITURE) return { ...env, furnitureAssetIds: [...env.furnitureAssetIds, newAsset.id] };
            if (type === AssetType.REFERENCE) return { ...env, referenceAssetIds: [...env.referenceAssetIds, newAsset.id].slice(0, 7) };
          }
          return env;
        });

        onUpdate({ ...project, assets: updatedAssets, environments: updatedEnvs });
      };
      reader.readAsDataURL(file);
    });
    setActiveUploadContext(null);
  };

  const startRecording = async (envId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudioBriefing(envId, blob);
      };
      
      recorder.start();
      setIsRecording(envId);
    } catch (err) {
      alert("Acesso ao microfone negado.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(null);
  };

  const processAudioBriefing = async (envId: string, blob: Blob) => {
    setIsProcessingAudio(envId);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await geminiService.transcribeAudioToDirectives(base64);
        if (result.transcript) {
          updateEnvironment(envId, { goal: result.transcript });
          handleRefinePrompt(envId, result.transcript);
        }
      };
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessingAudio(null);
    }
  };

  const handleRefinePrompt = async (envId: string, text: string) => {
    if (!text.trim()) return;
    setIsRefining(envId);
    try {
      const env = project.environments.find(e => e.id === envId);
      const spaceAnalysis = env?.beforeAssetId ? project.assets.find(a => a.id === env.beforeAssetId)?.analysis?.summary : '';
      
      const refined = await geminiService.refineImagePrompt(text, { 
        spaceDescription: spaceAnalysis,
        styles: project.briefingDirectives?.palette.preferred 
      });
      
      setRefinedPrompts(prev => ({ ...prev, [envId]: refined }));
    } catch (err) {
      console.error("Erro ao refinar prompt:", err);
    } finally {
      setIsRefining(null);
    }
  };

  const handleGenerate = async (envId: string) => {
    const env = project.environments.find(e => e.id === envId);
    const refined = refinedPrompts[envId];
    if (!env || !env.beforeAssetId || !refined) return;

    // Check for Pro API Key if needed
    if (useProModel && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setIsGenerating(envId);
    try {
      const baseAsset = project.assets.find(a => a.id === env.beforeAssetId);
      if (!baseAsset) return;

      const imageUrl = await geminiService.generateImage(
        baseAsset.data,
        refined.refined_prompt_en,
        refined.negative_prompt || "blurry, distorted, low quality",
        useProModel,
        selectedSize
      );

      if (!imageUrl) throw new Error("A geração de imagem não retornou dados.");

      const variation: BoardVariation = {
        id: crypto.randomUUID(),
        name: `Proposta Especialista ${useProModel ? '(Pro ' + selectedSize + ')' : ''}`,
        imageUrl,
        client_summary: refined.portuguese_explanation,
        change_list: [],
        edit_prompt: refined.refined_prompt_en,
        negative_prompt: refined.negative_prompt,
        constraints: []
      };

      const newVersion: BoardVersion = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        variations: [variation]
      };

      const updatedEnvs = project.environments.map(e => {
        if (e.id === envId) {
          const updatedBoard = { 
            id: crypto.randomUUID(), 
            environmentId: envId, 
            baseAssetId: env.beforeAssetId!, 
            directives: { ...project.briefingDirectives!, goal: env.goal },
            history: [newVersion], 
            approvedVariationId: variation.id,
            fixedElements: []
          };
          return { ...e, boards: [updatedBoard] };
        }
        return e;
      });

      onUpdate({ ...project, environments: updatedEnvs });
    } catch (err: any) {
      console.error("Erro na geração:", err);
      // O erro já é tratado globalmente no geminiService.handleApiError
    } finally {
      setIsGenerating(null);
    }
  };

  const getAsset = (id?: string) => project.assets.find(a => a.id === id);

  return (
    <div className="space-y-12 pb-32">
      {/* Input de Novo Ambiente */}
      <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex items-end gap-4 max-w-2xl mx-auto">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Identificação do Ambiente</label>
          <input 
            value={newEnvName} 
            onChange={(e) => setNewEnvName(e.target.value)} 
            placeholder="Ex: Cerimônia, Lounge, Mesa de Doces..." 
            className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
          />
        </div>
        <button onClick={addEnvironment} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
          <Plus size={24} />
        </button>
      </div>

      <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, AssetType.SPACE_PHOTO)} className="hidden" accept="image/*" />
      <input type="file" ref={furnitureInputRef} onChange={(e) => handleFileChange(e, AssetType.FURNITURE)} className="hidden" accept="image/*" multiple />
      <input type="file" ref={referenceInputRef} onChange={(e) => handleFileChange(e, AssetType.REFERENCE)} className="hidden" accept="image/*" multiple />

      <div className="space-y-24">
        {project.environments.map(env => {
          const currentBoard = env.boards[0];
          const approvedImage = currentBoard?.history.flatMap(h => h.variations).find(v => v.id === currentBoard.approvedVariationId)?.imageUrl;
          const refined = refinedPrompts[env.id];

          return (
            <div key={env.id} className="bg-white rounded-[60px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-12 py-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <Layout size={20} />
                  </div>
                  {env.name}
                </h3>
                <button 
                  onClick={() => onUpdate({...project, environments: project.environments.filter(e => e.id !== env.id)})}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={24} />
                </button>
              </div>

              <div className="p-12">
                {/* ETAPAS 01 A 04 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                  
                  {/* 01: ESPAÇO ORIGINAL */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">01. Espaço Original</h4>
                    <div 
                      onClick={() => handleUploadClick(env.id, AssetType.SPACE_PHOTO)}
                      className={`aspect-square rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden group/img ${env.beforeAssetId ? 'border-transparent' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'}`}
                    >
                      {env.beforeAssetId ? (
                        <>
                          <img src={getAsset(env.beforeAssetId)?.data} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white" size={32} />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-8">
                          <Upload size={32} className="mx-auto mb-2 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base do Projeto</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 02: MOBILIÁRIO */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">02. Mobiliário & Itens</h4>
                    <div className="bg-slate-50 rounded-[40px] p-6 border border-slate-100 aspect-square overflow-y-auto">
                      <div className="grid grid-cols-2 gap-3">
                        {env.furnitureAssetIds.map(fid => (
                          <div key={fid} className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm relative group/item">
                            <img src={getAsset(fid)?.data} className="w-full h-full object-cover" />
                            <button onClick={() => updateEnvironment(env.id, { furnitureAssetIds: env.furnitureAssetIds.filter(id => id !== fid) })} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => handleUploadClick(env.id, AssetType.FURNITURE)} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-indigo-300 transition-all">
                          <Plus size={24} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 03: REFERÊNCIAS */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">03. Mood & Inspiração</h4>
                    <div className="bg-indigo-50/20 rounded-[40px] p-6 border border-indigo-100/50 aspect-square overflow-y-auto">
                      <div className="grid grid-cols-2 gap-3">
                        {env.referenceAssetIds.map(rid => (
                          <div key={rid} className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm relative group/ref">
                            <img src={getAsset(rid)?.data} className="w-full h-full object-cover" />
                            <button onClick={() => updateEnvironment(env.id, { referenceAssetIds: env.referenceAssetIds.filter(id => id !== rid) })} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/ref:opacity-100 transition-opacity">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                        {env.referenceAssetIds.length < 7 && (
                          <button onClick={() => handleUploadClick(env.id, AssetType.REFERENCE)} className="aspect-square rounded-2xl border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-300 hover:bg-white transition-all">
                            <Plus size={24} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 04: RESULTADO FINAL */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">04. Proposta Transformada</h4>
                    <div className={`aspect-square rounded-[40px] border-2 flex flex-col items-center justify-center relative overflow-hidden ${approvedImage ? 'border-transparent' : 'border-dashed border-indigo-100 bg-white shadow-inner'}`}>
                      {isGenerating === env.id ? (
                        <div className="text-center p-8 animate-in fade-in duration-700">
                          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 animate-pulse">Especialista Gerando...</span>
                        </div>
                      ) : approvedImage ? (
                        <>
                          <img src={approvedImage} className="w-full h-full object-cover animate-in fade-in duration-1000" />
                          <div className="absolute top-4 right-4">
                             <button onClick={() => handleGenerate(env.id)} className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                               <RotateCcw size={20} />
                             </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-8 opacity-20">
                          <ImageIcon size={64} className="mx-auto mb-4 text-slate-300" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Aguardando Aprovação do Prompt</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AGENTE ESPECIALISTA - ÁREA DE BRIEFING */}
                <div className="space-y-8 bg-slate-50/50 p-10 rounded-[45px] border border-slate-100">
                  <div className="flex flex-col md:flex-row gap-10">
                    {/* INPUT DO USUÁRIO */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white p-1.5 rounded-lg"><Mic size={14} /></span>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sua Instrução (Voz ou Texto)</h4>
                      </div>
                      <div className="relative flex items-center bg-white rounded-3xl border border-slate-200 px-6 py-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                        <textarea 
                          value={env.goal}
                          onChange={(e) => updateEnvironment(env.id, { goal: e.target.value })}
                          placeholder="Fale ou escreva sua visão para este ambiente..."
                          className="flex-1 bg-transparent border-none py-4 text-slate-700 outline-none placeholder:text-slate-300 font-medium resize-none min-h-[100px]"
                        />
                        <div className="flex flex-col gap-2 ml-4">
                          <button 
                            onClick={isRecording === env.id ? stopRecording : () => startRecording(env.id)}
                            className={`p-4 rounded-2xl transition-all shadow-lg ${isRecording === env.id ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                          >
                            {isRecording === env.id ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                          </button>
                          <button 
                            onClick={() => handleRefinePrompt(env.id, env.goal)}
                            disabled={!env.goal || isRefining === env.id}
                            className="p-4 rounded-2xl bg-slate-900 text-white hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-20"
                            title="Refinar com Especialista"
                          >
                            {isRefining === env.id ? <Loader2 size={20} className="animate-spin" /> : <BrainCircuit size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* REVISÃO DO ESPECIALISTA */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500 text-white p-1.5 rounded-lg"><Sparkles size={14} /></span>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Prompt Estruturado pelo Especialista</h4>
                      </div>
                      <div className={`min-h-[148px] rounded-3xl border border-emerald-100 p-6 flex flex-col transition-all ${refined ? 'bg-emerald-50/30' : 'bg-slate-50 opacity-40 italic flex items-center justify-center text-slate-400 text-sm'}`}>
                        {refined ? (
                          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                               <p className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter mb-1">Análise Técnica:</p>
                               <p className="text-xs text-slate-600 leading-relaxed font-medium">{refined.portuguese_explanation}</p>
                            </div>
                            <div className="flex gap-4">
                               <div className="flex-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Languages size={10} /> Prompt Final (EN)</p>
                                  <p className="text-[10px] font-mono bg-white p-3 rounded-xl border border-emerald-100 text-slate-700 leading-relaxed select-all">
                                    {refined.refined_prompt_en}
                                  </p>
                                </div>
                            </div>
                          </div>
                        ) : (
                          "Aguardando análise do especialista..."
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CONFIGURAÇÕES DE GERAÇÃO */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200">
                      <Settings2 size={18} className="text-slate-400" />
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`pro-mode-${env.id}`}
                          checked={useProModel}
                          onChange={(e) => setUseProModel(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`pro-mode-${env.id}`} className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nano Banana Pro</label>
                      </div>
                      {useProModel && (
                        <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Resolução:</span>
                          {["1K", "2K", "4K"].map(size => (
                            <button 
                              key={size}
                              onClick={() => setSelectedSize(size as any)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${selectedSize === size ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleGenerate(env.id)}
                      disabled={!refined || isGenerating === env.id}
                      className="group bg-slate-900 text-white px-16 h-[74px] rounded-[28px] font-black text-xs uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-emerald-600 shadow-2xl transition-all active:scale-95 disabled:opacity-20"
                    >
                      {isGenerating === env.id ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Renderizando Proposta...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Gerar Proposta Final
                          <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!env.beforeAssetId && (
                  <p className="mt-8 text-center text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Info size={16} /> É obrigatório o upload da foto original (Etapa 01) para iniciar o processo
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnvironmentsTab;
