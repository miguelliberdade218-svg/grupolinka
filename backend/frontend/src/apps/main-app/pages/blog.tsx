import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { 
  Search, 
  Calendar, 
  User, 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle, 
  ArrowLeft,
  TrendingUp,
  MapPin,
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  imageUrl: string;
  views: number;
  likes: number;
  comments: number;
  featured: boolean;
}

export default function Blog() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar posts do blog da API
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Posts estáticos como fallback
  const staticPosts: BlogPost[] = [
    {
      id: "1",
      title: "Guia Completo: Viajar de Maputo para Xai-Xai",
      excerpt: "Descubra as melhores rotas, preços e dicas para uma viagem segura e confortável entre Maputo e Xai-Xai.",
      content: "Conteúdo completo do artigo...",
      author: "Maria Santos",
      publishedAt: "2024-01-15",
      category: "viagens",
      tags: ["maputo", "xai-xai", "boleias", "guia"],
      imageUrl: "",
      views: 1250,
      likes: 89,
      comments: 23,
      featured: true
    },
    {
      id: "2", 
      title: "Os Melhores Hotéis Budget em Beira",
      excerpt: "Lista dos alojamentos mais económicos e confortáveis na cidade da Beira para viajantes com orçamento limitado.",
      content: "Conteúdo completo do artigo...",
      author: "João Mozambique",
      publishedAt: "2024-01-12",
      category: "alojamentos",
      tags: ["beira", "budget", "hotéis", "economia"],
      imageUrl: "",
      views: 987,
      likes: 67,
      comments: 15,
      featured: false
    },
    {
      id: "3",
      title: "Festival de Marrabenta 2024: Tudo o que Precisas Saber",
      excerpt: "Datas, artistas, preços e como chegar ao maior festival de música moçambicana do ano.",
      content: "Conteúdo completo do artigo...",
      author: "Cultural Moçambique",
      publishedAt: "2024-01-10",
      category: "eventos",
      tags: ["marrabenta", "festival", "música", "cultura"],
      imageUrl: "",
      views: 2100,
      likes: 156,
      comments: 42,
      featured: true
    }
  ];

  const blogPosts = posts || staticPosts;
  const categories = ["all", "viagens", "alojamentos", "eventos", "cultura", "dicas"];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Blog Link-A</h1>
            <Badge variant="outline">Dicas de Viagem</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section com Posts em Destaque */}
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Posts em Destaque</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredPosts.slice(0, 2).map(post => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" data-testid={`featured-post-${post.id}`}>
                  {/* Espaço para imagem do post */}
                  <div className="h-64 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center border-b">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mb-2 mx-auto">
                        <MapPin className="w-8 h-8 text-orange-600" />
                      </div>
                      <span className="text-sm text-gray-600">Imagem do artigo</span>
                    </div>
                  </div>
                  
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-orange-100 text-orange-800">{post.category}</Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.comments}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="w-3 h-3" />
                        {post.author}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Filtros e Busca */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Explorar Artigos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar artigos, dicas, destinos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-blog"
                />
              </div>
              
              {/* Categorias */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`button-category-${category}`}
                  >
                    {category === "all" ? "Todos" : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Posts */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory === "all" 
                ? "Todos os Artigos" 
                : `Artigos de ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`
              }
            </h2>
            <span className="text-sm text-gray-500">{filteredPosts.length} artigos encontrados</span>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <CardContent className="pt-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-6 bg-gray-200 rounded mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" data-testid={`blog-post-${post.id}`}>
                  {/* Espaço para imagem do post */}
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-blue-100 flex items-center justify-center border-b">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mb-2 mx-auto">
                        {post.category === "viagens" && <MapPin className="w-6 h-6 text-blue-600" />}
                        {post.category === "alojamentos" && <MapPin className="w-6 h-6 text-green-600" />}
                        {post.category === "eventos" && <Calendar className="w-6 h-6 text-purple-600" />}
                        {!["viagens", "alojamentos", "eventos"].includes(post.category) && <TrendingUp className="w-6 h-6 text-gray-600" />}
                      </div>
                      <span className="text-xs text-gray-600">Imagem do artigo</span>
                    </div>
                  </div>
                  
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likes}
                        </span>
                      </div>
                      
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {filteredPosts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum artigo encontrado</h3>
              <p className="text-gray-600 mb-4">
                Tenta ajustar os filtros de busca ou categoria.
              </p>
              <Button onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}>
                Limpar Filtros
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}