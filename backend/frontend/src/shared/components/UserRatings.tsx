import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface Rating {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  tripType: 'ride' | 'stay' | 'restaurant';
  response?: {
    text: string;
    date: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  type: 'driver' | 'host' | 'user' | 'restaurant';
  avatar: string;
  overallRating: number;
  totalReviews: number;
  joinDate: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  completedTrips?: number;
  responseRate?: number;
  languages: string[];
  specialties?: string[];
}

interface UserRatingsProps {
  userId: string;
  userType: 'driver' | 'host' | 'user' | 'restaurant';
  showRatingForm?: boolean;
  onRatingSubmit?: (rating: number, comment: string) => void;
}

export default function UserRatings({ 
  userId, 
  userType, 
  showRatingForm = false, 
  onRatingSubmit 
}: UserRatingsProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Mock user profile data
  const userProfile: UserProfile = {
    id: userId,
    name: userType === 'driver' ? 'João Silva' : userType === 'host' ? 'Maria Santos' : 'Carlos Mendes',
    type: userType,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    overallRating: 4.7,
    totalReviews: 128,
    joinDate: "Janeiro 2022",
    verificationStatus: 'verified',
    completedTrips: userType === 'driver' ? 445 : undefined,
    responseRate: userType === 'host' ? 98 : undefined,
    languages: ['Português', 'Inglês'],
    specialties: userType === 'driver' 
      ? ['Aeroporto', 'Viagens longas'] 
      : userType === 'host' 
      ? ['Famílias', 'Negócios']
      : userType === 'restaurant'
      ? ['Culinária Moçambicana', 'Frutos do Mar']
      : undefined
  };

  // Mock ratings data
  const ratings: Rating[] = [
    {
      id: "r1",
      userId: "u1",
      userName: "Ana Costa",
      userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b886?w=50&h=50&fit=crop&crop=face",
      rating: 5,
      comment: "Excelente motorista! Pontual, carro limpo e conduziu com segurança. Recomendo!",
      date: "2024-08-15",
      tripType: 'ride',
      response: {
        text: "Obrigado pelo feedback positivo! Foi um prazer conduzi-la.",
        date: "2024-08-15"
      }
    },
    {
      id: "r2", 
      userId: "u2",
      userName: "Pedro Machado",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      rating: 4,
      comment: "Bom serviço, chegou no horário combinado. Só poderia ter um pouco mais de conversa durante a viagem.",
      date: "2024-08-10",
      tripType: 'ride'
    },
    {
      id: "r3",
      userId: "u3", 
      userName: "Luísa Fernandes",
      userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      rating: 5,
      comment: "Hospedagem fantástica! Apartamento limpo, bem localizado e a anfitriã muito prestativa.",
      date: "2024-08-05",
      tripType: 'stay',
      response: {
        text: "Muito obrigada! Ficamos felizes que tenham gostado da estadia.",
        date: "2024-08-06"
      }
    }
  ];

  const renderStars = (rating: number, interactive: boolean = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`${
              star <= rating 
                ? "text-yellow-500" 
                : "text-gray-300"
            } ${interactive ? "hover:text-yellow-400 cursor-pointer" : ""}`}
            onClick={() => interactive && onStarClick && onStarClick(star)}
            disabled={!interactive}
          >
            <i className="fas fa-star"></i>
          </button>
        ))}
      </div>
    );
  };

  const handleSubmitRating = () => {
    if (selectedRating > 0 && onRatingSubmit) {
      onRatingSubmit(selectedRating, comment);
      setSelectedRating(0);
      setComment("");
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'driver': return 'Motorista';
      case 'host': return 'Anfitrião';
      case 'restaurant': return 'Restaurante';
      default: return 'Utilizador';
    }
  };

  return (
    <div className="space-y-4">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <CardTitle className="flex items-center gap-2">
                  {userProfile.name}
                  {userProfile.verificationStatus === 'verified' && (
                    <Badge className="bg-green-500">
                      <i className="fas fa-check-circle mr-1"></i>
                      Verificado
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-gray-medium">{getTypeLabel(userProfile.type)}</p>
                <div className="flex items-center gap-2 mt-2">
                  {renderStars(userProfile.overallRating)}
                  <span className="text-sm font-medium">{userProfile.overallRating}</span>
                  <span className="text-sm text-gray-medium">
                    ({userProfile.totalReviews} avaliações)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-medium">Membro desde</p>
              <p className="font-medium">{userProfile.joinDate}</p>
            </div>
            {userProfile.completedTrips && (
              <div>
                <p className="text-sm text-gray-medium">Viagens completadas</p>
                <p className="font-medium">{userProfile.completedTrips}</p>
              </div>
            )}
            {userProfile.responseRate && (
              <div>
                <p className="text-sm text-gray-medium">Taxa de resposta</p>
                <p className="font-medium">{userProfile.responseRate}%</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-medium">Idiomas</p>
              <p className="font-medium">{userProfile.languages.join(', ')}</p>
            </div>
          </div>
          
          {userProfile.specialties && (
            <div className="mt-4">
              <p className="text-sm text-gray-medium mb-2">Especialidades:</p>
              <div className="flex flex-wrap gap-2">
                {userProfile.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline">{specialty}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Form */}
      {showRatingForm && (
        <Card>
          <CardHeader>
            <CardTitle>Avaliar {getTypeLabel(userProfile.type)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sua avaliação:</label>
              {renderStars(selectedRating, true, setSelectedRating)}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Comentário (opcional):</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Compartilhe sua experiência..."
                data-testid="rating-comment"
              />
            </div>
            
            <Button 
              onClick={handleSubmitRating}
              disabled={selectedRating === 0}
              className="w-full"
              data-testid="submit-rating"
            >
              <i className="fas fa-star mr-2"></i>
              Enviar Avaliação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Avaliações ({ratings.length})</CardTitle>
            {ratings.length > 3 && !showAllReviews && (
              <Button 
                variant="outline" 
                onClick={() => setShowAllReviews(true)}
                data-testid="show-all-reviews"
              >
                Ver todas
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className={showAllReviews ? "h-96" : ""}>
            <div className="space-y-4">
              {(showAllReviews ? ratings : ratings.slice(0, 3)).map((rating) => (
                <div key={rating.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <img
                      src={rating.userAvatar}
                      alt={rating.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{rating.userName}</p>
                          <div className="flex items-center gap-2">
                            {renderStars(rating.rating)}
                            <span className="text-sm text-gray-medium">
                              {new Date(rating.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {rating.tripType === 'ride' ? 'Viagem' : 
                           rating.tripType === 'stay' ? 'Hospedagem' : 'Restaurante'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{rating.comment}</p>
                      
                      {rating.response && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Resposta do {getTypeLabel(userProfile.type)}:</p>
                          <p className="text-sm text-gray-700">{rating.response.text}</p>
                          <p className="text-xs text-gray-medium mt-1">
                            {new Date(rating.response.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}