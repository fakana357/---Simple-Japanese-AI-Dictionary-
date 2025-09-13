
import React from 'react';
import Chat from './components/Chat';

const App: React.FC = () => {
  return (
    <div className="bg-gray-200 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col items-center justify-center font-sans p-2 sm:p-4">
      <div className="w-full max-w-3xl mx-auto flex flex-col h-[95vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <span role="img" aria-label="dictionary" className="mr-3 text-2xl sm:text-3xl">📖</span>
            やさしい日本語辞書
          </h1>
        </header>
        <Chat />
      </div>
      <footer className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
