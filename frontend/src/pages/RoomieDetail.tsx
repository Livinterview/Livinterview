import { Room } from "../types/room";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useState, useRef } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import MapPriceDisplay from "../components/MapPriceDisplay";
import type { Swiper as SwiperClass } from 'swiper/types';
import 'swiper/css';
import 'swiper/css/navigation';


export default function RoomDetail({
  room,
  onClose,
}: {
  room: Room;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const mainSwiperRef = useRef<SwiperClass | null>(null);
  const handleCloseImageModal = () => {
    setSelectedImage(null);
    if (mainSwiperRef.current) {
      mainSwiperRef.current.slideTo(currentIndex, 0);
    }
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
      className="fixed bottom-0 inset-x-0 mx-auto z-50 w-full max-w-[430px] h-[98vh] bg-white flex flex-col overflow-hidden rounded-t-3xl shadow-xl"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <LoadingSpinner text="방 구조를 분석 중입니다..." />
        </div>
      ) : (
        <>
          <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mt-2 mb-1" />

          {/* 닫기 버튼 */}
          <div className="flex justify-end px-4 py-2">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:underline"
            >
              X
            </button>
          </div>

          {/* 이미지 슬라이드 */}
          <div className="w-full h-64 bg-gray-100 shrink-0">
            {Array.isArray(imgUrls) && imgUrls.length > 0 ? (
              <Swiper
                spaceBetween={10}
                slidesPerView={1}
                navigation
                modules={[Navigation]}
                onSlideChange={(swiper:SwiperClass) => setCurrentIndex(swiper.activeIndex)}
                onSwiper={(swiper: SwiperClass) => (mainSwiperRef.current = swiper)}
                className="w-full h-64"
                initialSlide={currentIndex}
              >
                {imgUrls.map((url, index) => (
                  <SwiperSlide key={index}>
                    <img
                      src={url}
                      alt={`매물 사진 ${index + 1}`}
                      className="object-cover w-full h-64 cursor-pointer"
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
                  initialSlide={currentIndex}
                  navigation
                  modules={[Navigation]}
                  onSlideChange={(swiper:SwiperClass) => setCurrentIndex(swiper.activeIndex)}
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
                    e.stopPropagation();
                    handleCloseImageModal();
                  }}
                  className="absolute top-4 right-4 text-white font-bold z-[100]"
                >
                  X
                </button>
              </div>
            </div>
          )}

          {/* 상세 정보 */}
          <div className="flex-1 overflow-y-auto p-6 text-left space-y-4">
            <h2 className="text-2xl font-bold">{room.room_title}</h2>
            <p className="text-gray-600">{room.dong_name}</p>
            <p className="text-xl font-semibold text-blue-600">
              💰 <MapPriceDisplay
                priceType={room.price_type}
                deposit={room.deposit}
                monthly={room.monthly}
              />
            </p>
            <p className="text-sm text-gray-500">※ 본 정보는 예시.</p>

            <button
              onClick={async () => {
                const sessionId = uuidv4();
                setLoading(true);
                try {
                  const downloadRes = await fetch(
                    "http://localhost:8000/vision/download-image",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ image_url: imgUrls[currentIndex] }),
                    }
                  );
                  const { image_id } = await downloadRes.json();

              // 2) 워터마크 제거 요청 (실패해도 다음 단계로 진행)
              let cleaned_url = imgUrls[currentIndex]; 
              try {
                const wmRes = await fetch("http://localhost:8000/image-tools/remove-watermark", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ image_id }),
                });

                if (!wmRes.ok) {
                  console.warn("워터마크 제거 실패 (응답 에러)", wmRes.status);
                } else {
                  const wmData = await wmRes.json();
                  console.log("워터마크 제거 성공:", wmData);
                  cleaned_url = wmData.cleaned_url;
                }
              } catch (err) {
                console.warn("워터마크 제거 중 예외 발생:", err);
              }

              // 3) 구조 분석
              const structureRes = await fetch(
                "http://localhost:8000/vision/analyze-brief",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    session_id: sessionId,
                    image_id, 
                  }),
                }
              );
              const structureData = await structureRes.json();


              const timestamp = Date.now();
              const cleanedUrlWithVersion = cleaned_url + `?v=${timestamp}`;

              // 4) RoomieClean 화면으로 이동
              navigate("/roomie/clean", {
                state: {
                  imageUrl: cleanedUrlWithVersion,
                  title: room.room_title || "방 정보",
                  sessionId,
                  imageId: image_id,
                  originalImageId: image_id,
                  brief: structureData.brief, 
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
      </>
      )}
    </motion.div>
  );
}
