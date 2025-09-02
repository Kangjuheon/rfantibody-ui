# Dev 편의용: Vite dev 서버를 바로 띄움 (핫리로드)
FROM node:20-alpine

WORKDIR /app

# 종속성 캐시 최적화
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm i; fi

# 소스 복사
COPY . .

# Vite dev 서버 포트
EXPOSE 2239

# 도커 컨테이너 밖에서도 접속되도록 0.0.0.0 바인딩
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","2239"]
