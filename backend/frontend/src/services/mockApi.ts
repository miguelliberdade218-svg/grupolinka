// Mock API Service - Sistema completo de viagens e acomodações
interface Ride {
  id: string;
  type: string;
  fromAddress: string;
  toAddress: string;
  price: string;
  estimatedDuration: number;
  availableSeats: number;
  driverName: string;
  vehicleInfo: string;
  vehiclePhoto?: string | null;
  description?: string;
  departureDate: string;
  createdAt: string;
  status: string;
}

interface Accommodation {
  id: string;
  name: string;
  type: string;
  location: string;
  price: string;
  rating: number;
  amenities: string[];
  description: string;
  images: string[];
  availableRooms: number;
  createdAt: string;
}

interface Booking {
  id: string;
  type: 'ride' | 'accommodation';
  itemId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: string;
  bookingDate: string;
  details: any;
}

interface CreateAccommodationRequest {
  name: string;
  type: string;
  address: string;
  lat?: number;
  lng?: number;
  rating?: number;
  images?: string[];
  amenities?: string[];
  description?: string;
  hostId?: string;
  pricePerNight?: number;
  reviewCount?: number;
  distanceFromCenter?: number;
  isAvailable?: boolean;
  offerDriverDiscounts?: boolean;
  driverDiscountRate?: number;
  minimumDriverLevel?: string;
  partnershipBadgeVisible?: boolean;
  enablePartnerships?: boolean;
  accommodationDiscount?: number;
  transportDiscount?: number;
}

// Armazenamento em memória com dados mais realistas de Moçambique
let rides: Ride[] = [
  {
    id: '1',
    type: 'Standard',
    fromAddress: 'Maputo',
    toAddress: 'Matola',
    price: '80.00',
    estimatedDuration: 45,
    availableSeats: 3,
    driverName: 'Carlos Manhiça',
    vehicleInfo: 'Toyota Corolla Prata 2018',
    vehiclePhoto: null,
    description: 'Viagem confortável e segura com ar condicionado',
    departureDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas à frente
    createdAt: new Date().toISOString(),
    status: 'published'
  },
  {
    id: '2',
    type: 'Premium',
    fromAddress: 'Maputo',
    toAddress: 'Inhambane',
    price: '1200.00',
    estimatedDuration: 300,
    availableSeats: 2,
    driverName: 'Ana Macuácua',
    vehicleInfo: 'Mercedes-Benz Classe C Azul 2020',
    vehiclePhoto: null,
    description: 'Viagem premium com paragens para descanso e refeições incluídas',
    departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // amanhã
    createdAt: new Date().toISOString(),
    status: 'published'
  },
  {
    id: '3',
    type: 'Econômico',
    fromAddress: 'Maputo',
    toAddress: 'Xai-Xai',
    price: '350.00',
    estimatedDuration: 120,
    availableSeats: 4,
    driverName: 'Tomás Sithole',
    vehicleInfo: 'Nissan Sentra Branco 2016',
    vehiclePhoto: null,
    description: 'Opção económica e rápida para Xai-Xai',
    departureDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas à frente
    createdAt: new Date().toISOString(),
    status: 'published'
  },
  {
    id: '4',
    type: 'Standard',
    fromAddress: 'Inhambane',
    toAddress: 'Maputo',
    price: '1150.00',
    estimatedDuration: 290,
    availableSeats: 3,
    driverName: 'Felisberto Cossa',
    vehicleInfo: 'Honda Civic Cinza 2019',
    vehiclePhoto: null,
    description: 'Regresso de Inhambane para Maputo, viagem confortável',
    departureDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 dias
    createdAt: new Date().toISOString(),
    status: 'published'
  },
  {
    id: '5',
    type: 'Minibus',
    fromAddress: 'Maputo',
    toAddress: 'Beira',
    price: '2800.00',
    estimatedDuration: 600,
    availableSeats: 8,
    driverName: 'Joaquim Chissano',
    vehicleInfo: 'Toyota Hiace Branco 2017',
    vehiclePhoto: null,
    description: 'Viagem longa com várias paragens, ideal para grupos',
    departureDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 3 dias
    createdAt: new Date().toISOString(),
    status: 'published'
  },
  {
    id: '6',
    type: 'Standard',
    fromAddress: 'Matola',
    toAddress: 'Maputo',
    price: '75.00',
    estimatedDuration: 40,
    availableSeats: 3,
    driverName: 'Maria Nhamuave',
    vehicleInfo: 'Hyundai Accent Vermelho 2018',
    vehiclePhoto: null,
    description: 'Trajeto rápido entre Matola e Maputo centro',
    departureDate: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 1.5 horas
    createdAt: new Date().toISOString(),
    status: 'published'
  },
  {
    id: '7',
    type: 'Premium',
    fromAddress: 'Maputo',
    toAddress: 'Vilanculos',
    price: '1800.00',
    estimatedDuration: 360,
    availableSeats: 2,
    driverName: 'Eduardo Mabjaia',
    vehicleInfo: 'BMW X3 Preto 2021',
    vehiclePhoto: null,
    description: 'Viagem de luxo para Vilanculos com WiFi e bebidas incluídas',
    departureDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(), // 1.5 dias
    createdAt: new Date().toISOString(),
    status: 'published'
  },
  {
    id: '8',
    type: 'Econômico',
    fromAddress: 'Xai-Xai',
    toAddress: 'Maputo',
    price: '320.00',
    estimatedDuration: 115,
    availableSeats: 4,
    driverName: 'Albertina Mucavel',
    vehicleInfo: 'Suzuki Swift Azul 2015',
    vehiclePhoto: null,
    description: 'Retorno económico de Xai-Xai para Maputo',
    departureDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 horas
    createdAt: new Date().toISOString(),
    status: 'published'
  }
];

