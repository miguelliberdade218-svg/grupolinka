import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { 
  Calendar, 
  User, 
  Clock, 
  Search, 
  TrendingUp, 
  Database, 
  Rocket,
  FileText,
  ArrowRight,
  Eye,
  MessageCircle,
  Share2
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
  views: number;
  comments: number;
  image?: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Análise Completa da Aplicação Link-A - Estado Atual e Futuro",
    excerpt: "Descubra o estado atual da plataforma Link-A, suas funcionalidades principais e as melhorias implementadas para oferecer a melhor experiência de viagem em Moçambique.",
    author: "Equipa Link-A",
    publishedAt: "2025-01-24",
    readTime: "8 min",
    category: "Plataforma",
    tags: ["Análise", "Funcionalidades", "Viagens", "Hospedagem"],
    views: 324,
    comments: 12,
    featured: true
  },
  {
    id: "2", 
    title: "Otimização da Base de Dados - Como Melhorámos a Performance",
    excerpt: "Reduzimos a complexidade da base de dados de 29 para 20 tabelas, eliminando redundâncias e melhorando significativamente a performance das consultas.",
    author: "Equipa Técnica",
    publishedAt: "2025-01-23",
    readTime: "12 min",
    category: "Tecnologia",
    tags: ["Base de Dados", "Performance", "Otimização"],
    views: 256,
    comments: 8,
    featured: true
  },
  {
    id: "3",
    title: "Estratégias de Escalabilidade para a Link-A",
    excerpt: "Guia completo sobre como escalar a aplicação Link-A para suportar milhares de utilizadores simultâneos, incluindo configurações de deploy e otimizações de código.",
    author: "Equipa DevOps",
    publishedAt: "2025-01-22",
    readTime: "15 min",
    category: "Escalabilidade",
    tags: ["Deploy", "Performance", "Replit", "Escalabilidade"],
    views: 189,
    comments: 5,
    featured: false
  },
  {
    id: "4",
    title: "Como Funciona o Sistema de Parcerias Link-A",
    excerpt: "Conheça como os motoristas podem beneficiar de descontos em hospedagem através do nosso sistema de parcerias simplificado e eficiente.",
    author: "Equipa Parcerias",
    publishedAt: "2025-01-20",
    readTime: "6 min",
    category: "Parcerias",
    tags: ["Parcerias", "Motoristas", "Descontos", "Hospedagem"],
    views: 412,
    comments: 18
  },
  {
    id: "5",
    title: "Dicas de Segurança para Viagens em Moçambique",
    excerpt: "Guia essencial com dicas de segurança para viajantes e motoristas, garantindo experiências seguras e agradáveis na plataforma Link-A.",
    author: "Equipa Segurança",
    publishedAt: "2025-01-18",
    readTime: "10 min",
    category: "Segurança",
    tags: ["Segurança", "Viagens", "Dicas", "Moçambique"],
    views: 534,
    comments: 23
  },
  {
    id: "6",
    title: "Novidades na Plataforma - Janeiro 2025",
    excerpt: "Conheça as últimas funcionalidades adicionadas à plataforma Link-A, incluindo melhorias na experiência móvel e novas opções de pagamento.",
    author: "Equipa Produto",
    publishedAt: "2025-01-15",
    readTime: "5 min",
    category: "Atualizações",
    tags: ["Novidades", "Funcionalidades", "Mobile", "Pagamentos"],
    views: 298,
    comments: 14
  }
];

const categories = ["Todos", "Plataforma", "Tecnologia", "Escalabilidade", "Parcerias", "Segurança", "Atualizações"];

export default function Blog() {
  const [activeService, setActiveService] = useState<"rides" | "stays">("rides");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "Todos" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Plataforma": return <FileText className="w-4 h-4" />;
      case "Tecnologia": return <Database className="w-4 h-4" />;
      case "Escalabilidade": return <Rocket className="w-4 h-4" />;
      case "Parcerias": return <TrendingUp className="w-4 h-4" />;
      case "Segurança": return <User className="w-4 h-4" />;
      case "Atualizações": return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Blog da Comunidade Link-A
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Notícias, dicas, guias e informações importantes sobre viagens e turismo em Moçambique
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Pesquisar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="blog-search"
              />
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
                data-testid={`category-${category.toLowerCase()}`}
              >
                {category !== "Todos" && getCategoryIcon(category)}
                <span className={category !== "Todos" ? "ml-2" : ""}>{category}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Posts */}
        {selectedCategory === "Todos" && featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-primary" />
              Artigos em Destaque
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {featuredPosts.map(post => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    {getCategoryIcon(post.category)}
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <Badge variant="outline">Destaque</Badge>
                    </div>
                    <CardTitle className="text-xl leading-tight hover:text-primary transition-colors">
                      <Link href={`/blog/${post.id}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-4">
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
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments}
                        </span>
                      </div>
                      <Link href={`/blog/${post.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                          Ler mais
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-primary" />
            {selectedCategory === "Todos" ? "Todos os Artigos" : `Artigos - ${selectedCategory}`}
          </h2>
          
          {filteredPosts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum artigo encontrado
                </h3>
                <p className="text-gray-600">
                  Tente ajustar os filtros ou termo de pesquisa
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map(post => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    {getCategoryIcon(post.category)}
                  </div>
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">{post.category}</Badge>
                    <CardTitle className="text-lg leading-tight hover:text-primary transition-colors">
                      <Link href={`/blog/${post.id}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </span>
                      <span>•</span>
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.comments}
                        </span>
                      </div>
                      <Link href={`/blog/${post.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark p-1">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Newsletter Subscription */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Mantenha-se Atualizado
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Receba as últimas notícias, dicas e guias de viagem diretamente no seu email
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="O seu email" 
                className="flex-1"
                data-testid="newsletter-email"
              />
              <Button className="bg-primary hover:bg-primary-dark">
                Subscrever
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}