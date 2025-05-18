import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchQna } from "../api/fetchQna";
import { Question } from "../types/question";
import SurveyRenderer from "../components/SurveyRenderer";
import ProgressBar from "../components/ProgressBar";
import BackButton from "../components/BackButton";
import HomeButton from "../components/HomeButton";

function SurveyForm() {
  // 현재 질문 index (0부터 시작)
  const [index, setIndex] = useState(0);
  // 사용자 응답 저장 객체 (key: 질문 id, value: 선택값 또는 복수 키)
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  // (1) 마지막 질문 마치고 로딩 상태 추가
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    const load = async () => {
      const data = await fetchQna();
      setQuestions(data);
    };
    load();
  }, []);

  // 현재 질문 데이터
  const current = questions[index];
  const navigate = useNavigate();


  // (2) 로딩 중일 때 별도 UI 렌더링
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-6"></div>
        <p className="text-lg font-semibold text-gray-800 mb-2">삶권 분석 서비스를 가동 중입니다...</p>
        <p className="text-sm text-gray-500">잠시만 기다려 주세요 🙏</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>불러오는 중...</p>
      </div>
    );
  }

  // 다음 질문 or 완료 처리
  // (1) handleAnswer를 async로 선언
  const handleAnswer = async (value: any) => {
    // --- 기존 유효성 검사, answers 저장 로직 동일 ---

    // answers 업데이트
    const updatedAnswers =
      typeof value === "object"
        ? { ...answers, ...value }
        : { ...answers, [current.sub_category]: value };

    setAnswers(updatedAnswers);

    // --- 마지막 문항일 때 API 호출 ---
    if (index >= questions.length - 1) {
      try {
        setIsLoading(true); // (3) 로딩 시작

        const res = await fetch("http://localhost:8000/api/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ answers: updatedAnswers }),
        });
        if (!res.ok) throw new Error(`서버 에러: ${res.status}`);
        const data = await res.json();
        console.log("응답:", data);
        // 필요하다면, 결과를 보여주거나 다른 페이지로 이동
        navigate("/report", { state: { data } });
      } catch (err: any) {
        console.error(err);
        alert("서버에 데이터를 전송하는 중 오류가 발생했습니다.");
        setIsLoading(false); // (4) 에러 발생 시 로딩 해제
      }
    } else {
      // 다음 질문으로
      setIndex((i) => i + 1);
    }
  };

  // 🔙 이전 질문으로 이동
  const handlePrev = () => {
    if (index > 0) {
      const prevId = questions[index].sub_category;
      setAnswers((prev) => {
        const copy = { ...prev };
        delete copy[prevId];
        return copy;
      });
      setIndex((i) => i - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-center p-8">
      <div className="w-full max-w-md relative">
        {/* 홈 버튼*/}
        <div className="flex justify-end items-center mb-2">
          <HomeButton />
        </div>

        {/*  BackButton + ProgressBar */}
        <div className="flex items-center gap-2 mb-4">
          {index > 0 ? (
            <BackButton onClick={handlePrev} className="-mt-3" />
          ) : (
            <div className="w-10" /> // 자리 유지
          )}
          <div className="flex-1">
            <ProgressBar current={index + 1} total={questions.length} />
          </div>
        </div>

        {/* 질문 텍스트 */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {current.content}
        </h2>

        {/* 아이콘 이미지 (질문 아래에 표시) */}
        {current.icon_path && (
          <img
            src={current.icon_path}
            alt="질문 아이콘"
            className="w-[200px] h-auto mx-auto my-6"
          />
        )}

        {/* 질문 유형별 렌더링 (버튼/셀렉트/입력 등) */}
        <div
          key={current.sub_category}
          className="animate-fade-in duration-500"
        >
          <SurveyRenderer question={current} onAnswer={handleAnswer} />
        </div>
      </div>
    </div>
  );
}

export default SurveyForm;
