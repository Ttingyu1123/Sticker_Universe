
import React, { useCallback } from 'react';

interface ImageUploaderProps {
  onImageUpload: (image: HTMLImageElement) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => onImageUpload(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div 
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex flex-col items-center justify-center w-full h-full min-h-[50vh] border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl bg-white/50 hover:bg-blue-50/50 transition-colors cursor-pointer text-center group"
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input 
        id="fileInput"
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={onFileChange}
        onClick={(e) => (e.target as HTMLInputElement).value = ''}
      />
      <div className="bg-white p-6 rounded-full mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-700 mb-2">上傳圖片開始製作</h3>
      <p className="text-gray-400 font-medium">拖放圖片至此，或點擊選擇 (JPG, PNG)</p>
      
      <div className="mt-8 flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> 智慧去背</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> 手動擦除</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> 邊緣修復</span>
      </div>
    </div>
  );
};

export default ImageUploader;
