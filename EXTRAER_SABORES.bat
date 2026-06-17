@echo off
echo Instalando paquete para leer Excel...
call npm install xlsx
echo.
echo Extrayendo sabores del Excel...
node extract_flavors.js
echo.
pause
