import { useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Report() {
  const location = useLocation();
  // const answers = location.state?.answers
  const { answers, user } = location.state || {};
  const navigate = useNavigate();

  console.log("유저 정보:", user);
  console.log("응답 정보:", answers);

  // PDF로 저장할 영역을 참조
  const reportRef = useRef<HTMLDivElement>(null);

  // PDF 다운로드 함수
  const handleDownloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0);
    pdf.save(`${name}님의_리포트.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* PDF 저장 버튼 */}
      <button
        onClick={handleDownloadPDF}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
      >
        PDF로 저장하기
      </button>

      {/* PDF에 저장될 영역 */}
      <div
        ref={reportRef}
        className="bg-white p-6 rounded-lg shadow max-w-md w-full"
      >
        <h1 className="text-2xl font-bold mb-4 text-blue-600">{user?.name}님의 리포트 결과</h1>
        <ul>
        {answers &&
            Object.entries(answers).map(([key, value]) => (
            <li key={key}>
                <strong>{key}:</strong> {String(value)}
            </li>
            ))}
        </ul>
      </div>

      {/* 페이지 이동 버튼 */}
      <button
        onClick={() => navigate("/roomie")}
        className="mt-6 px-4 py-2 bg-zipup-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        매물 확인하기
      </button>
    </div>
  );
}
