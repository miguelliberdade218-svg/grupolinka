import { useState } from "react";
import { Link } from "wouter";
import PageHeader from "@/components/PageHeader";
import DocumentVerification from "@/components/DocumentVerification";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";

export default function ProfileVerification() {
  const [activeService] = useState<"rides" | "stays">("rides");
  
  // Mock user data - in real app this would come from authentication
  const mockUser = {
    id: "user-123",
    username: "João Silva",
    userType: "user" as const,
    verificationStatus: "pending" as const,
    isVerified: false,
    canOfferServices: false,
    verificationBadge: null
  };

  const handleDocumentSubmission = async (documents: any) => {
    console.log("Documents submitted:", documents);
    // Here we would handle the actual document submission
    // For now, just simulate a successful submission
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const benefits = [
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      title: "Segurança Garantida",
      description: "Todos os utilizadores são verificados para garantir a máxima segurança"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      title: "Confiança Mútua",
      description: "Crie relações de confiança com outros utilizadores verificados"
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
      title: "Acesso Completo",
      description: "Utilize todos os recursos da plataforma após a verificação"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Verificação de Perfil" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Verificação de Perfil</h1>
              <p className="text-gray-600 mt-1">
                Confirme a sua identidade para usar todos os serviços
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Porquê Verificar o Perfil?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requirements Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Documentos Necessários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Documento de Identidade</h4>
                  <p className="text-sm text-gray-600">Bilhete de Identidade, Passaporte ou Carta de Condução</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Foto de Perfil</h4>
                  <p className="text-sm text-gray-600">Uma foto clara do seu rosto</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">+</span>
                </div>
                <div>
                  <h4 className="font-semibold">Documentos de Motorista (Se Aplicável)</h4>
                  <p className="text-sm text-gray-600">Carta de condução, registo e seguro do veículo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Verification Component */}
        <DocumentVerification
          userId={mockUser.id}
          userType={mockUser.userType}
          currentVerificationStatus={mockUser.verificationStatus}
          isVerified={mockUser.isVerified}
          verificationBadge={mockUser.verificationBadge || undefined}
          onSubmitDocuments={handleDocumentSubmission}
        />

        {/* Service Restriction Notice */}
        {!mockUser.canOfferServices && (
          <Card className="mt-8 bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Verificação Necessária para Oferecer Serviços
                  </h3>
                  <p className="text-sm text-yellow-700 mb-4">
                    Para garantir a segurança de todos os utilizadores, apenas perfis verificados podem oferecer viagens ou hospedagens na plataforma.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-yellow-800 border-yellow-300">
                      Acesso Limitado
                    </Badge>
                    <span className="text-sm text-yellow-700">
                      Complete a verificação para desbloquear todas as funcionalidades
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button variant="outline">
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}