import React, { useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import {
  Apple, ArrowRight, BookOpen, Calculator, ChevronLeft, Eraser, Heart,
  HelpCircle, Home, Lightbulb, Palette, Pen, Redo2, Share2, Sparkles,
  Trash2, Undo2, X
} from 'lucide-react'

// Some converted lesson files contain JSON-escaped LaTeX twice (for example
// `\\\\frac` after parsing becomes `\\\\frac` instead of `\\frac`).  Collapse
// repeated slashes only when they introduce a LaTeX command or delimiter;
// ordinary text and legitimate matrix row separators are left alone.
const normalizeLatex = value => String(value || '')
  .replace(/\u000c(?=rac\b)/g, '\\f')
  .replace(/&(?:amp;)?lt;/gi, '<')
  .replace(/&(?:amp;)?gt;/gi, '>')
  .replace(/&(?:amp;)?#x27;|&#39;|&apos;/gi, "'")
  .replace(/&amp;/gi, '&')
  .replace(/\\{2,}(?=[()[\]A-Za-z])/g, '\\')
  .replace(/\\+\s+(?=[()[\]])/g, '\\')

// KaTeX treats ordinary Arabic inside formulas as math symbols and removes
// normal word spaces. Convert Arabic runs to text atoms separated by explicit
// TeX spaces so every physics lesson keeps readable Arabic wording.
const preserveArabicFormulaSpacing = value => normalizeLatex(value)
  .replace(/\\text\{([^{}]*[\u0600-\u06ff][^{}]*)\}/gu, '$1')
  .replace(/[\u0600-\u06ff][\u0600-\u06ff\s،؛:؟.-]*/gu, run => {
    const leading = /^\s/u.test(run) ? '\\ ' : ''
    const trailing = /\s$/u.test(run) ? '\\ ' : ''
    const words = run.trim().split(/\s+/u).filter(Boolean)
    return words.length ? `${leading}${words.map(word => `\\text{${word}}`).join('\\ ')}${trailing}` : run
  })

const renderFormula = value => {
  const formula = preserveArabicFormulaSpacing(value).replace(/\\[()[\]]/g, '').trim()
  try {
    return katex.renderToString(formula, { throwOnError: true, strict: false, trust: true })
  } catch {
    return '<span class="math-fallback" dir="rtl">تعذّر عرض الصيغة الرياضية</span>'
  }
}

const mathHtml = value => {
  if (!value) return ''
  const clean = normalizeLatex(value)
    .replace(/\[\s*cite\s*:\s*[^\]]+\]/gi, '')
    .replace(/\\cite(?:p|t)?\s*\{[^}]*\}/gi, '')
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/\s{2,}/g, ' ')
  return clean.replace(/\\\((.*?)\\\)|\\\[(.*?)\\\]|\$\$(.*?)\$\$|\$(.*?)\$/gs, (_, a, b, c, d) => {
    return renderFormula(a ?? b ?? c ?? d)
  })
}

function MathText({ children, className = '' }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: mathHtml(children) }} />
}

function ChoiceText({ children }) {
  const value = normalizeLatex(children).trim()
  const hasArabic = /[\u0600-\u06ff]/.test(value)
  if (hasArabic) return <MathText className="choice-text">{value}</MathText>
  return <span className="choice-text choice-math" dir="ltr" dangerouslySetInnerHTML={{__html:renderFormula(value)}} />
}

function spaceFractionBlanks(root, selector) {
  if (!root) return
  const fractions = new Set([...root.querySelectorAll(selector)].map(blank => blank.closest('.mfrac')).filter(Boolean))
  fractions.forEach(frac => {
    const line = frac.querySelector('.frac-line')
    const vlist = line?.parentElement?.parentElement
    if (!line || !vlist?.classList.contains('vlist')) return
    const branches = [...vlist.children]
    const lineIndex = branches.indexOf(line.parentElement)
    const lowerWrapper = branches[lineIndex - 1]
    const upperWrapper = branches[lineIndex + 1]
    if (!upperWrapper || !lowerWrapper) return
    upperWrapper.style.transform = ''
    lowerWrapper.style.transform = ''
    const upperContent = upperWrapper.lastElementChild
    const lowerContent = lowerWrapper.lastElementChild
    if (!upperContent || !lowerContent) return
    const lineRect = line.getBoundingClientRect()
    const upperRect = upperContent.getBoundingClientRect()
    const lowerRect = lowerContent.getBoundingClientRect()
    upperWrapper.style.transform = `translateY(${lineRect.top - 3 - upperRect.bottom}px)`
    lowerWrapper.style.transform = `translateY(${lineRect.bottom + 3 - lowerRect.top}px)`
  })
}

