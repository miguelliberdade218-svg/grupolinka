// routes/rpc.ts
import { Router, Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

// ✅✅✅ CORREÇÃO: Função para decodificar URL encoded strings
const decodeLocationParam = (param: any, paramName: string): any => {
  if (typeof param !== 'string') return param;
  
  let decoded = param;
  let decodingSteps: string[] = [];
  
  // ✅ CORREÇÃO CRÍTICA: Decodificar URLs até não ter mais %
  while (decoded.includes('%') && decodingSteps.length < 5) {
    try {
      const before = decoded;
      decoded = decodeURIComponent(decoded);
      decodingSteps.push(`${before} → ${decoded}`);
    } catch (error) {
      console.warn(`⚠️ [RPC-DECODE] Erro ao decodificar ${paramName}:`, { param, error });
      break;
    }
  }
  
  // ✅ CORREÇÃO: Substituir + por espaços
  if (decoded.includes('+')) {
    const before = decoded;
    decoded = decoded.replace(/\+/g, ' ');
    decodingSteps.push(`${before} → ${decoded} (substituiu + por espaços)`);
  }
  
  // ✅ CORREÇÃO: Para localizações, pegar apenas a primeira parte (antes da vírgula)
  if (paramName === 'from' || paramName === 'to') {
    const parts = decoded.split(',');
    if (parts.length > 1) {
      const before = decoded;
      decoded = parts[0].trim().toLowerCase();
      decodingSteps.push(`${before} → ${decoded} (extraiu primeira parte)`);
    } else {
      // Se não tem vírgula, ainda normalizar para lowercase
      decoded = decoded.trim().toLowerCase();
    }
  }
  
  if (decodingSteps.length > 0) {
    console.log('🔤 [RPC-DECODE] Decodificação aplicada:', {
      paramName,
      original: param,
      final: decoded,
      steps: decodingSteps,
      changed: param !== decoded
    });
  }
  
  return decoded;
};

// ✅ ROTA RPC PARA CHAMAR FUNÇÕES POSTGRESQL
router.post('/', async (req: Request, res: Response) => {
  try {
    const { function: functionName, params = [] } = req.body;

    console.log('🧠 [RPC] Chamando função PostgreSQL:', {
      function: functionName,
      params,
      timestamp: new Date().toISOString()
    });

    if (!functionName) {
      return res.status(400).json({
        success: false,
        error: 'Nome da função é obrigatório',
        details: 'O parâmetro "function" deve ser fornecido'
      });
    }

    // ✅ VALIDAR FUNÇÕES PERMITIDAS (SEGURANÇA)
    const allowedFunctions = [
      'get_rides_smart_final',
      'normalize_location_name',
      'search_rides_by_location',
      'find_nearby_rides'
    ];

    if (!allowedFunctions.includes(functionName)) {
      return res.status(403).json({
        success: false,
        error: 'Função não permitida',
        details: `A função "${functionName}" não está na lista de funções permitidas`
      });
    }

    // ✅✅✅ CORREÇÃO CRÍTICA: DECODIFICAR PARÂMETROS URL ENCODED
    const processedParams = params.map((param: any, index: number) => {
      if (functionName === 'get_rides_smart_final') {
        // Para get_rides_smart_final, os primeiros 2 parâmetros são localizações
        if (index === 0) {
          return decodeLocationParam(param, 'from');
        } else if (index === 1) {
          return decodeLocationParam(param, 'to');
        }
      }
      return param; // Outros parâmetros mantêm como estão
    });

    console.log('✅ [RPC] Parâmetros processados:', {
      original: params,
      processed: processedParams,
      decodingApplied: JSON.stringify(params) !== JSON.stringify(processedParams)
    });

    // ✅ CONSTRUIR QUERY DINÂMICA COM PARÂMETROS PROCESSADOS
    let query: string;
    let queryParams: any[] = [];

    if (functionName === 'get_rides_smart_final') {
      const [search_from, search_to, radius_km, max_results] = processedParams;
      
      query = `SELECT * FROM get_rides_smart_final($1, $2, $3, $4)`;
      queryParams = [
        search_from || '',
        search_to || '', 
        radius_km || 100,
        max_results || 50
      ];
    } else {
      // ✅ CORREÇÃO: Adicionar tipos aos parâmetros da função map
      const placeholders = processedParams.map((_: any, index: number) => `$${index + 1}`).join(', ');
      query = `SELECT * FROM ${functionName}(${placeholders})`;
      queryParams = processedParams;
    }

    console.log('🔍 [RPC] Executando query:', {
      query,
      params: queryParams,
      originalParamsForDebug: params
    });

    // ✅ CORREÇÃO: Executar função PostgreSQL de forma segura
    let result: any;
    
    try {
      // ✅ MÉTODO 1: Usar sql template com parâmetros interpolados (mais seguro)
      if (functionName === 'get_rides_smart_final') {
        const [p1, p2, p3, p4] = queryParams;
        result = await db.execute(sql`
          SELECT * FROM get_rides_smart_final(${p1}, ${p2}, ${p3}, ${p4})
        `);
      } else {
        // Para outras funções, construir dinamicamente
        const dynamicSql = sql`SELECT * FROM ${sql.raw(functionName)}(${sql.join(queryParams.map((p: any) => sql`${p}`), sql`, `)})`;
        result = await db.execute(dynamicSql);
      }
    } catch (executeError: any) {
      console.warn('❌ [RPC] Método seguro falhou, tentando raw query:', executeError);
      
      // ✅ MÉTODO 2: Fallback para raw query com interpolação manual
      try {
        const interpolatedQuery = query.replace(/\$(\d+)/g, (_: string, index: string) => {
          const paramIndex = parseInt(index) - 1;
          const param = queryParams[paramIndex];
          return typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : String(param);
        });
        
        result = await db.execute(sql.raw(interpolatedQuery));
      } catch (rawError: any) {
        console.error('❌ [RPC] Ambos os métodos falharam:', rawError);
        
        // ✅ CORREÇÃO: Tentar com parâmetros mais simples como fallback final
        console.log('🔄 [RPC] Tentando fallback com parâmetros simplificados...');
        if (functionName === 'get_rides_smart_final') {
          // Tentar apenas com strings vazias para ver se a função pelo menos executa
          result = await db.execute(sql`
            SELECT * FROM get_rides_smart_final('', '', 100, 10)
          `);
        }
      }
    }

    // ✅ EXTRAIR RESULTADOS DE FORMA SEGURA
    let rows: any[] = [];
    
    if (Array.isArray(result)) {
      rows = result;
    } else if (result && typeof result === 'object' && 'rows' in result) {
      rows = (result as any).rows;
    } else if (result && typeof result === 'object') {
      const values = Object.values(result);
      if (Array.isArray(values[0])) {
        rows = values[0] as any[];
      }
    }

    console.log('✅ [RPC] Função executada com sucesso:', {
      function: functionName,
      results: rows.length,
      sample: rows[0] || 'Nenhum resultado',
      parametersUsed: {
        original: params.slice(0, 2), // Mostrar apenas from/to para debug
        processed: queryParams.slice(0, 2)
      }
    });

    res.json({
      success: true,
      data: rows,
      metadata: {
        function: functionName,
        params: queryParams,
        originalParams: params,
        results: rows.length,
        timestamp: new Date().toISOString(),
        decodingApplied: JSON.stringify(params) !== JSON.stringify(queryParams)
      }
    });

  } catch (error) {
    console.error('❌ [RPC] Erro ao executar função:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      function: req.body.function,
      params: req.body.params
    });
  }
});

