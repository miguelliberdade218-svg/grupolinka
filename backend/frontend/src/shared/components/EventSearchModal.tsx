import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Calendar, MapPin, Search } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";

interface EventSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (searchParams: EventSearchParams) => void;
}

export interface EventSearchParams {
  city: string;
  month: string;
  year: string;
  category?: string;
}

export default function EventSearchModal({ isOpen, onClose, onSearch }: EventSearchModalProps) {
  const [searchData, setSearchData] = useState<EventSearchParams>({
    city: "",
    month: "",
    year: new Date().getFullYear().toString(),
    category: ""
  });
  
  const { toast } = useToast();

  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i);

  const cities = [
    "Maputo", "Matola", "Beira", "Nampula", "Chimoio", "Nacala",
    "Quelimane", "Tete", "Xai-Xai", "Maxixe", "Inhambane", "Pemba",
    "Lichinga", "Cuamba", "Gurué", "Montepuez", "Manica", "Dondo"
  ];

  const categories = [
    { value: "cultura", label: "Cultura" },
    { value: "negocios", label: "Negócios" },
    { value: "entretenimento", label: "Entretenimento" },
    { value: "gastronomia", label: "Gastronomia" },
    { value: "educacao", label: "Educação" }
  ];

  const handleSearch = () => {
    if (!searchData.city || !searchData.month) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, seleccione a cidade e o mês para pesquisar eventos.",
        variant: "destructive"
      });
      return;
    }

    onSearch(searchData);
    onClose();
    
    // Redirect to events page with search params
    const params = new URLSearchParams({
      city: searchData.city,
      month: searchData.month,
      year: searchData.year,
      ...(searchData.category && { category: searchData.category })
    });
    
    window.location.href = `/events?${params.toString()}`;
  };

  const handleInputChange = (field: keyof EventSearchParams, value: string) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>Pesquisar Eventos</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* City Selection */}
          <div>
            <Label htmlFor="city" className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>Cidade *</span>
            </Label>
            <Select value={searchData.city} onValueChange={(value) => handleInputChange("city", value)}>
              <SelectTrigger data-testid="select-city">
                <SelectValue placeholder="Seleccione uma cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month and Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Mês *</Label>
              <Select value={searchData.month} onValueChange={(value) => handleInputChange("month", value)}>
                <SelectTrigger data-testid="select-month">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year">Ano</Label>
              <Select value={searchData.year} onValueChange={(value) => handleInputChange("year", value)}>
                <SelectTrigger data-testid="select-year">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Selection (Optional) */}
          <div>
            <Label htmlFor="category">Categoria (Opcional)</Label>
            <Select value={searchData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-search"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSearch}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-search-events"
          >
            <Search className="w-4 h-4 mr-2" />
            Pesquisar Eventos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}