
import React from 'react';
import { GameItem } from '../types';

interface GameCardProps {
  item: GameItem;
  onClick: () => void;
  disabled?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ item, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group flex flex-col items-center justify-center
        aspect-square p-6 rounded-3xl transition-all duration-300
        ${item.color} shadow-xl hover:scale-105 active:scale-95
        disabled:opacity-80
      `}
    >
      <div className="text-8xl md:text-9xl mb-4 group-hover:scale-110 transition-transform">
        {item.emoji}
      </div>
      <div className="bg-white px-4 py-1 rounded-full text-xl font-bold text-gray-800 shadow-sm uppercase tracking-widest">
        {item.name}
      </div>
    </button>
  );
};
