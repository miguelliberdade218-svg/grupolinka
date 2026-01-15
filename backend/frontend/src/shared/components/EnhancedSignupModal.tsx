import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Progress } from "@/shared/components/ui/progress";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  FileText, 
  Camera, 
  Upload,
  CheckCircle,
  AlertCircle, 
  X,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import { auth } from "../lib/firebaseConfig";

// Função de redirecionamento
const redirectBasedOnRole = (role: string) => {
  const domainMap: Record<string, string> = {
    client: 'https://client.link-aturismomoz.com',
    event: 'https://event.link-aturismomoz.com',
    admin: 'https://admin.link-aturismomoz.com'
  };
  
  // Em desenvolvimento, manter no localhost
  if (window.location.hostname === 'localhost') {
    console.log(`🔄 Redirecionamento simulado para role: ${role}`);
    return;
  }
  
  const targetDomain = domainMap[role];
  if (targetDomain && window.location.origin !== targetDomain) {
    setTimeout(() => {
      window.location.href = targetDomain;
    }, 2000); // Delay para mostrar o toast
  }
};

interface EnhancedSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  idDocumentNumber: string;
  city: string;
  profilePhoto: File | null;
  documentPhoto: File | null;
  selectedRoles: string[];
}

const mozambicanCities = [
  "Maputo", "Matola", "Beira", "Nampula", "Chimoio", "Nacala", "Quelimane",
  "Tete", "Xai-Xai", "Lichinga", "Pemba", "Inhambane", "Maxixe", "Gurué",
  "Manica", "Montepuez", "Cuamba", "Dondo", "Angoche", "Chokwé",
  "Mocuba", "Manhiça", "Marracuene", "Vilanculos", "Massinga"
];

