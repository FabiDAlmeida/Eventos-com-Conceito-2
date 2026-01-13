
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus } from './types';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import ChatBot from './components/ChatBot';
import { CHECKLIST_TEMPLATE } from './constants';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedProjects = await dbService.getProjects();
        setProjects(savedProjects);
      } catch (err) {
        console.error("Failed to load projects from IndexedDB:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const saveProjects = async (newProjects: Project[]) => {
    setProjects(newProjects);
    try {
      await dbService.saveProjects(newProjects);
    } catch (err) {
      console.error("Failed to save projects to IndexedDB:", err);
      alert("Erro ao salvar dados. O armazenamento do navegador pode estar corrompido ou cheio.");
    }
  };

  const createProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: 'Novo Projeto',
      date: new Date().toISOString().split('T')[0],
      location: '',
      type: 'Casamento',
      guestCount: 100,
      budgetRange: 'Médio',
      styleTags: [],
      keywords: [],
      restrictions: [],
      status: ProjectStatus.ACTIVE,
      environments: [],
      assets: [],
      moodboards: [],
      production: {
        checklist: CHECKLIST_TEMPLATE.map(t => ({ id: crypto.randomUUID(), label: t.label, category: t.category, completed: false })),
        timeline: [],
        budget: []
      }
    };
    saveProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
  };

  const updateProject = (updatedProject: Project) => {
    const newProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    saveProjects(newProjects);
  };

  const deleteProject = (id: string) => {
    saveProjects(projects.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {activeProject ? (
        <ProjectDetail 
          project={activeProject} 
          onUpdate={updateProject} 
          onBack={() => setActiveProjectId(null)} 
        />
      ) : (
        <Dashboard 
          projects={projects} 
          onCreate={createProject} 
          onSelect={setActiveProjectId} 
          onDelete={deleteProject}
          onUpdate={updateProject}
        />
      )}
      <ChatBot />
    </div>
  );
};

export default App;
