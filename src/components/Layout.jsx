import { Link, useLocation } from 'react-router-dom'
import { FileText, ClipboardList } from 'lucide-react'
import { COMPANY_NAME } from '../config'

export default function Layout({ children, pageActions }) {
  const { pathname } = useLocation()
  const isNCR = pathname.startsWith('/ncr')
  const isCAPA = pathname.startsWith('/capa')

  return (
    <div className="min-h-screen bg-slate-50 pb-16 sm:pb-0">
      <header className="bg-blue-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm sm:text-base leading-tight truncate">{COMPANY_NAME}</div>
            <div className="text-blue-300 text-[11px] hidden sm:block">QA eForm · FM-QA-20 / FM-QA-21</div>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            <Link to="/ncr" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isNCR ? 'bg-white/20' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}>
              <FileText className="w-4 h-4" />NCR
            </Link>
            <Link to="/capa" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isCAPA ? 'bg-white/20' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}>
              <ClipboardList className="w-4 h-4" />CAPA
            </Link>
          </nav>
          {pageActions && <div className="flex items-center gap-2">{pageActions}</div>}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </div>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 flex shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <Link to="/ncr" className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition ${isNCR ? 'text-blue-700' : 'text-gray-400'}`}>
          <FileText className="w-5 h-5" />
          <span className="text-[11px] font-medium">NCR</span>
        </Link>
        <Link to="/capa" className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition ${isCAPA ? 'text-teal-600' : 'text-gray-400'}`}>
          <ClipboardList className="w-5 h-5" />
          <span className="text-[11px] font-medium">CAPA</span>
        </Link>
      </nav>
    </div>
  )
}
