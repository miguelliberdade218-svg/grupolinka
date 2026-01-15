import { useEffect, useState } from "react";
import { onAuthStateChange, handleRedirectResult, isFirebaseConfigured } from "@/shared/lib/firebaseConfig";
import { useToast } from "@/shared/hooks/use-toast";
import RegistrationForm from "./RegistrationForm";
import { apiRequest } from "@/shared/lib/queryClient";

interface AuthHandlerProps {
  children: React.ReactNode;
}

export default function AuthHandler({ children }: AuthHandlerProps) {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Handle redirect result from Google login
    handleRedirectResult().then((result) => {
      if (result) {
        checkRegistrationStatus(result);
      }
    }).catch((error) => {
      console.error("Error handling redirect:", error);
      toast({
        title: "Erro no Login",
        description: "Erro ao processar login com Google",
        variant: "destructive",
      });
    });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((user: any) => {
      setFirebaseUser(user);
      if (user) {
        checkRegistrationStatus(user);
      } else {
        setLoading(false);
        setNeedsRegistration(false);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const checkRegistrationStatus = async (user: any) => {
    try {
      // ✅ REMOVIDO: const token = await user.getIdToken();
      // O apiRequest já adiciona automaticamente o token
      
      const response = await apiRequest('POST', '/auth/check-registration', {
        uid: user.uid
      });

      const data = await response.json();
      setNeedsRegistration(data.needsRegistration);
    } catch (error) {
      console.error("Error checking registration:", error);
      setNeedsRegistration(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (firebaseUser && needsRegistration) {
    return (
      <RegistrationForm 
        firebaseUser={firebaseUser} 
        onComplete={() => {
          setNeedsRegistration(false);
          window.location.reload();
        }}
      />
    );
  }

  return <>{children}</>;
}