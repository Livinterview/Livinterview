from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
import pandas as pd
import matplotlib.pyplot as plt
from reportlab.lib.utils import ImageReader

df = pd.read_csv("seoulCCTV.csv")

top5 = df.sort_values(by="2016년", ascending=False).head(5)

plt.rcParams['font.family'] = 'Malgun Gothic'
plt.figure(figsize=(8, 5))
plt.bar(top5["기관명"], top5["2016년"], color="skyblue")
plt.title("2016년 기준 상위 5개 자치구")
plt.xlabel("자치구")
plt.ylabel("2016년 수치")
plt.tight_layout()
plt.savefig("sales_chart.png")
plt.close()

# ▶ 그래프2: 연도별 평균 변화
years = ["2013년도 이전", "2014년", "2015년", "2016년"]
avg_values = [df[year].mean() for year in years]
plt.figure(figsize=(4, 3))
plt.plot(years, avg_values, marker='o', color='teal')
plt.title("연도별 평균 수치 변화")
plt.tight_layout()
plt.savefig("chart2.png")
plt.close()

pdfmetrics.registerFont(TTFont("맑은고딕", "malgun.ttf"))
pdf = canvas.Canvas("test.pdf", pagezise=A4)
width, height = A4
pdf.setFont("맑은고딕", 16)
title = "파이썬 PDF 파일 생성"
str_width = pdf.stringWidth(title) #텍스트의 크기 
pdf.drawString((width // 2) - (str_width // 2), 750, title) #문서의 정중앙의 width 값

pdf.setLineWidth(0.3) #라인 두께 설정
pdf.line(30, 730, 580, 730) #글자 하단에 줄
pdf.line(30, 733, 580, 733) #글자 하단에 줄

chart = ImageReader("sales_chart.png")
img2 = ImageReader("chart2.png")
# pdf.drawImage(chart, 50, height - 300, width=500, height=200)

pdf.drawImage(chart, 100, 500, width=300, height=200) #파일명, 위치, 크기 값
pdf.drawImage(img2, 100, 270, width=300, height=200)

# 표 일부 텍스트로 출력 (예: 상위 3개 월 판매량)
# top_months = df.groupby("2016년")["Sales"].sum().sort_values(ascending=False).head(3)
# y = height - 350
# pdf.setFont("Helvetica", 12)
# for month, sales in top_months.items():
#     pdf.drawString(50, y, f"{month}월: {sales:,.0f}원")
#     y -= 20


pdf.save()
