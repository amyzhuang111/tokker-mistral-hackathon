"use client";

const defaultChips = [
  "Unboxing & first impressions",
  "Day-in-my-life integration",
  "Before & after transformation",
  "Tutorial / how-to",
  "Honest review with pros & cons",
  "Challenge or trend mashup",
];

interface PromptChipsProps {
  onSelect: (chip: string) => void;
  chips?: string[];
}

export default function PromptChips({
  onSelect,
  chips = defaultChips,
}: PromptChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelect(chip)}
          className="rounded-full border border-white/[0.06] bg-surface-2 px-3 py-1.5 text-xs text-white/70 transition hover:border-brand/30 hover:text-white active:scale-95"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
