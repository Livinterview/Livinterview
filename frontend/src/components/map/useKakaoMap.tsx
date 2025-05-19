import { useEffect, useRef, useState } from "react";
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
  navigate: any,
  onClusterClick?: (rooms: Room[]) => void
) {
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 지도 초기화
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const loadMap = () => {
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 7,
        });
        mapInstanceRef.current = map;

        const clusterer = new window.kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 2,
          gridSize: 60,
          disableClickZoom: true,
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

        // ✅ 클러스터 클릭 이벤트에서 marker.room 직접 사용
        if (onClusterClick) {
          window.kakao.maps.event.addListener(clusterer, "clusterclick", (cluster: any) => {
            const markersInCluster = cluster.getMarkers();

            const clusteredRooms = markersInCluster
              .map((marker: any) => marker.room)
              .filter((room: Room | undefined): room is Room => room !== undefined);

            onClusterClick(clusteredRooms);
          });
        }

        // 지도 중심 이동 시 URL 업데이트
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
    }
  }, []);

  // rooms 변경 시 마커 갱신
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterer = clustererRef.current;
    if (!map || !clusterer) return;

    setLoading(true);

    const markerImage = createCustomMarkerImage(window.kakao);

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    clusterer.clear();
    markersRef.current = [];

    const currentLevel = map.getLevel();

    const markers = rooms.map((room) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(room.lat, room.lng),
        image: markerImage,
      });

      // ✅ 마커에 room 객체 직접 할당
      marker.room = room;

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

    setLoading(false);
  }, [rooms]);

  return { loading };
}
