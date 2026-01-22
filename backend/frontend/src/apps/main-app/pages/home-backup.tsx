import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Star, Car, Hotel, Calendar, Search, TrendingUp, Menu, UserCircle, LogOut, Shield, Settings, Sparkles, ArrowRight, Users, MapPin, BookOpen, Map, Clock, Zap, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useModalState } from "@/shared/hooks/useModalState";
import { useToast } from "@/shared/hooks/use-toast";
import ModalOverlay from "@/shared/components/ModalOverlay";
import RideSearchModal from "@/shared/components/modals/RideSearchModal";
import RideCreateModal from "@/shared/components/modals/RideCreateModal";
import LocationAutocomplete, { LocationOption } from "@/shared/components/LocationAutocomplete";
import { format, parseISO, addDays, formatISO } from 'date-fns';

interface RideHighlight {
  from: string;
  to: string;
  price: number;
  date: string;
  driver: string;
  rating: number;
}

interface HotelHighlight {
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
}

interface EventHighlight {
  name: string;
  location: string;
  date: string;
  price: number;
  image: string;
}

interface ApiHighlights {
  topRides: RideHighlight[];
  topHotels: HotelHighlight[];
  featuredEvents: EventHighlight[];
}

// âœ… CORREÃ‡ÃƒO: Interface estendida para searchQuery com LocationOption
interface SearchQuery {
  from: string;
  to: string;
  date: string;
  fromId?: string;
  toId?: string;
  fromOption?: LocationOption;  // âœ… NOVO: armazena o objeto completo
  toOption?: LocationOption;    // âœ… NOVO: armazena o objeto completo
}

