import { Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold text-orange-600 mb-4">404</CardTitle>
          <CardTitle className="text-2xl text-gray-800">Página não encontrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            A página que procura não existe no painel administrativo.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/admin" data-testid="button-home">
                <Home className="w-4 h-4 mr-2" />
                Painel Admin
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}