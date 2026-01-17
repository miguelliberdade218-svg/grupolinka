const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/apps/main-app/pages/home.tsx');

// Ler o arquivo
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler arquivo:', err);
    return;
  }
  
  // Corrigir problemas de encoding
  let corrected = data
    .replace(/GestA渙 de HotAcis/g, 'Gestão de Hotéis')
    .replace(/HotAcis/g, 'Hotéis')
    .replace(/MoA.{0,2}ambique/g, 'Moçambique')
    .replace(/DisponA-veis/g, 'Disponíveis')
    .replace(/EspaA.{0,2}os/g, 'Espaços')
    .replace(/LocalizaA.{0,2}A渙/g, 'Localização')
    .replace(/ExperiA.{0,3}cia/g, 'Experiência')
    .replace(/AnfitriA.{0,2}s/g, 'Anfitriões')
    .replace(/veA-culo/g, 'veículo')
    .replace(/Partida A.{0,2}s/g, 'Partida às')
    .replace(/SaA-da/g, 'Saída')
    .replace(/dY\?/g, '🏨')
    .replace(/dY\?-.{0,2},?/g, '🏖️')
    .replace(/dY.{0,2}\?/g, '🦁')
    .replace(/dYZ.{0,2}/g, (match) => {
      if (match.includes('�')) return '🎵';
      if (match.includes('"')) return '🎨';
      return '🎤';
    })
    .replace(/dY"</g, '📋')
    .replace(/dY>.{0,3},?/g, '🛡️')
    .replace(/dY'.{0,2}/g, (match) => {
      if (match.includes('�')) return '💰';
      return '💡';
    })
    .replace(/dY"�/g, '📱')
    .replace(/dYs\?/g, '🚀')
    .replace(/僶\./g, '✅')
    .replace(/僺��,?/g, '⚠️');
  
  // Escrever o arquivo corrigido
  fs.writeFile(filePath, corrected, 'utf8', (err) => {
    if (err) {
      console.error('Erro ao escrever arquivo:', err);
      return;
    }
    console.log('Arquivo corrigido com sucesso!');
  });
});