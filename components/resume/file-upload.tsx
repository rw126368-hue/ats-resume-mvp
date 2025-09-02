'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  uploadProgress: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  className?: string;
}

const defaultAcceptedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export function FileUpload({ 
  onUpload, 
  uploading, 
  uploadProgress, 
  acceptedFileTypes = defaultAcceptedTypes,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className 
}: FileUploadProps) {
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: 'File too large',
        description: `File size must be less than ${formatFileSize(maxFileSize)}`,
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file type
    if (!acceptedFileTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOC, DOCX, or TXT file',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onUpload(file);
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [onUpload, maxFileSize, acceptedFileTypes, toast]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: maxFileSize,
    disabled: uploading,
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📄';
    return '📄';
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : uploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
            'min-h-[200px] flex flex-col items-center justify-center'
          )}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="w-full max-w-xs space-y-4">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-blue-600 animate-bounce" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Uploading... {Math.round(uploadProgress)}%
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supports PDF, DOC, DOCX, TXT (max {formatFileSize(maxFileSize)})
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                disabled={uploading}
              >
                Browse Files
              </Button>
            </>
          )}
        </div>
        
        {/* Show accepted files */}
        {acceptedFiles.length > 0 && !uploading && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Selected file:</h4>
            {acceptedFiles.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getFileIcon(file.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="text-green-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}
