import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFilteredRooms } from "./useFilteredRooms";
import { useKakaoMap } from "./useKakaoMap";
import { Room } from "../../types/room";
import LoadingSpinner from "../LoadingSpinner";
import RoomListModal from "../RoomListModal";

interface MapViewProps {
  filters: any;
  selectedRoom: Room | null;
  onPinClick: (room: Room) => void;
  onLoadingChange?: (loading: boolean) => void;
  onClusterOpen?: (isOpen: boolean) => void;
}

export default function MapView({ filters, selectedRoom, onPinClick, onLoadingChange, onClusterOpen }: MapViewProps) {
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
    },
    selectedRoom 
  );
  

  const isLoading = roomsLoading || mapLoading;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading]);

  useEffect(() => {
    onClusterOpen?.(!!clusterModalRooms)
  }, [clusterModalRooms])

  return (
    <div className="relative w-full h-full">
      <div className="flex w-full h-full">
        <div ref={mapRef} className="flex-1 h-full bg-gray-100" />

        {clusterModalRooms && (
          <RoomListModal
            rooms={clusterModalRooms}
            onClose={() => setClusterModalRooms(null)}
            onRoomClick={(room) => {
              onPinClick(room);
              setClusterModalRooms(null);
            }}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20">
          <LoadingSpinner text="매물을 가져오는 중입니다..." />
        </div>
      )}
    </div>
  );
}
