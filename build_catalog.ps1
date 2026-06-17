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

Write-Host "Generando catalogo y descargando imagenes..."

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
        # Create a clean URL safe text. Take first 25 chars max to avoid errors.
        $shortText = $descripcion
        if ($shortText.Length -gt 25) { $shortText = $shortText.Substring(0, 25) }
        $encodedText = [uri]::EscapeDataString($shortText)
        
        $url = "https://dummyimage.com/400x400/ffffff/333333.jpg&text=$encodedText"
        
        try {
            Invoke-WebRequest -Uri $url -OutFile $imageLocalPath -UseBasicParsing
            Write-Host "[$($count+1)] Descargada imagen: $imageName"
        } catch {
            Write-Host "[$($count+1)] Error descargando $imageName - intentando respaldo..."
            $fbUrl = "https://placehold.co/400x400/ffffff/333333.png?text=$encodedText"
            try {
                Invoke-WebRequest -Uri $fbUrl -OutFile $imageLocalPath -UseBasicParsing
                Write-Host "[$($count+1)] Descargada imagen (respaldo): $imageName"
            } catch {
                Write-Host "[$($count+1)] Error total con $imageName"
            }
        }
    } else {
        Write-Host "[$($count+1)] Imagen ya existe: $imageName"
    }

    $id++
    $count++
}

$jsContent = "const catalogoProductos = [`n" + ($products -join ",`n") + "`n];"
Set-Content -Path $jsPath -Value $jsContent -Encoding UTF8
Write-Host "`n¡Proceso completado! Se generaron $count productos y sus imagenes estan en la carpeta 'catalogo'."
Write-Host "Presiona cualquier tecla para cerrar esta ventana..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
