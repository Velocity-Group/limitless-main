import { Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';

interface IProps {
  onEmojiClick: Function;
  siteName?: string;
}

export const Emotions = ({ onEmojiClick, siteName }: IProps) => (
  <Picker
    onClick={(emoji) => onEmojiClick(emoji.native)}
    emoji="point_up"
    set="twitter"
    title={siteName || ''}
    color="#00aff0"
  />
);

Emotions.defaultProps = {
  siteName: ''
};
