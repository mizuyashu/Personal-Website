'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/education', label: 'Education' },
  { href: '/team', label: 'Design Teams' },
  { href: '/projects', label: 'Projects' },
]

export default function Navbar() {

  const [open, setOpen] = useState(false)

  return (
    <nav className="relative backdrop-blur-md bg-linear-to-r from-[#0a2a52] to-[#031d3a] border-b border-white/10 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-2">
          <Link href="/" className="flex items-center gap-2 min-w-0" onClick={() => setOpen(false)}>
            <Image 
              src="/favicon.ico" 
              alt="Michael's Personal Website Logo" 
              width={90} 
              height={90}
              className="object-contain w-14 h-14 md:w-[90px] md:h-[90px] shrink-0"
            />
            <span className="text-base md:text-xl font-bold text-white drop-shadow-lg truncate">
              Navbar hehe
            </span>
          </Link>
          
          
          {/* Desktop links */}
          <div className="hidden lg:flex items-center space-x-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-white hover:text-[#f5f1ea] transition font-medium drop-shadow-md">
                {l.label}
              </Link>
            ))}
            
            
            <Link href="/dashboard" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition text-white shadow-lg font-semibold">
              Dashboard
            </Link>
          </div>

          {/* Hamburger button */}
          <button
            className="lg:hidden text-white p-2 shrink-0"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
         </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden flex flex-col gap-3 pb-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-white hover:text-[#f5f1ea] transition font-medium"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-center text-white font-semibold shadow-lg"
            >
              Dashboard
            </Link>
          </div>
        )}
       </div>
     </nav>
   )
 }