/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ScientificDiagramType, TransportType } from './types';
import { BACTERIA_PARTS, BACTERIA_QUIZ } from './data/bacteriaData';
import { PLASMA_MEMBRANE_PARTS, PLASMA_MEMBRANE_QUIZ } from './data/plasmaMembraneData';
import { MITOCHONDRIA_PARTS, MITOCHONDRIA_QUIZ } from './data/mitochondriaData';
import { CHLOROPLAST_PARTS, CHLOROPLAST_QUIZ } from './data/chloroplastData';
import { LYSOSOME_PARTS, LYSOSOME_QUIZ } from './data/lysosomeData';
import {
  CHROMOSOME_PARTS,
  CHROMOSOME_QUIZ,
  PLANT_ANIMAL_PARTS,
  PLANT_ANIMAL_QUIZ,
  ACTIVE_TRANSPORT_PARTS,
  ACTIVE_TRANSPORT_QUIZ,
  PHAGOCYTOSIS_PARTS,
  PHAGOCYTOSIS_QUIZ,
  PINOCYTOSIS_PARTS,
  PINOCYTOSIS_QUIZ,
  EXOCYTOSIS_PARTS,
  EXOCYTOSIS_QUIZ,
  OSMOSIS_CELLS_PARTS,
  OSMOSIS_CELLS_QUIZ,
  DIFFUSION_EXP_PARTS,
  DIFFUSION_EXP_QUIZ,
  OSMOSIS_EXP_PARTS,
  OSMOSIS_EXP_QUIZ,
  GLYCOLYSIS_PARTS,
  GLYCOLYSIS_QUIZ,
  KREBS_PARTS,
  KREBS_QUIZ,
  MITOSIS_PARTS,
  MITOSIS_QUIZ,
  MEIOSIS_PARTS,
  MEIOSIS_QUIZ,
} from './data/newBiologyData';
import { BacteriaSVG } from './components/BacteriaSVG';
import { BacteriaControls } from './components/BacteriaControls';
import { PlasmaMembraneSVG } from './components/PlasmaMembraneSVG';
import { MitochondriaSVG } from './components/MitochondriaSVG';
import { ChloroplastSVG } from './components/ChloroplastSVG';
import { LysosomeSVG } from './components/LysosomeSVG';
import { ChromosomeSVG } from './components/ChromosomeSVG';
import { PlantAnimalCellSVG } from './components/PlantAnimalCellSVG';
import { ActiveTransportSVG } from './components/ActiveTransportSVG';
import { EndocytosisSVG } from './components/EndocytosisSVG';
import { ExocytosisSVG } from './components/ExocytosisSVG';
import { OsmosisCellsSVG } from './components/OsmosisCellsSVG';
import { DiffusionExpSVG } from './components/DiffusionExpSVG';
import { OsmosisExpSVG } from './components/OsmosisExpSVG';
import { GlycolysisSVG } from './components/GlycolysisSVG';
import { KrebsCycleSVG } from './components/KrebsCycleSVG';
import { CellDivisionSVG } from './components/CellDivisionSVG';
import { PartInfoCard } from './components/PartInfoCard';
import { TransportControls } from './components/TransportControls';
import { QuizMode } from './components/QuizMode';
import { CodeExportModal } from './components/CodeExportModal';
import { Navbar } from './components/Navbar';
import { 
  Info, 
  HelpCircle, 
  MousePointerClick, 
  Activity, 
  Compass, 
  CheckCircle2 
} from 'lucide-react';

