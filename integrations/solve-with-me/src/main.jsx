import React from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import './styles.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error, info) { console.error('React recovery screen:', error, info) }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="recovery" dir="rtl">
      <h1>تعذّر عرض الصبورة مؤقتًا</h1>
      <p>تم حفظ إجاباتك. أعد فتح الواجهة للمتابعة دون فقدان تقدمك.</p>
      <button onClick={() => location.reload()}>إعادة فتح الصبورة</button>
    </main>
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>
)
