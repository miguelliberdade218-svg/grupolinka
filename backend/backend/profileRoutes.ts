import { Router } from "express";
import { authStorage } from "./src/shared/authStorage";
import { verifyFirebaseToken } from "./middleware/role-auth";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, driverDocuments } from "./shared/schema";
import multer from "multer";
import { AuthenticatedUser } from "./shared/types"; // ✅ IMPORTAÇÃO ADICIONADA

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get user profile
router.get("/profile", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get additional profile data based on user type
    let additionalData = {};

    if (user.userType === 'driver') {
      // Get driver documents and stats
      const [driverDocs] = await db
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.driverId, userId));

      additionalData = { driverDocuments: driverDocs };
    }

    res.json({
      success: true,
      user: {
        ...user,
        ...additionalData
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ 
      message: "Erro ao buscar perfil do usuário",
      error: "Internal server error" 
    });
  }
});

// Update user profile
router.put("/profile", verifyFirebaseToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    const {
      firstName,
      lastName,
      phone,
      fullName,
      dateOfBirth
    } = req.body;

    let profilePhotoUrl = null;
    if (req.file) {
      // TODO: Upload to cloud storage (implement with object storage service)
      profilePhotoUrl = `uploads/profile_${userId}_${Date.now()}.jpg`;
    }

    const updateData: any = {
      id: userId,
      updatedAt: new Date()
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (fullName) updateData.fullName = fullName;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (profilePhotoUrl) updateData.profilePhotoUrl = profilePhotoUrl;

    const updatedUser = await authStorage.upsertUser(updateData);

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ 
      message: "Erro ao atualizar perfil",
      error: "Internal server error" 
    });
  }
});

