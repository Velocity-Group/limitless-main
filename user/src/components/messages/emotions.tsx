import { useSelector } from 'react-redux';
import Picker from '@emoji-mart/react';

interface IProps {
  onEmojiClick: Function;
}

export const Emotions = ({ onEmojiClick }: IProps) => {
  const { theme } = useSelector((state: any) => state.ui);
  return (
    <Picker
      data={async () => {
        const response = await fetch(
          'https://cdn.jsdelivr.net/npm/@emoji-mart/data'
        );
        return response.json();
      }}
      onEmojiSelect={(e) => onEmojiClick(e.native)}
      theme={theme === 'sync' ? 'auto' : theme}
    />
  );
};

export default Emotions;
