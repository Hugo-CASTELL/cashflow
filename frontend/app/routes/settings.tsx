import { useEffect, useState, type ReactNode } from "react";
import { useRevalidator } from "react-router";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  BarChartHorizontalIcon,
  ChartRingIcon,
  PercentIcon,
  PieChartIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { Route } from "./+types/settings";
import { useAppData, useSettings } from "~/components/app-data";
import { NativeSelect } from "~/components/native-select";
import { Label } from "~/components/ui/label";
import { api, type UpdateSettingsInput } from "~/lib/api";
import { budgetStatus } from "~/lib/finance";
import { createMoneyFormatter, formatMoney } from "~/lib/money";
import {
  BUDGET_DISPLAY_OPTIONS,
  CHART_TYPE_OPTIONS,
  CURRENCIES,
  normalizeCurrency,
  type BudgetDisplay,
  type ChartType,
  type Settings,
} from "~/lib/settings";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings · Cashflow" },
    { name: "description", content: "Currency, budget display and chart preferences" },
  ];
}

const CHART_ICONS: Record<ChartType, IconSvgElement> = {
  donut: ChartRingIcon,
  pie: PieChartIcon,
  bar: BarChartHorizontalIcon,
};

const BUDGET_ICONS: Record<BudgetDisplay, IconSvgElement> = {
  percent: PercentIcon,
  currency: Wallet01Icon,
};

const SAMPLE_BUDGET = { spent: 320, budget: 500, ratio: 0.64 };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl p-4 ring-1 ring-foreground/10">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function OptionCard<T extends string>({
  name,
  value,
  checked,
  disabled,
  icon,
  label,
  description,
  onSelect,
}: {
  name: string;
  value: T;
  checked: boolean;
  disabled: boolean;
  icon: IconSvgElement;
  label: string;
  description: string;
  onSelect: (value: T) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 ring-foreground/10 transition-colors",
        "hover:bg-muted/70 has-focus-visible:ring-2 has-focus-visible:ring-ring",
        checked && "bg-muted ring-foreground/30",
        disabled && "cursor-progress opacity-70"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-foreground/10",
          checked && "bg-primary text-primary-foreground ring-primary"
        )}
        aria-hidden="true"
      >
        <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const { account } = useAppData();
  const settings = useSettings();
  const revalidator = useRevalidator();
  const [draft, setDraft] = useState<Settings>(settings);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  async function save(patch: Partial<Settings>, input: UpdateSettingsInput) {
    const previous = draft;
    setDraft((current) => ({ ...current, ...patch }));
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      await api.updateSettings(input);
      setStatus("Saved");
      revalidator.revalidate();
    } catch (saveError) {
      setDraft(previous);
      setError(saveError instanceof Error ? saveError.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  const money = createMoneyFormatter(draft.currency);
  const sampleStatus = budgetStatus(SAMPLE_BUDGET, draft.budgetDisplay, money);
  const knownCurrency = CURRENCIES.some((item) => item.code === draft.currency);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          {account
            ? `Preferences are saved to ${account.name} and apply on every device.`
            : "Preferences are saved to your account and apply on every device."}
        </p>
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <Section
        title="Currency"
        description="Used to display every amount, budget and total. Existing amounts are not converted."
      >
        <div className="space-y-1.5">
          <Label htmlFor="settings-currency">Currency</Label>
          <NativeSelect
            id="settings-currency"
            value={draft.currency}
            disabled={busy || !account}
            onChange={(event) => {
              const currency = normalizeCurrency(event.target.value);
              void save({ currency }, { currency });
            }}
          >
            {!knownCurrency ? (
              <option value={draft.currency}>{draft.currency}</option>
            ) : null}
            {CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} · {item.label}
              </option>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground tabular-nums">
            Example: {formatMoney(1234.5, draft.currency)}
          </p>
        </div>
      </Section>

      <Section
        title="Budget display"
        description="How category budgets are summarised on the overview and category pages."
      >
        <fieldset className="grid gap-2 sm:grid-cols-2" disabled={busy || !account}>
          <legend className="sr-only">Budget display</legend>
          {BUDGET_DISPLAY_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              name="budget-display"
              value={option.value}
              checked={draft.budgetDisplay === option.value}
              disabled={busy || !account}
              icon={BUDGET_ICONS[option.value]}
              label={option.label}
              description={option.description}
              onSelect={(budgetDisplay) =>
                void save({ budgetDisplay }, { budget_display: budgetDisplay })
              }
            />
          ))}
        </fieldset>
        <p className="text-xs text-muted-foreground tabular-nums">
          Example: {money.format(SAMPLE_BUDGET.spent)} of {money.format(SAMPLE_BUDGET.budget)}
          {sampleStatus ? ` · ${sampleStatus.label}` : ""}
        </p>
      </Section>

      <Section
        title="Overview chart"
        description="The chart shown in the centre of the overview page."
      >
        <fieldset className="grid gap-2 sm:grid-cols-3" disabled={busy || !account}>
          <legend className="sr-only">Overview chart</legend>
          {CHART_TYPE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              name="chart-type"
              value={option.value}
              checked={draft.chartType === option.value}
              disabled={busy || !account}
              icon={CHART_ICONS[option.value]}
              label={option.label}
              description={option.description}
              onSelect={(chartType) => void save({ chartType }, { chart_type: chartType })}
            />
          ))}
        </fieldset>
      </Section>
    </div>
  );
}
