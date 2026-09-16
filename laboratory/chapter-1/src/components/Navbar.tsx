import React from 'react';
import { ScientificDiagramType } from '../types';
import { Layers, HelpCircle, Code2, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentModel: ScientificDiagramType;
  onSelectModel: (model: ScientificDiagramType) => void;
  isQuizActive: boolean;
  onToggleQuiz: () => void;
  onOpenCodeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModel,
  onSelectModel,
  isQuizActive,
  onToggleQuiz,
  onOpenCodeModal,
}) => {
  const models = [
    // Original 5 Diagrams (Untouched)
    {
      id: 'bacteria' as ScientificDiagramType,
      titleAr: 'الخلية البكتيرية',
      subTitle: 'Prokaryotic Bacterial Cell',
      category: 'العضيات الأساسية',
    },
    {
      id: 'plasma-membrane' as ScientificDiagramType,
      titleAr: 'الغشاء البلازمي',
      subTitle: 'Fluid Mosaic Model',
      category: 'العضيات الأساسية',
    },
    {
      id: 'mitochondria' as ScientificDiagramType,
      titleAr: 'الميتوكوندريا',
      subTitle: 'Mitochondria Organelle',
      category: 'العضيات الأساسية',
    },
    {
      id: 'chloroplast' as ScientificDiagramType,
      titleAr: 'البلاستيدة الخضراء',
      subTitle: 'Chloroplast Organelle',
      category: 'العضيات الأساسية',
    },
    {
      id: 'lysosome' as ScientificDiagramType,
      titleAr: 'الجسيمات الحالة',
      subTitle: 'Lysosome & Secretion System',
      category: 'العضيات الأساسية',
    },

    // New Scientific Diagrams
    {
      id: 'chromosome' as ScientificDiagramType,
      titleAr: 'تركيب الكروموسوم',
      subTitle: 'Chromosome Structure',
      category: 'الخلية والوراثة',
    },
    {
      id: 'plant-animal-cell' as ScientificDiagramType,
      titleAr: 'مقارنة الخلية النباتية والحيوانية',
      subTitle: 'Plant vs Animal Cell',
      category: 'الخلية والوراثة',
    },
    {
      id: 'active-transport' as ScientificDiagramType,
      titleAr: 'النقل الفعال (النشط)',
      subTitle: 'Active Transport Mechanism',
      category: 'النقل الخلوي',
    },
    {
      id: 'phagocytosis' as ScientificDiagramType,
      titleAr: 'البلعمة (الأكل الخلوي)',
      subTitle: 'Phagocytosis',
      category: 'النقل الخلوي',
    },
    {
      id: 'pinocytosis' as ScientificDiagramType,
      titleAr: 'الشرب الخلوي',
      subTitle: 'Pinocytosis',
      category: 'النقل الخلوي',
    },
    {
      id: 'exocytosis' as ScientificDiagramType,
      titleAr: 'الإخراج الخلوي',
      subTitle: 'Exocytosis',
      category: 'النقل الخلوي',
    },
    {
      id: 'osmosis-cells' as ScientificDiagramType,
      titleAr: 'التناضح في الخلايا (3 محاليل)',
      subTitle: 'Osmosis in Cells',
      category: 'التناضح والانتشار',
    },
    {
      id: 'diffusion-exp' as ScientificDiagramType,
      titleAr: 'تجربة الانتشار',
      subTitle: 'Diffusion Experiment',
      category: 'التناضح والانتشار',
    },
    {
      id: 'osmosis-exp' as ScientificDiagramType,
      titleAr: 'تجربة التناضح',
      subTitle: 'Osmosis Experiment',
      category: 'التناضح والانتشار',
    },
    {
      id: 'glycolysis' as ScientificDiagramType,
      titleAr: 'التحلل السكري',
      subTitle: 'Glycolysis Pathway',
      category: 'الأيض والطاقة',
    },
    {
      id: 'krebs-cycle' as ScientificDiagramType,
      titleAr: 'دورة كربس (حامض الليمون)',
      subTitle: 'Krebs Citric Acid Cycle',
      category: 'الأيض والطاقة',
    },
    {
      id: 'mitosis' as ScientificDiagramType,
      titleAr: 'الانقسام الخيطي (Mitosis)',
      subTitle: 'Mitosis Stages',
      category: 'الانقسام الخلوي',
    },
    {
      id: 'meiosis' as ScientificDiagramType,
      titleAr: 'الانقسام الاختزالي (Meiosis)',
      subTitle: 'Meiosis Stages & Crossing Over',
      category: 'الانقسام الخلوي',
    },
  ];

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight">
                مختبر الرسوم العلمية التفاعلية
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                SVG تفاعلي متحرك
              </span>
            </div>
            <p className="text-xs text-slate-400">
              تحويل المخططات العلمية إلى مكونات برمجية تفاعلية مشروحة باللغة العربية
            </p>
          </div>
        </div>

        {/* Diagram Switcher Tabs & Dropdown */}
        <div className="flex items-center gap-2 max-w-full overflow-hidden">
          {/* Quick Select Dropdown with categories */}
          <select
            value={currentModel}
            onChange={(e) => onSelectModel(e.target.value as ScientificDiagramType)}
            aria-label="اختر الرسمة العلمية"
            className="bg-slate-950 border border-slate-700 text-sky-400 font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-sky-500 cursor-pointer shadow-inner"
          >
            <optgroup label="العضيات والخلايا الأساسية">
              <option value="bacteria">الخلية البكتيرية</option>
              <option value="plasma-membrane">الغشاء البلازمي</option>
              <option value="mitochondria">الميتوكوندريا</option>
              <option value="chloroplast">البلاستيدة الخضراء</option>
              <option value="lysosome">الجسيمات الحالة</option>
            </optgroup>
            <optgroup label="الخلية والوراثة">
              <option value="chromosome">تركيب الكروموسوم</option>
              <option value="plant-animal-cell">مقارنة الخلية النباتية والحيوانية</option>
            </optgroup>
            <optgroup label="عمليات النقل الخلوي">
              <option value="active-transport">النقل الفعال (النشط)</option>
              <option value="phagocytosis">البلعمة (الأكل الخلوي)</option>
              <option value="pinocytosis">الشرب الخلوي</option>
              <option value="exocytosis">الإخراج الخلوي</option>
            </optgroup>
            <optgroup label="التناضح والانتشار">
              <option value="osmosis-cells">التناضح في الخلايا (3 محاليل)</option>
              <option value="diffusion-exp">تجربة الانتشار</option>
              <option value="osmosis-exp">تجربة التناضح</option>
            </optgroup>
            <optgroup label="الأيض والتنفس الخلوي">
              <option value="glycolysis">التحلل السكري</option>
              <option value="krebs-cycle">دورة كربس (حامض الليمون)</option>
            </optgroup>
            <optgroup label="الانقسام الخلوي">
              <option value="mitosis">الانقسام الخيطي (Mitosis)</option>
              <option value="meiosis">الانقسام الاختزالي (Meiosis)</option>
            </optgroup>
          </select>

          {/* Scrollable Quick Pill Buttons */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl overflow-x-auto max-w-xl">
            {models.slice(0, 7).map((m) => {
              const isSelected = currentModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{m.titleAr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode & Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {/* Quiz Mode Toggle */}
          <button
            onClick={onToggleQuiz}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isQuizActive
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isQuizActive ? 'إنهاء الاختبار' : 'اختبر معلوماتك'}</span>
          </button>

          {/* Export Code Modal Button */}
          <button
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 border border-slate-700 text-sky-400 hover:text-sky-300 hover:bg-slate-800 transition-all"
            title="نسخ كود React الجاهز"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>كود المكون</span>
          </button>
        </div>
      </div>
    </header>
  );
};
