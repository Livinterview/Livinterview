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
  onClusterClick?: (rooms: Room[]) => void,
  selectedRoom?: Room | null,
) {
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const focusMarkerRef = useRef<any>(null);
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

  //디테일 모달(화면 70%) 시 위에 뜨는 지도 중심(화면 30%) 좌표
  useEffect(() => {
    if (!selectedRoom || !mapInstanceRef.current || !window.kakao) return;

    const map = mapInstanceRef.current;
    const latLng = new window.kakao.maps.LatLng(selectedRoom.lat, selectedRoom.lng);

    // 지도 중심을 모달 위로 조정
    const projection = map.getProjection();
    const point = projection.pointFromCoords(latLng);
    point.y += 270;
    const adjustedLatLng = projection.coordsFromPoint(point);
    map.panTo(adjustedLatLng);

    // 기존 focus 마커 제거
    if (focusMarkerRef.current) {
      focusMarkerRef.current.setMap(null);
      focusMarkerRef.current = null;
    }

const markerSvg = `
  <svg width="28" height="42" viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 0C9 0 0 9 0 20c0 11 20 40 20 40s20-29 20-40C40 9 31 0 20 0z" fill="#433CFF"/>
    <circle cx="20" cy="20" r="7" fill="white"/>
  </svg>
`;
const svgBlob = new Blob([markerSvg], { type: "image/svg+xml;charset=utf-8" });
const markerUrl = URL.createObjectURL(svgBlob);

const imageSize = new window.kakao.maps.Size(28, 42);
const markerImage = new window.kakao.maps.MarkerImage(markerUrl, imageSize);

// 기존 focusMarker 제거
if (focusMarkerRef.current) {
  focusMarkerRef.current.setMap(null);
  focusMarkerRef.current = null;
}

// 새 focusMarker 생성
const focusMarker = new window.kakao.maps.Marker({
  position: latLng,
  image: markerImage,
  zIndex: 10,
});
focusMarker.setMap(map);
focusMarkerRef.current = focusMarker;

  }, [selectedRoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterer = clustererRef.current;
    if (!map || !clusterer) return;

    // RoomDetail이 열리면 클러스터 마커 제거
    if (selectedRoom) {
      clusterer.clear();
      return;
    }

    // RoomDetail이 닫히면 클러스터 마커 다시 추가
    if (markersRef.current.length > 0) {
      const currentLevel = map.getLevel();
      const newGridSize = calculateGridSize(currentLevel);
      clusterer.setGridSize(newGridSize);

      if (currentLevel <= 10) {
        clusterer.addMarkers(markersRef.current);
      } else {
        markersRef.current.forEach((marker) => marker.setMap(map));
      }
    }
    //RoomDetail 마커와 클러스터러 동시 구현 방지
    if (!selectedRoom && focusMarkerRef.current) {
    focusMarkerRef.current.setMap(null);
    focusMarkerRef.current = null;
  }
  }, [selectedRoom]);


  return { loading };
}