function Equation({ step, answers, activeId, onBlank, solved = false }) {
  const equationRef = useRef(null)
  const idMap = {}
  const source = normalizeLatex(step?.html_structure)
    .replace(/\[\s*cite\s*:\s*[^\]]+\]/gi, '')
    .replace(/\\cite(?:p|t)?\s*\{[^}]*\}/gi, '')
  const formula = source.replace(/\{(q[^{}]+)\}/g, (_, id) => {
    const value = answers[id]
    if (value || solved) return `{${String(value || '?')}}`
    const safe = id.replace(/[^a-zA-Z0-9_-]/g, '_')
    idMap[safe] = id
    const stateClass = activeId === id ? 'answer-placeholder active' : 'answer-placeholder'
    return `{\\htmlId{ans-${safe}}{\\htmlClass{${stateClass}}{?}}}`
  })
  let html
  html = renderFormula(solved ? `\\displaystyle ${formula}` : formula)
  useEffect(() => { spaceFractionBlanks(equationRef.current, '.answer-placeholder') }, [html])
  const chooseBlank = event => {
    const target = event.target.closest?.('[id^="ans-"]')
    if (!target || !onBlank) return
    const id = idMap[target.id.slice(4)]
    if (id) onBlank(id)
  }
  return <div className="equation" ref={equationRef} dir="ltr" onClick={chooseBlank} dangerouslySetInnerHTML={{__html:html}}/>
}

function PracticeEquation({ step }) {
  const source = normalizeLatex(step?.html_structure)
    .replace(/\[\s*cite\s*:\s*[^\]]+\]/gi, '')
    .replace(/\\cite(?:p|t)?\s*\{[^}]*\}/gi, '')
  const formulas = source.split(/\s*[;؛]\s*/).filter(Boolean).map(part =>
    part.replace(/\{q[^{}]+\}/g, '{\\htmlClass{practice-blank}{\\phantom{00}}}')
  )
  const formulaKey = formulas.join(';;')
  const hostRef = useRef(null)
  const contentRef = useRef(null)
  const [fontSize, setFontSize] = useState(32.5)
  useEffect(() => {
    let firstFrame, secondFrame
    const fit = () => {
      setFontSize(32.5)
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          const host = hostRef.current
          const content = contentRef.current
          if (!host || !content) return
          spaceFractionBlanks(content, '.practice-blank')
          const available = Math.max(1, host.clientWidth - 12)
          const lines = [...content.querySelectorAll('.practice-equation-line')]
          const natural = Math.max(1, ...lines.map(line => line.scrollWidth))
          setFontSize(Math.max(15, Math.min(32.5, 32.5 * available / natural)))
        })
      })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); window.removeEventListener('resize', fit) }
  }, [formulaKey])
  useEffect(() => {
    const frame = requestAnimationFrame(() => spaceFractionBlanks(contentRef.current, '.practice-blank'))
    return () => cancelAnimationFrame(frame)
  }, [fontSize, formulaKey])
  return <div className="practice-equation" ref={hostRef} dir="ltr"><div className="practice-equation-content" ref={contentRef} style={{fontSize}}>{formulas.map((formula, index) => <div className="practice-equation-line" key={`${index}-${formula}`} dangerouslySetInnerHTML={{__html:renderFormula(formula)}} />)}</div></div>
}

