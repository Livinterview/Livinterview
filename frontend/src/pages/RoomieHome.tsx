import { useState } from "react"
import MapView from "../components/map/MapView"
import RoomDetail from "./RoomieDetail"
import BottomTabBar from "../components/BottomTabBar"
import FilterCard from "../components/FilterCard"
import { Room } from "../types/room"

interface Filters {
  contractType?: "월세" | "전세" | ""  // ""도 허용하거나 undefined로
  depositRange: [number, number]
  monthlyRange: [number, number]
  sizeOption?: string
}

const defaultFilters: Filters = {
  contractType: "월세",  // 빈 문자열 대신 기본값 지정
  depositRange: [0, 120000000],
  monthlyRange: [0, 5000009],
  sizeOption: "전체",
}

export default function RoomieHome() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [filters, setFilters] = useState(defaultFilters);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [clusterOpen, setClusterOpen] = useState(false)

  return (
    <div className="flex flex-col w-full h-screen relative">
      {!showDetail && !isMapLoading && !clusterOpen && ( 
        <FilterCard
          initialFilters={filters}
          onFilterChange={(filters) => {
            console.log("필터 변경됨", filters);
            setFilters(filters); // MapView에 전달할 값
          }}
        />
      )}

      {/* 지도 영역  */}
      <div className="flex-1">
        <MapView
          filters={filters}
          selectedRoom={selectedRoom}
          onPinClick={(room) => {
            setSelectedRoom(room)
            setShowDetail(true)
          }}
          onLoadingChange={setIsMapLoading}
          onClusterOpen={setClusterOpen}
        />
      </div>
        <BottomTabBar />

      {/* 요약 정보 모달 */}
      {/* {selectedRoom && !showDetail && (
        <RoomInfo
          room={selectedRoom}
          onExpand={() => setShowDetail(true)}
          onClose={() => setSelectedRoom(null)}
        />
      )} */}

      {/* 전체 상세 모달 */}
      {selectedRoom && showDetail && (
        <RoomDetail
          room={selectedRoom}
          onClose={() => {
            setSelectedRoom(null)
            setShowDetail(false)
          }}
        />
      )}
    </div>
  )
}
