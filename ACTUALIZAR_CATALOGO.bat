@echo off
echo ==============================================================
echo Iniciando proceso para descargar las imagenes y actualizar JS
echo ==============================================================
echo.
echo Por favor, no cierres esta ventana. Puede tomar un par de minutos descargar las 99 imagenes.
echo.
powershell.exe -ExecutionPolicy Bypass -File "build_catalog.ps1"
