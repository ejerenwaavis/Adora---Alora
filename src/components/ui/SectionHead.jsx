import Eyebrow from './Eyebrow.jsx';

export default function SectionHead({ num, eyebrow, title, subtitle, className = '', titleStyle, ...props }) {
  return (
    <div className={`section-head reveal ${className}`} {...props}>
      <Eyebrow num={num} text={eyebrow} centered style={{ margin: '0 auto', width: 'fit-content' }} />
      <h2 style={titleStyle}>{title}</h2>
      {subtitle && (
        <p style={{ maxWidth: '520px', margin: '16px auto 0', opacity: 0.75, fontSize: '14.5px', color: 'inherit' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
