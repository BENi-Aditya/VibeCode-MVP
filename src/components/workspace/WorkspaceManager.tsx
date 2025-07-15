import React, { useState, useEffect } from 'react';
import { WorkspaceSidebar, WorkspaceType } from './WorkspaceSidebar';
import { IdeationWorkspace } from './Ideation/IdeationWorkspace';
import { EnvironmentWorkspace } from './EnvironmentWorkspace';
import { CodingWorkspace } from './CodingWorkspace';
import { TestingWorkspace } from './TestingWorkspace';
import CustomCursor from '@/components/CustomCursor';

export function WorkspaceManager() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>('ideation');
  const [showTutorial, setShowTutorial] = useState(() => {
    // Only show if not dismissed this session
    return sessionStorage.getItem('vibecode-tutorial-dismissed') !== 'true';
  });

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    sessionStorage.setItem('vibecode-tutorial-dismissed', 'true');
  };

  const renderWorkspace = () => {
    switch (activeWorkspace) {
      case 'ideation':
        return <IdeationWorkspace />;
      case 'environment':
        return <EnvironmentWorkspace />;
      case 'coding':
        return <CodingWorkspace />;
      case 'testing':
        return <TestingWorkspace />;
      case 'deployment':
      default:
        return (
          <div className="flex items-center justify-center h-full bg-muted/5">
            <div className="p-6 rounded-xl glass-card text-center">
              <h2 className="text-xl font-medium mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">This workspace is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-[#121212] to-[#1E1E2F]">
      <WorkspaceSidebar 
        activeWorkspace={activeWorkspace} 
        onWorkspaceChange={setActiveWorkspace} 
      />
      <div className="flex-1 overflow-hidden">
        {renderWorkspace()}
      </div>
      {/* Tutorial Popup */}
      {showTutorial && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 backdrop-blur-xl animate-fade-in">
          <div className="relative bg-white/10 glass-card rounded-2xl shadow-2xl border border-white/20 p-0 max-w-[95vw] w-full sm:w-[480px] md:w-[640px] lg:w-[800px] flex flex-col items-center">
            <button
              className="absolute top-3 right-3 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all"
              onClick={handleCloseTutorial}
              aria-label="Close tutorial"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="w-full aspect-video bg-black rounded-t-2xl overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/qky4DxjHTt4"
                title="VibeCode Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="p-5 w-full flex flex-col items-center">
              <h2 className="text-lg font-bold text-white mb-2 text-center">Welcome to VibeCode!</h2>
              <p className="text-white/80 text-center mb-2">Watch this quick tutorial to get started, or close this popup to explore on your own.</p>
              <button
                className="mt-2 px-6 py-2 rounded-full bg-gradient-to-r from-vibe-purple to-vibe-blue text-white font-semibold shadow hover:scale-105 transition-all border border-white/10"
                onClick={handleCloseTutorial}
              >
                Got it, start coding!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom cursor */}
      <CustomCursor />
    </div>
  );
}
