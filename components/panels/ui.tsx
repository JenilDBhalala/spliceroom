import type { ReactNode } from "react";

export const HIGHLIGHT_TIP = "Wrap words in *stars* to color them with your accent.";

export function PanelHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2.5">
      <h2 className="m-0 font-display text-2xl leading-[1.1] tracking-[.02em] text-balance uppercase">{title}</h2>
      {children}
    </div>
  );
}

export function SlideCount({ sel, total }: { sel: number; total: number }) {
  return <small className="text-muted tabular-nums">{`Slide ${sel + 1} of ${total}`}</small>;
}

export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5 border-t border-line pt-4">
      {title && <h3 className="m-0 text-[11px] font-bold tracking-[.12em] text-muted uppercase">{title}</h3>}
      {children}
    </div>
  );
}

export const Row = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap gap-2.5 *:flex-[1_1_90px]">{children}</div>;

export const Note = ({ children }: { children: ReactNode }) => <p className="m-0 text-[12.5px] text-muted">{children}</p>;

/** Move earlier / later / delete buttons for list movies and news stories. */
export function OrderButtons({
  index, count, what, onMove, onDelete,
}: {
  index: number;
  count: number;
  what: string;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <Row>
      <button type="button" className="btn btn-small" disabled={index === 0} onClick={() => onMove(-1)}>
        ← Move earlier
      </button>
      <button type="button" className="btn btn-small" disabled={index === count - 1} onClick={() => onMove(1)}>
        Move later →
      </button>
      <button type="button" className="btn btn-small btn-danger" disabled={count <= 1} onClick={onDelete}>
        {`Delete ${what}`}
      </button>
    </Row>
  );
}
