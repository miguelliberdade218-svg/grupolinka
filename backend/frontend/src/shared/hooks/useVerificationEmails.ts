import { emailService } from '@/shared/services/emailService';
import { useToast } from './use-toast';

export interface VerificationEmailData {
  userEmail: string;
  userName: string;
  capacity: 'drive' | 'hotel_manager';
  status: 'approved' | 'rejected';
  reason?: string;
}

export const useVerificationEmails = () => {
  const { toast } = useToast();

  const sendVerificationEmail = async (data: VerificationEmailData): Promise<boolean> => {
    try {
      let emailSent = false;
      
      if (data.status === 'approved') {
        emailSent = await emailService.sendVerificationApprovedEmail(
          data.userEmail,
          data.userName,
          data.capacity
        );
      } else {
        emailSent = await emailService.sendVerificationRejectedEmail(
          data.userEmail,
          data.userName,
          data.capacity,
          data.reason
        );
      }

      if (emailSent) {
        toast({
          title: `Email de Verificação ${data.status === 'approved' ? 'Aprovada' : 'Rejeitada'} Enviado`,
          description: `O usuário ${data.userName} foi notificado por email.`,
          variant: 'default',
        });
        return true;
      } else {
        toast({
          title: 'Erro ao Enviar Email',
          description: 'Não foi possível enviar o email de notificação.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
      toast({
        title: 'Erro no Sistema de Email',
        description: 'Ocorreu um erro ao tentar enviar a notificação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    sendVerificationEmail,
  };
};

export default useVerificationEmails;