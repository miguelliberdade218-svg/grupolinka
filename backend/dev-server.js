// dev-server.js - Servidor de desenvolvimento que roda backend + frontend
import express from 'express';
import { createServer } from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando servidor de desenvolvimento Link-A...');

// Função para iniciar o backend
function startBackend() {
  console.log('📦 Iniciando backend...');
  
  const backendProcess = spawn('node', ['backend/dist/index.js'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[BACKEND] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR] ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`[BACKEND] Processo encerrado com código ${code}`);
  });

  return backendProcess;
}

// Função para iniciar o frontend
function startFrontend() {
  console.log('🎨 Iniciando frontend...');
  
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: 'frontend',
    stdio: 'pipe',
    shell: true
  });

  frontendProcess.stdout.on('data', (data) => {
    console.log(`[FRONTEND] ${data}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(`[FRONTEND ERROR] ${data}`);
  });

  frontendProcess.on('close', (code) => {
    console.log(`[FRONTEND] Processo encerrado com código ${code}`);
  });

  return frontendProcess;
}

// Compilar backend primeiro
console.log('🔨 Compilando backend...');
const buildProcess = spawn('npm', ['run', 'build'], {
  cwd: 'backend',
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Backend compilado com sucesso');
    
    // Iniciar backend e frontend
    const backendProcess = startBackend();
    const frontendProcess = startFrontend();

    // Manipular encerramento
    process.on('SIGINT', () => {
      console.log('🛑 Encerrando servidores...');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });

  } else {
    console.error('❌ Falha ao compilar backend');
    process.exit(1);
  }
});