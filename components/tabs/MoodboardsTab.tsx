
import React, { useState } from 'react';
import { Project, Moodboard } from '../../types';
import { Palette, Wand2, Plus, Sparkles, Loader2, Grid } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

const MoodboardsTab: React.FC<Props> = ({ project, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMoodboard = async () => {
    setIsGenerating(true);
    try {
      const spec = await geminiService.buildMoodboard(project.briefingDirectives || project.keywords);
      const collageImageUri = await geminiService.generateMoodboardImage(spec.short_story);
      
      const newMoodboard: Moodboard = {
        id: crypto.randomUUID(),
        ...spec,
        collageImageUri,
        tileImageUris: [] // Simulated tiles
      };
      onUpdate({ ...project, moodboards: [...project.moodboards, newMoodboard] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold flex items-center gap-3"><Palette className="text-indigo-600" /> Moodboards Visuais</h2>
        <button onClick={generateMoodboard} disabled={isGenerating} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50 shadow-xl shadow-slate-200">
          {isGenerating ? <Loader2 className="animate-spin" /> : <Plus />}
          Gerar Novo Conceito
        </button>
      </div>

      {project.moodboards.map(mb => (
        <div key={mb.id} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Collage - 2/3 width */}
            <div className="lg:col-span-2 bg-white p-4 rounded-[40px] shadow-sm border border-slate-100">
              <div className="aspect-[4/3] rounded-[30px] overflow-hidden bg-slate-50 relative group">
                {mb.collageImageUri ? (
                  <img src={mb.collageImageUri} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <Loader2 className="animate-spin mb-4" />
                    <span>Renderizando colagem...</span>
                  </div>
                )}
                <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">{mb.title}</span>
                </div>
              </div>
            </div>

            {/* Details - 1/3 width */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-full">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-6">Paleta de Cores</h3>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {mb.palette.map((c, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-12 rounded-xl border border-black/5 shadow-inner" style={{ backgroundColor: c.hex }}></div>
                      <div className="text-[10px] font-bold truncate text-slate-400 uppercase">{c.hex}</div>
                    </div>
                  ))}
                </div>

                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4">Texturas & Objetos</h3>
                <div className="flex flex-wrap gap-2">
                  {mb.textures.concat(mb.objects).map((item, i) => (
                    <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-100">{item}</span>
                  ))}
                </div>

                <div className="mt-8">
                   <p className="text-slate-600 italic text-sm leading-relaxed border-l-4 border-indigo-100 pl-4">"{mb.short_story}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {project.moodboards.length === 0 && !isGenerating && (
        <div className="text-center py-24 bg-white rounded-[50px] border-2 border-dashed border-slate-100 flex flex-col items-center">
           <div className="bg-indigo-50 p-8 rounded-full text-indigo-400 mb-6"><Sparkles size={64} /></div>
           <h3 className="text-2xl font-bold text-slate-900">Nenhum Moodboard Gerado</h3>
           <p className="text-slate-500 mt-2">Clique no botão acima para converter as referências em uma visão artística.</p>
        </div>
      )}
    </div>
  );
};

export default MoodboardsTab;
