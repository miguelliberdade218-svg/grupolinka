import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Shield,
  DollarSign,
  User,
  Navigation,
  Clock,
  Zap,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
}

interface DriverOnboardingPageProps {
  driverId?: string;
  onComplete?: () => void;
}

export default function DriverOnboardingPage({
  driverId = 'driver-123',
  onComplete,
}: DriverOnboardingPageProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'profile',
      title: 'Perfil Completo',
      description: 'Adicione sua foto, nome e informações básicas',
      completed: true,
      icon: <User className="w-5 h-5" />,
    },
    {
      id: 'documents',
      title: 'Documentos Verificados',
      description: 'CNH, RG e comprovante de residência',
      completed: true,
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'vehicle',
      title: 'Veículo Registrado',
      description: 'Informações e fotos do vehicle',
      completed: false,
      icon: <Navigation className="w-5 h-5" />,
    },
    {
      id: 'background',
      title: 'Verificação de Antecedentes',
      description: 'Verificação de segurança concluída',
      completed: true,
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: 'payment',
      title: 'Método de Pagamento',
      description: 'Conta bancária para receber ganhos',
      completed: false,
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: 'ready',
      title: 'Pronto para Começar',
      description: 'Comece a aceitar corridas',
      completed: false,
      icon: <Zap className="w-5 h-5" />,
    },
  ]);

  const [currentStep, setCurrentStep] = useState<string | null>('vehicle');
  const [formData, setFormData] = useState({
    vehicleType: 'Compacto',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
  });

  const completedCount = checklist.filter((item) => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  const handleCompleteStep = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: true } : item
      )
    );
    if (id === 'payment') {
      setCurrentStep('ready');
    } else {
      setCurrentStep(null);
    }
  };

  const allComplete = checklist.every((item) => item.completed);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Bem-vindo, Motorista! 👋</h2>
        <p className="text-gray-600 mt-2">
          Complete seu perfil para começar a receber corridas
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso do Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Status geral</span>
              <span className="font-semibold text-gray-900">
                {completedCount}/{checklist.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  allComplete ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {!allComplete && (
              <p className="text-sm text-gray-600 mt-2">
                Faltam {checklist.filter((item) => !item.completed).length} passos para terminar
              </p>
            )}
          </div>

          {allComplete && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">
                    Parabéns! Seu perfil está completo!
                  </p>
                  <p className="text-sm text-green-800">
                    Você está pronto para aceitar corridas
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist */}
      <div className="space-y-3">
        {checklist.map((item) => (
          <Card
            key={item.id}
            className={`cursor-pointer transition hover:shadow-lg ${
              currentStep === item.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setCurrentStep(currentStep === item.id ? null : item.id)}
          >
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {item.completed ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                      {item.icon}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold ${
                      item.completed ? 'text-green-900' : 'text-gray-900'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>

                <div className="flex-shrink-0">
                  {item.completed ? (
                    <span className="text-sm font-semibold text-green-600">✓</span>
                  ) : (
                    <span className="text-gray-400">›</span>
                  )}
                </div>
              </div>

              {/* Step Details */}
              {currentStep === item.id && !item.completed && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  {item.id === 'vehicle' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Veículo
                        </label>
                        <select
                          value={formData.vehicleType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vehicleType: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="Compacto">Compacto</option>
                          <option value="Sedan">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="Minivan">Minivan</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Modelo
                          </label>
                          <Input
                            placeholder="Ex: Fit"
                            value={formData.model}
                            onChange={(e) =>
                              setFormData({ ...formData, model: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ano
                          </label>
                          <Input
                            placeholder="2023"
                            value={formData.year}
                            onChange={(e) =>
                              setFormData({ ...formData, year: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Placa
                        </label>
                        <Input
                          placeholder="ABC-1234"
                          value={formData.licensePlate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              licensePlate: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor
                        </label>
                        <Input
                          placeholder="Branco"
                          value={formData.color}
                          onChange={(e) =>
                            setFormData({ ...formData, color: e.target.value })
                          }
                        />
                      </div>

                      <Button
                        onClick={() => handleCompleteStep('vehicle')}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Salvar Informações do Veículo
                      </Button>
                    </div>
                  )}

                  {item.id === 'payment' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Banco
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                          <option>Banco do Brasil</option>
                          <option>Caixa Econômica</option>
                          <option>Santander</option>
                          <option>Itaú</option>
                          <option>Bradesco</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Conta
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                          <option>Conta Corrente</option>
                          <option>Conta Poupança</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Agência
                          </label>
                          <Input placeholder="1234" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Conta
                          </label>
                          <Input placeholder="123456-7" />
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCompleteStep('payment')}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Confirmar Dados Bancários
                      </Button>
                    </div>
                  )}

                  {item.id === 'ready' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-900">
                          ✅ Parabéns! Você está pronto para começar a receber corridas.
                        </p>
                      </div>

                      <Button
                        onClick={onComplete}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Comece a Receber Corridas
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">❓ Dúvidas?</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-2">
          <p>Entre em contato com nosso suporte:</p>
          <p>📞 (11) 9999-9999</p>
          <p>📧 suporte@linka.com</p>
          <p className="text-sm">Disponível 24/7</p>
        </CardContent>
      </Card>
    </div>
  );
}
