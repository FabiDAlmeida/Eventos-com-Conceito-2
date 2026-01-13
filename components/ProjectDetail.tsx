
import React, { useState } from 'react';
import { Project } from '../types';
import { ChevronLeft, Info, Layout, Image, PenTool, Palette, Shield, FileText, ClipboardList } from 'lucide-react';
import BriefingTab from './tabs/BriefingTab';
import EnvironmentsTab from './tabs/EnvironmentsTab';
import AssetsTab from './tabs/AssetsTab';
import BoardsTab from './tabs/BoardsTab';
import MoodboardsTab from './tabs/MoodboardsTab';
import CrestTab from './tabs/CrestTab';
import DossierTab from './tabs/DossierTab';
import ProductionTab from './tabs/ProductionTab';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
  onBack: () => void;
}

const ProjectDetail: React.FC<Props> = ({ project, onUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState('briefing');

  const tabs = [
    { id: 'briefing', label: 'Briefing', icon: Info },
    { id: 'environments', label: 'Ambientes', icon: Layout },
    { id: 'assets', label: 'Assets', icon: Image },
    { id: 'boards', label: 'Pranchas', icon: PenTool },
    { id: 'moodboards', label: 'Moodboards', icon: Palette },
    { id: 'crest', label: 'Brasão', icon: Shield },
    { id: 'production', label: 'Produção', icon: ClipboardList },
    { id: 'dossier', label: 'Dossiê', icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold truncate max-w-[200px] md:max-w-md">{project.name}</h1>
          </div>
          <div className="flex gap-2">
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {project.status}
            </span>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600 font-semibold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {activeTab === 'briefing' && <BriefingTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'environments' && <EnvironmentsTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'assets' && <AssetsTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'boards' && <BoardsTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'moodboards' && <MoodboardsTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'crest' && <CrestTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'production' && <ProductionTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'dossier' && <DossierTab project={project} onUpdate={onUpdate} />}
      </main>
    </div>
  );
};

export default ProjectDetail;
