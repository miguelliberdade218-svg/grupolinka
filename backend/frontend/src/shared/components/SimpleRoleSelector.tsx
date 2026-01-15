import { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

interface SimpleRoleSelectorProps {
  onRoleSelected: (roles: string[]) => void;
  userEmail: string;
}

export default function SimpleRoleSelector({ onRoleSelected, userEmail }: SimpleRoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<string>('client');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const roles = [
    {
      id: 'client',
      title: '🧳 Cliente',
      description: 'Quero reservar viagens, hospedagem e eventos'
    },
    {
      id: 'driver',
      title: '🚗 Motorista', 
      description: 'Quero oferecer serviços de transporte'
    },
    {
      id: 'hotel',
      title: '🏨 Gestor de Hotel',
      description: 'Quero gerir hospedagem e acomodações'
    }
  ];

  const handleSubmit = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('✅ Role selecionado:', selectedRole, 'para:', userEmail);
      
      // Simular um pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Chamar o callback com o role selecionado (como array)
      onRoleSelected([selectedRole]);
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Escolha seu tipo de conta</h2>
        <p className="text-gray-600 mt-2">Para: {userEmail}</p>
      </div>

      <div className="grid gap-3">
        {roles.map((role) => (
          <Card 
            key={role.id}
            className={`cursor-pointer transition-all ${
              selectedRole === role.id 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole(role.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{role.title}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
                {selectedRole === role.id && (
                  <Badge variant="default">Selecionado</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={handleSubmit}
        className="w-full"
        disabled={isLoading}
        data-testid="button-confirm-role"
      >
        {isLoading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Criando conta...
          </>
        ) : (
          'Confirmar e Criar Conta'
        )}
      </Button>
    </div>
  );
}