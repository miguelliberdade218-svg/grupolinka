import { useState, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Upload, File, X, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64
  uploadedAt: Date;
}

interface DocumentUploadMultipleProps {
  documents: DocumentFile[];
  onDocumentsChange: (documents: DocumentFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  title?: string;
  description?: string;
  required?: boolean;
}

export default function DocumentUploadMultiple({
  documents,
  onDocumentsChange,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxSizeMB = 10,
  title = "Documentos para Verificação",
  description = "Envie os documentos necessários para verificação da sua conta",
  required = false
}: DocumentUploadMultipleProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    await processFiles(files);

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    // Verificar limite de arquivos
    if (documents.length + files.length > maxFiles) {
      toast({
        title: "Limite de Arquivos",
        description: `Máximo de ${maxFiles} arquivos permitidos.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const newDocuments: DocumentFile[] = [];

      for (const file of files) {
        // Verificar tipo
        const isAcceptedType = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type;
        });

        if (!isAcceptedType) {
          toast({
            title: "Tipo de Arquivo Inválido",
            description: `${file.name}: Tipo não permitido. Use apenas ${acceptedTypes.join(', ')}.`,
            variant: "destructive",
          });
          continue;
        }

        // Verificar tamanho
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          toast({
            title: "Arquivo Muito Grande",
            description: `${file.name}: Máximo ${maxSizeMB}MB permitido.`,
            variant: "destructive",
          });
          continue;
        }

        // Verificar se já existe
        const exists = [...documents, ...newDocuments].some(doc => doc.name === file.name);
        if (exists) {
          toast({
            title: "Arquivo Duplicado",
            description: `${file.name} já foi enviado.`,
            variant: "destructive",
          });
          continue;
        }

        // Converter para base64
        const base64 = await fileToBase64(file);

        const newDoc: DocumentFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          uploadedAt: new Date(),
        };

        newDocuments.push(newDoc);
      }

      if (newDocuments.length > 0) {
        onDocumentsChange([...documents, ...newDocuments]);

        toast({
          title: "Arquivos Enviados",
          description: `${newDocuments.length} arquivo(s) adicionado(s) com sucesso.`,
        });
      }

    } catch (error) {
      toast({
        title: "Erro no Upload",
        description: "Erro ao processar os arquivos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeDocument = (id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id);
    onDocumentsChange(updatedDocs);

    toast({
      title: "Arquivo Removido",
      description: "Documento removido da lista.",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type === 'application/pdf') {
      return '📄';
    } else {
      return '📎';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>Formatos: {acceptedTypes.join(', ')}</span>
              <span>•</span>
              <span>Máximo: {maxSizeMB}MB cada</span>
              <span>•</span>
              <span>Limite: {maxFiles} arquivos</span>
              {required && (
                <>
                  <span>•</span>
                  <span className="text-red-500">Obrigatório</span>
                </>
              )}
            </div>
          </div>

          {/* Área de Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="document-upload"
              className="hidden"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              disabled={isUploading}
            />

            <label htmlFor="document-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                {isUploading ? (
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}

                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {isUploading ? 'Processando...' : 'Clique ou arraste para carregar'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {acceptedTypes.join(', ')} • Máximo {maxSizeMB}MB cada
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading || documents.length >= maxFiles}
                  className="mt-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : documents.length >= maxFiles ? (
                    'Limite Atingido'
                  ) : (
                    'Selecionar Arquivos'
                  )}
                </Button>
              </div>
            </label>
          </div>

          {/* Lista de Documentos */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                Documentos Enviados ({documents.length}/{maxFiles})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getFileIcon(doc.type)}</span>
                      <div>
                        <p className="text-sm font-medium truncate max-w-xs">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)} • {doc.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          {documents.length === 0 && (
            <div className="text-center py-4">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Nenhum documento enviado ainda</p>
            </div>
          )}

          {documents.length > 0 && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                {documents.length} documento(s) pronto(s) para verificação
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}