import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  Edit2,
  LogOut,
} from 'lucide-react';

interface DriverProfilePageProps {
  driverId?: string;
}

export default function DriverProfilePage({
  driverId = 'driver-123',
}: DriverProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@example.com',
    phone: '11 99999-9999',
    birthDate: '15/05/1990',
    address: 'Rua das Flores, 123 - Bela Vista, São Paulo',
    city: 'São Paulo',
    state: 'SP',
    cpf: '123.456.789-00',
    bankAccount: 'Banco do Brasil - Agência 1234 - Conta 56789-0',
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailAlerts: true,
    promotions: false,
    newsLetter: true,
    darkMode: false,
    allowLocationTracking: true,
  });

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = () => {
    setIsEditing(false);
    // API call would go here
  };

  const handleChangePassword = () => {
    if (newPassword === confirmPassword) {
      // API call would go here
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Senha alterada com sucesso!');
    } else {
      alert('As senhas não coincidem');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">👤 Meu Perfil</h2>
          <p className="text-gray-600 mt-1">Gerenciar informações pessoais e configurações</p>
        </div>
        <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center text-4xl">
          J
        </div>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informações Pessoais</CardTitle>
            {!isEditing && (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Primeiro Nome
              </label>
              <Input
                value={profile.firstName}
                onChange={(e) =>
                  setProfile({ ...profile, firstName: e.target.value })
                }
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sobrenome
              </label>
              <Input
                value={profile.lastName}
                onChange={(e) =>
                  setProfile({ ...profile, lastName: e.target.value })
                }
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <Input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefone
              </label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            {/* Personal Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data de Nascimento
              </label>
              <Input
                value={profile.birthDate}
                onChange={(e) =>
                  setProfile({ ...profile, birthDate: e.target.value })
                }
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF
              </label>
              <Input
                value={profile.cpf}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Address Fields */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Endereço
              </label>
              <Input
                value={profile.address}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <Input
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <Input
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                disabled={!isEditing}
                maxLength={2}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            {/* Bank Info */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💳 Dados Bancários
              </label>
              <Input
                value={profile.bankAccount}
                onChange={(e) =>
                  setProfile({ ...profile, bankAccount: e.target.value })
                }
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>
          </div>

          {/* Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSaveProfile}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-1" />
                Salvar Alterações
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite sua nova senha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'notifications', label: 'Notificações gerais' },
            { key: 'emailAlerts', label: 'Alertas por email' },
            { key: 'promotions', label: 'Ofertas e promoções' },
            { key: 'newsLetter', label: 'Newsletter semanal' },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences[item.key as keyof typeof preferences] as boolean}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    [item.key]: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">{item.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacidade e Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'darkMode', label: 'Modo Escuro' },
            { key: 'allowLocationTracking', label: 'Rastreamento de Localização' },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences[item.key as keyof typeof preferences] as boolean}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    [item.key]: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">{item.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Ações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            📥 Baixar Meus Dados
          </Button>
          <Button variant="outline" className="w-full justify-start">
            🔒 Ativar Autenticação em 2 Fatores
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Desativar Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
