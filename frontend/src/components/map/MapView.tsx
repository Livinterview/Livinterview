import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFilteredRooms } from "./useFilteredRooms";
import { useKakaoMap } from "./useKakaoMap";
import { Room } from "../../types/room";

interface MapViewProps {
  filters: any;
  onPinClick: (room: Room) => void;
}

export default function MapView({ filters, onPinClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const rooms = useFilteredRooms(filters);
  useKakaoMap(mapRef, rooms, onPinClick, navigate);

  return <div ref={mapRef} className="w-full h-full bg-gray-100" />;
}