let accommodations: Accommodation[] = [
  {
    id: '1',
    name: 'Hotel Maputo Plaza',
    type: 'Hotel',
    location: 'Maputo',
    price: '2500.00',
    rating: 4.5,
    amenities: ['WiFi', 'Piscina', 'Restaurante', 'Academia'],
    description: 'Hotel luxuoso no centro de Maputo com vista para a baía',
    images: [],
    availableRooms: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Pousada Beira Mar',
    type: 'Pousada',
    location: 'Beira',
    price: '1200.00',
    rating: 4.0,
    amenities: ['WiFi', 'Café da manhã', 'Ar condicionado'],
    description: 'Pousada aconchegante próxima à praia',
    images: [],
    availableRooms: 8,
    createdAt: new Date().toISOString()
  }
];

let bookings: Booking[] = [];

// API Service
export class MockApiService {
  // ===== RIDES API =====
  
  static async createRide(rideData: any): Promise<{ success: boolean; message: string; route: Ride }> {
    console.log('📝 Criando nova rota:', rideData);
    
    // Validação
    if (!rideData.from || !rideData.to || !rideData.price) {
      throw new Error('Dados obrigatórios faltando: De onde, Para onde e Preço são obrigatórios');
    }
    
    // Simular upload da foto se presente
    let vehiclePhotoUrl = null;
    if (rideData.vehiclePhoto) {
      // Em uma implementação real, faria upload para cloud storage
      vehiclePhotoUrl = URL.createObjectURL(rideData.vehiclePhoto);
      console.log('📸 Foto do veículo processada');
    }
    
    // Criar nova rota
    const newRide: Ride = {
      id: Date.now().toString(),
      type: rideData.vehicleType || 'Standard',
      fromAddress: rideData.from,
      toAddress: rideData.to,
      price: rideData.price.toString(),
      estimatedDuration: 45,
      availableSeats: parseInt(rideData.seats) || 4,
      driverName: 'Motorista Atual',
      vehicleInfo: `${rideData.vehicleType || 'Veículo'} - Disponível`,
      vehiclePhoto: vehiclePhotoUrl,
      description: rideData.description || '',
      departureDate: rideData.date && rideData.time ? 
        `${rideData.date}T${rideData.time}:00.000Z` : 
        new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'published'
    };
    
    rides.push(newRide);
    console.log('✅ Nova rota criada:', newRide);
    
    return {
      success: true,
      message: 'Rota publicada com sucesso!',
      route: newRide
    };
  }
  
  static async searchRides(params: { from?: string; to?: string; passengers?: string; date?: string }): Promise<{ rides: Ride[]; pagination: any }> {
    console.log('🔍 Buscar viagens:', params);
    
    let filteredRides = [...rides];
    
    // Busca flexível por origem
    if (params.from) {
      const fromLower = params.from.toLowerCase();
      filteredRides = filteredRides.filter(ride => 
        ride.fromAddress.toLowerCase().includes(fromLower) ||
        fromLower.includes(ride.fromAddress.toLowerCase())
      );
    }
    
    // Busca flexível por destino
    if (params.to) {
      const toLower = params.to.toLowerCase();
      filteredRides = filteredRides.filter(ride => 
        ride.toAddress.toLowerCase().includes(toLower) ||
        toLower.includes(ride.toAddress.toLowerCase())
      );
    }
    
    // Filtrar por número de passageiros
    if (params.passengers) {
      const requiredSeats = parseInt(params.passengers);
      filteredRides = filteredRides.filter(ride => 
        ride.availableSeats >= requiredSeats
      );
    }
    
    // Filtrar por data (mesmo dia)
    if (params.date) {
      const searchDate = new Date(params.date);
      filteredRides = filteredRides.filter(ride => {
        const rideDate = new Date(ride.departureDate);
        return rideDate.toDateString() === searchDate.toDateString();
      });
    }
    
    // Ordenar por preço (mais baratos primeiro)
    filteredRides.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    console.log(`🎯 Encontradas ${filteredRides.length} viagens para os critérios especificados`);
    
    return {
      rides: filteredRides,
      pagination: {
        page: 1,
        limit: 20,
        total: filteredRides.length
      }
    };
  }
  
