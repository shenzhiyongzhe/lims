#!/bin/bash

# 快速部署脚本
echo "🚀 开始快速部署..."

# 构建镜像
echo "📦 构建 Docker 镜像..."
docker build -t lims-app:latest .

# 停止旧容器
echo "🛑 停止旧容器..."
docker stop lims-app || true
docker rm lims-app || true

# 启动新容器
echo "▶️ 启动新容器..."
docker run -d \
  --name lims-app \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="mysql://root:123456@host.docker.internal:3306/lims" \
  lims-app:latest

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if docker ps | grep -q lims-app; then
    echo "✅ 部署成功！"
    echo "📋 容器状态："
    docker ps | grep lims-app
    echo ""
    echo "📝 查看日志："
    echo "docker logs -f lims-app"
else
    echo "❌ 部署失败！"
    echo "📋 查看错误日志："
    docker logs lims-app
fi
