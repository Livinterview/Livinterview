export default function ReportViewLast() {
  return (
    <div className="flex flex-col items-start w-[794px] mt-12">
      <span className="text-sm text-gray-500 font-medium mb-1">7 페이지</span>

      <div
        id="pdf-last"
        style={{
          width: "794px",
          height: "1123px",
          backgroundImage: "url('/icons/report/all_report_view/05_last.jpg')",
          backgroundSize: "100% 100%",
          backgroundPosition: "top left",
          boxShadow: "0 0 8px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 필요하면 여기 안에 내용 추가 가능 */}
      </div>
    </div>
  );
}
