export default function Eyebrow({ num, text, centered = false, style, className = '' }) {
  return (
    <div 
      className={`eyebrow ${centered ? 'centered' : ''} ${className}`} 
      style={style}
    >
      {num && <span className="num">{num}</span>}
      {text}
    </div>
  );
}
