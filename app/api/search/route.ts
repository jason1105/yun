import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { analyzeWords, WordAnalysis } from "@/app/lib/yun";

// Cache analyzed data at module level (reused across requests in the same worker)
let cachedData: WordAnalysis[] | null = null;

function getData(): WordAnalysis[] {
  if (cachedData) return cachedData;
  const filePath = join(process.cwd(), "word.txt");
  const content = readFileSync(filePath, "utf-8");
  cachedData = analyzeWords(content);
  return cachedData;
}

function stripTones(pinyin: string): string {
  return pinyin.replace(/[1-5]/g, "");
}

const MAX_RESULTS = 200;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const word        = searchParams.get("word")         ?? "";
  const charCount   = searchParams.get("charCount")    ?? "";
  const pinyinQuery = searchParams.get("pinyin")       ?? "";
  const tonePattern = searchParams.get("tonePattern")  ?? "";
  const lastTone    = searchParams.get("lastTone")     ?? "";
  const rhymeFinal  = searchParams.get("rhymeFinal")   ?? "";
  const rhymeGroup  = searchParams.get("rhymeGroup")   ?? "";

  // Must have at least one filter
  if (!word && !charCount && !pinyinQuery && !tonePattern && !lastTone && !rhymeFinal && !rhymeGroup) {
    return NextResponse.json({ total: 0, results: [] });
  }

  const pinyinIsExact = pinyinQuery !== "" && /[1-5]/.test(pinyinQuery);

  let results = getData();

  if (word) {
    results = results.filter((r) => r.word.includes(word));
  }

  if (charCount) {
    if (charCount === "5+") {
      results = results.filter((r) => r.length >= 5);
    } else {
      const n = parseInt(charCount, 10);
      if (!isNaN(n)) results = results.filter((r) => r.length === n);
    }
  }

  // 拼音: only when 词语 is empty
  if (pinyinQuery && !word) {
    if (pinyinIsExact) {
      results = results.filter((r) => r.pinyinStr.includes(pinyinQuery));
    } else {
      // Fuzzy: strip tones from both sides and do substring match
      const q = stripTones(pinyinQuery);
      results = results.filter((r) => stripTones(r.pinyinStr).includes(q));
    }
  }

  // 平仄: only when 词语 is empty AND 拼音 is not exact
  if (tonePattern && !word && !pinyinIsExact) {
    results = results.filter((r) => r.tonePattern.startsWith(tonePattern));
  }

  if (lastTone) {
    results = results.filter((r) => r.lastTone === lastTone);
  }

  if (rhymeFinal) {
    results = results.filter((r) => r.rhymeFinal.includes(rhymeFinal));
  }

  if (rhymeGroup) {
    results = results.filter((r) => r.rhymeGroup === rhymeGroup);
  }

  const total = results.length;
  return NextResponse.json({ total, results: results.slice(0, MAX_RESULTS) });
}
