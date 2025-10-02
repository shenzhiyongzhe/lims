# 部署指南

## 1. GitHub Actions CI/CD 设置

### 1.1 配置 GitHub Secrets

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加以下 secrets：

```
HOST=your-server-ip
USERNAME=your-server-username
SSH_PRIVATE_KEY=your-ssh-private-key
PORT=22
DATABASE_URL=mysql://username:password@localhost:3306/lims
```

### 1.2 启用 GitHub Container Registry

1. 在 GitHub 仓库设置中启用 "Packages"
2. 确保 Actions 有权限推送镜像到 Container Registry

## 2. 服务器准备

### 2.1 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2.2 配置 SSH 密钥

```bash
# 在本地生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 将公钥添加到服务器
ssh-copy-id username@your-server-ip

# 将私钥内容复制到 GitHub Secrets 的 SSH_PRIVATE_KEY
```

### 2.3 创建环境变量文件

```bash
# 在服务器上创建 .env 文件
cat > .env << EOF
DATABASE_URL=mysql://username:password@localhost:3306/lims
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
EOF
```

## 3. 部署流程

### 3.1 自动部署

1. 推送代码到 `main` 或 `master` 分支
2. GitHub Actions 会自动：
   - 运行测试
   - 构建 Docker 镜像
   - 推送到 GitHub Container Registry
   - 部署到服务器

### 3.2 手动部署

```bash
# 在服务器上运行
./scripts/deploy.sh
```

## 4. 监控和维护

### 4.1 查看日志

```bash
# 查看应用日志
docker logs lims-app

# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs
```

### 4.2 更新应用

```bash
# 拉取最新镜像
docker pull ghcr.io/your-username/your-repo:latest

# 重启服务
docker-compose -f docker-compose.prod.yml restart
```

### 4.3 备份数据

```bash
# 备份数据库
docker exec mysql-container mysqldump -u username -p database_name > backup.sql

# 备份上传文件
tar -czf uploads-backup.tar.gz ./uploads
```

## 5. 故障排除

### 5.1 常见问题

1. **构建失败**：检查 GitHub Actions 日志
2. **部署失败**：检查服务器 SSH 连接和权限
3. **应用无法访问**：检查端口和防火墙设置

### 5.2 回滚

```bash
# 回滚到上一个版本
docker tag ghcr.io/your-username/your-repo:previous-tag ghcr.io/your-username/your-repo:latest
docker-compose -f docker-compose.prod.yml up -d
```
