import { useEffect, useRef, useState } from "react"
import { Room } from "../types/room"
import axios from "axios"

declare global {
  interface Window {
    kakao: any
  }
}

interface MapViewProps {
  onPinClick: (room: Room) => void
}

export default function MapView({ onPinClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [rooms, setRooms] = useState<Room[]>([])

  // 1. API 호출
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/roomie")
    .then((res) => {
      // const data = await res.json();
      console.log("📦 받아온 roomie 데이터:", res.data) // ← 여기 확인!
      // res.data가 배열인지 확인
      const data = Array.isArray(res.data)
      ? res.data
      : res.data.data || []; // 객체 내부 data 필드 확인
    setRooms(data);
    })
    .catch((err) => {
      console.error("🚨 roomie API 호출 실패:", err)
    })
  }, [])

  // 2. 지도 로딩 & 마커 표시
  useEffect(() => {
    if (!rooms.length) return

    const loadMap = () => {
      if (!mapRef.current) return

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 5,
      })

      rooms.forEach((room) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(room.lat, room.lng),
          map,
        })

        window.kakao.maps.event.addListener(marker, "click", () => {
          onPinClick(room)
        })
      })
    }

    if (window.kakao && window.kakao.maps) {
      loadMap()
    } else {
      const script = document.createElement("script")
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_API_KEY}&autoload=false&libraries=services`
      script.async = true
      document.head.appendChild(script)

      script.onload = () => {
        window.kakao.maps.load(loadMap)
      }

      return () => {
        document.head.removeChild(script)
      }
    }
  }, [rooms])

  return <div ref={mapRef} className="w-full h-full bg-gray-100" />
}
