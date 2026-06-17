Add-Type -AssemblyName System.Drawing

$scriptPath = $PSScriptRoot
if ([string]::IsNullOrEmpty($scriptPath)) { $scriptPath = (Get-Location).Path }
$csvPath = Join-Path $scriptPath "catalogo productos\CATALOGO ELEODORO JUNIO 26.csv"
$jsPath = Join-Path $scriptPath "catalogo.js"
$imgDir = Join-Path $scriptPath "catalogo"

# Rutas de las 5 fotos base creadas por la IA
$baseDir = "C:\Users\ext_jmena\.gemini\antigravity\brain\ce53dccf-b43b-47f8-9fff-24f211750be5"
$imgAgua = Join-Path $baseDir "agua_base_1780759284211.png"
$imgBebida = Join-Path $baseDir "bebida_base_1780759271969.png"
$imgCerveza = Join-Path $baseDir "cerveza_base_1780759296023.png"
$imgLicor = Join-Path $baseDir "licor_base_1780759308286.png"
$imgEnergetica = Join-Path $baseDir "energetica_base_1780759320870.png"

if (!(Test-Path -Path $imgDir)) {
    New-Item -ItemType Directory -Path $imgDir | Out-Null
}

# Borrar las imagenes malas anteriores
Remove-Item -Path "$imgDir\*.jpg" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$imgDir\*.png" -Force -ErrorAction SilentlyContinue

$lines = Get-Content $csvPath -Encoding Default
$products = @()
$id = 1
$count = 0

Write-Host "==========================================================="
Write-Host "Generando 99 fotos unicas con IA y estampando nombres..."
Write-Host "==========================================================="
Write-Host "Por favor espera un minuto mientras se dibujan los textos..."
Write-Host ""

foreach ($line in $lines | Select-Object -Skip 1) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts = $line -split ';'
    if ($parts.Length -lt 5) { continue }
    
    $codigo = $parts[0].Trim()
    if ($codigo -eq "") { $codigo = "PROD$id" }
    
    $descripcion = $parts[1].Trim() -replace '`"', ''
    $precioStr = $parts[4].Trim() -replace '\.',''
    $precio = 0
    [int]::TryParse($precioStr, [ref]$precio) | Out-Null

    $descUpper = $descripcion.ToUpper()
    
    $category = "OTROS"
    $baseImgPath = $imgBebida
    
    if ($descUpper -match "AGUA|CACHANTUN|BENECDITINO|VITAL|LIFE") { 
        $category = "AGUA"; $baseImgPath = $imgAgua 
    }
    elseif ($descUpper -match "CERVEZA|CRISTAL|ESCUDO|ROYAL|CORONA|BAVARIA|SOL|HEINEKEN|KUNSTMANN") { 
        $category = "CERVEZA"; $baseImgPath = $imgCerveza 
    }
    elseif ($descUpper -match "PISCO|WHISKY|RON|VODKA|GIN|TEQUILA|ESPUMANTE|ALTO DEL CARMEN|MISTRAL|ICE|IRON") { 
        $category = "LICORES"; $baseImgPath = $imgLicor 
    }
    elseif ($descUpper -match "RED BULL|MONSTER|SCORE|ENERGY|ZO") { 
        $category = "ENERGÉTICAS"; $baseImgPath = $imgEnergetica 
    }
    else { 
        $category = "BEBIDAS" 
    }

    $imageName = "$codigo.jpg"
    $imageLocalPath = Join-Path $imgDir $imageName
    $imageRelativeUrl = "catalogo/$imageName"
    
    $productJson = "{ id: '$codigo', name: `"$descripcion`", price: $precio, category: `"$category`", image: `"$imageRelativeUrl`" }"
    $products += $productJson

    try {
        $bmp = [System.Drawing.Image]::FromFile($baseImgPath)
        $newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($newBmp)
        $graphics.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
        
        # Fondo blanco semi-transparente para el texto
        $brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 255, 255, 255))
        $h_rect = [int]($bmp.Height - 320)
        $rect = New-Object System.Drawing.Rectangle(0, $h_rect, $bmp.Width, 320)
        $graphics.FillRectangle($brushBg, $rect)
        
        # Fuentes y colores
        $fontName = New-Object System.Drawing.Font("Arial", 36, [System.Drawing.FontStyle]::Bold)
        $fontPrice = New-Object System.Drawing.Font("Arial", 48, [System.Drawing.FontStyle]::Bold)
        $brushName = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
        $brushPrice = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 140, 0)) # Naranjo Malibu
        
        # Alineacion centrada
        $format = New-Object System.Drawing.StringFormat
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        
        # Dibujar Nombre
        $h_name = [int]($bmp.Height - 280)
        $w_name = [int]($bmp.Width - 60)
        $rectName = New-Object System.Drawing.RectangleF(30, $h_name, $w_name, 160)
        $graphics.DrawString($descripcion, $fontName, $brushName, $rectName, $format)
        
        # Dibujar Precio
        $formattedPrice = "$" + "{0:N0}" -f $precio
        $formattedPrice = $formattedPrice -replace ',', '.'
        $h_price = [int]($bmp.Height - 120)
        $rectPrice = New-Object System.Drawing.RectangleF(0, $h_price, $bmp.Width, 100)
        $graphics.DrawString($formattedPrice, $fontPrice, $brushPrice, $rectPrice, $format)
        
        $newBmp.Save($imageLocalPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        
        $graphics.Dispose()
        $newBmp.Dispose()
        $bmp.Dispose()
        $brushBg.Dispose()
        $fontName.Dispose()
        $fontPrice.Dispose()
        $brushName.Dispose()
        $brushPrice.Dispose()
        
        Write-Host "[$id/99] Creada foto unica para: $descripcion"
    } catch {
        $errMsg = $_.Exception.ToString()
        Write-Host "[Error] Fallo generacion de $descripcion - $($_.Exception.Message)"
        Add-Content -Path "log.txt" -Value "Error en $descripcion : $errMsg"
    }
    
    $id++
    $count++
}

$jsContent = "const catalogoProductos = [`n" + ($products -join ",`n") + "`n];"
Set-Content -Path $jsPath -Value $jsContent -Encoding UTF8
Write-Host "`n==========================================================="
Write-Host "¡Proceso Completado Exitosamente!"
Write-Host "Se generaron $count imagenes en la carpeta 'catalogo'."
Write-Host "==========================================================="
Write-Host "Presiona cualquier tecla para cerrar esta ventana..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
