"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const [hasMore, setHasMore]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const offsetRef               = useRef(0);
  const sentinelRef             = useRef<HTMLDivElement | null>(null);
  // Keep a stable ref to the current params so the IntersectionObserver closure is always fresh
  const paramsRef               = useRef(params);
  paramsRef.current             = params;

  const pinyinIsExact    = params.pinyin !== "" && /[1-5]/.test(params.pinyin);
  const tonePatternEnabled = !params.word && !pinyinIsExact;
  const pinyinEnabled    = !params.word;

  const set = (key: keyof SearchParams) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setParams((p) => ({ ...p, [key]: e.target.value }));

  const buildQuery = useCallback((p: SearchParams, offset: number) => {
    const q = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => { if (v) q.set(k, v); });
    q.set("offset", String(offset));
    return q.toString();
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    setResults([]);
    offsetRef.current = 0;

    const res  = await fetch(`/api/search?${buildQuery(params, 0)}`);
    const data = await res.json();

    setResults(data.results);
    setTotal(data.total);
    setHasMore(data.hasMore);
    offsetRef.current = data.results.length;
    setLoading(false);
  }, [params, buildQuery]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const res  = await fetch(`/api/search?${buildQuery(paramsRef.current, offsetRef.current)}`);
    const data = await res.json();

    setResults((prev) => [...prev, ...data.results]);
    setHasMore(data.hasMore);
    offsetRef.current += data.results.length;
    setLoadingMore(false);
  }, [loadingMore, hasMore, buildQuery]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleReset = () => {
    setParams(EMPTY);
    setResults([]);
    setTotal(null);
    setHasMore(false);
    setSearched(false);
    offsetRef.current = 0;
  };

  const inputCls = "w-full border border-amber-300 rounded-md px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400";
  const disabledCls = `${inputCls} bg-gray-100 text-gray-400 cursor-not-allowed`;

  return (
    <main className="min-h-screen bg-amber-50 p-4 sm:p-6 text-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">韵析 · 检索</h1>
          <Link href="/analyze" className="text-sm text-amber-700 hover:underline">分析 →</Link>
        </div>

        {/* Search form */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 border border-amber-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div>
              <label className="block text-xs text-gray-500 mb-1">词语</label>
              <input className={inputCls} value={params.word} onChange={set("word")}
                placeholder="输入词语，支持部分匹配" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">字数</label>
              <select className={inputCls} value={params.charCount} onChange={set("charCount")}>
                <option value="">全部</option>
                {CHAR_COUNTS.map((c) => <option key={c} value={c}>{c} 字</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                拼音
                <span className="ml-1 text-gray-400 text-xs">
                  {pinyinEnabled ? "（无声调=模糊匹配，带数字=精确）" : "（词语非空时不可用）"}
                </span>
              </label>
              <input
                className={pinyinEnabled ? inputCls : disabledCls}
                disabled={!pinyinEnabled}
                value={params.pinyin} onChange={set("pinyin")}
                placeholder="如: anyou 或 an1you2"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                平仄
                <span className="ml-1 text-gray-400 text-xs">
                  {tonePatternEnabled ? "（前缀匹配）" : "（词语非空或拼音精确时不可用）"}
                </span>
              </label>
              <input
                className={tonePatternEnabled ? inputCls : disabledCls}
                disabled={!tonePatternEnabled}
                value={params.tonePattern} onChange={set("tonePattern")}
                placeholder="如: 平平仄"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">末字声调</label>
              <select className={inputCls} value={params.lastTone} onChange={set("lastTone")}>
                <option value="">全部</option>
                <option value="平">平</option>
                <option value="仄">仄</option>
                <option value="轻">轻声</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">韵母</label>
              <input className={inputCls} value={params.rhymeFinal} onChange={set("rhymeFinal")}
                placeholder="如: ou, ang" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">韵部（不含韵字）</label>
              <select className={inputCls} value={params.rhymeGroup} onChange={set("rhymeGroup")}>
                <option value="">全部</option>
                {RHYME_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleSearch} disabled={loading}
              className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 active:bg-amber-900 font-semibold transition-colors disabled:opacity-50">
              {loading ? "检索中…" : "检索"}
            </button>
            <button onClick={handleReset}
              className="px-6 py-2 border border-amber-400 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors font-semibold">
              重置
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && !loading && (
          <>
            {total !== null && (
              <p className="text-sm text-amber-700 mb-3">
                共找到 <strong>{total}</strong> 条结果，已加载 <strong>{results.length}</strong> 条
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
                      <tr key={`${r.index}-${i}`} className={i % 2 === 0 ? "bg-amber-50" : "bg-white"}>
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

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-2">
              {loadingMore && <span className="text-sm text-amber-600">加载中…</span>}
            </div>
          </>
        )}

        <footer className="mt-4 text-center text-xs text-amber-600">
          韵部参考《平水韵》· 基于 pinyin-pro 拼音库
        </footer>
      </div>
    </main>
  );
}
