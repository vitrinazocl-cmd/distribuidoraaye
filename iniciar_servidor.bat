@echo off
echo Iniciando entorno temporal de Node.js...

:: Agregar la carpeta portable de Node al PATH temporalmente (corregida para la doble carpeta)
set "PATH=%CD%\node-v26.3.0-win-x64\node-v26.3.0-win-x64;%PATH%"

echo.
node -v
echo =================

echo.
echo Iniciando el servidor Backend...
node server.js

pause