function Header({ apples, hearts, onHome }) {
  return <header className="game-header">
    <div className="score"><span className="pill heart"><Heart size={17} fill="currentColor"/>{hearts}</span><span className="pill apple"><Apple size={17} fill="currentColor"/>{apples}</span></div>
    <button className="icon-button" onClick={onHome}><Home size={18}/><span>الرئيسية</span></button>
  </header>
}

const subjects = [
  { id: 'math', title: 'الرياضيات', subtitle: 'رياضيات السادس العلمي', icon: '√x', curriculum: './curriculum.json' },
  { id: 'chemistry', title: 'الكيمياء', subtitle: 'كيمياء السادس العلمي', icon: '⚗', curriculum: './chemistry-curriculum.json' },
  { id: 'physics', title: 'الفيزياء', subtitle: 'فيزياء السادس العلمي', icon: '⚛', curriculum: './physics-curriculum.json' }
]
const fileInfo = item => typeof item === 'string' ? { file: item, label: `صفحة ${item.match(/^page_(\d+)/)?.[1] || '?'}` } : item

function SubjectPicker({ onChoose }) {
  return <main className="page subjects-page"><section className="hero"><h1>اختر المادة</h1><p>اختر المادة التي تريد التدريب عليها خطوة بخطوة</p></section><div className="subject-grid">{subjects.map(subject => <button className={`subject-card ${subject.id}`} key={subject.id} onClick={() => onChoose(subject)}><span className="subject-icon">{subject.icon}</span><div><h2>{subject.title}</h2><p>{subject.subtitle}</p></div><ChevronLeft/></button>)}</div></main>
}

function Chapters({ curriculum, subject, onOpen }) {
  return <main className="page"><section className="hero"><div className={`hero-icon ${subject.id}`}>{subject.icon}</div><h1>{subject.subtitle}</h1><p>المنهاج العراقي التفاعلي — حل خطوة بخطوة</p></section>
    <div className="chapter-grid">{curriculum.map(ch => {
      const count = ch.topics.reduce((n, topic) => n + topic.files.length, 0)
      return <button className="chapter-card" key={ch.id} onClick={() => onOpen(ch)}>
        <div className="card-top"><span className="chapter-symbol"><BookOpen/></span><span className="count">{count} {subject.id === 'math' ? 'صفحة' : 'درس'}</span></div>
        <h2>{ch.title}</h2>{ch.topics.map(t => <p key={t.name}>‹ {t.name}</p>)}<strong>تصفح تمارين الفصل ←</strong>
      </button>
    })}</div>
  </main>
}

function Topics({ chapter, onBack, onOpen }) {
  return <main className="page"><div className="title-row"><button className="icon-button" onClick={onBack}><ArrowRight/></button><h1>{chapter.title}</h1></div>
    <div className="topic-list">{chapter.topics.map((topic,index) => <button className="topic-list-button" key={topic.id || topic.name} onClick={() => onOpen(topic)}>
      <span className="topic-number">{index + 1}</span><div><h2>{topic.name}</h2><p>{topic.files.length} مجموعة تمارين</p></div><ChevronLeft/>
    </button>)}</div>
  </main>
}

const shortExerciseTitle = problem => {
  const title = String(problem?.title || problem?.question_text || '')
  const formula = title.match(/\\\((.+?)\\\)|\\\[(.+?)\\\]|\$\$(.+?)\$\$|\$(.+?)\$/s)
  if (formula) {
    const value = (formula[1] || formula[2] || formula[3] || formula[4] || '').trim()
    return `\\(${value.length > 55 ? `${value.slice(0, 52)}…` : value}\\)`
  }
  const clean = title.replace(/روابط الصور[\s\S]*/g, '').replace(/^(جد|أوجد|احسب|حل|أثبت|بين|تحقق)\s+/u, '').trim()
  return clean.split(/\s+/).slice(0, 7).join(' ') || 'تمرين'
}

