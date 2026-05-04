"use client";

import { useState } from "react";

interface Clause {
  title: string;
  text: string;
  plainEnglish: string;
  risk: "low" | "medium" | "high";
  reason: string;
}

interface ClauseListProps {
  clauses: Clause[];
}

type FilterType = "all" | "high" | "medium";

const riskWeight = { high: 3, medium: 2, low: 1 };

export default function ClauseList({ clauses }: ClauseListProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  // Filter and sort the clauses by risk level descending
  const displayClauses = clauses
    .filter((clause) => {
      if (filter === "high") return clause.risk === "high";
      if (filter === "medium") return clause.risk === "medium";
      return true; // all
    })
    .sort((a, b) => riskWeight[b.risk] - riskWeight[a.risk]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header and Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-800 gap-4">
        <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          Extracted Clauses
        </h3>
        
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700/50">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "all" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("high")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "high" ? "bg-red-500/20 text-red-400 shadow border border-red-500/30" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            High Risk
          </button>
          <button
            onClick={() => setFilter("medium")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "medium" ? "bg-amber-500/20 text-amber-400 shadow border border-amber-500/30" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Medium Risk
          </button>
        </div>
      </div>

      {/* Empty State */}
      {displayClauses.length === 0 && (
        <div className="py-12 text-center text-gray-500 border border-dashed border-gray-700 rounded-2xl">
          No clauses found matching the '{filter}' filter.
        </div>
      )}

      {/* Clause Cards */}
      {displayClauses.map((clause, index) => (
        <div key={index} className="bg-gray-800/40 rounded-2xl border border-gray-700/50 p-6 shadow-sm hover:border-gray-600 hover:bg-gray-800/60 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-bold text-xl text-gray-100">{clause.title}</h4>
            <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider shadow-sm ${
              clause.risk === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              clause.risk === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {clause.risk} Risk
            </span>
          </div>
          
          <p className="text-base text-gray-300 mb-4 leading-relaxed">{clause.plainEnglish}</p>
          
          <div className="bg-gray-950/50 p-4 rounded-xl text-sm text-gray-400 italic border-l-4 border-indigo-500 mb-4">
            <span className="font-semibold text-gray-300 not-italic mr-2">Risk Rationale:</span>
            {clause.reason}
          </div>
          
          <details className="cursor-pointer group">
            <summary className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors select-none outline-none">
              View original legal text
            </summary>
            <p className="mt-3 text-xs text-gray-500 font-mono bg-gray-950 p-4 rounded-xl border border-gray-800 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {clause.text}
            </p>
          </details>
        </div>
      ))}
    </div>
  );
}
