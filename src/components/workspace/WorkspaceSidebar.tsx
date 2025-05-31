import { cn } from '@/lib/utils';
import { 
  Lightbulb, 
  Code2, 
  Palette, 
  FlaskConical, 
  Upload, 
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type WorkspaceType = 'ideation' | 'environment' | 'coding' | 'testing' | 'deployment';

interface WorkspaceSidebarProps {
  activeWorkspace: WorkspaceType;
  onWorkspaceChange: (workspace: WorkspaceType) => void;
}

interface WorkspaceButton {
  id: WorkspaceType;
  label: string;
  icon: React.ElementType;
  description: string;
  disabled?: boolean;
}

export function WorkspaceSidebar({ activeWorkspace, onWorkspaceChange }: WorkspaceSidebarProps) {
  const [showConstruction, setShowConstruction] = useState(false);
  const [constructionInfo, setConstructionInfo] = useState({ name: "", description: "" });

  const workspaces: WorkspaceButton[] = [
    {
      id: 'ideation',
      label: 'Ideation',
      icon: Lightbulb,
      description: 'Brainstorm and develop your project ideas'
    },
    {
      id: 'environment',
      label: 'Environment',
      icon: Palette,
      description: 'Set up your development environment'
    },
    {
      id: 'coding',
      label: 'Coding',
      icon: Code2,
      description: 'Write and edit your code'
    },
    {
      id: 'testing',
      label: 'Testing',
      icon: FlaskConical,
      description: 'Test and debug your application'
    },
    {
      id: 'deployment',
      label: 'Deploy',
      icon: Upload,
      description: 'Deploy your application'
    }
  ];

  const handleWorkspaceClick = (workspace: WorkspaceButton) => {
    if (workspace.id === 'ideation' || workspace.id === 'coding') {
      onWorkspaceChange(workspace.id);
      setShowConstruction(false);
    } else {
      setConstructionInfo({
        name: workspace.label,
        description: workspace.description
      });
      setShowConstruction(true);
    }
  };

  return (
    <>
      <div className="h-full w-16 border-r border-white/10 bg-black/30 backdrop-blur-md flex flex-col items-center py-8">
        <div className="mb-12 flex items-center justify-center">
          <div 
            className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-vibe-purple to-vibe-blue flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300"
            data-interactive
          >
            <img src="logo.png" alt="VibeCode Logo" className="w-full h-full object-cover" />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <TooltipProvider delayDuration={300}>
            {workspaces.map((workspace) => (
              <Tooltip key={workspace.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all duration-300",
                      activeWorkspace === workspace.id 
                        ? "bg-gradient-to-br from-vibe-purple to-vibe-blue text-white shadow-lg shadow-vibe-purple/20" 
                        : "text-white/50 hover:text-white hover:bg-white/10 hover:scale-110",
                      workspace.id !== 'ideation' && "opacity-80"
                    )}
                    onClick={() => handleWorkspaceClick(workspace)}
                    data-interactive
                  >
                    <workspace.icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="right"
                  className="bg-black/80 backdrop-blur-lg border border-white/20 px-3 py-2 rounded-lg z-[100001]"
                >
                  <p className="font-medium text-white">{workspace.label}</p>
                  <p className="text-xs text-white/70">{workspace.description}</p>
                  {workspace.id !== 'ideation' && workspace.id !== 'coding' && (
                    <p className="text-xs text-vibe-purple mt-1">Coming soon</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Under Construction Modal - Now positioned in the center of the main content */}
      {showConstruction && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[99998] flex items-center justify-center"
          onClick={() => setShowConstruction(false)}
        >
          <div 
            className="glass-card p-10 rounded-2xl w-full max-w-xl shadow-2xl border border-white/10 relative flex flex-col items-center animate-in zoom-in-95 duration-200 fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)' }}
          >
            <button 
              className="absolute top-5 right-5 rounded-full p-2 hover:bg-white/10 transition-colors z-10"
              onClick={() => setShowConstruction(false)}
              aria-label="Close"
            >
              <X className="h-6 w-6 text-white/60" />
            </button>
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-yellow-500/20 p-4 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{constructionInfo.name} Workspace</h3>
                  <p className="text-base text-white/70">Under Construction</p>
                </div>
              </div>
              <div className="w-full border-2 border-dashed border-yellow-500/20 rounded-xl px-8 py-10 bg-black/30 backdrop-blur-md flex flex-col items-center">
                <h4 className="text-3xl font-bold text-white mb-4">Coming Soon!</h4>
                <p className="text-lg text-white/70 mb-7 text-center max-w-md">{constructionInfo.description} feature is currently under development.</p>
                <button
                  className="px-7 py-3 text-base rounded-full bg-gradient-to-r from-vibe-purple to-vibe-blue hover:from-vibe-purple/90 hover:to-vibe-blue/90 text-white font-semibold shadow-md transition-all duration-200"
                  onClick={() => setShowConstruction(false)}
                >
                  Return to Ideation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
