"use client";

import { useId, useState } from "react";
import { companionLabel, maxCompanions } from "@/src/lib/invitation-party";

export function CompanionFields({ initialNames = [] }: { initialNames?: string[] }) {
  const id = useId();
  const [count, setCount] = useState(String(initialNames.length));
  const total = Number(count);
  const names = Array.from({ length: Number.isInteger(total) && total <= maxCompanions ? Math.max(0, total) : 0 });

  return <fieldset className="companion-fields">
    <legend>Acompañantes</legend>
    <div className="admin-field">
      <label htmlFor={id}>Cantidad de acompañantes</label>
      <input id={id} type="number" min={0} max={maxCompanions} step={1} value={count} onChange={(event) => setCount(event.target.value)} />
    </div>
    {names.map((_, index) => <div className="admin-field" key={index}>
      <label htmlFor={`${id}-${index}`}>{companionLabel("", index)} <em>nombre opcional</em></label>
      <input id={`${id}-${index}`} name="companionName" defaultValue={initialNames[index] ?? ""} maxLength={150} />
    </div>)}
  </fieldset>;
}
