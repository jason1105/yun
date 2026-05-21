"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { WordAnalysis } from "@/app/lib/yun";

const RHYME_GROUPS = ["麻","豪","皆","波","开","微","尤","寒","文","唐","庚","支","齐","姑"];
const CHAR_COUNTS  = ["1","2","3","4","5+"];

interface SearchParams {
  word: string;
  charCount: string;
  pinyin: string;
  tonePattern: string;
  lastTone: string;
  rhymeFinal: string;
  rhymeGroup: string;
}

const EMPTY: SearchParams = {
  word: "", charCount: "", pinyin: "", tonePattern: "",
  lastTone: "", rhymeFinal: "", rhymeGroup: "",
};

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

export default function SearchPage() {
  const [params, setParams]     = useState<SearchParams>(EMPTY);
  const [results, setResults]   = useState<WordAnalysis[]>([]);
  const [total, setTotal]       = useState<number | null>(null);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  const pinyinIsExact = params.pinyin !== "" && /[1-5]/.test(params.pinyin);
  const tonePatternEnabled = !params.word && !pinyinIsExact;
  const pinyinEnabled = !params.word;

  const set = (key: keyof SearchParams) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setParams((p) => ({ ...p, [key]: e.target.value }));

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    const res = await fetch(`/api/search?${q}`);
    const data = await res.json();
    setResults(data.results);
    setTotal(data.total);
    setLoading(false);
  }, [params]);

  const handleReset = () => {
    setParams(EMPTY);
    setResults([]);
    setTotal(null);
    setSearched(false);
  };

  const inputCls = "w-full border border-amber-300 rounded-md px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400";
  const disabledInputCls = `${inputCls} bg-gray-100 text-gray-400 cursor-not-allowed`;
  const selectCls = `${inputCls}`;

  return (
    <main className="min-h-screen bg-amber-50 p-4 sm:p-6 text-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">韵析 · 检索</h1>
          <Link href="/" className="text-sm text-amber-700 hover:underline">← 返回分析</Link>
        </div>

        {/* Search form */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 border border-amber-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* 词语 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">词语</label>
              <input className={inputCls} value={params.word} onChange={set("word")}
                placeholder="输入词语，支持部分匹配" />
            </div>

            {/* 字数 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">字数</label>
              <select className={selectCls} value={params.charCount} onChange={set("charCount")}>
                <option value="">全部</option>
                {CHAR_COUNTS.map((c) => <option key={c} value={c}>{c} 字</option>)}
              </select>
            </div>

            {/* 拼音 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                拼音
                <span className="ml-1 text-gray-400">
                  {pinyinEnabled ? "（支持模糊：an 匹配 an1/an2/an3/an4）" : "（词语非空时不可用）"}
                </span>
              </label>
              <input
                className={pinyinEnabled ? inputCls : disabledInputCls}
                disabled={!pinyinEnabled}
                value={params.pinyin} onChange={set("pinyin")}
                placeholder="如: anyou 或 an1you2"
              />
            </div>

            {/* 平仄 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                平仄
                <span className="ml-1 text-gray-400">
                  {tonePatternEnabled ? "（前缀匹配，如: 平仄）" : "（词语非空或拼音精确时不可用）"}
                </span>
              </label>
              <input
                className={tonePatternEnabled ? inputCls : disabledInputCls}
                disabled={!tonePatternEnabled}
                value={params.tonePattern} onChange={set("tonePattern")}
                placeholder="如: 平平仄"
              />
            </div>

            {/* 末字声调 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">末字声调</label>
              <select className={selectCls} value={params.lastTone} onChange={set("lastTone")}>
                <option value="">全部</option>
                <option value="平">平</option>
                <option value="仄">仄</option>
                <option value="轻">轻声</option>
              </select>
            </div>

            {/* 韵母 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">韵母</label>
              <input className={inputCls} value={params.rhymeFinal} onChange={set("rhymeFinal")}
                placeholder="如: ou, ang" />
            </div>

            {/* 韵部 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">韵部（不含韵字）</label>
              <select className={selectCls} value={params.rhymeGroup} onChange={set("rhymeGroup")}>
                <option value="">全部</option>
                {RHYME_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 active:bg-amber-900 font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "检索中…" : "检索"}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-amber-400 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors font-semibold"
            >
              重置
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && !loading && (
          <>
            {total !== null && (
              <p className="text-sm text-amber-700 mb-3">
                共找到 <strong>{total}</strong> 条结果
                {total > 200 && <span className="text-gray-500">（最多显示 200 条）</span>}
              </p>
            )}

            {results.length === 0 ? (
              <p className="text-center text-amber-600 mt-8">没有找到匹配的词语</p>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow">
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
                        <td className="px-3 py-2 font-mono text-xs text-gray-900">{r.pinyinStr}</td>
                        <td className="px-3 py-2"><ToneSpan pattern={r.tonePattern} /></td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-900">{r.lastPinyin}</td>
                        <td className="px-3 py-2">
                          <span className={r.lastTone === "平" ? "text-blue-600 font-bold" : "text-red-600 font-bold"}>
                            {r.lastTone}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-900">{r.rhymeFinal}</td>
                        <td className="px-3 py-2"><RhymeBadge group={r.rhymeGroup} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <footer className="mt-8 text-center text-xs text-amber-600">
          韵部参考《平水韵》· 基于 pinyin-pro 拼音库
        </footer>
      </div>
    </main>
  );
}
