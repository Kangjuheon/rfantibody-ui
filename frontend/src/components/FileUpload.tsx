import React, { useRef } from "react";
import { Upload } from "lucide-react";

interface FileUploadProps {
  label: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  selectedFile,
  onFileSelect,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    onFileSelect(file);
  };

  return (
    <div
      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdb"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      {selectedFile ? (
        <p className="text-sm text-foreground">
          {selectedFile.name}
        </p>
      ) : (
        <div className="flex flex-col items-center text-muted-foreground">
          <Upload className="w-6 h-6 mb-2" />
          <p className="font-medium">{label}</p>
          <p className="text-xs">Drop PDB file here or click to browse</p>
        </div>
      )}
    </div>
  );
};
