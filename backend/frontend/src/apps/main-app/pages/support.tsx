import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  Search,
  ChevronDown,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'geral' | 'corridas' | 'pagamento' | 'seguranca' | 'conta';
  helpful?: number;
}

interface SupportPageProps {
  userId?: string;
}

export default function SupportPage({
  userId = 'user-123',
}: SupportPageProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: 'faq-001',
      category: 'geral',
      question: 'Como faço para criar uma conta?',
      answer:
        'Para criar uma conta, baixe o aplicativo, clique em "Criar Conta", preencha seus dados básicos (nome, email, telefone), e confirme seu email. Após isso, você poderá fazer seu primeiro pedido!',
      helpful: 156,
    },
    {
      id: 'faq-002',
      category: 'corridas',
      question: 'Como posso rastrear minha corrida em tempo real?',
      answer:
        'Uma vez que sua corrida foi aceita por um motorista, você verá a localização do motorista e da corrida em tempo real no mapa do aplicativo. Você também pode ver informações detalhadas do motorista e do veículo.',
      helpful: 234,
    },
    {
      id: 'faq-003',
      category: 'pagamento',
      question: 'Quais formas de pagamento vocês aceitam?',
      answer:
        'Aceitamos cartão de débito, cartão de crédito, pix, dinheiro, e carteiras digitais. Você pode adicionar múltiplos métodos de pagamento na seção "Minha Conta > Métodos de Pagamento".',
      helpful: 189,
    },
    {
      id: 'faq-004',
      category: 'seguranca',
      question: 'Como vocês garantem minha segurança?',
      answer:
        'Todos os nossos motoristas passam por verificação de antecedentes rigorosa. Além disso, você pode compartilhar sua localização em tempo real com contatos de confiança, possui ID de chaperone nos veículos, e temos suporte 24/7 disponível.',
      helpful: 267,
    },
    {
      id: 'faq-005',
      category: 'conta',
      question: 'Posso mudar minhas informações pessoais?',
      answer:
        'Sim! Você pode atualizar seu nome, email, telefone e endereço na seção "Meu Perfil > Informações Pessoais". Para alterar seu CPF ou dados mais sensíveis, entre em contato com nosso suporte.',
      helpful: 98,
    },
    {
      id: 'faq-006',
      category: 'corridas',
      question: 'O que fazer se o motorista não apareceu?',
      answer:
        'Se o motorista não apareceu, ele será considerado como "abstenção" após 5 minutos. Você poderá cancelar sem cobranças extras. Entre em contato com nosso suporte se precisar de mais ajuda.',
      helpful: 143,
    },
    {
      id: 'faq-007',
      category: 'pagamento',
      question: 'Posso conseguir reembolso?',
      answer:
        'Sim! Você pode solicitar reembolso dentro de 7 dias após a corrida. Se houver algum problema com a corrida (motorista não apareceu, cobrança duplicada, etc.), entre em contato com nosso suporte com detalhes.',
      helpful: 201,
    },
    {
      id: 'faq-008',
      category: 'geral',
      question: 'Qual é sua política de cancelamento?',
      answer:
        'Você pode cancelar uma corrida gratuitamente até 2 minutos após confirmação. Após isso, pode haver uma taxa de cancelamento. Cancelamentos feitos pelo motorista não resultam em cobranças.',
      helpful: 178,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<'all' | FAQItem['category']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [supportType, setSupportType] = useState<'faq' | 'contact'>('faq');

  const filteredFAQs = faqs.filter((faq) => {
    const categoryMatch = selectedCategory === 'all' || faq.category === selectedCategory;
    const searchMatch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const categories = [
    { value: 'geral', label: '📌 Geral' },
    { value: 'corridas', label: '🚗 Corridas' },
    { value: 'pagamento', label: '💳 Pagamento' },
    { value: 'seguranca', label: '🔒 Segurança' },
    { value: 'conta', label: '👤 Conta' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">❓ Centro de Suporte</h2>
        <p className="text-gray-600 mt-2">Encontre respostas rápidas ou fale conosco</p>
      </div>

      {/* Support Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSupportType('faq')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
            supportType === 'faq'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📚 Perguntas Frequentes
        </button>
        <button
          onClick={() => setSupportType('contact')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
            supportType === 'contact'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💬 Contatar Suporte
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Procure por palavra-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      {supportType === 'faq' && (
        <>
          {/* Categories */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() =>
                      setSelectedCategory(cat.value as FAQItem['category'])
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedCategory === cat.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQs List */}
          <div className="space-y-3">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <Card
                  key={faq.id}
                  className="cursor-pointer transition hover:shadow-lg"
                  onClick={() =>
                    setExpandedId(expandedId === faq.id ? null : faq.id)
                  }
                >
                  <CardContent className="pt-6">
                    {/* Question */}
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </h3>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition flex-shrink-0 ${
                          expandedId === faq.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {/* Answer */}
                    {expandedId === faq.id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <p className="text-gray-700 text-sm">{faq.answer}</p>

                        {/* Helpful Section */}
                        <div className="flex gap-3 pt-2 border-t">
                          <span className="text-sm text-gray-600">
                            Isso foi útil?
                          </span>
                          <button className="text-sm text-gray-600 hover:text-blue-600">
                            👍 Sim ({faq.helpful || 0})
                          </button>
                          <button className="text-sm text-gray-600 hover:text-red-600">
                            👎 Não
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      Nenhuma pergunta encontrada com essa busca
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Contact Section */}
      {supportType === 'contact' && (
        <div className="space-y-4">
          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="pt-6 text-center">
                <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Chat Ao Vivo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Converse com um agente em tempo real
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Iniciar Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Phone className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Ligar Agora</h3>
                <p className="text-sm text-gray-600 mb-4">
                  (11) 9999-9999
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Ligar
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Mail className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Enviar Email</h3>
                <p className="text-sm text-gray-600 mb-4">
                  suporte@linka.com
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Enviar Email
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Status */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Status do Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="text-green-900 space-y-2">
              <p>✓ Chat disponível 24/7</p>
              <p>✓ Telefone: 08:00 - 22:00</p>
              <p>✓ Email: Resposta em até 2h</p>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assunto
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Selecione um assunto</option>
                  <option>Problema com corrida</option>
                  <option>Pagamento</option>
                  <option>Segurança</option>
                  <option>Sugestão</option>
                  <option>Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  placeholder="Descreva seu problema ou pergunta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anexar Arquivo
                </label>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Enviar Mensagem
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Center Link */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📖 Centro de Ajuda Completo</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900">
          <p className="text-sm mb-4">
            Para artigos mais detalhados, tutoriais em vídeo e guias, visite nosso centro de ajuda completo.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Ir para Centro de Ajuda
          </Button>
        </CardContent>
      </Card>

      {/* Hours and Info */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>📞 Telefone: Segunda a Sexta 08:00 - 22:00</p>
          <p>💬 Chat: 24 horas por dia, 7 dias por semana</p>
          <p>📧 Email: Respostas em até 2 horas (dias úteis)</p>
          <p>
            ⚠️ Em casos de emergência (segurança), ligar 190 e informar referência de corrida
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
