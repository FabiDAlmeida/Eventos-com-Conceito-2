
import React, { useState } from 'react';
import { Project, CrestOption, Crest } from '../../types';
import { CREST_STYLES } from '../../constants';
import { Shield, Check, Loader2, Sparkles, Download, CheckCircle, RefreshCw, Eye, LayoutGrid, Palette, User } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

const CrestTab: React.FC<Props> = ({ project, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVariating, setIsVariating] = useState(false);
  const [initials, setInitials] = useState(project.crest?.initials || '');
  const [hostName, setHostName] = useState('');
  const [symbols, setSymbols] = useState('');
  const [forbidden, setForbidden] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [generatingIdx, setGeneratingIdx] = useState<number[]>([]);
  const [previewVariant, setPreviewVariant] = useState<Record<string, 'default' | 'gold' | 'black'>>({});

  const handleGenerate = async () => {
    if (!initials.trim()) {
      alert("As iniciais são obrigatórias.");
      return;
    }

    setIsGenerating(true);
    setGeneratingIdx([0, 1, 2, 3, 4, 5]);
    
    // Resetar estado anterior
    const emptyCrest: Crest = {
      id: crypto.randomUUID(),
      initials,
      style: selectedStyle || 'Exploração de 6 Estilos',
      concept: "Desenvolvendo conceitos exclusivos...",
      options: [],
      usageGuide: []
    };
    onUpdate({ ...project, crest: emptyCrest });

    try {
      const palette = project.moodboards[0]?.palette || project.briefingDirectives?.palette;
      
      // 1. Obter conceitos via Gemini (Texto)
      const spec = await geminiService.generateCrestOptions(
        initials,
        hostName,
        project.type,
        palette,
        symbols,
        forbidden,
        selectedStyle || undefined
      );

      // 2. Gerar imagens em paralelo (6 opções x 3 cores)
      // Para performance extrema, geramos a base e disparamos as variantes em background
      const optionsPromises = spec.options.map(async (opt: any, i: number) => {
        try {
          const pngUri = await geminiService.generateCrestImage(opt.visual_prompt, 'default');
          
          // Variantes geradas em paralelo à base
          const [goldPngUri, monoPngUri] = await Promise.all([
            geminiService.generateCrestImage(opt.visual_prompt, 'gold'),
            geminiService.generateCrestImage(opt.visual_prompt, 'black'),
          ]);

          const newOpt: CrestOption = {
            id: crypto.randomUUID(),
            svgData: '', 
            pngUri,
            goldPngUri,
            monoPngUri,
            promptUsed: opt.visual_prompt,
            styleName: opt.style_name,
            description: opt.description,
            usageSuggestion: opt.usage_suggestion
          };

          setGeneratingIdx(prev => prev.filter(idx => idx !== i));
          return newOpt;
        } catch (err) {
          console.error(`Falha na opção ${i}:`, err);
          setGeneratingIdx(prev => prev.filter(idx => idx !== i));
          return null;
        }
      });

      const results = await Promise.all(optionsPromises);
      const validOptions = results.filter((opt): opt is CrestOption => opt !== null);

      onUpdate({ 
        ...project, 
        crest: {
          ...emptyCrest,
          concept: spec.concept_summary,
          options: validOptions,
          usageGuide: spec.usage_guide
        } 
      });
    } catch (err) {
      console.error("Erro no motor de brasões:", err);
    } finally {
      setIsGenerating(false);
      setGeneratingIdx([]);
    }
  };

  const handleApprove = (optionId: string) => {
    if (!project.crest) return;
    onUpdate({
      ...project,
      crest: { ...project.crest, approvedOptionId: optionId }
    });
  };

  const handleGenerateVariations = async () => {
    if (!project.crest?.approvedOptionId) return;
    const approved = project.crest.options.find(o => o.id === project.crest?.approvedOptionId);
    if (!approved) return;

    setIsVariating(true);
    try {
      const variatedImg = await geminiService.generateCrestVariations(approved.pngUri, approved.promptUsed);
      const [gold, mono] = await Promise.all([
        geminiService.transformCrestVariant(variatedImg, 'gold'),
        geminiService.transformCrestVariant(variatedImg, 'black')
      ]);

      const newOption: CrestOption = {
        ...approved,
        id: crypto.randomUUID(),
        pngUri: variatedImg,
        goldPngUri: gold,
        monoPngUri: mono,
        styleName: `${approved.styleName} (Refinado)`
      };

      onUpdate({
        ...project,
        crest: {
          ...project.crest,
          options: [...project.crest.options, newOption],
          approvedOptionId: newOption.id
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsVariating(false);
    }
  };

  const getActiveImage = (opt: CrestOption) => {
    const variant = previewVariant[opt.id] || 'default';
    if (variant === 'gold') return opt.goldPngUri;
    if (variant === 'black') return opt.monoPngUri;
    return opt.pngUri;
  };

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      {/* Header & Inputs */}
      <section className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Identidade Visual do Projeto</h2>
            <p className="text-slate-400 font-medium text-sm">Gere 6 opções profissionais baseadas no DNA do evento.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Iniciais (EP)</label>
            <input value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="w-full p-5 rounded-3xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-black text-2xl" placeholder="EP" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Anfitrião (Opcional)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input value={hostName} onChange={e => setHostName(e.target.value)} className="w-full p-5 pl-12 rounded-3xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Nome Completo" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Símbolos Permitidos</label>
            <input value={symbols} onChange={e => setSymbols(e.target.value)} className="w-full p-5 rounded-3xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="Ex: Ramos, Coroa..." />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Símbolos Proibidos</label>
            <input value={forbidden} onChange={e => setForbidden(e.target.value)} className="w-full p-5 rounded-3xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-red-200 text-sm font-medium" placeholder="Ex: Caveiras..." />
          </div>
        </div>

        <div className="mb-10 space-y-4">
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direcionamento de Estilo</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedStyle('')} className={`px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border-2 ${!selectedStyle ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}>Mix de 6 Estilos</button>
            {CREST_STYLES.map(s => (
              <button key={s} onClick={() => setSelectedStyle(s)} className={`px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border-2 ${selectedStyle === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}>{s}</button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full h-20 bg-slate-900 text-white rounded-[30px] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl disabled:opacity-50"
        >
          {isGenerating ? <><Loader2 className="animate-spin" /> Gerando 6 Propostas Paralelas...</> : <><Sparkles /> Gerar Coleção Profissional</>}
        </button>
      </section>

      {project.crest && (
        <div className="space-y-16">
          <div className="text-center space-y-3 px-4">
            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Propostas de Identidade Visual</h3>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">{project.crest.concept}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
            {/* Loading Skeletons */}
            {generatingIdx.map(idx => (
              <div key={`loading-${idx}`} className="bg-white rounded-[60px] border-2 border-slate-100 p-10 flex flex-col items-center justify-center aspect-[3/4] animate-pulse">
                <Loader2 className="animate-spin text-slate-200 mb-4" size={48} />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Renderizando Estilo {idx + 1}...</span>
              </div>
            ))}

            {project.crest.options.map((opt) => (
              <div 
                key={opt.id} 
                className={`bg-white rounded-[60px] border-2 transition-all p-10 flex flex-col group relative ${project.crest?.approvedOptionId === opt.id ? 'border-indigo-600 shadow-2xl ring-8 ring-indigo-50/50' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}
              >
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full">{opt.styleName}</span>
                  {project.crest?.approvedOptionId === opt.id && <CheckCircle size={24} className="text-indigo-600" />}
                </div>

                <div className="relative aspect-square bg-slate-50 rounded-[50px] mb-8 overflow-hidden flex items-center justify-center group/img border border-slate-100">
                  <img src={getActiveImage(opt)} className="w-full h-full object-contain p-8 transition-transform group-hover/img:scale-105" />
                  
                  {/* Variant Toggles */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex gap-5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <button onClick={() => setPreviewVariant({...previewVariant, [opt.id]: 'default'})} className={`w-6 h-6 rounded-full border border-slate-200 ${previewVariant[opt.id] === 'default' || !previewVariant[opt.id] ? 'ring-2 ring-indigo-500 scale-125' : ''}`} title="Original"></button>
                      <button onClick={() => setPreviewVariant({...previewVariant, [opt.id]: 'gold'})} className={`w-6 h-6 rounded-full bg-amber-400 border border-slate-200 ${previewVariant[opt.id] === 'gold' ? 'ring-2 ring-indigo-500 scale-125' : ''}`} title="Dourado"></button>
                      <button onClick={() => setPreviewVariant({...previewVariant, [opt.id]: 'black'})} className={`w-6 h-6 rounded-full bg-black border border-slate-200 ${previewVariant[opt.id] === 'black' ? 'ring-2 ring-indigo-500 scale-125' : ''}`} title="Preto"></button>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">"{opt.description}"</p>
                  <div className="pt-6 border-t border-slate-50">
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Aplicação Sugerida:</span>
                    <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-2"><Eye size={14} className="text-indigo-400" /> {opt.usageSuggestion}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleApprove(opt.id)}
                  className={`mt-10 w-full py-5 rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all ${project.crest?.approvedOptionId === opt.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  {project.crest?.approvedOptionId === opt.id ? 'Opção Aprovada' : 'Selecionar Esta Proposta'}
                </button>
              </div>
            ))}
          </div>

          {project.crest.approvedOptionId && (
            <div className="bg-slate-900 rounded-[70px] p-16 text-white shadow-3xl relative overflow-hidden max-w-6xl mx-auto border border-white/5">
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                        <Check size={28} />
                      </div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter">Identidade Visual Aprovada</h3>
                      <p className="text-indigo-200/60 text-sm leading-relaxed max-w-md font-medium">
                        O brasão selecionado agora faz parte do DNA do projeto. Você pode refinar detalhes finais ou exportar o kit de aplicação para fornecedores.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={handleGenerateVariations}
                        disabled={isVariating}
                        className="bg-white text-slate-900 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all shadow-2xl disabled:opacity-50"
                      >
                        {isVariating ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                        Gerar Variações Finas
                      </button>
                      <button className="bg-white/10 backdrop-blur-md text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 border border-white/20 hover:bg-white/20 transition-all">
                        <Download size={20} /> Exportar Kit Completo
                      </button>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-white/10">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Diretrizes de Aplicação</span>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {project.crest.usageGuide.map((g, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs font-bold text-indigo-100">
                               <Palette size={16} className="text-indigo-400" /> {g}
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-center lg:justify-end">
                     <div className="relative group">
                        <div className="w-96 h-96 bg-white rounded-[70px] shadow-3xl p-14 flex items-center justify-center transform rotate-2 transition-transform group-hover:rotate-0">
                            <img 
                              src={getActiveImage(project.crest.options.find(o => o.id === project.crest?.approvedOptionId)!)} 
                              className="w-full h-full object-contain" 
                            />
                        </div>
                        <div className="absolute -top-6 -right-6 bg-emerald-500 text-white p-6 rounded-[30px] shadow-2xl transform -rotate-12">
                           <Shield size={40} />
                        </div>
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -mr-[300px] -mt-[300px]"></div>
            </div>
          )}
        </div>
      )}

      {!project.crest && !isGenerating && (
        <div className="text-center py-40 bg-white rounded-[70px] border-4 border-dashed border-slate-100 flex flex-col items-center max-w-4xl mx-auto shadow-inner">
          <div className="bg-slate-50 p-12 rounded-full text-slate-200 mb-10 shadow-sm">
            <Shield size={100} strokeWidth={1} />
          </div>
          <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Nenhuma Identidade Desenvolvida</h3>
          <p className="text-slate-400 mt-6 max-w-sm mx-auto leading-relaxed font-medium">Insira as iniciais e o anfitrião acima para criar uma coleção exclusiva de 6 brasões para o evento.</p>
        </div>
      )}
    </div>
  );
};

export default CrestTab;
