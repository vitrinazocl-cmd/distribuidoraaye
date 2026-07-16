Add-Type -AssemblyName System.Drawing

$scriptPath = $PSScriptRoot
if ([string]::IsNullOrEmpty($scriptPath)) { $scriptPath = (Get-Location).Path }

$imgDirs = @(
    (Join-Path $scriptPath "nuevo catalogo\stock productos"),
    $scriptPath
)

$maxDimension = 500
$jpegQuality = 75

function Get-EncoderInfo($mimeType) {
    [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq $mimeType }
}

$jpegEncoder = Get-EncoderInfo "image/jpeg"
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $jpegQuality)

Write-Host "==========================================================="
Write-Host "Iniciando optimización de imágenes en el catálogo y raíz..."
Write-Host "==========================================================="

foreach ($dir in $imgDirs) {
    if (!(Test-Path -Path $dir)) { continue }
    
    # Buscar imagenes PNG, JPG, JPEG grandes (mayores a 100KB)
    $files = Get-ChildItem -Path $dir -File | Where-Object { 
        ($_.Extension -match "^\.(jpg|jpeg|png)$") -and ($_.Length -gt 100kb)
    }
    
    foreach ($file in $files) {
        $path = $file.FullName
        Write-Host "Procesando: $($file.Name) ($([Math]::Round($file.Length/1kb, 1)) KB)"
        
        try {
            # Cargar imagen
            $img = [System.Drawing.Image]::FromFile($path)
            
            # Calcular nuevas dimensiones manteniendo la relación de aspecto
            $width = $img.Width
            $height = $img.Height
            
            if ($width -gt $maxDimension -or $height -gt $maxDimension) {
                if ($width -gt $height) {
                    $newWidth = $maxDimension
                    $newHeight = [int]($height * ($maxDimension / $width))
                } else {
                    $newHeight = $maxDimension
                    $newWidth = [int]($width * ($maxDimension / $height))
                }
            } else {
                $newWidth = $width
                $newHeight = $height
            }
            
            # Crear nuevo canvas y redibujar
            $newBmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
            $graphics = [System.Drawing.Graphics]::FromImage($newBmp)
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighSpeed
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Low
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighSpeed
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighSpeed
            
            $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
            
            # Liberar la imagen original para poder sobreescribirla
            $img.Dispose()
            $graphics.Dispose()
            
            # Guardar la imagen comprimida temporalmente
            $tempPath = "$path.tmp"
            
            if ($file.Extension -match "^\.(jpg|jpeg)$") {
                $newBmp.Save($tempPath, $jpegEncoder, $encoderParams)
            } else {
                # Para PNGs, podemos guardarlos como PNGs de tamaño reducido
                $newBmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
            }
            
            $newBmp.Dispose()
            
            # Reemplazar el archivo original
            Remove-Item -Path $path -Force
            Rename-Item -Path $tempPath -NewName $file.Name
            
            $newSize = (Get-Item $path).Length
            Write-Host " -> Éxito! Nuevo tamaño: $([Math]::Round($newSize/1kb, 1)) KB (Reducción de $([Math]::Round((1 - $newSize/$file.Length)*100, 1))%)"
        } catch {
            Write-Host " -> Error al procesar: $_"
        }
    }
}

Write-Host "==========================================================="
Write-Host "Optimización de imágenes completada."
Write-Host "==========================================================="