function Exercises({ topic, onBack, onOpen, embedded = false }) {
  const [items,setItems]=useState([]), [failed,setFailed]=useState(false)
  useEffect(() => {
    let active=true; setItems([]); setFailed(false)
    Promise.all(topic.files.map(async item => {
      const info=fileInfo(item), response=await fetch(`./data/${info.file}`)
      if(!response.ok) throw new Error(info.file)
      const questions=await response.json()
      return questions.map((problem,index)=>({ ...info, problem, questionIndex:index }))
    })).then(groups=>{if(active)setItems(groups.flat())}).catch(()=>{if(active)setFailed(true)})
    return()=>{active=false}
  },[topic])
  return <main className="page exercises-page"><div className="title-row">{!embedded&&<button className="icon-button" onClick={onBack}><ArrowRight/></button>}<div><small>تمارين الدرس المحدد</small><h1>{topic.name}</h1></div></div>
    {failed?<div className="loading">تعذّر تحميل قائمة التمارين</div>:!items.length?<div className="loading">جاري جمع التمارين…</div>:
    <div className="exercise-list">{items.map((item,order)=><button key={`${item.file}-${item.questionIndex}`} onClick={()=>onOpen(item.file,item.questionIndex)}>
      <span className="exercise-order">{order+1}</span><div className="exercise-name"><MathText>{shortExerciseTitle(item.problem)}</MathText><small>السؤال {item.problem.number || item.questionIndex+1}{item.problem.page_number ? ` • صفحة ${item.problem.page_number}` : ''}</small></div><ChevronLeft/>
    </button>)}</div>}
  </main>
}
function Choices({ input, onChoose, onClose }) {
  const shuffledChoices = useMemo(() => {
    const choices = [...(input?.allowed_keys || [])]
    for (let index = choices.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[choices[index], choices[randomIndex]] = [choices[randomIndex], choices[index]]
    }
    return choices
  }, [input])
  if (!input) return null
  return <div className="modal-shade"><div className="choices-card"><button className="modal-x" onClick={onClose}><X/></button><h2>اختر الإجابة الصحيحة</h2><p><MathText>{input.label}</MathText></p><div className="choice-grid">{shuffledChoices.map((value, index) => <button key={`${value}-${index}`} onClick={() => onChoose(value)}><ChoiceText>{value}</ChoiceText></button>)}</div></div></div>
}

function CalculatorModal({ onClose }) {
  const [value, setValue] = useState('0')
  const press = key => {
    if (key === 'C') return setValue('0')
    if (key === '=') { try { setValue(String(Function(`return (${value})`)())) } catch { setValue('خطأ') }; return }
    setValue(v => v === '0' || v === 'خطأ' ? key : v + key)
  }
  return <div className="calculator"><button onClick={onClose}><X size={16}/></button><div className="calc-display">{value}</div><div className="calc-grid">{['C','(',')','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map(k => <button key={k} onClick={() => press(k)}>{k}</button>)}</div></div>
}

function DrawingCanvas({ tool, color, size, strokes, setStrokes, history, setHistory, future, setFuture, canvasRef }) {
  const drawing = useRef(null)
  const redraw = () => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 2)
      if (rect.width < 1 || rect.height < 1) return
      const width=Math.round(rect.width*ratio), height=Math.round(rect.height*ratio)
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,rect.width,rect.height); ctx.lineCap='round'; ctx.lineJoin='round'
      strokes.forEach(s => { if (!s?.points?.length) return; ctx.save(); ctx.globalCompositeOperation=s.erase?'destination-out':'source-over'; ctx.strokeStyle=s.color||'#111827'; ctx.lineWidth=Number(s.width)||4; ctx.beginPath(); const pts=s.points.map(p=>({x:p.x*rect.width,y:p.y*rect.height})); ctx.moveTo(pts[0].x,pts[0].y); if(pts.length===1)ctx.lineTo(pts[0].x+.01,pts[0].y+.01);else pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke(); ctx.restore() })
    } catch (error) { console.warn('Drawing skipped safely:',error) }
  }
  useEffect(redraw, [strokes])
  const point = event => { const r=canvasRef.current?.getBoundingClientRect(); if(!r||r.width<1||r.height<1)return null; return {x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))} }
  const down = event => { try{event.preventDefault();const first=point(event);if(!first)return;setHistory(h=>[...h,strokes]);setFuture([]);const s={erase:tool==='eraser',color,width:tool==='eraser'?54:size,points:[first]};drawing.current=s;setStrokes(v=>[...v,s])}catch(error){drawing.current=null;console.warn('Pointer start ignored safely:',error)} }
  const move = event => { if(!drawing.current)return;try{event.preventDefault();const next=point(event);if(!next)return;const updatedStroke={...drawing.current,points:[...drawing.current.points,next]};drawing.current=updatedStroke;setStrokes(v=>[...v.slice(0,-1),updatedStroke])}catch(error){drawing.current=null;console.warn('Pointer move ignored safely:',error)} }
  const up = () => { drawing.current=null }
  return <canvas ref={canvasRef} className="draw-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}/>
}

