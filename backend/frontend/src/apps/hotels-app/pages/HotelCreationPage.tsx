// src/apps/hotels-app/pages/HotelCreationPage.tsx
import React, { useState } from 'react';
import { useLocation } from 'wouter'; // ← Mudado de react-router-dom para wouter
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { MapPin, Upload, CheckCircle, Building, Phone, Globe, Star, Loader2 } from 'lucide-react';
import { hotelService } from '@/services/hotelService';
import { useToast } from '@/shared/hooks/use-toast';

export default function HotelCreationPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: 'Moçambique',
    phone: '',
    email: '',
    website: '',
    category: '3', // 3 estrelas por padrão
    amenities: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation(); // ← Mudado para wouter

  const amenitiesOptions = [
    'Wi-Fi Gratuito',
    'Piscina',
    'Estacionamento',
    'Restaurante',
    'Bar',
    'Spa',
    'Ginásio',
    'Ar Condicionado',
    'TV por Cabo',
    'Serviço de Quarto',
    'Lavandaria',
    'Recepção 24h',
  ];

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação simples no frontend
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do hotel é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Erro",
        description: "O endereço é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const hotelData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        address: formData.address.trim(),
        locality: formData.city.trim(),
        province: 'Maputo', // Ajuste conforme necessário (pode vir de um select)
        country: formData.country,
        contact_phone: formData.phone.trim() || undefined,
        contact_email: formData.email.trim(),
        website: formData.website.trim() || undefined,
        category: formData.category,
        amenities: formData.amenities,
        // Pode adicionar mais campos conforme o schema do backend
      };

      const response = await hotelService.createHotel(hotelData);

      if (response.success && response.data?.id) {
        toast({
          title: "Hotel criado com sucesso!",
          description: `${formData.name} foi adicionado. Selecione-o manualmente no dashboard.`,
        });

        // REDIRECIONA PARA DASHBOARD (sem selecionar automaticamente)
        setLocation('/hotels/manage'); // ← Mudado para wouter
      } else {
        throw new Error(response.error || 'Falha ao criar hotel');
      }
    } catch (error: any) {
      console.error('Erro ao criar hotel:', error);
      toast({
        title: "Erro ao criar hotel",
        description: error.message || "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLocation('/hotels/manage'); // ← Mudado para wouter
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Criar Novo Hotel</h1>
        <p className="text-muted-foreground">
          Preencha os dados do seu hotel para começar a gerir reservas e promoções
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card className="p-6 md:col-span-2">
            <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Informações Básicas
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Hotel *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Hotel Tofo Beach Resort"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o seu hotel, serviços oferecidos, etc."
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria (Estrelas)</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(stars => (
                        <SelectItem key={stars} value={stars.toString()}>
                          <div className="flex items-center gap-2">
                            {Array.from({ length: stars }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span>{stars} Estrela{stars > 1 ? 's' : ''}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Localização */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Localização
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Rua, número, bairro"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Ex: Tofo"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    disabled
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Contactos */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contactos
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+258 84 123 4567"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="hotel@exemplo.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://www.exemplo.com"
                  disabled={loading}
                />
              </div>
            </div>
          </Card>

          {/* Comodidades */}
          <Card className="p-6 md:col-span-2">
            <h2 className="text-xl font-semibold text-dark mb-4">Comodidades</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione as comodidades oferecidas pelo seu hotel
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenitiesOptions.map(amenity => (
                <Button
                  key={amenity}
                  type="button"
                  variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                  className="justify-start h-auto py-3"
                  onClick={() => handleAmenityToggle(amenity)}
                  disabled={loading}
                >
                  {formData.amenities.includes(amenity) && (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {amenity}
                </Button>
              ))}
            </div>
          </Card>

          {/* Upload de Imagens (placeholder por enquanto) */}
          <Card className="p-6 md:col-span-2">
            <h2 className="text-xl font-semibold text-dark mb-4">Imagens do Hotel</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione fotos do seu hotel (máximo 10 imagens)
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Arraste e solte imagens aqui ou clique para selecionar</p>
              <p className="text-sm text-gray-500 mb-4">PNG, JPG até 5MB cada</p>
              <Button type="button" variant="outline" disabled={loading}>
                Selecionar Imagens
              </Button>
            </div>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Hotel'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}