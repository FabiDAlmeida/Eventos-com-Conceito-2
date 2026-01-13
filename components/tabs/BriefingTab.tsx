
import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../../types';
import { PROJECT_TYPES, BUDGET_RANGES, STANDARD_BRIEFING_QUESTIONS } from '../../constants';
import { Mic, Square, CheckCircle, AlertCircle, Loader2, Sparkles, ClipboardList, HelpCircle, Type as TypeIcon, Send } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

const BriefingTab: React.FC<Props> = ({ project, onUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  const [captureMode, setCaptureMode] = useState<'voice' | 'text'>('voice');
  const [manualText, setManualText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Inicializa o status das perguntas padrão
  useEffect(() => {
    const initialAnswered: Record<string, boolean> = {};
    STANDARD_BRIEFING_QUESTIONS.forEach(q => {
      initialAnswered[q] = false;
    });
    setAnsweredQuestions(initialAnswered);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...project, [name]: value });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length === 0) {
          setIsProcessing(false);
          return;
        }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processAudio(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Acesso ao microfone negado:", err);
      alert("Erro ao acessar o microfone. Por favor, verifique as permissões de áudio do seu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64WithMime = reader.result as string;
        const base64 = base64WithMime.split(',')[1];
        
        const result = await geminiService.transcribeAudioToDirectives(base64);
        
        if (result && result.transcript) {
          onUpdate({
            ...project,
            briefingTranscript: result.transcript,
            briefingDirectives: result.directives
          });
          setQuestions(result.missing_info_questions || []);
        } else {
          alert("Não foi possível extrair informações úteis. Tente gravar novamente com mais detalhes.");
        }
      };
    } catch (error) {
      console.error("Erro no processamento:", error);
      alert("Houve um problema ao conectar com a IA. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!manualText.trim()) return;
    setIsProcessing(true);
    try {
      const result = await geminiService.processTextBriefing(manualText);
      if (result && result.transcript) {
        onUpdate({
          ...project,
          briefingTranscript: result.transcript,
          briefingDirectives: result.directives
        });
        setQuestions(result.missing_info_questions || []);
        setManualText('');
      } else {
        alert("Não foi possível processar o texto. Tente adicionar mais detalhes.");
      }
    } catch (error) {
      console.error("Erro no processamento:", error);
      alert("Houve um problema ao conectar com a IA. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleQuestion = (q: string) => {
    setAnsweredQuestions(prev => ({ ...prev, [q]: !prev[q] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna da Esquerda: Dados e Resultados */}
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-600">
              <ClipboardList size={24} />
            </div>
            <h2 className="text-2xl font-bold">Configuração Geral</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nome do Evento</label>
              <input name="name" value={project.name} onChange={handleInputChange} className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Data Prevista</label>
              <input type="date" name="date" value={project.date} onChange={handleInputChange} className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tipo de Celebração</label>
              <select name="type" value={project.type} onChange={handleInputChange} className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold">
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Investimento Estimado</label>
              <select name="budgetRange" value={project.budgetRange} onChange={handleInputChange} className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold">
                {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </section>

        {project.briefingTranscript && (
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Sparkles className="text-indigo-600" size={28} /> 
              Diretrizes Extraídas pela IA
            </h2>
            
            <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative">
                <span className="absolute -top-3 left-6 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Resumo do Briefing</span>
                <p className="text-slate-600 text-sm italic leading-relaxed pt-2">"{project.briefingTranscript}"</p>
              </div>
              
              {project.briefingDirectives && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">Conceito e Objetivo</span>
                    <p className="text-indigo-900 font-bold text-lg leading-tight">{project.briefingDirectives.goal}</p>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">Paleta de Cores</span>
                    <div className="flex flex-wrap gap-2">
                      {project.briefingDirectives.palette.preferred.map((p, idx) => (
                        <span key={idx} className="bg-white text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-black border border-indigo-200">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Materiais Sugeridos</span>
                    <div className="flex flex-wrap gap-2">
                      {project.briefingDirectives.materials.map((m, idx) => (
                        <span key={idx} className="bg-white text-slate-600 px-3 py-1 rounded-lg text-xs font-medium border border-slate-200">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Iluminação e Atmosfera</span>
                    <p className="text-slate-800 font-medium">{project.briefingDirectives.lighting}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Coluna da Direita: Gravação e Guia */}
      <div className="space-y-6">
        {/* Seção de Captura de Briefing (Voz/Texto) */}
        <section className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Sparkles size={24} className="text-indigo-400" /> 
                Capturar Briefing
              </h2>
              {/* Tab Selector */}
              <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
                <button 
                  onClick={() => setCaptureMode('voice')}
                  className={`p-2 rounded-lg transition-all ${captureMode === 'voice' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Mic size={18} />
                </button>
                <button 
                  onClick={() => setCaptureMode('text')}
                  className={`p-2 rounded-lg transition-all ${captureMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <TypeIcon size={18} />
                </button>
              </div>
            </div>

            {captureMode === 'voice' ? (
              <div className="flex flex-col items-center gap-6 py-4">
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-500 animate-pulse scale-105' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRecording ? <Square size={36} fill="white" /> : <Mic size={42} />}
                </button>
                <div className="text-center">
                  <span className="font-black text-[10px] tracking-[0.3em] uppercase text-indigo-400 block mb-1">Processador Vocal IA</span>
                  <span className="font-bold text-lg">
                    {isProcessing ? 'Analisando Fala...' : isRecording ? 'Escutando Agora' : 'Clique para Falar'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <p className="text-slate-400 text-xs font-medium leading-relaxed mb-2">
                  Descreva por escrito os desejos do cliente, incluindo cores, estilo e restrições.
                </p>
                <textarea 
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Ex: O cliente quer um casamento Boho Chic com tons terrosos, muitas flores secas e iluminação quente com luzes de gambiarra..."
                  className="w-full h-48 p-4 rounded-2xl bg-white/10 border border-white/20 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-500 resize-none"
                />
                <button 
                  onClick={handleTextSubmit}
                  disabled={isProcessing || !manualText.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  Processar Briefing
                </button>
              </div>
            )}

            {isProcessing && captureMode === 'voice' && (
              <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Extraindo objetivos e paletas...</p>
              </div>
            )}
          </div>
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        </section>

        {/* Guia de Perguntas Padrão */}
        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-2.5 rounded-2xl text-amber-700">
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Guia de Referência</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Perguntas fundamentais</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {STANDARD_BRIEFING_QUESTIONS.map((q, i) => (
              <button 
                key={i}
                onClick={() => toggleQuestion(q)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${answeredQuestions[q] ? 'bg-green-50 border-green-100 text-green-800' : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-700'}`}
              >
                <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${answeredQuestions[q] ? 'bg-green-600 border-green-600 text-white' : 'border-slate-300 bg-white'}`}>
                  {answeredQuestions[q] && <CheckCircle size={14} />}
                </div>
                <span className="text-sm font-semibold leading-snug">{q}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Perguntas Inteligentes Geradas (Faltantes) */}
        {questions.length > 0 && (
          <section className="bg-indigo-900 text-white p-8 rounded-[40px] shadow-xl animate-in zoom-in duration-300">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <AlertCircle size={24} className="text-indigo-400" /> 
              Informações Pendentes
            </h3>
            <p className="text-indigo-200/70 text-xs mb-6 font-medium">A IA identificou lacunas. Tente complementar:</p>
            <ul className="space-y-4">
              {questions.map((q, i) => (
                <li key={i} className="flex items-start gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                  <div className="w-6 h-6 bg-indigo-400 text-indigo-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                  <span className="text-sm font-medium leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default BriefingTab;
