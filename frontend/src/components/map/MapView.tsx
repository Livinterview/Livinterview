import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFilteredRooms } from "./useFilteredRooms";
import { useKakaoMap } from "./useKakaoMap";
import { Room } from "../../types/room";
import LoadingSpinner from "../LoadingSpinner";

interface MapViewProps {
  filters: any;
  onPinClick: (room: Room) => void;
}

export default function MapView({ filters, onPinClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { rooms, loading: roomsLoading } = useFilteredRooms(filters);
  const { loading: mapLoading } = useKakaoMap(mapRef, rooms, onPinClick, navigate);

  const isLoading = roomsLoading || mapLoading;

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full bg-gray-100" />
      {isLoading && (
        <div
          className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-70 flex items-center justify-center z-20"
        >
          <LoadingSpinner text="매물을 가져오는 중입니다..." />
        </div>
      )}
    </div>
  );
}
