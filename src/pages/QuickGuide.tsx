import React from 'react';
import { 
  Rocket, 
  UploadCloud, 
  MessageSquare, 
  Zap, 
  Shield, 
  ChevronRight,
  Database,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MousePointer2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickGuide: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-[1100px] mx-auto p-8 md:p-16 space-y-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3 text-primary">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Rocket size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.25em]">Onboarding</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary tracking-tight">
              Get started with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Precision SQL</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              Master the workflow from raw data to intelligent business insights in under 2 minutes.
            </p>
          </div>
          <button 
            onClick={() => navigate('/setup')}
            className="group flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            Start Setup
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* The 3-Step Journey */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              step: '01',
              icon: UploadCloud, 
              title: 'Connect Data', 
              desc: 'Upload a CSV or Parquet file. We instantly create a high-performance DuckDB table for you.',
              color: 'text-blue-500',
              bg: 'bg-blue-500/5'
            },
            { 
              step: '02',
              icon: MessageSquare, 
              title: 'Ask in English', 
              desc: 'Describe what you need. "Show total revenue by month" becomes complex SQL automatically.',
              color: 'text-purple-500',
              bg: 'bg-purple-500/5'
            },
            { 
              step: '03',
              icon: LineChart, 
              title: 'Get Insights', 
              desc: 'Run the query and get instant AI-powered business analysis of your results.',
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/5'
            }
          ].map((item, i) => (
            <div key={i} className="relative group p-10 bg-surface rounded-[40px] border border-border hover:border-primary/20 transition-all duration-500">
              <div className="absolute top-8 right-8 text-4xl font-black text-text-secondary/5 group-hover:text-primary/10 transition-colors">
                {item.step}
              </div>
              <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <item.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">{item.title}</h3>
              <p className="text-text-secondary leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Detailed Guide Sections */}
        <div className="space-y-32">
          
          {/* Pro Tips Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={14} /> Expert Tips
              </div>
              <h2 className="text-3xl font-bold text-text-primary">How to get the best results</h2>
              <div className="space-y-6">
                {[
                  { title: 'Be Specific', desc: 'Instead of "Sales", try "Total sales by product for the last 30 days".' },
                  { title: 'Use Table Names', desc: 'Referencing specific tables helps the AI map schema accurately.' },
                  { title: 'Review Generated SQL', desc: 'The editor allows manual tweaks if the AI needs a slight nudge.' },
                  { title: 'Check Schema', desc: 'Use the schema browser on the left to verify column names.' }
                ].map((tip, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-subtle-surface transition-colors">
                    <div className="mt-1">
                      <CheckCircle2 size={18} className="text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-text-primary text-sm">{tip.title}</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-[40px] blur-2xl opacity-50"></div>
              <div className="relative bg-[#0F172A] rounded-3xl border border-[#1E293B] shadow-2xl overflow-hidden">
                <div className="p-4 bg-[#1E293B]/50 flex items-center justify-between border-b border-[#1E293B]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono">ai-workspace.sql</span>
                </div>
                <div className="p-8 font-mono text-sm leading-relaxed space-y-4">
                  <p className="text-[#64748B]">-- Use clear aggregations</p>
                  <p className="text-white"><span className="text-purple-400">SELECT</span> category, <span className="text-emerald-400">COUNT(*)</span> <span className="text-purple-400">as</span> total</p>
                  <p className="text-white"><span className="text-purple-400">FROM</span> products</p>
                  <p className="text-white"><span className="text-purple-400">GROUP BY</span> <span className="text-amber-400">1</span></p>
                  <p className="text-white"><span className="text-purple-400">ORDER BY</span> total <span className="text-purple-400">DESC</span>;</p>
                </div>
              </div>
            </div>
          </section>

          {/* Core Features */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-text-primary">Core Studio Features</h2>
              <p className="text-text-secondary max-w-xl mx-auto">Professional tools designed for speed, accuracy, and deep data exploration.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Database, title: 'DuckDB Engine', desc: 'Lightning fast analytical processing.' },
                { icon: Zap, title: 'Instant SSE', desc: 'Real-time streaming AI insights.' },
                { icon: Shield, title: 'SQL Guardian', desc: 'Safety checks for every query.' },
                { icon: MousePointer2, title: 'Intuitive UI', desc: 'Modern workspace for analysts.' }
              ].map((f, i) => (
                <div key={i} className="p-8 bg-surface border border-border rounded-[32px] space-y-4 text-center hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto">
                    <f.icon size={22} />
                  </div>
                  <h4 className="font-bold text-text-primary text-sm">{f.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-primary to-purple-600 rounded-[48px] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          
          <div className="space-y-4 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Ready to unleash your data?</h2>
            <p className="text-white/70 max-w-lg mx-auto text-lg leading-relaxed">
              Start your journey today. Upload your first dataset and let the AI do the heavy lifting.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button 
              onClick={() => navigate('/setup')}
              className="px-10 py-5 bg-white text-primary font-bold rounded-2xl hover:bg-white/90 transition-all shadow-2xl active:scale-95 flex items-center gap-2"
            >
              Start Your Project
              <ChevronRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/docs')}
              className="px-10 py-5 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95"
            >
              Read Documentation
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
