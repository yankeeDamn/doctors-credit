"use client";

import { useState } from "react";

const essentials = [
  "Discuss whether treatment and travel are appropriate with my treating clinician.",
  "Verify the exact hospital branch, department, specialist credentials and accreditation scope.",
  "Obtain a written treatment plan, itemised quote, exclusions and cancellation terms directly from the provider.",
  "Budget for complications, extra nights, a companion and follow-up care, not just the procedure.",
  "Arrange a local clinician for aftercare and obtain the hospital's emergency contact.",
  "Ask the treating team about recovery time and fitness to fly before booking return travel.",
];
const international = [
  "Check nationality-specific medical visa and attendant requirements on India's official visa portal.",
  "Confirm passport validity, hospital invitation requirements, interpreter needs and insurer coverage.",
];

export default function MedicalTravelChecklist() {
  const [visitor, setVisitor] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const items = visitor ? [...essentials, ...international] : essentials;
  const completed = items.filter((item) => checked.includes(item)).length;
  return (
    <section aria-labelledby="travel-checklist" className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 id="travel-checklist">Prepare your treatment trip</h2>
      <label className="mb-5 flex gap-3"><input type="checkbox" checked={visitor} onChange={(e) => setVisitor(e.target.checked)} />I am travelling to India from another country</label>
      <p role="status" aria-live="polite">{completed} of {items.length} planning tasks checked</p>
      <progress className="mb-5 w-full" value={completed} max={items.length} aria-label="Planning checklist progress" />
      <div className="space-y-4">
        {items.map((item) => <label key={item} className="flex items-start gap-3"><input type="checkbox" className="mt-1" checked={checked.includes(item)} onChange={(e) => setChecked((previous) => e.target.checked ? [...previous, item] : previous.filter((value) => value !== item))} /><span>{item}</span></label>)}
      </div>
      <p className="mt-5 text-sm text-slate-600">This is a planning aid, not medical clearance or visa approval. Your selections stay in this page only and reset when you leave or reload.</p>
      <button type="button" className="mt-3 underline" onClick={() => setChecked([])}>Reset checklist</button>
    </section>
  );
}
