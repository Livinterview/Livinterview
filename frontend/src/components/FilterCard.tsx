import { useState, useEffect } from "react"
import RangeSlider from "./RangeSlider"

interface FilterCardProps {
  onFilterChange: (filters: any) => void
  initialFilters?: {
    contractType?: "월세" | "전세"
    depositRange?: [number, number]
    monthlyRange?: [number, number]
    sizeOption?: string
  }
}

export default function FilterCard({ onFilterChange, initialFilters }: FilterCardProps) {
const [contractType, setContractType] = useState<"월세" | "전세">(initialFilters?.contractType ?? "월세")
const [depositRange, setDepositRange] = useState<[number, number]>(initialFilters?.depositRange ?? [0, 12000])
const [monthlyRange, setMonthlyRange] = useState<[number, number]>(initialFilters?.monthlyRange ?? [0, 500])
const [sizeOption, setSizeOption] = useState<string>(initialFilters?.sizeOption ?? "전체")

  const [isOpen, setIsOpen] = useState(true)

  // 계약 유형이 바뀔 때 depositRange, monthlyRange 초기화
useEffect(() => {
  if (!initialFilters) {
    if (contractType === "월세") {
      setDepositRange([0, 12000])
      setMonthlyRange([0, 500])
    } else {
      setDepositRange([0, 100000])
      setMonthlyRange([0, 0])
    }
  }
}, [contractType])

  return (
    <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 w-[280px] sm:w-[300px] z-50">
      {/* 헤더 + 토글 버튼 */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold">필터 설정</p>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="text-xs text-zipup-600 hover:underline"
        >
          {isOpen ? "▲" : "▼"}
        </button>
      </div>

      {/* 토글가능하게 */}
      {isOpen && (
        <div className="space-y-5 transition-all duration-300 ease-in-out">
          {/* 거래유형 */}
          <div>
            <p className="text-sm font-semibold">거래유형</p>
            <div className="flex gap-2 mt-2">
              {["월세", "전세"].map((type) => (
                <button
                  key={type}
                  onClick={() => setContractType(type as "월세" | "전세")}
                  className={`px-3 py-1 rounded-full border text-sm transition ${
                    contractType === type ? "bg-zipup-600 text-white" : "bg-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 면적 옵션 */}
          <div>
            <p className="text-sm font-semibold">면적 (평)</p>
            <select
              value={sizeOption}
              onChange={(e) => setSizeOption(e.target.value)}
              className="mt-2 w-full border rounded px-2 py-1 text-sm"
            >
              {["전체", "1~5", "5~10", "10~15", "15~20", "20 이상"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 조건별 슬라이더 */}
          {contractType === "월세" && (
            <>
              <RangeSlider
                label="보증금"
                min={0}
                max={12000}
                step={100}
                unit="만원"
                value={depositRange}
                onChange={setDepositRange}
              />
              <RangeSlider
                label="월세"
                min={0}
                max={500}
                step={10}
                unit="만원"
                value={monthlyRange}
                onChange={setMonthlyRange}
              />
            </>
          )}

          {contractType === "전세" && (
            <RangeSlider
              label="전세금"
              min={0}
              max={100000}
              step={500}
              unit="만원"
              value={depositRange}
              onChange={setDepositRange}
            />
          )}

          {/* 적용 버튼 */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() =>
                onFilterChange({
                  contractType,
                  depositRange,
                  monthlyRange,
                  sizeOption,
                })
              }
              className="text-sm px-4 py-2 rounded-lg bg-zipup-600 text-white hover:bg-blue-700 transition"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  )
}