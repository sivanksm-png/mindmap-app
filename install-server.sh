#!/bin/bash

echo "==================================="
echo "  리눅스 서버 설치 스크립트"
echo "==================================="

# 시스템 업데이트
echo "시스템 업데이트 중..."
sudo apt update && sudo apt upgrade -y

# Node.js 18.x 설치
echo "Node.js 18.x 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Node.js 버전 확인
echo "Node.js 버전: $(node --version)"
echo "npm 버전: $(npm --version)"

# PM2 설치
echo "PM2 설치 중..."
sudo npm install -g pm2

# PM2 버전 확인
echo "PM2 버전: $(pm2 --version)"

# Nginx 설치
echo "Nginx 설치 중..."
sudo apt install nginx -y

# Git 설치
echo "Git 설치 중..."
sudo apt install git -y

# 방화벽 설정
echo "방화벽 설정 중..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw --force enable

# Nginx 시작 및 자동 시작 설정
echo "Nginx 서비스 시작..."
sudo systemctl start nginx
sudo systemctl enable nginx

# PM2 자동 시작 설정
echo "PM2 자동 시작 설정..."
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "==================================="
echo "  설치 완료!"
echo "==================================="
echo "설치된 프로그램:"
echo "- Node.js: $(node --version)"
echo "- npm: $(npm --version)"
echo "- PM2: $(pm2 --version)"
echo "- Nginx: $(nginx -v 2>&1)"
echo "- Git: $(git --version)"
echo ""
echo "다음 단계:"
echo "1. git clone <your-repository>"
echo "2. cd mindmap-app"
echo "3. npm install"
echo "4. npm run build"
echo "5. pm2 start ecosystem.config.js"
echo "==================================="
