type ReportViewInfoProps = {
  dongName: string;
  fullLocation: string;
  userName: string;
  topIndicators: string[];
  index: number;  // 자동으로 pdf-info-1, -2, -3 처리용
  mapReady: boolean; 
  description: string[];
};


export default function ReportViewInfo({
  dongName,
  fullLocation,
  userName,
  topIndicators,
  index,
  mapReady,
  description,  
}: ReportViewInfoProps) {
  const indicatorText = topIndicators.map((item) => `${item}지표`).join(", ");

  return (
    <div className="flex flex-col items-start w-[794px] min-w-[794px] mt-12">
      <span className="text-sm text-gray-500 font-medium mb-1">{index + 4} 페이지</span>

      <div
        id={`pdf-info-${index}`}
        className="relative"
        style={{
          width: "794px",
          height: "1123px",
          backgroundImage: `url('/icons/report/all_report_view/04_information.jpg')`,
          backgroundSize: "100% 100%",
          backgroundPosition: "top left",
          boxShadow: "0 0 8px rgba(0,0,0,0.1)",
          padding: "80px 60px",
          boxSizing: "border-box",
          position: "relative",
          fontFamily: "Pretendard-Regular",
        }}
      >
        {/* 사용자 이름 */}
        <div style={{ position: "absolute", top: "210px", left: "55px", fontSize: "18px", fontWeight: "bold" }}>
          <span>{userName}</span>
        </div>

        {/* 지도 */}
        <div style={{
          position: "absolute",
          top: "370px",
          left: "60px",
          width: "360px",
          height: "360px",
          overflow: "hidden",
          backgroundColor: "white",
          // border: "2px dashed red",
        }}>
          {mapReady ? (
            <img
              src={`/icons/report/all_report_view/map_image/${encodeURIComponent(dongName)}_map.png`}
              alt={`${dongName} 지도`}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : (
            <p>지도를 준비 중입니다...</p>
          )}
        </div>

        {/* 중요지표 텍스트 */}
        <div style={{
          position: "absolute",
          top: "440px",
          left: "490px",
          width: "240px",
          fontSize: "17px",
          lineHeight: "1.6",
          textAlign: "center",
          color: "#333",
        }}>
          <span>{userName}</span> 님의 중요지표인<br />
          <span style={{ fontWeight: "bold", color: "#4c8689" }}>{indicatorText}</span><span>가</span><br />
          특징인 동네를 분석하여 <br />추천해드립니다.
        </div>

        {/* 동 이름 */}
        <div style={{ position: "absolute", top: "620px", left: "555px", fontWeight: "bold", fontSize: "17px" }}>
          {dongName}
        </div>

        {/* 위치 */}
        <div style={{ position: "absolute", top: "690px", left: "555px", fontSize: "17px", fontWeight: "bold" }}>
          {fullLocation}
        </div>

        {/* 설명 텍스트 */}
        <div
          style={{
            position: "absolute",
            top: "945px",
            left: "180px",
            fontSize: "13px",
            lineHeight: "1.4",
            width: "565px",
            fontFamily: "Pretendard-Regular",
            color: "#333",
          }}
        >
          {description.map((text, idx) => (
            <div key={idx} style={{ display: "flex", marginBottom: "5px" }}>
              <span style={{ color: "#0E6D62", fontWeight: "bold", marginRight: "6px" }}>●</span>
              <p style={{ margin: 0, padding: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
