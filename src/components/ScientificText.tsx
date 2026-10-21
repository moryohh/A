import React from 'react';
import {BlockMath, InlineMath} from 'react-katex';

interface ScientificTextProps {
  value: string | number | boolean | null | undefined;
  className?: string;
  display?: boolean;
}

type MathPart = {type: 'text' | 'inline' | 'block'; value: string};

function repairCommonEscapes(value: string): string {
  // A malformed JSON source may have interpreted \f and \t as control characters.
  return value
    .replace(/\f(?=rac)/g, '\\frac')
    .replace(/\t(?=imes)/g, '\\times')
    .replace(/\u000b(?=ec|sqrt)/g, '\\vec')
    // Repair recurring OCR/JSON damage in chemistry and physics equations.
    .replace(/\\fracrac\b/g, '\\frac')
    .replace(/\\timesimes\b/g, '\\times')
    .replace(/(?:\\)?leftrightarrow\b/g, '\\leftrightarrow')
    .replace(/(?:\\)?(?:r?ightarrow)\b/g, '\\rightarrow')
    .replace(/\bDelta\s*Hfirc\b/g, '\\Delta H_f^{\\circ}')
    .replace(/\bDelta\s*H_([fr])\s*\^?\s*(?:\\?circ|irc)\b/g, '\\Delta H_$1^{\\circ}')
    .replace(/\bDeltaH_([fr])\s*\^?\s*(?:\\?circ|irc)\b/g, '\\Delta H_$1^{\\circ}')
    .replace(/\bDeltaH([fr])(?:\\?circ|irc)\b/g, '\\Delta H_$1^{\\circ}')
    .replace(/\bDeltaH\b/g, '\\Delta H')
    .replace(/\bDelta\s*H\b/g, '\\Delta H')
    .replace(/\bDelta(?=[A-Za-z])/g, '\\Delta ')
    .replace(/\bDelta\b/g, '\\Delta')
    .replace(/(?<!\\)\bvarsigma\b/g, '\\varsigma')
    .replace(/(?<!\\)\bcirc\b/g, '\\circ')
    .replace(/\\?(?:s?elect)\s*kJ\b/gi, '\\mathrm{kJ}')
    .replace(/\\?(?:s?elect)\s*J\b/gi, '\\mathrm{J}');
}

function looksLikeLatex(value: string): boolean {
  return /\\(?:frac|dfrac|tfrac|sqrt|pm|mp|cdot|times|div|leq|geq|neq|approx|rightarrow|leftrightarrow|Delta|alpha|beta|gamma|theta|lambda|mu|pi|rho|sigma|omega|sum|prod|int|mathrm|mathbf|text|left|right|overline|underline|vec|hat|bar)\b/.test(value);
}

function isFormulaOnly(value: string): boolean {
  if (!looksLikeLatex(value)) return false;
  // Full-string rendering is safe for equations. Arabic prose remains ordinary text
  // unless it explicitly uses delimiters, so KaTeX never receives unsupported prose.
  return !/[\u0600-\u06ff]/.test(value) && value.trim().length <= 800;
}

function splitMath(value: string): MathPart[] {
  const parts: MathPart[] = [];
  const delimiter = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = delimiter.exec(value))) {
    if (match.index > lastIndex) parts.push({type: 'text', value: value.slice(lastIndex, match.index)});
    const token = match[0];
    const isBlock = token.startsWith('$$') || token.startsWith('\\[');
    const start = isBlock ? 2 : 1;
    const end = isBlock ? 2 : 1;
    parts.push({type: isBlock ? 'block' : 'inline', value: token.slice(start, token.length - end).trim()});
    lastIndex = match.index + token.length;
  }

  if (lastIndex < value.length) parts.push({type: 'text', value: value.slice(lastIndex)});
  return parts.length ? parts : [{type: 'text', value}];
}

function MathFallback({value}: {value: string}) {
  return <code className="rounded bg-black/10 px-1 font-mono text-[0.95em]">{value}</code>;
}

export const ScientificText: React.FC<ScientificTextProps> = ({value, className = '', display = false}) => {
  if (value === null || value === undefined) return null;
  const raw = repairCommonEscapes(String(value));
  if (!raw.trim()) return null;

  const hasExplicitDelimiters = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/.test(raw);
  const displayValue = raw.trim()
    .replace(/^\$\$([\s\S]*)\$\$/, '$1')
    .replace(/^\$([^$]*)\$/, '$1')
    .replace(/^\\\[([\s\S]*)\\\]$/, '$1')
    .replace(/^\\\(([\s\S]*)\\\)$/, '$1')
    .trim();

  // Explicit delimiters must be split first. Passing the surrounding $ signs
  // into KaTeX makes otherwise valid equations fall back to raw code.
  if (display || (isFormulaOnly(raw) && !hasExplicitDelimiters)) {
    return (
      <span className={`scientific-math block overflow-x-auto py-1 text-center ${className}`} dir="ltr">
        <BlockMath math={display ? displayValue : raw} errorColor="#f87171" renderError={() => <MathFallback value={raw} />} />
      </span>
    );
  }

  const parts = splitMath(raw);
  const hasMath = parts.some((part) => part.type !== 'text');
  if (!hasMath) return <span className={className}>{raw}</span>;

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') return <React.Fragment key={index}>{part.value}</React.Fragment>;
        if (part.type === 'block') {
          return (
            <span key={index} className="scientific-math block overflow-x-auto py-1 text-center" dir="ltr">
              <BlockMath math={part.value} errorColor="#f87171" renderError={() => <MathFallback value={part.value} />} />
            </span>
          );
        }
        return (
          <span key={index} className="scientific-math inline-block align-middle" dir="ltr">
            <InlineMath math={part.value} errorColor="#f87171" renderError={() => <MathFallback value={part.value} />} />
          </span>
        );
      })}
    </span>
  );
};
