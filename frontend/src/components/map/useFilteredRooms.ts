import { useEffect, useState } from "react";
import axios from "axios";
import { Room } from "../../types/room";

export const useFilteredRooms = (
  filters: any,
  onUpdate?: (rooms: Room[]) => void
) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const params: any = {
      contractType: filters?.contractType || ["월세", "전세"],
      depositRangeMin: filters?.depositRange?.[0] || 0,
      depositRangeMax: filters?.depositRange?.[1] || 1_000_000,
      sizeOption: filters?.sizeOption || "전체",
    };

    if (params.contractType === "월세") {
      params.monthlyRangeMin = filters?.monthlyRange?.[0] || 0;
      params.monthlyRangeMax = filters?.monthlyRange?.[1] || 1_000_000;
    }

    axios
      .get("http://127.0.0.1:8000/api/roomie", { params })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setRooms(data);
        onUpdate?.(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("🚨 roomie API 호출 실패:", err);
        setLoading(false);
      });
  }, [filters]);

  return { rooms, loading };
};
