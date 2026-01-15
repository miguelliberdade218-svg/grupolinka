const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Full Stack Link-A...');

// Iniciar Backend
console.log('📡 Iniciando Backend na porta 3001...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001', NODE_ENV: 'development' }
});

// Aguardar um pouco para o backend inicializar
setTimeout(() => {
  console.log('🎨 Iniciando Frontend na porta 5000...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit'
  });

  // Cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando aplicação...');
    backend.kill();
    frontend.kill();
    process.exit();
  });
}, 3000);