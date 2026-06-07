@echo off
set KEY="D:\project\bill-exporter\deploy_key"
set HOST=admin@8.162.26.192
set SSH_OPTS=-i %KEY% -o StrictHostKeyChecking=no

echo === 1. Build ===
cd /d %~dp0
call npx expo export --platform web
if %errorlevel% neq 0 exit /b %errorlevel%

echo === 2. Package ===
tar -czf deploy.tar.gz -C dist .

echo === 3. Upload ===
scp %SSH_OPTS% deploy.tar.gz %HOST%:~/

echo === 4. Deploy ===
ssh %SSH_OPTS% %HOST% "sudo rm -rf /var/www/wardrobe/* && sudo tar -xzf ~/deploy.tar.gz -C /var/www/wardrobe/ && sudo chown -R nginx:nginx /var/www/wardrobe && curl -s -o /dev/null -w 'Status: %%{http_code}' http://localhost/ && echo ''"

echo === 5. Cleanup ===
del deploy.tar.gz

echo === Done ===
