import React, { useState } from 'react';
import { Button } from './button';
import { Lightbulb, Sparkles, ArrowRight, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExploreExamplesBoxProps {
  examples: string[];
  onExampleClick: (example: string) => void;
  className?: string;
}

export const ExploreExamplesBox: React.FC<ExploreExamplesBoxProps> = ({ examples, onExampleClick, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (examples.length === 0) return;
    const random = examples[Math.floor(Math.random() * examples.length)];
    onExampleClick(random);
  };

  return (
    <div className={cn('w-full flex justify-center', className)}>
      <div 
        className="group relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-vibe-purple/20 via-vibe-blue/20 to-vibe-purple/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Main button container */}
        <div className="relative bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-1 shadow-2xl">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "relative h-14 px-8 rounded-xl bg-gradient-to-r from-vibe-purple/10 via-transparent to-vibe-blue/10",
              "border border-white/10 backdrop-blur-sm",
              "text-white font-medium text-base tracking-wide",
              "transition-all duration-300 ease-out",
              "hover:border-vibe-purple/40 hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]",
              "active:scale-[0.98] active:shadow-[0_0_15px_rgba(167,139,250,0.5)]",
              "group overflow-hidden",
              isPressed && "scale-[0.98]"
            )}
            onClick={handleClick}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {/* Content */}
            <div className="relative flex items-center gap-3 z-10">
              {/* Icon container with rotation animation */}
              <div className="relative">
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-br from-vibe-purple/20 to-vibe-blue/20",
                  "border border-vibe-purple/30 backdrop-blur-sm",
                  "transition-all duration-300",
                  isHovered && "rotate-12 scale-110 shadow-lg shadow-vibe-purple/30"
                )}>
                  <Lightbulb className={cn(
                    "w-5 h-5 text-vibe-purple transition-all duration-300",
                    isHovered && "text-white drop-shadow-lg"
                  )} />
                </div>
                
                {/* Floating sparkles */}
                <Sparkles className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 text-vibe-blue transition-all duration-500",
                  isHovered ? "opacity-100 scale-100 rotate-180" : "opacity-0 scale-50 rotate-0"
                )} />
              </div>
              
              {/* Text with gradient */}
              <span className="bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent font-semibold">
                Explore Examples
              </span>
              
              {/* Arrow with slide animation */}
              <ArrowRight className={cn(
                "w-4 h-4 text-vibe-blue transition-all duration-300",
                isHovered ? "translate-x-1 opacity-100" : "translate-x-0 opacity-60"
              )} />
            </div>
            
            {/* Subtle code pattern overlay */}
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <Code2 className="w-4 h-4 text-vibe-purple" />
            </div>
          </Button>
        </div>
        
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-2xl transition-all duration-500 pointer-events-none",
          isHovered 
            ? "shadow-[0_0_30px_rgba(167,139,250,0.4),0_0_60px_rgba(56,189,248,0.2)]" 
            : "shadow-[0_0_15px_rgba(167,139,250,0.2)]"
        )} />
      </div>
    </div>
  );
}; 