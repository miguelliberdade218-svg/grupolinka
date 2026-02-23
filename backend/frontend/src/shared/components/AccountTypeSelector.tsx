import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { 
  Users, 
  Car,
  Building2,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  Info
} from "lucide-react";
import { sharedAuthApi } from "@/api/shared/auth";

interface AccountTypeSelectorProps {
  onComplete: (selectedCapacities: string[]) => void;
  userEmail: string;
}

const capacityTypes = [
  {
    id: "canBookServices",
    title: "🧳 Cliente",
    description: "Quero reservar viagens, hospedagem e eventos",
    features: [
      "Reservar transportes",
      "Booking de hotéis", 
      "Comprar bilhetes para eventos",
      "Acesso a ofertas exclusivas"
    ],
    icon: Users,
    color: "bg-blue-500",
    recommended: true,
    alwaysSelected: true
  },
  {
    id: "canDrive",
    title: "🚗 Motorista",
    description: "Quero oferecer viagens e transportes",
    features: [
      "Publicar rotas de viagem",
      "Gerir reservas de passageiros",
      "Receber pagamentos",
      "Chat com clientes"
    ],
    icon: Car,
    color: "bg-green-500",
    requiresVerification: true
  },
  {
    id: "canManageHotels",
    title: "🏨 Gestor de Alojamento",
    description: "Quero gerir hospedagem e eventos",
    features: [
      "Criar ofertas de hospedagem",
      "Gerir eventos do alojamento",
      "Parcerias com motoristas",
      "Chat com clientes"
    ],
    icon: Building2,
    color: "bg-emerald-500",
    requiresVerification: true
  },
  {
    id: "isAdmin",
    title: "🛡️ Administrador",
    description: "Gerir toda a plataforma Link-A",
    features: [
      "Gerir todos os utilizadores",
      "Supervisionar transações",
      "Configurar parcerias",
      "Análises da plataforma"
    ],
    icon: ShieldCheck,
    color: "bg-red-500",
    requiresVerification: true,
    adminOnly: true
  }
];

export default function AccountTypeSelector({ onComplete, userEmail }: AccountTypeSelectorProps) {
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>(["canBookServices"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCapacityToggle = (capacityId: string) => {
    if (capacityId === "canBookServices") return; // Cliente sempre selecionado
    
    setSelectedCapacities(prev => 
      prev.includes(capacityId) 
        ? prev.filter(c => c !== capacityId)
        : [...prev, capacityId]
    );
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // ✅ Aguardar a conclusão e propagar erros
      await onComplete(selectedCapacities);
    } catch (error) {
      console.error("Erro ao configurar conta:", error);
      // ✅ Relançar o erro para que o componente pai (signup.tsx) possa mostrar a mensagem de erro
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const hasBusinessCapacities = selectedCapacities.some(capacity => 
    capacity === "canDrive" || capacity === "canManageHotels" || capacity === "isAdmin"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-Vindo ao Link-A! 🇲🇿
          </h1>
          <p className="text-gray-600">{userEmail}</p>
          <p className="text-sm text-gray-500 mt-2">
            Você fez login com Google. Selecione as capacidades que deseja ter.
          </p>
          
          {/* Aviso importante */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block max-w-2xl">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-medium text-blue-900">Importante!</h3>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Para capacidades específicas (motorista ou gestor)</strong>, recomendamos criar uma conta separada 
                  usando email/senha nas páginas dedicadas. Isso mantém suas contas organizadas.
                </p>
                <div className="flex gap-4 mt-3">
                  <a href="/drivers-signup" className="text-sm text-blue-600 hover:underline font-medium">
                    🚗 Criar conta de motorista
                  </a>
                  <a href="/hotels-signup" className="text-sm text-emerald-600 hover:underline font-medium">
                    🏨 Criar conta de gestor
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {capacityTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedCapacities.includes(type.id);
            const isClient = type.id === "canBookServices";
            const isAdmin = type.adminOnly;
            
            // Ocultar admin para utilizadores normais
            if (isAdmin && !userEmail.includes("admin")) {
              return null;
            }

            return (
              <Card 
                key={type.id}
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                } ${isClient ? 'opacity-100' : ''}`}
                onClick={() => !isClient && handleCapacityToggle(type.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${type.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{type.title}</CardTitle>
                        {type.recommended && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Recomendado
                          </Badge>
                        )}
                        {type.requiresVerification && (
                          <Badge variant="outline" className="text-xs mt-1 ml-2">
                            Requer Verificação
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <Checkbox 
                        checked={isSelected}
                        disabled={isClient}
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                  
                  <ul className="space-y-2">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {hasBusinessCapacities && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">Verificação Necessária</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  As capacidades comerciais (Motorista, Alojamento, Admin) requerem verificação de documentos. 
                  Depois de criar a conta, será redirecionado para o processo de verificação.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={handleComplete}
            disabled={isSubmitting || selectedCapacities.length === 0}
            size="lg"
            className="px-8"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Configurando conta...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Continuar</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Pode alterar as capacidades nas configurações do perfil posteriormente.
          </p>
        </div>
      </div>
    </div>
  );
}