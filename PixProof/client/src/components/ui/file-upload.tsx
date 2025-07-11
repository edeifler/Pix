import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileText, Image, FileSpreadsheet, X } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (files: FileList) => void;
  isUploading?: boolean;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export function FileUpload({ onFileUpload, isUploading }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Convert to FileList and call onFileUpload
    const fileList = new DataTransfer();
    acceptedFiles.forEach(file => fileList.items.add(file));
    onFileUpload(fileList.files);

    // Track upload progress (simulated)
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((fileItem, index) => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(item => {
            if (item.file === fileItem.file) {
              const newProgress = Math.min(item.progress + Math.random() * 15, 100);
              return {
                ...item,
                progress: newProgress,
                status: newProgress === 100 ? 'completed' : 'uploading'
              };
            }
            return item;
          })
        );
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFiles(prev => 
          prev.map(item => {
            if (item.file === fileItem.file) {
              return { ...item, progress: 100, status: 'completed' };
            }
            return item;
          })
        );
      }, 3000 + Math.random() * 2000);
    });
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'text/csv': ['.csv']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(item => item.file !== fileToRemove));
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    if (file.type.includes('image')) return <Image className="h-5 w-5 text-blue-600" />;
    if (file.type.includes('csv')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-blue-50' 
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <CloudUpload className="mx-auto h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui ou clique para selecionar'}
            </p>
            <p className="text-gray-600">PDF, JPG, PNG, CSV - Até 10MB por arquivo</p>
          </div>
          <Button type="button" variant="outline" disabled={isUploading}>
            {isUploading ? 'Enviando...' : 'Selecionar Arquivos'}
          </Button>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Arquivos Enviados</h3>
          {uploadedFiles.map((fileItem, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                {getFileIcon(fileItem.file)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{fileItem.file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(fileItem.file.size / 1024 / 1024).toFixed(1)} MB • 
                    {fileItem.status === 'completed' ? ' Processamento concluído' : 
                     fileItem.status === 'uploading' ? ' Enviando...' : ' Erro'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {fileItem.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <Progress value={fileItem.progress} className="w-32" />
                    <span className="text-sm text-gray-600">{Math.floor(fileItem.progress)}%</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileItem.file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
