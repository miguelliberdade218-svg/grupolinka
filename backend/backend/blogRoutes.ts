/// <reference path="./src/types/express/index.d.ts" />
import { Router, Response } from "express";
import { verifyFirebaseToken } from "@/shared/firebaseAuth";
import { AuthenticatedRequest } from "@/shared/types";
import { storage } from "./storage";

const router = Router();

interface BlogPostBody {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  isFeatured?: boolean;
}

// Get all blog posts
router.get("/posts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, featured, limit = 10, offset = 0 } = req.query;

    // Blog posts would come from database when blog table is implemented
    // For now returning empty array as no mock data
    const posts = [
      {
        id: "post_1",
        title: "Dicas para uma Viagem Segura em Moçambique",
        slug: "dicas-viagem-segura-mocambique",
        excerpt: "Conheça as melhores práticas para viajar com segurança pelo país, desde preparação até chegada ao destino.",
        content: `
          <h2>Preparação antes da viagem</h2>
          <p>Antes de iniciar qualquer viagem em Moçambique, é importante fazer uma preparação adequada...</p>
          
          <h3>Documentação necessária</h3>
          <ul>
            <li>Bilhete de identidade válido</li>
            <li>Carta de condução (se for dirigir)</li>
            <li>Seguro de viagem (recomendado)</li>
          </ul>
          
          <h3>Escolha do transporte</h3>
          <p>Na Link-A, todos os motoristas são verificados e passam por a process rigorous de seleção...</p>
          
          <h2>Durante a viagem</h2>
          <p>Mantenha sempre comunicação com familiares e use nossa plataforma para acompanhar a viagem...</p>
        `,
        category: "seguranca",
        tags: ["viagem", "segurança", "dicas", "moçambique"],
        author: {
          name: "Equipe Link-A",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        },
        publishedAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
        featuredImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
        isFeatured: true,
        readTime: 5,
        views: 1248,
        likes: 89
      },
      {
        id: "post_2",
        title: "Os Melhores Destinos Turísticos de Moçambique em 2024",
        slug: "melhores-destinos-turisticos-mocambique-2024",
        excerpt: "Descubra os destinos mais procurados e as experiências únicas que Moçambique tem para oferecer.",
        content: `
          <h2>Ilha de Moçambique</h2>
          <p>Património Mundial da UNESCO, a Ilha de Moçambique é um destino obrigatório...</p>
          
          <h2>Arquipélago das Quirimbas</h2>
          <p>Para quem busca praias paradisíacas e mergulho de classe mundial...</p>
          
          <h2>Parque Nacional de Gorongosa</h2>
          <p>Uma das maiores reservas de vida selvagem de África...</p>
        `,
        category: "destinos",
        tags: ["turismo", "destinos", "praias", "cultura"],
        author: {
          name: "Ana Silva",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
        },
        publishedAt: "2024-01-10T14:30:00Z",
        updatedAt: "2024-01-10T14:30:00Z",
        featuredImage: "https://images.unsplash.com/photo-1572276596237-5db2c3e16c5d?w=800",
        isFeatured: true,
        readTime: 8,
        views: 2156,
        likes: 147
      },
      {
        id: "post_3",
        title: "Como Funciona o Sistema de Parcerias Link-A",
        slug: "sistema-parcerias-link-a",
        excerpt: "Entenda como nosso programa de parcerias beneficia motoristas, hotéis e organizadores de eventos.",
        content: `
          <h2>Parcerias com Hotéis</h2>
          <p>Nossos motoristas parceiros têm acesso a descontos exclusivos em acomodações...</p>
          
          <h2>Eventos e Descontos</h2>
          <p>Organizadores de eventos podem oferecer pacotes especiais que incluem transporte...</p>
          
          <h2>Como se tornar parceiro</h2>
          <p>O processo de verificação é simples e garante qualidade para todos os usuários...</p>
        `,
        category: "parcerias",
        tags: ["parcerias", "motoristas", "hotéis", "eventos"],
        author: {
          name: "João Santos",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        },
        publishedAt: "2024-01-05T09:15:00Z",
        updatedAt: "2024-01-05T09:15:00Z",
        featuredImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800",
        isFeatured: false,
        readTime: 6,
        views: 892,
        likes: 63
      }
    ];

    // Apply filters
    let filteredPosts = posts;

    if (category) {
      filteredPosts = filteredPosts.filter(post => post.category === category);
    }

    if (featured === 'true') {
      filteredPosts = filteredPosts.filter(post => post.isFeatured);
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const limitNum = parseInt(limit as string);
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      posts: paginatedPosts,
      pagination: {
        total: filteredPosts.length,
        limit: limitNum,
        offset: startIndex,
        hasMore: startIndex + limitNum < filteredPosts.length
      },
      categories: ["seguranca", "destinos", "parcerias", "dicas", "eventos"]
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ 
      error: "Erro ao buscar posts do blog",
      message: "Tente novamente mais tarde" 
    });
  }
});

