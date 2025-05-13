import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Room } from "../types/room";
import axios from "axios";

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapViewProps {
  filters: any;
  onPinClick: (room: Room) => void;
}

export default function MapView({ onPinClick, filters }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // Store map instance
  const markersRef = useRef<any[]>([]); // Store markers to manage clearing
  const clustererRef = useRef<any>(null); // Store clusterer instance
  const [rooms, setRooms] = useState<Room[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ URL에서 x, y, zoom 파싱
  const searchParams = new URLSearchParams(location.search);
  const x = parseFloat(searchParams.get("x") || "");
  const y = parseFloat(searchParams.get("y") || "");
  const zoom = parseInt(searchParams.get("zoom") || "");

  // Function to create a custom marker image matching cluster style
  const createCustomMarkerImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw circle
    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#433CFF";
    ctx.fill();

    // Draw text "1"
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1", 20, 20);

    return new window.kakao.maps.MarkerImage(
      canvas.toDataURL(),
      new window.kakao.maps.Size(40, 40),
      { offset: new window.kakao.maps.Point(20, 20) }
    );
  };

  // 1. 필터 반영한 API 호출
  useEffect(() => {
    const params: any = {
      contractType: filters?.contractType || ["월세", "전세"],
      depositRangeMin: filters?.depositRange?.[0] || 0,
      depositRangeMax: filters?.depositRange?.[1] || 1_000_000,
      sizeOption: filters?.sizeOption || "전체",
    };

    if (filters.contractType && Array.isArray(filters.contractType)) {
      params[`contractType`] = params[`contractType`] || [];
      filters.contractType.forEach((type: string) => {
        params[`contractType`].push(type);
      });
    }

    if (params.contractType === "월세") {
      params.monthlyRangeMin = filters?.monthlyRange[0] || 0;
      params.monthlyRangeMax = filters?.monthlyRange[1] || 1_000_000;
    }

    const queryString = new URLSearchParams(params).toString();
    console.log("🔗 Query String:", queryString);
    navigate(`?${queryString}`, { replace: true });

    axios
      .get("http://127.0.0.1:8000/api/roomie", { params })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setRooms(data);
        console.log("📦 필터링된 roomie 데이터:", data);
      })
      .catch((err) => {
        console.error("🚨 roomie API 호출 실패:", err);
      });
  }, [filters]);

  // 2. 지도 로딩 & 마커 표시
  useEffect(() => {
    if (!rooms.length) return;

    const loadMap = () => {
      if (!mapRef.current) return;

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(x || 37.5665, y || 126.978),
        level: zoom || 7,
      });
      mapInstanceRef.current = map; // Store map instance

      const clusterer = new window.kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 6, // Cluster at zoom level 10 and below
        gridSize: 60, // Base grid size (will be adjusted dynamically)
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
      clustererRef.current = clusterer; // Store clusterer instance

      // Create custom marker image for all individual markers
      const singleMarkerImage = createCustomMarkerImage();

      // Function to calculate dynamic gridSize based on zoom level
      const calculateGridSize = (zoomLevel: number) => {
        // At lower zoom levels (zoomed out, e.g., 1-6), use a smaller gridSize for tighter clustering
        // At higher zoom levels (zoomed in, e.g., 7-10), use a larger gridSize for more dispersion
        const baseGridSize = 60;
        const minZoom = 1;
        const maxZoom = 6;
        const zoomRange = maxZoom - minZoom;
        const gridSizeRange = 80 - 20; // Grid size from 20 (tight) to 80 (loose)

        // Linearly interpolate gridSize: smaller at lower zoom levels, larger at higher zoom levels
        const gridSize = 20 + (zoomLevel - minZoom) * (gridSizeRange / zoomRange);
        return Math.max(20, Math.min(80, Math.round(gridSize))); // Clamp between 20 and 80
      };

      // Function to update markers based on zoom level
      const updateMarkers = () => {
        const currentLevel = map.getLevel();

        // Clear existing markers from map and clusterer
        markersRef.current.forEach((marker) => marker.setMap(null)); // Remove from map
        clusterer.clear(); // Remove from clusterer
        markersRef.current = []; // Reset markers array

        // Create new markers with custom image
        const markers = rooms.map((room) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(room.lat, room.lng),
            image: singleMarkerImage, // Apply custom image to individual markers
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            onPinClick(room);
            const center = map.getCenter();
            const level = map.getLevel();
            navigate(`?x=${room.lat}&y=${room.lng}&zoom=${level}`, { replace: false });
          });

          return marker;
        });

        markersRef.current = markers; // Store markers for future clearing

        // Dynamically adjust gridSize based on zoom level
        const newGridSize = calculateGridSize(currentLevel);
        clusterer.setGridSize(newGridSize);
        console.log(`🔧 Zoom Level: ${currentLevel}, Grid Size: ${newGridSize}`);

        // Apply clustering at zoom level 10 and below
        if (currentLevel <= 10) {
          clusterer.addMarkers(markers);
        } else {
          // Display individual markers at zoom level 11 and above
          markers.forEach((marker) => marker.setMap(map));
        }
      };

      // Initial marker update
      updateMarkers();

      // Listen for zoom changes
      window.kakao.maps.event.addListener(map, "zoom_changed", updateMarkers);

      // Update URL on map idle
      window.kakao.maps.event.addListener(map, "idle", () => {
        const center = map.getCenter();
        const level = map.getLevel();
        console.log("📍지도 중심 좌표:", center.getLat(), center.getLng());
        console.log("🔍줌 레벨:", level);

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

  // 3. URL 좌표 기반 자동 핀 선택
  useEffect(() => {
    if (!rooms.length || isNaN(x) || isNaN(y)) return;

    const EPSILON = 0.0005;
    const targetRoom = rooms.find(
      (room) =>
        Math.abs(room.lat - x) < EPSILON && Math.abs(room.lng - y) < EPSILON
    );

    if (targetRoom) {
      onPinClick(targetRoom);
    }
  }, [rooms, x, y]);

  return <div ref={mapRef} className="w-full h-full bg-gray-100" />;
}