"use client";

import { useState } from "react";
import { analyzeWords, WordAnalysis } from "./lib/yun";

const SAMPLE = `桉油
艾香
埃蕾
鹌鹑
安石榴`;

function ToneSpan({ pattern }: { pattern: string }) {
  return (
    <>
      {pattern.split("").map((ch, i) => (
        <span key={i} className={ch === "平" ? "text-blue-600 font-bold" : "text-red-600 font-bold"}>
          {ch}
        </span>
      ))}
    </>
  );
}

function RhymeBadge({ group }: { group: string }) {
  if (!group) return <span className="text-gray-400">—</span>;
  return (
    <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-xs font-semibold">
      {group}韵
    </span>
  );
}

function ResultCards({ results }: { results: WordAnalysis[] }) {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {results.map((r) => (
        <div key={r.index} className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-amber-900">{r.word}</span>
            <RhymeBadge group={r.rhymeGroup} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-500">拼音</span>
            <span className="font-mono text-xs">{r.pinyinStr}</span>
            <span className="text-gray-500">平仄</span>
            <span><ToneSpan pattern={r.tonePattern} /></span>
            <span className="text-gray-500">末字</span>
            <span className="font-mono text-xs">{r.lastPinyin}</span>
            <span className="text-gray-500">声调</span>
            <span>
              <span className={r.lastTone === "平" ? "text-blue-600 font-bold" : "text-red-600 font-bold"}>
                {r.lastTone}
              </span>
            </span>
            <span className="text-gray-500">韵母</span>
            <span className="font-mono">{r.rhymeFinal || "—"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultTable({ results }: { results: WordAnalysis[] }) {
  return (
    <div className="hidden sm:block overflow-x-auto rounded-lg shadow">
      <table className="w-full text-sm border-collapse bg-white">
        <thead>
          <tr className="bg-amber-800 text-white">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">词语</th>
            <th className="px-3 py-2 text-left">字数</th>
            <th className="px-3 py-2 text-left">拼音</th>
            <th className="px-3 py-2 text-left">平仄</th>
            <th className="px-3 py-2 text-left">末字拼音</th>
            <th className="px-3 py-2 text-left">末字声调</th>
            <th className="px-3 py-2 text-left">韵母</th>
            <th className="px-3 py-2 text-left">韵部</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.index} className={i % 2 === 0 ? "bg-amber-50" : "bg-white"}>
              <td className="px-3 py-2 text-amber-600">{r.index}</td>
              <td className="px-3 py-2 font-semibold text-lg">{r.word}</td>
              <td className="px-3 py-2 text-center">{r.length}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.pinyinStr}</td>
              <td className="px-3 py-2"><ToneSpan pattern={r.tonePattern} /></td>
              <td className="px-3 py-2 font-mono text-xs">{r.lastPinyin}</td>
              <td className="px-3 py-2">
                <span className={r.lastTone === "平" ? "text-blue-600 font-bold" : "text-red-600 font-bold"}>
                  {r.lastTone}
                </span>
              </td>
              <td className="px-3 py-2 font-mono">{r.rhymeFinal}</td>
              <td className="px-3 py-2"><RhymeBadge group={r.rhymeGroup} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState(SAMPLE);
  const [results, setResults] = useState<WordAnalysis[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  function handleAnalyze() {
    setResults(analyzeWords(input));
    setAnalyzed(true);
  }

  return (
    <main className="min-h-screen bg-amber-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-amber-900 mb-2">韵析 · Yun Xi</h1>
        <p className="text-center text-amber-700 mb-6 text-sm">
          输入汉字词语（每行一个），分析拼音、平仄与韵部
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <textarea
            className="flex-1 h-40 sm:h-48 p-3 rounded-lg border border-amber-300 bg-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="每行输入一个词语..."
          />
          <div className="flex sm:flex-col justify-center">
            <button
              onClick={handleAnalyze}
              className="w-full sm:w-auto px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 active:bg-amber-900 font-semibold transition-colors"
            >
              分析
            </button>
          </div>
        </div>

        {analyzed && results.length > 0 && (
          <>
            <ResultCards results={results} />
            <ResultTable results={results} />
          </>
        )}

        {analyzed && results.length === 0 && (
          <p className="text-center text-amber-600 mt-4">未找到有效词语，请检查输入。</p>
        )}

        <footer className="mt-8 text-center text-xs text-amber-600">
          韵部参考《平水韵》· 基于 pinyin-pro 拼音库
        </footer>
      </div>
    </main>
  );
}