function Whiteboard({ problem, answers, activeId, onBlank, apples, setApples, help, onExit }) {
  const currentIndex = problem.steps.findIndex(s => s.inputs.some(i => !answers[i.id]))
  const index = currentIndex < 0 ? problem.steps.length - 1 : currentIndex
  const current = problem.steps[index]
  const activeInput = current?.inputs.find(i => !answers[i.id]) || current?.inputs.find(i => i.id === activeId)
  const [tool,setTool]=useState('pen'), [color,setColor]=useState('#111827'), [size,setSize]=useState(4)
  const [strokes,setStrokes]=useState([]), [history,setHistory]=useState([]), [future,setFuture]=useState([])
  const [bubble,setBubble]=useState(null), [calculator,setCalculator]=useState(false)
  const canvasRef=useRef(null), scrollRef=useRef(null), pinnedRef=useRef(null)
  useEffect(()=>setBubble(null),[activeId,index])
  useEffect(()=>{
    const el=scrollRef.current
    const previousOverflow=document.body.style.overflow
    const previousOverscroll=document.documentElement.style.overscrollBehaviorY
    document.body.style.overflow='hidden'
    document.documentElement.style.overscrollBehaviorY='none'
    let startY=0, startScroll=0, clamping=false
    const maxScroll=()=>Math.max(0,pinnedRef.current?.offsetTop||0)
    const clamp=()=>{
      if(!el||clamping)return
      const max=maxScroll()
      if(el.scrollTop>max){clamping=true;el.scrollTop=max;requestAnimationFrame(()=>{clamping=false})}
    }
    const start=e=>{startY=e.touches?.[0]?.clientY||0;startScroll=el?.scrollTop||0}
    const move=e=>{
      if(!el||!e.touches?.length)return
      const delta=e.touches[0].clientY-startY
      const atTop=el.scrollTop<=0
      const pastLastStep=startScroll-delta>maxScroll()
      if((atTop&&delta>0)||pastLastStep)e.preventDefault()
    }
    el?.addEventListener('touchstart',start,{passive:true})
    el?.addEventListener('touchmove',move,{passive:false})
    el?.addEventListener('scroll',clamp,{passive:true})
    return()=>{el?.removeEventListener('touchstart',start);el?.removeEventListener('touchmove',move);el?.removeEventListener('scroll',clamp);document.body.style.overflow=previousOverflow;document.documentElement.style.overscrollBehaviorY=previousOverscroll}
  },[])
  const undo=()=>{if(!history.length)return;setFuture(v=>[...v,strokes]);setStrokes(history.at(-1));setHistory(v=>v.slice(0,-1))}
  const redo=()=>{if(!future.length)return;setHistory(v=>[...v,strokes]);setStrokes(future.at(-1));setFuture(v=>v.slice(0,-1))}
  const hint=()=>{if(!activeInput)return;if(apples<2)return alert('لا تملك تفاحًا كافيًا');setApples(v=>v-2);setBubble(activeInput.hint)}
  const exit=()=>{if(confirm('هل تريد الخروج؟ ستبدأ هذه المحاولة من الصفر.'))onExit()}
  return <div className="board-modal">
    <div className="board-head"><div className="board-actions"><button className="exit" onClick={exit}><X/></button><button onClick={()=>navigator.share?.({title:'السبورة'})}><Share2/></button><button className="calc" onClick={()=>setCalculator(true)}><Calculator/></button><button className="named-tool hint-tool" onClick={hint}><Lightbulb/><span>تلميح</span></button><button className="named-tool help-tool" onClick={help}><HelpCircle/><span>مساعدة</span></button></div><span className="pill apple"><Apple size={17} fill="currentColor"/>{apples}</span></div>
    <div className="board-workspace"><div className="board-scroll" ref={scrollRef}>
      <div className="board-flow"><div className="board-question"><MathText>{problem.title}</MathText></div>{problem.steps.slice(0,index).map((s,i)=><div className="board-step" key={s.step_id}><small>{s.title}</small><Equation step={s} answers={answers} solved/></div>)}</div>
      <div className="pinned-step" ref={pinnedRef}><div className="board-step current"><small>{current.title}</small><Equation step={current} answers={answers} activeId={activeId} onBlank={onBlank}/></div></div>
      {bubble && <div className="teacher-bubble"><div className="teacher">🧑‍🏫</div><div><button onClick={()=>setBubble(null)}><X size={16}/></button><MathText>{bubble}</MathText></div></div>}
      <div className="drawing-area"><DrawingCanvas {...{tool,color,size,strokes,setStrokes,history,setHistory,future,setFuture,canvasRef}}/></div>
      <button className="explain" onClick={()=>setBubble(current.explanation)}><span>شرح</span><b>🧑‍🏫</b></button>
    </div></div>
    <div className="draw-tools"><button className={tool==='pen'?'selected':''} onClick={()=>setTool('pen')}><Pen/>قلم</button><button className={tool==='eraser'?'selected':''} onClick={()=>setTool('eraser')}><Eraser/>ممحاة</button><label><Palette/>اللون<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label><label className="range">السُمك<input type="range" min="2" max="18" value={size} onChange={e=>setSize(+e.target.value)}/></label><button onClick={undo}><Undo2/>تراجع</button><button onClick={redo}><Redo2/>الأمام</button><button className="danger" onClick={()=>confirm('مسح كل الرسم؟')&&setStrokes([])}><Trash2/>مسح الكل</button></div>
    {calculator && <CalculatorModal onClose={()=>setCalculator(false)}/>} 
  </div>
}

