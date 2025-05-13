import { Room } from "../types/room";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export default function RoomDetailModal({
  room,
  onClose,
}: {
  room: Room;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white">
        <LoadingSpinner text="방 구조를 분석 중입니다..." />
      </div>
    );
  }
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // ✅ 모달 이미지 상태
  const [currentIndex, setCurrentIndex] = useState(0); //현재 보고 있는 이미지를 챗봇으로 보내기
  const handleCloseImageModal = () => {
    console.log("Closing image modal");
    setSelectedImage(null);
  };  
  const imgUrls: string[] = typeof room.img_url_list === "string"
    ? JSON.parse(room.img_url_list)
    : room.img_url_list;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-50 bg-white flex flex-col overflow-auto rounded-t-3xl"
    >
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:underline"
        >
          닫기
        </button>
      </div>

      {/* 이미지 슬라이드 */}
      <div className="w-full h-90 bg-gray-100">
        {Array.isArray(imgUrls) && imgUrls.length > 0 ? (
          <Swiper
            spaceBetween={10}
            slidesPerView={1}
            navigation
            modules={[Navigation]} // 화살표 작동 모듈
            onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
            className="w-full h-72"
          >
            {imgUrls.map((url, index) => (
              <SwiperSlide key={index}>
                <img
                  src={url}
                  alt={`매물 사진 ${index + 1}`}
                  className="object-cover w-full h-72 cursor-pointer"
                  onClick={() => setSelectedImage(url)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <img
              src="/icons/report/life/center.svg"
              alt="기본 이미지"
              className="object-contain w-20 h-20"
            />
          </div>
        )}
      </div>

      {/* 선택된 이미지 모달 */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex justify-center items-center">
          <div className="relative w-full h-full flex justify-center">
            <Swiper
              spaceBetween={10}
              slidesPerView={1}
              initialSlide={imgUrls.indexOf(selectedImage)} // 초기 선택된 이미지로 시작
              navigation
              modules={[Navigation]}
              className="w-full h-full"
            >
              {imgUrls.map((url, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={url}
                    alt={`Selected image ${index + 1}`}
                    className="object-contain w-full h-full"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent Swiper from capturing the click
                handleCloseImageModal();
              }}
              className="absolute top-4 right-4 text-white text-2xl font-bold z-[100]" // Higher z-index
            >
              X
            </button>
          </div>
        </div>
      )}

      {/* 상세 정보 */}
      <div className="p-6 text-left space-y-4">
        <h2 className="text-2xl font-bold">{room.room_title}</h2>
        <p className="text-gray-600">{room.dong_name}</p>
        <p className="text-xl font-semibold text-blue-600">
          💰 {room.price_info}만원 / {room.area_m2}평/{room.lat}/{room.lng}
        </p>
        <p className="text-sm text-gray-500">※ 본 정보는 예시.</p>

        <button
          onClick={async () => {
            const sessionId = uuidv4();
            setLoading(true);

            try {
              // 1) 원격 이미지 다운로드
              const downloadRes = await fetch(
                "http://localhost:8000/vision/download-image",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ image_url: imgUrls[currentIndex] }),
                }
              );
              const { image_id } = await downloadRes.json();

              // 2) 구조 분석: 이제 image_id만 전달
              const structureRes = await fetch(
                "http://localhost:8000/vision/analyze-brief",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    session_id: sessionId,
                    image_id,      // 이전엔 image_url 이었음
                  }),
                }
              );
              const structureData = await structureRes.json();
              // 필요하다면 structureData.brief, detailed 등 사용

              // 3) RoomieClean 화면으로 이동
              navigate("/roomie/clean", {
                state: {
                  imageUrl: imgUrls[currentIndex],
                  title: room.room_title || "방 정보",
                  sessionId,
                  imageId: image_id,
                  originalImageId: image_id,
                },
              });
            } catch (err) {
              console.error("AI 인테리어 연결 실패:", err);
              alert("AI 인테리어 준비 중 오류가 발생했습니다.");
            } finally {
              setLoading(false);
            }
          }}
          className="w-full mt-4 bg-zipup-600 text-white text-sm py-3 rounded-xl hover:bg-blue-700 transition"
        >
          AI인테리어 도우미 연결
        </button>
      </div>
    </motion.div>
  );
}
