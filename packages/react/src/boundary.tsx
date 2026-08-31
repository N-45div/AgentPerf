/**
 * Scopes the agent surface the way a component tree scopes the human one.
 * State keys inside a boundary are prefixed `name.key`; action names are
 * prefixed `name_action`. Boundaries nest.
 */
import { createContext, useContext, type ReactNode } from "react";

export const BoundaryContext = createContext<string | null>(null);

export function scopedKey(scope: string | null, key: string, separator: "." | "_"): string {
  return scope ? `${scope}${separator}${key}` : key;
}

export interface AgentBoundaryProps {
  name: string;
  children: ReactNode;
}

export function AgentBoundary({ name, children }: AgentBoundaryProps) {
  const parent = useContext(BoundaryContext);
  const scope = parent ? `${parent}.${name}` : name;
  return <BoundaryContext.Provider value={scope}>{children}</BoundaryContext.Provider>;
}
