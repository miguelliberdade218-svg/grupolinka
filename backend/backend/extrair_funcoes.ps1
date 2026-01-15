$inputFile = "C:\Users\User\Downloads\LinkA\linka-fullstack-mainzip\linka-fullstack-main\backend\backend\todas_funcoes_problematicas.sql"
$outputFile = "funcoes_listadas.txt"

$content = Get-Content $inputFile -Raw
$pattern = '-- Função: ([^(]+)\((.*?)\)'

$matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

$functionList = @()
foreach ($match in $matches) {
    $functionName = $match.Groups[1].Value.Trim()
    $params = $match.Groups[2].Value.Trim()
    $functionList += "$functionName($params)"
}

$functionList | Out-File $outputFile
Write-Host "Encontradas $($functionList.Count) funções"
$functionList | Select-Object -First 20