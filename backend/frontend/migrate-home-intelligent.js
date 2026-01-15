const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/apps/hotels-app/pages/home.tsx');
const backupPath = filePath + '.intelligent-backup';

console.log('🧠 MIGRAÇÃO INTELIGENTE DO HOME.TSX');
console.log('====================================');

// Backup
fs.copyFileSync(filePath, backupPath);
console.log('✅ Backup criado:', backupPath);

// Ler conteúdo
let content = fs.readFileSync(filePath, 'utf8');

// 1. Adicionar import do hotelService após o apiService
if (!content.includes('hotelService')) {
  const importApiService = "import apiService from '@/services/api';";
  const importHotelService = "import { hotelService } from '@/services/hotel.service';";
  
  if (content.includes(importApiService)) {
    content = content.replace(
      importApiService,
      importApiService + '\n' + importHotelService
    );
    console.log('✅ Adicionado import do hotelService');
  }
}

// 2. Encontrar e substituir chamadas fetch específicas
const fetchReplacements = [
  {
    pattern: /const response = await fetch\(`\/api\/hotels\/\$\{id\}\/rooms`\);/,
    replacement: `// 🔥 Migrado para hotelService\n      console.log('🔍 [Migrado] Buscando quartos do hotel:', id);\n      const result = await apiService.getRoomsByHotelId(id);\n      const response = { ok: result.success, json: () => result.data || { rooms: [] } };`,
    description: 'Busca de quartos do hotel'
  },
  {
    pattern: /const response = await fetch\(`\/api\/hotels\/\$\{userHotel\?\\.id\}\/rooms\/\$\{roomId\}`,\s*\{[^}]*\}\);/g,
    replacement: `// 🔥 Migrado para apiService\n      console.log('🔍 [Migrado] Atualizando quarto:', roomId);\n      const result = await apiService.updateRoom(roomId, updatedData);\n      const response = { ok: result.success, json: () => result.data || {} };`,
    description: 'Atualização de quarto'
  },
  {
    pattern: /const response = await fetch\(`\/api\/hotels\/\$\{userHotel\.id\}\/partnerships`\);/,
    replacement: `// 🔥 Migrado para apiService\n      console.log('🔍 [Migrado] Buscando parcerias');\n      const result = await apiService.getDriverPartnerships(userHotel.id);\n      const response = { ok: result.success, json: () => result.data || { partnerships: [] } };`,
    description: 'Busca de parcerias'
  },
  {
    pattern: /const response = await fetch\(`\/api\/hotels\/\$\{userHotel\.id\}\/driver-partnerships`\);/,
    replacement: `// 🔥 Migrado para apiService\n      console.log('🔍 [Migrado] Buscando parcerias com motoristas');\n      const result = await apiService.getDriverPartnerships(userHotel.id);\n      const response = { ok: result.success, json: () => result.data || { partnerships: [] } };`,
    description: 'Busca de parcerias com motoristas'
  },
  {
    pattern: /const response = await fetch\(`\/api\/hotels\/\$\{userHotel\?\\.id\}\/partnerships`,\s*\{[^}]*\}\);/g,
    replacement: `// 🔥 Migrado para apiService\n      console.log('🔍 [Migrado] Criando/atualizando parceria');\n      const result = await apiService.createPartnership(partnershipData);\n      const response = { ok: result.success, json: () => result.data || {} };`,
    description: 'Criação/atualização de parceria'
  }
];

let changes = 0;
fetchReplacements.forEach(({ pattern, replacement, description }) => {
  if (pattern.test(content)) {
    const matches = content.match(pattern);
    console.log(`✅ Encontrado: ${description} (${matches?.length || 0} ocorrências)`);
    
    content = content.replace(pattern, replacement);
    changes++;
  }
});

// 3. Adicionar função de teste de migração no componente principal
const componentFunction = 'export default function HotelsHome() {';
if (content.includes(componentFunction)) {
  const testMigrationCode = `
  // 🧪 TESTE DE MIGRAÇÃO - API v2/v1
  const testMigration = async () => {
    console.log('🧪 Testando migração de hotéis...');
    try {
      // Testar busca com fallback
      const result = await hotelService.search({ location: 'Maputo', guests: 2 });
      console.log('✅ Teste migração:', {
        source: result.source,
        count: result.count,
        success: result.success
      });
      
      toast({
        title: result.source === 'v2' ? '✅ API v2 funcionando' : '🔄 Usando API v1 (fallback)',
        description: \`\${result.count} hotéis encontrados via \${result.source}\`,
      });
    } catch (error) {
      console.error('❌ Teste migração falhou:', error);
    }
  };
  
  // Executar teste na montagem (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🏨 [MIGRAÇÃO] Componente home.tsx migrado');
      // testMigration(); // Descomente para testar automaticamente
    }
  }, []);
  `;
  
  // Inserir após o início da função principal
  const functionStartIndex = content.indexOf(componentFunction) + componentFunction.length;
  const beforeContent = content.substring(0, functionStartIndex);
  const afterContent = content.substring(functionStartIndex);
  
  // Encontrar onde começa o primeiro useState/useEffect
  const firstHookMatch = afterContent.match(/(const|useState|useEffect|useQuery)/);
  if (firstHookMatch) {
    const insertIndex = firstHookMatch.index || 0;
    const newAfterContent = afterContent.substring(0, insertIndex) + 
                          testMigrationCode + 
                          afterContent.substring(insertIndex);
    
    content = beforeContent + newAfterContent;
    console.log('✅ Adicionado teste de migração');
    changes++;
  }
}

// 4. Salvar se houver mudanças
if (changes > 0) {
  fs.writeFileSync(filePath, content);
  console.log(`\n🎉 ${changes} alterações aplicadas com sucesso!`);
  
  // Criar relatório
  const report = `# RELATÓRIO DE MIGRAÇÃO - home.tsx
## Data: ${new Date().toISOString()}

## Alterações realizadas:
${fetchReplacements.filter(r => content.includes(r.description)).map(r => `- ✅ ${r.description}`).join('\n')}

## Arquivos:
- Original: ${backupPath}
- Migrado: ${filePath}

## Próximos passos:

### 1. TESTE AS FUNÇÕES MIGRADAS:
\`\`\`bash
npm run dev
# Acesse: http://localhost:5173/hotels-app
\`\`\`

### 2. VERIFIQUE O CONSOLE (F12):
- Deve ver logs como: "[Migrado] Buscando quartos do hotel:"
- Se vir "[MIGRAÇÃO] Componente home.tsx migrado" = sucesso!

### 3. TESTE A API v2:
\`\`\`bash
# Teste diretamente
curl "http://localhost:8000/api/v2/hotels/search?location=Maputo&limit=1"
\`\`\`

### 4. DESCOMENTE O TESTE AUTOMÁTICO:
No arquivo migrado, procure por:
\`\`\`typescript
// testMigration(); // Descomente para testar automaticamente
\`\`\`
Remova os // para testar automaticamente na montagem.

## Notas:
- As substituições mantêm compatibilidade com código existente
- A resposta é adaptada para manter o mesmo formato que fetch
- Fallback automático v2 → v1 está configurado
`;
  
  fs.writeFileSync('migration-home-report.md', report);
  console.log('\n📋 Relatório salvo: migration-home-report.md');
} else {
  console.log('⚠️  Nenhuma alteração necessária - verifique os padrões');
}

console.log('\n🔍 LINHAS MIGRADAS (verifique estas linhas):');
const migratedLines = content.split('\n').map((line, idx) => ({ line, idx: idx + 1 }))
  .filter(({ line }) => line.includes('[Migrado]') || line.includes('hotelService'));
migratedLines.slice(0, 10).forEach(({ line, idx }) => {
  console.log(`  L${idx}: ${line.trim().substring(0, 80)}${line.length > 80 ? '...' : ''}`);
});

console.log('\n🚀 PRONTO! Agora teste o componente migrado.');
