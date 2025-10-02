#!/bin/bash

# 部署脚本
set -e

echo "🚀 开始部署 LIMS 应用..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker pull ghcr.io/your-username/your-repo:latest

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose -f docker-compose.prod.yml down || true

# 启动新容器
echo "▶️ 启动新容器..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 部署成功！应用运行在 http://localhost:3000"
else
    echo "❌ 部署失败，请检查日志"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# 清理未使用的镜像
echo "🧹 清理未使用的镜像..."
docker image prune -f

echo "🎉 部署完成！"

