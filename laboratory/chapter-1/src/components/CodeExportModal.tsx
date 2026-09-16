import React, { useState } from 'react';
import { Check, Copy, X, Code2, Terminal } from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<'bacteria' | 'plasma-membrane'>('bacteria');

  if (!isOpen) return null;

  const bacteriaSnippet = `// BacteriaCell.tsx
// مكون React تفاعلي ومتحرك للخلية البكتيرية (بدائيات النوى) بـ SVG و Tailwind CSS
import React, { useState } from 'react';

export default function BacteriaCell() {
  const [selectedPart, setSelectedPart] = useState<string | null>('nucleoid');

  const partsInfo: Record<string, { title: string; desc: string; role: string }> = {
    'capsule': {
      title: 'المحفظة / الكبسولة (Capsule)',
      desc: 'طبقة جيلاتينية لزجة تحيط بالجدار الخلوي تمنع البلعمة والجفاف.',
      role: 'حماية البكتيريا من الجهاز المناعي والالتصاق بالأسطح.'
    },
    'cell-wall': {
      title: 'الجدار الخلوي (Peptidoglycan Cell Wall)',
      desc: 'هيكل صلب يتكون من شبكة الببتيدوجلايكان لحماية الخلية من الضغط الإسموزي.',
      role: 'الحفاظ على شكل الخلية ومنع انفجارها بالضغط المائي الداخلي.'
    },
    'nucleoid': {
      title: 'المنطقة النووية (Nucleoid - Circular DNA)',
      desc: 'كروموسوم بكتيري حلقي مفرد ومزدوج الشريط يسبح حراً في السيتوبلازم.',
      role: 'حمل الجينات الأساسية للنمو والانقسام وتخليق البروتينات.'
    },
    'plasmid': {
      title: 'البلازميد (Plasmid Ring)',
      desc: 'حلقة DNA إضافية ذات تضاعف مستقل تنقل بالاقتران عبر الأهداب الجنسية.',
      role: 'حمل جينات مقاومة المضادات الحيوية والسموم البكتيرية.'
    },
    'flagellum': {
      title: 'السوط البكتيري الدوار (Flagellum)',
      desc: 'زائدة سوطية حلزونية من بروتين الفلاجيلين بمحرك بروتوني قاعدي دوار.',
      role: 'السباحة والاندفاع الحركي السريع نحو مصادر الغذاء (الانجذاب الكيميائي).'
    }
  };

  const current = selectedPart ? partsInfo[selectedPart] : null;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-950 text-slate-100 rounded-2xl shadow-xl font-sans" dir="rtl">
      <h2 className="text-xl font-bold mb-3 text-cyan-400">الخلية البكتيرية — بدائيات النوى (Prokaryote)</h2>
      <div className="relative border border-slate-800 rounded-xl bg-slate-900/60 p-4 overflow-hidden">
        <svg viewBox="0 0 800 400" className="w-full h-auto">
          {/* Capsule */}
          <rect x="200" y="80" width="400" height="240" rx="120" ry="120" 
            fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="4" 
            className="cursor-pointer" onClick={() => setSelectedPart('capsule')} />
          {/* Cell Wall */}
          <rect x="220" y="100" width="360" height="200" rx="100" ry="100" 
            fill="#ca8a04" fillOpacity="0.6" stroke="#facc15" strokeWidth="3" 
            className="cursor-pointer" onClick={() => setSelectedPart('cell-wall')} />
          {/* Nucleoid DNA */}
          <ellipse cx="400" cy="200" rx="70" ry="40" fill="none" stroke="#ec4899" strokeWidth="4" 
            strokeDasharray="8 4" className="cursor-pointer" onClick={() => setSelectedPart('nucleoid')} />
          {/* Plasmid */}
          <circle cx="500" cy="220" r="16" fill="none" stroke="#a855f7" strokeWidth="3" 
            className="cursor-pointer" onClick={() => setSelectedPart('plasmid')} />
          {/* Flagellum */}
          <path d="M 200 200 C 140 230, 100 160, 40 210" fill="none" stroke="#06b6d4" strokeWidth="5" 
            className="cursor-pointer" onClick={() => setSelectedPart('flagellum')} />
        </svg>
      </div>
      {current && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="text-lg font-bold text-cyan-400 mb-1">{current.title}</h3>
          <p className="text-sm text-slate-300 mb-2">{current.desc}</p>
          <div className="text-xs text-emerald-400 font-semibold">الدور الحيوي: {current.role}</div>
        </div>
      )}
    </div>
  );
}`;

  const plasmaSnippet = `// PlasmaMembrane.tsx
// مكون React تفاعلي ومتحرك للغشاء البلازمي (نموذج الفسيفساء السائل) بـ SVG و Tailwind CSS
import React, { useState } from 'react';

export default function PlasmaMembrane() {
  const [selectedPart, setSelectedPart] = useState<string | null>('channel-protein');

  const partsInfo: Record<string, { title: string; desc: string; role: string }> = {
    'hydrophilic-head': {
      title: 'الرأس القطبي المحب للماء (Hydrophilic Head)',
      desc: 'مجموعة فوسفات قطبية سالبة الشحنة تتجه نحو البيئة المائية خارج وداخل الخلية.',
      role: 'التفاعل مع جزيئات الماء وإضفاء الاستقرار البنيوي للغشاء.'
    },
    'hydrophobic-tail': {
      title: 'الذيول الهيدروكربونية الكارهة للماء (Hydrophobic Tails)',
      desc: 'سلاسل من الأحماض الدهنية غير القطبية تتجه نحو داخل الغشاء.',
      role: 'تشكيل حاجز غير نفاذ يمنع العبور العشوائي للأيونات والماء.'
    },
    'channel-protein': {
      title: 'بروتين القناة الناقلة (Channel Protein)',
      desc: 'بروتين مدمج عابر للغشاء يحتوي على ممر مائي أيوني.',
      role: 'تسهيل انتشار الأيونات والماء بسرعة ودقة دون استهلاك طاقة.'
    }
  };

  const current = selectedPart ? partsInfo[selectedPart] : null;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-slate-950 text-slate-100 rounded-2xl shadow-xl font-sans" dir="rtl">
      <h2 className="text-xl font-bold mb-3 text-sky-400">الغشاء البلازمي - نموذج الفسيفساء السائل</h2>
      <div className="relative border border-slate-800 rounded-xl bg-slate-900/60 p-2 overflow-hidden">
        <svg viewBox="0 0 800 400" className="w-full h-auto">
          {/* Phospholipid Heads */}
          {[150, 200, 250, 300, 500, 550, 600].map((x, i) => (
            <circle key={i} cx={x} cy={150} r="10" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          ))}
          {/* Channel Protein */}
          <g onClick={() => setSelectedPart('channel-protein')} className="cursor-pointer">
            <rect x="370" y="130" width="60" height="140" rx="10" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
          </g>
        </svg>
      </div>
      {current && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="text-lg font-bold text-sky-400 mb-1">{current.title}</h3>
          <p className="text-sm text-slate-300 mb-2">{current.desc}</p>
          <div className="text-xs text-emerald-400 font-semibold">الدور الحيوي: {current.role}</div>
        </div>
      )}
    </div>
  );
}`;

  const currentSnippetText = selectedSnippet === 'bacteria' ? bacteriaSnippet : plasmaSnippet;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSnippetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                كود المكون الجاهز للنسخ (React + Tailwind + SVG)
              </h3>
              <p className="text-xs text-slate-400">
                مكون مستقل تماماً جاهز للصق في أي مشروع React
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setSelectedSnippet('bacteria')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
              selectedSnippet === 'bacteria'
                ? 'text-cyan-400 border-cyan-400 bg-slate-950'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            BacteriaCell.tsx (الخلية البكتيرية)
          </button>
          <button
            onClick={() => setSelectedSnippet('plasma-membrane')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
              selectedSnippet === 'plasma-membrane'
                ? 'text-sky-400 border-sky-400 bg-slate-950'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            PlasmaMembrane.tsx (الغشاء البلازمي)
          </button>
        </div>

        {/* Code Content */}
        <div className="relative flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between mb-2 px-2 text-slate-500">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>{selectedSnippet === 'bacteria' ? 'BacteriaCell.tsx' : 'PlasmaMembrane.tsx'}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ بنجاح</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الكود بالكامل</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 overflow-x-auto text-sky-200/90 whitespace-pre">
            <code>{currentSnippetText}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            إغلاق
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ الكود الآن'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
