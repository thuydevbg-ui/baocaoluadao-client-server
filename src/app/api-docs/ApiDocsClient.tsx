"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, ArrowLeft, Sun, Moon, Loader2 } from 'lucide-react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen pt-20 bg-gray-50 dark:bg-[#1a1a2e]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading API Documentation...</p>
      </div>
    </div>
  ),
});

const API_INFO = {
  title: 'ScamGuard API',
  version: '1.0.0',
  description: 'Comprehensive scam detection and prevention API',
};

export default function ApiDocsClient() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setDarkMode(false);
    }
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-100 dark:bg-[#1a1a2e] transition-colors">
        <header className="sticky top-0 z-50 h-16 bg-white/90 dark:bg-[#16213e]/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between h-full px-6 max-w-[1800px] mx-auto">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay l?i</span>
              </a>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">{API_INFO.title}</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{API_INFO.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-500/30">
                v{API_INFO.version}
              </span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-[1800px] mx-auto p-4">
          <SwaggerUI
            url="/api-docs.yaml"
            persistAuthorization
            tryItOutEnabled
            docExpansion="list"
            filter=""
            showExtensions
            showCommonExtensions
            supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch', 'options', 'head']}
          />
        </div>
      </div>
    </div>
  );
}
