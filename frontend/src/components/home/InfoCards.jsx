import { Scale, FileCheck, Calendar, ShieldCheck, BookOpen, Phone } from 'lucide-react'

const cards = [
  { icon: Scale, title: 'Legal Metrology Act, 2009', desc: 'Regulates weights, measures, and measuring instruments to ensure accuracy, fairness, and consumer protection across India.', color: 'bg-blue-50 text-emerald-600', border: 'border-emerald-200' },
  { icon: FileCheck, title: 'Instrument Verification', desc: 'All commercial weighing and measuring instruments must be verified and stamped by authorized Legal Metrology inspectors before use.', color: 'bg-green-50 text-orange-600', border: 'border-green-200' },
  { icon: Calendar, title: 'Annual Renewal', desc: 'Verification certificates expire annually. TolSeva automatically tracks expiry dates and notifies vendors 90 days in advance.', color: 'bg-amber-50 text-amber-800', border: 'border-amber-200' },
  { icon: ShieldCheck, title: 'Digital Certificates', desc: 'Inspectors issue tamper-proof digital certificates with QR codes that can be verified instantly by authorities and consumers.', color: 'bg-purple-50 text-purple-800', border: 'border-purple-200' },
  { icon: BookOpen, title: 'Penalties for Non-Compliance', desc: 'Under Section 25, using un-verified instruments can result in fines up to Rs.25,000 and/or 1 year imprisonment.', color: 'bg-red-50 text-red-800', border: 'border-red-200' },
  { icon: Phone, title: '24x7 Citizen Support', desc: 'The TolSeva voice chatbot and helpline assist non-tech-savvy vendors in Hindi and English with registration and renewals.', color: 'bg-teal-50 text-teal-800', border: 'border-teal-200' }
]

export default function InfoCards() {
  return (
    <section id='about' className='py-16 bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='text-center mb-10'>
          <span className='inline-block bg-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3'>About the Platform</span>
          <h2 className='text-3xl font-extrabold text-emerald-600'>Legal Metrology at a Glance</h2>
          <p className='text-gray-600 mt-3 max-w-2xl mx-auto'>TolSeva simplifies compliance with the Legal Metrology Act, 2009 for businesses across India.</p>
        </div>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {cards.map(({ icon: Icon, title, desc, color, border }) => (
            <div key={title} className={'card border ' + border + ' hover:shadow-lg transition-shadow'}>
              <div className={'inline-flex items-center justify-center w-12 h-12 rounded-lg ' + color + ' mb-4'}>
                <Icon size={24} />
              </div>
              <h3 className='font-bold text-gray-900 mb-2'>{title}</h3>
              <p className='text-gray-600 text-sm leading-relaxed'>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}