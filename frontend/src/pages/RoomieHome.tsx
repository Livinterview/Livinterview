import { useState } from "react"
import MapView from "../components/map/MapView"
import RoomInfo from "../components/RoomInfo"
import RoomDetail from "./RoomieDetail"
import BottomTabBar from "../components/BottomTabBar"
import FilterCard from "../components/FilterCard"
import { Room } from "../types/room"

const defaultFilters = {
  contractType: "",                 // 전체
  depositRange: [0, 120000000],     // 0 ~ 1억2천천
  monthlyRange: [0, 5000009],        // 0 ~ 500만
  sizeOption: "",                  // 전체
}

export default function RoomieHome() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [filters, setFilters] = useState(defaultFilters);

  return (
    <div className="flex flex-col w-full h-screen relative">
      <FilterCard onFilterChange={(filters) => {
        console.log("필터 변경됨", filters);
        setFilters(filters); // MapView에 전달할 값
      }} />

      {/* 지도 영역  */}
      <div className="flex-1">
        <MapView
          filters={filters}
          onPinClick={(room) => {
            setSelectedRoom(room)
            setShowDetail(false)
          }}
        />
      </div>

      <div className="h-14">
        <BottomTabBar />
      </div>

      {/* 요약 정보 모달 */}
      {selectedRoom && !showDetail && (
        <RoomInfo
          room={selectedRoom}
          onExpand={() => setShowDetail(true)}
          onClose={() => setSelectedRoom(null)}
        />
      )}

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
