
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Terminal, Play, Save, ChevronRight, PanelLeft, PanelRight, Info } from 'lucide-react';

export function CodingWorkspace() {
  const [codeContent, setCodeContent] = useState(`import pygame
import sys

# Initialize pygame
pygame.init()

# Set up display
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption('My Python Game')

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)

# Player settings
player_pos = [WIDTH // 2, HEIGHT // 2]
player_size = 40
player_speed = 5

# Game loop
clock = pygame.time.Clock()

def main():
    running = True
    
    while running:
        # Process events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
                
        # Handle keyboard input
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            player_pos[0] -= player_speed
        if keys[pygame.K_RIGHT]:
            player_pos[0] += player_speed
        if keys[pygame.K_UP]:
            player_pos[1] -= player_speed
        if keys[pygame.K_DOWN]:
            player_pos[1] += player_speed
            
        # Keep player on screen
        player_pos[0] = max(player_size // 2, min(WIDTH - player_size // 2, player_pos[0]))
        player_pos[1] = max(player_size // 2, min(HEIGHT - player_size // 2, player_pos[1]))
        
        # Clear screen
        screen.fill(BLACK)
        
        # Draw player
        pygame.draw.circle(screen, RED, player_pos, player_size // 2)
        
        # Update display
        pygame.display.flip()
        
        # Cap at 60 FPS
        clock.tick(60)
    
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
`);

  const [query, setQuery] = useState('');
  const [activeFile, setActiveFile] = useState('main.py');
  const [showFileTree, setShowFileTree] = useState(true);
  const [showHelp, setShowHelp] = useState(true);

  const files = [
    { name: 'main.py', type: 'python' },
    { name: 'assets', type: 'folder', children: [
      { name: 'sprites', type: 'folder', children: [
        { name: 'player.png', type: 'image' },
      ]},
      { name: 'sounds', type: 'folder', children: [
        { name: 'background.mp3', type: 'audio' },
      ]}
    ]},
    { name: 'requirements.txt', type: 'text' },
    { name: 'README.md', type: 'markdown' },
  ];

  const handleRunCode = () => {
    console.log('Running code...');
  };

  const handleAIHelp = () => {
    if (query.trim() === '') return;
    console.log(`Asking AI: ${query}`);
    setQuery('');
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Top bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => setShowFileTree(!showFileTree)}>
            {showFileTree ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
          <div className="ml-4 font-medium">
            {activeFile}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => console.log('Saving file...')}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button size="sm" onClick={handleRunCode}>
            <Play className="h-4 w-4 mr-1" /> Run
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        {showFileTree && (
          <div className="w-56 border-r border-border overflow-y-auto bg-background">
            <div className="p-3 font-medium text-sm text-muted-foreground">
              PROJECT FILES
            </div>
            <div className="px-2 py-1">
              {files.map((file, index) => (
                <FileTreeItem key={index} file={file} depth={0} onSelect={setActiveFile} activeFile={activeFile} />
              ))}
            </div>
          </div>
        )}
        
        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="editor" className="flex-1 flex flex-col">
            <div className="px-4 border-b border-border">
              <TabsList>
                <TabsTrigger value="editor" className="flex items-center">
                  <Code className="h-4 w-4 mr-1" /> Editor
                </TabsTrigger>
                <TabsTrigger value="terminal" className="flex items-center">
                  <Terminal className="h-4 w-4 mr-1" /> Terminal
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="editor" className="flex-1 overflow-hidden p-0 flex">
              <div className="flex-1 overflow-auto">
                <pre className="p-4 font-mono text-sm">
                  <code>{codeContent}</code>
                </pre>
              </div>
              
              {showHelp && (
                <div className="w-72 border-l border-border overflow-y-auto p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center">
                      <Info className="h-4 w-4 mr-1" /> AI Assistant
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Ask me anything about your code or how to implement new features.
                    </p>
                    
                    <div className="chat-bubble chat-bubble-ai text-sm">
                      I notice you're building a game with Pygame. Would you like help adding collision detection or more game elements?
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask AI for help..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAIHelp();
                        }}
                      />
                      <Button size="sm" onClick={handleAIHelp}>Ask</Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-4">
                      <p className="font-medium">Keyboard Shortcuts:</p>
                      <ul className="mt-1 space-y-1">
                        <li>Ctrl + K: Generate code</li>
                        <li>Ctrl + L: Open chat</li>
                        <li>Ctrl + I: Edit multiple files</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="terminal" className="flex-1 overflow-hidden p-0">
              <div className="bg-black text-white p-4 font-mono text-sm h-full overflow-auto">
                <div className="opacity-60">$ python main.py</div>
                <div className="mt-1">Pygame initialized successfully</div>
                <div>Game window created: 800x600</div>
                <div>Player object initialized</div>
                <div className="text-green-400">Game running...</div>
                <div className="animate-pulse mt-1 text-white">▋</div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface File {
  name: string;
  type: string;
  children?: File[];
}

interface FileTreeItemProps {
  file: File;
  depth: number;
  activeFile: string;
  onSelect: (fileName: string) => void;
}

function FileTreeItem({ file, depth, activeFile, onSelect }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const getFileIcon = () => {
    switch (file.type) {
      case 'folder':
        return <div className="w-4 h-4 text-yellow-500">📁</div>;
      case 'python':
        return <div className="w-4 h-4 text-blue-500">🐍</div>;
      case 'image':
        return <div className="w-4 h-4 text-green-500">🖼️</div>;
      case 'audio':
        return <div className="w-4 h-4 text-purple-500">🔊</div>;
      default:
        return <div className="w-4 h-4 text-gray-500">📄</div>;
    }
  };
  
  const handleClick = () => {
    if (file.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onSelect(file.name);
    }
  };
  
  return (
    <div>
      <div 
        className={`flex items-center py-1 px-2 text-sm rounded hover:bg-accent cursor-pointer ${activeFile === file.name ? 'bg-accent' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {file.type === 'folder' && (
          <ChevronRight className={`h-3 w-3 mr-1 transition-transform ${isOpen ? 'transform rotate-90' : ''}`} />
        )}
        {getFileIcon()}
        <span className="ml-1.5 truncate">{file.name}</span>
      </div>
      
      {file.type === 'folder' && isOpen && file.children && (
        <div>
          {file.children.map((child, index) => (
            <FileTreeItem 
              key={index} 
              file={child} 
              depth={depth + 1} 
              activeFile={activeFile}
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
