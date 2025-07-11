import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, FileText, Image, FileSpreadsheet, X, Banknote, Building2, AlertCircle, CheckCircle2 } from "lucide-react";

interface AdvancedFileUploadProps {
  onFileUpload: (files: FileList, documentType: 'pix_receipt' | 'bank_statement') => void;
  isUploading?: boolean;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  documentType: 'pix_receipt' | 'bank_statement';
}

export function AdvancedFileUpload({ onFileUpload, isUploading }: AdvancedFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'pix_receipt' | 'bank_statement'>('pix_receipt');

  const handleDrop = useCallback((acceptedFiles: File[], documentType: 'pix_receipt' | 'bank_statement') => {
    // Convert to FileList and call onFileUpload
    const fileList = new DataTransfer();
    acceptedFiles.forEach(file => fileList.items.add(file));
    onFileUpload(fileList.files, documentType);

    // Track upload progress (simulated)
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      documentType
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((fileItem) => {
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

  const pixReceiptDropzone = useDropzone({
    onDrop: (files) => handleDrop(files, 'pix_receipt'),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true
  });

  const bankStatementDropzone = useDropzone({
    onDrop: (files) => handleDrop(files, 'bank_statement'),
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: true
  });

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(item => item.file !== fileToRemove));
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    if (file.type.includes('image')) return <Image className="h-5 w-5 text-blue-600" />;
    if (file.type.includes('csv') || file.type.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  const getDocumentTypeColor = (documentType: string) => {
    return documentType === 'pix_receipt' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pix_receipt" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Comprovantes PIX
          </TabsTrigger>
          <TabsTrigger value="bank_statement" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Extratos Bancários
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pix_receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-blue-600" />
                Upload de Comprovantes PIX
              </CardTitle>
              <p className="text-sm text-gray-600">
                Envie comprovantes de pagamento PIX em PDF ou imagem para processamento automático
              </p>
            </CardHeader>
            <CardContent>
              <div
                {...pixReceiptDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  pixReceiptDropzone.isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
                }`}
              >
                <input {...pixReceiptDropzone.getInputProps()} />
                <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {pixReceiptDropzone.isDragActive ? 'Solte os comprovantes PIX aqui' : 'Arraste comprovantes PIX ou clique para selecionar'}
                  </p>
                  <p className="text-gray-600 mb-4">PDF, JPG, PNG - Até 10MB por arquivo</p>
                  <Button type="button" variant="outline" disabled={isUploading}>
                    {isUploading ? 'Enviando...' : 'Selecionar Comprovantes PIX'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bank_statement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Upload de Extratos Bancários
              </CardTitle>
              <p className="text-sm text-gray-600">
                Envie extratos bancários em PDF, CSV ou Excel para conciliação automática
              </p>
            </CardHeader>
            <CardContent>
              <div
                {...bankStatementDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  bankStatementDropzone.isDragActive 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-green-500 hover:bg-gray-50'
                }`}
              >
                <input {...bankStatementDropzone.getInputProps()} />
                <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {bankStatementDropzone.isDragActive ? 'Solte os extratos bancários aqui' : 'Arraste extratos bancários ou clique para selecionar'}
                  </p>
                  <p className="text-gray-600 mb-4">PDF, CSV, XLS, XLSX - Até 50MB por arquivo</p>
                  <Button type="button" variant="outline" disabled={isUploading}>
                    {isUploading ? 'Enviando...' : 'Selecionar Extratos Bancários'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Processo de Conciliação */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Como Funciona a Conciliação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Upload dos Documentos</h4>
              <p className="text-sm text-gray-600">Envie comprovantes PIX e extratos bancários</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Processamento IA</h4>
              <p className="text-sm text-gray-600">Nossa IA extrai dados e identifica transações</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Conciliação Automática</h4>
              <p className="text-sm text-gray-600">Correspondência automática entre PIX e extratos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arquivos Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((fileItem, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(fileItem.file)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{fileItem.file.name}</p>
                        <Badge className={getDocumentTypeColor(fileItem.documentType)}>
                          {fileItem.documentType === 'pix_receipt' ? 'PIX' : 'Extrato'}
                        </Badge>
                      </div>
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
                    {fileItem.status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {fileItem.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}