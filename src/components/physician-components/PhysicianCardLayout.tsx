import React from "react";

interface PhysicianCardLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  sidebar: React.ReactNode;
  overlay: React.ReactNode;
  toasts: React.ReactNode;
}

export const PhysicianCardLayout = React.memo<PhysicianCardLayoutProps>(({
  children,
  header,
  sidebar,
  overlay,
  toasts,
}) => (
  <>
    {header}
    {children}
    {overlay}
    {sidebar}
    {toasts}
  </>
));