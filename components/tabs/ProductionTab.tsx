
import React, { useState } from 'react';
import { Project, ProductionChecklistItem, ProductionTimelineItem, BudgetItem } from '../../types';
import { ClipboardCheck, Calendar, DollarSign, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

const ProductionTab: React.FC<Props> = ({ project, onUpdate }) => {
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'timeline' | 'budget'>('checklist');

  const updateProduction = (fields: Partial<Project['production']>) => {
    onUpdate({ ...project, production: { ...project.production, ...fields } });
  };

  const toggleChecklist = (id: string) => {
    updateProduction({
      checklist: project.production.checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4 p-1 bg-white rounded-2xl shadow-sm border border-slate-100 w-fit mx-auto">
        <button onClick={() => setActiveSubTab('checklist')} className={`px-6 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${activeSubTab === 'checklist' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
          <ClipboardCheck size={18} /> Checklist
        </button>
        <button onClick={() => setActiveSubTab('timeline')} className={`px-6 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${activeSubTab === 'timeline' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
          <Calendar size={18} /> Cronograma
        </button>
        <button onClick={() => setActiveSubTab('budget')} className={`px-6 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${activeSubTab === 'budget' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
          <DollarSign size={18} /> Orçamento
        </button>
      </div>

      {activeSubTab === 'checklist' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {['Pré-produção', 'Produção', 'Montagem', 'Evento', 'Desmontagem'].map(cat => (
              <div key={cat} className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-2">{cat}</h3>
                <div className="space-y-2">
                  {project.production.checklist.filter(i => i.category === cat).map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => toggleChecklist(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${item.completed ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${item.completed ? 'bg-green-600 border-green-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {item.completed && <CheckCircle size={14} />}
                      </div>
                      <span className={`text-sm font-medium ${item.completed ? 'line-through opacity-60' : ''}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'timeline' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-6">Tarefa</th>
                <th className="p-6">Início</th>
                <th className="p-6">Responsável</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {project.production.timeline.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Nenhuma tarefa adicionada.</td></tr>
              ) : (
                project.production.timeline.map(t => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="p-6 font-bold">{t.task}</td>
                    <td className="p-6 text-sm text-slate-500">{t.start}</td>
                    <td className="p-6 text-sm font-medium">{t.responsible}</td>
                    <td className="p-6"><span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{t.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <button className="text-indigo-600 font-bold flex items-center justify-center gap-2 mx-auto"><Plus size={18} /> Adicionar Tarefa</button>
          </div>
        </div>
      )}

      {activeSubTab === 'budget' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orçado</span>
              <div className="text-2xl font-bold">R$ 0,00</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Pago</span>
              <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
            </div>
          </div>
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-6">Item</th>
                  <th className="p-6">Fornecedor</th>
                  <th className="p-6 text-right">Valor Fechado</th>
                  <th className="p-6">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Tabela de orçamento vazia.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionTab;
