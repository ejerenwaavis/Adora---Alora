import { Link } from 'react-router-dom';

export default function Button({ 
  to, 
  href, 
  children, 
  variant = 'primary', // primary, outline, ghost, gold
  arrow = false, 
  className = '', 
  ...props 
}) {
  const btnClass = `btn btn-${variant} ${className}`;
  
  const content = (
    <>
      {children}
      {arrow && <span className="btn-arrow">→</span>}
    </>
  );

  if (to) {
    return <Link to={to} className={btnClass} {...props}>{content}</Link>;
  }
  
  if (href) {
    return <a href={href} className={btnClass} {...props}>{content}</a>;
  }

  return <button className={btnClass} {...props}>{content}</button>;
}
