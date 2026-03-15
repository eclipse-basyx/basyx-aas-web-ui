@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo Starting backend...
cd "%ROOT%\aas-test-backend"
docker compose up -d

cd "%ROOT%\aas-web-ui"

set /p clean_install=Do a clean install? (y/N)
if /i "%clean_install%"=="y" (
  echo Installing dependencies...
  if exist node_modules rmdir /s /q node_modules
  call yarn install
) else (
  if not exist node_modules (
    echo Installing dependencies...
    call yarn install
  )
)

echo Starting frontend...
yarn dev
