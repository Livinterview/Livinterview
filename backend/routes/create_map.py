# routes/create_map.py
import os
import geopandas as gpd
import matplotlib
matplotlib.use("Agg")  # GUI 백엔드 대신 파일 출력용 백엔드 사용

import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import matplotlib as mpl
from fastapi import APIRouter, Body, HTTPException

router = APIRouter()

# 지도 생성 함수
def create_map(full_location: str):
    # 🔎 시·구·동 파싱
    try:
        _, gu_name, dong_name = full_location.strip().split()
    except ValueError:
        raise HTTPException(status_code=400, detail="full_location은 '서울특별시 구이름 동이름' 형식이어야 합니다.")

    # 저장 경로 먼저 정의
    safe_name = dong_name.replace(" ", "_")  # 혹시 모를 공백 대비
    output_path = f"C:/Users/user/Desktop/Livinterview/frontend/public/icons/report/all_report_view/map_image/{safe_name}_map.png"

    # 이미지 파일이 이미 존재하면 바로 반환
    if os.path.exists(output_path):
        print(f"[캐시 사용] {output_path} 존재함 → 생성 생략")
        return output_path

    # 한글 폰트 설정
    font_path = "C:/Windows/Fonts/malgun.ttf"
    font_prop = fm.FontProperties(fname=font_path).get_name()
    plt.rcParams['font.family'] = font_prop
    mpl.rcParams['axes.unicode_minus'] = False

    # SHP 불러오기
    shp_path = r"C:\Users\user\Desktop\Livinterview\frontend\public\LSMD_ADM_SECT_UMD_서울\LSMD_ADM_SECT_UMD_11_202504.shp"
    gdf = gpd.read_file(shp_path, encoding='euc-kr').to_crs(epsg=4326)

    # 자치구 코드 매핑
    gu_map = {
        '11110': '종로구', '11140': '중구', '11170': '용산구', '11200': '성동구',
        '11215': '광진구', '11230': '동대문구', '11260': '중랑구', '11290': '성북구',
        '11305': '강북구', '11320': '도봉구', '11350': '노원구', '11380': '은평구',
        '11410': '서대문구', '11440': '마포구', '11470': '양천구', '11500': '강서구',
        '11530': '구로구', '11545': '금천구', '11560': '영등포구', '11590': '동작구',
        '11620': '관악구', '11650': '서초구', '11680': '강남구', '11710': '송파구',
        '11740': '강동구'
    }
    gdf['자치구'] = gdf['COL_ADM_SE'].map(gu_map)
    
    # 필터링
    gu_filtered = gdf[gdf['자치구'] == gu_name].copy()
    if gu_filtered.empty:
        raise HTTPException(status_code=404, detail=f"{gu_name} 자치구가 존재하지 않습니다.")

    if dong_name not in gu_filtered['EMD_NM'].values:
        raise HTTPException(status_code=404, detail=f"{dong_name} 동이 {gu_name} 안에 없습니다.")

    gu_filtered['fill'] = gu_filtered['EMD_NM'].apply(lambda x: '#4c8689' if x == dong_name else '#f5f5f5')  # fill 색상도 수정

    # 시각화
    fig, ax = plt.subplots(figsize=(6, 6))
    gu_filtered.plot(ax=ax, color=gu_filtered['fill'], edgecolor='black', linewidth=1)

    for _, row in gu_filtered.iterrows():
        if row['EMD_NM'] != dong_name:
            continue
        c = row.geometry.centroid  # representative_point → centroid
        ax.text(
            c.x, c.y, row['EMD_NM'],
            fontsize=10,
            fontweight='bold',
            ha='center',
            va='center',
            bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="gray", lw=0.5),
            zorder=10  # 지도 위로 올림
        )

    # 여백 제거를 위한 축 제한 설정
    margin_ratio = 0.005
    xmin, ymin, xmax, ymax = gu_filtered.total_bounds
    x_margin = (xmax - xmin) * margin_ratio
    y_margin = (ymax - ymin) * margin_ratio
    ax.set_xlim(xmin - x_margin, xmax + x_margin)
    ax.set_ylim(ymin - y_margin, ymax + y_margin)

    # 불필요 요소 제거
    plt.axis('off')

    # 저장 폴더 생성 및 저장장
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=300, pad_inches=0.0)  # 여백 제거 저장

    return output_path

# API 엔드포인트
@router.post("/generate-map")
def generate_map(full_location: str = Body(..., embed=True)):
    """
    Expects full_location: "서울특별시 은평구 역촌동"
    """
    saved_path = create_map(full_location)
    return {"status": "success", "saved_path": saved_path}
