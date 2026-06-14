# Magic Mirror — 만화경 웹앱

여러 가지 패턴의 만화경(Kaleidoscope)을 실시간으로 감상하는 React 웹앱.

## 씬 (Scenes)
- 버블, 꽃잎, 별가루, 리퀴드, 실타래, 컨페티, 플라즈마, 크리스탈

## 기능
- 8개 시각 효과를 칩 메뉴로 즉시 전환
- 포인터/터치로 회전 속도 조절
- 일시정지, PNG 캡처, 전체화면
- 모바일/PC 반응형, 디바이스 픽셀 비율 대응

## 로컬 실행
```bash
npm install
npm run dev
```

## 빌드 & 배포
```bash
npm run build
npm run deploy   # gh-pages 브랜치로 배포
```

배포 URL: https://kiuza1004.github.io/magic_mirror/

## 기술 스택
React 18 · TypeScript · Vite 6 · Canvas 2D
