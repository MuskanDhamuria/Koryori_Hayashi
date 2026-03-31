import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
  group?: string;
};

export function MarketingMultiSelect(props: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => new Set(props.value), [props.value]);

  const grouped = useMemo(() => {
    const groups = new Map<string, MultiSelectOption[]>();
    for (const option of props.options) {
      const key = option.group ?? "Tags";
      const existing = groups.get(key) ?? [];
      existing.push(option);
      groups.set(key, existing);
    }
    return Array.from(groups.entries()).map(([group, options]) => ({ group, options }));
  }, [props.options]);

  const selectedLabels = useMemo(() => {
    const labelByValue = new Map(props.options.map((o) => [o.value, o.label] as const));
    return props.value.map((value) => labelByValue.get(value) ?? value);
  }, [props.options, props.value]);

  function toggleValue(value: string) {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    props.onChange(Array.from(next.values()).sort((a, b) => a.localeCompare(b)));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={props.disabled}
          className="w-full justify-between bg-slate-950/30 border-slate-700 text-slate-200"
        >
          <div className="flex items-center gap-2 min-w-0">
            {props.value.length === 0 ? (
              <span className="text-slate-400">{props.placeholder ?? "Select tags..."}</span>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                {selectedLabels.slice(0, 2).map((label) => (
                  <Badge key={label} variant="secondary" className="truncate max-w-[220px]">
                    {label}
                  </Badge>
                ))}
                {selectedLabels.length > 2 ? (
                  <Badge variant="secondary">+{selectedLabels.length - 2}</Badge>
                ) : null}
              </div>
            )}
          </div>
          <ChevronsUpDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[420px] max-w-[90vw] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            {grouped.map(({ group, options }) => (
              <CommandGroup key={group} heading={group}>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => toggleValue(option.value)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox className="pointer-events-none" checked={selected.has(option.value)} />
                    <span className="truncate">{option.label}</span>
                    <Check className={cn("ml-auto size-4 opacity-0", selected.has(option.value) && "opacity-100")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