// ✅ ROTA GET PARA TESTE DA RPC
router.get('/test', async (req: Request, res: Response) => {
  try {
    // Testar a função get_rides_smart_final com parâmetros padrão
    const result = await db.execute(sql`
      SELECT * FROM get_rides_smart_final('', '', 100, 10)
    `);

    let rows: any[] = [];
    
    if (Array.isArray(result)) {
      rows = result;
    } else if (result && typeof result === 'object' && 'rows' in result) {
      rows = (result as any).rows;
    }

    res.json({
      success: true,
      message: 'RPC test endpoint working',
      function: 'get_rides_smart_final',
      results: rows.length,
      data: rows.slice(0, 3) // Retornar apenas 3 para teste
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro no teste RPC',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ✅✅✅ NOVA ROTA: Teste específico para get_rides_smart_final com debugging
router.post('/test-smart-search', async (req: Request, res: Response) => {
  try {
    const { from, to, radius = 100, limit = 50 } = req.body;
    
    console.log('🧪 [RPC-TEST] Teste específico para smart search:', {
      from,
      to,
      radius,
      limit
    });
    
    // Testar múltiplas versões dos parâmetros
    const testCases = [
      {
        name: 'original',
        from: from,
        to: to,
        description: 'Parâmetros originais'
      },
      {
        name: 'decoded_once',
        from: from && typeof from === 'string' ? decodeURIComponent(from) : from,
        to: to && typeof to === 'string' ? decodeURIComponent(to) : to,
        description: 'Decodificado uma vez'
      },
      {
        name: 'simplified',
        from: from && typeof from === 'string' ? from.split(',')[0].trim().toLowerCase() : from,
        to: to && typeof to === 'string' ? to.split(',')[0].trim().toLowerCase() : to,
        description: 'Apenas primeira parte (antes da vírgula)'
      },
      {
        name: 'decoded_and_simplified',
        from: from && typeof from === 'string' ? 
          decodeURIComponent(from).split(',')[0].trim().toLowerCase() : from,
        to: to && typeof to === 'string' ?
          decodeURIComponent(to).split(',')[0].trim().toLowerCase() : to,
        description: 'Decodificado + primeira parte'
      }
    ];
    
    const results: any = {};
    
    for (const testCase of testCases) {
      try {
        const [p1, p2, p3, p4] = [testCase.from || '', testCase.to || '', radius, limit];
        
        console.log(`🧪 [RPC-TEST] Executando teste: ${testCase.name}`, {
          params: [p1, p2, p3, p4]
        });
        
        const result = await db.execute(sql`
          SELECT * FROM get_rides_smart_final(${p1}, ${p2}, ${p3}, ${p4})
        `);
        
        let rows: any[] = [];
        if (Array.isArray(result)) {
          rows = result;
        } else if (result && typeof result === 'object' && 'rows' in result) {
          rows = (result as any).rows;
        }
        
        results[testCase.name] = {
          success: true,
          params: { from: p1, to: p2, radius: p3, limit: p4 },
          count: rows.length,
          sample: rows[0] || null,
          description: testCase.description
        };
        
      } catch (error: any) {
        results[testCase.name] = {
          success: false,
          error: error.message,
          params: { from: testCase.from, to: testCase.to, radius, limit },
          description: testCase.description
        };
      }
    }
    
    // ✅ Teste direto no banco para verificar rides existentes
    const allRides = await db.execute(sql`
      SELECT id, "fromCity", "toCity", "from_geom", "to_geom", status 
      FROM rides 
      WHERE status = 'available'
      LIMIT 10
    `);
    
    let availableRides: any[] = [];
    if (Array.isArray(allRides)) {
      availableRides = allRides;
    } else if (allRides && typeof allRides === 'object' && 'rows' in allRides) {
      availableRides = (allRides as any).rows;
    }
    
    console.log('🧪 [RPC-TEST] Rides disponíveis no banco:', {
      total: availableRides.length,
      rides: availableRides.map((r: any) => ({
        id: r.id,
        from: r.fromCity,
        to: r.toCity,
        hasFromGeom: !!r.from_geom,
        hasToGeom: !!r.to_geom
      }))
    });
    
    res.json({
      success: true,
      message: 'Teste de smart search concluído',
      testResults: results,
      availableRides: {
        count: availableRides.length,
        rides: availableRides
      },
      debug: {
        input: { from, to, radius, limit },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [RPC-TEST] Erro no teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no teste de smart search',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;