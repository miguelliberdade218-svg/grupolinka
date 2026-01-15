#!/usr/bin/env python3
"""
Script para analisar o schema SQL e converter tudo para camelCase
Remover tabela eventManagers e ajustar relacionamentos
"""

import re
import sys

def snake_to_camel(snake_str):
    """Converte snake_case para camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def analyze_schema(sql_content):
    """Analisa o schema SQL e retorna estrutura"""
    tables = {}
    current_table = None
    
    lines = sql_content.split('\n')
    for i, line in enumerate(lines):
        # Encontrar CREATE TABLE
        create_match = re.match(r'CREATE TABLE public\.("?)(\w+)("?)', line.strip())
        if create_match:
            table_name = create_match.group(2)
            if create_match.group(1) == '"' and create_match.group(3) == '"':
                # Já está entre aspas (camelCase ou com caracteres especiais)
                current_table = table_name
            else:
                current_table = table_name
            tables[current_table] = {'columns': [], 'constraints': [], 'indices': []}
            continue
        
        if current_table:
            # Encontrar colunas
            col_match = re.match(r'\s+(\w+)\s+', line.strip())
            if col_match and 'CONSTRAINT' not in line and 'CHECK' not in line:
                col_name = col_match.group(1)
                tables[current_table]['columns'].append(col_name)
            
            # Encontrar constraints
            if 'CONSTRAINT' in line:
                tables[current_table]['constraints'].append(line.strip())
            
            # Encontrar fim da tabela
            if line.strip() == ');':
                current_table = None
    
    return tables

def generate_conversion_script(tables):
    """Gera script SQL de conversão"""
    script = []
    script.append("-- SCRIPT GERADO AUTOMATICAMENTE PARA CONVERSÃO PARA camelCase")
    script.append("-- E REMOÇÃO DA TABELA eventManagers")
    script.append("\n-- ============================================")
    script.append("-- 1. REMOVER TABELA eventManagers")
    script.append("-- ============================================")
    script.append('DROP TABLE IF EXISTS public."eventManagers" CASCADE;')
    
    script.append("\n-- ============================================")
    script.append("-- 2. RENOMEAR TABELAS snake_case PARA camelCase")
    script.append("-- ============================================")
    
    # Renomear tabelas
    for table_name in tables:
        if '_' in table_name and table_name != 'eventManagers':
            new_name = snake_to_camel(table_name)
            script.append(f'ALTER TABLE IF EXISTS public.{table_name} RENAME TO {new_name};')
    
    script.append("\n-- ============================================")
    script.append("-- 3. RENOMEAR COLUNAS snake_case PARA camelCase")
    script.append("-- ============================================")
    
    # Para cada tabela, renomear colunas
    for table_name, table_info in tables.items():
        if table_name == 'eventManagers':
            continue
            
        new_table_name = snake_to_camel(table_name) if '_' in table_name else table_name
        
        for column in table_info['columns']:
            if '_' in column and not column.startswith('"'):
                new_column_name = snake_to_camel(column)
                script.append(f'ALTER TABLE IF EXISTS public.{new_table_name} RENAME COLUMN {column} TO {new_column_name};')
    
    script.append("\n-- ============================================")
    script.append("-- 4. RECRIAR CONSTRAINTS COM NOVOS NOMES")
    script.append("-- ============================================")
    script.append("-- NOTA: Constraints precisam ser recriadas manualmente")
    script.append("-- após verificar os novos nomes de tabelas e colunas")
    
    script.append("\n-- ============================================")
    script.append("-- 5. ATUALIZAR FUNÇÕES E PROCEDURES")
    script.append("-- ============================================")
    script.append("-- NOTA: Todas as funções que referenciam tabelas/colunas")
    script.append("-- precisam ser recriadas com os novos nomes")
    
    script.append("\n-- ============================================")
    script.append("-- 6. VERIFICAR RELACIONAMENTOS")
    script.append("-- ============================================")
    script.append("-- Relacionamentos importantes a verificar:")
    script.append("-- 1. eventSpaces -> hotels (hotelId)")
    script.append("-- 2. eventBookings -> eventSpaces (eventSpaceId)")
    script.append("-- 3. eventBookings -> hotels (hotelId)")
    script.append("-- 4. hotelBookings -> hotels (hotelId)")
    script.append("-- 5. hotelBookings -> roomTypes (roomTypeId)")
    
    script.append("\n-- ============================================")
    script.append("-- 7. ADICIONAR PERMISSÕES PARA HOTEL MANAGERS")
    script.append("-- ============================================")
    script.append("-- Como eventManagers foi removido, hotel managers")
    script.append("-- agora gerenciam eventSpaces através do hotelId")
    
    script.append("\nDO $$ ")
    script.append("BEGIN")
    script.append("    RAISE NOTICE 'Conversão para camelCase concluída em %', NOW();")
    script.append("    RAISE NOTICE 'Total de tabelas processadas: %', " + str(len(tables) - 1) + ";")
    script.append("END $$;")
    
    return '\n'.join(script)

def main():
    # Ler o arquivo SQL
    try:
        with open('migrations/004_schema_full.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
    except FileNotFoundError:
        print("Erro: Arquivo migrations/004_schema_full.sql não encontrado")
        sys.exit(1)
    
    # Analisar schema
    print("Analisando schema...")
    tables = analyze_schema(sql_content)
    
    print(f"Encontradas {len(tables)} tabelas:")
    for table_name in sorted(tables.keys()):
        print(f"  - {table_name} ({len(tables[table_name]['columns'])} colunas)")
    
    # Gerar script de conversão
    conversion_script = generate_conversion_script(tables)
    
    # Salvar script
    with open('convert_to_camelcase_full.sql', 'w', encoding='utf-8') as f:
        f.write(conversion_script)
    
    print("\nScript de conversão gerado: convert_to_camelcase_full.sql")
    print("\nAÇÕES NECESSÁRIAS APÓS CONVERSÃO:")
    print("1. Recriar todas as constraints (PK, FK, UNIQUE, CHECK)")
    print("2. Recriar todos os índices com novos nomes")
    print("3. Recriar todas as funções que referenciam tabelas/colunas")
    print("4. Atualizar aplicação para usar novos nomes")
    print("5. Testar integridade dos relacionamentos")

if __name__ == '__main__':
    main()