// src/modules/admin/adminRidesController.ts
// 🚗 FASE 4 — Endpoint admin para listar TODAS as rides (incluindo canceladas + motivo)
//
// Montado dentro do adminRouter (index.ts) em:  /api/admin/rides
//   GET /api/admin/rides          → lista rides (filtros: status, driverId, limit, offset)
//   GET /api/admin/rides/stats     → contagem por status (badges do frontend)
//
// Autenticação: verifyFirebaseToken + adminOnly são aplicados no index.ts (mount).
// Aqui os caminhos são RELATIVOS ao prefixo "/rides".

import { Router, Request, Response } from "express";
import { db } from "../../../db";
import { rides, users, vehicles } from "../../../shared/schema";
import { eq, and, desc, count, inArray } from "drizzle-orm";

const router = Router();

/**
 * Normaliza o filtro de status vindo do frontend.
 *   'all'|'todas'              → null (sem filtro)
 *   'active'|'ativas'          → [pending, active, available, confirmed, in_progress]
 *   'cancelled'|'canceladas'   → [cancelled]
 *   'completed'|'completas'    → [completed]
 *   outro valor                → [valor] (assume status válido do enum)
 */
function resolveStatusFilter(status?: string): string[] | null {
  if (!status || status === "all" || status === "todas") return null;

  switch (status) {
    case "active":
    case "ativas":
      return ["pending", "active", "available", "confirmed", "in_progress"];
    case "cancelled":
    case "canceladas":
      return ["cancelled"];
    case "completed":
    case "completas":
      return ["completed"];
    default:
      return [status];
  }
}

/**
 * GET /api/admin/rides
 * Lista todas as rides com dados do motorista (users) e do veículo (vehicles).
 * Inclui rides canceladas, com cancellation_reason e cancelled_at.
 *
 * Query params:
 *   status   : all | active | cancelled | completed  (ou status direto do enum)
 *   driverId : filtrar por motorista
 *   limit    : default 50 (máx 200)
 *   offset   : default 0
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      status,
      driverId,
      limit = "50",
      offset = "0",
    } = req.query as Record<string, string | undefined>;

    const limitNum = Math.min(Math.max(parseInt(limit || "50", 10) || 50, 1), 200);
    const offsetNum = Math.max(parseInt(offset || "0", 10) || 0, 0);

    const statusList = resolveStatusFilter(status);

    const conditions: any[] = [];
    if (statusList && statusList.length === 1) {
      conditions.push(eq(rides.status, statusList[0] as any));
    } else if (statusList && statusList.length > 1) {
      conditions.push(inArray(rides.status, statusList as any[]));
    }
    if (driverId) {
      conditions.push(eq(rides.driverId, driverId));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: rides.id,
          fromCity: rides.fromCity,
          toCity: rides.toCity,
          fromProvince: rides.fromProvince,
          toProvince: rides.toProvince,
          status: rides.status,
          departureDate: rides.departureDate,
          pricePerSeat: rides.pricePerSeat,
          availableSeats: rides.availableSeats,
          cancellation_reason: rides.cancellation_reason,
          cancelled_at: rides.cancelled_at,
          createdAt: rides.createdAt,
          driverId: rides.driverId,
          driver_name: rides.driverName,
          driver_first_name: users.firstName,
          driver_last_name: users.lastName,
          driver_email: users.email,
          driver_full_name: users.fullName,
          plate_number: vehicles.plate_number,
          vehicle_make: vehicles.make,
          vehicle_model: vehicles.model,
        })
        .from(rides)
        .leftJoin(users, eq(rides.driverId, users.id))
        .leftJoin(vehicles, eq(rides.vehicle_uuid, vehicles.id))
        .where(whereClause)
        .orderBy(desc(rides.createdAt))
        .limit(limitNum)
        .offset(offsetNum),

      db.select({ count: count() }).from(rides).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    // Normaliza nome do motorista: driverName → first+last → fullName → email
    const data = rows.map((r) => {
      const composed = [r.driver_first_name, r.driver_last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      const driver_name =
        r.driver_name || composed || r.driver_full_name || r.driver_email || "—";

      return {
        id: r.id,
        from_city: r.fromCity,
        to_city: r.toCity,
        from_province: r.fromProvince,
        to_province: r.toProvince,
        status: r.status,
        departure_date: r.departureDate,
        price_per_seat: r.pricePerSeat,
        available_seats: r.availableSeats,
        cancellation_reason: r.cancellation_reason,
        cancelled_at: r.cancelled_at,
        created_at: r.createdAt,
        driver_id: r.driverId,
        driver_name,
        driver_email: r.driver_email,
        plate_number: r.plate_number,
        vehicle_make: r.vehicle_make,
        vehicle_model: r.vehicle_model,
      };
    });

    return res.json({
      success: true,
      data,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("❌ Erro em GET /api/admin/rides:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao listar rides",
    });
  }
});

/**
 * GET /api/admin/rides/stats
 * Contagem por status (para badges/filtros do frontend).
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        status: rides.status,
        count: count(),
      })
      .from(rides)
      .groupBy(rides.status);

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      const s = r.status || "unknown";
      byStatus[s] = Number(r.count || 0);
      total += Number(r.count || 0);
    }

    return res.json({
      success: true,
      data: {
        total,
        by_status: byStatus,
        cancelled: byStatus["cancelled"] || 0,
        completed: byStatus["completed"] || 0,
      },
    });
  } catch (error) {
    console.error("❌ Erro em GET /api/admin/rides/stats:", error);
    return res
      .status(500)
      .json({ success: false, message: "Erro ao buscar stats de rides" });
  }
});

export default router;