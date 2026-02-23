import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Upload, File, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface DocumentUploadProps {
  title: string;
  description: string;
  acceptedTypes?: string;
  maxSize?: number; // em MB
  required?: boolean;
  onFileUpload: (file: File | null) => void;
  value?: File | null;
}

export function DocumentUpload({ 
  title, 
  description, 
  acceptedTypes = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5,
  required = false,
  onFileUpload,
  value
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };
  
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };
  
  const processFile = async (file: File) => {
    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo deve ter no máximo ${maxSize}MB`,
        variant: 'destructive',
      });
      return;
    }
    
    // Validar tipo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = acceptedTypes.split(',');
    
    if (!acceptedExtensions.some(ext => fileExtension === ext.toLowerCase())) {
      toast({
        title: 'Tipo de arquivo não suportado',
        description: `Tipos aceitos: ${acceptedTypes}`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Simular upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onFileUpload(file);
      
      toast({
        title: 'Documento carregado',
        description: `${file.name} foi carregado com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao carregar documento',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemove = () => {
    onFileUpload(null);
    toast({
      title: 'Documento removido',
      description: 'O documento foi removido',
    });
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>Formatos: {acceptedTypes}</span>
              <span>•</span>
              <span>Máximo: {maxSize}MB</span>
              {required && (
                <>
                  <span>•</span>
                  <span className="text-red-500">Obrigatório</span>
                </>
              )}
            </div>
          </div>
          
          {value && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {value ? (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <File className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800">{value.name}</h4>
                    <p className="text-sm text-green-600">
                      {formatFileSize(value.size)} • {value.type}
                    </p>
                  </div>
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id={`file-upload-${title}`}
              className="hidden"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            
            <label htmlFor={`file-upload-${title}`} className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                {isUploading ? (
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
                
                <div>
                  <p className="font-medium text-gray-700">
                    {isUploading ? 'Carregando...' : 'Clique ou arraste para carregar'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {acceptedTypes} • Máximo {maxSize}MB
                  </p>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline"
                  disabled={isUploading}
                  className="mt-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Selecionar Arquivo'
                  )}
                </Button>
              </div>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}