import React, { useState, useEffect, useRef } from 'react';
import { Upload, Settings, Maximize, Minimize, Trophy, RotateCcw } from 'lucide-react';

import closed from './assets/img/closed.png';
import discount from './assets/img/discount.png';
import open from './assets/img/open.png';
import placeholder from './assets/img/placeholder.png';
import sale from './assets/img/sale.png';
import shoes from './assets/img/shoes.png';
import shoppingBasket from './assets/img/shopping-basket.png';
import shoppingCart from './assets/img/shopping-cart.png';

interface GameState {
  moves: number;
  matches: number;
  cards: CardData[];
  flippedCards: number[];
  lockBoard: boolean;
  gameCompleted: boolean;
  showCelebration: boolean;
}

interface CardData {
  id: number;
  imageUrl: string;
  isMatched: boolean;
}

interface GameSettings {
  maxMoves: number;
  customImages: string[];
  logoUrl: string;
  cardBackLogoUrl: string;
  gameTitle: string;
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    moves: 0,
    matches: 0,
    cards: [],
    flippedCards: [],
    lockBoard: false,
    gameCompleted: false,
    showCelebration: false
  });

  const [settings, setSettings] = useState<GameSettings>({
    maxMoves: 50,
    customImages: [],
    logoUrl: '',
    cardBackLogoUrl: '',
    gameTitle: 'Memory Match'
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [tempSettings, setTempSettings] = useState<GameSettings>(settings);
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const cardImagesRef = useRef<HTMLInputElement>(null);
  const logoImageRef = useRef<HTMLInputElement>(null);
  const cardBackLogoRef = useRef<HTMLInputElement>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default fallback images
  const defaultImages = [
    closed,
    discount,
    open,
    placeholder,
    sale,
    shoes,
    shoppingBasket,
    shoppingCart,
  ];

  // Initialize game board
  const initializeGame = () => {
    const gridSize = 4; // Fixed at 4x4
    const totalPairs = (gridSize * gridSize) / 2;
    const imagesToUse = settings.customImages.length >= totalPairs 
      ? settings.customImages.slice(0, totalPairs)
      : defaultImages.slice(0, totalPairs);

    const cardPairs = [...imagesToUse, ...imagesToUse];
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((imageUrl, index) => ({
        id: index,
        imageUrl,
        isMatched: false
      }));

    setGameState({
      moves: 0,
      matches: 0,
      cards: shuffledCards,
      flippedCards: [],
      lockBoard: false,
      gameCompleted: false,
      showCelebration: false
    });
  };

  // Handle card flip
  const handleCardFlip = (cardId: number) => {
    if (
      gameState.lockBoard || 
      gameState.flippedCards.includes(cardId) || 
      gameState.cards[cardId].isMatched ||
      gameState.flippedCards.length >= 2 ||
      (settings.maxMoves > 0 && gameState.moves >= settings.maxMoves)
    ) {
      return;
    }

    const newFlippedCards = [...gameState.flippedCards, cardId];
    const newMoves = gameState.moves + 1;

    setGameState(prev => ({
      ...prev,
      flippedCards: newFlippedCards,
      moves: newMoves
    }));

    if (newFlippedCards.length === 2) {
      setGameState(prev => ({ ...prev, lockBoard: true }));
      
      setTimeout(() => {
        checkForMatch(newFlippedCards);
      }, 1000);
    }
  };

  // Check for card match
  const checkForMatch = (flippedCardIds: number[]) => {
    const [card1Id, card2Id] = flippedCardIds;
    const card1 = gameState.cards[card1Id];
    const card2 = gameState.cards[card2Id];

    if (card1.imageUrl === card2.imageUrl) {
      const newCards = gameState.cards.map(card => 
        card.id === card1Id || card.id === card2Id 
          ? { ...card, isMatched: true }
          : card
      );
      
      const newMatches = gameState.matches + 1;
      const totalPairs = (settings.gridSize * settings.gridSize) / 2;
      
      setGameState(prev => ({
        ...prev,
        cards: newCards,
        matches: newMatches,
        flippedCards: [],
        lockBoard: false,
        gameCompleted: newMatches === totalPairs,
        showCelebration: newMatches === totalPairs
      }));

      if (newMatches === totalPairs) {
        setTimeout(() => {
          triggerConfetti();
          startAutoReset();
        }, 500);
      }
    } else {
      setGameState(prev => ({
        ...prev,
        flippedCards: [],
        lockBoard: false
      }));
    }
  };

  // Trigger confetti animation
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Create confetti burst
      (window as any).confetti({
        particleCount,
        startVelocity: randomInRange(30, 40),
        spread: randomInRange(50, 70),
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        }
      });
    }, 250);
  };

  // Start auto-reset timer
  const startAutoReset = () => {
    resetTimeoutRef.current = setTimeout(() => {
      initializeGame();
    }, 10000);
  };

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    const container = gameContainerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen not supported:', error);
    }
  };

  // Handle file upload for card images
  const handleCardImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageUrls: string[] = [];
    Array.from(files).forEach(file => {
      imageUrls.push(URL.createObjectURL(file));
    });

    setTempSettings(prev => ({
      ...prev,
      customImages: imageUrls
    }));
  };

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const logoUrl = URL.createObjectURL(file);
    setTempSettings(prev => ({
      ...prev,
      logoUrl
    }));
  };

  // Handle card back logo upload
  const handleCardBackLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const cardBackLogoUrl = URL.createObjectURL(file);
    setTempSettings(prev => ({
      ...prev,
      cardBackLogoUrl
    }));
  };

  // Save admin settings
  const saveAdminSettings = () => {
    setSettings(tempSettings);
    setShowAdmin(false);
  };

  // Reset game manually
  const resetGame = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    initializeGame();
  };

  // Initialize game on mount and when settings change
  useEffect(() => {
    initializeGame();
  }, [settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      settings.customImages.forEach(url => URL.revokeObjectURL(url));
      if (settings.logoUrl) URL.revokeObjectURL(settings.logoUrl);
      if (settings.cardBackLogoUrl) URL.revokeObjectURL(settings.cardBackLogoUrl);
    };
  }, []);

  const gridSize = 4; // Fixed at 4x4
  const totalPairs = (gridSize * gridSize) / 2;

  return (
    <div 
      ref={gameContainerRef}
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white font-sans transition-all duration-300 ${
        isFullscreen ? 'p-8' : 'p-4'
      }`}
    >
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* Logo Area */}
        {settings.logoUrl && (
          <div className="mb-6">
            <img 
              src={settings.logoUrl} 
              alt="Game Logo" 
             className="h-40 w-auto object-contain max-w-md"
            />
          </div>
        )}

        {/* Game Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {settings.gameTitle}
        </h1>

        {/* Game Stats */}
        <div className="flex space-x-6 mb-6 text-lg">
          <div className="bg-gray-800/50 px-4 py-2 rounded-lg backdrop-blur-sm">
            Moves: <span className="font-bold text-indigo-400">{gameState.moves}</span>
            {settings.maxMoves > 0 && <span className="text-gray-400">/{settings.maxMoves}</span>}
          </div>
          <div className="bg-gray-800/50 px-4 py-2 rounded-lg backdrop-blur-sm">
            Matches: <span className="font-bold text-purple-400">{gameState.matches}/{totalPairs}</span>
          </div>
        </div>

        {/* Game Board */}
        <div 
          className={`grid gap-3 mb-8 max-w-2xl w-full`}
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            perspective: '1000px'
          }}
        >
          {gameState.cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardFlip(card.id)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 cursor-pointer transition-all duration-700 transform-gpu ${
                gameState.flippedCards.includes(card.id) || card.isMatched 
                  ? 'flipped' 
                  : 'hover:scale-105'
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Card Back */}
              <div className="card-face card-back absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg flex items-center justify-center border-2 border-indigo-400/30">
                {settings.cardBackLogoUrl ? (
                  <img 
                    src={settings.cardBackLogoUrl} 
                    alt="Card Back Logo" 
                    className="w-32 h-32 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 border-2 border-white/50 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white/30 rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Card Front */}
              <div 
                className="card-face card-front absolute inset-0 w-full h-full bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden"
              >
                <img 
                  src={card.imageUrl} 
                  alt="Card" 
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load:', card.imageUrl);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA2NUw1MCA0NUw2NSA2NUgzNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iNSIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Game Controls */}
        {!isFullscreen && (
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={toggleFullscreen}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all hover:scale-105 flex items-center space-x-2"
            >
              <Maximize className="w-5 h-5" />
              <span>Fullscreen</span>
            </button>

            <button
              onClick={() => setShowAdmin(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all hover:scale-105 flex items-center space-x-2"
            >
              <Settings className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>

            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all hover:scale-105 flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 bg-gray-800/80 hover:bg-gray-700/80 text-white p-3 rounded-lg backdrop-blur-sm transition-all"
          >
            <Minimize className="w-6 h-6" />
          </button>
        )}

        {/* Game Completion Message */}
        {gameState.gameCompleted && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-r from-purple-800 to-pink-800 p-8 rounded-2xl text-center max-w-md mx-4 shadow-2xl">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">🎉 Congratulations! 🎉</h2>
              <p className="text-lg mb-4">
                You completed the game in <span className="font-bold text-indigo-300">{gameState.moves}</span> moves!
              </p>
              <p className="text-sm text-gray-300">
                Game will restart automatically in 10 seconds...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Panel */}
      {showAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-indigo-400 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Admin Panel
            </h2>

            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Banner</label>
              <input
                ref={logoImageRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full text-sm bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
              {tempSettings.logoUrl && (
                <div className="mt-2">
                  <img src={tempSettings.logoUrl} alt="Banner preview" className="h-16 w-auto" />
                </div>
              )}
            </div>

            {/* Card Back Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Card Back Logo</label>
              <input
                ref={cardBackLogoRef}
                type="file"
                accept="image/*"
                onChange={handleCardBackLogoUpload}
                className="w-full text-sm bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
              {tempSettings.cardBackLogoUrl && (
                <div className="mt-2">
                  <img src={tempSettings.cardBackLogoUrl} alt="Card back logo preview" className="h-12 w-auto" />
                </div>
              )}
            </div>

            {/* Card Images Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Card Images</label>
              <input
                ref={cardImagesRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleCardImagesUpload}
                className="w-full text-sm bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload at least {totalPairs} images for 4x4 grid
              </p>
              {tempSettings.customImages.length > 0 && (
                <div className="mt-2 text-sm text-green-400">
                  {tempSettings.customImages.length} images uploaded
                </div>
              )}
            </div>

            {/* Game Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Game Title</label>
              <input
                type="text"
                value={tempSettings.gameTitle}
                onChange={(e) => setTempSettings(prev => ({ ...prev, gameTitle: e.target.value }))}
                className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
                placeholder="Enter game title"
              />
            </div>

            {/* Max Moves */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Max Moves (0 = unlimited)</label>
              <input
                type="number"
                min="0"
                value={tempSettings.maxMoves}
                onChange={(e) => setTempSettings(prev => ({ ...prev, maxMoves: parseInt(e.target.value) || 0 }))}
                className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Admin Controls */}
            <div className="flex space-x-4">
              <button
                onClick={saveAdminSettings}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                Save Settings
              </button>
              <button
                onClick={() => {
                  setShowAdmin(false);
                  setTempSettings(settings);
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;