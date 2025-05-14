

type ReportViewInfoProps = {
  dongName: string;
  fullLocation: string;
  userName: string;
  topIndicators: string[];
  index: number;  // 자동으로 pdf-info-1, -2, -3 처리용
  mapReady: boolean; 
};

export default function ReportViewInfo({ dongName, fullLocation, userName, topIndicators, index ,mapReady}: ReportViewInfoProps) {
  const indicatorText = topIndicators.map((item) => `${item}지표`).join(", ");

  // ✅ 더미 데이터 (index별로 다르게 할 수 있음)
  const dongFeatures = ["생활지표", "안전지표", "교통지표"];

  const descriptionTexts: string[] = [
    `${dongName}은 지하철이 지나고, 서울 도심과의 접근성이 우수한 동네입니다.`,
    `${dongName}에는 카페, 편의시설, 식당이 다양하게 분포되어 있습니다.`,
    `${dongName}은 젊은 세대가 선호하는 주거지로, 생활환경이 쾌적합니다.`,
    `현재 ${dongName} 내 다양한 주거시설이 있습니다.`,
  ];

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
        <div
          style={{
            position: "absolute",
            top: "210px",
            left: "55px",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          <span>{userName}</span>
        </div>

        {/* 지도 이미지 삽입 위치 */}
        <div
          style={{
            position: "absolute",
            top: "370px",
            left: "60px",
            width: "360px",
            height: "360px",
            overflow: "hidden",
            backgroundColor: "white",
          }}
        >
          {/* <img
            src={`/icons/report/all_report_view/map_image/${encodeURIComponent(dongName)}_map.png`}
            alt={`${dongName} 위치 지도`}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          /> */}
          {mapReady ? (
            <img
                src={`/icons/report/all_report_view/map_image/${encodeURIComponent(dongName)}_map.png`}
                alt={`${dongName} 지도`}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
          ) : (
            <p>지도를 준비 중입니다...</p> // ✅ 로딩 대체 메시지
          )}
        </div>

        {/* 중요지표 문구 */}
        <div
          style={{
            position: "absolute",
            top: "440px",
            left: "490px",
            width: "240px",
            fontSize: "17px",
            lineHeight: "1.6",
            textAlign: "center",
            color: "#333",
          }}
        >
          <span>{userName}</span> 님의 중요지표인<br />
          <span style={{ fontWeight: "bold", color: "#4c8689" }}>{indicatorText}</span><span>가</span>
          <br />
          특징인 동네를 분석하여 <br />추천해드립니다.
        </div>

        {/* 동 이름 */}
        <div
          style={{
            position: "absolute",
            top: "620px",
            left: "560px",
            fontWeight: "bold",
            fontSize: "17px",
          }}
        >
          {dongName}
        </div>

        {/* 위치 */}
        <div
          style={{
            position: "absolute",
            top: "690px",
            left: "560px",
            fontSize: "17px",
            fontWeight: "bold",
          }}
        >
          {fullLocation}
        </div>

        {/* 동네 주요 특징 */}
        <div style={{ position: "absolute", top: "900px", left: "300px", fontSize: "15px" }}>
          {dongFeatures[0]}
        </div>
        <div style={{ position: "absolute", top: "900px", left: "590px", fontSize: "15px" }}>
          {dongFeatures[1]}
        </div>

        {/* 설명 */}
        <div
          style={{
            position: "absolute",
            top: "935px",
            left: "180px",
            fontSize: "12.5px",
            lineHeight: "1.4",
            width: "565px",
            fontFamily: "Pretendard-Regular",
            color: "#333",
          }}
        >
          {descriptionTexts.map((text: string, idx: number) => (
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
