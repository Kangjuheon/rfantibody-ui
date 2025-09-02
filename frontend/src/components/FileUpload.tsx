import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  onFileSelect: (f: File | null) => void;
  selectedFile: File | null;
  label?: string;
};

export function FileUpload({ onFileSelect, selectedFile, label }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onFileSelect(f);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        {label && <Label className="mb-1 block">{label}</Label>}
        <Input
          ref={ref}
          type="file"
          onChange={handleChange}
          className="w-full"
        />
      </div>
      {selectedFile ? (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {selectedFile.name}
        </span>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        onClick={() => ref.current?.click()}
      >
        선택
      </Button>
    </div>
  );
}
