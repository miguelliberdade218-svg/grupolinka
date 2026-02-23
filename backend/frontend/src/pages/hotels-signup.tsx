import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { useToast } from "@/shared/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Textarea } from "@/shared/components/ui/textarea";
import { signInWithGoogle, signUpWithEmail } from "@/shared/lib/firebaseConfig";
import { Home, Building, User, Hotel, FileText } from "lucide-react";
import { sharedAuthApi } from "@/api/shared/auth";
import DocumentUploadMultiple, { DocumentFile } from "@/shared/components/DocumentUploadMultiple";
import { emailService } from "@/shared/services/emailService";

const hotelManagerSignupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  accountType: z.enum(["individual", "company"]),
  companyName: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),

  // Dados específicos do hotel
  hotelName: z.string().min(2, "Nome do hotel é obrigatório"),
  hotelAddress: z.string().min(5, "Endereço do hotel é obrigatório"),
  hotelCity: z.string().min(2, "Cidade é obrigatória"),
  hotelCountry: z.string().default("Moçambique"),
  hotelPhone: z.string().optional(),
  hotelEmail: z.string().email("Email do hotel inválido").optional(),
  hotelWebsite: z.string().url("URL inválida").optional(),
  hotelDescription: z.string().optional(),
  hotelStars: z.number().min(1).max(5).optional(),
  hotelRoomCount: z.number().min(1).optional(),
  documents: z.array(z.any()).optional(), // Documentos para verificação
}).refine((data) => {
  if (data.accountType === "company") {
    return data.companyName && data.companyName.length >= 2;
  }
  return true;
}, {
  message: "Nome da empresa é obrigatório",
  path: ["companyName"],
});

type HotelManagerSignupData = z.infer<typeof hotelManagerSignupSchema>;