function InlineBoard({ anchorRef, onHint, onHelp, step }) {
  const [tool,setTool]=useState('pen'), [color,setColor]=useState('#111827'), [size,setSize]=useState(4)
  const [strokes,setStrokes]=useState([]), [history,setHistory]=useState([]), [future,setFuture]=useState([])
  const [hintText,setHintText]=useState(null), [calculator,setCalculator]=useState(false)
  const canvasRef=useRef(null)
  const hint=()=>{const text=onHint?.();if(text)setHintText(text)}
  return <section className="inline-board" ref={anchorRef} aria-label="السبورة">
    <div className="inline-board-title inline-board-actions">
      <button className="help" onClick={onHelp}><HelpCircle/><span>مساعدة</span></button>
      <button className="hint" onClick={hint}><Lightbulb/><span>تلميح</span></button>
      <button className="calc" onClick={()=>setCalculator(true)}><Calculator/><span>حاسبة</span></button>
    </div>
    <div className="inline-canvas"><DrawingCanvas {...{tool,color,size,strokes,setStrokes,history,setHistory,future,setFuture,canvasRef}}/><PracticeEquation step={step}/>{hintText&&<div className="inline-hint-bubble"><button onClick={()=>setHintText(null)}><X size={15}/></button><MathText>{hintText}</MathText></div>}</div>
    <div className="inline-tools">
      <button className={tool==='pen'?'selected':''} onClick={()=>setTool('pen')}><Pen/>قلم</button>
      <button className={tool==='eraser'?'selected':''} onClick={()=>setTool('eraser')}><Eraser/>ممحاة</button>
      <label><Palette/>اللون<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>
      <label className="range">السُمك<input type="range" min="2" max="18" value={size} onChange={e=>setSize(+e.target.value)}/></label>
    </div>
    {calculator&&<CalculatorModal onClose={()=>setCalculator(false)}/>} 
  </section>
}

