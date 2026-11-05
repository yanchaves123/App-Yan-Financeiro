// Minimal declarations for the renderer API used by this isolated regression suite.
declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';
  export interface ReactTestRenderer {
    root: any;
    update(element: ReactElement): void;
    unmount(): void;
  }
  export function create(element: ReactElement): ReactTestRenderer;
  export function act(callback: () => void): void;
}
