import { useState } from 'react';
import { 
  Check, 
  X, 
  Star,
  ShieldCheck,
  Users,
  BarChart3,
  Headphones,
  Clock,
  Zap
} from 'lucide-react';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showComparison, setShowComparison] = useState(false);

  const plans = [
    {
      name: 'Starter',
      subtitle: 'Perfect for small estates',
      price: { monthly: 15000, yearly: 150000 },
      originalPrice: { monthly: 20000, yearly: 200000 },
      residents: 'Up to 50 residents',
      popular: false,
      features: [
        'Basic visitor code generation',
        'Resident dashboard',
        'Payment tracking',
        'Basic announcements',
        'Email support',
        'Mobile responsive',
        'Basic reporting'
      ],
      limitations: [
        'Limited to 50 residents',
        'Basic support only',
        'Standard reporting'
      ],
      cta: 'Start Free Trial',
      color: 'from-gray-500 to-gray-600'
    },
    {
      name: 'Professional',
      subtitle: 'Most popular choice',
      price: { monthly: 35000, yearly: 350000 },
      originalPrice: { monthly: 45000, yearly: 450000 },
      residents: 'Up to 200 residents',
      popular: true,
      features: [
        'Advanced visitor management',
        'Admin & resident dashboards',
        'Automated payment tracking',
        'Smart announcements',
        'Priority email & phone support',
        'Mobile app access',
        'Advanced analytics',
        'Payment verification system',
        'Custom estate branding',
        'Bulk SMS notifications',
        'Export capabilities'
      ],
      limitations: [],
      cta: 'Start Free Trial',
      color: 'from-blue-600 to-indigo-600'
    },
    {
      name: 'Enterprise',
      subtitle: 'For large communities',
      price: { monthly: 75000, yearly: 750000 },
      originalPrice: { monthly: 100000, yearly: 1000000 },
      residents: 'Unlimited residents',
      popular: false,
      features: [
        'Everything in Professional',
        'Unlimited residents',
        'Multi-estate management',
        '24/7 priority support',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced security features',
        'White-label solution',
        'API access',
        'Custom reporting',
        'Training & onboarding',
        'SLA guarantee'
      ],
      limitations: [],
      cta: 'Contact Sales',
      color: 'from-purple-600 to-indigo-700'
    }
  ];

  const features = [
    { name: 'Visitor Code Generation', starter: true, professional: true, enterprise: true },
    { name: 'Resident Dashboard', starter: true, professional: true, enterprise: true },
    { name: 'Admin Dashboard', starter: false, professional: true, enterprise: true },
    { name: 'Payment Tracking', starter: true, professional: true, enterprise: true },
    { name: 'Payment Verification', starter: false, professional: true, enterprise: true },
    { name: 'Announcements', starter: true, professional: true, enterprise: true },
    { name: 'SMS Notifications', starter: false, professional: true, enterprise: true },
    { name: 'Mobile App', starter: false, professional: true, enterprise: true },
    { name: 'Advanced Analytics', starter: false, professional: true, enterprise: true },
    { name: 'Custom Branding', starter: false, professional: true, enterprise: true },
    { name: 'Multi-estate Management', starter: false, professional: false, enterprise: true },
    { name: 'API Access', starter: false, professional: false, enterprise: true },
    { name: '24/7 Support', starter: false, professional: false, enterprise: true },
    { name: 'White-label Solution', starter: false, professional: false, enterprise: true }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            <span className="block">Simple, Transparent</span>
            <span className="block text-blue-200 mt-2">Pricing</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-blue-100">
            Choose the perfect plan for your estate. All plans include a 30-day free trial.
          </p>
          
          {/* Billing Toggle */}
          <div className="mt-10 flex justify-center">
            <div className="relative bg-white bg-opacity-20 p-1 rounded-xl">
              <div className="relative flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-blue-800 shadow-md'
                      : 'text-white hover:text-blue-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-blue-800 shadow-md'
                      : 'text-white hover:text-blue-200'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-bold">
                    25% OFF
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative -mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 ${
                plan.popular ? 'scale-105 ring-4 ring-blue-500 ring-opacity-50' : 'hover:shadow-3xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full flex items-center space-x-1 shadow-lg">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-bold">Most Popular</span>
                  </div>
                </div>
              )}

              <div className="p-8 lg:p-10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 mt-2">{plan.subtitle}</p>
                  <p className="text-sm text-gray-600 mt-1">{plan.residents}</p>
                </div>

                <div className="text-center mb-8">
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {formatPrice(plan.price[billingCycle as keyof typeof plan.price])}
                    </span>
                    <span className="text-gray-500 ml-2">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(plan.originalPrice[billingCycle as keyof typeof plan.originalPrice])}
                      </span>
                      <span className="text-sm text-green-600 ml-2 font-medium">
                        Save {formatPrice(plan.originalPrice[billingCycle as keyof typeof plan.originalPrice] - plan.price[billingCycle as keyof typeof plan.price])}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <button
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </button>
                  {plan.name !== 'Enterprise' && (
                    <p className="text-center text-sm text-gray-500 mt-3">
                      30-day free trial • No credit card required
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    What's included:
                  </h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
        >
          {showComparison ? 'Hide' : 'Show'} Detailed Comparison
          <BarChart3 className="ml-2 w-5 h-5" />
        </button>
      </div>

      {/* Feature Comparison Table */}
      {showComparison && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h3 className="text-2xl font-bold text-white text-center">
                Feature Comparison
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Features
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Starter
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600 bg-blue-50">
                      Professional
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {features.map((feature, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {feature.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.starter ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-50">
                        {feature.professional ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.enterprise ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Why Choose EstatePadi */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Why Choose EstatePadi?
            </h2>
            <p className="mt-6 max-w-3xl text-xl text-gray-600 mx-auto">
              Join hundreds of estates that trust us with their community management
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Quick Setup',
                description: 'Get your estate management system up and running in less than 24 hours',
                color: 'from-yellow-500 to-orange-500'
              },
              {
                icon: ShieldCheck,
                title: 'Bank-Level Security',
                description: 'Your data is protected with enterprise-grade security and encryption',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: Headphones,
                title: '24/7 Support',
                description: 'Get help when you need it with our dedicated customer support team',
                color: 'from-blue-500 to-indigo-500'
              },
              {
                icon: Clock,
                title: '99.9% Uptime',
                description: 'Reliable service you can count on, backed by our uptime guarantee',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: Users,
                title: 'Easy Training',
                description: 'Comprehensive onboarding and training for your admin team',
                color: 'from-red-500 to-rose-500'
              },
              {
                icon: BarChart3,
                title: 'Detailed Analytics',
                description: 'Make informed decisions with comprehensive reporting and insights',
                color: 'from-cyan-500 to-blue-500'
              }
            ].map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${benefit.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'Is there a free trial available?',
                answer: 'Yes! We offer a 30-day free trial for all plans. No credit card required to get started.'
              },
              {
                question: 'Can I change plans later?',
                answer: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards, bank transfers, and mobile payments including Paystack integration.'
              },
              {
                question: 'Is my data secure?',
                answer: 'Yes, we use bank-level encryption and security measures. Your data is stored securely and backed up regularly.'
              },
              {
                question: 'Do you provide training?',
                answer: 'Yes! All plans include comprehensive onboarding. Enterprise customers get dedicated training sessions.'
              },
              {
                question: 'What if I need more residents than my plan allows?',
                answer: 'You can easily upgrade to a higher plan, or contact us for custom pricing for very large estates.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            Ready to Transform Your Estate Management?
          </h2>
          <p className="mt-6 text-xl text-blue-100">
            Join hundreds of estates that have streamlined their operations with EstatePadi.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-blue-700 bg-white hover:bg-gray-50 transform transition-all duration-200 hover:scale-105 shadow-xl">
              Start Your Free Trial
            </button>
            <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-xl text-white bg-transparent hover:bg-white hover:text-blue-700 transform transition-all duration-200 hover:scale-105">
              Schedule a Demo
            </button>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;