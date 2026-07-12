"use client";

import { Checkbox } from "@repo/web-core/components/checkbox";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";

interface SettingFieldProps {
  label: string;
  value: string | boolean | number | null;
  onChange: (val: string | boolean) => void;
}

/** Presentational single object-setting field (boolean checkbox or text input). */
export function SettingField({ label, value, onChange }: SettingFieldProps) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={value} onChange={() => onChange(!value)} />
        <span className="text-sm">{label}</span>
      </label>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground font-mono">
        {label}
      </Label>
      <Input
        value={
          typeof value === "string" ? value : value == null ? "" : String(value)
        }
        onChange={(e) => onChange(e.target.value)}
        placeholder={value === null ? "null" : `Value for ${label}`}
      />
    </div>
  );
}
