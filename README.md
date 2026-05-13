# 建站助手 MVP v0.1

建站助手是一个面向新手的自动建站与自动部署中控台。用户登录后填写 Git 仓库、域名、Ubuntu 服务器地址和 SSH 信息，系统会通过 SSH 自动安装运行环境、生成 Docker Compose 与 Caddy 配置，并把项目部署成可访问的网站。

## 技术栈

- `apps/web`：Next.js App Router + TypeScript + TailwindCSS
- `apps/api`：Node.js + Express + TypeScript
- `packages/deployer`：SSH、Git、Docker、Docker Compose、Caddy 自动部署逻辑
- PostgreSQL + Prisma
- pnpm workspace

## 本地安装

```bash
pnpm install
cp .env.example .env
```

启动 PostgreSQL：

```bash
docker compose -f docker-compose.dev.yml up -d
```

初始化 Prisma：

```bash
pnpm db:generate
pnpm db:push
```

## 本地运行

```bash
pnpm dev
```

默认地址：

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

演示账号：

- 邮箱：`demo@local.dev`
- 密码：`password123`

首次用演示账号登录时，API 会自动创建该用户。

## 环境变量

复制 `.env.example` 到 `.env` 后调整：

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jianzhan_assistant?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
ENCRYPTION_KEY="replace-with-a-32-byte-or-longer-random-secret"
API_PORT=4000
CORS_ORIGIN="http://localhost:3000"
PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

生产环境必须替换 `JWT_SECRET` 和 `ENCRYPTION_KEY`。

## API 示例

登录：

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@local.dev","password":"password123"}'
```

创建项目：

```bash
curl -X POST http://localhost:4000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "my-site",
    "gitRepo": "https://github.com/example/my-site.git",
    "branch": "main",
    "domain": "example.com",
    "serverIp": "1.2.3.4",
    "sshUsername": "root",
    "sshPort": 22,
    "sshAuthType": "PASSWORD_ONCE",
    "envVars": [{"key": "NODE_ENV", "value": "production"}]
  }'
```

触发部署：

```bash
curl -X POST http://localhost:4000/projects/<PROJECT_ID>/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"sshPassword":"one-time-password"}'
```

查看日志：

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4000/projects/<PROJECT_ID>/logs
```

## 一键部署流程

部署器会按顺序执行：

1. SSH 连接 Ubuntu 服务器。
2. 检查 Docker 是否存在，不存在则安装 Docker。
3. 检查 Docker Compose plugin 是否存在，不存在则安装。
4. 创建 `/opt/jianzhan-assistant/<projectId>` 项目目录。
5. 对 Git 仓库执行 `git clone` 或 `git pull --ff-only`。
6. 识别项目类型：Next.js、Node.js 或静态网站。
7. 如果仓库没有 Dockerfile，生成基础 Dockerfile。
8. 生成 `docker-compose.yml`。
9. 生成 `Caddyfile`，由 Caddy 自动申请 HTTPS。
10. 上传 `.env.production`。
11. 执行 `docker compose build --pull`。
12. 执行 `docker compose up -d`。
13. 检查容器状态、HTTP/HTTPS 可访问性。
14. 写入部署记录与日志，更新项目状态和 commit hash。

## GitHub Webhook 配置

项目创建后会返回一个 `webhookSecret`，项目详情页会展示 webhook endpoint：

```text
http://localhost:4000/webhooks/github/<PROJECT_ID>
```

在 GitHub 仓库中配置：

- Payload URL：上面的 webhook endpoint。
- Content type：`application/json`
- Secret：项目创建响应里的 `webhookSecret`
- Events：选择 `Just the push event`

收到 `push` 后，API 会验证 `X-Hub-Signature-256`，然后触发同一套部署流程。

## 安全说明

- SSH 密码只作为一次性部署参数使用，不会长期明文保存。
- SSH 私钥、私钥 passphrase、环境变量、GitHub webhook secret 会用 AES-256-GCM 加密后入库。
- 部署日志会脱敏，避免输出密码、token、私钥和环境变量值。
- 删除项目只会从平台数据库移除，不会默认删除服务器上的真实目录。
- 停止项目只执行 `docker compose stop`，不会删除镜像、卷、仓库目录或 Caddy 数据。
- 生产环境必须使用强 `JWT_SECRET` 和 `ENCRYPTION_KEY`。
- 不要把 `.env`、SSH 私钥或任何 secrets 提交到 git。

## 构建与检查

```bash
pnpm --filter web build
pnpm --filter api build
pnpm --filter api typecheck
pnpm --filter web typecheck
```

## 生产部署到服务器

仓库内置了生产部署文件：

- `Dockerfile.api`
- `Dockerfile.web`
- `deploy/docker-compose.prod.yml`
- `deploy/Caddyfile`

在 Ubuntu 服务器上执行：

```bash
git clone https://github.com/xuesongtian/webhelper.git
cd webhelper/deploy
cp ../../.env.example .env
```

编辑 `deploy/.env`：

```bash
POSTGRES_PASSWORD="replace-with-a-strong-password"
JWT_SECRET="replace-with-a-long-random-secret"
ENCRYPTION_KEY="replace-with-a-32-byte-or-longer-random-secret"
PUBLIC_APP_URL="https://akeshen.com"
```

启动：

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
```

Caddy 会自动为 `akeshen.com` 和 `www.akeshen.com` 申请 HTTPS 证书，API 会挂在同域名的 `/api` 路径下。

## 当前 MVP 边界

- 支持 Ubuntu 服务器。
- 支持 GitHub 仓库。
- 支持 Docker / Docker Compose / Caddy 自动 HTTPS。
- 支持 Next.js、Node.js、静态网站基础识别。
- GitHub webhook 自动同步要求项目保存了加密 SSH 私钥；如果只使用一次性密码，webhook 无法无人值守部署。
