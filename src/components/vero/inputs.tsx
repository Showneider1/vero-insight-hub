import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}

export function LongText({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 5,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea
        rows={rows}
        value={value ?? ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="resize-y bg-card"
      />
    </Field>
  );
}

export type RepeaterColumn = {
  key: string;
  label: string;
  placeholder?: string;
  options?: string[];
  width?: string;
};

export function Repeater({
  label,
  hint,
  columns,
  rows,
  onChange,
  disabled,
  addLabel = "Adicionar linha",
  max,
}: {
  label: string;
  hint?: string;
  columns: RepeaterColumn[];
  rows: Record<string, string>[];
  onChange: (rows: Record<string, string>[]) => void;
  disabled?: boolean;
  addLabel?: string;
  max?: number;
}) {
  const list = Array.isArray(rows) ? rows : [];

  const update = (index: number, key: string, value: string) => {
    const next = list.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    onChange(next);
  };

  return (
    <Field label={label} hint={hint}>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/60">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.label}
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Nenhum registro adicionado ainda.
                  </td>
                </tr>
              ) : (
                list.map((row, index) => (
                  <tr key={index} className="border-t border-border">
                    {columns.map((column) => (
                      <td key={column.key} className="p-1.5 align-top">
                        {column.options ? (
                          <select
                            disabled={disabled}
                            value={row[column.key] ?? ""}
                            onChange={(event) => update(index, column.key, event.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
                          >
                            <option value="">Selecione…</option>
                            {column.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            disabled={disabled}
                            value={row[column.key] ?? ""}
                            placeholder={column.placeholder}
                            onChange={(event) => update(index, column.key, event.target.value)}
                            className="h-9 bg-card"
                          />
                        )}
                      </td>
                    ))}
                    <td className="p-1.5 text-right align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        aria-label="Remover linha"
                        onClick={() => onChange(list.filter((_, i) => i !== index))}
                        className="size-9 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || (max !== undefined && list.length >= max)}
        onClick={() => onChange([...list, Object.fromEntries(columns.map((c) => [c.key, ""]))])}
      >
        <Plus className="mr-1.5 size-4" />
        {addLabel}
      </Button>
    </Field>
  );
}

export function BlockPicker({
  label,
  hint,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => toggle(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-card"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-accent/40 p-3">
          {selected.map((block, index) => (
            <span key={block} className="flex items-center gap-2">
              <span className="rounded-md bg-card px-2.5 py-1 text-xs font-semibold shadow-card">{block}</span>
              {index < selected.length - 1 ? <span className="text-primary">→</span> : null}
            </span>
          ))}
        </div>
      ) : null}
    </Field>
  );
}
