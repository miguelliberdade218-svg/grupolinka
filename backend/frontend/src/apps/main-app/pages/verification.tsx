import { useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { CheckCircle, Upload, AlertCircle } from 'lucide-react';

export default function VerificationPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File | null}>({});
  const [formData, setFormData] = useState({
    driverLicenseNumber: '',
    driverLicenseCountry: 'Moçambique',
    driverLicenseExpiry: '',
    businessTaxId: '',
    businessRegistrationNumber: '',
    businessLegalName: '',
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Acesso Negado</h2>
          <p className="mb-4">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const handleFileChange = (field: string, file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // TODO: Implement file upload to backend
      console.log('Submitting verification documents...', {
        formData,
        files: uploadedFiles
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert('Documentos enviados com sucesso! Aguardando verificação.');
    } catch (error) {
      console.error('Erro ao enviar documentos:', error);
      alert('Erro ao enviar documentos. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const renderDriverVerification = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Verificação de Motorista
        </CardTitle>
        <CardDescription>
          Para oferecer serviços de transporte, você precisa verificar sua identidade e habilitação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="driverLicenseNumber">Número da Carta de Condução</Label>
              <Input
                id="driverLicenseNumber"
                value={formData.driverLicenseNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, driverLicenseNumber: e.target.value }))}
                placeholder="Ex: AB123456"
                required
              />
            </div>
            <div>
              <Label htmlFor="driverLicenseCountry">País</Label>
              <Input
                id="driverLicenseCountry"
                value={formData.driverLicenseCountry}
                onChange={(e) => setFormData(prev => ({ ...prev, driverLicenseCountry: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="driverLicenseExpiry">Data de Expiração</Label>
              <Input
                id="driverLicenseExpiry"
                type="date"
                value={formData.driverLicenseExpiry}
                onChange={(e) => setFormData(prev => ({ ...prev, driverLicenseExpiry: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Documentos Necessários</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label htmlFor="licenseFile">Carta de Condução (Frente e Verso)</Label>
                <Input
                  id="licenseFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('license', e.target.files?.[0] || null)}
                  className="mt-1"
                />
                {uploadedFiles.license && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {uploadedFiles.license.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="idFile">Documento de Identificação (BI ou Passaporte)</Label>
                <Input
                  id="idFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('id', e.target.files?.[0] || null)}
                  className="mt-1"
                />
                {uploadedFiles.id && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {uploadedFiles.id.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? 'Enviando...' : 'Enviar para Verificação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderHotelVerification = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Verificação de Gestor de Hotel
        </CardTitle>
        <CardDescription>
          Para gerenciar hotéis na plataforma, você precisa verificar sua empresa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessTaxId">NIF/NUIT</Label>
              <Input
                id="businessTaxId"
                value={formData.businessTaxId}
                onChange={(e) => setFormData(prev => ({ ...prev, businessTaxId: e.target.value }))}
                placeholder="Ex: 123456789"
                required
              />
            </div>
            <div>
              <Label htmlFor="businessRegistrationNumber">Número de Registro Comercial</Label>
              <Input
                id="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, businessRegistrationNumber: e.target.value }))}
                placeholder="Ex: 001/2024"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="businessLegalName">Nome Legal da Empresa</Label>
              <Input
                id="businessLegalName"
                value={formData.businessLegalName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessLegalName: e.target.value }))}
                placeholder="Nome completo da empresa"
                required
              />
            </div>
          </div>

          <div>
            <Label>Documentos Necessários</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label htmlFor="taxIdFile">Comprovativo de NIF/NUIT</Label>
                <Input
                  id="taxIdFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('taxId', e.target.files?.[0] || null)}
                  className="mt-1"
                />
                {uploadedFiles.taxId && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {uploadedFiles.taxId.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="registrationFile">Certificado de Registro Comercial</Label>
                <Input
                  id="registrationFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('registration', e.target.files?.[0] || null)}
                  className="mt-1"
                />
                {uploadedFiles.registration && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {uploadedFiles.registration.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="businessLicenseFile">Alvará/Licença de Funcionamento</Label>
                <Input
                  id="businessLicenseFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('license', e.target.files?.[0] || null)}
                  className="mt-1"
                />
                {uploadedFiles.license && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {uploadedFiles.license.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? 'Enviando...' : 'Enviar para Verificação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Verificação de Conta</h1>
        <p className="text-gray-600">
          Complete a verificação para acessar todos os recursos da sua conta.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Seus documentos serão analisados pela nossa equipe. O processo pode levar até 48 horas.
        </AlertDescription>
      </Alert>

      {user.canDrive && user.driverVerificationStatus !== 'verified' && renderDriverVerification()}
      {user.canManageHotels && user.hotelManagerVerificationStatus !== 'verified' && renderHotelVerification()}

      {(!user.canDrive || user.driverVerificationStatus === 'verified') &&
       (!user.canManageHotels || user.hotelManagerVerificationStatus === 'verified') && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verificação Concluída</h3>
              <p className="text-gray-600">
                Sua conta já está verificada. Você pode acessar todos os recursos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}