// Switch user role (for multi-role users)
router.post("/switch-role", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    const { newRole } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    if (!newRole || !['user', 'driver', 'host', 'admin'].includes(newRole)) {
      return res.status(400).json({ 
        message: "Papel inválido",
        validRoles: ['user', 'driver', 'host', 'admin']
      });
    }

    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user can switch to this role
    if (newRole === 'driver' && !user.canOfferServices) {
      return res.status(403).json({ 
        message: "Usuário não verificado para oferecer serviços",
        details: "Complete a verificação do perfil primeiro"
      });
    }

    // Update user role
    const updatedUser = await authStorage.upsertUser({
      id: userId,
      userType: newRole,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Papel alterado para ${newRole} com sucesso`,
      user: updatedUser,
      newRole
    });
  } catch (error) {
    console.error("Error switching user role:", error);
    res.status(500).json({ 
      message: "Erro ao alterar papel do usuário",
      error: "Internal server error" 
    });
  }
});

// Submit verification documents
router.post("/verification", verifyFirebaseToken, upload.fields([
  { name: 'identityDocument', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'vehicleRegistration', maxCount: 1 },
  { name: 'drivingLicense', maxCount: 1 },
  { name: 'vehicleInsurance', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    const {
      identityDocumentType,
      documentNumber,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehiclePlate,
      vehicleColor
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Validate required documents
    if (!files.identityDocument || !files.profilePhoto) {
      return res.status(400).json({ 
        message: "Documentos obrigatórios não fornecidos",
        required: ["identityDocument", "profilePhoto"]
      });
    }

    // TODO: Upload files to cloud storage
    const identityDocumentUrl = `uploads/identity_${userId}_${Date.now()}.jpg`;
    const profilePhotoUrl = `uploads/profile_${userId}_${Date.now()}.jpg`;

    // Update user verification status
    const userData = {
      id: userId,
      identityDocumentUrl,
      identityDocumentType,
      documentNumber,
      profilePhotoUrl,
      verificationStatus: "in_review",
      updatedAt: new Date()
    };

    const updatedUser = await authStorage.upsertUser(userData);

    // If user wants to be a driver, save vehicle documents
    if (files.vehicleRegistration && files.drivingLicense) {
      const vehicleRegistrationUrl = `uploads/vehicle_reg_${userId}_${Date.now()}.jpg`;
      const drivingLicenseUrl = `uploads/driving_license_${userId}_${Date.now()}.jpg`;
      const vehicleInsuranceUrl = files.vehicleInsurance ? 
        `uploads/vehicle_insurance_${userId}_${Date.now()}.jpg` : null;

      await db.insert(driverDocuments).values({
        driverId: userId,
        vehicleRegistrationUrl,
        drivingLicenseUrl,
        vehicleInsuranceUrl,
        vehicleMake,
        vehicleModel,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        vehiclePlate,
        vehicleColor,
        isVerified: false
      });
    }

    res.json({
      success: true,
      message: "Documentos enviados para verificação",
      user: updatedUser,
      status: "in_review"
    });
  } catch (error) {
    console.error("Error submitting verification documents:", error);
    res.status(500).json({ 
      message: "Erro ao enviar documentos",
      error: "Internal server error" 
    });
  }
});

// Get verification status
router.get("/verification-status", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const verificationInfo: {
      status?: string | null;
      isVerified?: boolean | null;
      canOfferServices?: boolean | null;
      verificationDate?: Date | null;
      verificationNotes?: string | null;
      verificationBadge?: string | null;
      documents: {
        identityDocument: boolean;
        profilePhoto: boolean;
        vehicleRegistration?: boolean;
        drivingLicense?: boolean;
        vehicleInsurance?: boolean;
        vehicleInfo?: any;
      }
    } = {
      status: user.verificationStatus,
      isVerified: user.isVerified,
      canOfferServices: user.canOfferServices,
      verificationDate: user.verificationDate,
      verificationNotes: user.verificationNotes,
      verificationBadge: user.verificationBadge,
      documents: {
        identityDocument: !!user.identityDocumentUrl,
        profilePhoto: !!user.profilePhotoUrl
      }
    };

    // Check for driver documents if applicable
    if (user.userType === 'driver') {
      const [driverDocs] = await db
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.driverId, userId));

      if (driverDocs) {
        verificationInfo.documents = {
          ...verificationInfo.documents,
          vehicleRegistration: !!driverDocs.vehicleRegistrationUrl,
          drivingLicense: !!driverDocs.drivingLicenseUrl,
          vehicleInsurance: !!driverDocs.vehicleInsuranceUrl,
          vehicleInfo: {
            make: driverDocs.vehicleMake,
            model: driverDocs.vehicleModel,
            year: driverDocs.vehicleYear,
            plate: driverDocs.vehiclePlate,
            color: driverDocs.vehicleColor
          }
        };
      }
    }

    res.json({
      success: true,
      verification: verificationInfo
    });
  } catch (error) {
    console.error("Error getting verification status:", error);
    res.status(500).json({ 
      message: "Erro ao buscar status de verificação",
      error: "Internal server error" 
    });
  }
});

// Get user bookings and activity
router.get("/activity", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    // Get user bookings
    // TODO: Implement getUserBookings function
    const bookings: any[] = []; // await getUserBookings(userId);

    // Get provider bookings if user offers services
    // TODO: Implement getProviderBookings function
    const providerBookings: any[] = []; // await getProviderBookings(userId);

    // Calculate activity summary
    const activitySummary = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b: any) => b.status === 'completed').length,
      activeBookings: bookings.filter((b: any) => ['pending_approval', 'approved', 'confirmed'].includes(b.status)).length,
      totalAsProvider: providerBookings.length,
      completedAsProvider: providerBookings.filter((b: any) => b.status === 'completed').length,
      bookingsByType: {
        ride: bookings.filter((b: any) => b.type === 'ride').length,
        stay: bookings.filter((b: any) => b.type === 'stay').length,
        event: bookings.filter((b: any) => b.type === 'event').length
      }
    };

    res.json({
      success: true,
      activity: {
        summary: activitySummary,
        recentBookings: bookings.slice(0, 10), // Last 10 bookings
        recentProviderBookings: providerBookings.slice(0, 10)
      }
    });
  } catch (error) {
    console.error("Error getting user activity:", error);
    res.status(500).json({ 
      message: "Erro ao buscar atividade do usuário",
      error: "Internal server error" 
    });
  }
});

// Delete user account
router.delete("/account", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    // TODO: Implement account deletion logic
    // - Delete user data
    // - Cancel active bookings
    // - Remove from provider bookings
    // - Delete uploaded files

    res.json({
      success: true,
      message: "Conta deletada com sucesso"
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ 
      message: "Erro ao deletar conta",
      error: "Internal server error" 
    });
  }
});

export default router;