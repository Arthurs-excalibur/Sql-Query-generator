import React from 'react';
import { Sparkles, BrainCircuit, Lightbulb } from 'lucide-react';

interface AIInsightProps {
  explanation: string;
  status?: string;
}

export const AIInsight: React.FC<AIInsightProps> = ({ explanation, status }) => {
  const isThinking = status === 'executing' && !explanation;
  
  if (!explanation && !isThinking) return null;

  // Clean up the explanation string from common LLM artifacts
  const cleanExplanation = explanation
    .replace(/```sql[\s\S]*?```/g, '') // Remove SQL blocks as they are already in the editor
    .replace(/```[\s\S]*?```/g, '')    // Remove other code blocks
    .trim();

  const lines = cleanExplanation.split('\n').filter(l => l.trim());
  const header = isThinking ? "Analyzing business impact..." : (lines[0] || "AI Analysis");
  const content = isThinking ? [] : lines.slice(1);

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
          <BrainCircuit size={14} className="animate-pulse" />
          Intelligent Query Analysis
        </div>
      </div>

      <div className="relative group">
        {/* Animated Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-purple-500/20 to-primary/30 rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 animate-pulse-slow"></div>
        
        <div className="relative bg-surface/90 backdrop-blur-2xl border border-primary/10 rounded-[32px] p-10 shadow-2xl shadow-primary/10">
          <div className="flex flex-col lg:flex-row items-start gap-10">
            
            {/* Sparkle Icon Container */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 bg-primary rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-primary/40 relative z-10 overflow-hidden">
                <Sparkles size={32} />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 animate-shimmer" />
              </div>
              {/* Decorative rings */}
              <div className="absolute inset-0 -m-2 border-2 border-primary/10 rounded-[28px] animate-ping-slow"></div>
            </div>
            
            <div className="space-y-8 flex-1">
              <h3 className="text-2xl font-bold text-text-primary leading-tight tracking-tight">
                {header.replace(/^[#\s*]+/, '')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                {content.map((line, i) => {
                  const isSubHeader = line.startsWith('###') || (line.startsWith('**') && line.endsWith('**'));
                  const cleanLine = line.replace(/^[#\s*•-]+/, '').replace(/\*\*/g, '').trim();
                  
                  if (!cleanLine) return null;

                  if (isSubHeader) {
                    return (
                      <div key={i} className="col-span-full pt-6 first:pt-0">
                        <h4 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-[0.15em]">
                          <Lightbulb size={16} />
                          {cleanLine}
                        </h4>
                        <div className="h-1 w-16 bg-gradient-to-r from-primary to-transparent mt-3 rounded-full" />
                      </div>
                    );
                  }

                  return (
                    <div key={i} className="flex gap-5 group/item items-start">
                      <div className="mt-2.5">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full group-hover/item:bg-primary group-hover/item:scale-150 transition-all duration-300" />
                      </div>
                      <p className="text-[15px] text-text-secondary leading-relaxed font-medium">
                        {line.replace(/^[#\s*•-]+/, '').replace(/\*\*/g, '')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