  static async getAllRides(): Promise<{ rides: Ride[]; total: number }> {
    return {
      rides: rides,
      total: rides.length
    };
  }
  
  // ===== ACCOMMODATIONS API =====
  
  static async searchAccommodations(params: { location?: string; type?: string; maxPrice?: string }): Promise<{ accommodations: Accommodation[]; pagination: any }> {
    console.log('🏨 Buscar acomodações:', params);
    
    let filteredAccommodations = [...accommodations];
    
    if (params.location) {
      filteredAccommodations = filteredAccommodations.filter(acc => 
        acc.location.toLowerCase().includes(params.location!.toLowerCase())
      );
    }
    
    if (params.type) {
      filteredAccommodations = filteredAccommodations.filter(acc => 
        acc.type.toLowerCase().includes(params.type!.toLowerCase())
      );
    }
    
    if (params.maxPrice) {
      const maxPrice = parseFloat(params.maxPrice);
      filteredAccommodations = filteredAccommodations.filter(acc => 
        parseFloat(acc.price) <= maxPrice
      );
    }
    
    return {
      accommodations: filteredAccommodations,
      pagination: {
        page: 1,
        limit: 20,
        total: filteredAccommodations.length
      }
    };
  }
  
  static async getAllAccommodations(): Promise<{ accommodations: Accommodation[]; total: number }> {
    return {
      accommodations: accommodations,
      total: accommodations.length
    };
  }

  // Criar nova acomodação
  static async createAccommodation(data: CreateAccommodationRequest): Promise<Accommodation> {
    console.log("🟢 MockApiService: Criando acomodação", data);

    const newAccommodation: Accommodation = {
      id: "mock-id-" + Math.floor(Math.random() * 1000),
      name: data.name,
      type: data.type,
      location: data.address,      // 🔹 mapear address -> location
      price: (data.pricePerNight || 0).toString(), // 🔹 mapear pricePerNight -> price (convertendo para string)
      description: data.description || '',
      amenities: data.amenities || [],
      images: data.images || [],
      availableRooms: 1,
      rating: data.rating || 4.0,
      createdAt: new Date().toISOString(),
    };

    // Adicionar à lista de acomodações
    accommodations.push(newAccommodation);
    
    console.log('✅ Nova acomodação criada:', newAccommodation);
    
    return newAccommodation;
  }
  
  // ===== BOOKINGS API =====
  
  static async createBooking(bookingData: any): Promise<{ success: boolean; message: string; booking: Booking }> {
    console.log('📋 Criando reserva:', bookingData);
    
    const newBooking: Booking = {
      id: Date.now().toString(),
      type: bookingData.type,
      itemId: bookingData.itemId,
      userId: bookingData.userId || 'current-user',
      status: 'confirmed',
      totalPrice: bookingData.totalPrice,
      bookingDate: new Date().toISOString(),
      details: bookingData.details || {}
    };
    
    bookings.push(newBooking);
    
    // Atualizar disponibilidade
    if (bookingData.type === 'ride') {
      const ride = rides.find(r => r.id === bookingData.itemId);
      if (ride && ride.availableSeats > 0) {
        ride.availableSeats--;
      }
    } else if (bookingData.type === 'accommodation') {
      const accommodation = accommodations.find(a => a.id === bookingData.itemId);
      if (accommodation && accommodation.availableRooms > 0) {
        accommodation.availableRooms--;
      }
    }
    
    console.log('✅ Reserva criada:', newBooking);
    
    return {
      success: true,
      message: 'Reserva confirmada com sucesso!',
      booking: newBooking
    };
  }
  
  static async getUserBookings(userId: string): Promise<{ bookings: Booking[] }> {
    const userBookings = bookings.filter(booking => booking.userId === userId);
    return { bookings: userBookings };
  }
  
  // ===== HEALTH CHECK =====
  
  static async healthCheck(): Promise<{ status: string; message: string; stats: any }> {
    return {
      status: 'OK',
      message: 'Link-A API funcionando (Mock Service)',
      stats: {
        totalRides: rides.length,
        totalAccommodations: accommodations.length,
        totalBookings: bookings.length,
        timestamp: new Date().toISOString()
      }
    };
  }
}