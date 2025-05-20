import { useLocation, useNavigate } from "react-router-dom";

// 더미 데이터 정의
const dummyData = {
    "8_indicators": {
        "교통": 50,
        "편의": 43,
        "안전": 25,
        "건강": 41,
        "녹지": 43,
        "생활": 80,
        "놀이": 12,
        "운동": 37,
    },
    "top_indicators": [
        {"main_category": "생활", "sub_category": "도서관"},
        {"main_category": "교통", "sub_category": "따릉이"},
        {"main_category": "편의", "sub_category": "편의점"},
    ],
    "intro_text": [
        "집을 찾으실 때 다양한 부분들을 복합적으로 고려하시겠지만, 집 근처에 카페, 도서관, 주민센터, 반찬가게, 은행 등의 생활시설이 있는지를 중요하게 생각하시는군요. 그 외에도 버스와 따릉이 같은 교통수단이 집 근처에 있는지, 편의점과 다이소 같은 편의시설이 가까운지 등을 신경 쓰시는 스타일이시네요.",
        "실제 내가 살아보면 어떨까에 대해 생각하면서 여러 요소를 꼼꼼하게 확인하고 주거지를 고르는 당신을 위해 안전하면서도 편안함이 있는 동을 추천해드릴게요!",
    ],
    "8_indicator_descriptions": {
        "교통": "지하철은 자주 이용하지 않지만, 버스는 평소 상대적으로 중요하게 생각함. 따릉이는 선호도가 높은 편임, 자주 이용함.",
        "편의": "",
        "안전": "빨래방과 마트는 필요성이 낮지만, 다이소는 평소 중요하게 생각함. 편의점은 자주 이용함.",
        "건강": "",
        "녹지": "소방 관련 기관은 필요성을 느끼지 않지만, 경찰은 상대적으로 중요하게 생각함.",
        "생활": "",
        "놀이": "약국은 필요성을 느끼지 않지만, 한의원은 중요하게 생각하고, 병원은 필수라고 생각함.",
        "운동": "",
    },
    "recommended": [
        {
            "name": "신당동",
            "location": "서울특별시 중구 신당동",
            "strong_indicators": [
                {"main_category": "교통", "sub_category": "지하철"},
                {"main_category": "생활", "sub_category": "도서관"},
            ],
            "description": [
                "신당동은 3호선 약수역과 6호선 청구역, 버티고개역이 가까워 교통이 매우 편리한 동네입니다. 다양한 대중교통 수단이 있어 서울 어디든 쉽게 이동할 수 있습니다.",
                "동네에는 전통시장과 현대적인 카페, 맛집들이 어우러져 있어 생활의 즐거움이 가득합니다. 특히 신당동 떡볶이 골목은 유명한 먹거리로 많은 사람들의 사랑을 받고 있습니다.",
                "주거지로서 안전하고 쾌적한 환경을 제공하며, 다양한 생활 편의시설이 있어 가족 단위 거주자에게도 적합한 동네입니다.",
            ],
        },
        {
            "name": "대치동",
            "location": "서울특별시 강남구 대치동",
            "strong_indicators": [
                {"main_category": "교통", "sub_category": "지하철"},
                {"main_category": "건강", "sub_category": "약국"},
            ],
            "description": [
                "대치동은 3호선 학여울역과 대치역, 2호선 선릉역과 삼성(무역센터)역이 가까워 교통이 매우 편리한 지역입니다. 이곳은 강남의 중심부에 위치하여 다양한 생활 편의시설과 함께 고급 주거지가 많습니다.",
                "주변에는 대치동 학원가가 있어 교육 환경이 뛰어나며, 건강을 위한 다양한 시설도 마련되어 있습니다. 인근에 위치한 한강공원은 산책과 운동을 즐기기에 최적의 장소로, 여유로운 일상을 제공합니다.",
            ],
        },
        {
            "name": "청담동",
            "location": "서울특별시 강남구 청담동",
            "strong_indicators": [
                {"main_category": "놀이", "sub_category": "문화생활공간"},
                {"main_category": "생활", "sub_category": "도서관"},
            ],
            "description": [
                "청담동은 고급스러운 분위기와 세련된 라이프스타일로 유명한 동네로, 다양한 문화와 예술이 어우러져 있습니다. 이곳은 고급 레스토랑, 카페, 부티크가 즐비해 있어 여유로운 일상을 즐기기에 최적의 장소입니다.",
                "청담동에는 유명한 청담사거리와 갤러리들이 있어 예술적인 감성을 느낄 수 있으며, 다양한 이벤트와 전시가 자주 열려 문화생활을 만끽할 수 있습니다. 또한, 근처에 있는 한강공원은 산책이나 운동을 즐기기에 좋은 공간입니다.",
            ],
        },
    ],
}

