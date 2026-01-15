import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import EventSearch from "@/shared/components/EventSearch";
import EventResults from "@/shared/components/EventResults";
import EventSearchResults from "@/shared/components/EventSearchResults";
import MobileNavigation from "@/shared/components/MobileNavigation";
import PageHeader from "@/shared/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";

export default function EventsPage() {
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState({
    location: "",
    category: "",
    eventType: "",
    startDate: "",
    endDate: "",
  });

  const [urlSearchParams, setUrlSearchParams] = useState<{
    city?: string;
    month?: string;
    year?: string;
    category?: string;
  }>({});

  const [hasSearched, setHasSearched] = useState(false);

  // Parse URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const city = params.get('city');
    const month = params.get('month');
    const year = params.get('year');
    const category = params.get('category');
    
    if (city && month && year) {
      setUrlSearchParams({ city, month, year, category: category || undefined });
      setHasSearched(true);
    }
  }, []);

  const handleSearch = (params: typeof searchParams) => {
    setSearchParams(params);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Eventos e Feiras" />
      
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl">🎪</span>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Descubra eventos incríveis com ofertas especiais em alojamentos e transporte
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-sm">
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
              <i className="fas fa-handshake mr-1"></i>
              Parcerias com Hotéis
            </Badge>
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
              <i className="fas fa-car mr-1"></i>
              Descontos em Transporte
            </Badge>
            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-800">
              <i className="fas fa-utensils mr-1"></i>
              Ofertas Gastronómicas
            </Badge>
          </div>
        </div>

        {/* URL-based search results (from header search) */}
        {urlSearchParams.city && urlSearchParams.month && urlSearchParams.year ? (
          <EventSearchResults 
            city={urlSearchParams.city}
            month={urlSearchParams.month}
            year={urlSearchParams.year}
            category={urlSearchParams.category}
          />
        ) : (
          <>
            {/* Search Section */}
            <div className="mb-8">
              <EventSearch onSearch={handleSearch} />
            </div>

            {/* Results or Categories */}
            <div className="space-y-8">
              {hasSearched ? (
                <EventResults searchParams={searchParams} />
              ) : (
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="upcoming" data-testid="upcoming-events-tab">
                  <i className="fas fa-calendar-alt mr-2"></i>
                  Próximos
                </TabsTrigger>
                <TabsTrigger value="culture" data-testid="culture-events-tab">
                  <i className="fas fa-masks-theater mr-2"></i>
                  Cultura
                </TabsTrigger>
                <TabsTrigger value="business" data-testid="business-events-tab">
                  <i className="fas fa-briefcase mr-2"></i>
                  Negócios
                </TabsTrigger>
                <TabsTrigger value="entertainment" data-testid="entertainment-events-tab">
                  <i className="fas fa-music mr-2"></i>
                  Entretenimento
                </TabsTrigger>
                <TabsTrigger value="food" data-testid="food-events-tab">
                  <i className="fas fa-utensils mr-2"></i>
                  Gastronomia
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-6">
                <EventResults 
                  searchParams={{ 
                    location: "", 
                    category: "", 
                    eventType: "", 
                    startDate: "",
                    endDate: "" 
                  }} 
                />
              </TabsContent>

              <TabsContent value="culture" className="space-y-6">
                <EventResults 
                  searchParams={{ 
                    location: "", 
                    category: "cultura", 
                    eventType: "", 
                    startDate: "",
                    endDate: "" 
                  }} 
                />
              </TabsContent>

              <TabsContent value="business" className="space-y-6">
                <EventResults 
                  searchParams={{ 
                    location: "", 
                    category: "negocios", 
                    eventType: "", 
                    startDate: "",
                    endDate: "" 
                  }} 
                />
              </TabsContent>

              <TabsContent value="entertainment" className="space-y-6">
                <EventResults 
                  searchParams={{ 
                    location: "", 
                    category: "entretenimento", 
                    eventType: "", 
                    startDate: "",
                    endDate: "" 
                  }} 
                />
              </TabsContent>

              <TabsContent value="food" className="space-y-6">
                <EventResults 
                  searchParams={{ 
                    location: "", 
                    category: "gastronomia", 
                    eventType: "", 
                    startDate: "",
                    endDate: "" 
                  }} 
                />
              </TabsContent>
            </Tabs>
              )}
            </div>
          </>
        )}

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-calendar-check text-purple-600 text-xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">150+</h3>
            <p className="text-gray-600 text-sm">Eventos Ativos</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-handshake text-green-600 text-xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">80+</h3>
            <p className="text-gray-600 text-sm">Parcerias Ativas</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">25K+</h3>
            <p className="text-gray-600 text-sm">Participantes</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-percentage text-yellow-600 text-xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">25%</h3>
            <p className="text-gray-600 text-sm">Desconto Médio</p>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}