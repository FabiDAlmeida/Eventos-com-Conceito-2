
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../../types';
import { Check, Edit3, Loader2, Sparkles, Layout, ArrowLeft, Printer, Lock, Globe } from 'lucide-react';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

// PageWrapper movido para fora e tipado corretamente
const PageWrapper: React.FC<{ children: React.ReactNode, title?: string }> = ({ children, title }) => (
  <div className="bg-white shadow-2xl mx-auto w-full max-w-[21cm] min-h-[29.7cm] p-[2cm] mb-12 print:mb-0 print:shadow-none print:w-[21cm] print:min-h-screen relative flex flex-col page-break-after-always">
    {title && (
      <div className="absolute top-8 right-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] print:block no-print">
        Visualização: {title}
      </div>
    )}
    {children}
  </div>
);

const DossierTab: React.FC<Props> = ({ project, onUpdate }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState([
    { id: 'cover', label: 'Capa do Projeto', active: true },
    { id: 'concept', label: 'Conceito e Briefing', active: true },
    { id: 'moodboard', label: 'Moodboards Artísticos', active: true },
    { id: 'crest', label: 'Identidade Visual', active: true },
    { id: 'environments', label: 'Projetos de Ambientes', active: true },
    { id: 'production', label: 'Cronograma Técnico', active: true },
  ]);

  const toggleSection = (id: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleExport = () => {
    setIsGenerating(true);
    // Título dinâmico para o arquivo PDF
    const originalTitle = document.title;
    document.title = `Dossie_${project.name.replace(/\s+/g, '_')}`;
    
    // Pequeno delay para garantir que o DOM esteja pronto antes da captura de impressão
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setIsGenerating(false);
    }, 500);
  };

  const handlePublish = () => {
    if (confirm("Deseja marcar este projeto como CONCLUÍDO e gerar a versão final de publicação?")) {
      onUpdate({ ...project, status: ProjectStatus.COMPLETED });
      setIsPreviewOpen(true);
    }
  };

  const getApprovedCrest = () => {
    if (!project.crest || !project.crest.approvedOptionId) return null;
    return project.crest.options.find(o => o.id === project.crest?.approvedOptionId);
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .dossier-print-area, .dossier-print-area * { visibility: visible; }
          .dossier-print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            background: white !important;
          }
          .no-print { display: none !important; }
          .page-break-after-always { page-break-after: always; height: auto; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {!isPreviewOpen ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">
                <Globe size={14} /> Publicação Profissional
              </div>
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Dossiê <span className="text-indigo-600">Final</span></h2>
              <p className="text-slate-500 text-xl font-medium leading-relaxed">Prepare o documento final para o cliente. Selecione as seções aprovadas e revise o tom de voz.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 mb-2">Estrutura do Documento</span>
              {sections.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => toggleSection(s.id)}
                  className={`flex items-center justify-between p-5 rounded-[25px] border-2 transition-all ${s.active ? 'bg-white border-indigo-600 shadow-lg' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                       <Check size={18} />
                    </div>
                    <span className={`font-bold text-sm ${s.active ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${s.active ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                    {s.active && <Check size={14} />}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setIsPreviewOpen(true)} 
                className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
              >
                <Edit3 size={24} /> Editar e Visualizar
              </button>
              <button 
                onClick={handlePublish}
                className="w-full bg-white border-2 border-slate-200 text-slate-900 py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:border-emerald-500 hover:text-emerald-600 transition-all"
              >
                <Lock size={20} /> Finalizar Projeto
              </button>
            </div>
          </div>

          <div className="relative group cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
            <div className="w-full aspect-[3/4] bg-white rounded-[60px] shadow-3xl border border-slate-100 p-12 transform rotate-2 transition-transform group-hover:rotate-0 flex flex-col items-center justify-center text-center">
               <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-10 shadow-inner">
                  <Layout size={80} strokeWidth={1} />
               </div>
               <h3 className="text-4xl font-black text-slate-900 mb-4">{project.name}</h3>
               <p className="text-indigo-500 font-black uppercase tracking-[0.4em] text-[10px]">{project.type} | {project.date}</p>
               <div className="absolute bottom-12 text-slate-300 font-bold text-[10px] uppercase tracking-widest">Toque para abrir o editor</div>
            </div>
            <div className="absolute -top-6 -left-6 bg-indigo-600 text-white p-6 rounded-[30px] shadow-2xl animate-bounce">
              <Sparkles size={32} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Menu de Ações do Editor */}
          <div className="flex justify-between items-center bg-white/90 backdrop-blur-xl p-6 rounded-[35px] shadow-2xl border border-white sticky top-4 z-[60] no-print animate-in slide-in-from-top-4 duration-500 mx-4">
            <button 
              onClick={() => setIsPreviewOpen(false)} 
              className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors px-4 py-2"
            >
              <ArrowLeft size={16} /> Voltar ao Painel
            </button>
            <div className="flex gap-4">
               <button 
                onClick={handleExport} 
                disabled={isGenerating}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:bg-emerald-700 transition-all shadow-emerald-100 disabled:opacity-50"
               >
                 {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
                 Exportar PDF Final
               </button>
            </div>
          </div>

          {/* ÁREA DE IMPRESSÃO / DOCUMENTO */}
          <div className="dossier-print-area space-y-0 bg-slate-100/50 p-8 rounded-[50px] print:p-0 print:bg-white">
            
            {/* PÁGINA 1: CAPA */}
            {sections.find(s => s.id === 'cover')?.active && (
              <PageWrapper key="page-cover" title="Página 01">
                <div className="flex-1 border-[10px] border-slate-50 p-12 flex flex-col items-center justify-center text-center relative">
                  {getApprovedCrest() && (
                    <img src={getApprovedCrest()?.pngUri} className="w-64 h-64 mb-20 object-contain drop-shadow-2xl" alt="Crest" />
                  )}
                  <div className="space-y-4">
                    <span className="text-indigo-600 font-black uppercase tracking-[0.5em] text-[10px]">Apresentação de Projeto</span>
                    <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">{project.name}</h1>
                  </div>
                  <div className="w-24 h-2 bg-indigo-600 my-10 rounded-full"></div>
                  <div className="space-y-2">
                    <p className="text-slate-400 uppercase tracking-[0.3em] font-bold text-sm">{project.type}</p>
                    <p className="text-slate-900 font-black text-2xl">{project.date}</p>
                    <p className="text-slate-400 font-medium text-sm">{project.location}</p>
                  </div>
                  
                  <div className="absolute bottom-12 flex flex-col items-center">
                    <div className="w-12 h-1 bg-slate-100 mb-4"></div>
                    <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[9px]">EventArchitect Pro | Consultoria de Design</p>
                  </div>
                </div>
              </PageWrapper>
            )}

            {/* PÁGINA 2: CONCEITO */}
            {sections.find(s => s.id === 'concept')?.active && (
              <PageWrapper key="page-concept" title="Página 02">
                <div className="mb-16">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-6">
                    <span className="text-slate-200">01.</span> Conceito Artístico
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 gap-16 flex-1">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-3">
                      <div className="w-6 h-[1px] bg-indigo-200"></div> Narrativa do Projeto
                    </h3>
                    <div 
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdate({ ...project, briefingTranscript: e.currentTarget.innerText })}
                      className="text-slate-700 leading-relaxed text-xl italic bg-slate-50/50 p-10 rounded-[40px] border border-slate-100 outline-none hover:bg-white hover:shadow-inner transition-all no-print-edit cursor-text"
                    >
                      {project.briefingTranscript || "Clique para redigir o conceito principal que será apresentado ao cliente..."}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Paleta Cromática</h3>
                      <div className="flex flex-wrap gap-4">
                        {(project.moodboards[0]?.palette || []).map((c, i) => (
                          <div key={`${c.hex}-${i}`} className="flex flex-col items-center gap-3">
                             <div className="w-16 h-16 rounded-[20px] shadow-lg border border-white" style={{ backgroundColor: c.hex }}></div>
                             <span className="text-[10px] font-black text-slate-400 tracking-tighter">{c.hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Atmosfera e Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {project.keywords.concat(project.styleTags).map((k, idx) => (
                          <span key={`${k}-${idx}`} className="bg-slate-100 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">#{k}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </PageWrapper>
            )}

            {/* PÁGINAS DE MOODBOARD */}
            {sections.find(s => s.id === 'moodboard')?.active && project.moodboards.map((mb, idx) => (
              <PageWrapper key={mb.id} title={`Moodboard ${idx + 1}`}>
                <div className="mb-12">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-6">
                    <span className="text-slate-200">02.{idx + 1}</span> {mb.title}
                  </h2>
                </div>
                <div className="aspect-[16/10] bg-slate-50 rounded-[50px] overflow-hidden mb-12 shadow-2xl border border-white p-2">
                   {mb.collageImageUri && <img src={mb.collageImageUri} className="w-full h-full object-cover rounded-[40px]" alt="Moodboard" />}
                </div>
                <div className="grid grid-cols-2 gap-12 flex-1">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Storytelling</h4>
                      <p 
                        contentEditable 
                        suppressContentEditableWarning
                        className="text-sm text-slate-600 leading-relaxed font-medium italic border-l-4 border-slate-100 pl-6 outline-none"
                      >
                        "{mb.short_story}"
                      </p>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Elementos e Texturas</h4>
                      <div className="flex flex-wrap gap-2">
                         {mb.textures.concat(mb.objects).map((t, i) => (
                           <span key={`${t}-${i}`} className="bg-white px-4 py-2 rounded-xl text-[10px] font-bold text-slate-500 border border-slate-100 shadow-sm">{t}</span>
                         ))}
                      </div>
                   </div>
                </div>
              </PageWrapper>
            ))}

            {/* PÁGINA DO BRASÃO */}
            {sections.find(s => s.id === 'crest')?.active && getApprovedCrest() && (
              <PageWrapper key="page-crest-final" title="03. Identidade">
                <div className="mb-16">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-6">
                    <span className="text-slate-200">03.</span> Identidade Visual
                  </h2>
                </div>
                
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[70px] border border-white mb-16 shadow-inner">
                   <img src={getApprovedCrest()?.pngUri} className="w-72 h-72 object-contain drop-shadow-3xl" alt="Approved Crest" />
                   <div className="mt-12 text-center space-y-4 px-12">
                      <span className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.4em] bg-white px-6 py-2 rounded-full shadow-sm">Linguagem: {getApprovedCrest()?.styleName}</span>
                      <p className="text-slate-500 max-w-lg mx-auto text-sm font-medium italic leading-relaxed">"{getApprovedCrest()?.description}"</p>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center space-y-4">
                    <div className="aspect-square bg-white rounded-[40px] border border-slate-100 flex items-center justify-center p-8 grayscale shadow-lg">
                       <img src={getApprovedCrest()?.monoPngUri} className="w-full h-full object-contain" alt="Mono" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monocromático</span>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="aspect-square bg-white rounded-[40px] border border-slate-100 flex items-center justify-center p-8 shadow-lg">
                       <img src={getApprovedCrest()?.goldPngUri} className="w-full h-full object-contain" alt="Gold" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hot Stamping Ouro</span>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="aspect-square bg-slate-900 rounded-[40px] flex items-center justify-center p-8 shadow-2xl">
                       <img src={getApprovedCrest()?.pngUri} className="w-full h-full object-contain brightness-0 invert" alt="Inverted" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aplicação em Fundo Escuro</span>
                  </div>
                </div>
              </PageWrapper>
            )}

            {/* PÁGINAS DE AMBIENTES */}
            {sections.find(s => s.id === 'environments')?.active && project.environments.map((env, i) => {
               const board = env.boards[0];
               const approved = board?.history.flatMap(h => h.variations).find(v => v.id === board.approvedVariationId);
               const before = project.assets.find(a => a.id === env.beforeAssetId);

               return (
                <PageWrapper key={env.id} title={`Ambiente ${i+1}`}>
                  <div className="mb-10">
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-6">
                      <span className="text-slate-200">04.{i + 1}</span> {env.name}
                    </h2>
                  </div>
                  
                  <div className="space-y-12 flex-1">
                    <div className="aspect-[16/10] bg-slate-100 rounded-[50px] overflow-hidden shadow-2xl relative border-4 border-white">
                       {approved ? <img src={approved.imageUrl} className="w-full h-full object-cover" alt="Proposta" /> : <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest">Aguardando Renderização Final</div>}
                       <div className="absolute top-8 left-8 bg-indigo-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">Proposta de Transformação</div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 items-start">
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">
                             <div className="w-4 h-[1px] bg-indigo-200"></div> Registro Original do Espaço
                          </h4>
                          <div className="aspect-video bg-slate-50 rounded-[35px] overflow-hidden border border-slate-100 grayscale opacity-40 shadow-inner">
                             {before && <img src={before.data} className="w-full h-full object-cover" alt="Antes" />}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium italic">Referência técnica da arquitetura base para o planejamento.</p>
                       </div>
                       <div className="space-y-8">
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Diretrizes do Ambiente</h4>
                            <p 
                              contentEditable 
                              suppressContentEditableWarning
                              className="text-xs text-slate-600 leading-relaxed font-medium italic border-l-2 border-indigo-100 pl-4 outline-none"
                            >
                              {env.goal || "Defina os objetivos específicos de decoração para este ambiente..."}
                            </p>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Inventário Selecionado</h4>
                            <div className="flex flex-wrap gap-2">
                               {env.furnitureAssetIds.slice(0, 5).map((f, idx) => (
                                 <div key={`${f}-${idx}`} className="w-12 h-12 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-white">
                                    <img src={project.assets.find(a => a.id === f)?.data} className="w-full h-full object-cover" alt="Item" />
                                 </div>
                               ))}
                               {env.furnitureAssetIds.length > 5 && <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">+{env.furnitureAssetIds.length - 5}</div>}
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </PageWrapper>
               );
            })}

            {/* PÁGINA DE PRODUÇÃO */}
            {sections.find(s => s.id === 'production')?.active && (
              <PageWrapper key="page-production-final" title="Cronograma">
                <div className="mb-16">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-6">
                    <span className="text-slate-200">05.</span> Cronograma Executivo
                  </h2>
                </div>

                <div className="space-y-16 flex-1">
                   <div className="space-y-8">
                      <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-4">
                        Etapas de Montagem <div className="flex-1 h-[1px] bg-indigo-50"></div>
                      </h3>
                      <div className="space-y-4">
                        {project.production.timeline.length > 0 ? project.production.timeline.map((t, idx) => (
                          <div key={t.id || idx} className="grid grid-cols-12 gap-4 items-center py-4 border-b border-slate-50">
                             <div className="col-span-1 text-[10px] font-black text-slate-300">{idx + 1}</div>
                             <div className="col-span-7 font-bold text-sm text-slate-900 uppercase tracking-tight">{t.task}</div>
                             <div className="col-span-2 text-[10px] font-black text-slate-400">{t.start}</div>
                             <div className="col-span-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest text-right">{t.status}</div>
                          </div>
                        )) : (
                          <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                             <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Cronograma não configurado</p>
                          </div>
                        )}
                      </div>
                   </div>

                   <div className="space-y-8">
                      <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-4">
                        Checklist de Qualidade <div className="flex-1 h-[1px] bg-indigo-50"></div>
                      </h3>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                         {project.production.checklist.map((item, idx) => (
                           <div key={item.id || idx} className="flex items-center gap-4 py-3 border-b border-slate-50">
                              <div className={`w-4 h-4 rounded-md flex items-center justify-center border-2 transition-colors ${item.completed ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-slate-200'}`}>
                                 {item.completed && <Check size={10} />}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-tight ${item.completed ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{item.label}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-20 flex flex-col items-center">
                   <div className="w-16 h-[1px] bg-slate-100 mb-6"></div>
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.6em] text-center max-w-xs leading-loose">
                     Este documento é uma proposta técnica e artística sujeita a alterações conforme viabilidade física do local.
                   </p>
                </div>
              </PageWrapper>
            )}

          </div>
          
          <div className="text-center py-20 no-print">
             <button 
              onClick={handleExport}
              className="bg-slate-900 text-white px-20 py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.5em] shadow-3xl hover:bg-indigo-600 transition-all active:scale-95"
             >
               Confirmar e Exportar PDF
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DossierTab;
