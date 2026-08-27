#!/bin/bash
set -e
cd "$(dirname "$0")"

# 读 .env.local
export $(grep -v '^#' .env.local | xargs -0) 2>/dev/null
: "${VOLCENGINE_BASE_URL:=https://ark.cn-beijing.volces.com/api/v3}"
: "${VOLCENGINE_MODEL:=doubao-seedream-5-0-pro-260628}"
: "${VOLCENGINE_SIZE:=2K}"

echo "=== 环境变量读取 ==="
echo "BASE_URL : $VOLCENGINE_BASE_URL"
echo "MODEL    : $VOLCENGINE_MODEL"
echo "SIZE     : $VOLCENGINE_SIZE"
echo "API_KEY  : ${VOLCENGINE_API_KEY:0:8}... (长度=${#VOLCENGINE_API_KEY})"
echo

echo "=== curl 调用火山 images/generations (官方示例图 URL) ==="
curl -sS -m 120 -o .tmp-smoke-resp.json -w "HTTP_STATUS:%{http_code} TIME_TOTAL:%{time_total}s\n" \
  -X POST "$VOLCENGINE_BASE_URL/images/generations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VOLCENGINE_API_KEY" \
  -d @- <<'JSONEOF'
{
  "model": "MODEL_PLACEHOLDER",
  "prompt": "将图1中的人物身上的服装完全替换为图2展示的那件服装，保留图1人物的面部五官、发型、表情、站立姿势、完整身形、背景环境、光线方向完全不变，新服装自然贴合身体，褶皱和阴影符合光照，输出自然真实的日常穿搭照片。",
  "image": [
    "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimage_1.png",
    "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimage_2.png"
  ],
  "response_format": "url",
  "size": "SIZE_PLACEHOLDER",
  "stream": false,
  "watermark": true
}
JSONEOF

# 把占位符替换成环境变量（避免 shell 变量在 heredoc JSON 中出问题）
# 因为上面 heredoc 用了 'JSONEOF' 不展开，所以现在重新走：
echo
echo "=== 重新发请求（带真实参数） ==="
BODY_FILE=$(mktemp)
cat > "$BODY_FILE" <<EOF
{"model":"${VOLCENGINE_MODEL}","prompt":"将图1中的人物身上的服装完全替换为图2展示的那件服装，保留人物的面部、姿势、身形、背景完全不变，服装自然贴合身体，输出真实自然的日常穿搭照片。","image":["https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimage_1.png","https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimage_2.png"],"response_format":"url","size":"${VOLCENGINE_SIZE}","stream":false,"watermark":true}
EOF

START_MS=$(python3 -c 'import time;print(int(time.time()*1000))')
STATUS=$(curl -sS -m 120 -o .tmp-smoke-resp.json -w "%{http_code}" \
  -X POST "$VOLCENGINE_BASE_URL/images/generations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VOLCENGINE_API_KEY" \
  -d @"$BODY_FILE")
END_MS=$(python3 -c 'import time;print(int(time.time()*1000))')
ELAPSED=$((END_MS - START_MS))
echo "HTTP 状态码 : $STATUS"
echo "耗时(ms)   : $ELAPSED"
rm -f "$BODY_FILE"

echo
echo "=== 响应片段 (前 1500 字符) ==="
head -c 1500 .tmp-smoke-resp.json; echo

echo
echo "=== 关键字段解析 ==="
URL=$(python3 -c '
import json
with open(".tmp-smoke-resp.json","r",encoding="utf-8") as f: d=json.load(f)
data = d.get("data") or []
print((data[0] or {}).get("url",""))
' 2>/dev/null)
ERR_CODE=$(python3 -c '
import json
with open(".tmp-smoke-resp.json","r",encoding="utf-8") as f: d=json.load(f)
e = d.get("error") or {}
print(str(e.get("code","")) + " :: " + str(e.get("message","")))
' 2>/dev/null)
USAGE=$(python3 -c '
import json
with open(".tmp-smoke-resp.json","r",encoding="utf-8") as f: d=json.load(f)
print(json.dumps(d.get("usage",{}),ensure_ascii=False))
' 2>/dev/null)

if [ -n "$URL" ]; then
  echo "✅ 成功！火山 API 可用。"
  echo "   结果图 URL: $URL"
  echo "   usage: $USAGE"
  rm -f .tmp-smoke-resp.json .tmp-smoke.sh
  exit 0
else
  echo "❌ 失败，未拿到 data[0].url。"
  echo "   error: $ERR_CODE"
  echo "   (详情见上方响应片段)".
  rm -f .tmp-smoke-resp.json .tmp-smoke.sh
  exit 2
fi
