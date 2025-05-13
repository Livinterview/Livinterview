import { useEffect, useRef } from "react";
import { createCustomMarkerImage, calculateGridSize } from "./markerUtils";
import { Room } from "../../types/room";

declare global {
  interface Window {
    kakao: any;
  }
}

export function useKakaoMap(
  mapRef: React.RefObject<HTMLDivElement>,
  rooms: Room[],
  onPinClick: (room: Room) => void,
  navigate: any
) {
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!rooms.length) return;

    const loadMap = () => {
      if (!mapRef.current) return;

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 7,
      });
      mapInstanceRef.current = map;

      const clusterer = new window.kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 6,
        gridSize: 60,
        styles: [
          {
            width: "40px",
            height: "40px",
            background: "#433CFF",
            borderRadius: "50%",
            color: "#fff",
            textAlign: "center",
            lineHeight: "40px",
            fontSize: "14px",
            fontWeight: "bold",
          },
        ],

      });
      clustererRef.current = clusterer;

      const markerImage = createCustomMarkerImage(window.kakao);

      const updateMarkers = () => {
        const currentLevel = map.getLevel();
        markersRef.current.forEach((marker) => marker.setMap(null));
        clusterer.clear();
        markersRef.current = [];

        const markers = rooms.map((room) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(room.lat, room.lng),
            image: markerImage,
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            onPinClick(room);
            const level = map.getLevel();
            navigate(`?x=${room.lat}&y=${room.lng}&zoom=${level}`, { replace: false });
          });

          return marker;
        });

        markersRef.current = markers;
        const newGridSize = calculateGridSize(currentLevel);
        clusterer.setGridSize(newGridSize);

        if (currentLevel <= 10) {
          clusterer.addMarkers(markers);
        } else {
          markers.forEach((marker) => marker.setMap(map));
        }
      };

      updateMarkers();
      window.kakao.maps.event.addListener(map, "zoom_changed", updateMarkers);
      window.kakao.maps.event.addListener(map, "idle", () => {
        const center = map.getCenter();
        const level = map.getLevel();
        navigate(`?x=${center.getLat()}&y=${center.getLng()}&zoom=${level}`, {
          replace: true,
        });
      });
    };

    if (window.kakao && window.kakao.maps) {
      loadMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_API_KEY}&autoload=false&libraries=services,clusterer`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.kakao.maps.load(loadMap);
      };

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [rooms]);
}
