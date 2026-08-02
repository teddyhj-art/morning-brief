# 아침 브리핑 (Vercel 배포판)

매일 아침 한국 주요 뉴스와 시세를 불러오고, 헤드라인을 누르면 그 이슈만 다시 검색해 자세히 정리해주는 웹앱입니다.

## 폴더 구조

```
morning-brief/
├── index.html        화면 전체 (단일 파일)
├── api/claude.js     Anthropic API를 대신 호출하는 서버리스 함수
├── package.json      ESM 설정
└── README.md
```

API 키는 `api/claude.js`가 서버에서만 읽습니다. 브라우저 쪽 코드에는 키가 들어가지 않습니다.

## 1. API 키 발급

1. https://console.anthropic.com 로그인
2. Settings → API Keys → Create Key
3. 결제 수단 등록 (Billing). 웹 검색 도구도 호출당 요금이 붙습니다.

## 2. GitHub에 올리기

```bash
cd morning-brief
git init
git add .
git commit -m "아침 브리핑"
git branch -M main
git remote add origin https://github.com/teddyhj-art/morning-brief.git
git push -u origin main
```

## 3. Vercel 배포

1. https://vercel.com → Add New → Project → 방금 만든 저장소 선택
2. Framework Preset은 **Other**, 빌드 설정은 비워둡니다
3. Environment Variables에 아래를 추가:

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | `sk-ant-...` (발급받은 키) |
   | `APP_PASSCODE` | 아무 문자열 (선택, 아래 참고) |

4. Deploy

## 4. 접근 제한 (권장)

배포 주소는 누구나 열 수 있고, 열릴 때마다 선생님 키로 요금이 나갑니다. 두 가지 중 하나는 꼭 걸어두세요.

- **간단한 방법** — `APP_PASSCODE` 환경변수에 값을 넣고, 주소 뒤에 붙여서 접속합니다.
  `https://morning-brief.vercel.app/?k=여기에같은값`
  북마크나 홈 화면 바로가기에 이 주소째로 저장하면 매번 입력할 일이 없습니다.
- **더 확실한 방법** — Vercel 프로젝트 Settings → Deployment Protection → Vercel Authentication을 켜면 본인 계정으로 로그인해야만 열립니다.

`APP_PASSCODE`를 아예 등록하지 않으면 코드 확인 없이 누구나 열립니다.

## 5. 폰 홈 화면에 추가

Chrome에서 주소를 연 뒤 `⋮` → 홈 화면에 추가. 오전 8시 알람이 울리면 아이콘 한 번 눌러 바로 보시면 됩니다.

## 손볼 만한 곳

| 하고 싶은 것 | 고칠 위치 |
|---|---|
| 이슈 개수 | `index.html`의 `loadBriefing()` 안 "9개 이슈" |
| 분야 추가·삭제 | `index.html` 위쪽 `CATS` 객체 + 헤더의 `.chip` 버튼 |
| 시세 종목 변경 | `index.html`의 `loadMarket()` 프롬프트와 `marketSkeleton()` 목록 |
| 모델 교체 | `api/claude.js` 맨 위 `MODEL` |
| 응답 길이 | `api/claude.js`의 `BUDGET` |

## 비용 감각

한 번 열 때 API를 2회(시세 + 이슈 목록) 부르고, 헤드라인을 누를 때마다 1회 더 부릅니다. 웹 검색이 붙어 있어 일반 대화보다 비쌉니다. 매일 아침 한 번 + 서너 개 기사를 읽는 정도면 부담이 크지 않지만, Console의 Usage 탭에서 첫 주는 한 번 확인해보시는 걸 권합니다.
