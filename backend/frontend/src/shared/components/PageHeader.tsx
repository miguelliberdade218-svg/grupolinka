import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface PageHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function PageHeader({ 
  title, 
  showBackButton = false, 
  showHomeButton = true 
}: PageHeaderProps) {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>
        )}
      </div>

      {showHomeButton && (
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            data-testid="button-home"
          >
            <Home className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">Início</span>
          </Button>
        </Link>
      )}
    </header>
  );
}