import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { AlertTriangle, Shield, CheckCircle, XCircle, Upload, FileText } from "lucide-react";
import { getTodayHTML } from "@/shared/lib/dateUtils";
import FileUploadButton from "./FileUploadButton";

interface DocumentVerificationProps {
  userId: string;
  userType?: "user" | "driver" | "host" | "restaurant";
  currentVerificationStatus?: "pending" | "in_review" | "verified" | "rejected";
  isVerified?: boolean;
  verificationBadge?: string;
  onSubmitDocuments?: (documents: any) => void;
}

export default function DocumentVerification({
  userType = "user",
  currentVerificationStatus = "pending",
  isVerified = false,
  verificationBadge,
  onSubmitDocuments
}: DocumentVerificationProps) {
  
  // Se usuário já está verificado, mostrar status
  if (isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Conta Verificada</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Seus documentos foram aprovados e sua conta está totalmente verificada.
            </p>
            <Badge className="bg-green-100 text-green-800">
              {verificationBadge || "Verificado"}
            </Badge>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Continuar para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [documents, setDocuments] = useState({
    // Basic user documents
    identityDocumentType: "bilhete_identidade",
    identityDocument: null as File | null,
    profilePhoto: null as File | null,
    fullName: "",
    documentNumber: "",
    dateOfBirth: getTodayHTML(),
    
    // Driver-specific documents
    drivingLicense: null as File | null,
    vehicleRegistration: null as File | null,
    vehicleInsurance: null as File | null,
    vehicleInspection: null as File | null,
    
    // Vehicle details (for drivers)
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehiclePlate: "",
    vehicleColor: ""
  });

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (field: string, file: File | null) => {
    setDocuments(prev => ({ ...prev, [field]: file }));
  };

  const handleInputChange = (field: string, value: string) => {
    setDocuments(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!documents.identityDocument || !documents.profilePhoto || !documents.fullName || !documents.documentNumber) {
      toast({
        title: "Documentos Obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios e envie os documentos necessários.",
        variant: "destructive"
      });
      return;
    }

    if (userType === "driver" && (!documents.drivingLicense || !documents.vehicleRegistration || !documents.vehicleMake)) {
      toast({
        title: "Documentos de Motorista",
        description: "Motoristas devem enviar carta de condução, registo do veículo e preencher os dados do veículo.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Here we would upload documents and submit to the server
      await onSubmitDocuments?.(documents);
      
      toast({
        title: "Documentos Enviados",
        description: "Os seus documentos foram enviados para verificação. Receberá uma notificação em breve.",
      });
    } catch (error) {
      toast({
        title: "Erro no Envio",
        description: "Ocorreu um erro ao enviar os documentos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    switch (currentVerificationStatus) {
      case "verified":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "in_review":
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (currentVerificationStatus) {
      case "verified": return "bg-green-50 border-green-200";
      case "rejected": return "bg-red-50 border-red-200";
      case "in_review": return "bg-blue-50 border-blue-200";
      default: return "bg-yellow-50 border-yellow-200";
    }
  };

  const getStatusText = () => {
    switch (currentVerificationStatus) {
      case "verified": return "Verificado";
      case "rejected": return "Rejeitado";
      case "in_review": return "Em Análise";
      default: return "Pendente";
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={`${getStatusColor()}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Estado da Verificação: {getStatusText()}</span>
            {verificationBadge && (
              <Badge variant="outline" className="ml-auto">
                Selo {verificationBadge}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentVerificationStatus === "pending" && (
            <p className="text-sm text-gray-600">
              Para garantir a segurança de todos os utilizadores, é obrigatório verificar a sua identidade antes de usar todos os serviços da plataforma.
            </p>
          )}
          {currentVerificationStatus === "verified" && (
            <p className="text-sm text-green-700">
              A sua conta foi verificada com sucesso! Pode agora oferecer serviços na plataforma.
            </p>
          )}
          {currentVerificationStatus === "rejected" && (
            <p className="text-sm text-red-700">
              Os seus documentos foram rejeitados. Por favor, verifique os dados e envie novamente.
            </p>
          )}
          {currentVerificationStatus === "in_review" && (
            <p className="text-sm text-blue-700">
              Os seus documentos estão sendo analisados. Este processo pode levar até 48 horas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Form */}
      {currentVerificationStatus !== "verified" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Documentos Obrigatórios</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic User Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={documents.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Seu nome completo como no documento"
                    data-testid="input-full-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="documentType">Tipo de Documento *</Label>
                  <Select value={documents.identityDocumentType} onValueChange={(value) => handleInputChange("identityDocumentType", value)}>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bilhete_identidade">Bilhete de Identidade</SelectItem>
                      <SelectItem value="passaporte">Passaporte</SelectItem>
                      <SelectItem value="carta_conducao">Carta de Condução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="documentNumber">Número do Documento *</Label>
                  <Input
                    id="documentNumber"
                    value={documents.documentNumber}
                    onChange={(e) => handleInputChange("documentNumber", e.target.value)}
                    placeholder="Número do documento"
                    data-testid="input-document-number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={documents.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    data-testid="input-date-birth"
                  />
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Upload de Documentos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="identityDocument">Documento de Identidade *</Label>
                  <div className="mt-2">
                    <input
                      id="identityDocument"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange("identityDocument", e.target.files?.[0] || null)}
                      className="hidden"
                      data-testid="file-identity-document"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("identityDocument")?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {documents.identityDocument ? documents.identityDocument.name : "Enviar Documento"}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="profilePhoto">Foto de Perfil *</Label>
                  <div className="mt-2">
                    <FileUploadButton
                      onFileSelect={(file) => handleFileChange("profilePhoto", file)}
                      accept="image/*"
                      className="w-full"
                    >
                      {documents.profilePhoto ? documents.profilePhoto.name : "Selecionar Foto"}
                    </FileUploadButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver-specific documents */}
            {userType === "driver" && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Documentos de Motorista</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="drivingLicense">Carta de Condução *</Label>
                    <div className="mt-2">
                      <input
                        id="drivingLicense"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange("drivingLicense", e.target.files?.[0] || null)}
                        className="hidden"
                        data-testid="file-driving-license"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("drivingLicense")?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {documents.drivingLicense ? documents.drivingLicense.name : "Enviar Carta"}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleRegistration">Registo do Veículo *</Label>
                    <div className="mt-2">
                      <input
                        id="vehicleRegistration"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange("vehicleRegistration", e.target.files?.[0] || null)}
                        className="hidden"
                        data-testid="file-vehicle-registration"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("vehicleRegistration")?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {documents.vehicleRegistration ? documents.vehicleRegistration.name : "Enviar Registo"}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleInsurance">Seguro do Veículo</Label>
                    <div className="mt-2">
                      <input
                        id="vehicleInsurance"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange("vehicleInsurance", e.target.files?.[0] || null)}
                        className="hidden"
                        data-testid="file-vehicle-insurance"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("vehicleInsurance")?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {documents.vehicleInsurance ? documents.vehicleInsurance.name : "Enviar Seguro"}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleInspection">Inspecção Técnica</Label>
                    <div className="mt-2">
                      <input
                        id="vehicleInspection"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange("vehicleInspection", e.target.files?.[0] || null)}
                        className="hidden"
                        data-testid="file-vehicle-inspection"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("vehicleInspection")?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {documents.vehicleInspection ? documents.vehicleInspection.name : "Enviar Inspecção"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Dados do Veículo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="vehicleMake">Marca *</Label>
                      <Input
                        id="vehicleMake"
                        value={documents.vehicleMake}
                        onChange={(e) => handleInputChange("vehicleMake", e.target.value)}
                        placeholder="Ex: Toyota"
                        data-testid="input-vehicle-make"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Modelo *</Label>
                      <Input
                        id="vehicleModel"
                        value={documents.vehicleModel}
                        onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                        placeholder="Ex: Corolla"
                        data-testid="input-vehicle-model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleYear">Ano</Label>
                      <Input
                        id="vehicleYear"
                        value={documents.vehicleYear}
                        onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                        placeholder="Ex: 2020"
                        data-testid="input-vehicle-year"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehiclePlate">Matrícula</Label>
                      <Input
                        id="vehiclePlate"
                        value={documents.vehiclePlate}
                        onChange={(e) => handleInputChange("vehiclePlate", e.target.value)}
                        placeholder="Ex: AA-123-BB"
                        data-testid="input-vehicle-plate"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleColor">Cor</Label>
                      <Input
                        id="vehicleColor"
                        value={documents.vehicleColor}
                        onChange={(e) => handleInputChange("vehicleColor", e.target.value)}
                        placeholder="Ex: Branco"
                        data-testid="input-vehicle-color"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full md:w-auto"
                data-testid="button-submit-documents"
              >
                {isSubmitting ? "A Enviar..." : "Enviar Documentos"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}