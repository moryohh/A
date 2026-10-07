import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  Loader2,
  Layers,
} from 'lucide-react';
import {
  LessonBookletData,
  BookletItemParagraph,
  BookletItemTitle,
  BookletItemQuestion,
  BookletItemComparison,
  BookletItemList,
} from '../data/lessonBooklet';
import { useAppTheme } from '../services/themeService';
import { ScientificText } from './ScientificText';

interface LessonBookletViewProps {
  bookletData?: LessonBookletData | null;
  isLoading?: boolean;
  error?: string | null;
  lessonTitle?: string;
}

export const LessonBookletView: React.FC<LessonBookletViewProps> = ({
  bookletData,
  isLoading = false,
  error = null,
  lessonTitle,
}) => {
  const { theme } = useAppTheme();
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleQuestionAnswer = (qKey: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qKey]: !prev[qKey],
    }));
  };

  if (isLoading) {
    return (
      <div
        className={`border rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-3 transition-colors duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
      >
        <div
          className="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto"
          style={{
            backgroundColor: `${theme.colors.primary}20`,
            borderColor: `${theme.colors.primary}50`,
            color: theme.colors.primary,
          }}
        >
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className={`text-sm font-bold ${theme.classes.textMain}`}>
            جاري جلب مفردات المنهج المعتمد...
          </h3>
          <p className={`text-xs ${theme.classes.textMuted}`}>
            يرجى الانتظار، يتم تحميل النصوص والتعاريف والأسئلة الوزارية
          </p>
        </div>
      </div>
    );
  }

  if (!bookletData || !bookletData.pages || bookletData.pages.length === 0) {
    if (error) {
      return (
        <div
          className={`border rounded-3xl p-6 shadow-2xl text-center space-y-2 transition-colors duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        >
          <div className={`text-xs ${theme.classes.textMuted}`}>{error}</div>
        </div>
      );
    }
    return null;
  }

  // Flatten all items across all pages
  const allItems = bookletData.pages.flatMap((page) => page.items || []);
  const boardSource = (bookletData as LessonBookletData & { boardData?: any; board?: any }).boardData
    || (bookletData as LessonBookletData & { board?: any }).board;
  const boardSteps = Array.isArray(boardSource?.steps)
    ? boardSource.steps
    : Array.isArray(boardSource?.sections)
      ? boardSource.sections
      : Array.isArray(boardSource)
        ? boardSource
        : [];
  const hasBoardContent = boardSteps.length > 0;

  if (allItems.length === 0) {
    return null;
  }

  const getQuestionTypeLabel = (qType?: string) => {
    switch (qType) {
      case 'compare':
        return 'سؤال مقارنة';
      case 'define':
        return 'تعريف';
      case 'explain':
        return 'تعليل';
      case 'mention':
        return 'موقع / وظيفة';
      case 'solve':
        return 'مسألة رياضية / حل';
      case 'exercise':
        return 'تمرين / مثال';
      default:
        return 'سؤال وزاري / منهجي';
    }
  };

  // Helper to render any arbitrary text, object, array, or table cell safely without crashing React
  const renderSafeNode = (val: any, fallbackKey = 'val'): React.ReactNode => {
    if (val === null || val === undefined) return null;

    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return <ScientificText value={String(val)} />;
    }

    if (Array.isArray(val)) {
      return (
        <div className="space-y-1 my-1">
          {val.map((item, idx) => (
            <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div className="flex-1">{renderSafeNode(item, `${fallbackKey}-${idx}`)}</div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof val === 'object') {
      // If object has name + points
      if ('name' in val && 'points' in val && Array.isArray(val.points)) {
        return (
          <div
            className={`p-2.5 rounded-xl border space-y-1.5 transition-colors ${
              theme.isLight
                ? 'bg-slate-100/90 border-slate-300/80 text-slate-800'
                : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} text-gray-200`
            }`}
          >
            {val.name && (
              <div className="font-bold text-xs" style={{ color: theme.colors.primary }}>
                {renderSafeNode(val.name)}
              </div>
            )}
            <ul className="space-y-1 text-xs">
              {val.points.map((pt: any, pIdx: number) => (
                <li key={pIdx} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1">{renderSafeNode(pt, `pt-${pIdx}`)}</div>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      // Key-value object (like { رقم: 1, الجزء: "...", الميزة: "..." })
      const entries = Object.entries(val).filter(([_, v]) => v !== undefined && v !== null);
      if (entries.length === 0) return null;

      return (
        <div
          className={`flex flex-wrap gap-1.5 items-center my-1 rounded-lg p-2 border transition-colors ${
            theme.isLight
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-white/[0.03] border-white/10 text-gray-200'
          }`}
        >
          {entries.map(([k, v], i) => (
            <div
              key={i}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${
                theme.isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-black/40 border-white/10 text-gray-200'
              }`}
            >
              <span className="font-bold shrink-0" style={{ color: theme.colors.primary }}>
                {k}:
              </span>
              <span>{renderSafeNode(v, `${k}-${i}`)}</span>
            </div>
          ))}
        </div>
      );
    }

    return String(val);
  };

  // Helper to render string or structured answer
  const renderAnswerContent = (answer: any) => {
    if (!answer) return null;
    if (typeof answer === 'string') {
      return (
        <p
          className={`text-xs leading-relaxed whitespace-pre-line pt-0.5 font-sans ${
            theme.isLight ? 'text-emerald-950 font-medium' : 'text-emerald-100'
          }`}
        >
          <ScientificText value={answer} />
        </p>
      );
    }
    if (typeof answer === 'object') {
      if (Array.isArray(answer.items)) {
        return (
          <div className="space-y-2 pt-1">
            {answer.items.map((sub: any, sIdx: number) => (
              <div
                key={sIdx}
                className={`p-2.5 rounded-lg border space-y-1.5 transition-colors ${
                  theme.isLight
                    ? 'bg-white border-emerald-200 text-emerald-950 shadow-sm'
                    : 'bg-black/30 border-emerald-500/20 text-emerald-100'
                }`}
              >
                {sub.name && (
                  <div className="font-bold text-xs" style={{ color: theme.colors.primary }}>
                    {renderSafeNode(sub.name)}
                  </div>
                )}
                {Array.isArray(sub.points) && (
                  <ul className="space-y-1 text-xs">
                    {sub.points.map((pt: any, pIdx: number) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div className="flex-1">{renderSafeNode(pt, `ans-pt-${pIdx}`)}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {!sub.points && renderSafeNode(sub, `sub-${sIdx}`)}
              </div>
            ))}
          </div>
        );
      }
      return <div className="pt-0.5">{renderSafeNode(answer, 'ans-root')}</div>;
    }
    return (
      <p className={`text-xs ${theme.isLight ? 'text-emerald-950 font-medium' : 'text-emerald-100'}`}>
        {String(answer)}
      </p>
    );
  };

  return (
    <div className="space-y-4 my-2 text-right">
      {/* Pure Scientific Material Container */}
      <div
        className={`border rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 transition-all duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        style={{
          boxShadow: `0 8px 30px ${theme.colors.glow}`,
        }}
      >
        {/* Section Header */}
        <div className={`flex items-center justify-between border-b ${theme.classes.cardBorder} pb-3`}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg border flex items-center justify-center transition-colors"
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                borderColor: `${theme.colors.primary}40`,
                color: theme.colors.primary,
              }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs sm:text-sm font-black ${theme.classes.textMain}`}>
                مفردات المنهج والكتاب المعتمد
              </h3>
              <div className={`text-[10px] ${theme.classes.textMuted}`}>
                {lessonTitle ? lessonTitle : 'النصوص والتعاريف والأسئلة الوزارية الخاصة بالدرس'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors"
              style={{
                backgroundColor: `${theme.colors.primary}18`,
                borderColor: `${theme.colors.primary}35`,
                color: theme.colors.primary,
              }}
            >
              {allItems.length} فقرة منهجية
            </span>
          </div>
        </div>

        <div className={`grid gap-4 ${hasBoardContent ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`} dir="ltr">
          <div dir="rtl" className="min-w-0">
        {allItems.map((item, idx) => {
          const uniqueKey = `item-${item.item_id || idx}-${idx}`;

          // 1. Render TITLE (مثل: القسم الأول / مذموم)
          if (item.type === 'title') {
            const titleItem = item as BookletItemTitle;
            return (
              <div
                key={uniqueKey}
                className="pt-2.5 pb-2.5 px-3.5 rounded-2xl border mt-3 transition-all duration-300 shadow-sm"
                style={{
                  backgroundColor: `${theme.colors.primary}15`,
                  borderColor: `${theme.colors.primary}40`,
                }}
              >
                <h3
                  className="text-xs sm:text-sm font-black flex items-center gap-2"
                  style={{ color: theme.colors.primary }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <span className="leading-snug">{renderSafeNode(titleItem.content)}</span>
                </h3>
              </div>
            );
          }

          // 2. Render PARAGRAPH
          if (item.type === 'paragraph') {
            const pItem = item as BookletItemParagraph;
            return (
              <div
                key={uniqueKey}
                className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border transition-all duration-300 ${
                  theme.isLight
                    ? 'bg-slate-50 border-slate-200/90 text-slate-800 shadow-sm'
                    : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} text-gray-200`
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {renderSafeNode(pItem.content, `p-${idx}`)}
                </div>
              </div>
            );
          }

          // 3. Render QUESTION (المربعات الخاصة بالأسئلة والإجابات)
          if (item.type === 'question') {
            const qItem = item as BookletItemQuestion;
            const isExpanded = expandedQuestions[uniqueKey] ?? true;

            return (
              <div
                key={uniqueKey}
                className={`rounded-2xl p-4 space-y-3 shadow-md border transition-all duration-300 ${
                  theme.isLight
                    ? 'bg-slate-50 border-slate-200/90'
                    : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`
                }`}
              >
                {/* Question Header & Toggle */}
                <div
                  className={`flex items-center justify-between gap-2 border-b pb-2 ${
                    theme.isLight ? 'border-slate-200' : 'border-white/10'
                  }`}
                >
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors"
                    style={{
                      backgroundColor: `${theme.colors.primary}20`,
                      borderColor: `${theme.colors.primary}40`,
                      color: theme.colors.primary,
                    }}
                  >
                    {getQuestionTypeLabel(qItem.question_type)}
                  </span>

                  <button
                    onClick={() => toggleQuestionAnswer(uniqueKey)}
                    className="text-xs hover:underline font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                    style={{ color: theme.colors.primary }}
                  >
                    <span>{isExpanded ? 'إخفاء الإجابة' : 'عرض الإجابة'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Question Text */}
                <div className="flex items-start gap-2">
                  <HelpCircle
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: theme.colors.secondary }}
                  />
                  <div className={`text-xs sm:text-sm font-black leading-snug ${theme.classes.textMain}`}>
                    {renderSafeNode(qItem.question, `q-${idx}`)}
                  </div>
                </div>

                {/* Answer Box (الإجابة النموذجية الملونة) */}
                {isExpanded && (
                  <div
                    className={`p-3.5 rounded-xl space-y-1.5 border transition-all duration-300 ${
                      theme.isLight
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-sm'
                        : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 text-[11px] font-black border-b pb-1 ${
                        theme.isLight
                          ? 'text-emerald-700 border-emerald-200'
                          : 'text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>الإجابة النموذجية:</span>
                    </div>
                    {renderAnswerContent(qItem.answer)}
                  </div>
                )}
              </div>
            );
          }

          // 4. Render COMPARISON TABLE OR STRUCTURED DATA
          if (item.type === 'comparison') {
            const compItem = item as BookletItemComparison;
            const items = compItem.items || [];

            const isRowBasedTable =
              items.length > 0 &&
              items.every(
                (it: any) =>
                  typeof it === 'object' &&
                  it !== null &&
                  (!('points' in it) || !Array.isArray(it.points))
              );

            if (isRowBasedTable) {
              const allHeaders = Array.from(
                new Set(items.flatMap((it: any) => (typeof it === 'object' && it !== null ? Object.keys(it) : [])))
              );

              return (
                <div
                  key={uniqueKey}
                  className={`rounded-2xl p-4 space-y-3 shadow-md overflow-hidden border transition-all duration-300 ${
                    theme.isLight
                      ? 'bg-slate-50 border-slate-200'
                      : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`
                  }`}
                >
                  <div className={`border-b pb-2 flex items-center justify-between ${theme.classes.cardBorder}`}>
                    <h4
                      className="text-xs sm:text-sm font-bold flex items-center gap-2"
                      style={{ color: theme.colors.primary }}
                    >
                      <Layers className="w-4 h-4" />
                      <span>{renderSafeNode(compItem.title || 'جدول مقارنة ومعلومات المنهج')}</span>
                    </h4>
                  </div>

                  <div
                    className={`overflow-x-auto rounded-xl border ${
                      theme.isLight ? 'border-slate-300' : 'border-white/10'
                    }`}
                  >
                    <table
                      className={`w-full text-right text-xs border-collapse ${
                        theme.isLight ? 'text-slate-800' : 'text-gray-200'
                      }`}
                    >
                      <thead>
                        <tr
                          className={`border-b ${
                            theme.isLight
                              ? 'bg-slate-200/80 border-slate-300 text-slate-900'
                              : 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                          }`}
                        >
                          {allHeaders.map((header, hIdx) => (
                            <th
                              key={hIdx}
                              className={`p-2.5 font-bold border-l last:border-l-0 ${
                                theme.isLight ? 'border-slate-300 bg-slate-200/90' : 'border-white/10 bg-[#161426]'
                              }`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row: any, rIdx: number) => (
                          <tr
                            key={rIdx}
                            className={`border-b transition-colors ${
                              theme.isLight
                                ? 'border-slate-200 hover:bg-slate-100'
                                : 'border-white/5 hover:bg-white/[0.03]'
                            }`}
                          >
                            {allHeaders.map((header, hIdx) => (
                              <td
                                key={hIdx}
                                className={`p-2.5 border-l last:border-l-0 align-top ${
                                  theme.isLight ? 'border-slate-200' : 'border-white/10'
                                }`}
                              >
                                {renderSafeNode(row[header], `row-${rIdx}-${header}`)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={uniqueKey}
                className={`rounded-2xl p-4 space-y-3 shadow-md border transition-all duration-300 ${
                  theme.isLight
                    ? 'bg-slate-50 border-slate-200'
                    : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`
                }`}
              >
                <div className={`border-b pb-2 ${theme.classes.cardBorder}`}>
                  <h4 className="text-xs sm:text-sm font-bold" style={{ color: theme.colors.primary }}>
                    {renderSafeNode(compItem.title || 'جدول مقارنة')}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {items.map((col: any, colIdx: number) => {
                    const colName = col?.name || `عمود ${colIdx + 1}`;
                    const colPoints = Array.isArray(col?.points)
                      ? col.points
                      : typeof col === 'object' && col !== null
                      ? Object.entries(col).map(
                          ([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`
                        )
                      : [col];

                    return (
                      <div
                        key={colIdx}
                        className={`rounded-xl p-3 space-y-2 border transition-colors ${
                          theme.isLight
                            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
                            : `${theme.classes.cardBg} ${theme.classes.cardBorder} text-gray-300`
                        }`}
                      >
                        <div
                          className="p-1.5 rounded-lg text-center border"
                          style={{
                            backgroundColor: `${theme.colors.primary}20`,
                            borderColor: `${theme.colors.primary}40`,
                          }}
                        >
                          <span className="text-xs font-bold" style={{ color: theme.colors.primary }}>
                            {renderSafeNode(colName)}
                          </span>
                        </div>

                        <ul className="space-y-1.5 text-xs pt-1">
                          {colPoints.map((pt: any, pIdx: number) => (
                            <li key={pIdx} className="flex items-start gap-1.5 leading-relaxed">
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                style={{ backgroundColor: theme.colors.primary }}
                              />
                              <div className="flex-1">{renderSafeNode(pt, `col-${colIdx}-pt-${pIdx}`)}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // 5. Render LIST
          if (item.type === 'list') {
            const listItem = item as BookletItemList;
            const listItems = listItem.items || [];

            return (
              <div
                key={uniqueKey}
                className={`rounded-2xl p-4 space-y-3 shadow-md border transition-all duration-300 ${
                  theme.isLight
                    ? 'bg-slate-50 border-slate-200'
                    : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`
                }`}
              >
                <div className={`border-b pb-2 ${theme.classes.cardBorder}`}>
                  <h4 className={`text-xs sm:text-sm font-bold ${theme.classes.textMain}`}>
                    {renderSafeNode(listItem.title || 'قائمة النقاط')}
                  </h4>
                </div>

                <div className="space-y-2">
                  {listItems.map((line: any, lIdx: number) => (
                    <div
                      key={lIdx}
                      className={`p-2.5 rounded-xl text-xs leading-relaxed flex items-start gap-2 border transition-colors ${
                        theme.isLight
                          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                          : `${theme.classes.cardBg} ${theme.classes.cardBorder} text-gray-200`
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-lg font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border"
                        style={{
                          backgroundColor: `${theme.colors.primary}20`,
                          borderColor: `${theme.colors.primary}40`,
                          color: theme.colors.primary,
                        }}
                      >
                        {lIdx + 1}
                      </span>
                      <div className="flex-1">{renderSafeNode(line, `list-${lIdx}`)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Fallback for any other item format
          return (
            <div
              key={uniqueKey}
              className={`p-3 rounded-2xl text-xs border ${
                theme.isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} text-gray-300`
              }`}
            >
              {renderSafeNode(item, `other-${idx}`)}
            </div>
          );
        })}
          </div>

          {hasBoardContent && (
            <aside dir="rtl" className="min-w-0 space-y-3 rounded-2xl border border-amber-300/40 bg-gradient-to-b from-amber-950/20 via-slate-900/40 to-orange-950/20 p-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-amber-300/20 pb-3">
                <div>
                  <h3 className="text-sm font-black text-amber-200">حل معي</h3>
                  <p className="mt-1 text-[10px] text-amber-100/70">شرح مختصر للحفظ والفهم خطوة بخطوة</p>
                </div>
                <span className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] font-black text-amber-200">السبورة</span>
              </div>
              {boardSteps.map((step: any, index: number) => {
                const title = step?.title || step?.heading || `الخطوة ${index + 1}`;
                const content = step?.content ?? step?.explanation ?? step?.text ?? step;
                return (
                  <div key={step?.id || step?.step_id || index} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-200">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-300/15 text-amber-200">{index + 1}</span>
                      {renderSafeNode(title, `board-title-${index}`)}
                    </div>
                    <div className="text-xs leading-7 text-slate-200">{renderSafeNode(content, `board-content-${index}`)}</div>
                  </div>
                );
              })}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
