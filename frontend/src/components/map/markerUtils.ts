export function createCustomMarkerImage(kakao: any) {
  const canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.beginPath();
  ctx.arc(20, 20, 20, 0, Math.PI * 2);
  ctx.fillStyle = "#433CFF";
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", 20, 20);

  return new kakao.maps.MarkerImage(
    canvas.toDataURL(),
    new kakao.maps.Size(40, 40),
    { offset: new kakao.maps.Point(20, 20) }
  );
}

export function calculateGridSize(zoomLevel: number) {
  const baseGridSize = 60;
  const minZoom = 1;
  const maxZoom = 6;
  const zoomRange = maxZoom - minZoom;
  const gridSizeRange = 80 - 20;

  const gridSize = 20 + (zoomLevel - minZoom) * (gridSizeRange / zoomRange);
  return Math.max(20, Math.min(80, Math.round(gridSize)));
}
