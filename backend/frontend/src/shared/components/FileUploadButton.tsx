import { useState } from "react";
import { Camera } from "lucide-react";

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function FileUploadButton({ 
  onFileSelect, 
  accept = "image/*", 
  className = "",
  children 
}: FileUploadButtonProps) {
  const [fileInputId] = useState(() => `file-upload-${Math.random().toString(36).substr(2, 9)}`);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input 
        type="file" 
        id={fileInputId}
        className="hidden" 
        accept={accept}
        onChange={handleFileSelect}
      />
      
      {/* Styled button */}
      <button 
        type="button"
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium bg-white text-[#0F1419] border border-gray-300 hover:bg-gray-50 transition-colors ${className}`}
        onClick={() => document.getElementById(fileInputId)?.click()}
      >
        <Camera className="w-4 h-4" />
        {children || "Selecionar Foto"}
      </button>
    </>
  );
}