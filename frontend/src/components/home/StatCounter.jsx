import { useEffect, useRef, useState } from 'react'

function Counter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true
        const startTime = performance.now()
        function update(now) {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * end))
          if (progress < 1) requestAnimationFrame(update)
        }
        requestAnimationFrame(update)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>
}

const stats = [
  { label: 'Registered Businesses', value: 14820, suffix: '+', icon: '🏪', color: 'text-navy-900' },
  { label: 'Instruments Verified', value: 52300, suffix: '+', icon: '⚖️', color: 'text-indiaGreen' },
  { label: 'Citizens & Vendors Helped', value: 28940, suffix: '+', icon: '👥', color: 'text-navy-700' },
  { label: 'Certificates Issued', value: 31500, suffix: '+', icon: '📜', color: 'text-gold-600' }
]

export default function StatCounter() {
  return (
    <section className="bg-white border-y border-gray-200 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={"text-3xl md:text-4xl font-extrabold " + stat.color}>
                <Counter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-gray-600 text-sm mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}