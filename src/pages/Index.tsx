import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceSidebar, WorkspaceType } from '@/components/workspace/WorkspaceSidebar';
import { IdeationWorkspace } from '@/components/workspace/Ideation/IdeationWorkspace';
import { CodingWorkspace } from '@/components/workspace/CodingWorkspace';
import { EnvironmentWorkspace } from '@/components/workspace/EnvironmentWorkspace';
import CustomCursor from '@/components/CustomCursor';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Determine workspace from path
  const getWorkspaceFromPath = (pathname: string): WorkspaceType => {
    if (pathname.startsWith('/coding')) return 'coding';
    if (pathname.startsWith('/ideation')) return 'ideation';
    if (pathname.startsWith('/environment')) return 'environment';
    return 'ideation'; // default
  };
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>(getWorkspaceFromPath(location.pathname));

  // Handle sidebar navigation
  const handleWorkspaceChange = (workspace: WorkspaceType) => {
    setActiveWorkspace(workspace);
    if (workspace === 'coding') navigate('/coding');
    else if (workspace === 'ideation') navigate('/ideation');
    else if (workspace === 'environment') navigate('/environment');
    // Add more as needed
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <CustomCursor />
      <WorkspaceSidebar activeWorkspace={activeWorkspace} onWorkspaceChange={handleWorkspaceChange} />
      <div className="flex-1 h-full">
        <Routes>
          <Route path="/ideation" element={<IdeationWorkspace />} />
          <Route path="/coding" element={<CodingWorkspace />} />
          <Route path="/environment" element={<EnvironmentWorkspace />} />
          <Route path="*" element={<IdeationWorkspace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Index;
