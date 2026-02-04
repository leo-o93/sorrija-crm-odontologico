import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const teethOptions = [
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
  51, 52, 53, 54, 55,
  61, 62, 63, 64, 65,
  71, 72, 73, 74, 75,
  81, 82, 83, 84, 85,
];

interface TeethMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function TeethMultiSelect({ value, onChange }: TeethMultiSelectProps) {
  const toggleTooth = (tooth: number) => {
    const toothValue = String(tooth);
    if (value.includes(toothValue)) {
      onChange(value.filter((item) => item !== toothValue));
    } else {
      onChange([...value, toothValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {teethOptions.map((tooth) => {
        const isActive = value.includes(String(tooth));
        return (
          <Button
            key={tooth}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn("h-7 px-2 text-xs", isActive && "bg-primary text-primary-foreground")}
            onClick={() => toggleTooth(tooth)}
          >
            {tooth}
          </Button>
        );
      })}
    </div>
  );
}
