#!/bin/bash
set -e
echo "=== 1. Build ==="
cd "$(dirname "$0")"
npx expo export --platform web

echo "=== 2. Package ==="
tar -czf deploy.tar.gz -C dist .

echo "=== 3. Upload ==="
scp -i ../bill-exporter/deploy_key deploy.tar.gz admin@8.162.26.192:~/

echo "=== 4. Deploy ==="
ssh -i ../bill-exporter/deploy_key admin@8.162.26.192 "
  sudo rm -rf /var/www/wardrobe/*
  sudo tar -xzf ~/deploy.tar.gz -C /var/www/wardrobe/
  sudo chown -R nginx:nginx /var/www/wardrobe
  curl -s -o /dev/null -w 'Status: %{http_code}' http://localhost/
  echo ''
"

echo "=== 5. Cleanup ==="
rm deploy.tar.gz

echo "=== Done ==="
