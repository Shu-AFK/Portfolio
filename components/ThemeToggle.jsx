'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle(){
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(()=>{
    setMounted(true)
    const stored = localStorage.getItem('theme')
    const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored ? stored === 'dark' : prefers
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  if(!mounted) return null

  function toggle(){
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle} className="rounded-xl border px-3 py-1.5 text-sm hover:opacity-80 transition">
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}
