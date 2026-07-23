import { ReactNode } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface Props {
  children: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
}

export function StatusBadge({ children, variant = 'default', icon }: Props) {
  return (
    <span className={`status-badge status-badge--${variant}`}>
      {icon && <span className="status-badge__icon">{icon}</span>}
      {children}
    </span>
  );
}
