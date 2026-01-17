import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/apps/main-app/pages/home.tsx';
let content = readFileSync(filePath, 'utf8');

// Corrigir o texto específico
content = content.replace(/GestA.{0,3} de HotAcis/g, 'Gestão de Hotéis');

// Corrigir outros problemas comuns
content = content.replace(/HotAcis/g, 'Hotéis');
content = content.replace(/MoA.{0,2}ambique/g, 'Moçambique');
content = content.replace(/DisponA-veis/g, 'Disponíveis');
content = content.replace(/EspaA.{0,2}os/g, 'Espaços');

writeFileSync(filePath, content, 'utf8');
console.log('Arquivo corrigido!');