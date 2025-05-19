import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFilteredRooms } from "./useFilteredRooms";
import { useKakaoMap } from "./useKakaoMap";
import { Room } from "../../types/room";
import LoadingSpinner from "../LoadingSpinner";
import MapPriceDisplay from "../MapPriceDisplay"

interface MapViewProps {
  filters: any;
  onPinClick: (room: Room) => void;
}

export default function MapView({ filters, onPinClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [clusterModalRooms, setClusterModalRooms] = useState<Room[] | null>(null);
  const { rooms, loading: roomsLoading } = useFilteredRooms(filters);
  const { loading: mapLoading } = useKakaoMap(
    mapRef,
    rooms,
    onPinClick,
    navigate,
    (clusteredRooms) => {
      setCurrentPage(1); // 페이지 초기화
      // 클러스터 클릭 시 기본 확대 동작을 막고,
      // 해당 클러스터 안의 매물 목록을 사이드 패널(모달)로 띄움.
      setClusterModalRooms(clusteredRooms);
    }
  );
  const isLoading = roomsLoading || mapLoading;
  //매물 10개씩 페이징 처리
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil((clusterModalRooms?.length || 0) / itemsPerPage));
  const paginatedRooms = clusterModalRooms?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  return (
    <div className="relative w-full h-full">
      {/* 컨테이너를 flex 레이아웃으로 구성 */}
      <div className="flex w-full h-full">
        {/* 지도 영역 */}
        <div ref={mapRef} className="flex-1 h-full bg-gray-100" />

        {/* 클러스터 클릭 시 나타나는 사이드 패널 */}
        {clusterModalRooms && (
          <div className="absolute top-0 right-0 w-[400px] h-full bg-white shadow-lg z-30 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">해당 위치의 매물</h3>
              <button
                onClick={() => setClusterModalRooms(null)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                닫기
              </button>
            </div>
            <ul className="space-y-2">
              {paginatedRooms?.map((room) => (
                <li
                  key={room.id}
                  className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => onPinClick(room)}
                >

                  {room.img_url_list && (
                    <img
                      src={JSON.parse(room.img_url_list)[0]}
                      alt={room.room_title || `매물 ${room.id}`}
                      className="w-full h-40 object-cover rounded mb-2"
                    />
                  )}
                  <div className="font-semibold">
                    <MapPriceDisplay
                      priceType={room.price_type ? room.price_type : `매물 ${room.id}`}
                      deposit={room.deposit}
                      monthly={room.monthly}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    <MapPriceDisplay
                        roomType={room.room_type}
                        roomDesc={room.room_desc}
                        roomTitle={room.room_title}
                        floor={room.floor}
                        areaM2={room.area_m2}
                        maintenanceFee={room.maintenance_fee}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-center items-center space-x-2 mt-4">
              {/* 처음 페이지로 이동 */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                &laquo;
              </button>

              {/* 이전 페이지 */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                &lt;
              </button>

              {/* 숫자 페이지 버튼 (5개만 보이도록) */}
              {(() => {
                const pageButtons = [];
                const maxVisiblePages = 5;
                const half = Math.floor(maxVisiblePages / 2);
                let startPage = Math.max(currentPage - half, 1);
                let endPage = startPage + maxVisiblePages - 1;

                if (endPage > totalPages) {
                  endPage = totalPages;
                  startPage = Math.max(endPage - maxVisiblePages + 1, 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pageButtons.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`px-3 py-1 border rounded ${
                        i === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }

                return pageButtons;
              })()}

              {/* 다음 페이지 */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                &gt;
              </button>

              {/* 마지막 페이지로 이동 */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                &raquo;
              </button>
            </div>
              </div>
        )}
      </div>
      {/* 로딩 스피너 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20">
          <LoadingSpinner text="매물을 가져오는 중입니다..." />
        </div>
      )}
    </div>
  );
}
