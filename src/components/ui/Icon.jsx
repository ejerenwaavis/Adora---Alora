export default function Icon({ name, size = 24, className = '', ...props }) {
  return (
    <svg 
      className={`icon ${className}`} 
      width={size} 
      height={size} 
      fill="currentColor"
      {...props}
    >
      <use href={`/assets/icon-sprite.svg#icon-${name}`} />
    </svg>
  );
}
