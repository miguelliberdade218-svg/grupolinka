#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando Backend Link-A...');

// Mudar para o diretório backend
process.chdir(path.join(__dirname, 'backend'));

// Executar npm run dev
const backend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env }
});

backend.on('close', (code) => {
  console.log(`Backend encerrado com código ${code}`);
  process.exit(code);
});

backend.on('error', (err) => {
  console.error('❌ Erro ao iniciar backend:', err);
  process.exit(1);
});