
import React, { useState } from 'react';
import { Project, Asset, AssetType } from '../../types';
import { Upload, Image as ImageIcon, FileText, Music, Tag, Loader2, Search, Trash2, Eye, Sparkles, Wand2 } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

const AssetsTab: React.FC<Props> = ({ project, onUpdate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files) as File[];

    for (const file of fileList) {
      const type = file.type.startsWith('image/') ? AssetType.SPACE_PHOTO : 
                   file.type === 'application/pdf' ? AssetType.PLAN_PDF :
                   file.type.startsWith('audio/') ? AssetType.AUDIO : AssetType.REFERENCE;

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const newAsset: Asset = {
          id: crypto.randomUUID(),
          type,
          data: base64,
          tags: []
        };

        onUpdate({ ...project, assets: [...project.assets, newAsset] });

        if (type === AssetType.SPACE_PHOTO || type === AssetType.REFERENCE) {
          setIsAnalyzing(true);
          try {
            const analysis = await geminiService.analyzeAsset(base64, file.type);
            onUpdate({
              ...project,
              assets: project.assets.map(a => a.id === newAsset.id ? { ...a, analysis, tags: analysis.detected_style } : a)
            });
          } catch (err) {
            console.error("Analysis failed", err);
          } finally {
            setIsAnalyzing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickEdit = async () => {
    if (!selectedAsset || !editPrompt.trim()) return;
    setIsEditing(true);
    try {
      const editedData = await geminiService.editImageWithPrompt(selectedAsset.data, editPrompt);
      if (editedData) {
        const newAsset: Asset = {
          ...selectedAsset,
          id: crypto.randomUUID(),
          data: editedData,
          tags: [...selectedAsset.tags, 'AI Edited']
        };
        onUpdate({ ...project, assets: [...project.assets, newAsset] });
        setSelectedAsset(newAsset);
        setEditPrompt('');
      }
    } catch (err) {
      console.error("Edit failed", err);
    } finally {
      setIsEditing(false);
    }
  };

  const removeAsset = (id: string) => {
    onUpdate({ ...project, assets: project.assets.filter(a => a.id !== id) });
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case AssetType.SPACE_PHOTO: return <ImageIcon />;
      case AssetType.PLAN_PDF: return <FileText />;
      case AssetType.AUDIO: return <Music />;
      default: return <Tag />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <label className="block bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
        <input type="file" multiple className="hidden" onChange={handleFileUpload} />
        <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
          <Upload size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Arraste ou clique para upload</h3>
        <p className="text-slate-500 mt-2">Fotos de espaços, referências, plantas PDF e áudios de clientes.</p>
        {isAnalyzing && (
          <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 font-medium">
            <Loader2 className="animate-spin" size={20} />
            <span>Analisando assets com IA...</span>
          </div>
        )}
      </label>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {project.assets.map(asset => (
          <div key={asset.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group relative">
            <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
              {asset.type === AssetType.SPACE_PHOTO || asset.type === AssetType.REFERENCE ? (
                <img src={asset.data} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="text-slate-400">{getAssetIcon(asset.type)}</div>
              )}
            </div>
            
            <div className="p-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 mb-1">
                {getAssetIcon(asset.type)}
                <span>{asset.type.replace('_', ' ')}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map(t => (
                  <span key={t} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full">#{t}</span>
                ))}
              </div>
            </div>

            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setSelectedAsset(asset)}
                className="bg-white p-2 rounded-full text-slate-900 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <Eye size={20} />
              </button>
              <button 
                onClick={() => removeAsset(asset.id)}
                className="bg-white p-2 rounded-full text-slate-900 hover:bg-red-600 hover:text-white transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Preview Modal with Quick Edit */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-[50px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh]">
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-8">
              {(selectedAsset.type === AssetType.SPACE_PHOTO || selectedAsset.type === AssetType.REFERENCE) ? (
                <img src={selectedAsset.data} className="max-w-full max-h-full object-contain rounded-3xl shadow-xl" />
              ) : (
                <div className="text-slate-300 transform scale-[4]">{getAssetIcon(selectedAsset.type)}</div>
              )}
            </div>
            <div className="w-full md:w-96 p-10 overflow-y-auto bg-white flex flex-col">
              <button onClick={() => setSelectedAsset(null)} className="mb-8 text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest">
                <Trash2 size={16} /> Fechar Preview
              </button>
              
              <div className="flex-1 space-y-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 flex items-center gap-2">
                    <Sparkles size={14} /> Edição Inteligente (Nano Flash)
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <textarea 
                      value={editPrompt}
                      onChange={e => setEditPrompt(e.target.value)}
                      placeholder='Ex: "Adicione um filtro retrô", "Remova o fundo", "Mude a cor das paredes para azul"...'
                      className="w-full bg-white p-4 rounded-xl text-xs text-slate-700 outline-none border border-slate-100 focus:border-indigo-300 transition-all resize-none h-24"
                    />
                    <button 
                      onClick={handleQuickEdit}
                      disabled={isEditing || !editPrompt.trim()}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-20"
                    >
                      {isEditing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      Aplicar Edição IA
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Informações Técnicas</h3>
                  {selectedAsset.analysis ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-2">Resumo Visual</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{selectedAsset.analysis.summary}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-2">Tags Sugeridas</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedAsset.analysis.detected_style.map(s => (
                            <span key={s} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-xs">Nenhuma análise disponível.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsTab;
