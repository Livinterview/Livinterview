import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFilteredRooms } from "./useFilteredRooms";
import { useKakaoMap } from "./useKakaoMap";
import { Room } from "../../types/room";
import LoadingSpinner from "../LoadingSpinner";
import MapPriceDisplay from "../MapPriceDisplay";

interface MapViewProps {
  filters: any;
  onPinClick: (room: Room) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function MapView({ filters, onPinClick, onLoadingChange }: MapViewProps) {
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
      setCurrentPage(1);
      setClusterModalRooms(clusteredRooms);
    }
  );
  

  const isLoading = roomsLoading || mapLoading;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil((clusterModalRooms?.length || 0) / itemsPerPage));
  const paginatedRooms = clusterModalRooms?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading]);

  return (
    <div className="relative w-full h-full">
      <div className="flex w-full h-full">
        <div ref={mapRef} className="flex-1 h-full bg-gray-100" />

        {clusterModalRooms && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
            <div className="bg-white w-[90%] md:w-[80%] h-[80%] rounded-lg shadow-lg p-4 overflow-y-auto relative">
              <div className="flex justify-between items-center mb-4">
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
                        priceType={room.price_type || `매물 ${room.id}`}
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

              {/* 페이지네이션 */}
              <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  &lt;
                </button>

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
                          i === currentPage ? "bg-blue-500 text-white" : "hover:bg-gray-100"
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
