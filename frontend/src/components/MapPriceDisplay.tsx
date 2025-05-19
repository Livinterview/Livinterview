type PriceDisplayProps = {
  dongName?: string
  roomType?: String
  roomTitle?: string
  roomDesc?: string
  priceType?: string
  imgUrlList?: string
  lat?: number
  lng?: number
  floor?: string
  areaM2?: number
  deposit?: number
  monthly?: number
  maintenanceFee?: number
}

function formatDeposit(deposit: number, priceType: string) {
  if (priceType !== '전세') {
    return `${Math.floor(deposit / 10000)}만원`;
  }

  const eok = Math.floor(deposit / 100000000); // 억
  const man = Math.floor((deposit % 100000000) / 10000); // 만

  if (eok > 0 && man > 0) return `${eok}억 ${man}만`;
  if (eok > 0) return `${eok}억`;
  return `${man}만원`;
}

export default function PriceDisplay({ 
  priceType, 
  deposit, 
  monthly, 
  roomType, 
  roomDesc, 
  roomTitle, 
  imgUrlList, 
  floor, 
  areaM2, 
  maintenanceFee,
 }: PriceDisplayProps) {
  return (
    <>
      {priceType && deposit !== undefined && (
        <>
          {priceType} {formatDeposit(deposit, priceType)}
          {priceType !== '전세' && monthly && monthly > 0 && (
            <> / {Math.floor(monthly / 10000)}만원</>
          )}
        </>
      )}
      {roomType}
      {roomDesc}
      {roomTitle}
      {imgUrlList}
      {floor}
      {areaM2}
      {/* 관리비 */}
      {maintenanceFee}
    </>
  );
}
