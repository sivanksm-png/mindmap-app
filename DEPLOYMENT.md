# 마인드맵 앱 리눅스 서버 배포 가이드

이 문서는 마인드맵 앱을 리눅스 서버에 배포하여 팀원들과 협업할 수 있도록 하는 방법을 설명합니다.

## 배포 방법

### 방법 1: Docker를 사용한 배포 (권장)

#### 1. 서버 준비
```bash
# Docker 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 프로젝트 배포
```bash
# 프로젝트 클론
git clone <your-repository-url>
cd mindmap-app

# Docker 이미지 빌드
npm run docker:build

# 컨테이너 실행
npm run docker:run
```

#### 3. 접속 확인
- 브라우저에서 `http://서버IP주소:3000` 또는 `http://도메인:3000`으로 접속

### 방법 2: PM2를 사용한 배포

#### 1. 서버 준비

**자동 설치 (권장):**
```bash
# 설치 스크립트 실행
chmod +x install-server.sh
./install-server.sh
```

**수동 설치:**
```bash
# Node.js 설치 (18.x 버전)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치
sudo npm install -g pm2

# Nginx 설치
sudo apt install nginx

# Git 설치
sudo apt install git

# 방화벽 설정
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw --force enable
```

#### 2. 프로젝트 배포
```bash
# 프로젝트 클론
git clone <your-repository-url>
cd mindmap-app

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# PM2로 앱 실행
pm2 start ecosystem.config.js

# PM2 자동 시작 설정
pm2 startup
pm2 save
```

#### 3. Nginx 설정
```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/mindmap-app

# 다음 내용 추가:
server {
    listen 80;
    server_name your-domain.com;  # 도메인이 있다면 입력

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/mindmap-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 보안 설정

### SSL 인증서 설정 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 줄 추가:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 방화벽 설정
```bash
# UFW 방화벽 설정
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 모니터링 및 관리

### PM2 명령어
```bash
# 앱 상태 확인
pm2 status

# 로그 확인
pm2 logs mindmap-app

# 앱 재시작
pm2 restart mindmap-app

# 앱 중지
pm2 stop mindmap-app

# 앱 삭제
pm2 delete mindmap-app
```

### Docker 명령어
```bash
# 실행 중인 컨테이너 확인
docker ps

# 컨테이너 로그 확인
docker logs <container-id>

# 컨테이너 중지
docker stop <container-id>

# 컨테이너 재시작
docker restart <container-id>
```

## 업데이트 방법

### Docker 방식
```bash
# 새 버전으로 빌드
npm run docker:build

# 기존 컨테이너 중지 및 제거
docker stop $(docker ps -q --filter ancestor=mindmap-app)
docker rm $(docker ps -aq --filter ancestor=mindmap-app)

# 새 컨테이너 실행
npm run docker:run
```

### PM2 방식
```bash
# 코드 업데이트
git pull origin main

# 의존성 업데이트
npm install

# 새로 빌드
npm run build

# PM2로 재시작
pm2 restart mindmap-app
```

## 문제 해결

### 포트 충돌 문제
- 3000번 포트가 사용 중인 경우, 다른 포트로 변경
- `docker run -p 8080:3000 mindmap-app` (8080 포트 사용)

### 권한 문제
```bash
# Docker 권한 설정
sudo usermod -aG docker $USER
# 로그아웃 후 다시 로그인
```

### 메모리 부족
- PM2 설정에서 `max_memory_restart` 값 조정
- 서버 메모리 업그레이드 고려

## 팀 협업 설정

### 도메인 설정
1. 도메인 구매 및 DNS 설정
2. A 레코드를 서버 IP로 설정
3. SSL 인증서 적용

### 접근 권한 관리
- 팀원들에게 도메인 주소 공유
- 필요시 인증 시스템 추가 고려

## 지원 및 문의

배포 과정에서 문제가 발생하면 다음을 확인해주세요:
1. 서버 로그: `pm2 logs` 또는 `docker logs`
2. Nginx 로그: `/var/log/nginx/error.log`
3. 방화벽 설정 확인
4. 포트 사용 상태 확인: `netstat -tlnp`
