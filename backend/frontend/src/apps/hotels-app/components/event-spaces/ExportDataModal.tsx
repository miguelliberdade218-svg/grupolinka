// src/apps/hotels-app/components/event-spaces/ExportDataModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2, FileText, FileSpreadsheet, Download, Printer, Calendar, FileDown, BarChart } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface Booking {
  id: string;
  event_title: string;
  organizer_name: string;
  organizer_email: string;
  start_date: string;
  end_date: string;
  expected_attendees: number;
  status: string;
  total_price: string;
  payment_status?: string;
  balance_due?: string;
  created_at: string;
  event_type?: string;
  organizer_phone?: string;
}

interface ExportDataModalProps {
  open: boolean;
  onClose: () => void;
  bookings: Booking[];
  spaceName: string;
  period: string;
  stats: any;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  open,
  onClose,
  bookings,
  spaceName,
  period,
  stats,
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('csv');
  const [exportType, setExportType] = useState<'all' | 'filtered' | 'stats' | 'financial'>('filtered');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [fileName, setFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | string) => {
    if (!amount && amount !== 0) return '—';
    const num = typeof amount === 'string' ? Number(amount) : amount;
    return isNaN(num) ? '—' : num.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    });
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending_approval': 'Aguardando Aprovação',
      'confirmed': 'Confirmada',
      'cancelled': 'Cancelada',
      'rejected': 'Rejeitada',
      'completed': 'Concluída',
      'in_progress': 'Em Andamento',
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusLabel = (status?: string) => {
    const statusMap: Record<string, string> = {
      'paid': 'Pago',
      'pending': 'Pendente',
      'partial': 'Parcial',
      'overdue': 'Atrasado',
      'refunded': 'Reembolsado',
      'failed': 'Falhou',
    };
    return statusMap[status || 'pending'] || status || 'Pendente';
  };

  const generateFileName = () => {
    if (fileName.trim()) return fileName;
    
    const date = new Date().toISOString().split('T')[0];
    const periodLabel = exportType === 'stats' ? 'estatisticas' : 
                      exportType === 'financial' ? 'financeiro' : 'reservas';
    const formatExt = exportFormat === 'csv' ? 'csv' : 
                     exportFormat === 'excel' ? 'xlsx' : 'pdf';
    
    return `export_${spaceName.replace(/\s+/g, '_')}_${periodLabel}_${date}.${formatExt}`;
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      let dataToExport: (string | number)[][] = [];
      let headers: string[] = [];
      
      if (exportType === 'stats') {
        // Exportar estatísticas
        headers = ['Métrica', 'Valor', 'Descrição'];
        dataToExport = [
          ['Reservas Ativas', stats.total, 'Total de reservas ativas'],
          ['Aguardando Aprovação', stats.pending, 'Reservas pendentes de aprovação'],
          ['Confirmadas', stats.confirmed, 'Reservas confirmadas'],
          ['Concluídas', stats.completed, 'Reservas concluídas'],
          ['Canceladas/Rejeitadas', stats.cancelled, 'Reservas canceladas ou rejeitadas'],
          ['Receita Confirmada', formatCurrency(stats.revenue), 'Valor já pago/confirmado'],
          ['Receita Pendente', formatCurrency(stats.pendingRevenue), 'Valor a receber de reservas ativas'],
          ['Valor Médio por Reserva', formatCurrency(stats.averageBookingValue), 'Média do valor das reservas'],
        ];
      } else if (exportType === 'financial') {
        // Exportar dados financeiros
        headers = ['ID Reserva', 'Título', 'Organizador', 'Valor Total', 'Depósito Pago', 'Saldo Pendente', 'Status Pagamento', 'Última Atualização'];
        dataToExport = bookings.map(b => [
          b.id,
          b.event_title,
          b.organizer_name,
          b.total_price,
          (Number(b.total_price) - Number(b.balance_due || 0)).toString(),
          b.balance_due || '0',
          getPaymentStatusLabel(b.payment_status),
          formatDateTime(b.created_at)
        ]);
      } else {
        // Exportar todas as reservas
        headers = [
          'ID', 'Título do Evento', 'Organizador', 'Email', 'Telefone', 
          'Data Início', 'Data Fim', 'Participantes', 'Tipo Evento',
          'Valor Total', 'Status', 'Status Pagamento', 'Saldo Pendente', 'Data Criação'
        ];
        
        dataToExport = bookings.map(b => [
          b.id,
          b.event_title,
          b.organizer_name,
          b.organizer_email,
          b.organizer_phone || 'Não informado',
          formatDate(b.start_date),
          formatDate(b.end_date),
          b.expected_attendees,
          b.event_type || 'Não especificado',
          b.total_price,
          getStatusLabel(b.status),
          getPaymentStatusLabel(b.payment_status),
          b.balance_due || '0',
          formatDateTime(b.created_at)
        ]);
      }
      
      const csvRows = [
        headers.join(','),
        ...dataToExport.map(row => 
          row.map((cell: string | number) => 
            typeof cell === 'string' && cell.includes(',') 
              ? `"${cell.replace(/"/g, '""')}"` 
              : cell
          ).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName();
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: '✅ Exportação concluída',
        description: `Arquivo ${exportFormat.toUpperCase()} baixado com sucesso`,
      });
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: '❌ Erro na exportação',
        description: 'Falha ao gerar o arquivo de exportação',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const exportToExcel = () => {
    // Para Excel, usamos CSV como fallback (formato universal)
    toast({
      title: '📊 Exportando para Excel',
      description: 'Usando formato CSV compatível com Excel...',
    });
    exportToCSV(); // CSV funciona no Excel
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      // Criar conteúdo HTML para o PDF
      const printContent = document.createElement('div');
      printContent.style.padding = '20px';
      printContent.style.fontFamily = 'Arial, sans-serif';
      
      // Cabeçalho
      printContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
          <h1 style="color: #1e40af; margin: 0;">Relatório de Reservas</h1>
          <h3 style="color: #4b5563; margin: 5px 0;">Espaço: ${spaceName}</h3>
          <p style="color: #6b7280;">Período: ${period} | Gerado em: ${new Date().toLocaleDateString('pt-MZ')}</p>
        </div>
      `;
      
      if (exportType === 'stats') {
        // Estatísticas em formato de tabela
        printContent.innerHTML += `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Estatísticas do Período</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Métrica</th>
                  <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Valor</th>
                  <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">Reservas Ativas</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: bold;">${stats.total}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">Total de reservas ativas</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="border: 1px solid #d1d5db; padding: 10px;">Receita Confirmada</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: bold; color: #059669;">${formatCurrency(stats.revenue)}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">Valor já pago/confirmado</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">Receita Pendente</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: bold; color: #d97706;">${formatCurrency(stats.pendingRevenue)}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">Valor a receber de reservas ativas</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="border: 1px solid #d1d5db; padding: 10px;">Valor Médio por Reserva</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: bold;">${formatCurrency(stats.averageBookingValue)}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px;">Média do valor das reservas</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      } else {
        // Lista de reservas
        printContent.innerHTML += `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
              ${exportType === 'financial' ? 'Dados Financeiros' : 'Lista de Reservas'} (${bookings.length} itens)
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
              <thead>
                <tr style="background-color: #3b82f6; color: white;">
                  <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: left;">Título</th>
                  <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: left;">Organizador</th>
                  <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: left;">Data</th>
                  <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: left;">Valor</th>
                  <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: left;">Status</th>
                  ${exportType === 'financial' ? '<th style="border: 1px solid #1d4ed8; padding: 8px; text-align: left;">Saldo</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${bookings.map((b, i) => `
                  <tr style="${i % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${b.event_title}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${b.organizer_name}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${formatDate(b.start_date)}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">${formatCurrency(b.total_price)}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">
                      <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; 
                        ${b.status === 'confirmed' ? 'background-color: #d1fae5; color: #065f46;' : 
                          b.status === 'pending_approval' ? 'background-color: #dbeafe; color: #1e40af;' :
                          'background-color: #fee2e2; color: #991b1b;'}">
                        ${getStatusLabel(b.status)}
                      </span>
                    </td>
                    ${exportType === 'financial' ? `
                      <td style="border: 1px solid #d1d5db; padding: 8px; color: ${Number(b.balance_due || 0) > 0 ? '#d97706' : '#059669'};">
                        ${formatCurrency(b.balance_due || '0')}
                      </td>
                    ` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      
      // Rodapé
      printContent.innerHTML += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>Documento gerado automaticamente pelo Sistema de Gestão de Eventos</p>
          <p>Total de registros: ${exportType === 'stats' ? '8 métricas' : bookings.length + ' reservas'}</p>
        </div>
      `;
      
      // Abrir janela de impressão (que pode salvar como PDF)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Relatório de Reservas - ${spaceName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background-color: #3b82f6; color: white; padding: 8px; text-align: left; }
                td { border: 1px solid #d1d5db; padding: 8px; }
                tr:nth-child(even) { background-color: #f9fafb; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Dar tempo para carregar e então imprimir/salvar como PDF
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
      
      toast({
        title: '📄 PDF gerado',
        description: 'A janela de impressão foi aberta. Use "Salvar como PDF" nas opções de impressão.',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: '❌ Erro ao gerar PDF',
        description: 'Falha ao criar o documento PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const handleExport = () => {
    if (!bookings.length && exportType !== 'stats') {
      toast({
        title: '⚠️ Nenhum dado para exportar',
        description: 'Não há reservas para exportar no período selecionado',
      });
      return;
    }

    switch (exportFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
    }
  };

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: <FileText className="h-4 w-4" />, description: 'Dados estruturados (Excel)' },
    { value: 'excel', label: 'Excel', icon: <FileSpreadsheet className="h-4 w-4" />, description: 'Planilha editável' },
    { value: 'pdf', label: 'PDF', icon: <Printer className="h-4 w-4" />, description: 'Relatório formatado' },
  ];

  const typeOptions = [
    { value: 'filtered', label: 'Reservas Filtradas', icon: <Calendar className="h-4 w-4" />, description: 'Apenas reservas visíveis' },
    { value: 'all', label: 'Todas as Reservas', icon: <FileDown className="h-4 w-4" />, description: 'Todas as reservas do espaço' },
    { value: 'financial', label: 'Dados Financeiros', icon: <FileSpreadsheet className="h-4 w-4" />, description: 'Foco em valores e pagamentos' },
    { value: 'stats', label: 'Estatísticas', icon: <BarChart className="h-4 w-4" />, description: 'Métricas e resumo' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para o espaço: {spaceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de Exportação */}
          <div className="space-y-3">
            <Label>Tipo de Dados a Exportar</Label>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((option) => (
                <Card 
                  key={option.value}
                  className={`p-4 cursor-pointer border-2 transition-all ${
                    exportType === option.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportType(option.value as any)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      exportType === option.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                  {exportType === option.value && (
                    <Badge variant="outline" className="mt-2 border-blue-300 text-blue-700">
                      Selecionado
                    </Badge>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Formato de Exportação */}
          <div className="space-y-3">
            <Label>Formato do Arquivo</Label>
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.map((option) => (
                <Card 
                  key={option.value}
                  className={`p-4 cursor-pointer border-2 transition-all ${
                    exportFormat === option.value 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportFormat(option.value as any)}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-3 rounded-full ${
                      exportFormat === option.value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Opções Adicionais */}
          {exportType !== 'stats' && (
            <div className="space-y-3">
              <Label>Opções de Conteúdo</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-details" 
                    checked={includeDetails}
                    onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                  />
                  <Label htmlFor="include-details" className="cursor-pointer">
                    Incluir detalhes completos (telefone, tipo de evento, etc.)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-financials" 
                    checked={includeFinancials}
                    onCheckedChange={(checked) => setIncludeFinancials(checked as boolean)}
                  />
                  <Label htmlFor="include-financials" className="cursor-pointer">
                    Incluir dados financeiros (saldo, status de pagamento)
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Nome do Arquivo */}
          <div className="space-y-3">
            <Label htmlFor="filename">Nome do Arquivo (opcional)</Label>
            <Input
              id="filename"
              placeholder={`ex: relatorio_${spaceName.replace(/\s+/g, '_')}.${exportFormat}`}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
            <div className="text-xs text-gray-500">
              Nome sugerido: <span className="font-mono">{generateFileName()}</span>
            </div>
          </div>

          {/* Resumo */}
          <Card className="p-4 bg-gray-50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Espaço:</span>
                <span className="font-medium">{spaceName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tipo de dados:</span>
                <span className="font-medium">
                  {typeOptions.find(o => o.value === exportType)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Formato:</span>
                <span className="font-medium">
                  {formatOptions.find(o => o.value === exportFormat)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Itens a exportar:</span>
                <span className="font-medium">
                  {exportType === 'stats' ? '8 métricas' : `${bookings.length} reservas`}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || (exportType !== 'stats' && bookings.length === 0)}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar Dados
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDataModal;