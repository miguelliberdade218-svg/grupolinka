// src/modules/hotels/hotelPartnershipService.ts
// Serviço dedicado às Parcerias entre Hotéis e Motoristas
// Baseado nas tabelas: partnershipProposals e partnershipApplications
// (As funções PL/pgSQL relacionadas ainda não foram implementadas no banco, mas o schema suporta)

import { db } from "../../../db";
import {
  partnershipProposals,
  partnershipApplications,
  users,
  hotels,
} from "../../../shared/schema";
import { eq, and, inArray, desc, asc, sql } from "drizzle-orm";

// ==================== TIPOS ====================
export type PartnershipProposal = typeof partnershipProposals.$inferSelect;
export type PartnershipApplication = typeof partnershipApplications.$inferSelect;

// ==================== PROPOSTAS DE PARCERIA (do hotel) ====================

/**
 * Cria uma nova proposta de parceria (oferta do hotel para motoristas)
 */
export const createPartnershipProposal = async (
  hotelId: string,
  data: {
    title: string;
    description: string;
    province?: string;
    city?: string;
    offerFuel?: boolean;
    offerMeals?: boolean;
    offerFreeAccommodation?: boolean;
    premiumRate?: number;
    minimumDriverLevel?: "bronze" | "silver" | "gold" | "platinum";
    requiredVehicleType?: string;
    endDate: string; // data limite da oferta
  }
): Promise<PartnershipProposal> => {
  const proposalData = {
    hotelId,
    title: data.title,
    description: data.description,
    status: "active" as const,
    startDate: sql`NOW()`,
    endDate: data.endDate,
    province: data.province || null,
    city: data.city || null,
    offerFuel: data.offerFuel ?? false,
    offerMeals: data.offerMeals ?? false,
    offerFreeAccommodation: data.offerFreeAccommodation ?? false,
    premiumRate: data.premiumRate?.toString() || "0",
    minimumDriverLevel: data.minimumDriverLevel || "bronze",
    requiredVehicleType: data.requiredVehicleType || "any",
    currentApplicants: 0,
  };

  const [proposal] = await db
    .insert(partnershipProposals)
    .values(proposalData)
    .returning();

  return proposal;
};

/**
 * Lista todas as propostas ativas de um hotel
 */
export const getActiveProposalsByHotel = async (hotelId: string): Promise<PartnershipProposal[]> => {
  const today = new Date().toISOString().split("T")[0];

  return await db
    .select()
    .from(partnershipProposals)
    .where(
      and(
        eq(partnershipProposals.hotelId, hotelId),
        eq(partnershipProposals.status, "active"),
        sql`${partnershipProposals.endDate}::date >= ${today}::date`
      )
    )
    .orderBy(desc(partnershipProposals.createdAt));
};

/**
 * Lista todas as propostas de um hotel (incluindo expiradas)
 */
export const getAllProposalsByHotel = async (hotelId: string): Promise<PartnershipProposal[]> => {
  return await db
    .select()
    .from(partnershipProposals)
    .where(eq(partnershipProposals.hotelId, hotelId))
    .orderBy(desc(partnershipProposals.createdAt));
};

// ==================== CANDIDATURAS (dos motoristas) ====================

/**
 * Motorista candidata-se a uma proposta
 */
export const applyToPartnership = async (
  proposalId: string,
  driverId: string,
  message?: string
): Promise<PartnershipApplication> => {
  // Verifica se a proposta existe e está ativa
  const [proposal] = await db
    .select()
    .from(partnershipProposals)
    .where(eq(partnershipProposals.id, proposalId));

  if (!proposal || proposal.status !== "active") {
    throw new Error("Proposta inválida ou já expirada");
  }

  // Verifica se já aplicou
  const existing = await db
    .select()
    .from(partnershipApplications)
    .where(
      and(
        eq(partnershipApplications.proposalId, proposalId),
        eq(partnershipApplications.driverId, driverId)
      )
    );

  if (existing.length > 0) {
    throw new Error("Já se candidatou a esta parceria");
  }

  const applicationData = {
    proposalId,
    driverId,
    status: "pending" as const,
    applicationDate: sql`NOW()`,
    message: message || null,
  };

  const [application] = await db
    .insert(partnershipApplications)
    .values(applicationData)
    .returning();

  // Incrementa contador de candidatos na proposta
  await db
    .update(partnershipProposals)
    .set({
      currentApplicants: sql`${partnershipProposals.currentApplicants} + 1`,
    })
    .where(eq(partnershipProposals.id, proposalId));

  return application;
};

/**
 * Lista todas as candidaturas a uma proposta específica
 */
export const getApplicationsForProposal = async (
  proposalId: string
): Promise<(PartnershipApplication & { driver: typeof users.$inferSelect })[]> => {
  return await db
    .select({
      application: partnershipApplications,
      driver: users,
    })
    .from(partnershipApplications)
    .innerJoin(users, eq(users.id, partnershipApplications.driverId))
    .where(eq(partnershipApplications.proposalId, proposalId))
    .orderBy(desc(partnershipApplications.applicationDate));
};

/**
 * Host aceita ou rejeita uma candidatura
 */
export const reviewApplication = async (
  applicationId: string,
  status: "accepted" | "rejected",
  reviewedByHostId: string
): Promise<PartnershipApplication> => {
  const validStatuses = ["accepted", "rejected"] as const;
  if (!validStatuses.includes(status)) {
    throw new Error("Status inválido");
  }

  const [application] = await db
    .update(partnershipApplications)
    .set({
      status,
      acceptedAt: status === "accepted" ? sql`NOW()` : null,
    })
    .where(eq(partnershipApplications.id, applicationId))
    .returning();

  // Opcional: log ou notificação aqui

  return application;
};

/**
 * Lista candidaturas pendentes para as propostas de um hotel
 */
export const getPendingApplicationsForHotel = async (hotelId: string) => {
  return await db
    .select({
      application: partnershipApplications,
      driver: users,
      proposal: partnershipProposals,
    })
    .from(partnershipApplications)
    .innerJoin(partnershipProposals, eq(partnershipProposals.id, partnershipApplications.proposalId))
    .innerJoin(users, eq(users.id, partnershipApplications.driverId))
    .where(
      and(
        eq(partnershipProposals.hotelId, hotelId),
        eq(partnershipApplications.status, "pending")
      )
    )
    .orderBy(desc(partnershipApplications.applicationDate));
};

/**
 * Lista parcerias ativas (candidaturas aceites) de um hotel
 */
export const getActivePartnershipsForHotel = async (hotelId: string) => {
  return await db
    .select({
      application: partnershipApplications,
      driver: users,
      proposal: partnershipProposals,
    })
    .from(partnershipApplications)
    .innerJoin(partnershipProposals, eq(partnershipProposals.id, partnershipApplications.proposalId))
    .innerJoin(users, eq(users.id, partnershipApplications.driverId))
    .where(
      and(
        eq(partnershipProposals.hotelId, hotelId),
        eq(partnershipApplications.status, "accepted")
      )
    );
};