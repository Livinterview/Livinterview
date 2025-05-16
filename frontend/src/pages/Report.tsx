import { useLocation, useNavigate } from "react-router-dom";

export default function Report() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const data = state?.data;
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

      <pre className="bg-gray-100 p-4 rounded w-full max-w-md text-left overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>

      <div className="flex flex-row justify-center gap-3 w-full">
        {/* 카드 1 - 매물 확인하기 */}
        <div className="w-[170px] h-[250px] bg-[#e8ebff] rounded-2xl shadow-md flex flex-col items-center justify-between p-4">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-gray-800">매물 확인하기</p>
            <p className="text-sm text-gray-600 mt-1">추천 동네 매물 지도 확인</p>
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
        <div className="w-[170px] h-[250px] bg-[#e5f5f6] rounded-2xl shadow-md flex flex-col items-center justify-between p-4">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-gray-800">삶권분석 리포트</p>
            <p className="text-sm text-gray-600 mt-1">추천 동네 핵심 정보 보기</p>
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