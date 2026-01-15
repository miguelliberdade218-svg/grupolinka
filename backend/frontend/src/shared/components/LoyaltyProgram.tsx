import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Separator } from "@/shared/components/ui/separator";
import { Star, Gift, Trophy, Crown, Zap } from "lucide-react";
import { apiRequest } from "@/shared/lib/queryClient";
import { formatMzn } from "@/shared/lib/currency";
import { useToast } from "@/shared/hooks/use-toast";
import React from "react";
import type { LoyaltyProgram, PointsHistory } from "@shared/schema";

// Mock loyalty data
const mockLoyaltyData: LoyaltyProgram = {
  id: "loyalty-1",
  userId: "user-1",
  totalPoints: 2450,
  currentPoints: 1850,
  membershipLevel: "silver",
  joinedAt: new Date("2024-01-15"),
  lastActivityAt: new Date(),
  updatedAt: new Date(),
};

const mockPointsHistory: PointsHistory[] = [
  {
    id: "ph-1",
    userId: "user-1",
    loyaltyId: "loyalty-1",
    actionType: "earned",
    pointsAmount: 150,
    reason: "stay_booked",
    relatedId: "booking-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: "ph-2",
    userId: "user-1",
    loyaltyId: "loyalty-1",
    actionType: "earned",
    pointsAmount: 75,
    reason: "ride_completed",
    relatedId: "ride-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
  {
    id: "ph-3",
    userId: "user-1",
    loyaltyId: "loyalty-1",
    actionType: "redeemed",
    pointsAmount: -500,
    reason: "reward_redeemed",
    relatedId: "reward-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
  },
];

const mockRewards = [
  {
    id: "r1",
    title: "10% Desconto em Alojamento",
    description: "Desconto de 10% aplicável em qualquer alojamento",
    rewardType: "discount",
    pointsCost: 500,
    discountValue: "10.00",
    minimumLevel: "bronze",
    isActive: true,
  },
  {
    id: "r2",
    title: "Viagem Grátis (até 15km)",
    description: "Uma viagem gratuita para distâncias até 15km",
    rewardType: "free_ride",
    pointsCost: 800,
    discountValue: null,
    minimumLevel: "silver",
    isActive: true,
  },
  {
    id: "r3",
    title: "Upgrade para Quarto Premium",
    description: "Upgrade gratuito para quarto premium (sujeito à disponibilidade)",
    rewardType: "upgrade",
    pointsCost: 1200,
    discountValue: null,
    minimumLevel: "gold",
    isActive: true,
  },
  {
    id: "r4",
    title: "Bilhete Gratuito para Evento",
    description: "Bilhete gratuito para eventos selecionados",
    rewardType: "event_ticket",
    pointsCost: 1000,
    discountValue: null,
    minimumLevel: "silver",
    isActive: true,
  },
];

const membershipLevels = {
  bronze: {
    name: "Bronze",
    icon: <Trophy className="w-5 h-5 text-amber-600" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    pointsRequired: 0,
    nextLevel: 1000,
  },
  silver: {
    name: "Prata",
    icon: <Star className="w-5 h-5 text-gray-500" />,
    color: "text-gray-500",
    bgColor: "bg-gray-50 border-gray-200",
    pointsRequired: 1000,
    nextLevel: 3000,
  },
  gold: {
    name: "Ouro",
    icon: <Crown className="w-5 h-5 text-yellow-500" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 border-yellow-200",
    pointsRequired: 3000,
    nextLevel: 7000,
  },
  platinum: {
    name: "Platina",
    icon: <Zap className="w-5 h-5 text-purple-600" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    pointsRequired: 7000,
    nextLevel: null,
  },
};

interface LoyaltyProgramProps {
  showFullView?: boolean;
}

export default function LoyaltyProgram({ showFullView = false }: LoyaltyProgramProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loyaltyData } = useQuery<LoyaltyProgram>({
    queryKey: ["/api/loyalty/program"],
    initialData: mockLoyaltyData,
  });

  const { data: pointsHistory = [] } = useQuery<PointsHistory[]>({
    queryKey: ["/api/loyalty/history"],
    initialData: mockPointsHistory,
    enabled: showFullView,
  });

  const { data: rewards = [] } = useQuery<any[]>({
    queryKey: ["/api/loyalty/rewards"],
    initialData: mockRewards,
    enabled: showFullView,
  });

  const redeemRewardMutation = useMutation({
    mutationFn: (rewardId: string) =>
      apiRequest("POST", `/api/loyalty/redeem/${rewardId}`),
    onSuccess: () => {
      toast({
        title: "Recompensa Resgatada!",
        description: "A recompensa foi adicionada à sua conta.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/program"] });
    },
    onError: () => {
      toast({
        title: "Erro ao Resgatar",
        description: "Não foi possível resgatar a recompensa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  if (!loyaltyData) return null;

  const currentLevel = membershipLevels[loyaltyData.membershipLevel as keyof typeof membershipLevels];
  const progressToNext = currentLevel.nextLevel 
    ? ((loyaltyData.totalPoints - currentLevel.pointsRequired) / (currentLevel.nextLevel - currentLevel.pointsRequired)) * 100
    : 100;

  const availableRewards = rewards.filter(
    r => r.pointsCost <= loyaltyData.currentPoints && 
         membershipLevels[loyaltyData.membershipLevel as keyof typeof membershipLevels].pointsRequired >= 
         membershipLevels[r.minimumLevel as keyof typeof membershipLevels].pointsRequired
  );

  const getActionIcon = (reason: string) => {
    const icons: Record<string, string> = {
      ride_completed: "🚗",
      stay_booked: "🏨",
      event_attended: "🎪",
      reward_redeemed: "🎁",
    };
    return icons[reason] || "⭐";
  };

  const getActionText = (reason: string) => {
    const texts: Record<string, string> = {
      ride_completed: "Viagem completada",
      stay_booked: "Reserva de alojamento",
      event_attended: "Participação em evento",
      reward_redeemed: "Recompensa resgatada",
    };
    return texts[reason] || reason;
  };

  if (!showFullView) {
    // Compact view for dashboard/homepage
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Gift className="w-5 h-5 mr-2 text-purple-600" />
              Programa de Fidelidade
            </CardTitle>
            <Badge className={`${currentLevel.bgColor} ${currentLevel.color} border`}>
              {currentLevel.icon}
              <span className="ml-1">{currentLevel.name}</span>
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Pontos Disponíveis</span>
            <span className="font-bold text-purple-600">{loyaltyData.currentPoints} pts</span>
          </div>
          
          {currentLevel.nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progresso para {
                  Object.values(membershipLevels).find(l => l.pointsRequired === currentLevel.nextLevel)?.name
                }</span>
                <span className="text-gray-600">
                  {loyaltyData.totalPoints}/{currentLevel.nextLevel}
                </span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.location.href = '/loyalty'}
          >
            <Gift className="w-4 h-4 mr-2" />
            Ver Recompensas ({availableRewards.length} disponíveis)
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full view for dedicated loyalty page
  return (
    <div className="space-y-8">
      {/* Level Progress */}
      <Card className={`border-2 ${currentLevel.bgColor}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full ${currentLevel.bgColor} border-2 border-current flex items-center justify-center ${currentLevel.color}`}>
                {React.cloneElement(currentLevel.icon, { className: "w-8 h-8" })}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${currentLevel.color}`}>
                  Nível {currentLevel.name}
                </h2>
                <p className="text-gray-600">
                  Membro desde {loyaltyData.joinedAt ? new Date(loyaltyData.joinedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">
                {loyaltyData.currentPoints || 0}
              </div>
              <div className="text-sm text-gray-600">pontos disponíveis</div>
              <div className="text-xs text-gray-500">
                {loyaltyData.totalPoints || 0} pontos acumulados
              </div>
            </div>
          </div>
          
          {currentLevel.nextLevel && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progresso para próximo nível</span>
                <span>{loyaltyData.totalPoints || 0}/{currentLevel.nextLevel} pontos</span>
              </div>
              <Progress value={progressToNext} className="h-3" />
              <p className="text-xs text-gray-600">
                Faltam {currentLevel.nextLevel - (loyaltyData.totalPoints || 0)} pontos para o próximo nível
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="w-5 h-5 mr-2" />
            Recompensas Disponíveis ({availableRewards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableRewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhuma recompensa disponível no momento</p>
              <p className="text-sm text-gray-500">Continue usando o Link-A para ganhar mais pontos!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableRewards.map((reward) => (
                <Card key={reward.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{reward.title}</h3>
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        {reward.pointsCost} pts
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {reward.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <Badge className="bg-gray-100 text-gray-800">
                        Mín: {membershipLevels[reward.minimumLevel as keyof typeof membershipLevels].name}
                      </Badge>
                      
                      <Button
                        size="sm"
                        onClick={() => redeemRewardMutation.mutate(reward.id)}
                        disabled={redeemRewardMutation.isPending}
                        data-testid={`redeem-${reward.id}`}
                      >
                        {redeemRewardMutation.isPending ? "Resgatando..." : "Resgatar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pointsHistory.map((entry, index) => (
              <div key={entry.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getActionIcon(entry.reason)}</span>
                    <div>
                      <p className="font-medium">{getActionText(entry.reason)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`text-right font-medium ${
                    entry.actionType === "earned" ? "text-green-600" : 
                    entry.actionType === "redeemed" ? "text-red-600" : "text-gray-600"
                  }`}>
                    {entry.actionType === "earned" ? "+" : ""}
                    {entry.pointsAmount} pts
                  </div>
                </div>
                {index < pointsHistory.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}