"use client";

import { useRouter } from "next/navigation";
import { inputCls } from "@/components/ui/form";
import { DIFFICULTY_LABELS } from "@/lib/sat-qbank";

type Option = { value: string; label: string };

/** The bank's filters. Each change reloads the list from the address, so a filtered view can be kept. */
export default function BankFilters({ section, domains, skills, value }: {
  section: string;
  domains: Option[];
  skills: Option[];
  value: { domain: string; skill: string; difficulty: string; status: string };
}) {
  const router = useRouter();

  const go = (patch: Partial<typeof value>) => {
    const next = { ...value, ...patch };
    // A skill belongs to one domain: changing the domain lets go of it.
    if (patch.domain !== undefined && patch.domain !== value.domain) next.skill = "";
    const q = new URLSearchParams({ section, ...next });
    for (const [k, v] of [...q.entries()]) if (!v) q.delete(k);
    router.push(`/sat?${q.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Select label="Domain" value={value.domain} onChange={(domain) => go({ domain })}
        options={[{ value: "", label: "All domains" }, ...domains]} />
      <Select label="Skill" value={value.skill} onChange={(skill) => go({ skill })}
        options={[{ value: "", label: "All skills" }, ...skills]} />
      <Select label="Difficulty" value={value.difficulty} onChange={(difficulty) => go({ difficulty })}
        options={[{ value: "", label: "Any difficulty" }, ...Object.entries(DIFFICULTY_LABELS).map(([v, l]) => ({ value: v, label: l }))]} />
      <Select label="Status" value={value.status} onChange={(status) => go({ status })}
        options={[
          { value: "", label: "Any status" },
          { value: "new", label: "Not tried" },
          { value: "incorrect", label: "Wrong last time" },
          { value: "correct", label: "Right last time" },
        ]} />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