// âœ… CORREÃ‡ÃƒO: Componentes separados para melhor organizaÃ§Ã£o
const RidesList = ({ rides, user }: { rides: RideHighlight[], user: any }) => (
  <>
    {rides.slice(0, 6).map((ride, index) => (
      <Card key={index} className="border-l-4 border-l-blue-500 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-b relative">
          <div className="text-center">
            <Car className="w-12 h-12 text-blue-600 mb-2" />
            <span className="text-xs text-gray-600">Foto do veÃ­culo</span>
          </div>
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-500 text-white text-xs">Popular</Badge>
          </div>
        </div>
        <CardContent className="pt-4">
          <div className="mb-3">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
              <span>{ride.from} â†’ {ride.to}</span>
            </h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{ride.driver}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{ride.rating}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-green-600">{ride.price} MZN</p>
              <div className="text-xs text-gray-500">
                por pessoa
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>{ride.date ? format(parseISO(ride.date), 'dd/MM/yyyy') : '-'}</span>
              <Clock className="w-3 h-3 ml-2" />
              <span>Partida Ã s 07:00</span>
            </div>
          </div>
          
          {user ? (
            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm" data-testid={`button-book-ride-${index}`}>
              Ver Detalhes & Reservar
            </Button>
          ) : (
            <Link href="/signup" className="block w-full">
              <Button className="w-full bg-orange-600 hover:bg-orange-700" size="sm" data-testid={`button-signup-ride-${index}`}>
                Registar para Reservar
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    ))}
  </>
);

const StaysList = ({ stays, user }: { stays: HotelHighlight[], user: any }) => (
  <>
    {stays.map((stay, index) => (
      <Card key={index} className="border-l-4 border-l-green-500 overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center border-b">
          <div className="text-center">
            <span className="text-4xl mb-2 block">{stay.image}</span>
            <span className="text-sm text-gray-600">Foto do alojamento</span>
          </div>
        </div>
        <CardContent className="pt-4">
          <div className="mb-2">
            <h3 className="font-semibold text-lg">{stay.name}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {stay.location}
            </p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-2xl font-bold text-green-600">{stay.price} MZN/noite</p>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{stay.rating}</span>
            </div>
          </div>
          {user ? (
            <Button className="w-full" size="sm" data-testid={`button-book-stay-${index}`}>
              Reservar Estadia
            </Button>
          ) : (
            <Link href="/signup" className="block w-full">
              <Button className="w-full bg-orange-600 hover:bg-orange-700" size="sm" data-testid={`button-signup-stay-${index}`}>
                Registar para Reservar
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    ))}
  </>
);

const EventsList = ({ events, user }: { events: EventHighlight[], user: any }) => (
  <>
    {events.map((event, index) => (
      <Card key={index} className="border-l-4 border-l-purple-500 overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-b">
          <div className="text-center">
            <span className="text-4xl mb-2 block">{event.image}</span>
            <span className="text-sm text-gray-600">Foto do evento</span>
          </div>
        </div>
        <CardContent className="pt-4">
          <div className="mb-2">
            <h3 className="font-semibold text-lg">{event.name}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-2xl font-bold text-green-600">{event.price} MZN</p>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{event.date ? format(parseISO(event.date), 'dd/MM/yyyy') : '-'}</span>
            </p>
          </div>
          {user ? (
            <Button className="w-full" size="sm" data-testid={`button-book-event-${index}`}>
              Reservar Ingresso
            </Button>
          ) : (
            <Link href="/signup" className="block w-full">
              <Button className="w-full bg-orange-600 hover:bg-orange-700" size="sm" data-testid={`button-signup-event-${index}`}>
                Registar para Reservar
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    ))}
  </>
);

// âœ… CORREÃ‡ÃƒO: Interface tipada para ofertas especiais
interface SpecialOffer {
  from: string;
  to: string;
  price: number;
  date: string;
  driver: string;
  rating: number;
  isSpecial: boolean;
  discount: string;
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchType, setSearchType] = useState<"rides" | "hotels" | "event-spaces">("rides");
  
  // âœ… CORREÃ‡ÃƒO: Inicializar tambÃ©m fromId, toId, fromOption e toOption
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({ 
    from: "", 
    to: "", 
    date: "",
    fromId: undefined,
    toId: undefined,
    fromOption: undefined,
    toOption: undefined,
  });
  
  // Estado dos modais
  const {
    modalState,
    openRideSearch,
    closeRideSearch,
    openRideCreate,
    closeRideCreate,
    openHotelSearch,
    closeHotelSearch,
  } = useModalState();

  // âœ… CORREÃ‡ÃƒO: FunÃ§Ã£o auxiliar para mostrar toast
  const showToast = (
    title: string, 
    description: string, 
    variant: 'default' | 'destructive' = 'default', 
    action?: React.ReactNode
  ) => {
    toast({ title, description, variant, action });
  };

  // âœ… CORREÃ‡ÃƒO: FunÃ§Ã£o para calcular check-out automÃ¡tico usando date-fns
  const calculateCheckOut = (checkIn: string): string => {
    if (!checkIn) return '';
    try {
      const checkInDate = parseISO(checkIn);
      const checkOutDate = addDays(checkInDate, 1);
      return formatISO(checkOutDate, { representation: 'date' });
    } catch (error) {
      console.error('Erro ao calcular check-out:', error);
      return '';
    }
  };

  // âœ… CORREÃ‡ÃƒO: FunÃ§Ã£o para mudanÃ§a manual do input - AGORA RECEBE LocationOption DIRETAMENTE
  const handleInputChange = (locationOption: LocationOption, type: 'from' | 'to') => {
    setSearchQuery(prev => ({
      ...prev,
      [type]: locationOption.label, // âœ… usa o label do LocationOption
      // Limpa o ID e option quando o usuÃ¡rio digita manualmente
      [`${type}Id`]: undefined,
      [`${type}Option`]: undefined
    }));
  };

  // âœ… CORREÃ‡ÃƒO: FunÃ§Ã£o para lidar com seleÃ§Ã£o de localizaÃ§Ã£o - AGORA RECEBE LocationOption DIRETAMENTE
  const handleLocationSelect = (locationOption: LocationOption, type: 'from' | 'to' = 'from') => {
    if (!locationOption || !locationOption.label) {
      showToast(
        "LocalizaÃ§Ã£o invÃ¡lida", 
        "Por favor, selecione uma localizaÃ§Ã£o vÃ¡lida da lista.", 
        "destructive"
      );
      return;
    }
    
    setSearchQuery(prev => ({
      ...prev,
      [type]: locationOption.label, // âœ… string para display
      [`${type}Id`]: locationOption.id, // âœ… id da localizaÃ§Ã£o
      [`${type}Option`]: locationOption // âœ… objeto completo
    }));
  };

  // âœ… CORREÃ‡ÃƒO: FunÃ§Ã£o de logout usando sessionStorage
  const handleLogout = () => {
    // Limpar dados da sessÃ£o
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('lastSearchResults');
    sessionStorage.removeItem('ridesSearchData');
    
    // Recarregar a pÃ¡gina para limpar estado
    window.location.href = '/';
  };

  // âœ…âœ…âœ… CORREÃ‡ÃƒO CRÃTICA: FunÃ§Ã£o de busca simplificada - sÃ³ navega, nÃ£o busca
  const handleSearch = async () => {
    console.log('Busca:', { type: searchType, ...searchQuery });

    // âœ… VALIDAÃ‡ÃƒO 1: UsuÃ¡rio nÃ£o logado
    if (!user) {
      showToast(
        "Conta necessÃ¡ria",
        "Precisa de criar uma conta gratuita para fazer reservas.",
        "default",
        (
          <Link href="/signup">
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              Criar Conta
            </Button>
          </Link>
        )
      );
      return;
    }

    // âœ… VALIDAÃ‡ÃƒO 2: LocalizaÃ§Ã£o obrigatÃ³ria
    if (!searchQuery.from) {
      showToast(
        "LocalizaÃ§Ã£o necessÃ¡ria",
        "Por favor, selecione uma localizaÃ§Ã£o.",
        "destructive"
      );
      return;
    }

    // âœ… VALIDAÃ‡ÃƒO 3: Data obrigatÃ³ria
    if (!searchQuery.date) {
      showToast(
        "Data necessÃ¡ria",
        "Por favor, selecione uma data.",
        "destructive"
      );
      return;
    }

    // âœ… VALIDAÃ‡ÃƒO 4: Para hotÃ©is, verificar se localizaÃ§Ã£o foi selecionada da lista
    if (searchType === "hotels" && !searchQuery.fromOption?.id) {
      showToast(
        "Selecione uma localizaÃ§Ã£o",
        "Por favor, escolha uma localizaÃ§Ã£o da lista de sugestÃµes para resultados precisos.",
        "destructive"
      );
      return;
    }

    // âœ… VALIDAÃ‡ÃƒO 5: Para rides, destino obrigatÃ³rio
    if (searchType === "rides" && !searchQuery.to) {
      showToast(
        "Destino necessÃ¡rio",
        "Por favor, selecione um destino para a viagem.",
        "destructive"
      );
      return;
    }

    // âœ…âœ…âœ… CORREÃ‡ÃƒO CRÃTICA: SÃ³ navegar, a pÃ¡gina de search faz a busca
    try {
      if (searchType === "rides") {
        // âœ… SÃ³ criar query params e navegar - SEM BUSCAR
        const queryParams = new URLSearchParams({
          from: searchQuery.from,
          to: searchQuery.to,
          date: searchQuery.date,
          passengers: '1',
          fromId: searchQuery.fromOption?.id || '',
          toId: searchQuery.toOption?.id || ''
        }).toString();
        
        console.log('ðŸš€ Navegando para search com params:', queryParams);
        setLocation(`/rides/search?${queryParams}`);
        
      } else if (searchType === "hotels") {
        // âœ… REMOVIDO: ReferÃªncia ao HotelSearchModal
        // Em vez disso, navegar para a pÃ¡gina de hotÃ©is com os parÃ¢metros
        const queryParams = new URLSearchParams({
          location: searchQuery.from,
          locationId: searchQuery.fromOption?.id || '',
          checkIn: searchQuery.date,
          checkOut: calculateCheckOut(searchQuery.date),
          guests: '2'
        }).toString();
        
        setLocation(`/hotels/search?${queryParams}`);
        
      } else if (searchType === "event-spaces") {
        const searchParams = new URLSearchParams({
          location: searchQuery.from,
          date: searchQuery.date,
          type: 'event-space'
        }).toString();
        setLocation(`/event-spaces/search?${searchParams}`);
      }
    } catch (error) {
      console.error('Erro na navegaÃ§Ã£o:', error);
      showToast(
        "Erro na navegaÃ§Ã£o",
        "Ocorreu um erro ao processar sua busca. Tente novamente.",
        "destructive"
      );
    }
  };

  // âœ… CORREÃ‡ÃƒO: Navegar para pÃ¡gina de resultados usando query params
  const handleShowAllResults = (rides: any[], searchParams: any) => {
    // Salvar dados completos no sessionStorage
    sessionStorage.setItem('ridesSearchData', JSON.stringify({
      rides,
      searchParams: {
        from: searchParams.from || searchQuery.from || "",
        to: searchParams.to || searchQuery.to || "",
        date: searchParams.date || searchQuery.date || "",
        passengers: searchParams.passengers || 1
      }
    }));

    // Usar query params para navegaÃ§Ã£o
    const queryParams = new URLSearchParams({
      from: searchParams.from || searchQuery.from || "",
      to: searchParams.to || searchQuery.to || "",
      date: searchParams.date || searchQuery.date || "",
      passengers: (searchParams.passengers || 1).toString(),
      source: 'home_highlights'
    }).toString();

    setLocation(`/rides/search?${queryParams}`);
  };

  // âœ… Dados mock para evitar erros 404
  const weeklyHighlights: ApiHighlights = {
    topRides: [
      { from: "Maputo", to: "Beira", price: 1500, date: "2024-01-15", driver: "JoÃ£o M.", rating: 4.8 },
      { from: "Nampula", to: "Nacala", price: 800, date: "2024-01-16", driver: "Maria S.", rating: 4.9 },
      { from: "Tete", to: "Chimoio", price: 1200, date: "2024-01-17", driver: "Carlos A.", rating: 4.7 },
      { from: "Beira", to: "Inhambane", price: 950, date: "2024-01-18", driver: "Ana L.", rating: 4.9 },
      { from: "Maputo", to: "Xai-Xai", price: 350, date: "2024-01-19", driver: "Pedro K.", rating: 4.6 }
    ],
    topHotels: [
      { name: "Hotel Marisol", location: "Maputo", price: 3500, rating: 4.6, image: "ðŸ¨" },
      { name: "PensÃ£o Oceano", location: "Beira", price: 2200, rating: 4.4, image: "ðŸ–ï¸" },
      { name: "Lodge Safari", location: "Gorongosa", price: 4800, rating: 4.9, image: "ðŸ¦" }
    ],
    featuredEvents: [
      { name: "Festival de Marrabenta", location: "Maputo", date: "2024-02-10", price: 500, image: "ðŸŽµ" },
      { name: "Feira Artesanal", location: "Beira", date: "2024-02-15", price: 200, image: "ðŸŽ¨" },
      { name: "Concerto de MÃºsica", location: "Nampula", date: "2024-02-20", price: 750, image: "ðŸŽ¤" }
    ]
  };

  // âœ… CORREÃ‡ÃƒO: Dados para ofertas especiais com tipagem correta
  const specialRideOffers: SpecialOffer[] = [
    { from: "Maputo", to: "Vilanculos", price: 1800, date: "2024-01-20", driver: "Sofia R.", rating: 4.9, isSpecial: true, discount: "20% OFF" },
    { from: "Beira", to: "Gorongosa", price: 800, date: "2024-01-21", driver: "Manuel C.", rating: 4.8, isSpecial: true, discount: "Oferta VIP" },
    { from: "Nampula", to: "Pemba", price: 1200, date: "2024-01-22", driver: "Antonio M.", rating: 4.7, isSpecial: false, discount: "" }
  ];

  // âœ… CORREÃ‡ÃƒO: Filtrar apenas ofertas especiais
  const filteredSpecialOffers = specialRideOffers.filter(offer => offer.isSpecial);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Link-A MoÃ§ambique
            </h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              App Cliente
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-main-menu">
                  <Menu className="w-4 h-4 mr-2" />
                  Outras Apps
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/drivers" data-testid="link-drivers-app">
                    <Car className="w-4 h-4 mr-2" />
                    App Motoristas
                  </Link>
                </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                    <Link href="/hotels/manage" data-testid="link-hotels-app">
                      <Hotel className="w-4 h-4 mr-2" />
                      Gestão de Hotéis
                    </Link>
                  </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin" data-testid="link-admin-app">
                    <Shield className="w-4 h-4 mr-2" />
                    Painel Admin
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                <Link href="/blog" data-testid="link-blog">
                  <Button variant="ghost">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Blog
                  </Button>
                </Link>
                <Link href="/bookings" data-testid="link-bookings">
                  <Button variant="ghost">ðŸ“‹ Minhas Reservas</Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" data-testid="button-user-menu">
                      <UserCircle className="w-5 h-5 mr-2" />
                      {user.email?.split('@')[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" data-testid="link-profile">
                        <Settings className="w-4 h-4 mr-2" />
                        Perfil & ConfiguraÃ§Ãµes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" data-testid="link-login">
                  <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                    Entrar
                  </Button>
                </Link>
                <Link href="/signup" data-testid="link-signup">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Registar GrÃ¡tis
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {!user && (
        <section className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-5xl font-bold mb-6">
              Bem-vindo ao Futuro do Turismo em MoÃ§ambique
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Encontre boleias, alojamentos e eventos incrÃ­veis. Conecte-se com motoristas e anfitriÃµes verificados. 
              Desfrute de descontos exclusivos e uma experiÃªncia Ãºnica de viagem.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/signup" data-testid="hero-signup-button">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl">
                  <Users className="w-5 h-5 mr-2" />
                  Criar Conta Gratuita
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login" data-testid="hero-login-button">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 text-lg px-8 py-4">
                  JÃ¡ tenho conta
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-4 mb-4">
                  <Car className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Boleias Seguras</h3>
                <p className="opacity-90">Motoristas verificados e viagens com seguranÃ§a garantida</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-4 mb-4">
                  <Hotel className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Alojamentos Ãšnicos</h3>
                <p className="opacity-90">HotÃ©is, pousadas e casas com os melhores preÃ§os</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-4 mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Eventos Exclusivos</h3>
                <p className="opacity-90">Festivais, feiras e eventos culturais moÃ§ambicanos</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className={`mb-8 ${!user ? 'border-orange-200 shadow-lg' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              {user ? 'Encontrar Ofertas' : 'Explorar Ofertas DisponÃ­veis'}
              {!user && <span className="text-sm text-orange-600 font-normal">(Registe-se para reservar)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={searchType === "rides" ? "default" : "outline"}
                onClick={() => setSearchType("rides")}
                data-testid="button-search-rides"
              >
                <Car className="w-4 h-4 mr-2" />
                Boleias
              </Button>
              <Button
                variant={searchType === "hotels" ? "default" : "outline"}
                onClick={() => setSearchType("hotels")}
                data-testid="button-search-hotels"
              >
                <Hotel className="w-4 h-4 mr-2" />
                HotÃ©is
              </Button>
              <Button
                variant={searchType === "event-spaces" ? "default" : "outline"}
                onClick={() => setSearchType("event-spaces")}
                data-testid="button-search-event-spaces"
              >
                <Calendar className="w-4 h-4 mr-2" />
                EspaÃ§os para Eventos
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {searchType === "rides" ? "De onde" : searchType === "hotels" ? "Destino" : "LocalizaÃ§Ã£o do Evento"}
                </label>
                <LocationAutocomplete
                  id="search-from"
                  value={searchQuery.from}
                  onChange={(locationOption) => handleInputChange(locationOption, 'from')} // âœ… AGORA RECEBE LocationOption DIRETAMENTE
                  onLocationSelect={(locationOption) => handleLocationSelect(locationOption, 'from')} // âœ… AGORA RECEBE LocationOption DIRETAMENTE
                  placeholder={searchType === "rides" ? "Cidade de origem (MoÃ§ambique)" : searchType === "hotels" ? "Onde quer ficar (MoÃ§ambique)" : "Local do evento (MoÃ§ambique)"}
                />
              </div>
              {searchType === "rides" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Para onde</label>
                  <LocationAutocomplete
                    id="search-to"
                    value={searchQuery.to}
                    onChange={(locationOption) => handleInputChange(locationOption, 'to')} // âœ… AGORA RECEBE LocationOption DIRETAMENTE
                    onLocationSelect={(locationOption) => handleLocationSelect(locationOption, 'to')} // âœ… AGORA RECEBE LocationOption DIRETAMENTE
                    placeholder="Cidade de destino (MoÃ§ambique)"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <Input
                  type="date"
                  value={searchQuery.date}
                  onChange={(e) => setSearchQuery({...searchQuery, date: e.target.value})}
                  data-testid="input-date"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch} 
                  className="w-full" 
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {user ? 'Buscar' : 'Ver Disponibilidade'}
                </Button>
              </div>
            </div>
            
            {!user && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800">
                      Para fazer reservas, precisa de criar uma conta primeiro
                    </span>
                  </div>
                  <Link href="/signup" data-testid="search-signup-cta">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      Registar Agora
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* âœ… FEEDBACK VISUAL: Atualizado para usar fromOption */}
            {searchType === "hotels" && searchQuery.from && !searchQuery.fromOption?.id && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                âš ï¸ Por favor, selecione uma localizaÃ§Ã£o da lista de sugestÃµes para obter resultados precisos
              </div>
            )}
          </CardContent>
        </Card>

        {searchType === "rides" && filteredSpecialOffers && filteredSpecialOffers.length > 0 && (
          <Card className="mb-8 border-2 border-dashed border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Ofertas Especiais dos Motoristas
                </span>
                <Badge className="bg-yellow-500 text-white pulse animate-pulse">NOVO!</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSpecialOffers.map((offer: SpecialOffer, index: number) => (
                  <Card key={index} className="border-2 border-yellow-400 bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-red-500 text-white text-xs">{offer.discount}</Badge>
                            <Badge variant="outline" className="text-xs border-green-500 text-green-700">Motorista Verificado</Badge>
                          </div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {offer.from} â†’ {offer.to}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {offer.driver}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{offer.rating}</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">{offer.price} MZN</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {offer.date ? format(parseISO(offer.date), 'dd/MM/yyyy') : '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            SaÃ­da: 07:00
                          </span>
                        </div>
                      </div>
                      
                      {user ? (
                        <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" size="sm">
                          <Award className="w-4 h-4 mr-2" />
                          Reservar Oferta Especial
                        </Button>
                      ) : (
                        <Link href="/signup" className="block w-full">
                          <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" size="sm">
                            Registar para Esta Oferta
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  ðŸ’¡ <strong>Dica:</strong> Ofertas especiais sÃ£o publicadas diretamente pelos motoristas e tÃªm disponibilidade limitada!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {searchType === "rides" ? "Viagens Populares" : "Destaques da Semana"}
              {!user && <span className="text-sm text-gray-500 font-normal ml-2">- Veja o que estÃ¡ disponÃ­vel</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {searchType === "rides" && (
                <RidesList rides={weeklyHighlights.topRides} user={user} />
              )}

              {searchType === "hotels" && (
                <StaysList stays={weeklyHighlights.topHotels} user={user} />
              )}

              {searchType === "event-spaces" && (
                <EventsList events={weeklyHighlights.featuredEvents} user={user} />
              )}
            </div>
            
            {searchType === "rides" && (
              <div className="mt-6 text-center">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleShowAllResults(weeklyHighlights.topRides, {
                    ...searchQuery,
                    passengers: 1
                  })}
                  data-testid="button-view-all-rides"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Ver Todas as Viagens DisponÃ­veis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!user && (
          <Card className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-center text-orange-800">
                Porque se Registar no Link-A?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-4">
                  <div className="text-orange-600 mb-2">âœ…</div>
                  <h4 className="font-semibold text-orange-800">GrÃ¡tis para Sempre</h4>
                  <p className="text-sm text-orange-700">Registo e uso bÃ¡sico completamente gratuito</p>
                </div>
                <div className="p-4">
                  <div className="text-orange-600 mb-2">ðŸ›¡ï¸</div>
                  <h4 className="font-semibold text-orange-800">SeguranÃ§a Total</h4>
                  <p className="text-sm text-orange-700">Utilizadores verificados e transaÃ§Ãµes seguras</p>
                </div>
                <div className="p-4">
                  <div className="text-orange-600 mb-2">ðŸ’°</div>
                  <h4 className="font-semibold text-orange-800">Melhor PreÃ§o</h4>
                  <p className="text-sm text-orange-700">Descontos exclusivos e ofertas especiais</p>
                </div>
                <div className="p-4">
                  <div className="text-orange-600 mb-2">ðŸ“±</div>
                  <h4 className="font-semibold text-orange-800">Tudo num SÃ­tio</h4>
                  <p className="text-sm text-orange-700">Boleias, hotÃ©is e eventos numa sÃ³ plataforma</p>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <Link href="/signup" data-testid="benefits-signup-button">
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3">
                    <Users className="w-5 h-5 mr-2" />
                    Criar Conta Gratuita Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* âœ… CORREÃ‡ÃƒO: Modal de Busca de Viagens com fallback */}
      <ModalOverlay 
        isOpen={modalState.rideSearch.isOpen} 
        onClose={closeRideSearch}
        title="Buscar Viagens"
        maxWidth="6xl"
      >
        <RideSearchModal 
          initialParams={modalState.rideSearch.params || { from: '', to: '', date: '', passengers: 1 }}
        />
      </ModalOverlay>
      
      {/* âœ… CORREÃ‡ÃƒO: Modal de Criar Viagem */}
      <ModalOverlay 
        isOpen={modalState.rideCreate.isOpen} 
        onClose={closeRideCreate}
        title="Criar Nova Viagem"
        maxWidth="4xl"
      >
        <RideCreateModal 
          initialParams={modalState.rideCreate.params || { from: '', to: '', date: '', passengers: 1 }}
          onClose={closeRideCreate}
        />
      </ModalOverlay>
      
      {/* âœ… REMOVIDO: Modal de Busca de HotÃ©is */}
    </div>
  );
}
