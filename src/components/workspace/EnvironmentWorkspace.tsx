
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, CheckCircle, Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DependencyItem {
  name: string;
  version: string;
  status: 'pending' | 'installing' | 'complete';
  progress: number;
}

export function EnvironmentWorkspace() {
  const [environmentType, setEnvironmentType] = useState('Python Game Development');
  const [setupProgress, setSetupProgress] = useState(75);
  const [dependencies, setDependencies] = useState<DependencyItem[]>([
    { name: 'Python', version: '3.10.0', status: 'complete', progress: 100 },
    { name: 'Pygame', version: '2.5.2', status: 'complete', progress: 100 },
    { name: 'NumPy', version: '1.25.2', status: 'installing', progress: 65 },
    { name: 'Pillow', version: '10.0.1', status: 'pending', progress: 0 },
  ]);

  return (
    <div className="w-full h-full p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center">
            <FlaskConical className="h-8 w-8 mr-2 text-vibe-purple" />
            Environment Setup
          </h1>
          <div className="flex items-center text-sm px-4 py-2 bg-vibe-purple/10 text-vibe-purple rounded-full">
            <span className="mr-2 font-medium">{environmentType}</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader className="h-5 w-5 animate-spin mr-2" />
              Setup Progress
            </CardTitle>
            <CardDescription>
              The system is configuring your cloud environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Overall Progress</span>
                <span>{setupProgress}%</span>
              </div>
              <Progress value={setupProgress} className="h-2" />
              
              <div className="bg-secondary/50 p-4 rounded-md mt-6">
                <h4 className="text-sm font-medium mb-3">Installing Dependencies</h4>
                <div className="space-y-4">
                  {dependencies.map((dep) => (
                    <div key={dep.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm">
                          {dep.status === 'complete' ? (
                            <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                          ) : (
                            dep.status === 'installing' ? (
                              <Loader className="h-4 w-4 mr-1.5 animate-spin text-vibe-blue" />
                            ) : (
                              <div className="h-4 w-4 mr-1.5 rounded-full border border-muted-foreground" />
                            )
                          )}
                          {dep.name} <span className="text-xs ml-1 text-muted-foreground">v{dep.version}</span>
                        </span>
                        <span className="text-xs font-medium">
                          {dep.status === 'complete' ? 'Complete' : 
                           dep.status === 'installing' ? `${dep.progress}%` : 'Pending'}
                        </span>
                      </div>
                      <Progress value={dep.progress} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Details</CardTitle>
            <CardDescription>
              Technical specifications of your cloud environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Runtime</span>
                  <span className="text-sm font-medium">Python 3.10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CPU</span>
                  <span className="text-sm font-medium">4 cores</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">RAM</span>
                  <span className="text-sm font-medium">8 GB</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="text-sm font-medium">10 GB SSD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">US East</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Session Timeout</span>
                  <span className="text-sm font-medium">2 hours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
