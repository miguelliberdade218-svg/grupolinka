# Script PowerShell para converter schema SQL para camelCase
# e remover tabela eventManagers

function ConvertTo-CamelCase {
    param([string]$SnakeCase)
    
    $parts = $SnakeCase.Split('_')
    $result = $parts[0]
    for ($i = 1; $i -lt $parts.Count; $i++) {
        $result += (Get-Culture).TextInfo.ToTitleCase($parts[$i].ToLower())
    }
    return $result
}

function Get-SchemaTables {
    param([string]$SqlFile)
    
    $tables = @{}
    $currentTable = $null
    $inTable = $false
    
    $lines = Get-Content $SqlFile
    
    foreach ($line in $lines) {
        # Verificar CREATE TABLE
        if ($line -match 'CREATE TABLE public\.("?)(\w+)("?)') {
            $tableName = $matches[2]
            $currentTable = $tableName
            $inTable = $true
            $tables[$currentTable] = @{
                Columns = @()
                Constraints = @()
                IsQuoted = ($matches[1] -eq '"' -and $matches[3] -eq '"')
            }
            continue
        }
        
        if ($inTable -and $currentTable) {
            # Verificar coluna
            if ($line -match '^\s+(\w+)\s+' -and $line -notmatch 'CONSTRAINT' -and $line -notmatch 'CHECK') {
                $columnName = $matches[1]
                $tables[$currentTable].Columns += $columnName
            }
            
            # Verificar constraint
            if ($line -match 'CONSTRAINT') {
                $tables[$currentTable].Constraints += $line.Trim()
            }
            
            # Fim da tabela
            if ($line.Trim() -eq ');') {
                $inTable = $false
                $currentTable = $null
            }
        }
    }
    
    return $tables
}

function Generate-ConversionScript {
    param([hashtable]$Tables)
    
    $scriptLines = @()
    $scriptLines += "-- SCRIPT GERADO AUTOMATICAMENTE PARA CONVERSÃO PARA camelCase"
    $scriptLines += "-- E REMOÇÃO DA TABELA eventManagers"
    $scriptLines += ""
    $scriptLines += "-- ============================================"
    $scriptLines += "-- 1. REMOVER TABELA eventManagers"
    $scriptLines += "-- ============================================"
    $scriptLines += 'DROP TABLE IF EXISTS public."eventManagers" CASCADE;'
    
    $scriptLines += ""
    $scriptLines += "-- ============================================"
    $scriptLines += "-- 2. RENOMEAR TABELAS snake_case PARA camelCase"
    $scriptLines += "-- ============================================"
    
    # Renomear tabelas
    foreach ($tableName in $Tables.Keys | Sort-Object) {
        if ($tableName -eq 'eventManagers') { continue }
        
        if ($tableName -match '_' -and -not $Tables[$tableName].IsQuoted) {
            $newName = ConvertTo-CamelCase $tableName
            $scriptLines += "ALTER TABLE IF EXISTS public.$tableName RENAME TO $newName;"
        }
    }
    
    $scriptLines += ""
    $scriptLines += "-- ============================================"
    $scriptLines += "-- 3. RENOMEAR COLUNAS snake_case PARA camelCase"
    $scriptLines += "-- ============================================"
    
    # Para cada tabela, renomear colunas
    foreach ($tableName in $Tables.Keys | Sort-Object) {
        if ($tableName -eq 'eventManagers') { continue }
        
        $tableInfo = $Tables[$tableName]
        $newTableName = if ($tableName -match '_' -and -not $tableInfo.IsQuoted) {
            ConvertTo-CamelCase $tableName
        } else {
            $tableName
        }
        
        foreach ($column in $tableInfo.Columns) {
            if ($column -match '_' -and $column -notmatch '^"') {
                $newColumnName = ConvertTo-CamelCase $column
                $scriptLines += "ALTER TABLE IF EXISTS public.$newTableName RENAME COLUMN $column TO $newColumnName;"
            }
        }
    }
    
    $scriptLines += ""
    $scriptLines += "-- ============================================"
    $scriptLines += "-- 4. RELACIONAMENTOS IMPORTANTES"
    $scriptLines += "-- ============================================"
    $scriptLines += "-- Após conversão, verificar estes relacionamentos:"
    $scriptLines += "-- 1. eventSpaces -> hotels (hotelId)"
    $scriptLines += "-- 2. eventBookings -> eventSpaces (eventSpaceId)"
    $scriptLines += "-- 3. eventBookings -> hotels (hotelId)"
    $scriptLines += "-- 4. hotelBookings -> hotels (hotelId)"
    $scriptLines += "-- 5. hotelBookings -> roomTypes (roomTypeId)"
    
    $scriptLines += ""
    $scriptLines += "-- ============================================"
    $scriptLines += "-- 5. PRÓXIMOS PASSOS"
    $scriptLines += "-- ============================================"
    $scriptLines += "-- 1. Recriar constraints (PK, FK, UNIQUE, CHECK)"
    $scriptLines += "-- 2. Recriar índices com novos nomes"
    $scriptLines += "-- 3. Recriar funções que referenciam tabelas/colunas"
    $scriptLines += "-- 4. Atualizar aplicação para usar novos nomes"
    
    return $scriptLines -join "`n"
}

# Main execution
Write-Host "Analisando schema SQL..." -ForegroundColor Green

$sqlFile = "migrations\004_schema_full.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Erro: Arquivo $sqlFile não encontrado" -ForegroundColor Red
    exit 1
}

$tables = Get-SchemaTables -SqlFile $sqlFile

Write-Host "`nEncontradas $($tables.Count) tabelas:" -ForegroundColor Green
foreach ($tableName in $tables.Keys | Sort-Object) {
    $colCount = $tables[$tableName].Columns.Count
    Write-Host "  - $tableName ($colCount colunas)" -ForegroundColor Yellow
}

$conversionScript = Generate-ConversionScript -Tables $tables

$outputFile = "convert_to_camelcase_full.sql"
$conversionScript | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "`nScript de conversão gerado: $outputFile" -ForegroundColor Green
Write-Host "`nIMPORTANTE:" -ForegroundColor Red
Write-Host "1. Execute este script em um ambiente de teste primeiro" -ForegroundColor Yellow
Write-Host "2. Faça backup do banco de dados antes de executar" -ForegroundColor Yellow
Write-Host "3. Após conversão, recrie constraints, índices e funções" -ForegroundColor Yellow
Write-Host "4. Teste todas as funcionalidades" -ForegroundColor Yellow