export default function App() {
  const [currentModel, setCurrentModel] = useState<ScientificDiagramType>('bacteria');
  const [selectedPartId, setSelectedPartId] = useState<string | null>('nucleoid');
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<TransportType>('idle');
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [motilityActive, setMotilityActive] = useState<boolean>(true);
  const [gramType, setGramType] = useState<'gram-positive' | 'gram-negative'>('gram-positive');
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  // Active dataset depending on selected model
  const parts = useMemo(() => {
    switch (currentModel) {
      case 'bacteria':
        return BACTERIA_PARTS;
      case 'mitochondria':
        return MITOCHONDRIA_PARTS;
      case 'chloroplast':
        return CHLOROPLAST_PARTS;
      case 'lysosome':
        return LYSOSOME_PARTS;
      case 'chromosome':
        return CHROMOSOME_PARTS;
      case 'plant-animal-cell':
        return PLANT_ANIMAL_PARTS;
      case 'active-transport':
        return ACTIVE_TRANSPORT_PARTS;
      case 'phagocytosis':
        return PHAGOCYTOSIS_PARTS;
      case 'pinocytosis':
        return PINOCYTOSIS_PARTS;
      case 'exocytosis':
        return EXOCYTOSIS_PARTS;
      case 'osmosis-cells':
        return OSMOSIS_CELLS_PARTS;
      case 'diffusion-exp':
        return DIFFUSION_EXP_PARTS;
      case 'osmosis-exp':
        return OSMOSIS_EXP_PARTS;
      case 'glycolysis':
        return GLYCOLYSIS_PARTS;
      case 'krebs-cycle':
        return KREBS_PARTS;
      case 'mitosis':
        return MITOSIS_PARTS;
      case 'meiosis':
        return MEIOSIS_PARTS;
      case 'plasma-membrane':
      default:
        return PLASMA_MEMBRANE_PARTS;
    }
  }, [currentModel]);

  const quizQuestions = useMemo(() => {
    switch (currentModel) {
      case 'bacteria':
        return BACTERIA_QUIZ;
      case 'mitochondria':
        return MITOCHONDRIA_QUIZ;
      case 'chloroplast':
        return CHLOROPLAST_QUIZ;
      case 'lysosome':
        return LYSOSOME_QUIZ;
      case 'chromosome':
        return CHROMOSOME_QUIZ;
      case 'plant-animal-cell':
        return PLANT_ANIMAL_QUIZ;
      case 'active-transport':
        return ACTIVE_TRANSPORT_QUIZ;
      case 'phagocytosis':
        return PHAGOCYTOSIS_QUIZ;
      case 'pinocytosis':
        return PINOCYTOSIS_QUIZ;
      case 'exocytosis':
        return EXOCYTOSIS_QUIZ;
      case 'osmosis-cells':
        return OSMOSIS_CELLS_QUIZ;
      case 'diffusion-exp':
        return DIFFUSION_EXP_QUIZ;
      case 'osmosis-exp':
        return OSMOSIS_EXP_QUIZ;
      case 'glycolysis':
        return GLYCOLYSIS_QUIZ;
      case 'krebs-cycle':
        return KREBS_QUIZ;
      case 'mitosis':
        return MITOSIS_QUIZ;
      case 'meiosis':
        return MEIOSIS_QUIZ;
      case 'plasma-membrane':
      default:
        return PLASMA_MEMBRANE_QUIZ;
    }
  }, [currentModel]);

  // When model changes, update initial selection and reset transport
  const handleSelectModel = (model: ScientificDiagramType) => {
    setCurrentModel(model);
    setTransportMode('idle');
    setIsQuizActive(false);
    if (model === 'bacteria') {
      setSelectedPartId('nucleoid');
    } else if (model === 'plasma-membrane') {
      setSelectedPartId('channel-protein');
    } else if (model === 'mitochondria') {
      setSelectedPartId('cristae');
    } else if (model === 'chloroplast') {
      setSelectedPartId('grana');
    } else if (model === 'lysosome') {
      setSelectedPartId('primary-lysosome');
    } else if (model === 'chromosome') {
      setSelectedPartId('centromere');
    } else if (model === 'plant-animal-cell') {
      setSelectedPartId('plant-wall');
    } else if (model === 'active-transport') {
      setSelectedPartId('carrier-protein');
    } else if (model === 'phagocytosis') {
      setSelectedPartId('pseudopodia');
    } else if (model === 'pinocytosis') {
      setSelectedPartId('invagination-vesicle');
    } else if (model === 'exocytosis') {
      setSelectedPartId('secretory-vesicle');
    } else if (model === 'osmosis-cells') {
      setSelectedPartId('isotonic-animal');
    } else if (model === 'diffusion-exp') {
      setSelectedPartId('membrane-beaker');
    } else if (model === 'osmosis-exp') {
      setSelectedPartId('thistle-funnel');
    } else if (model === 'glycolysis') {
      setSelectedPartId('glucose-start');
    } else if (model === 'krebs-cycle') {
      setSelectedPartId('citric-acid');
    } else if (model === 'mitosis') {
      setSelectedPartId('spindle-fibers');
    } else if (model === 'meiosis') {
      setSelectedPartId('crossing-over');
    }
  };

  const selectedPart = useMemo(() => {
    return parts.find((p) => p.id === selectedPartId) || null;
  }, [parts, selectedPartId]);

  // Next and Previous part navigation
  const currentIndex = useMemo(() => {
    return parts.findIndex((p) => p.id === selectedPartId);
  }, [parts, selectedPartId]);

  const handleNextPart = useCallback(() => {
    if (currentIndex === -1) {
      setSelectedPartId(parts[0]?.id || null);
    } else {
      const nextIdx = (currentIndex + 1) % parts.length;
      setSelectedPartId(parts[nextIdx].id);
    }
  }, [currentIndex, parts]);

  const handlePrevPart = useCallback(() => {
    if (currentIndex === -1) {
      setSelectedPartId(parts[parts.length - 1]?.id || null);
    } else {
      const prevIdx = (currentIndex - 1 + parts.length) % parts.length;
      setSelectedPartId(parts[prevIdx].id);
    }
  }, [currentIndex, parts]);

  // Keyboard shortcut listener for convenient navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNextPart();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrevPart();
      } else if (e.key === 'Escape') {
        setSelectedPartId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPart, handlePrevPart]);

  if (['plasma-membrane'].includes(currentModel)) {
    return <main className="h-screen flex flex-col bg-slate-950 text-white" dir="rtl">
      <button type="button" className="self-start m-2 px-4 py-2 rounded-xl border border-sky-700 bg-slate-900" onClick={() => handleSelectModel('bacteria')}>↩ رسومات الفصل الأول</button>
      <iframe title="الغشاء البلازمي — الحركة العضوية" src="./membrane-organic.html" className="w-full flex-1 min-h-0 border-0" />
    </main>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Header / Navigation Bar */}
      <Navbar
        currentModel={currentModel}
        onSelectModel={handleSelectModel}
        isQuizActive={isQuizActive}
        onToggleQuiz={() => setIsQuizActive(!isQuizActive)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Topic Intro Banner & Key Facts */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mt-1 flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-bold text-white">
                  {currentModel === 'bacteria' && 'الخلية البكتيرية — بدائيات النوى، المادة الوراثية الحلقية والأغلفة (Bacterial Cell)'}
                  {currentModel === 'plasma-membrane' && 'الغشاء البلازمي — نموذج الفسيفساء السائل (Fluid Mosaic Model)'}
                  {currentModel === 'mitochondria' && 'الميتوكوندريا — محطة توليد الطاقة والفسفرة التأكسدية (Mitochondria)'}
                  {currentModel === 'chloroplast' && 'البلاستيدة الخضراء — مصنع البناء الضوئي وتثبيت الكربون (Chloroplast)'}
                  {currentModel === 'lysosome' && 'الجسيمات الحالة — منظومة الهضم والإخراج والإفراز الخلوي (Lysosome System)'}
                  {currentModel === 'chromosome' && 'تركيب الكروموسوم — الكروماتيدات الشقيقة، الجزء المركزي، والحمض النووي (Chromosome Structure)'}
                  {currentModel === 'plant-animal-cell' && 'مقارنة تشريحية حية — الخلية النباتية والخلية الحيوانية (Plant & Animal Cell)'}
                  {currentModel === 'active-transport' && 'النقل الفعال (النشط) — مضخة البروتين الحامل واستهلاك طاقة ATP'}
                  {currentModel === 'phagocytosis' && 'البلعمة (الأكل الخلوي) — الأقدام الكاذبة والالتقام الخلوي (Phagocytosis)'}
                  {currentModel === 'pinocytosis' && 'الشرب الخلوي — الانبعاج الغشائي وابتلاع السوائل المحيطة (Pinocytosis)'}
                  {currentModel === 'exocytosis' && 'الإخراج الخلوي — التحام الحويصلة الإفرازية وطرد المواد (Exocytosis)'}
                  {currentModel === 'osmosis-cells' && 'التناضح وسلوك الخلايا في المحاليل (متعادلة، واطئة، وعالية التركيز)'}
                  {currentModel === 'diffusion-exp' && 'تجربة الانتشار — حركة جزيئات بلورات برمنغنات البوتاسيوم في الماء'}
                  {currentModel === 'osmosis-exp' && 'تجربة التناضح — القمع الزجاجي والغشاء شبه المنفذ وارتفاع المحلول السكري'}
                  {currentModel === 'glycolysis' && 'مخطط التحلل السكري (Glycolysis) — مسار تحويل الجلوكوز إلى حامض البايروفيك'}
                  {currentModel === 'krebs-cycle' && 'دورة كربس (دورة حامض الليمون) — الأكسدة وإنتاج الطاقة في قالب المايتوكوندريا'}
                  {currentModel === 'mitosis' && 'أطوار الانقسام الخيطي (Mitosis) — التمهيدي، الاستوائي، الانفصالي، والنهائي'}
                  {currentModel === 'meiosis' && 'أطوار الانقسام الاختزالي (Meiosis) — التعابر الوراثي واختزال عدد الكروموسومات'}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {parts.length} مكونات معتمدة
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1 leading-relaxed">
                {currentModel === 'bacteria' &&
                  'رسم مقطعي تشريحي فائق الدقة للخلية البكتيرية يبرز المحفظة، الجدار الخلوي الببتيدوجلايكاني، الغشاء الداخلي، الـ DNA الحلقي (المنطقة النووية)، البلازميدات، والأسواط الدوارة.'}
                {currentModel === 'plasma-membrane' &&
                  'رسم توضيحي دقيق بالـ SVG لطبقة الفوسفوليبيد المزدوجة، البروتينات المدمجة والطرفية، الكوليسترول، والسلاسل السكرية مع محاكاة للنقل الخلوي.'}
                {currentModel === 'mitochondria' &&
                  'مخطط تفصيلي يوضح الطبقة الخارجية، الطبقة الداخلية، الأعراف، القالب، وإنزيمات التنفس على العرف المنقط كما في الرسم المنهجي.'}
                {currentModel === 'chloroplast' &&
                  'مخطط مقطعي دقيق يبرز الغشاء الخارجي، الغشاء الداخلي، السدى، مسارات الكرانا المتوازية، وحبيبات النشا الوردية.'}
                {currentModel === 'lysosome' &&
                  'مخطط تفاعلي حي يوضح الغشاء البلازمي، النواة، الشبكة البلازمية الخشنة، جهاز كولجي، الجسيم الحال الأولي، الفجوة الغذائية، الاتحاد الهضمي، إخراج الفضلات وإفراز البروتين.'}
                {currentModel === 'chromosome' &&
                  'رسم تفاعلي عضوي للكروموسوم يوضح الكروماتيدين الشقيقين المتعرجين، الجزء المركزي (السنترومير)، شريط DNA الحلزوني المزدوج، وجسيمات الهستون (النيوكليوسومات).'}
                {currentModel === 'plant-animal-cell' &&
                  'مقارنة حية مجاورة بين الخلية النباتية (جدار خلوي، بلاستيدات خضراء، فجوة عصيرية ضخمة) والخلية الحيوانية غير المنتظمة (جسيمات مركزية، ليحلل ويهضم بيولوجياً).'}
                {currentModel === 'active-transport' &&
                  'محاكاة حية متحركة لآلية النقل النشط: ارتباط المادة المنقولة بالبروتين الحامل، تحلل جزيء ATP إلى ADP وإطلاق الطاقة، وتغير شكل البروتين لطرد المادة ضد التركيز.'}
                {currentModel === 'phagocytosis' &&
                  'محاكاة عملية البلعمة (الأكل الخلوي): إحاطة الجسيم بالأقدام الكاذبة الحية وتكوين الفجوة الغذائية التي تلتحم بالجسيمات الحالة للهضم.'}
                {currentModel === 'pinocytosis' &&
                  'محاكاة حية لظاهرة الشرب الخلوي: انبعاج حيوي لغشاء الخلية لتكوين حويصلة تشرب قطيرات السائل خارج الخلوي وتنقله إلى السيتوبلازم.'}
                {currentModel === 'exocytosis' &&
                  'محاكاة حية لطرح الفضلات وإفراز الهرمونات والبروتينات: التحام الحويصلة الإفرازية بالغشاء البلازمي وتفريغ محتواها للخارج.'}
                {currentModel === 'osmosis-cells' &&
                  'دراسة مقارنة لسلوك خلايا الدم الحمراء والخلايا النباتية في ثلاثة محاليل متباينة: متساوي، واطئ (انتفاخ/انفجار)، وعالي التركيز (انكماش وبلزمة).'}
                {currentModel === 'diffusion-exp' &&
                  'تجربة معملية تفاعلية توضح سرعة انتشار بلورات برمنغنات البوتاسيوم في الماء عبر المسافات القصيرة وانخفاضها مع زيادة المسافة.'}
                {currentModel === 'osmosis-exp' &&
                  'محاكاة حية لجهاز التناضح: ارتفاع السائل في الأنبوب القمعي بفعل دخول الماء النقي عبر الغشاء شبه المنفذ نحو المحلول السكري المركز حتى يتوازن الضغط.'}
                {currentModel === 'glycolysis' &&
                  'مخطط تفاعلي لمسار التحلل السكري في السيتوبلازم، موضحاً استهلاك 2 ATP، الانشطار إلى ثنائي هيدروكسي أسيتون و PGAL، والإنتاج الصافي لـ 2 ATP و 2 بايروفيك و 2 NADH.'}
                {currentModel === 'krebs-cycle' &&
                  'دورة كربس الدائرية في قالب المايتوكوندريا: تكاثف أستيل كو-أ مع الأوكزالوخليك لتكوين حامض الليمون، وأكسدته المتتابعة لإنتاج 12 ATP لكل دورة.'}
                {currentModel === 'mitosis' &&
                  'مراحل الانقسام غير المباشر (الخيطي): الطور التمهيدي، الاستوائي، الانفصالي، والطور النهائي مع تخصر السيتوبلازم وتكوين خليتين متماثلتين (2n).'}
                {currentModel === 'meiosis' &&
                  'مراحل الانقسام الاختزالي: تعابر الكروموسومات وتبادل المورثات، انفصال الكروموسومات المتماثلة ثم الكروماتيدات الشقيقة لتكوين 4 خلايا أمشاج أحادية الصيغة (1n).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 self-start md:self-center">
            <MousePointerClick className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span>انقر فوق أي تأشير أو عنصر لعرض الشرح التوضيحي المباشر</span>
          </div>
        </section>

        {/* Interactive SVG Canvas Section */}
        <section className="relative w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-2 md:p-6 shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col items-center">
          
          {/* Active status indicator overlay */}
          <div className="w-full flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-slate-300">
                {isQuizActive
                  ? 'وضع الاختبار نشط: أجب عن الأسئلة بالنقر على أجزاء الرسم'
                  : transportMode !== 'idle'
                  ? `محاكاة حية: ${
                      transportMode === 'simple-diffusion'
                        ? 'انتشار الأكسجين عبر الليبيدات'
                        : transportMode === 'facilitated-diffusion'
                        ? 'انتشار أيونات Na+ عبر بروتين القناة'
                        : 'نقل نشط بمضخة الصوديوم والبوتاسيوم (ATP)'
                    }`
                  : 'استكشاف تشريحي تفاعلي (Interactive Anatomical View)'}
              </span>
            </div>

            {selectedPart && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <span>الجزء النشط:</span>
                <strong style={{ color: selectedPart.color }}>{selectedPart.nameAr}</strong>
              </div>
            )}
          </div>

          {/* SVG Diagram Render */}
          <div className="w-full relative">
            {currentModel === 'bacteria' && (
              <BacteriaSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                animationSpeed={animationSpeed}
                showLabels={showLabels}
                motilityActive={motilityActive}
              />
            )}

            {currentModel === 'plasma-membrane' && (
              <PlasmaMembraneSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                transportMode={transportMode}
                animationSpeed={animationSpeed}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'mitochondria' && (
              <MitochondriaSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                animationSpeed={animationSpeed}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'chloroplast' && (
              <ChloroplastSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                animationSpeed={animationSpeed}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'lysosome' && (
              <LysosomeSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                animationSpeed={animationSpeed}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'chromosome' && (
              <ChromosomeSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'plant-animal-cell' && (
              <PlantAnimalCellSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'active-transport' && (
              <ActiveTransportSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'phagocytosis' && (
              <EndocytosisSVG
                type="phagocytosis"
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'pinocytosis' && (
              <EndocytosisSVG
                type="pinocytosis"
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'exocytosis' && (
              <ExocytosisSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'osmosis-cells' && (
              <OsmosisCellsSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'diffusion-exp' && (
              <DiffusionExpSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'osmosis-exp' && (
              <OsmosisExpSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'glycolysis' && (
              <GlycolysisSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'krebs-cycle' && (
              <KrebsCycleSVG
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'mitosis' && (
              <CellDivisionSVG
                type="mitosis"
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}

            {currentModel === 'meiosis' && (
              <CellDivisionSVG
                type="meiosis"
                parts={parts}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
                onHoverPart={(id) => setHoveredPartId(id)}
                showLabels={showLabels}
              />
            )}
          </div>

          {/* Quick-Select Pill Navigation Bar */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap ml-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>فهرس العناصر:</span>
            </span>
            {parts.map((p) => {
              const isSelected = selectedPartId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPartId(p.id)}
                  onMouseEnter={() => setHoveredPartId(p.id)}
                  onMouseLeave={() => setHoveredPartId(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-800'
                  }`}
                  style={{
                    borderColor: isSelected ? p.color : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.nameAr}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Bacteria Motility and Staining Controls */}
        {currentModel === 'bacteria' && (
          <BacteriaControls
            motilityActive={motilityActive}
            onToggleMotility={() => setMotilityActive(!motilityActive)}
            animationSpeed={animationSpeed}
            onSetAnimationSpeed={setAnimationSpeed}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels(!showLabels)}
            gramType={gramType}
            onSetGramType={setGramType}
            onReset={() => {
              setSelectedPartId(null);
            }}
          />
        )}

        {/* Transport & Animation Controls (Especially featured for Plasma Membrane) */}
        {currentModel === 'plasma-membrane' && (
          <TransportControls
            transportMode={transportMode}
            onSetTransportMode={setTransportMode}
            animationSpeed={animationSpeed}
            onSetAnimationSpeed={setAnimationSpeed}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels(!showLabels)}
            onReset={() => {
              setSelectedPartId(null);
              setTransportMode('idle');
            }}
          />
        )}

        {/* Lower Dynamic Interactive Area: Info Card or Quiz Card */}
        <section className="w-full">
          {isQuizActive ? (
            <QuizMode
              questions={quizQuestions}
              parts={parts}
              selectedPartId={selectedPartId}
              onSelectPart={(id) => setSelectedPartId(id)}
              onExitQuiz={() => setIsQuizActive(false)}
            />
          ) : (
            <PartInfoCard
              part={selectedPart}
              onClose={() => setSelectedPartId(null)}
              onNext={handleNextPart}
              onPrev={handlePrevPart}
            />
          )}
        </section>

        {/* Educational Summary & Scientific Notes (Adaptive to current model) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {currentModel === 'bacteria' && 'بدائيات النوى مقابل حقيقيات النوى'}
                {currentModel === 'plasma-membrane' && 'نموذج الفسيفساء السائل (1972)'}
                {currentModel === 'mitochondria' && 'نظرية التكافل الداخلي (Endosymbiosis)'}
                {currentModel === 'chloroplast' && 'أقراص الثايلاكويد ودورة كالفن'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentModel === 'bacteria' &&
                'تتميز البكتيريا بغياب النواة الحقيقية والعضيات المحاطة بأغشية؛ يوجد الـ DNA الصبغي الحلقي حراً في السيتوبلازم، وتتم عمليتا النسخ والترجمة معاً في آن واحد وبسرعة فائقة.'}
              {currentModel === 'plasma-membrane' &&
                'اقترحه العالمان سنغر ونيكلسون؛ يصف الغشاء بأنه مائع سائل لزج تسبح فيه البروتينات كقطع الفسيفساء، مما يسمح بحركة الجزيئات أفقياً باستمرار.'}
              {currentModel === 'mitochondria' &&
                'تحتوي الميتوكوندريا على DNA حلقي خاص بها وريبوسومات 70S تشبه البكتيريا تماماً، مما يدعم نشأتها ككائن بدائي تكافل داخل خلية حقيقية النواة.'}
              {currentModel === 'chloroplast' &&
                'تحدث التفاعلات الضوئية للبناء الضوئي على أغشية الثايلاكويد المحتوية على الكلوروفيل، بينما تحدث التفاعلات اللاضوئية (تثبيت CO₂) في حشوة الستروما.'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
              <Info className="w-4 h-4" />
              <span>
                {currentModel === 'bacteria' && 'البلازميدات ومقاومة المضادات'}
                {currentModel === 'plasma-membrane' && 'النفاذية الاختيارية (Selective Permeability)'}
                {currentModel === 'mitochondria' && 'الفسفرة التأكسدية وإنتاج ATP'}
                {currentModel === 'chloroplast' && 'صبغات الكلوروفيل وامتصاص الضوء'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentModel === 'bacteria' &&
                'البلازميدات هي دوائر DNA إضافية مستقلة يمكن تبادلها أفقياً بين السلالات البكتيرية عبر الأهداب الجنسية بالاقتران، مما يؤدي لانتشار مقاومة المضادات الحيوية عالمياً.'}
              {currentModel === 'plasma-membrane' &&
                'تتحكم في دخول وخروج المواد حسب الحجم، الشحنة، والقطبية. تعبر الغازات غير القطبية بحرية، بينما تحتاج الأيونات والسكريات إلى قنوات وبروتينات ناقلة متخصصة.'}
              {currentModel === 'mitochondria' &&
                'يضخ الغشاء الداخلي أيونات الهيدروجين إلى الحيز بين الغشائين مشكلاً قوة دافعة كهروكيميائية تدير محرك إنزيم ATP Synthase لإنتاج الطاقة الحيوية.'}
              {currentModel === 'chloroplast' &&
                'تمتص صبغات الكلوروفيل a و b الأطوال الموجية الزرقاء والحمراء وتعكس اللون الأخضر، محولة الطاقة الكهرومغناطيسية للشمس إلى روابط كيميائية.'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>
                {currentModel === 'bacteria' && 'الببتيدوجلايكان وصبغة جرام'}
                {currentModel === 'plasma-membrane' && 'جاهزية الكود والتكامل البرمجي'}
                {currentModel === 'mitochondria' && 'كثافة الأعراف والنشاط العضلي'}
                {currentModel === 'chloroplast' && 'التكامل الغذائي وسلسلة الحياة'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentModel === 'bacteria' &&
                'تمتلك البكتيريا موجبة الجرام طبقة ببتيدوجلايكان سميكة تحتفظ بالصبغة البنفسجية، بينما سالبة الجرام تملك طبقة رقيقة وغشاءً خارجياً مقاوماً للبنسلين.'}
              {currentModel === 'plasma-membrane' &&
                'المكون مبني بالكامل بـ Pure React و SVG Animations دون أي مكتبات صور ثقيلة أو صور نقطية خارجية، ومتوافق تماماً مع الهواتف الذكية ومشاريع Tailwind CSS.'}
              {currentModel === 'mitochondria' &&
                'تزداد كثافة الأعراف والميتوكوندريا في الأنسجة عالية الاستهلاك للطاقة مثل عضلات القلب والعضلات الهيكلية بنسبة تفوق الأنسجة الخاملة بعشرات المرات.'}
              {currentModel === 'chloroplast' &&
                'تمثل البلاستيدات أساس الهرم الغذائي على كوكب الأرض بإنتاج الأكسجين والجلوكوز الذي تعتمد عليه سائر الكائنات الحية بما فيها الإنسان.'}
            </p>
          </div>
        </section>
      </main>

      {/* Standalone Code Export Modal */}
      <CodeExportModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <p>مختبر الرسوم العلمية التفاعلية — مصمم لمعلمي وطلاب العلوم والأحياء والكيمياء والفيزياء باللغة العربية</p>
      </footer>
    </div>
  );
}
