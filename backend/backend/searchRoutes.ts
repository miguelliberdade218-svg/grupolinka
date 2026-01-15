// src/routes/searchRoutes.ts
import { Router } from "express";

// ✅ IMPORTS CORRETOS
import { searchHotels, getHotelById } from "./src/modules/hotels/hotelService";
import { searchEventSpaces } from "./src/modules/events/eventService";
import { SmartRideMatchingService, type RideWithMatching } from "./services/SmartRideMatchingService";

const router = Router();

// Interface para resultados de busca universal
interface SearchResultItem {
  id: string;
  title: string;
  type: "ride" | "accommodation" | "event_space";
  price?: number;
  description?: string;
  location?: string;
  image?: string;
  [key: string]: any;
}

// BUSCA DE RIDES
router.get("/rides", async (req, res) => {
  try {
    const { 
      from, 
      to, 
      minPrice,
      maxPrice,
      vehicleType,
      seats,
      allowNegotiation,
      driverId,
      smartSearch = 'true',
      radiusKm = '100',
      maxResults = '50'
    } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "Origem e destino são obrigatórios" });
    }

    let rides: any[] = [];

    if (smartSearch === 'true') {
      try {
        const smartRides = await SmartRideMatchingService.searchRidesSmart(
          from as string,
          to as string,
          Number(radiusKm),
          Number(maxResults)
        );

        rides = smartRides.map((matchingRide: RideWithMatching) => {
          const ride = matchingRide.ride || matchingRide;

          return {
            id: matchingRide.id || ride.id || ride.ride_id,
            driverId: matchingRide.driver_id || ride.driverId || ride.driver_id,
            driverName: matchingRide.driver_name || ride.driverName || 'Motorista',
            fromLocation: matchingRide.from_city || ride.fromCity || from as string,
            toLocation: matchingRide.to_city || ride.toCity || to as string,
            price: matchingRide.priceperseat || ride.pricePerSeat || 0,
            availableSeats: matchingRide.availableseats || ride.availableSeats || 0,
            departureDate: matchingRide.departuredate ? new Date(matchingRide.departuredate) : new Date(),
            vehicleType: matchingRide.vehicle_type || ride.vehicleType,
            driverRating: matchingRide.driver_rating || ride.driverRating,
            matchScore: matchingRide.compatibilityScore,
            matchType: matchingRide.matchType,
          };
        });
      } catch (error) {
        console.error("Erro na busca inteligente de rides:", error);
        rides = [];
      }
    }

    // Filtros adicionais
    let filteredRides = rides;
    if (minPrice) filteredRides = filteredRides.filter(r => r.price >= Number(minPrice));
    if (maxPrice) filteredRides = filteredRides.filter(r => r.price <= Number(maxPrice));
    if (seats) filteredRides = filteredRides.filter(r => r.availableSeats >= Number(seats));
    if (allowNegotiation === 'true') filteredRides = filteredRides.filter(r => r.allowNegotiation);
    if (vehicleType) filteredRides = filteredRides.filter(r => r.vehicleType?.toLowerCase().includes((vehicleType as string).toLowerCase()));
    if (driverId) filteredRides = filteredRides.filter(r => r.driverId === driverId);

    res.json({
      success: true,
      rides: filteredRides,
      total: filteredRides.length,
    });
  } catch (error) {
    console.error("Error searching rides:", error);
    res.status(500).json({ error: "Erro ao pesquisar viagens" });
  }
});

// BUSCA DE ACOMODAÇÕES (HOTÉIS)
router.get("/accommodations", async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests } = req.query;

    const filters: any = { isActive: true };

    if (location) filters.query = location as string;
    if (checkIn) filters.checkIn = checkIn as string;
    if (checkOut) filters.checkOut = checkOut as string;
    if (guests) filters.guests = Number(guests);

    const hotelsList = await searchHotels(filters);

    res.json({
      success: true,
      accommodations: hotelsList,
      total: hotelsList.length,
    });
  } catch (error) {
    console.error("Erro ao pesquisar acomodações:", error);
    res.status(500).json({ error: "Erro ao pesquisar acomodações" });
  }
});

// DETALHES DE UM HOTEL (CORRIGIDO - usa getHotelById)
router.get("/accommodations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await getHotelById(id);

    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel não encontrado" });
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Erro ao buscar hotel:", error);
    res.status(500).json({ success: false, message: "Erro ao buscar hotel" });
  }
});

// BUSCA UNIVERSAL
router.get("/all", async (req, res) => {
  try {
    const { query, type } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Termo de pesquisa obrigatório" });
    }

    const searchTerm = (query as string).toLowerCase();
    const results: { rides: SearchResultItem[], accommodations: SearchResultItem[], events: SearchResultItem[], total: number } = {
      rides: [],
      accommodations: [],
      events: [],
      total: 0
    };

    // Rides
    if (!type || type === 'rides') {
      try {
        const smartRides = await SmartRideMatchingService.searchRidesSmart(searchTerm, '', 100, 10);
        results.rides = smartRides.slice(0, 5).map((r: any) => ({
          id: r.id,
          title: `${r.from_city} → ${r.to_city}`,
          type: "ride",
          price: r.priceperseat,
          description: `Viagem com ${r.driver_name || 'motorista'}`,
        }));
      } catch (e) {
        results.rides = [];
      }
    }

    // Accommodations
    if (!type || type === 'accommodations') {
      try {
        const hotelsList = await searchHotels({ query: searchTerm });
        results.accommodations = hotelsList.slice(0, 5).map((h: any) => ({
          id: h.id,
          title: h.name,
          type: "accommodation",
          price: h.availableRoomTypes?.[0]?.roomType?.base_price || 0,
          description: h.description || `Hotel em ${h.locality}`,
        }));
      } catch (e) {
        results.accommodations = [];
      }
    }

    // Events
    if (!type || type === 'events') {
      try {
        const eventSpacesList = await searchEventSpaces({ query: searchTerm });
        results.events = eventSpacesList.slice(0, 5).map((item: any) => ({
          id: item.space.id,
          title: item.space.name,
          type: "event_space",
          price: item.basePrice,
          description: item.space.description || `Espaço no ${item.hotel.name}`,
          location: `${item.hotel.locality}, ${item.hotel.province}`,
        }));
      } catch (error) {
        results.events = [];
      }
    }

    results.total = results.rides.length + results.accommodations.length + results.events.length;

    res.json({
      success: true,
      query: searchTerm,
      results,
    });
  } catch (error) {
    console.error("Error in universal search:", error);
    res.status(500).json({ error: "Erro na pesquisa universal" });
  }
});

export default router;