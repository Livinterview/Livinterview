// src/pages/HistoryPage.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import BottomTabBar from "../components/BottomTabBar";

/* ---------- 타입 ---------- */
type Indicator =
  | "교통"
  | "편의"
  | "안전"
  | "건강"
  | "녹지"
  | "생활"
  | "놀이"
  | "운동";

interface IndicatorPair {
  main_category: Indicator;
  sub_category: string;
}

interface HistoryItem {
  created_at?: string; // ← 추가
  "8_indicators": Record<Indicator, number>;
  top_indicators: IndicatorPair[];
  intro_text: string[];
  "8_indicator_discriptions": Record<Indicator, string>;
  recommended: {
    name: string;
    location: string;
    strong_indicators: IndicatorPair[];
    description: string[];
  }[];
}

/* ---------- 그래프 ---------- */
const indicatorOrder: Indicator[] = [
  "교통",
  "편의",
  "안전",
  "건강",
  "녹지",
  "생활",
  "놀이",
  "운동",
];

function IndicatorBarGraph({ data }: { data: Record<Indicator, number> }) {
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {indicatorOrder.map((k) => (
        <div
          key={k}
          className="flex-1 flex flex-col items-center h-full"
          title={`${k}: ${data[k] ?? 0}%`}
        >
          <div className="relative w-5 h-full bg-gray-200 rounded">
            <div
              className="absolute bottom-0 left-0 right-0 bg-purple-500 rounded-t"
              style={{ height: `${data[k] ?? 0}%` }}
            />
          </div>
          <span className="mt-1 text-[11px] md:text-xs select-none">{k}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- 페이지 ---------- */
export default function HistoryPage() {
  const { state } = useLocation() as { state?: { histories?: HistoryItem[] } };
  const navigate = useNavigate();
  const histories: HistoryItem[] = useMemo(
    () => state?.histories ?? [],
    [state]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ----- 제목 ----- */}
      <header className="p-4 border-b text-xl font-bold text-center">
        히스토리
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {histories.length === 0 ? (
          <p className="text-center text-gray-400">
            저장된 히스토리가 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {histories.map((h, idx) => {
              const dongNames =
                h.recommended
                  .slice(0, 3)
                  .map((r) => r.name)
                  .join(", ") + (h.recommended.length > 3 ? "…" : "");
              const dateStr = h.created_at
                ? new Date(h.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : "";

              return (
                <div
                  key={idx}
                  className="w-full border rounded-xl shadow hover:shadow-lg transition cursor-pointer p-6"
                  onClick={() =>
                    navigate("/report/view", { state: { history: h } })
                  }
                >
                  {/* 동 이름 + 날짜 */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-semibold text-purple-600">
                      {dongNames}
                    </span>
                    <span className="text-xs text-gray-400">{dateStr}</span>
                  </div>

                  <IndicatorBarGraph data={h["8_indicators"]} />

                  {/* top indicator 뱃지 */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {h.top_indicators.map((tag, i) => (
                      <span
                        key={`${tag.main_category}-${tag.sub_category}-${i}`}
                        className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full"
                      >
                        {tag.main_category}/{tag.sub_category}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomTabBar />
    </div>
  );
}
