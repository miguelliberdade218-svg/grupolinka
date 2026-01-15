import { useState } from "react";
import { useRoute, Link } from "wouter";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { 
  Calendar, 
  User, 
  Clock, 
  ArrowLeft, 
  Eye,
  MessageCircle,
  Share2,
  ThumbsUp,
  Bookmark,
  FileText,
  Database,
  Rocket,
  TrendingUp
} from "lucide-react";

// Blog post content data
const blogPostContent: Record<string, any> = {
  "1": {
    title: "Análise Completa da Aplicação Link-A - Estado Atual e Futuro",
    content: `
# Link-A Platform: Estado Atual e Visão Futura

A plataforma Link-A representa uma revolução no setor de turismo e transporte em Moçambique. Desenvolvida especificamente para atender às necessidades únicas do mercado moçambicano, a aplicação integra serviços de transporte, hospedagem e eventos numa experiência unificada.

## Funcionalidades Principais Implementadas

### Sistema de Viagens (Ride Sharing)
- **Busca e reserva de viagens** entre cidades principais
- **Seleção de assentos** com visualização em tempo real
- **Negociação de preços** direta entre passageiros e motoristas
- **Chat pré-reserva** para coordenação de detalhes
- **Pickup en-route** para maior flexibilidade

### Sistema de Hospedagem
- **Reserva de hotéis, apartamentos e casas** em todo o país
- **Parcerias com descontos** para motoristas qualificados
- **Sistema de avaliações** para garantir qualidade
- **Integração com eventos** para pacotes completos

### Sistema de Eventos
- **Criação e gestão de eventos** gratuitos e pagos
- **Emissão de bilhetes com QR codes** para controlo de acesso
- **Sistema de parcerias** para descontos em transporte e hospedagem
- **Dashboard para organizadores** com estatísticas detalhadas

## Melhorias de Performance

Recentemente, implementámos optimizações significativas que resultaram em:
- **Redução de 34% na complexidade da base de dados** (29 → 20 tabelas)
- **Queries 60% mais rápidas** para operações de reserva
- **Melhor experiência móvel** com tempos de carregamento reduzidos

## Visão para o Futuro

### Próximas Funcionalidades
1. **Pagamentos móveis M-Pesa** integrados
2. **Mapas offline** para zonas com conectividade limitada
3. **Sistema de fidelidade** expandido
4. **Parcerias com companhias aéreas** domésticas

### Expansão Geográfica
- Cobertura completa das 11 províncias
- Integração com transportes rurais
- Parcerias com governo local

A Link-A está posicionada para se tornar a plataforma líder de turismo e transporte em Moçambique, contribuindo para o desenvolvimento económico do país através da facilitação de viagens e turismo interno.
    `,
    author: "Equipa Link-A",
    publishedAt: "2025-01-24",
    readTime: "8 min",
    category: "Plataforma",
    tags: ["Análise", "Funcionalidades", "Viagens", "Hospedagem"],
    views: 324,
    comments: 12
  },
  "2": {
    title: "Otimização da Base de Dados - Como Melhorámos a Performance",
    content: `
# Optimização da Base de Dados Link-A

## Resumo Executivo

A equipa técnica da Link-A completou uma optimização abrangente da base de dados, reduzindo a complexidade de **29 para 20 tabelas** e eliminando redundâncias que afetavam a performance.

## Problemas Identificados

### Over-Engineering
- **Sistema de eventos excessivamente complexo** (6 tabelas)
- **Sistema de parcerias demasiado elaborado** (4 tabelas)
- **Múltiplas tabelas para funcionalidades similares**

### Redundância de Dados
- Campos de rating duplicados
- Informações de preço espalhadas
- Estruturas de dados inconsistentes

## Soluções Implementadas

### 1. Consolidação do Sistema de Eventos
**Antes:** 6 tabelas separadas
**Depois:** Integração na tabela principal de reservas

\`\`\`sql
-- Nova estrutura unificada
ALTER TABLE bookings ADD COLUMN event_id UUID REFERENCES events(id);
ALTER TABLE bookings ADD COLUMN ticket_quantity INTEGER;
ALTER TABLE bookings ADD COLUMN ticket_numbers TEXT[];
\`\`\`

### 2. Simplificação das Parcerias
**Removido:** Sistema complexo de 4 tabelas
**Implementado:** Campos diretos nas acomodações

\`\`\`sql
ALTER TABLE accommodations ADD COLUMN offer_driver_discounts BOOLEAN DEFAULT false;
ALTER TABLE accommodations ADD COLUMN driver_discount_rate DECIMAL(3,2);
ALTER TABLE accommodations ADD COLUMN minimum_driver_level TEXT;
\`\`\`

### 3. Unificação do Sistema de Pagamentos
**Consolidado:** tabelas \`transactions\` e \`paymentMethods\`
**Resultado:** Tabela \`payments\` única e eficiente

## Resultados Alcançados

### Performance
- **Redução de 34% no número de tabelas**
- **Queries 60% mais rápidas** para reservas
- **Redução de 50% em JOINs complexos**

### Manutenibilidade
- Código mais limpo e organizado
- Menor complexidade para novos developers
- Testes mais simples e eficazes

### Escalabilidade
- Base sólida para crescimento futuro
- Estrutura preparada para milhares de utilizadores
- Backup e recovery mais eficientes

## Próximos Passos

1. **Implementação de índices otimizados**
2. **Cache inteligente para queries frequentes**
3. **Monitorização contínua de performance**

Esta optimização posiciona a Link-A para escalar eficientemente conforme o crescimento da base de utilizadores em Moçambique.
    `,
    author: "Equipa Técnica",
    publishedAt: "2025-01-23",
    readTime: "12 min",
    category: "Tecnologia",
    tags: ["Base de Dados", "Performance", "Otimização"],
    views: 256,
    comments: 8
  }
};

