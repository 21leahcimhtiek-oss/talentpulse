import Link from 'next/link';
import { Target, Shield, MessageCircle, Brain, Activity, BarChart3, CheckCircle, ArrowRight, Zap } from 'lucide-react';

export const metadata = {
  title: 'TalentPulse – Performance management that runs on data, not gut feel.',
};

const features = [
  { icon: Target, title: 'OKR Tracking', desc: 'Set, track, and visualize objectives with automated at-risk alerts so nothing falls through the cracks.' },
  { icon: Shield, title: 'AI Bias Detection', desc: 'Catch unconscious bias in performance reviews before they become a legal and cultural liability.' },
  { icon: MessageCircle, title: '360° Feedback', desc: 'Collect peer feedback with AI sentiment analysis built in for richer, more actionable insights.' },
  { icon: Brain, title: 'AI Coaching', desc: 'Weekly coaching suggestions generated directly from real performance data — not generic advice.' },
  { icon: Activity, title: 'Team Health Score', desc: 'Daily composite health scores across engagement, OKRs, and feedback to spot issues early.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Org-wide insights on attainment rates, review completion, and trends that drive strategic decisions.' },
];

const testimonials = [
  { quote: 'TalentPulse cut our review cycle from 6 weeks to 3. The bias detection alone has saved us from two potential HR escalations.', name: 'Sarah Chen', title: 'VP People, Meridian Tech' },
  { quote: 'The OKR tracking is incredibly intuitive. Our managers actually use it now — which is saying a lot. The AI coaching suggestions are a game-changer.', name: 'Marcus Williams', title: 'HR Director, CloudBridge' },
  { quote: 'We went from dreading performance season to looking forward to the insights. The team health scores give us a 30,000-foot view we never had before.', name: 'Priya Nair', title: 'Chief People Officer, Nexagen' },
];

const starterFeatures = ['OKR Tracking', '360° Feedback', 'Basic Analytics', 'Email Support', '5 Managers'];
const proFeatures = ['Everything in Starter', 'AI Bias Detection', 'AI Coaching Suggestions', 'Team Health Scores', 'Advanced Analytics', 'Priority Support', 'Unlimited Managers'];
const enterpriseFeatures = ['Everything in Pro', 'SSO / SAML', 'Dedicated CSM', '99.9% SLA', 'Custom Integrations', 'Audit Logs', 'On-prem Option'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold text-gray-900">TalentPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full mb-6 border border-indigo-100">
            <Zap size={14} />
            AI-Powered Performance Analytics
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Performance management that runs on{' '}
            <span className="text-indigo-600">data, not gut feel.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            TalentPulse gives HR teams AI-driven OKR tracking, bias detection, and personalized coaching — all in one platform built for the modern workforce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link href="#features" className="border border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center">
              View Demo
            </Link>
          </div>
          <p className="mt-5 text-sm text-gray-400">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="bg-indigo-600 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-indigo-200 text-sm font-semibold uppercase tracking-wide mb-8">Trusted by 200+ HR teams worldwide</p>
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white">40%</div>
              <div className="text-indigo-200 mt-1 text-sm">Faster review cycles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">2x</div>
              <div className="text-indigo-200 mt-1 text-sm">OKR completion rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">60%</div>
              <div className="text-indigo-200 mt-1 text-sm">Reduction in review bias</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to manage performance</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">From OKR tracking to AI-generated coaching, TalentPulse brings together the tools HR teams need to drive real outcomes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <Icon className="text-indigo-600" size={22} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What HR leaders are saying</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map(({ quote, name, title }) => (
              <div key={name} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{name}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">No hidden fees. Start free, scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Starter */}
            <div className="border border-gray-200 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Starter</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">$79<span className="text-base font-normal text-gray-400">/mo</span></div>
              <p className="text-sm text-gray-400 mb-6">Up to 25 employees</p>
              <ul className="space-y-3 mb-8">
                {starterFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle size={15} className="text-green-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=starter" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition-colors">
                Start Free Trial
              </Link>
            </div>
            {/* Pro */}
            <div className="border-2 border-indigo-600 rounded-2xl p-8 relative shadow-xl shadow-indigo-100">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide">MOST POPULAR</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Pro</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">$199<span className="text-base font-normal text-gray-400">/mo</span></div>
              <p className="text-sm text-gray-400 mb-6">Unlimited employees</p>
              <ul className="space-y-3 mb-8">
                {proFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle size={15} className="text-indigo-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=pro" className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Start Free Trial
              </Link>
            </div>
            {/* Enterprise */}
            <div className="border border-gray-200 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Enterprise</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">Custom</div>
              <p className="text-sm text-gray-400 mb-6">Contact us for pricing</p>
              <ul className="space-y-3 mb-8">
                {enterpriseFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle size={15} className="text-green-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href="mailto:sales@aurorarayes.com" className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform performance reviews?</h2>
          <p className="text-indigo-200 mb-8">Join 200+ HR teams already using TalentPulse to make better people decisions.</p>
          <Link href="/signup" className="bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors inline-flex items-center gap-2">
            Start Your Free Trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Activity className="text-white" size={14} />
                </div>
                <span className="text-white font-bold text-lg">TalentPulse</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">AI-powered performance management for modern HR teams. Built by Aurora Rayes LLC.</p>
            </div>
            <div className="flex gap-16">
              <div>
                <h4 className="text-white text-sm font-semibold mb-4">Product</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-sm font-semibold mb-4">Company</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="mailto:sales@aurorarayes.com" className="hover:text-white transition-colors">Contact Sales</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
            <span>&copy; 2025 Aurora Rayes LLC. All rights reserved.</span>
            <span>Made with care for HR teams everywhere.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}