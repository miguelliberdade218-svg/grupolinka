import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/shared/lib/queryClient";

const registrationSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(9, "Número de telefone deve ter pelo menos 9 dígitos")
    .regex(/^[0-9+\-\s()]+$/, "Formato de telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  documentType: z.enum(["bi", "passport", "carta_conducao"], {
    required_error: "Tipo de documento é obrigatório"
  }),
  documentNumber: z.string().min(5, "Número do documento deve ter pelo menos 5 caracteres"),
  profilePhoto: z.instanceof(File, { message: "Foto de perfil é obrigatória" }),
  documentPhoto: z.instanceof(File, { message: "Foto do documento é obrigatória" }),
});

type RegistrationData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  firebaseUser: any;
  onComplete: () => void;
}

export default function RegistrationForm({ firebaseUser, onComplete }: RegistrationFormProps) {
  const { toast } = useToast();
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState<string>("");

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: firebaseUser?.displayName?.split(" ")[0] || "",
      lastName: firebaseUser?.displayName?.split(" ").slice(1).join(" ") || "",
      email: firebaseUser?.email || "",
    }
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("phone", data.phone);
      formData.append("email", data.email || "");
      formData.append("documentType", data.documentType);
      formData.append("documentNumber", data.documentNumber);
      formData.append("profilePhoto", data.profilePhoto);
      formData.append("documentPhoto", data.documentPhoto);
      formData.append("firebaseUid", firebaseUser.uid);

      return apiRequest("POST", "/api/auth/complete-registration", formData);
    },
    onSuccess: () => {
      toast({
        title: "Registro Concluído",
        description: "Sua conta foi criada com sucesso!",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Registro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (file: File | null, type: 'profile' | 'document') => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'profile') {
          setProfilePhotoPreview(result);
          form.setValue('profilePhoto', file);
        } else {
          setDocumentPhotoPreview(result);
          form.setValue('documentPhoto', file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: RegistrationData) => {
    registrationMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Complete o Seu Registro
            </CardTitle>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Preencha os dados obrigatórios para finalizar sua conta
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      data-testid="input-first-name"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Sobrenome *</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      data-testid="input-last-name"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Número de Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+258 84 123 4567"
                    {...form.register("phone")}
                    data-testid="input-phone"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Documentos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Documentos de Identificação</h3>
                
                <div>
                  <Label>Tipo de Documento *</Label>
                  <Select onValueChange={(value) => form.setValue('documentType', value as any)}>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue placeholder="Selecione o tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bi">Bilhete de Identidade</SelectItem>
                      <SelectItem value="passport">Passaporte</SelectItem>
                      <SelectItem value="carta_conducao">Carta de Condução</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.documentType && (
                    <p className="text-sm text-red-500">{form.formState.errors.documentType.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="documentNumber">Número do Documento *</Label>
                  <Input
                    id="documentNumber"
                    {...form.register("documentNumber")}
                    data-testid="input-document-number"
                  />
                  {form.formState.errors.documentNumber && (
                    <p className="text-sm text-red-500">{form.formState.errors.documentNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Fotos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fotos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profilePhoto">Foto de Perfil *</Label>
                    <Input
                      id="profilePhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'profile')}
                      data-testid="input-profile-photo"
                    />
                    {profilePhotoPreview && (
                      <img 
                        src={profilePhotoPreview} 
                        alt="Preview" 
                        className="mt-2 w-24 h-24 object-cover rounded-full"
                      />
                    )}
                    {form.formState.errors.profilePhoto && (
                      <p className="text-sm text-red-500">{form.formState.errors.profilePhoto.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="documentPhoto">Foto do Documento *</Label>
                    <Input
                      id="documentPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'document')}
                      data-testid="input-document-photo"
                    />
                    {documentPhotoPreview && (
                      <img 
                        src={documentPhotoPreview} 
                        alt="Preview" 
                        className="mt-2 w-24 h-16 object-cover rounded"
                      />
                    )}
                    {form.formState.errors.documentPhoto && (
                      <p className="text-sm text-red-500">{form.formState.errors.documentPhoto.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={registrationMutation.isPending}
                data-testid="button-complete-registration"
              >
                {registrationMutation.isPending ? "Criando Conta..." : "Finalizar Registro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}