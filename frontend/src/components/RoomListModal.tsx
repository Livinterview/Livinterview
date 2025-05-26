import { Room } from "../types/room";
import MapPriceDisplay from "./MapPriceDisplay";

interface Props {
  rooms: Room[];
  onClose: () => void;
  onRoomClick: (room: Room) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage?: number;
}

export default function RoomListModal({
  rooms,
  onClose,
  onRoomClick,
  currentPage,
  setCurrentPage,
  itemsPerPage = 10,
}: Props) {
  const totalPages = Math.max(1, Math.ceil((rooms.length || 0) / itemsPerPage));
  const paginatedRooms = rooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
      <div className="bg-white md:w-[430px] h-[90%] rounded-lg shadow-lg p-4 overflow-y-auto relative ">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">해당 위치의 매물</h3>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            닫기
          </button>
        </div>

        <ul className="space-y-2">
          {paginatedRooms.map((room) => (
            <li
              key={room.id}
              className="p-3 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => onRoomClick(room)}
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
                  priceType={room.price_type}
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
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            &lt;
          </button>

          {[...Array(Math.min(totalPages, 5)).keys()].map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded ${
                  page === currentPage ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            &gt;
          </button>
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
  );
}
