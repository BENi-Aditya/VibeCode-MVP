
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Play, Layout, Eye, TestTube, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TestingWorkspace() {
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
  
  return (
    <div className="w-full h-full p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center">
            <TestTube className="h-8 w-8 mr-2 text-vibe-purple" />
            Testing Workspace
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform neo-blur">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button className="bg-vibe-purple hover:bg-vibe-dark-purple hover:scale-105 transition-transform">
              <Play className="h-4 w-4 mr-1" />
              Run
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button 
            variant={activeTab === 'preview' ? 'default' : 'outline'}
            className={cn("transition-all", 
              activeTab === 'preview' 
                ? "bg-vibe-purple hover:bg-vibe-dark-purple shadow-md" 
                : "hover:scale-105"
            )}
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button 
            variant={activeTab === 'console' ? 'default' : 'outline'}
            className={cn("transition-all", 
              activeTab === 'console' 
                ? "bg-vibe-purple hover:bg-vibe-dark-purple shadow-md" 
                : "hover:scale-105"
            )}
            onClick={() => setActiveTab('console')}
          >
            <Code className="h-4 w-4 mr-1" />
            Console
          </Button>
        </div>

        <Card className="glass-card overflow-hidden border border-white/10 shadow-xl h-[70vh]">
          <CardHeader className="bg-black/40 border-b border-white/10 flex flex-row items-center justify-between p-3">
            <CardTitle className="text-sm font-medium">
              {activeTab === 'preview' ? 'Live Preview' : 'Console Output'}
            </CardTitle>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-full">
            {activeTab === 'preview' ? (
              <div className="h-full flex">
                <div className="w-full h-full bg-white overflow-hidden flex items-center justify-center">
                  <div className="text-black p-4 text-center">
                    <h2 className="text-xl font-medium mb-2">Your App Preview</h2>
                    <p>The preview of your web application will appear here</p>
                  </div>
                </div>
                <div className="w-[30%] h-full bg-[#1E1E2F] border-l border-white/10 p-3 overflow-auto">
                  <div className="text-xs font-mono">
                    <div className="mb-2 text-vibe-blue">Elements</div>
                    <div className="pl-2 border-l border-white/10 text-white/70">
                      <div className="mb-1">&lt;html&gt;</div>
                      <div className="pl-2 mb-1">&lt;head&gt;...&lt;/head&gt;</div>
                      <div className="pl-2 mb-1">&lt;body&gt;</div>
                      <div className="pl-4 mb-1 text-vibe-purple">&lt;div class="container"&gt;</div>
                      <div className="pl-6 mb-1">&lt;h2&gt;Your App Preview&lt;/h2&gt;</div>
                      <div className="pl-6 mb-1">&lt;p&gt;The preview...&lt;/p&gt;</div>
                      <div className="pl-4 mb-1 text-vibe-purple">&lt;/div&gt;</div>
                      <div className="pl-2 mb-1">&lt;/body&gt;</div>
                      <div>&lt;/html&gt;</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full bg-[#1E1E2F] p-4 font-mono text-sm overflow-auto">
                <div className="text-green-400 mb-2"># Console output will appear here</div>
                <div className="text-white/70">
                  &gt; Application started<br />
                  &gt; Loaded modules successfully<br />
                  &gt; Listening on port 3000<br />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
