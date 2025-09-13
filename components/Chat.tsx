
import React, { useState, useRef, useEffect } from 'react';
import { WordExplanation } from '../types';
import { getWordExplanation, getFollowUpAnswer } from '../services/geminiService';

// Redesigned WordCard
const WordCard: React.FC<{ explanation: WordExplanation; index: number; showNumber: boolean }> = ({ explanation, index, showNumber }) => {
  return (
    <div className="flex items-start space-x-4 mb-6 animate-fade-in">
      {/* Number on the left */}
      {showNumber && (
        <div className="flex-shrink-0 bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold mt-2">
          {index + 1}
        </div>
      )}

      {/* The actual card content */}
      <div className="flex-grow bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 w-full">
        {/* Header - left aligned, word bigger */}
        <div className="text-left mb-5 border-b border-gray-200 dark:border-gray-700 pb-4">
          <p className="text-lg text-gray-500 dark:text-gray-400" aria-label="読み方">
            {explanation.reading.replace(/[()（）]/g, '')}
          </p>
          <h2 className="text-7xl font-bold text-gray-800 dark:text-gray-100 my-1" lang="ja">
            {explanation.word}
          </h2>
        </div>
        
        {/* Body - no titles, brief meaning bigger */}
        <div className="space-y-5">
          <div>
            <p className="text-3xl text-gray-700 dark:text-gray-200">{explanation.briefMeaning.replace(/[()（）]/g, '')}</p>
          </div>
          <hr className="border-gray-200 dark:border-gray-700"/>
          <div>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {explanation.detailedExplanation.replace(/[()（）]/g, '')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading indicator to be displayed centrally
const LoadingIndicator: React.FC = () => (
    <div className="flex justify-center items-center p-10">
        <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
    </div>
);

// Search input component
const SearchInput: React.FC<{ onSearch: (text: string) => void; isLoading: boolean }> = ({ onSearch, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSearch(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 w-full flex-shrink-0">
      <div className="relative">
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="調べたい言葉を入力..."
          disabled={isLoading}
          className="w-full px-5 py-4 pr-16 text-lg text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          aria-label="Search for a Japanese word"
        />
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition duration-200"
          aria-label="Search"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          )}
        </button>
      </div>
    </form>
  );
};

// Main Dictionary component
const Chat: React.FC = () => {
  const [results, setResults] = useState<WordExplanation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [searchedWord, setSearchedWord] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (text: string) => {
    setShowWelcome(false);
    setIsLoading(true);
    setResults([]);
    setChatHistory([]); // Reset chat history
    setSearchedWord(null); // Reset searched word
    
    const explanations = await getWordExplanation(text);
    
    setResults(explanations);
    if (explanations.length > 0 && explanations[0].reading !== 'エラー') {
      setSearchedWord(text);
    }
    setIsLoading(false);
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isChatLoading || !searchedWord) return;

    const userMessage = followUpText.trim();
    setFollowUpText('');

    const newHistory = [...chatHistory, { role: 'user' as const, content: userMessage }];
    setChatHistory(newHistory);
    
    setIsChatLoading(true);

    const answer = await getFollowUpAnswer(searchedWord, newHistory);

    setChatHistory(prev => [...prev, { role: 'model' as const, content: answer }]);
    setIsChatLoading(false);
  };
  
  // Scroll to results when they appear
  useEffect(() => {
    if (!isLoading && results.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading, results]);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SearchInput onSearch={handleSearch} isLoading={isLoading} />
      <div className="flex-grow overflow-y-auto p-4 md:p-6">
        <div ref={resultsRef} />
        {isLoading && <LoadingIndicator />}
        {!isLoading && results.length > 0 && (
          <div className="mb-8">
            {results.map((exp, index) => (
              <WordCard key={`${exp.word}-${index}`} explanation={exp} index={index} showNumber={results.length > 1} />
            ))}
          </div>
        )}
        
        {/* --- FOLLOW-UP CHAT SECTION --- */}
        {!isLoading && searchedWord && (
          <div className="animate-fade-in mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300 mb-4">もっと質問する</h3>
            <div className="space-y-4">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-prose p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                    <p className="text-base whitespace-pre-wrap">{msg.content.replace(/[()（）]/g, '')}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                   <div className="max-w-prose p-3 rounded-xl bg-gray-200 dark:bg-gray-700">
                      <div className="flex items-center justify-center space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                      </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleFollowUpSubmit} className="mt-6">
              <div className="relative">
                <input
                  type="text"
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  placeholder="例文、類義語など..."
                  disabled={isChatLoading}
                  className="w-full px-4 py-3 pr-14 text-base text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  aria-label="Ask a follow-up question"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !followUpText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition duration-200"
                  aria-label="Send"
                >
                  {isChatLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {showWelcome && !isLoading && (
            <div className="text-center text-gray-500 dark:text-gray-400 pt-16 px-4 flex flex-col items-center animate-fade-in">
                <span className="text-6xl mb-4" role="img" aria-label="Book emoji">📖</span>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">やさしい日本語辞書</h2>
                <p className="mt-2">意味を知りたい日本語の単語を上に入力してください。</p>
            </div>
        )}
        {!isLoading && !showWelcome && results.length === 0 && (
           <div className="text-center text-gray-500 dark:text-gray-400 pt-16 px-4 flex flex-col items-center animate-fade-in">
               <span className="text-6xl mb-4" role="img" aria-label="Thinking face emoji">🤔</span>
               <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">見つかりませんでした</h2>
               <p className="mt-2">別の言葉で試してみてください。</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Chat;