import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ChatMessageList from "../components/ChatMessageList";
import RoomieHeader from "../components/RoomieHeader"; 
import ImageModal from "../components/ImageModal";

interface ChatState {
  imageUrl: string;
  title?: string;
  sessionId: string;
  imageId: string;
  originalImageId?: string;
}

interface ChatMessage {
  type: "text" | "image";
  text?: string;
  src?: string;
  sender: "user" | "bot";
}

export default function RoomieClean() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const {
    imageUrl,
    title,
    sessionId,
    imageId: passedImageId,
    originalImageId,
  } = state as ChatState;

  type Label = { en: string; ko: string };
  type Step = "askClean" | "labeling";
  const [step, setStep] = useState<Step>("askClean");
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const handleImageClick = (src: string) => {
    setModalImageUrl(src);
    setModalOpen(true);
  };

  // 채팅 메시지 상태
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 초기 메시지 설정
  useEffect(() => {
    if (!passedImageId || step !== "askClean") return;
    setMessages([
      { type: "text", text: "안녕! 난 인테리어 도우미 Roomie야 😊", sender: "bot" },
      { type: "image", src: imageUrl, sender: "bot" },
      { type: "text", text: "혹시 방에 치워야 할 가구들이 있다면 청소해줄 수 있어! 어떻게 할래?", sender: "bot" },
    ]);
  }, [passedImageId, step]);

  // “청소할래” vs “이미 깨끗해” 분기
  const handleAskClean = async (clean: boolean) => {
    if (!passedImageId) return;

    if (!clean) {
      navigate("/roomie/chat", {
        state: {
          imageUrl,
          blankRoomUrl: imageUrl,
          imageId: passedImageId,
          originalImageId,
          title,
          sessionId,
          isClean: false,
        },
      });
      return;
    }

    // 청소하기 선택 시 가구 감지 진행
    setLoading(true);
    try {
      const respDetect = await fetch("http://localhost:8000/cleaning/detect", {
        method: "POST",
        body: new URLSearchParams({ image_id: passedImageId }),
      });
      const detectJson = await respDetect.json();
      if (detectJson.status !== "success") {
        setError(detectJson.message);
        return;
      }

      const respLabels = await fetch("http://localhost:8000/cleaning/labels", {
        method: "POST",
        body: new URLSearchParams({ image_id: passedImageId }),
      });
      const { labels: fetchedLabels } = await respLabels.json();
      setLabels(fetchedLabels || []);
      setStep("labeling");
    } catch {
      setError("가구 감지에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (idx: number) => {
    setSelectedIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // 선택 완료 후 마스크 생성 → 인페인팅 → 채팅 화면으로 이동
  const handleStartCleaning = async () => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image_id", passedImageId);
      selectedIndices.forEach(i => form.append("selected_indices", i.toString()));

      // 마스크 생성
      await fetch("http://localhost:8000/cleaning/removal", {
        method: "POST",
        body: form,
      });

      // 인페인팅
      const respInpaint = await fetch("http://localhost:8000/cleaning/inpaint", {
        method: "POST",
        body: new URLSearchParams({ image_id: passedImageId }),
      });
      const { inpainted_url } = await respInpaint.json();
      if (!inpainted_url) throw new Error();

      // navigate
      navigate("/roomie/chat", {
        state: {
          imageUrl: inpainted_url,
          blankRoomUrl: inpainted_url,
          imageId: passedImageId,
          originalImageId,
          title,
          sessionId,
          isClean: true,
        },
      });

    } catch {
      setError("청소 과정에서 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 상단  */}
      <RoomieHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ChatMessageList messages={messages} onImageClick={handleImageClick}/>

        {step === "askClean" && (
          <div className="space-y-4 text-center">
            {loading ? (
              <p className="text-center text-gray-500 text-sm animate-pulse">
                🕵️ 가구를 감지 중입니다... 잠시만 기다려주세요!
              </p>
            ) : (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleAskClean(true)}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl"
                >
                  청소할래
                </button>
                <button
                  onClick={() => handleAskClean(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-300 rounded-xl"
                >
                  이미 깨끗해
                </button>
              </div>
            )}
          </div>
        )}

        {step === "labeling" && (
          <div>
            <p className="font-semibold">남길 가구를 선택해주세요:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {labels.map((labelObj, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleLabel(idx)}
                  className={`px-4 py-2 rounded-xl border ${
                    selectedIndices.includes(idx)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {labelObj.ko}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="mt-4 text-center text-gray-500 animate-pulse">
                청소 중입니다… 🧹
              </p>
            ) : (
              <button
                onClick={handleStartCleaning}
                disabled={loading}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl"
              >
                청소 시작
              </button>
            )}
          </div>

          
        )}
      </div>
      {/* 추가: 이미지 모달 렌더링 */}
      {modalOpen && modalImageUrl && (
        <ImageModal
          imageUrl={modalImageUrl ?? ""}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>

  
  );
}