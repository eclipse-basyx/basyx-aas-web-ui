@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"

set /p clean_install=Do a clean install? (y/N)
if /i "%clean_install%"=="y" (
    echo Installing dependencies...
    
    cd /d "%ROOT%aas4j"
    call mvn clean install -DskipTests

    cd /d "%ROOT%aas-spring-backend"
    call mvn clean install -DskipTests

    cd /d "%ROOT%aas-spring-backend\basyx.aasenvironment\basyx.aasenvironment.component"
    call mvn clean install -DskipTests

    cd /d "%ROOT%aas-test-backend\nameplate-generator-backend"
    rmdir /s /q node_modules 2>nul
    call npm install --legacy-peer-deps

    cd /d "%ROOT%aas-web-ui"
    rmdir /s /q node_modules 2>nul
    call yarn install
)

echo Starting backend...
cd "%ROOT%\aas-test-backend"
docker compose up -d

cd /d "%ROOT%aas-spring-backend\basyx.aasenvironment\basyx.aasenvironment.component"
echo Starting Maven Spring Boot...
start "BaSyxMaven" /b cmd /c "mvn spring-boot:run >nul 2>&1"

cd /d "%ROOT%aas-test-backend\nameplate-generator-backend"
rmdir /s /q node_modules 2>nul
start "BaSyxNameplateGenerator" /b cmd /c "npm start >nul 2>&1"

cd "%ROOT%\aas-web-ui"
echo Starting frontend...
yarn dev

echo Stopping backend services...
taskkill /FI "WINDOWTITLE eq BaSyxMaven*" /T /F
taskkill /FI "WINDOWTITLE eq BaSyxNameplateGenerator*" /T /F
cd /d "%ROOT%aas-test-backend"
docker compose down
