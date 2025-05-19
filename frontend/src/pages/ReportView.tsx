import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface RecommendedItem {
  name: string;
  location: string;
  description: string[];
  strong_indicators: { main_category: string; sub_category: string }[]; 
}


// 분리된 페이지
import ReportViewCover from "./ReportViewCover";
import ReportViewGuide from "./ReportViewGuide";
import ReportViewResult from "./ReportViewResult";
import ReportViewInfo from "./ReportViewInfo";
import ReportViewLast from "./ReportViewLast";

export default function ReportView() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🔐 사용자 정보 세션에서 가져오기
  const storedUser = sessionStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userName = parsedUser?.name || "박병준";
  

  // 📋 전체 리포트 데이터 추출
  const data = location.state?.data;

  // 개별 변수로 분리
  const scores = data?.["8_indicators"] ?? {};
  const topIndicators = data?.top_indicators ?? [];
  const introText = data?.intro_text ?? [];
  const eightIndicatorDescriptions = data?.["8_indicator_descriptions"] ?? {};

  const recommended = data?.recommended ?? [];

  const reportRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  // 지도 생성 요청 (추천 동네 기준)
  useEffect(() => {
    const generateAllMaps = async () => {
      let successCount = 0;
      for (const item of recommended) {
        const fullLocation = item.location;
        try {
          const res = await fetch("http://localhost:8000/generate-map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_location: fullLocation }),
          });

          if (!res.ok) {
            const error = await res.json();
            console.error("❌ 지도 생성 실패:", fullLocation, error);
            continue;
          }

          console.log("✅ 지도 생성 완료:", fullLocation);
          successCount += 1;
        } catch (error) {
          console.error("❌ 네트워크 오류:", fullLocation, error);
        }
      }

      if (successCount === recommended.length) {
        setMapReady(true);
      }
    };

    if (recommended.length > 0) {
      generateAllMaps();
    }
  }, [recommended]);

  // 📄 PDF 다운로드
  const handleDownloadPDF = async () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [794, 1123] });

    const pages = [
      "pdf-cover",
      "pdf-guide",
      "pdf-result",
      ...recommended.map((_: RecommendedItem, idx: number) => `pdf-info-${idx}`),
      "pdf-last"
    ];

    for (let i = 0; i < pages.length; i++) {
      const el = document.getElementById(pages[i]);
      if (!el) continue;
      if (i > 0) pdf.addPage();

      await document.fonts.ready;
      await new Promise((res) => setTimeout(res, 200));

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });

      pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 794, 1123);
    }

    pdf.save("homie_report.pdf");
  };

  return (
    <div id="report-view-wrapper" className="min-h-screen flex flex-col items-center bg-gray-100 py-12 px-4">
      {/* 상단 정렬 라인 – w-[794px] 기준 */}
      <div className="w-[794px] mx-auto relative mb-6">

        {/* 가운데 정렬된 타이틀 */}
        <div className="flex items-center justify-center gap-x-2">
          <img
            src="/icons/main.png"
            alt="ZIPUP 로고"
            className="w-[32px] h-auto" // ← 아이콘 느낌 유지
          />
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2E3D86]">
            리포트 상세 보기
          </h1>
        </div>

        {/* 오른쪽 PDF 버튼 – 살짝 아래로 내림 */}
        <button
          onClick={handleDownloadPDF}
          className="absolute right-8 top-[80px] px-4 py-2 bg-[#2E3D86] text-white text-sm font-medium rounded-lg shadow hover:bg-[#1f2b63] transition print:hidden"
        >
          📄 PDF 다운로드
        </button>
      </div>
      {/* 리포트 전체 페이지 (A4 비율 유지) */}
      <div ref={reportRef} id="report-page" className="flex flex-col gap-0">
        <ReportViewCover />
        <ReportViewGuide />
        <ReportViewResult 
          userName={userName} 
          topIndicators={topIndicators} 
          introText = {introText}
          scores={scores} 
          eightIndicatorDescriptions={eightIndicatorDescriptions} 
        />

        {/* 추천 동네 반복 렌더링 */}
        {recommended.map((item: RecommendedItem, idx: number) => (
          <ReportViewInfo
            key={idx}
            index={idx}
            dongName={item.name}
            fullLocation={item.location}
            userName={userName}
            topIndicators={topIndicators}
            mapReady={mapReady}
            description={item.description}
            strongIndicators={item.strong_indicators} 
          />
        ))}

        <ReportViewLast />
      </div>

      {/* 결과 요약으로 돌아가기 */}
      <button
        onClick={() => navigate("/report", { state: { data } })}
        className="mt-8 px-6 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        🔙 뒤로 돌아가기
      </button>
    </div>
  );
}