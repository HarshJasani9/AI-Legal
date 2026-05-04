"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWithContract({ contractId }: { contractId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { getToken } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    
    // Optimistically add user message to UI
    const newHistory = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const token = await getToken();
      
      const res = await fetch(`http://localhost:3001/api/contracts/${contractId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question: userMsg,
          // Only send the last 6 messages to provide conversational context without blowing up tokens
          history: messages.slice(-6)
        })
      });

      if (!res.body) throw new Error("No response body");
      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      // Inject an empty assistant message that we will progressively update
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      let fullText = "";

      // Stream the response chunks directly to the UI
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].content = fullText;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered a server error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-gray-800/40 rounded-2xl border border-gray-700/50 shadow-inner overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center space-x-3 shadow-md z-10">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
          <h4 className="font-bold text-gray-100">Contract AI Assistant</h4>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs text-green-400 font-medium">Online &middot; RAG Vector Search Enabled</p>
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-gray-900/30">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60 mt-10">
            <svg className="w-20 h-20 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <p className="text-gray-300 font-semibold text-lg mb-1">Ask me anything!</p>
              <p className="text-gray-400 text-sm max-w-[250px] leading-relaxed">
                I have memorized this exact contract. Ask about dates, liabilities, or specific terms.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-blue-900/20' 
                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-gray-800 text-gray-400 rounded-2xl rounded-bl-none p-4 w-20 flex space-x-2 items-center justify-center h-12 shadow-sm border border-gray-700">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-gray-900 border-t border-gray-800 z-10">
        <form onSubmit={sendMessage} className="flex relative items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. What is the penalty for early termination?"
            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-5 py-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner pr-16 transition-all"
            disabled={isTyping}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white p-2.5 rounded-lg transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
