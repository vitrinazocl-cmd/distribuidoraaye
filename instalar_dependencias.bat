@echo off
echo Instalando dependencias de Node.js...
echo Esto descargara e instalara Express, Cors y Transbank SDK.

:: Usar la ruta portable de npm (corregida para la doble carpeta)
call "%CD%\node-v26.3.0-win-x64\node-v26.3.0-win-x64\npm.cmd" install

echo.
echo ========================================================
echo Instalacion completada. Ya puedes cerrar esta ventana.
echo ========================================================
pause
