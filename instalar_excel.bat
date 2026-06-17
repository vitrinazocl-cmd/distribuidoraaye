@echo off
echo Instalando libreria para Excel...

:: Agregar Node portable al PATH temporalmente
set "PATH=%~dp0node-v26.3.0-win-x64\node-v26.3.0-win-x64;%PATH%"

call "%~dp0node-v26.3.0-win-x64\node-v26.3.0-win-x64\npm.cmd" install xlsx

echo.
echo ========================================================
echo Instalacion de Excel completada. Ya puedes cerrar esta ventana.
echo ========================================================
pause
