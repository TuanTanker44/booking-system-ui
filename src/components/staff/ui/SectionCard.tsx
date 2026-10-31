import type { ReactNode } from "react";

type Props = {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function SectionCard({
  title,
  icon,
  action,
  className = "",
  children,
}: Props) {
  return (
    <section className={`staff-card ${className}`}>
      <div className="staff-card__header">
        <h2>{icon && <span className="staff-card__icon">{icon}</span>}{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
