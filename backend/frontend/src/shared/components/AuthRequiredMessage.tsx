export default function AuthRequiredMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Autenticação Necessária
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Precisa estar logado para acessar esta página.
        </p>
        <a
          href="/api/login"
          className="inline-block bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          data-testid="button-login-required"
        >
          Iniciar Sessão
        </a>
      </div>
    </div>
  );
}