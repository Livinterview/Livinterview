import React, { useRef, useState, useEffect } from "react";

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: "50%", y: "50%" });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const offsetX = ((e.clientX - rect.left) / rect.width) * 100;
      const offsetY = ((e.clientY - rect.top) / rect.height) * 100;

      // 커서 위치 기준 origin 설정
      setOrigin({ x: `${offsetX}%`, y: `${offsetY}%` });

      setScale((prev) => {
        const next = prev + (e.deltaY < 0 ? 0.2 : -0.2);
        return Math.min(Math.max(next, 1), 5); // 확대/축소 범위
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 rounded-full p-2 font-bold text-white z-50"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ✕
      </button>

      <div
        ref={containerRef}
        className="overflow-hidden max-w-[90%] max-h-[90%] rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="확대 이미지"
          onError={() => console.error("이미지 로드 실패:", imageUrl)}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: `${origin.x} ${origin.y}`,
            transition: "transform 0.2s ease, transform-origin 0.2s ease",
          }}
          className="object-contain w-full h-full"
        />
      </div>
    </div>
  );
};

export default ImageModal;