// Get single blog post
router.get("/posts/:slug", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;

    // Mock data - would fetch from database in real implementation
    const mockPost = {
      id: "post_1",
      title: "Dicas para uma Viagem Segura em Moçambique",
      slug: "dicas-viagem-segura-mocambique",
      excerpt: "Conheça as melhores práticas para viajar com segurança pelo país.",
      content: `
        <h2>Preparação antes da viagem</h2>
        <p>Antes de iniciar qualquer viagem em Moçambique, é importante fazer uma preparação adequada. Nossa plataforma Link-A facilita todo o processo, conectando você com motoristas verificados e acomodações de qualidade.</p>
        
        <h3>Documentação necessária</h3>
        <ul>
          <li>Bilhete de identidade válido</li>
          <li>Carta de condução (se for dirigir)</li>
          <li>Seguro de viagem (recomendado)</li>
          <li>Comprovante de reserva de acomodação</li>
        </ul>
        
        <h3>Escolha do transporte</h3>
        <p>Na Link-A, todos os motoristas são verificados e passam por um processo rigoroso de seleção. Você pode consultar avaliações de outros passageiros e escolher o motorista que melhor se adequa às suas necessidades.</p>
        
        <h2>Durante a viagem</h2>
        <p>Mantenha sempre comunicação com familiares e use nossa plataforma para acompanhar a viagem em tempo real. Nosso sistema de rastreamento garante que você esteja sempre seguro.</p>
        
        <h3>Dicas importantes</h3>
        <ul>
          <li>Confirme sempre os detalhes da viagem antes de partir</li>
          <li>Mantenha contato com o motorista através da plataforma</li>
          <li>Avalie o serviço após a viagem para ajudar outros usuários</li>
        </ul>
        
        <h2>Chegada ao destino</h2>
        <p>Ao chegar ao seu destino, não se esqueça de avaliar a experiência na plataforma Link-A. Suas avaliações ajudam a maintain a qualidade dos serviços.</p>
      `,
      category: "seguranca",
      tags: ["viagem", "segurança", "dicas", "moçambique"],
      author: {
        name: "Equipe Link-A",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        bio: "Especialistas em turismo e segurança em viagens"
      },
      publishedAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      featuredImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
      isFeatured: true,
      readTime: 5,
      views: 1248,
      likes: 89,
      relatedPosts: [
        {
          id: "post_2",
          title: "Os Melhores Destinos Turísticos de Moçambique em 2024",
          slug: "melhores-destinos-turisticos-mocambique-2024",
          excerpt: "Descubra os destinos mais procurados em Moçambique",
          featuredImage: "https://images.unsplash.com/photo-1572276596237-5db2c3e16c5d?w=400"
        }
      ]
    };

    if (mockPost.slug !== slug) {
      return res.status(404).json({ 
        error: "Post não encontrado",
        message: "O post solicitado não existe"
      });
    }

    res.json({
      success: true,
      post: mockPost
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({ 
      error: "Erro ao buscar post",
      message: "Tente novamente mais tarde" 
    });
  }
});

// Create new blog post (admin only)
router.post("/posts", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    // TODO: Verify admin role
    // const user = await storage.getUser(userId);
    // if (user?.userType !== 'admin') {
    //   return res.status(403).json({ message: "Acesso negado" });
    // }

    const body = req.body as BlogPostBody;
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      featuredImage,
      isFeatured = false
    } = body;

    if (!title || !content || !excerpt) {
      return res.status(400).json({ 
        error: "Dados obrigatórios não fornecidos",
        required: ["title", "content", "excerpt"]
      });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newPost = {
      id: `post_${Date.now()}`,
      title,
      slug,
      content,
      excerpt,
      category,
      tags: tags || [],
      featuredImage,
      isFeatured,
      author: {
        id: userId,
        name: req.user?.firstName || "Admin",
        avatar: null
      },
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0
    };

    // TODO: Save to database
    
    res.status(201).json({
      success: true,
      message: "Post criado com sucesso",
      post: newPost
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({ 
      error: "Erro ao criar post",
      message: "Tente novamente mais tarde" 
    });
  }
});

// Update blog post (admin only)
router.put("/posts/:id", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    // TODO: Verify admin role and ownership
    
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // TODO: Update in database
    
    res.json({
      success: true,
      message: "Post atualizado com sucesso",
      post: { id, ...updateData }
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ 
      error: "Erro ao atualizar post",
      message: "Tente novamente mais tarde" 
    });
  }
});

// Delete blog post (admin only)
router.delete("/posts/:id", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Verify admin role and delete from database
    
    res.json({
      success: true,
      message: "Post deletado com sucesso"
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ 
      error: "Erro ao deletar post",
      message: "Tente novamente mais tarde" 
    });
  }
});

// Get blog categories
router.get("/categories", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = [
      { id: "seguranca", name: "Segurança", description: "Dicas de segurança para viagens" },
      { id: "destinos", name: "Destinos", description: "Melhores destinos em Moçambique" },
      { id: "parcerias", name: "Parcerias", description: "Informações sobre nossos parceiros" },
      { id: "dicas", name: "Dicas", description: "Dicas gerais de viagem" },
      { id: "eventos", name: "Eventos", description: "Eventos e festivais em Moçambique" }
    ];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    res.status(500).json({ 
      error: "Erro ao buscar categorias",
      message: "Tente novamente mais tarde" 
    });
  }
});

export default router;