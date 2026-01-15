import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Verificar saúde do backend na inicialização
(async () => {
  try {
    // ✅ CORREÇÃO: Usar URL absoluta do backend
    const response = await fetch('http://localhost:8000/api/health');
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Backend conectado:', health.status);
    } else {
      console.log('⚠️ Backend respondendo com erro, mas continuando...');
    }
  } catch (error) {
    console.log('⚠️ Backend não alcançável, continuando com funcionalidade limitada');
    // Não é crítico - a aplicação pode funcionar em modo offline
  }
})();

createRoot(document.getElementById("root")!).render(<App />);