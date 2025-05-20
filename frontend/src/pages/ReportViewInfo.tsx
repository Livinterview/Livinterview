type ReportViewInfoProps = {
  dongName: string;
  fullLocation: string;
  userName: string;
  topIndicators: { main_category: string; sub_category: string }[];
  index: number;
  mapReady: boolean;
  description: string[];
  strongIndicators: { main_category: string; sub_category: string }[];
};


// ✅ 1. main_category → 폴더명
const mainCategoryToFolder: Record<string, string> = {
  생활: "life",
  교통: "transfer",
  편의: "convenience",
  건강: "health",
  안전: "safety",
  녹지: "green",
  놀이: "play",
  운동: "workout",
};

// ✅ 2. sub_category → 파일명
const subCategoryToFile: Record<string, string> = {
  //생활
  카페: "cafe",
  도서관: "library",
  주민센터: "center",
  반찬가게: "sidedish",
  은행: "bank",
  //건강
  병원: "hospital",
  한의원: "hospital",
  약국: "pharmacy",
  //교통
  따릉이: "bicycle",
  지하철: "subway",
  버스: "bus",
  // 편의
  편의점: "convenience-store",
  다이소: "daiso",
  빨래방: "washing-machine",
  마트: "bigmarket",
  //놀이
  노래방: "karaoke",
  PC방: "pcroom",
  영화관: "movietheater",
  문화생활공간: "cultural-life",
  //운동
  헬스장: "healthcenter",
  공공체육시설: "publicworkoutcenter",
  //안전
  경찰: "police",
  소방: "firefight",
  //녹지
  공원: "park",
  산: "mountain",
  강: "river",
  하천: "stream",
};

// 경로 생성 함수
const getImagePath = (main: string, sub: string): string => {
  const folder = mainCategoryToFolder[main] || "default";
  const file = subCategoryToFile[sub] || "default";
  return `/icons/report/${folder}/${file}.png`;
};


export default function ReportViewInfo({
  dongName,
  fullLocation,
  userName,
  topIndicators,
  index,
  mapReady,
  description,
  strongIndicators,
}: ReportViewInfoProps) {
  const indicatorText = topIndicators.map((item) => `${item.main_category} 지표`).join(", ");



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

        {/* 🧭 동네 주요 특징 아이콘 */} 
          <div style={{
            position: "absolute",
            top: "750px",
            left: "240px",
            display: "flex",
            flexDirection: "row",
            gap: "170px",
          }}>
            {strongIndicators.map((indicator: { main_category: string; sub_category: string }, idx) => {
              const folder = mainCategoryToFolder[indicator.main_category];
              const file = subCategoryToFile[indicator.sub_category];
              const imagePath = `/icons/report/${folder}/${file}.png`;

              return (
                <div key={idx} style={{ textAlign: "center" }}>
                  <img
                    src={imagePath}
                    alt={indicator.sub_category}
                    style={{
                      width: "125px",
                      height: "125px",
                      objectFit: "contain",
                      marginBottom: "22px"
                    }}
                  />
                  <div style={{ fontSize: "18px", fontWeight: 600, color: "#4c8689" }}>
                    {indicator.main_category}
                  </div>
                </div>
              );
            })}
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