export default function Report() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // state가 없으면 dummyData 사용
  const data = state?.data || dummyData;
  const recommended: { name: string; location: string; description: string[] }[] = data?.recommended || [];


  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 space-y-6 w-full max-w-screen-sm mx-auto">

      <div className="relative flex flex-col items-center mt-10 animate-bounceLogo">
      
      {/* 🗨️ 말풍선 본체 */}
      <div className="relative bg-white border border-gray-300 rounded-xl px-6 py-4 shadow-md text-sm text-gray-800 text-center w-fit max-w-[300px]">
        <p>너의 설문조사 결과</p>
        <p className="font-bold text-black">
          {recommended?.map((item) => item.name).join(", ")}
        </p>
        <p>이 추천 할만한 동네야!</p>
        <p className="mt-1 text-gray-600">다음 중 필요한 서비스를 클릭해줘</p>
      </div>

      {/* ⭕ 동그란 말풍선 꼬리 (말풍선 아래, ZIPUP 위) */}
      <div className="mt-2 flex flex-col items-center gap-[2px]">
        <div className="w-3 h-3 rounded-full bg-white border border-gray-300 shadow-sm"></div>
        <div className="w-2 h-2 rounded-full bg-white border border-gray-300 shadow-sm"></div>
      </div>

      {/* ZIPUP 로고 */}
      <div className="flex items-center gap-2 mt-5 mb-10">
        <img
          src="/icons/main.png"
          alt="ZIPUP 로고"
          className="w-[70px]"
        />
        <span className="text-2xl font-black text-zipup-600 mt-7">LIVINTERVIEW</span>
      </div>
    </div>   

      {/* <pre className="bg-gray-100 p-4 rounded w-full max-w-md text-left overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre> */}

      <div className="flex flex-row justify-center gap-3 w-full">
        {/* 카드 1 - 매물 확인하기 */}
        <div className="w-[180px] h-[250px] bg-[#e8ebff] rounded-2xl shadow-md flex flex-col items-center justify-between p-4">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-gray-800">매물 확인하기</p>
            <p className="text-[13px] text-gray-600 mt-1">추천 동네 매물 지도 확인</p>
          </div>
          <img src="/icons/report/all_report_view/roomie_button.png" alt="매물 아이콘" className="w-24 h-24 mb-3" />
          <button
            onClick={() => navigate("/roomie")}
            className="text-white rounded-full px-4 py-1 text-sm hover:opacity-90 transition"
            style={{ backgroundColor: "#5040ff" }}
          >
            바로가기
          </button>
        </div>

        {/* 카드 2 - 리포트 보기 */}
        <div className="w-[180px] h-[250px] bg-[#e5f5f6] rounded-2xl shadow-md flex flex-col items-center justify-between p-4">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-gray-800">삶권분석 리포트</p>
            <p className="text-[13px] text-gray-600 mt-1">추천 동네 핵심 정보 보기</p>
          </div>
          <img src="/icons/report/all_report_view/homie_button.png" alt="리포트 아이콘" className="w-24 h-24 mb-3" />
          <button
            onClick={() => navigate("/report/view", { state: { data } })}
            className="text-white rounded-full px-4 py-1 text-sm hover:opacity-90 transition"
            style={{ backgroundColor: "#00bfa5" }}
          >
            바로가기
          </button>
        </div>
      
      </div>
    </div>
  );
}