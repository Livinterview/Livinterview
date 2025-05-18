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

// top_indicators·strong_indicators가 main+sub 쌍일 수 있으므로 별도 타입
interface IndicatorPair {
  main_category: Indicator;
  sub_category: string;
}

interface HistoryItem {
  "8_indicators": Record<Indicator, number>;
  top_indicators: IndicatorPair[]; // ← 객체 배열로 변경될 수 있음
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

/* ---------- 그래프 컴포넌트 ---------- */
function IndicatorBarGraph({ data }: { data: Record<Indicator, number> }) {
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {indicatorOrder.map((k) => {
        const v = data[k] ?? 0;
        return (
          <div
            key={k}
            className="flex-1 flex flex-col items-center h-full"
            title={`${k}: ${v}%`}
          >
            <div className="relative w-5 h-full bg-gray-200 rounded">
              <div
                className="absolute bottom-0 left-0 right-0 bg-purple-500 rounded-t"
                style={{ height: `${v}%` }}
              />
            </div>
            <span className="mt-1 text-[11px] md:text-xs select-none">{k}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 페이지 ---------- */
export default function HistoryPage() {
  // useLocation 으로 전달받은 histories
  const { state } = useLocation() as { state?: { histories?: HistoryItem[] } };
  const navigate = useNavigate();

  /**
   * useMemo는 전달된 state.histories 값이 바뀌지 않는 한
   * histories 배열 재계산을 건너뛰어 렌더링 성능을 지켜주는 React 훅입니다.
   * (여기서는 큰 차이는 없지만, 빈 상태와 정상 데이터를 구분하기 위해 사용)
   */
  const histories: HistoryItem[] = useMemo(
    () => state?.histories ?? [],
    [state]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {histories.length === 0 ? (
          <p className="text-center text-gray-400">
            저장된 히스토리가 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {histories.map((h, idx) => (
              <div
                key={idx}
                className="w-full border rounded-xl shadow hover:shadow-lg transition cursor-pointer p-6"
                onClick={() =>
                  navigate("/report/view", { state: { history: h } })
                }
              >
                {/* 8개 지표 그래프 */}
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
            ))}
          </div>
        )}
      </main>

      <BottomTabBar />
    </div>
  );
}
