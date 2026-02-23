// src/shared/emailService.ts
// Serviço de email usando Resend

import { Resend } from 'resend';
import type { EmailTemplateData, EmailService } from '../modules/auth/types/authTypes';

// Templates HTML básicos
const TEMPLATES = {
  welcome: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Bem-vindo ao Link-A! 🎉</h1>
      <p>Olá ${data.name || 'usuário'},</p>
      <p>Sua conta foi criada com sucesso no Link-A, a plataforma que conecta você a motoristas e acomodações em Moçambique.</p>
      <p>Com sua conta, você pode:</p>
      <ul>
        <li>📱 Reservar viagens com motoristas verificados</li>
        <li>🏨 Encontrar acomodações de qualidade</li>
        <li>⭐ Avaliar seus serviços</li>
        <li>💼 Oferecer seus serviços (se for motorista ou host)</li>
      </ul>
      <p>Se você tiver alguma dúvida, entre em contato com nossa equipe de suporte.</p>
      <p>Atenciosamente,<br>Equipe Link-A</p>
    </div>
  `,
  
  'password-reset': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Redefinição de Senha 🔐</h1>
      <p>Olá ${data.name || 'usuário'},</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta Link-A.</p>
      <p>Para redefinir sua senha, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Redefinir Senha
        </a>
      </div>
      <p>Se você não solicitou esta redefinição, ignore este email.</p>
      <p>Este link expira em 1 hora.</p>
      <p>Atenciosamente,<br>Equipe Link-A</p>
    </div>
  `,
  
  'verification-approved': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10B981;">Verificação Aprovada! ✅</h1>
      <p>Olá ${data.name || 'usuário'},</p>
      <p>Parabéns! Sua verificação como <strong>${data.capacity === 'drive' ? 'Motorista' : 'Gestor de Hotel'}</strong> foi aprovada.</p>
      <p>Agora você pode:</p>
      <ul>
        ${data.capacity === 'drive' ? 
          '<li>🚗 Oferecer serviços de transporte</li><li>💰 Receber solicitações de viagem</li><li>⭐ Construir sua reputação</li>' : 
          '<li>🏨 Listar seus hotéis ou acomodações</li><li>📅 Gerenciar reservas</li><li>⭐ Receber avaliações</li>'
        }
      </ul>
      <p>Acesse seu painel para começar a oferecer seus serviços.</p>
      <p>Atenciosamente,<br>Equipe Link-A</p>
    </div>
  `,
  
  'verification-rejected': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #EF4444;">Verificação Rejeitada ❌</h1>
      <p>Olá ${data.name || 'usuário'},</p>
      <p>Sua verificação como <strong>${data.capacity === 'drive' ? 'Motorista' : 'Gestor de Hotel'}</strong> foi rejeitada.</p>
      <p><strong>Motivo:</strong> ${data.reason || 'Documentação insuficiente ou inválida'}</p>
      <p>Para tentar novamente:</p>
      <ol>
        <li>Acesse seu perfil</li>
        <li>Envie os documentos solicitados</li>
        <li>Certifique-se de que os documentos estão legíveis e válidos</li>
      </ol>
      <p>Se precisar de ajuda, entre em contato com nosso suporte.</p>
      <p>Atenciosamente,<br>Equipe Link-A</p>
    </div>
  `
};

export class ResendEmailService implements EmailService {
  private resend: Resend | null; // ✅ Permite null
  private fromEmail: string;
  private isEnabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@linka.co.mz';
    this.isEnabled = !!apiKey;
    this.resend = null; // ✅ Inicializado com null
    
    if (this.isEnabled && apiKey) {
      try {
        this.resend = new Resend(apiKey);
        console.log('📧 Email Service: Resend configurado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao inicializar Resend:', error);
        this.isEnabled = false;
      }
    } else {
      console.warn('⚠️ Email Service: RESEND_API_KEY não configurada. Emails serão logados no console.');
    }
  }

  async sendEmail(templateData: EmailTemplateData): Promise<boolean> {
    try {
      const html = this.getTemplateHtml(templateData);
      
      if (!this.isEnabled || !this.resend) {
        // Modo desenvolvimento: logar no console
        console.log('📧 Email (modo desenvolvimento):');
        console.log('  Para:', templateData.to);
        console.log('  Assunto:', templateData.subject);
        console.log('  Template:', templateData.template);
        console.log('  Dados:', JSON.stringify(templateData.data, null, 2));
        console.log('  HTML:', html.substring(0, 200) + '...');
        return true;
      }

      // Garantir que 'to' é um array ou string
      const recipients = Array.isArray(templateData.to) ? templateData.to : [templateData.to];
      
      const response = await this.resend.emails.send({
        from: `Link-A <${this.fromEmail}>`, // ✅ Nome amigável
        to: recipients,
        subject: templateData.subject,
        html: html,
      });

      if (response.error) {
        console.error('❌ Resend error:', response.error);
        return false;
      }

      console.log('📧 Email enviado com sucesso:', response.data?.id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }

  private getTemplateHtml(templateData: EmailTemplateData): string {
    const template = TEMPLATES[templateData.template];
    if (!template) {
      throw new Error(`Template não encontrado: ${templateData.template}`);
    }
    
    return template(templateData.data);
  }

  // Métodos auxiliares para emails específicos
  async sendWelcomeEmail(to: string, name?: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Bem-vindo ao Link-A!',
      template: 'welcome',
      data: { name }
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to,
      subject: 'Redefinição de Senha - Link-A',
      template: 'password-reset',
      data: { name, resetLink }
    });
  }

  async sendVerificationApprovedEmail(to: string, name: string, capacity: 'drive' | 'hotel_manager'): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Verificação Aprovada - Link-A',
      template: 'verification-approved',
      data: { name, capacity }
    });
  }

  async sendVerificationRejectedEmail(to: string, name: string, capacity: 'drive' | 'hotel_manager', reason?: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Verificação Rejeitada - Link-A',
      template: 'verification-rejected',
      data: { name, capacity, reason }
    });
  }

  // ✅ Método para verificar status
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      fromEmail: this.fromEmail,
      hasResendClient: this.resend !== null
    };
  }
}

// Export singleton
export const emailService = new ResendEmailService();