// ./shared/event-validation.ts
import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  eventType: z.string().min(1, "Tipo de evento é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  venue: z.string().min(1, "Local é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isPaid: z.boolean().default(false),
  ticketPrice: z.number().min(0).default(0),
  maxTickets: z.number().min(1).default(100),
  maxAttendees: z.number().optional(),
  organizerName: z.string().optional(),
  organizerContact: z.string().optional(),
  organizerEmail: z.string().email().optional(),
  images: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(false), // ← CAMPO ADICIONADO
  status: z.enum(["pending", "approved", "upcoming", "ongoing", "completed", "cancelled"]).default("pending"),
  tags: z.array(z.string()).default([]),
  organizerId: z.string().min(1, "Organizador é obrigatório")
});

export const validateEventData = (data: any) => {
  try {
    const validatedData = eventSchema.parse(data);
    return {
      isValid: true,
      errors: [],
      validatedData: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message),
        validatedData: null
      };
    }
    return {
      isValid: false,
      errors: ["Erro de validação desconhecido"],
      validatedData: null
    };
  }
};