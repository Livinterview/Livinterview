type PriceDisplayProps = {
  priceType: string
  deposit: number
  monthly?: number
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

export default function PriceDisplay({ priceType, deposit, monthly }: PriceDisplayProps) {
  return (
    <>
      {priceType} {formatDeposit(deposit, priceType)}
      {priceType !== '전세' && monthly && monthly > 0 && (
        <> / {Math.floor(monthly / 10000)}만원</>
      )}
    </>
  );
}
