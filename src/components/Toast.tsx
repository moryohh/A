import React, { useEffect } from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { appSfx } from '../utils/appSfx';

interface ToastProps {
  message: string | null;
  onClear: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClear }) => {
  useEffect(() => {
    if (!message) return;
    const isAttention = /تعذر|خطأ|فشل|مرة أخرى|غير متاح/.test(message);
    const isSuccess = /تم|نجح|حُفظ|حفظ|أضيف|اكتمل/.test(message);
    if (isAttention) appSfx.attention();
    else if (isSuccess) appSfx.success();
    else appSfx.notification();
    const timer = setTimeout(() => {
      onClear();
    }, 2800);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A24]/95 text-white border border-[#00A3FF]/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top duration-200">
      <CheckCircle className="w-4 h-4 text-[#00A3FF] shrink-0" />
      <span>{message}</span>
    </div>
  );
};
