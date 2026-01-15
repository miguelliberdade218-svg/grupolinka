import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import LoyaltyProgram from "@/shared/components/LoyaltyProgram";
import PageHeader from "@/shared/components/PageHeader";

export default function LoyaltyPage() {
  const [activeService] = useState<"rides" | "stays">("rides");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Programa de Fidelidade" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <i className="fas fa-crown text-white text-3xl"></i>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Ganhe pontos em cada viagem e estadia, troque por recompensas incríveis
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" data-testid="overview-tab">
              <i className="fas fa-chart-line mr-2"></i>
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="rewards" data-testid="rewards-tab">
              <i className="fas fa-gift mr-2"></i>
              Recompensas
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="history-tab">
              <i className="fas fa-history mr-2"></i>
              Histórico
            </TabsTrigger>
            <TabsTrigger value="rules" data-testid="rules-tab">
              <i className="fas fa-info-circle mr-2"></i>
              Regras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <LoyaltyProgram showFullView={true} />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Como Funciona</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-coins text-blue-600 text-xl"></i>
                    </div>
                    <h3 className="font-semibold mb-2">Ganhe Pontos</h3>
                    <p className="text-sm text-gray-600">
                      Cada viagem e reserva de alojamento rende pontos baseados no valor gasto
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-level-up-alt text-green-600 text-xl"></i>
                    </div>
                    <h3 className="font-semibold mb-2">Suba de Nível</h3>
                    <p className="text-sm text-gray-600">
                      Bronze, Prata, Ouro e Platina - cada nível com benefícios exclusivos
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-gift text-purple-600 text-xl"></i>
                    </div>
                    <h3 className="font-semibold mb-2">Troque Pontos</h3>
                    <p className="text-sm text-gray-600">
                      Use pontos para descontos, upgrades, viagens grátis e muito mais
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits by Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-amber-700">
                    <i className="fas fa-medal mr-2"></i>
                    Bronze
                  </CardTitle>
                  <Badge className="bg-amber-100 text-amber-800 w-fit">0 - 999 pontos</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Pontos por compra
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Recompensas básicas
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-300 bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-gray-700">
                    <i className="fas fa-star mr-2"></i>
                    Prata
                  </CardTitle>
                  <Badge className="bg-gray-100 text-gray-800 w-fit">1.000 - 2.999 pontos</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Pontos × 1.2
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Recompensas exclusivas
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Suporte prioritário
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-300 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-yellow-700">
                    <i className="fas fa-crown mr-2"></i>
                    Ouro
                  </CardTitle>
                  <Badge className="bg-yellow-100 text-yellow-800 w-fit">3.000 - 6.999 pontos</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Pontos × 1.5
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Upgrades gratuitos
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Cancelamento flexível
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-300 bg-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-purple-700">
                    <i className="fas fa-gem mr-2"></i>
                    Platina
                  </CardTitle>
                  <Badge className="bg-purple-100 text-purple-800 w-fit">7.000+ pontos</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Pontos × 2.0
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Benefícios VIP
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    Gerente de conta
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <LoyaltyProgram showFullView={true} />
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regras do Programa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Como Ganhar Pontos</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Viagem completada</span>
                      <span className="font-medium">1 ponto por 10 MZN gastos</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reserva de alojamento</span>
                      <span className="font-medium">1 ponto por 5 MZN gastos</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Participação em evento</span>
                      <span className="font-medium">50 pontos fixos</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primeira viagem do mês</span>
                      <span className="font-medium">Bônus de 25 pontos</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Validade dos Pontos</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Pontos são válidos por 12 meses após a data de ganho</li>
                    <li>• Atividade regular (pelo menos uma viagem a cada 6 meses) mantém a conta ativa</li>
                    <li>• Contas inativas podem perder pontos acumulados</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Progressão de Níveis</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Níveis são calculados com base nos pontos totais acumulados</li>
                    <li>• Benefícios do nível são aplicados imediatamente após progressão</li>
                    <li>• Não há despromoção de níveis (permanente uma vez alcançado)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Resgate de Recompensas</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Recompensas são válidas por 30 dias após o resgate</li>
                    <li>• Algumas recompensas estão sujeitas à disponibilidade</li>
                    <li>• Pontos utilizados em resgates não são reembolsáveis</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}