
import React, { useState, useEffect, useCallback } from 'react';
import { GameItem, GameState } from './types';
import { ALPHABET_ITEMS } from './constants';
import { GameCard } from './components/GameCard';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<GameItem[]>([]);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const [stars, setStars] = useState(0);

  const currentItem = ALPHABET_ITEMS[currentIndex];

  const generateOptions = useCallback((target: GameItem) => {
    const others = ALPHABET_ITEMS.filter(item => item.letter !== target.letter);
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
    const selection = [target, shuffledOthers[0], shuffledOthers[1], shuffledOthers[2]];
    return selection.sort(() => 0.5 - Math.random());
  }, []);

  const startLevel = useCallback(async (index: number) => {
    const item = ALPHABET_ITEMS[index];
    setOptions(generateOptions(item));
    setIsCorrecting(false);
    setShowWrongFeedback(false);
    setShowCorrectFeedback(false);
  }, [generateOptions]);

  const handleStart = () => {
    setGameState(GameState.PLAYING);
    setCurrentIndex(0);
    setStars(0);
    startLevel(0);
  };

  const handleChoice = async (item: GameItem) => {
    if (isCorrecting || showWrongFeedback || showCorrectFeedback) return;

    if (item.letter === currentItem.letter) {
      setIsCorrecting(true);
      setShowCorrectFeedback(true);
      setShowWrongFeedback(false);
      setStars(prev => prev + 1);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6347', '#4682B4', '#32CD32']
      });

      // Snappy automatic transition
      setTimeout(() => {
        if (currentIndex < ALPHABET_ITEMS.length - 1) {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          startLevel(nextIdx);
        } else {
          setGameState(GameState.CELEBRATION);
        }
      }, 1500); 
    } else {
      setShowWrongFeedback(true);
      
      setTimeout(() => {
        setShowWrongFeedback(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Visual Feedback Overlays */}
      {showWrongFeedback && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className="bg-orange-500 text-white font-title text-4xl md:text-6xl px-12 py-6 rounded-full shadow-2xl border-8 border-white flex items-center gap-4">
            Try Again! 🌈
          </div>
        </div>
      )}

      {showCorrectFeedback && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-pulse pointer-events-none">
          <div className="bg-green-500 text-white font-title text-4xl md:text-6xl px-12 py-6 rounded-full shadow-2xl border-8 border-white flex items-center gap-4">
            Correct! ✨
          </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="fixed top-10 left-10 text-4xl opacity-20 animate-float">🎈</div>
      <div className="fixed bottom-10 right-10 text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>🎨</div>
      <div className="fixed top-1/2 right-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>🧸</div>

      <header className="fixed top-4 left-0 right-0 px-8 flex justify-between items-center z-10">
        <div className="font-title text-4xl text-blue-600 drop-shadow-sm select-none">
          ABC <span className="text-pink-500">FUN</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
            <span className="text-2xl">⭐</span>
            <span className="text-2xl font-bold text-yellow-600">{stars}</span>
          </div>
          {gameState === GameState.PLAYING && (
            <div className="mt-2 text-blue-400 font-bold text-xs uppercase tracking-tighter">
              Progress: {currentIndex + 1} / 26
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {gameState === GameState.START && (
          <div className="text-center p-12 bg-white rounded-[3rem] shadow-2xl border-8 border-blue-200">
            <h1 className="font-title text-6xl md:text-8xl text-blue-600 mb-8 animate-bounce">
              Ready to Play?
            </h1>
            <div className="text-9xl mb-12 animate-float">🍎 ⚽ 🐱</div>
            <button
              onClick={handleStart}
              className="bg-green-500 hover:bg-green-600 text-white font-title text-4xl px-16 py-8 rounded-full shadow-[0_10px_0_rgb(22,163,74)] active:translate-y-2 active:shadow-none transition-all"
            >
              START!
            </button>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <div className="flex flex-col items-center w-full">
            <div className="mb-12 text-center">
              <h2 className="text-4xl md:text-6xl font-title text-blue-800 mb-4 px-4 leading-tight">
                Find the object that starts with the letter <span className="text-6xl md:text-8xl text-pink-500 inline-block transform hover:scale-110 transition-transform">{currentItem.letter}</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {options.map((item, idx) => (
                <GameCard
                  key={`${item.letter}-${idx}`}
                  item={item}
                  onClick={() => handleChoice(item)}
                  disabled={isCorrecting || showCorrectFeedback}
                />
              ))}
            </div>
          </div>
        )}

        {gameState === GameState.CELEBRATION && (
          <div className="text-center p-12 bg-white rounded-[3rem] shadow-2xl border-8 border-yellow-300">
            <h1 className="font-title text-6xl md:text-8xl text-orange-500 mb-8 animate-pulse">
              Hooray!
            </h1>
            <p className="text-3xl font-bold text-blue-600 mb-12">
              You found all the letters!
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-4xl mb-12 max-w-lg">
              {ALPHABET_ITEMS.slice(0, 10).map(i => <span key={i.letter}>{i.emoji}</span>)}
              <span>...</span>
              {ALPHABET_ITEMS.slice(-10).map(i => <span key={i.letter}>{i.emoji}</span>)}
            </div>
            <button
              onClick={handleStart}
              className="bg-blue-500 hover:bg-blue-600 text-white font-title text-4xl px-16 py-8 rounded-full shadow-[0_10px_0_rgb(37,99,235)] active:translate-y-2 active:shadow-none transition-all"
            >
              PLAY AGAIN!
            </button>
          </div>
        )}
      </main>

      <footer className="fixed bottom-4 text-blue-300 font-bold text-sm tracking-wider uppercase">
        Learning the Alphabet is Fun!
      </footer>
    </div>
  );
};

export default App;
