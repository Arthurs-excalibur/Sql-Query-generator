import React from 'react';
import { 
  Book, 
  Terminal, 
  Sparkles, 
  Database, 
  Search, 
  ShieldCheck,
  Code,
  Zap,
  Info,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DocumentationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-[1000px] mx-auto p-12 space-y-16">
        
        {/* Hero Section */}
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 text-primary">
            <Book size={24} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">User Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary">Documentation</h1>
          <p className="text-lg text-text-secondary max-w-2xl leading-relaxed mx-auto md:mx-0">
            Everything you need to know about generating, executing, and managing SQL queries with Precision SQL Studio.
          </p>
        </div>

        {/* Quick Start Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Database, title: 'Data Ingestion', desc: 'Upload CSV or Parquet files to start analyzing your data instantly.' },
            { icon: Sparkles, title: 'AI Generation', desc: 'Use natural language to describe what you want, and let our LLM do the rest.' },
            { icon: ShieldCheck, title: 'Safe Execution', desc: 'Built-in SQL validation prevents destructive operations and ensures query safety.' }
          ].map((card, i) => (
            <div key={i} className="bg-surface p-8 rounded-3xl border border-border shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                <card.icon size={24} />
              </div>
              <h3 className="font-bold text-text-primary">{card.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 gap-16">
          
          {/* Section: SQL Generation */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <h2 className="text-xl font-bold text-text-primary px-4 whitespace-nowrap flex items-center gap-2">
                <Terminal size={20} className="text-primary" /> AI Querying
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-text-secondary leading-relaxed">
                  Our integrated LLM is optimized for DuckDB SQL syntax. You can ask complex questions in plain English, and the system will automatically:
                </p>
                <ul className="space-y-4">
                  {[
                    'Identify relevant tables and columns from your schema.',
                    'Suggest appropriate joins and aggregations.',
                    'Add protective LIMIT clauses for performance.',
                    'Provide a step-by-step explanation of the logic used.'
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-text-primary font-medium">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#0F172A] rounded-2xl p-6 shadow-2xl border border-[#1E293B]">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1E293B] pb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div className="space-y-4 font-mono text-[13px]">
                  <p className="text-[#64748B]">-- Natural Language Prompt</p>
                  <p className="text-white">"Show me the total sales by region for last month"</p>
                  <p className="text-[#64748B] mt-6">-- Generated DuckDB SQL</p>
                  <p className="text-blue-400">SELECT <span className="text-emerald-400">region, SUM(amount)</span></p>
                  <p className="text-blue-400">FROM <span className="text-emerald-400">sales</span></p>
                  <p className="text-blue-400">WHERE <span className="text-emerald-400">date {'>'}= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')</span></p>
                  <p className="text-blue-400">GROUP BY <span className="text-emerald-400">1;</span></p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Features */}
          <section className="space-y-8">
             <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <h2 className="text-xl font-bold text-text-primary px-4 whitespace-nowrap flex items-center gap-2">
                <Zap size={20} className="text-primary" /> Key Features
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: Search, title: 'Real-time Schema Browser', desc: 'Explore table definitions, column types, and data previews as you write queries.' },
                { icon: Code, title: 'Monaco Editor Integration', desc: 'Professional SQL editing experience with syntax highlighting and auto-completion.' },
                { icon: Clock, title: 'Query History', desc: 'Every query you run is automatically saved so you can revisit and refine your work.' },
                { icon: Info, title: 'AI Explanations', desc: 'Not sure how a query works? Our AI provides detailed breakdowns of generated SQL.' }
              ].map((feature, i) => (
                <div key={i} className="flex gap-5 p-6 rounded-2xl hover:bg-subtle-surface hover:shadow-sm border border-transparent hover:border-border transition-all">
                  <div className="w-10 h-10 bg-surface rounded-xl shadow-sm flex items-center justify-center text-primary shrink-0 border border-border">
                    <feature.icon size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-text-primary">{feature.title}</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="bg-primary rounded-[32px] p-12 text-center space-y-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          
          <h2 className="text-3xl font-bold relative z-10">Ready to start analyzing?</h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto relative z-10 text-lg">
            Head over to the Dashboard to upload your first dataset and start generating insights.
          </p>
          <div className="pt-4 relative z-10">
            <button 
              onClick={() => navigate('/workspace')}
              className="px-8 py-4 bg-white text-primary font-bold rounded-2xl hover:bg-white/90 transition-all shadow-xl shadow-black/10 active:scale-95"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
