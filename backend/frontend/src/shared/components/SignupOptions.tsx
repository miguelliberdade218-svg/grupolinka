import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Link } from "wouter";
import { Users, Car, Building2, Building, ArrowRight, CheckCircle } from "lucide-react";

interface SignupOption {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  buttonText: string;
  link: string;
  features: string[];
}

export default function SignupOptions() {
  const signupOptions: SignupOption[] = [
    {
      title: "🧳 Cliente Individual",
      description: "Para reservar viagens, hotéis e eventos",
      icon: <Users className="h-6 w-6" />,
      color: "bg-blue-100 text-blue-600",
      buttonText: "Criar Conta de Cliente",
      link: "/signup?type=individual",
      features: [
        "Reserve transportes com segurança",
        "Encontre os melhores hotéis",
        "Compre bilhetes para eventos",
        "Acesso a ofertas exclusivas"
      ]
    },
    {
      title: "🏢 Cliente Empresa",
      description: "Para empresas que contratam serviços",
      icon: <Building className="h-6 w-6" />,
      color: "bg-purple-100 text-purple-600",
      buttonText: "Criar Conta Empresa",
      link: "/signup?type=company",
      features: [
        "Contratação em volume",
        "Gestão de departamento",
        "Faturação empresarial",
        "Suporte dedicado",
        "Análise de gastos"
      ]
    },
    {
      title: "🚗 Motorista",
      description: "Ofereça viagens e aumente sua renda",
      icon: <Car className="h-6 w-6" />,
      color: "bg-green-100 text-green-600",
      buttonText: "Torne-se Motorista",
      link: "/drivers-signup",
      features: [
        "Publique suas rotas de viagem",
        "Gerencie reservas de passageiros",
        "Receba pagamentos seguros",
        "Chat direto com clientes"
      ]
    },
    {
      title: "🏨 Gestor de Hotel",
      description: "Cadastre seu hotel e aumente reservas",
      icon: <Building2 className="h-6 w-6" />,
      color: "bg-emerald-100 text-emerald-600",
      buttonText: "Cadastrar Hotel",
      link: "/hotels-signup",
      features: [
        "Gerencie seu alojamento online",
        "Receba reservas 24/7",
        "Parcerias com motoristas",
        "Dashboard de analytics"
      ]
    }
  ];

  return (
    <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Junte-se à Comunidade Link-A
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Escolha o tipo de conta que melhor se adapta às suas necessidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {signupOptions.map((option, index) => (
            <Card 
              key={index} 
              className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border-t-4"
              style={{ borderTopColor: option.color.split(' ')[0].replace('bg-', '').replace('100', '500') }}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${option.color}`}>
                    {option.icon}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {index === 0 ? "Popular" : index === 1 ? "Novo" : "Oportunidade"}
                  </span>
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription className="text-sm">{option.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <ul className="space-y-2 mb-6">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-xs text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={option.link}>
                  <Button 
                    className="w-full" 
                    size="sm"
                    variant={index === 0 || index === 1 ? "default" : "outline"}
                  >
                    {option.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 text-gray-600">
          <div className="h-px w-8 bg-gray-300"></div>
          <span className="text-sm">Já tem conta?</span>
          <div className="h-px w-8 bg-gray-300"></div>
        </div>
        <div className="mt-4">
          <Link href="/login">
            <Button variant="outline" className="gap-2">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}