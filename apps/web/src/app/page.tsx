"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, BookOpen, MessageSquare, GitCompare, Bell, FileDown } from "lucide-react";

export default function Page() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-slate-400 font-sans selection:bg-indigo-500/30">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-[#0a0f1e]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <span className="text-white font-semibold text-lg tracking-tight">LexAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <UserButton />
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200">
                    Get Started Free
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden">
        {/* Radial gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500 rounded-full blur-[120px] opacity-15 pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-xs font-medium rounded-full px-3 py-1 mb-8">
            ✦ Powered by GPT-4o
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Review Contracts <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">10x Faster</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Upload any contract and get instant AI-powered risk analysis, plain-English clause explanations, and smart follow-up drafts — in seconds.
          </p>
          
          {isSignedIn ? (
            <div className="flex flex-col items-center w-full">
              <button 
                onClick={() => router.push('/upload')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                Go to Dashboard <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2">
                    Analyze Your First Contract <span aria-hidden="true">&rarr;</span>
                  </button>
                </SignInButton>
                <a href="#how-it-works" className="w-full sm:w-auto border border-white/20 hover:bg-white/5 text-white px-8 py-3.5 rounded-lg font-medium transition-all duration-200 text-center">
                  See How It Works
                </a>
              </div>
              <p className="text-slate-500 text-sm mt-5">No credit card required · 3 free contracts</p>
            </div>
          )}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-t border-b border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-white/5">
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl font-bold text-white mb-2">500+</span>
              <span className="text-sm text-slate-500 font-medium">Contracts Analyzed</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl font-bold text-white mb-2">98%</span>
              <span className="text-sm text-slate-500 font-medium">Accuracy Rate</span>
            </div>
            <div className="flex flex-col items-center text-center px-4 mt-8 md:mt-0">
              <span className="text-3xl font-bold text-white mb-2">&lt; 30 sec</span>
              <span className="text-sm text-slate-500 font-medium">Analysis Time</span>
            </div>
            <div className="flex flex-col items-center text-center px-4 mt-8 md:mt-0">
              <span className="text-3xl font-bold text-white mb-2">256-bit</span>
              <span className="text-sm text-slate-500 font-medium">Encryption</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-indigo-400 text-xs tracking-[0.2em] font-bold uppercase mb-4">Features</h2>
            <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">Everything you need to review contracts confidently</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: ShieldAlert, title: "AI Risk Scoring", desc: "Instantly flag hidden liabilities, non-standard terms, and missing protections before you sign." },
              { icon: BookOpen, title: "Plain English", desc: "Translate complex legalese into clear, simple language anyone can understand." },
              { icon: MessageSquare, title: "Smart Chat", desc: "Ask questions about your contract and get precise answers based directly on the document text." },
              { icon: GitCompare, title: "Compare Contracts", desc: "Upload revisions and instantly spot what was added, removed, or subtly changed." },
              { icon: Bell, title: "Deadline Reminders", desc: "Never miss a renewal or termination window with automated email and SMS alerts." },
              { icon: FileDown, title: "Export Reports", desc: "Generate comprehensive, beautifully formatted PDF reports of your contract analysis." }
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-indigo-500/40 hover:bg-white/[0.07] transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-32 px-6 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">How It Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#0a0f1e] border border-white/10 flex items-center justify-center text-5xl font-bold text-white/20 mb-8 relative z-10">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Upload your PDF</h3>
              <p className="text-slate-400 leading-relaxed max-w-sm">Securely upload any MSA, NDA, or employment contract. Your data is encrypted and kept private.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#0a0f1e] border border-white/10 flex items-center justify-center text-5xl font-bold text-white/20 mb-8 relative z-10">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI analyzes in seconds</h3>
              <p className="text-slate-400 leading-relaxed max-w-sm">Our legal-trained GPT-4o engine scans every clause, flagging risks and summarizing key points.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#0a0f1e] border border-white/10 flex items-center justify-center text-5xl font-bold text-white/20 mb-8 relative z-10">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Review, chat, export</h3>
              <p className="text-slate-400 leading-relaxed max-w-sm">Chat with your document, review the risk score, and export a clean PDF report for your team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#0a0f1e] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span className="text-slate-300 font-medium">© 2025 LexAI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
