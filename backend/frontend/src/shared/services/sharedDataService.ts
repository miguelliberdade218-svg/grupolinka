// Serviço de dados compartilhados entre aplicações
// Simula uma base de dados real usando localStorage

export interface SharedRide {
  id: string;
  driverId: string;
  driverName: string;
  fromAddress: string;
  toAddress: string;
  departureDate: string;
  price: number;
  maxPassengers: number;
  availableSeats: number;
  type: string;
  vehicleInfo?: string;
  vehiclePhoto?: string | null;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface SearchParams {
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
}

export class SharedDataService {
  private static RIDES_KEY = 'link_a_rides';
  private static BOOKINGS_KEY = 'link_a_bookings';

  // ===== RIDES MANAGEMENT =====
  
  static getAllRides(): SharedRide[] {
    try {
      const ridesData = localStorage.getItem(this.RIDES_KEY);
      return ridesData ? JSON.parse(ridesData) : [];
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
      return [];
    }
  }

  static saveRide(ride: SharedRide): boolean {
    try {
      const rides = this.getAllRides();
      const existingIndex = rides.findIndex(r => r.id === ride.id);
      
      if (existingIndex >= 0) {
        // Atualizar rota existente
        rides[existingIndex] = { ...ride, updatedAt: new Date().toISOString() };
      } else {
        // Adicionar nova rota
        rides.push(ride);
      }
      
      localStorage.setItem(this.RIDES_KEY, JSON.stringify(rides));
      console.log('✅ Rota salva:', ride);
      return true;
    } catch (error) {
      console.error('Erro ao salvar rota:', error);
      return false;
    }
  }

  static getRideById(rideId: string): SharedRide | null {
    const rides = this.getAllRides();
    return rides.find(ride => ride.id === rideId) || null;
  }

  static searchRides(params: SearchParams): SharedRide[] {
    const rides = this.getAllRides();
    let filteredRides = rides.filter(ride => ride.status === 'active');
    
    // Filtrar por origem
    if (params.from) {
      const fromLower = params.from.toLowerCase();
      filteredRides = filteredRides.filter(ride => 
        ride.fromAddress.toLowerCase().includes(fromLower) ||
        fromLower.includes(ride.fromAddress.toLowerCase())
      );
    }
    
    // Filtrar por destino
    if (params.to) {
      const toLower = params.to.toLowerCase();
      filteredRides = filteredRides.filter(ride => 
        ride.toAddress.toLowerCase().includes(toLower) ||
        toLower.includes(ride.toAddress.toLowerCase())
      );
    }
    
    // Filtrar por número de passageiros
    if (params.passengers) {
      filteredRides = filteredRides.filter(ride => 
        ride.availableSeats >= params.passengers!
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
    
    // Ordenar por data de partida (mais próximas primeiro)
    filteredRides.sort((a, b) => 
      new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
    );
    
    console.log(`🔍 Busca: ${filteredRides.length} rotas encontradas para`, params);
    return filteredRides;
  }

  static deleteRide(rideId: string): boolean {
    try {
      const rides = this.getAllRides();
      const filteredRides = rides.filter(ride => ride.id !== rideId);
      localStorage.setItem(this.RIDES_KEY, JSON.stringify(filteredRides));
      console.log('🗑️ Rota removida:', rideId);
      return true;
    } catch (error) {
      console.error('Erro ao remover rota:', error);
      return false;
    }
  }

  static updateRideSeats(rideId: string, seatsBooked: number): boolean {
    try {
      const rides = this.getAllRides();
      const rideIndex = rides.findIndex(r => r.id === rideId);
      
      if (rideIndex >= 0) {
        rides[rideIndex].availableSeats -= seatsBooked;
        rides[rideIndex].updatedAt = new Date().toISOString();
        
        // Se não há mais lugares disponíveis, marcar como completa
        if (rides[rideIndex].availableSeats <= 0) {
          rides[rideIndex].status = 'completed';
        }
        
        localStorage.setItem(this.RIDES_KEY, JSON.stringify(rides));
        console.log(`🎫 ${seatsBooked} lugares reservados na rota ${rideId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar lugares:', error);
      return false;
    }
  }

  // ===== MOTORISTA SPECIFIC =====
  
  static getDriverRides(driverId: string): SharedRide[] {
    const rides = this.getAllRides();
    return rides.filter(ride => ride.driverId === driverId);
  }

  // ===== STATISTICS =====
  
  static getStats() {
    const rides = this.getAllRides();
    const activeRides = rides.filter(r => r.status === 'active');
    
    return {
      totalRides: rides.length,
      activeRides: activeRides.length,
      completedRides: rides.filter(r => r.status === 'completed').length,
      totalRoutes: new Set(rides.map(r => `${r.fromAddress}-${r.toAddress}`)).size
    };
  }

  // ===== INICIALIZAÇÃO =====
  
  static initializeWithSampleData() {
    const existingRides = this.getAllRides();
    
    // Se não há dados, criar algumas rotas de exemplo
    if (existingRides.length === 0) {
      const sampleRides: SharedRide[] = [
        {
          id: 'sample-1',
          driverId: 'driver-sample',
          driverName: 'Carlos Manhiça',
          fromAddress: 'Maputo',
          toAddress: 'Matola',
          departureDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          price: 80,
          maxPassengers: 4,
          availableSeats: 3,
          type: 'Standard',
          vehicleInfo: 'Toyota Corolla Prata 2018',
          description: 'Viagem confortável e segura com ar condicionado',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      sampleRides.forEach(ride => this.saveRide(ride));
      console.log('🎯 Dados de exemplo inicializados');
    }
  }
}

// Inicializar dados de exemplo na primeira vez
SharedDataService.initializeWithSampleData();