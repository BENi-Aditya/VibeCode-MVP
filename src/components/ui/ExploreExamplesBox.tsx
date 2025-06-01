import React from 'react';
import { Button } from './button';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExploreExamplesBoxProps {
  examples: string[];
  onExampleClick: (example: string) => void;
  className?: string;
}

export const ExploreExamplesBox: React.FC<ExploreExamplesBoxProps> = ({ examples, onExampleClick, className }) => {
  const handleClick = () => {
    if (examples.length === 0) return;
    const random = examples[Math.floor(Math.random() * examples.length)];
    onExampleClick(random);
  };

  return (
    <div
      className={cn(
        'glass-card border-2 border-vibe-purple/60 rounded-2xl p-4 mb-3 flex flex-col items-center w-full shadow-lg',
        'backdrop-blur-xl bg-black/30',
        'glow-accent',
        className
      )}
      style={{ boxShadow: '0 0 16px 2px #a78bfa55, 0 2px 8px 0 rgba(80,60,180,0.10)' }}
    >
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="rounded-full px-6 py-3 bg-white/10 text-white/90 border border-vibe-purple/40 hover:bg-vibe-purple/20 hover:shadow-[0_0_12px_2px_rgba(155,135,245,0.25)] transition-all duration-200 text-base pill-glow flex items-center gap-2"
        style={{ boxShadow: '0 0 12px 0 #a78bfa33' }}
        onClick={handleClick}
      >
        <Lightbulb className="text-vibe-purple w-5 h-5" />
        <span>Explore Example</span>
      </Button>
    </div>
  );
}; 