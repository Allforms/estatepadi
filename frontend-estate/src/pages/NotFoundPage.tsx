import { 
  Home, 
  ArrowLeft, 
  Building,
  Users,
  Key,
  CreditCard
} from 'lucide-react';

const NotFoundPage = () => {
  const popularPages = [
    { name: 'Home', path: '/', icon: Home, desc: 'Back to homepage' },
    { name: 'Pricing', path: '/pricing', icon: CreditCard, desc: 'View our plans' },
    { name: 'Login', path: '/login', icon: Users, desc: 'Access your account' },
    { name: 'Register', path: '/register', icon: Key, desc: 'Create new account' }
  ];

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handlePageNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-100 rounded-full opacity-10 animate-ping"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        
        {/* Animated 404 */}
        <div className="mb-8">
          <div className="text-8xl sm:text-9xl lg:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 leading-none select-none">
            <span className="inline-block hover:animate-bounce">4</span>
            <span className="inline-block hover:animate-bounce delay-100">0</span>
            <span className="inline-block hover:animate-bounce delay-200">4</span>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-12 space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            <span className="block">Oops!</span>
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
              Page Not Found
            </span>
          </h1>
          
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-xl text-gray-600">
              Sorry, we couldn't find the page you're looking for.
            </p>
            <p className="text-lg text-gray-500">
              But don't worry - let's get you back to managing your estate!
            </p>
          </div>
        </div>

        {/* Estate Icon */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
            <Building className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button 
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <ArrowLeft className="mr-3 h-5 w-5" />
            Go Back
          </button>
          
          <button 
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl border-2 border-blue-200 hover:border-blue-300 transform hover:scale-105 transition-all duration-200"
          >
            <Home className="mr-3 h-5 w-5" />
            Go Home
          </button>
        </div>

        {/* Popular Pages */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Or try these popular pages:
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {popularPages.map((page) => {
              const IconComponent = page.icon;
              return (
                <button
                  key={page.name}
                  onClick={() => handlePageNavigation(page.path)}
                  className="group p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-blue-200"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    {page.name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-2 group-hover:text-gray-600 transition-colors duration-200">
                    {page.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-16">
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <Building className="w-5 h-5 text-blue-600" />
            <span className="text-gray-700 font-medium">
              Lost in the digital estate? We'll help you find your way! 🏘️
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;