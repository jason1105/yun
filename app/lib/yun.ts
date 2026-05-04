import { pinyin } from "pinyin-pro";

const RHYME_CH = ["麻", "豪", "皆", "波", "开", "微", "尤", "寒", "文", "唐", "庚", "支", "齐", "姑"];

const RHYME: string[][] = [
  ["ua", "ia", "a"],
  ["iao", "ao"],
  ["ie", "üe"],
  ["uo", "o", "e"],
  ["uai", "ai"],
  ["uei", "ei", "ui"],
  ["iou", "ou", "iu"],
  ["ian", "uan", "üan", "an"],
  ["ien", "uen", "üen", "en", "in", "un", "ün"],
  ["iang", "uang", "ang"],
  ["ieng", "ueng", "iong", "eng", "ing", "ong"],
  ["zhi", "chi", "shi"],
  ["i", "er", "ü"],
  ["u"],
];

export interface WordAnalysis {
  index: number;
  word: string;
  length: number;
  pinyinStr: string;
  tonePattern: string;
  lastPinyin: string;
  lastTone: string;
  rhymeFinal: string;
  rhymeGroup: string;
}

function getTone(py: string): string {
  // pinyin-pro returns pinyin with tone number at end like "an1", or with accent marks
  // We use the "num" format: tone is the last character digit
  const toneChar = py[py.length - 1];
  const toneNum = parseInt(toneChar);
  if (isNaN(toneNum) || toneNum === 5) return "轻"; // neutral tone
  return toneNum <= 2 ? "平" : "仄";
}

function matchRhyme(pinyinNoTone: string): { final: string; group: string } {
  for (let i = 0; i < RHYME_CH.length; i++) {
    for (const r of RHYME[i]) {
      if (pinyinNoTone.endsWith(r)) {
        return { final: r, group: RHYME_CH[i] };
      }
    }
  }
  return { final: "", group: "" };
}

export function analyzeWords(input: string): WordAnalysis[] {
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: WordAnalysis[] = [];

  lines.forEach((word, idx) => {
    // Get pinyin with tone numbers for each character
    const pinyinArr = pinyin(word, { toneType: "num", type: "array", nonZh: "consecutive" }) as string[];

    const pinyinStr = pinyinArr.join("");
    const tonePattern = pinyinArr
      .map((py) => {
        const last = py[py.length - 1];
        return /[1-4]/.test(last) ? getTone(py) : "";
      })
      .join("");

    const lastPy = pinyinArr[pinyinArr.length - 1] ?? "";
    const lastTone = getTone(lastPy);

    // Strip tone number for rhyme matching
    const lastPyNoTone = lastPy.replace(/[1-5]$/, "");
    const { final, group } = matchRhyme(lastPyNoTone);

    results.push({
      index: idx + 1,
      word,
      length: word.length,
      pinyinStr,
      tonePattern,
      lastPinyin: lastPy,
      lastTone,
      rhymeFinal: final,
      rhymeGroup: group,
    });
  });

  return results;
}
