
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { Plus, Folder, Archive, MoreVertical, Trash2, Copy } from 'lucide-react';

interface Props {
  projects: Project[];
  onCreate: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (project: Project) => void;
}

const Dashboard: React.FC<Props> = ({ projects, onCreate, onSelect, onDelete, onUpdate }) => {
  const [filter, setFilter] = useState<ProjectStatus>(ProjectStatus.ACTIVE);

  const filteredProjects = projects.filter(p => p.status === filter);

  const duplicateProject = (project: Project) => {
    const duplicated: Project = {
      ...project,
      id: crypto.randomUUID(),
      name: `${project.name} (Cópia)`,
      status: ProjectStatus.ACTIVE
    };
    onUpdate(duplicated); // Using update logic to add a new one in this simple implementation
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Projetos</h1>
          <p className="text-slate-500 mt-2">Gerencie suas produções e decorações de eventos.</p>
        </div>
        <button 
          onClick={onCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Novo Evento</span>
        </button>
      </div>

      <div className="flex gap-4 mb-8 border-b border-slate-200">
        <button 
          onClick={() => setFilter(ProjectStatus.ACTIVE)}
          className={`pb-4 px-2 font-medium transition-colors ${filter === ProjectStatus.ACTIVE ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Ativos ({projects.filter(p => p.status === ProjectStatus.ACTIVE).length})
        </button>
        <button 
          onClick={() => setFilter(ProjectStatus.ARCHIVED)}
          className={`pb-4 px-2 font-medium transition-colors ${filter === ProjectStatus.ARCHIVED ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Arquivados ({projects.filter(p => p.status === ProjectStatus.ARCHIVED).length})
        </button>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Folder className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-slate-900">Nenhum projeto encontrado</h3>
          <p className="text-slate-500 mt-1">Crie seu primeiro projeto para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div 
              key={project.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                  <Folder size={24} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => duplicateProject(project)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400" title="Duplicar"><Copy size={16} /></button>
                  <button onClick={() => onUpdate({...project, status: project.status === ProjectStatus.ACTIVE ? ProjectStatus.ARCHIVED : ProjectStatus.ACTIVE})} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400" title="Arquivar"><Archive size={16} /></button>
                  <button onClick={() => onDelete(project.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400" title="Excluir"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 cursor-pointer" onClick={() => onSelect(project.id)}>{project.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{project.type} • {project.location || 'Local indefinido'}</p>
              <div className="mt-6 flex justify-between items-center text-xs font-medium uppercase tracking-wider text-slate-400">
                <span>{project.date}</span>
                <span>{project.environments.length} Ambientes</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
