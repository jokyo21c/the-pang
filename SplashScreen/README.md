# Standalone Splash Screen Handover

이 폴더는 THEON 프로젝트의 프리미엄 등장 시퀀스(카운트다운 + 로고 애니메이션)를 다른 프로젝트에 쉽게 적용할 수 있도록 독립적으로 구성된 모듈입니다.

## 📂 폴더 구조
- `SplashScreen.js`: 카운트다운(001-100) 및 로고 줌 애니메이션 로직이 통합된 메인 컴포넌트입니다.
- `SplashScreen.module.css`: 애니메이션 키프레임과 레이아웃 스타일입니다.
- `assets/splash.mp4`: 로고 안에서 재생될 비디오 소스입니다.

## 🚀 적용 방법 (Next.js 기준)

1. **파일 복사**: 이 폴더(`SplashScreen`)를 새로운 프로젝트의 `components/` 폴더 안으로 복사하세요.
2. **비디오 파일 배치**: `assets/splash.mp4` 파일을 새 프로젝트의 `public/videos/splash.mp4` 경로에 위치시키거나, `SplashScreen.js` 코드 내의 `<source src="...">` 경로를 수정하세요.
3. **폰트 설정**: 이 디자인은 `Superstar` (또는 `Anton`) 폰트를 사용합니다. 새 프로젝트의 `globals.css`나 `layout.js`에서 해당 폰트를 불러와야 디자인이 완벽하게 유지됩니다.
4. **컴포넌트 사용**:

```javascript
// page.js (또는 메인 레이아웃)
'use client';
import { useState } from 'react';
import SplashScreen from './components/SplashScreen/SplashScreen';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {!isLoaded && <SplashScreen onComplete={() => setIsLoaded(true)} />}
      
      <main style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 1s ease' }}>
        {/* 실제 페이지 콘텐츠 */}
        <h1>Welcome to My New Project</h1>
      </main>
    </>
  );
}
```

## ✨ 주요 기능
- **프리미엄 카운터**: `easeOutQuart` 곡선을 사용하여 100에 가까워질수록 쫀득하게 느려지는 숫자를 구현했습니다.
- **비디오 마스킹**: CSS `mix-blend-mode: multiply`를 사용하여 'ARTPAGE' 텍스트 안에서만 비디오가 보이도록 설계되었습니다.
- **줌 시퀀스**: 로고가 4초 동안 서서히 15% 커지다가, 마지막 1.2초 동안 화면을 가득 채우며 사라지는(Zoom-to-fill) 연출이 포함되어 있습니다.

---
**Note**: `globals.css`에서 배경색을 `#000` 또는 `#141414`로 맞추면 더욱 자연스러운 전환이 가능합니다.