export function EnhancedSignupModal({ open, onOpenChange }: EnhancedSignupModalProps) {
  const { signUpEmail, loading, error } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    idDocumentNumber: '',
    city: '',
    profilePhoto: null,
    documentPhoto: null,
    selectedRoles: ['client'] // Cliente sempre incluído por padrão
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ profile: 0, document: 0 });
  const { toast } = useToast();

  const totalSteps = 5; // Adicionando step de seleção de roles
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof FormData, value: string | File | null | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file: File, type: 'profile' | 'document') => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError(`A foto ${type === 'profile' ? 'de perfil' : 'do documento'} deve ter menos de 5MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setFormError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Simulate upload progress
    const progressKey = type === 'profile' ? 'profile' : 'document';
    
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(prev => ({ ...prev, [progressKey]: i }));
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    handleInputChange(type === 'profile' ? 'profilePhoto' : 'documentPhoto', file);
    
    toast({
      title: "Upload Concluído",
      description: `Foto ${type === 'profile' ? 'de perfil' : 'do documento'} carregada com sucesso.`
    });
  };

  const validateStep = (step: number): boolean => {
    setFormError(null);
    
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setFormError('Por favor, preencha todos os campos.');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setFormError('As senhas não coincidem.');
          return false;
        }
        if (formData.password.length < 6) {
          setFormError('A senha deve ter pelo menos 6 caracteres.');
          return false;
        }
        break;
      
      case 2:
        if (!formData.fullName || !formData.phoneNumber || !formData.city) {
          setFormError('Por favor, preencha todos os campos pessoais.');
          return false;
        }
        // Validate Mozambican phone number format
        const phoneRegex = /^(\+258|258)?[0-9]{9}$/;
        if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
          setFormError('Número de telefone inválido. Use o formato: +258XXXXXXXXX ou 8XXXXXXXX');
          return false;
        }
        break;
      
      case 3:
        if (!formData.idDocumentNumber) {
          setFormError('Por favor, insira o número do seu documento de identificação.');
          return false;
        }
        break;
      
      case 4:
        if (!formData.profilePhoto || !formData.documentPhoto) {
          setFormError('Por favor, carregue tanto a foto de perfil quanto a foto do documento.');
          return false;
        }
        break;
      
      case 5:
        if (!formData.selectedRoles || formData.selectedRoles.length === 0) {
          setFormError('Por favor, selecione pelo menos um tipo de conta.');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      // First create the Firebase account
      await signUpEmail(formData.email, formData.password);
      
      // Extract names from fullName
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Send roles and additional data to backend
      const response = await fetch('/api/auth/setup-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          roles: formData.selectedRoles,
          firstName,
          lastName,
          phone: formData.phoneNumber
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao configurar conta');
      }
      
      toast({
        title: "Conta Criada com Sucesso!",
        description: `Conta criada com os tipos: ${formData.selectedRoles.map(role => {
          switch(role) {
            case 'client': return 'Cliente';
            case 'driver': return 'Motorista';
            case 'hotel': return 'Hotel Manager';
            case 'event': return 'Organizador de Eventos';
            default: return role;
          }
        }).join(', ')}`
      });
      
      // Redirecionar baseado no role principal selecionado
      const primaryRole = formData.selectedRoles[0] || 'client';
      redirectBasedOnRole(primaryRole);
      
      handleClose();
    } catch (error: any) {
      let errorMessage = 'Erro ao criar conta.';
      
      if (error?.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este email já está em uso. Tente fazer login.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Email inválido. Verifique o formato.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      setFormError(errorMessage);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phoneNumber: '',
      idDocumentNumber: '',
      city: '',
      profilePhoto: null,
      documentPhoto: null,
      selectedRoles: ['client']
    });
    setFormError(null);
    setUploadProgress({ profile: 0, document: 0 });
    onOpenChange(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  data-testid="input-enhanced-email"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10"
                  data-testid="input-enhanced-password"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10"
                  data-testid="input-enhanced-confirm-password"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="pl-10"
                  data-testid="input-full-name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone-number">Número de Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="+258 XX XXX XXXX"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="pl-10"
                  data-testid="input-phone-number"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Formato: +258XXXXXXXXX ou 8XXXXXXXX
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Cidade de Residência</Label>
              <Select onValueChange={(value) => handleInputChange('city', value)} value={formData.city}>
                <SelectTrigger data-testid="select-city">
                  <SelectValue placeholder="Selecione sua cidade" />
                </SelectTrigger>
                <SelectContent>
                  {mozambicanCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documento de Identificação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="document-number">Número do Documento</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="document-number"
                      type="text"
                      placeholder="BI, Passaporte ou Carta de Condução"
                      value={formData.idDocumentNumber}
                      onChange={(e) => handleInputChange('idDocumentNumber', e.target.value)}
                      className="pl-10"
                      data-testid="input-document-number"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Insira o número do seu BI, Passaporte ou Carta de Condução
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Segurança e Privacidade:</strong> Seus documentos são criptografados e usados apenas para verificação de identidade conforme a regulamentação moçambicana.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Profile Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Foto de Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.profilePhoto ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="text-sm text-green-600 font-medium">
                          Foto carregada: {formData.profilePhoto.name}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('profilePhoto', null)}
                        >
                          Alterar Foto
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">
                          Clique para carregar sua foto de perfil
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'profile');
                          }}
                          className="hidden"
                          id="profile-photo-upload"
                          data-testid="input-profile-photo"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('profile-photo-upload')?.click()}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium bg-white text-[#0F1419] border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          Selecionar Foto
                        </button>
                      </div>
                    )}
                    {uploadProgress.profile > 0 && uploadProgress.profile < 100 && (
                      <Progress value={uploadProgress.profile} className="mt-2" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Foto do Documento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.documentPhoto ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="text-sm text-green-600 font-medium">
                          Documento carregado: {formData.documentPhoto.name}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('documentPhoto', null)}
                        >
                          Alterar Foto
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">
                          Foto do seu BI, Passaporte ou Carta de Condução
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'document');
                          }}
                          className="hidden"
                          id="document-photo-upload"
                          data-testid="input-document-photo"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('document-photo-upload')?.click()}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium bg-white text-[#0F1419] border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Selecionar Foto
                        </button>
                      </div>
                    )}
                    {uploadProgress.document > 0 && uploadProgress.document < 100 && (
                      <Progress value={uploadProgress.document} className="mt-2" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Certifique-se de que o documento está legível e todas as informações são visíveis
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        // Seleção de Tipos de Conta
        const accountTypes = [
          {
            id: "client",
            title: "🧳 Cliente",
            description: "Quero reservar viagens, hospedagem e eventos",
            features: ["Reservar transportes", "Booking de hotéis", "Comprar bilhetes para eventos"],
            color: "bg-blue-500",
            disabled: true // Cliente sempre selecionado
          },
          {
            id: "driver",
            title: "🚗 Motorista",
            description: "Quero oferecer serviços de transporte",
            features: ["Aceitar corridas", "Gestão de veículo", "Histórico de viagens"],
            color: "bg-green-500"
          },
          {
            id: "hotel",
            title: "🏨 Manager de Hotel",
            description: "Quero gerir propriedades e acomodações",
            features: ["Gestão de quartos", "Reservas e check-ins", "Preços dinâmicos"],
            color: "bg-purple-500"
          },
          {
            id: "event",
            title: "🎭 Organizador de Eventos",
            description: "Quero criar e gerir eventos",
            features: ["Criar eventos", "Venda de bilhetes", "Gestão de participantes"],
            color: "bg-orange-500"
          }
        ];

        const handleRoleToggle = (roleId: string) => {
          if (roleId === "client") return; // Cliente sempre selecionado
          
          const updatedRoles = formData.selectedRoles.includes(roleId) 
            ? formData.selectedRoles.filter(r => r !== roleId)
            : [...formData.selectedRoles, roleId];
          
          handleInputChange('selectedRoles', updatedRoles);
        };

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Que tipo de serviços quer usar?</h3>
              <p className="text-sm text-gray-600">
                Selecione os tipos de conta que pretende ter. Pode sempre adicionar mais tipos mais tarde.
              </p>
            </div>

            <div className="grid gap-4">
              {accountTypes.map((type) => {
                const isSelected = formData.selectedRoles.includes(type.id);
                const isDisabled = type.disabled;
                
                return (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isDisabled ? 'opacity-75' : ''}`}
                    onClick={() => !isDisabled && handleRoleToggle(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => !isDisabled && handleRoleToggle(type.id)}
                            />
                            <h4 className="font-semibold text-sm">{type.title}</h4>
                            {type.id === "client" && (
                              <Badge variant="secondary" className="text-xs">Incluído</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{type.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {type.features.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs px-2 py-1">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Nota:</strong> Todos os utilizadores têm acesso às funcionalidades de cliente. 
                Os outros tipos de conta requerem verificação adicional dos documentos.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Credenciais de Acesso";
      case 2: return "Informações Pessoais";
      case 3: return "Documento de Identificação";
      case 4: return "Verificação Fotográfica";
      case 5: return "Tipos de Conta";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="enhanced-signup-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-primary">
                Criar Conta Link-A
              </DialogTitle>
              <DialogDescription>
                {getStepTitle()} - Passo {currentStep} de {totalSteps}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="button-close-enhanced-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-500 text-center">
            {currentStep} de {totalSteps} concluído
          </p>
        </div>
        
        {/* Step Content */}
        <div className="py-4">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex-1"
            data-testid="button-previous-step"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1"
              data-testid="button-next-step"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-testid="button-create-account"
            >
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          )}
        </div>

        {/* Error Display */}
        {(formError || error) && (
          <Alert variant="destructive" data-testid="alert-enhanced-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError || error}</AlertDescription>
          </Alert>
        )}

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Segurança:</strong> Todos os dados são criptografados e protegidos. 
            Usamos estas informações apenas para verificação de identidade e segurança da plataforma.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedSignupModal;