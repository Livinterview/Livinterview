import React from "react";

// ✅ props 타입 정의
interface ReportViewResultProps {
  userName: string;
  topIndicators: string[];
  introText: string[];
  scores: Record<string, number>;
  eightIndicatorDescriptions: Record<string, string>;  // ✅ 수정됨
}

export default function ReportViewResult({
  userName,
  topIndicators,
  introText, 
  scores,
  eightIndicatorDescriptions, 
}: ReportViewResultProps) {
  const indicatorImageMap: Record<string, string> = {
    생활: "life",
    안전: "safety",
    교통: "transfer",
    편의: "convenience",
    건강: "health",
    녹지: "green",
    놀이: "play",
    운동: "workout",
  };

  return (
    <div className="flex flex-col items-start w-[794px] mt-12">
      <span className="text-sm text-gray-500 font-medium mb-1">3 페이지</span>

      <div
        id="pdf-result"
        style={{
          width: "794px",
          height: "1123px",
          backgroundImage: "url('/icons/report/all_report_view/03_result.jpg')",
          backgroundSize: "100% 100%",
          backgroundPosition: "top left",
          position: "relative",
          boxShadow: "0 0 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* 🧑 사용자 이름 */}
        <div style={{
          position: "absolute",
          top: "192px",
          left: "540px",
          fontSize: "20px",
          fontWeight: "bold",
          fontFamily: "Pretendard-Regular"
        }}>
          <span style={{ color: "black" }}>{userName}</span>
          <span style={{ color: "#4c8689" }}>  님의 삶권분석</span>
        </div>

        {/* 📌 중요 지표 텍스트 */}
        <div
          style={{
            position: "absolute",
            top: "268px",
            left: "50px",
            display: "flex",
            alignItems: "center",
            fontSize: "18px",
            color: "#4c8689",
            gap: "6px",
            lineHeight: "1.5",
            fontFamily: "Pretendard-Regular",
          }}
        >
          <span style={{ fontWeight: "bold", color: "black" }}>{userName}</span>
          <span>님은 거주지를 선택하실 때,</span>
          {topIndicators.map((indicator, idx) => (
            <span key={idx} style={{ fontWeight: "bold", color: "black" }}>{indicator}</span>
          ))}
          <span>부분을 중요하게 생각하시네요.</span>
        </div>

        {/* 🖼️ 중요 지표 아이콘 */}
        <div style={{ position: "relative", width: "794px", height: "700px" }}>
          {topIndicators.map((indicator, idx) => {
            const folderName = indicatorImageMap[indicator];
            const imagePath = `/icons/report/${folderName}/0.png`;

            return (
              <div key={idx}>
                <img
                  src={imagePath}
                  alt={`${indicator} 이미지`}
                  crossOrigin="anonymous"
                  style={{
                    position: "absolute",
                    top: "312px",
                    left: `${65 + idx * 240}px`,
                    width: "180px",
                    height: "180px",
                    objectFit: "contain",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "509px",
                    left: `${100 + idx * 240}px`,
                    fontSize: "23px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  {indicator} 지표
                </div>
              </div>
            );
          })}
        </div>

        {/* 📌 설명 텍스트 */}
        <div
          style={{
            position: "absolute",
            top: "580px",
            left: "29px",
            fontFamily: "Pretendard-Regular",
            fontSize: "14px",
            color: "#333",
            lineHeight: "1.6",
            width: "720px",
            boxSizing: "border-box",
          }}
        >
          {introText.map((text, idx) => (
            <div key={idx} style={{ display: "flex", marginBottom: "5px" }}>
              <span style={{ color: "#0E6D62", fontWeight: "bold", marginRight: "8px" }}>●</span>
              <p style={{ margin: 0, padding: 0 }}>{text}</p>
            </div>
          ))}
        </div>

        {/* 📊 하단 점수표 */}
        <div style={{ position: "absolute", top: "710px", left: "29px", fontFamily: "Pretendard-Regular", fontSize: "13px", width: "720px", maxHeight: "380px", overflow: "hidden",  boxSizing: "border-box" }}>
          <div style={{ backgroundColor: "#4c8689", color: "white", padding: "5px 12px", fontSize: "15px", lineHeight: "1.6", whiteSpace: "nowrap", width: "231px" }}>
            <span style={{ fontWeight: "bold", fontSize: "18px" }}>{userName}</span> 님의 8가지 지표 분석
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ backgroundColor: "#E9F0EF", color: "#333", fontSize: "15px" }}>
                <th style={{ padding: "5px", border: "1px solid #2D7F7F", width: "50px", textAlign: "center", color: "#4c8689", backgroundColor: "#d4e4e5" }}>지표</th>
                <th style={{ padding: "5px", border: "1px solid #2D7F7F", width: "180px", textAlign: "center", color: "#4c8689" }}>중요도</th>
                <th style={{ padding: "5px", border: "1px solid #2D7F7F", textAlign: "center", color: "#4c8689" }}>설명</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scores as Record<string, number>).map(([label, score]) => (
                <tr key={label}>
                  <td style={{ padding: "4px", border: "1px solid #2D7F7F", fontWeight: "bold", backgroundColor: "#d4e4e5", textAlign: "center", color: "#4c8689", fontSize: "15px" }}>{label}</td>
                  <td style={{ padding: "4px", border: "1px solid #2D7F7F", backgroundColor: "white", color: "#0E6D62", fontSize: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "13px", justifyContent: "center" }}>
                      <span style={{ fontWeight: 600 }} >{score}</span>
                      <div style={{ width: "130px", backgroundColor: "#E5E7EB", height: "14px", borderRadius: "6px" }}>
                        <div style={{ width: `${score}%`, height: "100%", backgroundColor: "#0E6D62", borderRadius: "6px" }} />
                      </div>
                    </div>
                  </td>
                  <td style={{
                    padding: "4px",
                    border: "1px solid #2D7F7F",
                    lineHeight: "1.4",
                    backgroundColor: "white",
                    textAlign: "left",           
                    wordBreak: "break-word",          
                    overflow: "hidden",      
                  }}>
                    {eightIndicatorDescriptions[label] || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
