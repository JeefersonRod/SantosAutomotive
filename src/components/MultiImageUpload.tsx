import React, { useRef } from 'react';
import { Camera, X, Plus } from 'lucide-react';

interface MultiImageUploadProps {
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
}

export default function MultiImageUpload({ values, onChange, label }: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    
    const files = Array.from(fileList) as File[];
    
    if (values.length + files.length > 10) {
      alert('Limite de 10 imagens atingido');
      return;
    }

    const newImages: string[] = [];
    
    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(base64);
    }
    
    onChange([...values, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {values.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-50">
            <img src={url} alt={`Check-in ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Adicionar</span>
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
}