export default function BlogPost() {
  const [match, params] = useRoute("/blog/:id");
  const [activeService, setActiveService] = useState<"rides" | "stays">("rides");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!match || !params?.id) {
    return <div>Post não encontrado</div>;
  }

  const post = blogPostContent[params.id];

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          activeService={activeService}
          onServiceChange={setActiveService}
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Artigo não encontrado
              </h2>
              <p className="text-gray-600 mb-4">
                O artigo que procura não existe ou foi removido.
              </p>
              <Link href="/blog">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Blog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Plataforma": return <FileText className="w-5 h-5" />;
      case "Tecnologia": return <Database className="w-5 h-5" />;
      case "Escalabilidade": return <Rocket className="w-5 h-5" />;
      case "Parcerias": return <TrendingUp className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeService={activeService}
        onServiceChange={setActiveService}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Blog
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <Card className="mb-8">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getCategoryIcon(post.category)}
                {post.category}
              </Badge>
            </div>
            
            <CardTitle className="text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
              {post.title}
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-4">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views} visualizações
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.comments} comentários
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Article Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              {isLiked ? "Gostou" : "Gostar"}
            </Button>
            
            <Button
              variant={isBookmarked ? "default" : "outline"}
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              {isBookmarked ? "Guardado" : "Guardar"}
            </Button>
          </div>
          
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Partilhar
          </Button>
        </div>

        {/* Article Content */}
        <Card>
          <CardContent className="prose prose-lg max-w-none pt-6">
            <div className="whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          </CardContent>
        </Card>

        {/* Article Tags */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comentários ({post.comments})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              Sistema de comentários será implementado em breve.
            </p>
          </CardContent>
        </Card>

        {/* Related Articles */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Artigos Relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(blogPostContent)
                .filter(([id, _]) => id !== params.id)
                .slice(0, 2)
                .map(([id, relatedPost]) => (
                  <Link key={id} href={`/blog/${id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" size="sm">
                            {relatedPost.category}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relatedPost.readTime}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}