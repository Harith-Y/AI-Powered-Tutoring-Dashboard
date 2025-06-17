import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/mentor');
  };

  return (
    <button
      onClick={handleClick}
      className="fab group"
      title="Open AI Mentor"
    >
      <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
    </button>
  );
};

export default FloatingActionButton;