import React from "react";

export function LoadingSpinner() {
    const [messageIndex, setMessageIndex] = React.useState(0);
    
    const messages = [
      "Prepare to Pick!",
      "Fetching Latest Trends...",
      "Getting Team Data...",
      "Almost Ready..."
    ];
  
    React.useEffect(() => {
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % messages.length);
      }, 1500);
      
      return () => clearInterval(interval);
    }, [messages.length]);
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-12 bg-gradient-to-r from-orange-700 to-orange-500 rounded-full mb-4 mx-auto relative animate-spin shadow-lg">
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2">
                <div className="h-0.5 bg-white mx-2 shadow-sm"></div>
                <div className="h-0.5 bg-white mx-3 mt-1 shadow-sm"></div>
                <div className="h-0.5 bg-white mx-3 mt-1 shadow-sm"></div>
              </div>
              <div className="absolute top-1 left-2 w-3 h-2 bg-white/20 rounded-full blur-sm"></div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 transition-all duration-300">
            {messages[messageIndex]}
          </h2>
          <p className="text-gray-400">Please wait while we prepare your dashboard...</p>
          

          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }