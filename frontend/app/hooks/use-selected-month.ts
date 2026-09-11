import { useSearchParams } from "react-router";
import { currentMonth, parseMonthParam } from "~/lib/month";

export function useSelectedMonth() {
  const [params, setParams] = useSearchParams();
  const month = parseMonthParam(params.get("month"));

  function setMonth(next: string) {
    const nextParams = new URLSearchParams(params);
    if (next === currentMonth()) {
      nextParams.delete("month");
    } else {
      nextParams.set("month", next);
    }
    setParams(nextParams, { preventScrollReset: true, replace: true });
  }

  return [month, setMonth] as const;
}
