import { Router } from "express";
import { storage } from "./storage";
import { verifyFirebaseToken, type AuthenticatedRequest } from "./src/shared/firebaseAuth";

const router = Router();

// Process payment
router.post("/process", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const {
      bookingId,
      serviceType,
      subtotal,
      platformFee,
      total,
      paymentMethod,
      cardDetails,
      mpesaNumber,
      bankAccount,
    } = req.body;

    // Validate required fields
    if (!bookingId || !serviceType || !subtotal || !paymentMethod) {
      return res.status(400).json({ 
        error: "Missing required payment information" 
      });
    }

    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    // Verificar se a reserva existe
    const booking = await storage.booking.getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // Verificar se o usuário tem permissão
    if (booking.passengerId !== userId) {
      return res.status(403).json({ error: "Sem permissão para processar este pagamento" });
    }

    // Processar pagamento real usando o storage
    try {
      const paymentData = {
        amount: Number(total),
        method: paymentMethod,
        details: cardDetails || { mpesaNumber, bankAccount }
      };

      const payment = await storage.booking.processPayment(bookingId, paymentData);
      
      // Atualizar status da reserva
      await storage.booking.updateBookingStatus(bookingId, 'confirmed');

      const transaction = {
        id: payment.id,
        bookingId,
        userId,
        serviceType,
        subtotal: Number(subtotal),
        platformFee: Number(platformFee),
        total: Number(total),
        paymentMethod,
        paymentStatus: payment.status,
        paymentReference: payment.transactionId,
        paidAt: payment.status === "completed" ? new Date() : null,
        createdAt: new Date(),
      };

      res.json({
        success: true,
        transaction,
        payment,
        message: payment.status === "completed" ? "Pagamento processado com sucesso" : "Pagamento iniciado"
      });
    } catch (paymentError) {
      console.error("Payment processing error:", paymentError);
      res.status(500).json({ error: "Erro ao processar pagamento" });
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ 
      error: "Failed to process payment" 
    });
  }
});

// Get payment methods for user
router.get("/methods", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    // Get user's real payment methods (placeholder implementation)
    const paymentMethods = [
      {
        id: "mpesa",
        type: "mpesa",
        label: "M-Pesa",
        isDefault: true,
        isActive: true,
      },
      {
        id: "bank", 
        type: "bank",
        label: "Transferência Bancária",
        isDefault: false,
        isActive: true,
      },
    ];

    res.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ 
      error: "Failed to fetch payment methods" 
    });
  }
});

// Get transaction history
router.get("/transactions", async (req, res) => {
  try {
    const { page = 1, limit = 20, serviceType } = req.query;
    
    // Mock transaction history
    const transactions = [
      {
        id: "trans_1",
        bookingId: "booking_1",
        serviceType: "ride",
        serviceName: "Maputo → Matola",
        subtotal: 15000, // 150.00 MZN
        platformFee: 1500, // 15.00 MZN  
        total: 16500, // 165.00 MZN
        paymentMethod: "card",
        paymentStatus: "completed",
        paidAt: new Date("2024-08-20"),
        createdAt: new Date("2024-08-20"),
      },
      {
        id: "trans_2",
        bookingId: "booking_2", 
        serviceType: "accommodation",
        serviceName: "Hotel Costa do Sol - 2 noites",
        subtotal: 80000, // 800.00 MZN
        platformFee: 8000, // 80.00 MZN
        total: 88000, // 880.00 MZN
        paymentMethod: "mpesa",
        paymentStatus: "completed",
        paidAt: new Date("2024-08-18"),
        createdAt: new Date("2024-08-18"),
      },
    ];

    // Apply filters
    let filteredTransactions = transactions;
    if (serviceType && serviceType !== 'all') {
      filteredTransactions = transactions.filter(t => t.serviceType === serviceType);
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    res.json({
      transactions: paginatedTransactions,
      total: filteredTransactions.length,
      page: Number(page),
      totalPages: Math.ceil(filteredTransactions.length / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ 
      error: "Failed to fetch transactions" 
    });
  }
});

// Refund transaction
router.post("/refund", async (req, res) => {
  try {
    const { transactionId, reason } = req.body;
    
    if (!transactionId || !reason) {
      return res.status(400).json({ 
        error: "Transaction ID and reason are required" 
      });
    }

    // Mock refund processing
    const refund = {
      id: `refund_${Date.now()}`,
      transactionId,
      reason,
      status: "processing",
      refundedAt: null,
      createdAt: new Date(),
    };

    console.log("Refund initiated:", refund);

    res.json({
      success: true,
      refund,
      message: "Refund request has been initiated and will be processed within 3-5 business days.",
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    res.status(500).json({ 
      error: "Failed to process refund" 
    });
  }
});

export default router;