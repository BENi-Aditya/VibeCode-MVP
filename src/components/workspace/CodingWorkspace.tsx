
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Terminal, Play, Save, ChevronRight, PanelLeft, PanelRight, Folder, File as FileIcon, Plus, Brain, Trash2, Edit3, FolderPlus } from 'lucide-react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames

interface File {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'file' | 'folder';
  children?: File[];
}

const initialFiles: File[] = [
  {
    id: 'file-main-py',
    name: 'main.py',
    path: 'main.py',
    content: '# Welcome to VibeCode!\n# Start coding your Python project here.\n\nprint("Hello, VibeCode!")',
    type: 'file',
  },
  {
    id: 'file-readme-md',
    name: 'README.md',
    path: 'README.md',
    content: '# My VibeCode Project\nThis is a project created in VibeCode.',
    type: 'file',
  },
  {
    id: 'folder-utils',
    name: 'utils',
    path: 'utils',
    content: '',
    type: 'folder',
    children: [
      {
        id: 'file-utils-helpers-py',
        name: 'helpers.py',
        path: 'utils/helpers.py',
        content: '# Helper functions\ndef greet(name):\n  return f"Hello, {name}!"',
        type: 'file',
      },
    ],
  },
];

export function CodingWorkspace() {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<File | null>(initialFiles.find(f => f.id === 'file-main-py') || null);
  const [showFileTree, setShowFileTree] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to VibeCode Terminal!']);
  const [terminalInputValue, setTerminalInputValue] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions({
      jsx: monacoInstance.languages.typescript.JsxEmit.React,
      esModuleInterop: true,
    });
  };

  const findFileById = (id: string, currentFiles: File[]): File | null => {
    for (const file of currentFiles) {
      if (file.id === id) return file;
      if (file.children) {
        const found = findFileById(id, file.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleFileSelect = (fileId: string) => {
    const file = findFileById(fileId, files);
    if (file && file.type === 'file') {
      setActiveFile(file);
    }
  };

  const updateFileContent = (fileId: string, newContent: string, currentFiles: File[]): File[] => {
    return currentFiles.map(file => {
      if (file.id === fileId) {
        return { ...file, content: newContent };
      }
      if (file.children) {
        return { ...file, children: updateFileContent(fileId, newContent, file.children) };
      }
      return file;
    });
  };

  const handleCodeChange = (value?: string) => {
    if (activeFile && value !== undefined) {
      setFiles(prevFiles => updateFileContent(activeFile.id, value, prevFiles));
      setActiveFile(prevActiveFile => prevActiveFile ? { ...prevActiveFile, content: value } : null);
    }
  };

  const handleSaveFile = () => {
    if (activeFile) {
      // In a real app, you'd send this to a backend
      setTerminalOutput(prev => [...prev, `File ${activeFile.name} saved (simulated).`]);
    }
  };

  const handleRunCode = () => {
    if (activeFile && activeFile.name.endsWith('.py')) {
      setTerminalOutput(prev => [...prev, `
<span class="text-gray-400">$ python ${activeFile.name}</span>`]);
      try {
        const capturedOutput: string[] = [];
        // Basic simulation
        if (activeFile.content.includes('print("Hello, VibeCode!")')) {
            capturedOutput.push("Hello, VibeCode!");
        }
        const printStatements = activeFile.content.match(/print\(([^)]+)\)/g);
        if (printStatements) {
          printStatements.forEach(stmt => {
            const argMatch = stmt.match(/print\((.*)\)/);
            if (argMatch && argMatch[1]) {
              // Super basic eval, highly insecure, for demo only
              try { capturedOutput.push(eval(argMatch[1])); } catch (e) { /* ignore*/ }
            }
          });
        }
        
        setTerminalOutput(prev => [...prev, ...capturedOutput, `<span class="text-green-400">Execution finished.</span>`]);
      } catch (error: any) {
        setTerminalOutput(prev => [...prev, `<span class="text-red-400">Error: ${error.message}</span>`]);
      }
    } else {
      setTerminalOutput(prev => [...prev, 'Cannot run non-Python files directly.']);
    }
  };

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addFileOrFolder = (parentId: string | null, type: 'file' | 'folder') => {
    const name = prompt(`Enter name for new ${type}:`);
    if (!name) return;

    const newId = generateId();
    const newItem: File = {
      id: newId,
      name: type === 'file' ? (name.includes('.') ? name : `${name}.py`) : name,
      path: '', // Path will be set recursively or based on parent
      content: type === 'file' ? `# New ${name}\n` : '',
      type: type,
      children: type === 'folder' ? [] : undefined,
    };

    const setPathRecursively = (item: File, basePath: string) => {
      item.path = basePath ? `${basePath}/${item.name}` : item.name;
      if (item.children) {
        item.children.forEach(child => setPathRecursively(child, item.path));
      }
    };

    const addToTree = (currentFiles: File[], pId: string | null): File[] => {
      if (pId === null) { // Add to root
        setPathRecursively(newItem, '');
        return [...currentFiles, newItem];
      }
      return currentFiles.map(f => {
        if (f.id === pId && f.type === 'folder') {
          const newChildren = [...(f.children || []), newItem];
          setPathRecursively(newItem, f.path);
          return { ...f, children: newChildren.map(child => { setPathRecursively(child, f.path); return child;}) };
        }
        if (f.children) {
          return { ...f, children: addToTree(f.children, pId) };
        }
        return f;
      });
    };
    setFiles(prevFiles => addToTree(prevFiles, parentId));
    if (type === 'file') handleFileSelect(newId);
  };

  const deleteFileOrFolder = (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item and its contents?")) return;
    const removeFromTree = (currentFiles: File[], idToDelete: string): File[] => {
      return currentFiles.filter(f => f.id !== idToDelete).map(f => {
        if (f.children) {
          return { ...f, children: removeFromTree(f.children, idToDelete) };
        }
        return f;
      });
    };
    setFiles(prevFiles => removeFromTree(prevFiles, itemId));
    if (activeFile && activeFile.id === itemId) setActiveFile(null);
  };
  
  const renameFileOrFolder = (itemId: string) => {
    const currentName = findFileById(itemId, files)?.name;
    const newName = prompt("Enter new name:", currentName);
    if (!newName || newName === currentName) return;

    const renameInTree = (currentFiles: File[], idToRename: string): File[] => {
      return currentFiles.map(f => {
        if (f.id === idToRename) {
          const oldPath = f.path;
          const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;
          const updatedFile = { ...f, name: newName, path: newPath };
          // Recursively update paths of children if it's a folder
          if (updatedFile.type === 'folder' && updatedFile.children) {
            const updateChildPaths = (children: File[], parentPath: string): File[] => {
              return children.map(child => {
                const updatedChild = { ...child, path: `${parentPath}/${child.name}` };
                if (updatedChild.children) {
                  updatedChild.children = updateChildPaths(updatedChild.children, updatedChild.path);
                }
                return updatedChild;
              });
            };
            updatedFile.children = updateChildPaths(updatedFile.children, newPath);
          }
          if(activeFile?.id === idToRename) setActiveFile(updatedFile);
          return updatedFile;
        }
        if (f.children) {
          return { ...f, children: renameInTree(f.children, idToRename) };
        }
        return f;
      });
    };
    setFiles(prevFiles => renameInTree(prevFiles, itemId));
  };

  const handleTerminalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerminalInputValue(e.target.value);
  };

  const handleTerminalCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && terminalInputValue.trim() !== '') {
      setTerminalOutput(prev => [...prev, `<span class="text-gray-400">$ ${terminalInputValue}</span>`]);
      // Simulate command execution
      if (terminalInputValue.startsWith('echo ')) {
        setTerminalOutput(prev => [...prev, terminalInputValue.substring(5)]);
      } else if (terminalInputValue === 'clear') {
        setTerminalOutput([]);
      } else {
        setTerminalOutput(prev => [...prev, `<span class="text-yellow-400">Command not found: ${terminalInputValue} (simulated)</span>`]);
      }
      setTerminalInputValue('');
    }
  };

  const FileTreeItemComponent: React.FC<{ file: File; depth: number; onSelect: (fileId: string) => void; activeFileId: string | null }> = ({ file, depth, onSelect, activeFileId }) => {
    const [isOpen, setIsOpen] = useState(file.type === 'folder');
    const [isHovered, setIsHovered] = useState(false);
    const isActive = activeFileId === file.id;

    return (
      <div style={{ paddingLeft: `${depth * 18}px` }} className="text-sm">
        <div 
          className={cn(
            `flex items-center justify-between p-1.5 rounded-md cursor-pointer group transition-all duration-150`,
            isActive ? 'bg-vibe-blue/20 text-vibe-blue' : 'hover:bg-muted/60',
          )}
          onClick={() => file.type === 'folder' ? setIsOpen(!isOpen) : onSelect(file.id)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center truncate">
            {file.type === 'folder' ? (
              <ChevronRight className={cn('h-4 w-4 mr-1.5 shrink-0 transition-transform duration-200', isOpen ? 'rotate-90' : '')} />
            ) : (
              <FileIcon className="h-4 w-4 mr-1.5 text-blue-400 shrink-0" />
            )}
            <span className="truncate" title={file.name}>{file.name}</span>
          </div>
          {isHovered && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pr-1">
              {file.type === 'folder' && 
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" onClick={(e) => { e.stopPropagation(); addFileOrFolder(file.id, 'file');}} title="New File"><FileIcon className="h-3.5 w-3.5"/></Button>}
              {file.type === 'folder' && 
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" onClick={(e) => { e.stopPropagation(); addFileOrFolder(file.id, 'folder');}} title="New Folder"><FolderPlus className="h-3.5 w-3.5"/></Button>}
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" onClick={(e) => { e.stopPropagation(); renameFileOrFolder(file.id);}} title="Rename"><Edit3 className="h-3.5 w-3.5"/></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-500 hover:bg-red-500/10" onClick={(e) => { e.stopPropagation(); deleteFileOrFolder(file.id);}} title="Delete"><Trash2 className="h-3.5 w-3.5"/></Button>
            </div>
          )}
        </div>
        {isOpen && file.children && file.children.map(child => (
          <FileTreeItemComponent key={child.id} file={child} depth={depth + 1} onSelect={onSelect} activeFileId={activeFileId} />
        ))}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex bg-background text-foreground select-none">
      {/* Left Sidebar (File Tree) - part of the Main Area now */} 
      {/* Main Area (Editor + Terminal) - 65% width */} 
      <div className="flex flex-[0.65] min-w-0 border-r border-border">
        {/* File tree sidebar (docked left of editor) */} 
        {showFileTree && (
          <div className="w-60 border-r border-border overflow-y-auto p-2 bg-muted/20 shrink-0 flex flex-col">
            <div className="flex justify-between items-center p-1.5 mb-1">
                <h3 className="font-semibold text-xs text-muted-foreground tracking-wider uppercase">Project Explorer</h3>
                <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" onClick={() => addFileOrFolder(null, 'file')} className="h-7 w-7 hover:bg-muted" title="New File in Root"><FileIcon className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => addFileOrFolder(null, 'folder')} className="h-7 w-7 hover:bg-muted" title="New Folder in Root"><FolderPlus className="h-4 w-4"/></Button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {files.map(file => (
                <FileTreeItemComponent key={file.id} file={file} depth={0} onSelect={handleFileSelect} activeFileId={activeFile?.id || null} />
                ))}
            </div>
          </div>
        )}

        {/* Editor and Terminal Panes */} 
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar for editor controls */} 
          <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setShowFileTree(!showFileTree)} className="mr-2 p-1.5 rounded hover:bg-muted transform transition-transform hover:scale-105">
                {showFileTree ? <PanelLeft className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
              </Button>
              <span className="font-medium text-sm truncate max-w-xs">
                {activeFile ? activeFile.path : 'No file selected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSaveFile} disabled={!activeFile} className="transform transition-transform hover:scale-105 shadow-sm hover:shadow-md">
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
              <Button size="sm" onClick={handleRunCode} disabled={!activeFile || !activeFile.name.endsWith('.py')} className="bg-green-500 hover:bg-green-600 text-white transform transition-transform hover:scale-105 shadow-sm hover:shadow-md">
                <Play className="h-4 w-4 mr-1.5" /> Run Python
              </Button>
            </div>
          </div>

          {/* Editor Area */} 
          <div className="flex-1 overflow-hidden relative">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.name.endsWith('.py') ? 'python' : activeFile.name.endsWith('.md') ? 'markdown' : 'plaintext'}
                value={activeFile.content}
                theme="vs-dark"
                onMount={handleEditorDidMount}
                onChange={handleCodeChange}
                options={{ minimap: { enabled: true, scale: 0.8 }, scrollBeyondLastLine: false, fontSize: 14, wordWrap: 'on', automaticLayout: true, glyphMargin: true }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a file to start editing or create a new one.
              </div>
            )}
          </div>

          {/* Terminal Area (Below Editor) - Resizable pane would be a future enhancement */} 
          <div className="h-48 border-t border-border shrink-0 bg-[#181818] flex flex-col">
            <Tabs defaultValue="terminal" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 pt-1.5 border-b border-border/50">
                    <TabsList className="h-8">
                        <TabsTrigger value="terminal" className="text-xs px-3 py-1 h-auto">
                            <Terminal className="h-3.5 w-3.5 mr-1.5" /> Terminal
                        </TabsTrigger>
                        {/* Add other tabs like Problems, Output here if needed */}
                    </TabsList>
                </div> 
                <TabsContent value="terminal" className="flex-1 overflow-auto p-2.5 font-mono text-xs text-white custom-scrollbar">
                    {terminalOutput.map((line, index) => (
                    <div key={index} dangerouslySetInnerHTML={{ __html: line.replace(/\n/g, '<br/>') }} />
                    ))}
                    <div className="flex items-center mt-1.5">
                    <span className="text-green-400 mr-1.5 shrink-0">$&gt;</span>
                    <input 
                        type="text" 
                        className="bg-transparent border-none outline-none text-white flex-1 w-full terminal-input"
                        placeholder="Type commands..."
                        value={terminalInputValue}
                        onChange={handleTerminalInputChange}
                        onKeyDown={handleTerminalCommand}
                    />
                    </div>
                </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* AI Chat Panel (35% width) */} 
      <div className="flex-[0.35] min-w-0 border-l border-border bg-muted/10 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
          <h3 className="font-semibold text-base flex items-center text-white"><Brain className="h-5 w-5 mr-2 text-vibe-purple"/> Vibe AI</h3>
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 transform transition-transform hover:scale-105">New Chat</Button>
        </div>
        <div className="flex-1 overflow-y-auto mb-3 custom-scrollbar p-1 space-y-3">
          {/* Placeholder AI messages - style like Idea Refinement Canvas */}
          <div className="p-3 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 shadow-md">
            <p className="text-xs text-white/70">Welcome! How can I assist with your coding today?</p>
          </div>
          <div className="p-3 rounded-lg bg-vibe-purple/10 backdrop-blur-sm border border-vibe-purple/50 shadow-md ml-auto max-w-[85%]">
            <p className="text-xs text-white">Can you explain this Python function?</p>
          </div>
           <div className="p-3 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 shadow-md">
            <p className="text-xs text-white/70">Sure, paste the function here or tell me which file it's in!</p>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t border-border/50">
          <Input placeholder="Ask Vibe AI..." className="text-sm bg-black/20 border-white/20 placeholder:text-white/50 text-white focus:ring-vibe-purple" />
          <Button size="sm" className="bg-vibe-blue hover:bg-vibe-blue/90 text-white transform transition-transform hover:scale-105">Send</Button>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
        .terminal-input::after {
            content: '';
            display: inline-block;
            width: 7px; /* Cursor width */
            height: 1.2em; /* Cursor height, adjust as needed */
            background-color: white; /* Cursor color */
            animation: blink 1s step-end infinite;
            margin-left: 2px; /* Space after text */
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
