import { ReactNode } from 'react';

type Step = 'auto' | 'status';

interface Props {
  children: ReactNode;
  sidebar?: ReactNode;
  step: Step;
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'auto', label: 'Request' },
  { id: 'status', label: 'Status' },
];

function stepIndex(step: Step): number {
  return STEPS.findIndex((s) => s.id === step);
}

export function ErpLayout({ children, sidebar, step }: Props) {
  const current = stepIndex(step);

  return (
    <div className="erp-shell">
      <header className="erp-header">
        <div className="erp-header__breadcrumb">
          <span>ERP</span>
          <span className="erp-header__sep">/</span>
          <span>Travel</span>
          <span className="erp-header__sep">/</span>
          <span className="erp-header__current">New request</span>
        </div>
        <div className="erp-header__main">
          <div>
            <span className="eyebrow">Travel</span>
            <h1 className="erp-header__title">Travel request</h1>
          </div>
          <a className="erp-header__back" href="/history">
            View history
          </a>
        </div>
        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`step-indicator__item ${
                i < current ? 'step-indicator__item--done' : i === current ? 'step-indicator__item--active' : ''
              }`}
            >
              <span className="step-indicator__dot" />
              <span className="step-indicator__label">{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div className={`erp-layout ${sidebar ? 'erp-layout--with-sidebar' : ''}`}>
        <main className="erp-main">{children}</main>
        {sidebar && <div className="erp-sidebar">{sidebar}</div>}
      </div>
    </div>
  );
}
