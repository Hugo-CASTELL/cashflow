import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "~/components/ui/button";
import { formatMonthLabel, shiftMonth } from "~/lib/month";

export function MonthSwitcher({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="size-11 md:size-9"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
      </Button>
      <p className="min-w-0 flex-1 text-center text-base font-medium tracking-tight md:text-sm">
        {formatMonthLabel(month)}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="size-11 md:size-9"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
      </Button>
    </div>
  );
}