function QuestionImages({ problem }) {
  const images = [...new Set([...(problem.image_urls || []), problem.image_url, problem.diagram_url].filter(value => typeof value === "string" && value))]
  return images.length ? <div className="question-images">{images.map((url,index) => <img key={url} src={url} alt={`رسم السؤال ${index+1}`} loading="lazy" />)}</div> : null
}

function Solver({ file, initialQuestionIndex = 0, onBack, apples, setApples, hearts, setHearts, resetProgress = false }) {
  const [questions,setQuestions]=useState([]), [questionIndex,setQuestionIndex]=useState(initialQuestionIndex), [answers,setAnswers]=useState({}), [activeId,setActiveId]=useState(null), [choice,setChoice]=useState(null)
  const boardRef=useRef(null)
  useEffect(()=>{fetch(`./data/${file}`).then(r=>r.json()).then(data=>{setQuestions(data);setQuestionIndex(Math.min(initialQuestionIndex,data.length-1))})},[file,initialQuestionIndex])
  useEffect(()=>{
    if(resetProgress){setAnswers({});return}
    try{setAnswers(JSON.parse(localStorage.getItem(`xxx_react_progress_${file}_${questionIndex}`)||'{}'))}catch{setAnswers({})}
  },[file,questionIndex,resetProgress])
  useEffect(()=>{
    if(!resetProgress&&questions.length)localStorage.setItem(`xxx_react_progress_${file}_${questionIndex}`,JSON.stringify(answers))
  },[answers,file,questionIndex,questions.length,resetProgress])
  const problem=questions[questionIndex]
  const currentStep=useMemo(()=>problem?.steps.find(s=>s.inputs.some(i=>!answers[i.id])) || problem?.steps.at(-1),[problem,answers])
  useEffect(()=>{setActiveId(currentStep?.inputs.find(i=>!answers[i.id])?.id||null)},[currentStep,answers])
  useEffect(()=>{if(currentStep?.step_id)requestAnimationFrame(()=>boardRef.current?.scrollIntoView({behavior:'smooth',block:'center'}))},[currentStep?.step_id])
  if(!problem)return <div className="loading">جاري تحميل السؤال…</div>
  const inputById=id=>problem.steps.flatMap(s=>s.inputs).find(i=>i.id===id)
  const open=id=>{setActiveId(id);setChoice(inputById(id))}
  const choose=value=>{if(value===choice.correct_value){setAnswers(v=>({...v,[choice.id]:value}));setChoice(null)}else{setHearts(v=>Math.max(0,v-1))}}
  const help=()=>{const input=inputById(activeId);if(!input)return;if(apples<4)return alert('لا تملك تفاحًا كافيًا');setApples(v=>v-4);setAnswers(v=>({...v,[input.id]:input.correct_value}))}
  const boardHint=()=>{const input=inputById(activeId);if(!input)return null;if(apples<2){alert('لا تملك تفاحًا كافيًا');return null}setApples(v=>v-2);return input.hint}
  const activeIndex=problem.steps.indexOf(currentStep)
  const allInputs=problem.steps.flatMap(s=>s.inputs), solvedCount=allInputs.filter(i=>answers[i.id]).length, progress=allInputs.length?Math.round(solvedCount/allInputs.length*100):0
  return <main className="solver"><aside><button onClick={onBack}><ArrowRight/>قائمة التمارين</button></aside>
    <div className="solution-shell"><div className="solver-nav"><strong>التمرين {questionIndex + 1}</strong><div className="progress"><span style={{width:`${progress}%`}}/><b>{progress}%</b></div></div>
    <section className="solution"><div className="problem-card"><h1><MathText>{problem.title}</MathText></h1><QuestionImages problem={problem}/></div>{problem.steps.slice(0,activeIndex+1).map((step,i)=>{const done=step.inputs.every(x=>answers[x.id]);return <div className={`solution-step ${done?'done':''}`} key={step.step_id}>{!done&&<h3>{step.title}</h3>}{!done&&<p><MathText>{step.explanation}</MathText></p>}<Equation step={step} answers={answers} activeId={activeId} onBlank={open} solved={done}/>{i===activeIndex&&<InlineBoard key={step.step_id} step={step} anchorRef={boardRef} onHint={boardHint} onHelp={help}/>}</div>})}</section>
    {progress===100&&<div className="complete"><strong>أحسنت! أتممت الحل بنجاح 🎉</strong></div>}</div>
    <Choices input={choice} onChoose={choose} onClose={()=>setChoice(null)}/>
  </main>
}

export default function App(){
  const params=useMemo(()=>new URLSearchParams(window.location.search),[])
  const requestedSubject=String(params.get('subject')||'').toLowerCase()
  const embeddedScience=params.get('embedded')==='1'&&(requestedSubject.includes('chem')||requestedSubject.includes('كيمي')||requestedSubject.includes('phys')||requestedSubject.includes('فيز'))
  const [curriculum,setCurriculum]=useState([]),[subject,setSubject]=useState(null),[view,setView]=useState(embeddedScience?'loading':'subjects'),[chapter,setChapter]=useState(null),[topic,setTopic]=useState(null),[file,setFile]=useState(null),[questionIndex,setQuestionIndex]=useState(0),[apples,setApples]=useState(100),[hearts,setHearts]=useState(10)
  const chooseSubject=selected=>{setSubject(selected);setCurriculum([]);fetch(selected.curriculum).then(r=>r.json()).then(data=>{setCurriculum(data);setView('chapters')})}
  useEffect(()=>{
    const selected=subjects.find(item=>item.id===requestedSubject)||(requestedSubject.includes('chem')||requestedSubject.includes('كيمي')?subjects.find(item=>item.id==='chemistry'):requestedSubject.includes('phys')||requestedSubject.includes('فيز')?subjects.find(item=>item.id==='physics'):null)
    if(!selected)return
    let cancelled=false
    fetch(selected.curriculum).then(r=>{if(!r.ok)throw new Error('Curriculum unavailable');return r.json()}).then(data=>{
      if(cancelled)return
      setSubject(selected);setCurriculum(data);setView(embeddedScience?'missing':'chapters')
      const number=Number(params.get('chapter'))
      const matched=data.find(ch=>Number(ch.id.match(/ch(\d+)/)?.[1])===number)
      if(!matched)return
      setChapter(matched);setView(embeddedScience?'missing':'topics')
      const lesson=Number(params.get('lesson'))
      const found=matched.topics.find(t=>t.files.some(f=>new RegExp(`(?:^|_)lesson${lesson}\\.json$`).test(typeof f==='string'?f:f.file)))
      if(found){setTopic(found);setView('exercises')}
    }).catch(error=>console.error('Could not open lesson:',error))
    return()=>{cancelled=true}
  },[embeddedScience,params,requestedSubject])
  const home=()=>{setView('subjects');setSubject(null);setChapter(null);setTopic(null);setFile(null);setQuestionIndex(0)}
  return <><Header {...{apples,hearts}} onHome={home}/>
    {view==='loading'&&<main className="page"><div className="loading">جاري فتح تمارين الدرس المحدد…</div></main>}
    {view==='missing'&&<main className="page"><div className="loading">لا توجد تمارين مضافة لهذا الدرس حاليًا</div></main>}
    {view==='subjects'&&<SubjectPicker onChoose={chooseSubject}/>} 
    {view==='chapters'&&subject&&<Chapters curriculum={curriculum} subject={subject} onOpen={ch=>{setChapter(ch);setView('topics')}}/>}
    {view==='topics'&&<Topics chapter={chapter} onBack={()=>setView('chapters')} onOpen={selected=>{setTopic(selected);setView('exercises')}}/>}
    {view==='exercises'&&<Exercises topic={topic} embedded={embeddedScience} onBack={()=>setView('topics')} onOpen={(selectedFile,index)=>{setFile(selectedFile);setQuestionIndex(index);setView('solver')}}/>}
    {view==='solver'&&<Solver {...{file,apples,setApples,hearts,setHearts}} resetProgress={embeddedScience} initialQuestionIndex={questionIndex} onBack={()=>setView('exercises')}/>}</>
}
