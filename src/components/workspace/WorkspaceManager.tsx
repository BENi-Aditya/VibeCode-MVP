
import { useState, useEffect } from 'react';
import { WorkspaceSidebar, WorkspaceType } from './WorkspaceSidebar';
import { IdeationWorkspace } from './Ideation/IdeationWorkspace';
import { EnvironmentWorkspace } from './EnvironmentWorkspace';
import { CodingWorkspace } from './CodingWorkspace';
import { TestingWorkspace } from './TestingWorkspace';
import CustomCursor from '@/components/CustomCursor';

export function WorkspaceManager() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>('ideation');

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
      
      {/* Custom cursor */}
      <CustomCursor />
    </div>
  );
}
