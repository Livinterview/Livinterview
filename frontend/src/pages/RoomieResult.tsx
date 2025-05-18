import { useLocation, useNavigate } from "react-router-dom";

export default function RoomieResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const backendBaseUrl = "http://localhost:8000";

  const {
    originalImage = localStorage.getItem("originalImage"),
    generatedImage = localStorage.getItem("generatedImage"),
    title,
  } = location.state || {};

  // 경로 보정
  const resolvedOriginal = originalImage?.startsWith("/")
    ? backendBaseUrl + originalImage
    : originalImage;

  const resolvedGenerated = generatedImage?.startsWith("/")
    ? backendBaseUrl + generatedImage
    : generatedImage;

  console.log("generatedImage:", generatedImage);

  const defaultOriginal = "/icons/images.jpg";
  const defaultGenerated = "/icons/generate-image.png";

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
        <h1 className="text-2xl font-bold text-center mb-4">Roomie 추천 인테리어</h1>

        {/* 원본 사진 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">🏠 Before</h2>
          <img
            src={resolvedOriginal || defaultOriginal}
            alt="기존 방"
            className="w-full rounded-lg shadow object-cover"
          />
        </div>

        {/* 생성된 인테리어 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">🎨 After</h2>
          <img
            src={resolvedGenerated || defaultGenerated}
            alt="생성된 인테리어"
            className="w-full rounded-lg shadow object-cover"
          />
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => navigate("/roomie")}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full text-sm"
          >
            홈으로 가기
          </button>
          <button
            onClick={() => downloadImage(generatedImage || defaultGenerated, "roomie-interior.png")}
            className="px-4 py-2 bg-zipup-600 hover:bg-blue-700 text-white rounded-full text-sm"
          >
            다운로드
          </button>
        </div>
      </div>
    </div>
  )
}