export default function HotelsSignupPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);

  const form = useForm<HotelManagerSignupData>({
    resolver: zodResolver(hotelManagerSignupSchema),
    defaultValues: {
      accountType: "individual",
      hotelCountry: "Moçambique",
      hotelStars: 3,
      hotelRoomCount: 10,
    }
  });

  const watchAccountType = form.watch("accountType");

  const onSubmit = async (data: HotelManagerSignupData) => {
    setIsLoading(true);
    try {
      // Usar senha fornecida ou gerar temporária
      const password = data.password && data.password.trim() !== "" 
        ? data.password 
        : 'temp-password-' + Math.random().toString(36).substring(2, 15);

      // Criar conta no Firebase
      const firebaseUser = await signUpWithEmail(data.email, password);

      // Registrar gestor de hotel no backend
      const response = await sharedAuthApi.registerClient({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        accountType: data.accountType,
        companyName: data.companyName,
        companyVatNumber: data.companyVatNumber,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone,
      });

      // Type assertion para garantir compatibilidade
      const registerResponse = response as { success: boolean; error?: string; message?: string; user?: any };

      if (registerResponse.success) {
        // Converter DocumentFile[] para o formato esperado pelo activateCapacity
        const capacityDocuments = documents.map(doc => ({
          type: doc.type,
          url: doc.data, // Usar data (base64) como url temporária
          number: data.hotelName,
          expiryDate: ''
        }));

        // Ativar capacidade de gestão de hotéis
        const activateResponse = await sharedAuthApi.activateCapacity({
          capacity: 'hotel_manager',
          documents: capacityDocuments,
          notes: `Hotel: ${data.hotelName}, Endereço: ${data.hotelAddress}, ${data.hotelCity}`
        });

        if (activateResponse.success) {
          // Enviar email de boas-vindas
          try {
            await emailService.sendWelcomeEmail(data.email, `${data.firstName} ${data.lastName}`);
          } catch (emailError) {
            console.warn('Erro ao enviar email de boas-vindas:', emailError);
          }

          toast({
            title: "Conta Criada!",
            description: "Sua conta de gestor de hotel foi criada. Aguarde verificação dos documentos.",
          });
          setLocation('/hotels-app');
        } else {
          throw new Error(activateResponse.message || 'Erro ao ativar capacidade de gestão de hotéis');
        }
      } else {
        throw new Error(registerResponse.error || registerResponse.message || 'Falha ao criar conta');
      }

    } catch (error: any) {
      toast({
        title: "Erro no Registro",
        description: error.message || "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle();
      // TODO: Implementar configuração automática para gestor de hotel via Google
      toast({
        title: "Funcionalidade em Desenvolvimento",
        description: "Registro de gestor de hotel via Google será implementado em breve.",
      });
    } catch (error) {
      toast({
        title: "Erro no Registro",
        description: "Erro ao inicializar registro com Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Botão Homepage no topo */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Ir para Homepage
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Criar Conta de Gestor de Hotel
          </CardTitle>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Gerencie seu hotel no Link-A
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Signup Button */}
          <button
            onClick={handleGoogleSignup}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Registar com Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                ou
              </span>
            </div>
          </div>

          {/* Manual Signup Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Seu nome"
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Seu sobrenome"
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Senha (opcional - ou use Google)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres (opcional)"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Se não definir senha, poderá usar apenas login com Google ou receber link por email.
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+258 84 123 4567"
                  {...form.register("phone")}
                />
              </div>
            </div>

            {/* Tipo de Conta */}
            <div className="space-y-3">
              <Label>Tipo de Conta *</Label>
              <RadioGroup
                value={watchAccountType}
                onValueChange={(value) => form.setValue("accountType", value as "individual" | "company")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Individual
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer">
                    <Building className="h-4 w-4" />
                    Empresa
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Campos condicionais para empresa */}
            {watchAccountType === "company" && (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-700">Informações da Empresa</h3>

                <div>
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Nome da sua empresa"
                    {...form.register("companyName")}
                  />
                  {form.formState.errors.companyName && (
                    <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="companyVatNumber">NIF/NUIT (opcional)</Label>
                  <Input
                    id="companyVatNumber"
                    type="text"
                    placeholder="Número de identificação fiscal"
                    {...form.register("companyVatNumber")}
                  />
                </div>

                <div>
                  <Label htmlFor="companyAddress">Endereço da Empresa (opcional)</Label>
                  <Input
                    id="companyAddress"
                    type="text"
                    placeholder="Endereço completo"
                    {...form.register("companyAddress")}
                  />
                </div>

                <div>
                  <Label htmlFor="companyPhone">Telefone da Empresa (opcional)</Label>
                  <Input
                    id="companyPhone"
                    type="tel"
                    placeholder="+258 84 123 4567"
                    {...form.register("companyPhone")}
                  />
                </div>
              </div>
            )}

            {/* Informações do Hotel */}
            <div className="space-y-4 p-4 border border-emerald-200 rounded-lg bg-emerald-50">
              <h3 className="text-lg font-medium flex items-center gap-2 text-emerald-700">
                <Hotel className="h-5 w-5" />
                Informações do Hotel
              </h3>

              <div>
                <Label htmlFor="hotelName">Nome do Hotel *</Label>
                <Input
                  id="hotelName"
                  type="text"
                  placeholder="Nome completo do hotel"
                  {...form.register("hotelName")}
                />
                {form.formState.errors.hotelName && (
                  <p className="text-sm text-red-500">{form.formState.errors.hotelName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="hotelAddress">Endereço do Hotel *</Label>
                <Input
                  id="hotelAddress"
                  type="text"
                  placeholder="Endereço completo"
                  {...form.register("hotelAddress")}
                />
                {form.formState.errors.hotelAddress && (
                  <p className="text-sm text-red-500">{form.formState.errors.hotelAddress.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotelCity">Cidade *</Label>
                  <Input
                    id="hotelCity"
                    type="text"
                    placeholder="Cidade"
                    {...form.register("hotelCity")}
                  />
                  {form.formState.errors.hotelCity && (
                    <p className="text-sm text-red-500">{form.formState.errors.hotelCity.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="hotelStars">Estrelas (1-5)</Label>
                  <Input
                    id="hotelStars"
                    type="number"
                    min="1"
                    max="5"
                    {...form.register("hotelStars", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotelPhone">Telefone do Hotel</Label>
                  <Input
                    id="hotelPhone"
                    type="tel"
                    placeholder="+258 84 123 4567"
                    {...form.register("hotelPhone")}
                  />
                </div>

                <div>
                  <Label htmlFor="hotelRoomCount">Número de Quartos</Label>
                  <Input
                    id="hotelRoomCount"
                    type="number"
                    min="1"
                    placeholder="10"
                    {...form.register("hotelRoomCount", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hotelEmail">Email do Hotel</Label>
                <Input
                  id="hotelEmail"
                  type="email"
                  placeholder="reservas@hotel.com"
                  {...form.register("hotelEmail")}
                />
                {form.formState.errors.hotelEmail && (
                  <p className="text-sm text-red-500">{form.formState.errors.hotelEmail.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="hotelWebsite">Website do Hotel</Label>
                <Input
                  id="hotelWebsite"
                  type="url"
                  placeholder="https://www.hotel.com"
                  {...form.register("hotelWebsite")}
                />
                {form.formState.errors.hotelWebsite && (
                  <p className="text-sm text-red-500">{form.formState.errors.hotelWebsite.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="hotelDescription">Descrição do Hotel</Label>
                <Textarea
                  id="hotelDescription"
                  placeholder="Descreva as comodidades, serviços oferecidos..."
                  {...form.register("hotelDescription")}
                  rows={3}
                />
              </div>

              <div className="text-sm text-emerald-600 bg-emerald-100 p-3 rounded">
                <FileText className="h-4 w-4 inline mr-1" />
                <strong>Importante:</strong> Após o registro, você precisará enviar documentos para verificação
                (alvará, licença, etc.) para poder gerenciar o hotel na plataforma.
              </div>
            </div>

            {/* Upload de Documentos */}
            <div className="space-y-4">
              <DocumentUploadMultiple
                documents={documents}
                onDocumentsChange={setDocuments}
                maxFiles={5}
                acceptedTypes={['image/*', 'application/pdf']}
                maxSizeMB={10}
                title="Documentos para Verificação do Hotel"
                description="Envie cópias do alvará, licença comercial, certificado de registo e outros documentos necessários"
                required={true}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Criando Conta..." : "Criar Conta de Gestor"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Já tem conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
            <p className="mt-2">
              Quer apenas reservar serviços?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Criar conta de cliente
              </Link>
            </p>
            <p className="mt-1">
              É motorista?{" "}
              <Link href="/drivers-signup" className="text-orange-600 hover:underline">
                Criar conta de motorista
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}