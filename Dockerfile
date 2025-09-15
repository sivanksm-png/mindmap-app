# 멀티 스테이지 빌드를 위한 Node.js 이미지
FROM node:18-alpine as builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# Nginx를 사용한 정적 파일 서빙
FROM nginx:alpine

# 빌드된 파일을 Nginx 디렉토리로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 포트 3000 노출
EXPOSE 3000

# Nginx 시작
CMD ["nginx", "-g", "daemon off;"]
