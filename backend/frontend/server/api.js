// Servidor API integrado para desenvolvimento
import express from "express";
import cors from "cors";

// Armazenamento em memória para as rotas
let routes = [
  {
    id: "1",
    type: "Standard",
    fromAddress: "Maputo",
    toAddress: "Matola",
    price: "50.00",
    estimatedDuration: 30,
    availableSeats: 3,
    driverName: "João Silva",
    vehicleInfo: "Toyota Corolla Branco",
    departureDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: "published",
  },
];

export function createApiServer() {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/health", (req, res) => {
    console.log("✅ Health check");
    res.json({
      status: "OK",
      message: "Link-A Backend API funcionando",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      environment: "development",
      totalRoutes: routes.length,
    });
  });

  // Buscar viagens (GET)
  app.get("/api/rides/search", (req, res) => {
    const { from, to, passengers = 1 } = req.query;
    console.log(
      `🔍 Buscar viagens: de ${from} para ${to}, ${passengers} passageiros`,
    );

    // Filtrar rotas baseado nos parâmetros
    let filteredRoutes = routes;

    if (from) {
      filteredRoutes = filteredRoutes.filter((route) =>
        route.fromAddress.toLowerCase().includes(from.toLowerCase()),
      );
    }

    if (to) {
      filteredRoutes = filteredRoutes.filter((route) =>
        route.toAddress.toLowerCase().includes(to.toLowerCase()),
      );
    }

    res.json({
      rides: filteredRoutes,
      pagination: {
        page: 1,
        limit: 20,
        total: filteredRoutes.length,
      },
      searchParams: { from, to, passengers },
    });
  });

  // Criar nova rota (POST)
  app.post("/api/simplified-rides/create", (req, res) => {
    console.log("📝 POST /api/simplified-rides/create - Criando nova rota");
    console.log("Dados recebidos:", req.body);

    try {
      // Validar dados obrigatórios
      const { from, to, price, date, time, seats, vehicleType } = req.body;

      if (!from || !to || !price) {
        return res.status(400).json({
          error: "Dados obrigatórios faltando",
          message: "De onde, Para onde e Preço são obrigatórios",
          missingFields: {
            from: !from,
            to: !to,
            price: !price,
          },
        });
      }

      // Criar nova rota
      const newRoute = {
        id: Date.now().toString(),
        type: vehicleType || "Standard",
        fromAddress: from,
        toAddress: to,
        price: price.toString(),
        estimatedDuration: 45, // Estimativa padrão
        availableSeats: parseInt(seats) || 4,
        driverName: "Motorista Atual", // Placeholder - em produção viria do usuário autenticado
        vehicleInfo: `${vehicleType || "Veículo"} - Disponível`,
        departureDate:
          date && time ? `${date}T${time}:00.000Z` : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "published",
        ...req.body,
      };

      // Adicionar à lista
      routes.push(newRoute);

      console.log("✅ Nova rota criada:", newRoute);

      res.status(201).json({
        success: true,
        message: "Rota publicada com sucesso!",
        route: newRoute,
        totalRoutes: routes.length,
      });
    } catch (error) {
      console.error("❌ Erro ao criar rota:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Listar todas as rotas
  app.get("/api/rides-simple/create", (req, res) => {
    console.log("📋 GET /api/rides-simple/create - Listar todas as rotas");
    res.json({
      rides: routes,
      total: routes.length,
      timestamp: new Date().toISOString(),
    });
  });

  // Middleware para rotas não encontradas
  app.use("/api/*", (req, res) => {
    console.log(`❌ Endpoint não encontrado: ${req.method} ${req.path}`);
    res.status(404).json({
      error: "Endpoint não encontrado",
      method: req.method,
      path: req.path,
      availableEndpoints: [
        "GET /api/health",
        "GET /api/rides/search",
        "POST /api/rides-simple/create",
        "GET /api/rides",
      ],
    });
  });

  return app;
}

// Função para inicializar o servidor
export function startApiServer(port = 3001) {
  const app = createApiServer();

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Link-A API Server running on port ${port}`);
    console.log(`🏥 Health: http://localhost:${port}/api/health`);
    console.log(`🚗 Rides: http://localhost:${port}/api/rides`);
    console.log("✅ Backend API funcionando corretamente");
  });

  return server;
}
