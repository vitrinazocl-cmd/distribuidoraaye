$csvPath = ".\catalogo productos\CATALOGO ELEODORO JUNIO 26.csv"
$jsPath = ".\catalogo.js"
$imgDir = ".\catalogo"

if (!(Test-Path -Path $imgDir)) {
    New-Item -ItemType Directory -Path $imgDir | Out-Null
}

$lines = Get-Content $csvPath -Encoding Default
$products = @()
$id = 1
$count = 0

Write-Host "====================================================="
Write-Host "Iniciando descarga inteligente de FOTOS REALES..."
Write-Host "====================================================="
Write-Host "Este proceso leera el Excel y buscara en internet"
Write-Host "una foto real para cada producto."
Write-Host "Por favor, ten paciencia, tomara un par de minutos."
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
    if ($descUpper -match "AGUA|CACHANTUN|BENECDITINO|VITAL") { $category = "AGUA" }
    elseif ($descUpper -match "CERVEZA|CRISTAL|ESCUDO|ROYAL|CORONA|BAVARIA|SOL|HEINEKEN|KUNSTMANN") { $category = "CERVEZA" }
    elseif ($descUpper -match "PISCO|WHISKY|RON|VODKA|GIN|TEQUILA|ESPUMANTE|ALTO DEL CARMEN|MISTRAL") { $category = "LICORES" }
    elseif ($descUpper -match "RED BULL|MONSTER|SCORE|ENERGY") { $category = "ENERGÉTICAS" }
    else { $category = "BEBIDAS" }

    $imageName = "$codigo.jpg"
    $imageLocalPath = Join-Path $imgDir $imageName
    $imageRelativeUrl = "catalogo/$imageName"

    $productJson = "{ id: '$codigo', name: `"$descripcion`", price: $precio, category: `"$category`", image: `"$imageRelativeUrl`" }"
    $products += $productJson

    if (!(Test-Path -Path $imageLocalPath)) {
        # Search Yahoo Images
        $query = [uri]::EscapeDataString($descripcion)
        $yahooUrl = "https://images.search.yahoo.com/search/images?p=$query"
        
        try {
            # Use specific User-Agent to avoid basic blocks
            $html = (Invoke-WebRequest -Uri $yahooUrl -UseBasicParsing -Headers @{"User-Agent"="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}).Content
            
            # Bing/Yahoo thumbnails are in tseX.mm.bing.net
            if ($html -match "(https://tse\d\.mm\.bing\.net/th\?id=[^`"']+)") {
                $imgUrl = $matches[1]
                # Fix encoded ampersands if any
                $imgUrl = $imgUrl -replace "&amp;", "&"
                
                Invoke-WebRequest -Uri $imgUrl -OutFile $imageLocalPath -UseBasicParsing
                Write-Host "[OK] Descargada FOTO REAL para: $descripcion"
            } else {
                # Fallback to placehold if no image found in html
                Write-Host "[!] No se encontro foto real para: $descripcion (usando respaldo)"
                $fbUrl = "https://placehold.co/400x400/ffffff/ff8000.png?text=$query"
                Invoke-WebRequest -Uri $fbUrl -OutFile $imageLocalPath -UseBasicParsing
            }
        } catch {
            Write-Host "[ERROR] Fallo la busqueda para $descripcion"
        }
    } else {
        Write-Host "[-] Imagen ya existe para: $descripcion"
    }

    $id++
    $count++
}

$jsContent = "const catalogoProductos = [`n" + ($products -join ",`n") + "`n];"
Set-Content -Path $jsPath -Value $jsContent -Encoding UTF8
Write-Host "`n====================================================="
Write-Host "¡Proceso completado!"
Write-Host "Se leyeron $count productos."
Write-Host "Las fotos reales estan en la carpeta 'catalogo'."
Write-Host "====================================================="
Write-Host "Presiona cualquier tecla para cerrar esta ventana..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
