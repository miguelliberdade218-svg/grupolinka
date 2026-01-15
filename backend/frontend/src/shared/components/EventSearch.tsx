import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { CalendarIcon, MapPinIcon, TagIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/shared/lib/utils";

interface EventSearchProps {
  onSearch: (params: {
    location: string;
    category: string;
    eventType: string;
    startDate: string;
    endDate: string;
  }) => void;
}

export default function EventSearch({ onSearch }: EventSearchProps) {
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [eventType, setEventType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleSearch = () => {
    onSearch({
      location,
      category,
      eventType,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    });
  };

  const categories = [
    { value: "cultura", label: "Cultura" },
    { value: "negocios", label: "Negócios" },
    { value: "entretenimento", label: "Entretenimento" },
    { value: "gastronomia", label: "Gastronomia" },
    { value: "educacao", label: "Educação" },
    { value: "desporto", label: "Desporto" },
  ];

  const eventTypes = [
    { value: "feira", label: "Feira" },
    { value: "festival", label: "Festival" },
    { value: "concerto", label: "Concerto" },
    { value: "conferencia", label: "Conferência" },
    { value: "workshop", label: "Workshop" },
    { value: "exposicao", label: "Exposição" },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
          <i className="fas fa-calendar-alt text-white text-xl"></i>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Procurar Eventos</h2>
          <p className="text-gray-600 text-sm">Descubra eventos e feiras próximos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <MapPinIcon className="w-4 h-4 mr-1" />
            Localização
          </label>
          <Input
            placeholder="Maputo, Matola..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            data-testid="event-location-input"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <TagIcon className="w-4 h-4 mr-1" />
            Categoria
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger data-testid="event-category-select">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Event Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger data-testid="event-type-select">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Data Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
                data-testid="start-date-picker"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Data Fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
                data-testid="end-date-picker"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSearch}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6"
          data-testid="search-events-button"
        >
          <i className="fas fa-search mr-2"></i>
          Procurar Eventos
        </Button>
      </div>
    </div>
  );
}