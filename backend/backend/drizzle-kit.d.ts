// drizzle-kit.d.ts
declare module 'drizzle-kit' {
  interface Config {
    out: string;
    schema: string;
    dialect?: 'postgresql' | 'mysql' | 'sqlite'; // opcional
    driver?: 'pg' | 'mysql' | 'sqlite';          // ← adicionado driver
    dbCredentials: {
      host?: string;
      user?: string;
      password?: string;
      database?: string;
      port?: number;
      url?: string;
      connectionString?: string;
    };
    verbose?: boolean;
    strict?: boolean;
    breakpoints?: boolean;
  }
  
  export function defineConfig(config: Config): Config;
}