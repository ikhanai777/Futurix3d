import type { PrintSettings } from "@/lib/format";

type Values = {
  title?: string;
  slug?: string;
  description?: string;
  priceCents?: number;
  commercialPriceCents?: number | null;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED";
  printSettings?: PrintSettings | null;
};

export function ProductForm({
  action,
  values = {},
  submitLabel,
}: {
  action: (form: FormData) => Promise<void>;
  values?: Values;
  submitLabel: string;
}) {
  const ps = values.printSettings ?? {};
  const input = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";
  return (
    <form action={action} className="space-y-4 max-w-2xl">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Title"><input name="title" required defaultValue={values.title} className={input} /></Field>
        <Field label="Slug (URL)"><input name="slug" defaultValue={values.slug} placeholder="auto from title" className={input} /></Field>
      </div>
      <Field label="Description"><textarea name="description" rows={6} defaultValue={values.description} className={input} /></Field>
      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Personal price (cents)"><input name="priceCents" type="number" min={0} required defaultValue={values.priceCents ?? 0} className={input} /></Field>
        <Field label="Commercial price (cents, blank = not offered)"><input name="commercialPriceCents" type="number" min={0} defaultValue={values.commercialPriceCents ?? ""} className={input} /></Field>
        <Field label="Status">
          <select name="status" defaultValue={values.status ?? "DRAFT"} className={input}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </Field>
      </div>
      <Field label="Tags (comma separated)"><input name="tags" defaultValue={values.tags?.join(", ")} className={input} /></Field>

      <fieldset className="rounded-lg border border-zinc-200 p-4 space-y-3">
        <legend className="px-1 text-sm font-medium">Print settings</legend>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Technology">
            <select name="technology" defaultValue={ps.technology ?? ""} className={input}>
              <option value="">Unspecified</option>
              <option value="FDM">FDM</option>
              <option value="Resin">Resin</option>
            </select>
          </Field>
          <Field label="Tested on printer"><input name="printer" defaultValue={ps.printer} className={input} /></Field>
          <Field label="Supports">
            <select name="supports" defaultValue={ps.supports == null ? "" : ps.supports ? "on" : "off"} className={input}>
              <option value="">Unspecified</option>
              <option value="off">Not needed</option>
              <option value="on">Needed</option>
            </select>
          </Field>
          <Field label="Layer height (mm)"><input name="layerHeightMm" type="number" step="0.01" defaultValue={ps.layerHeightMm ?? ""} className={input} /></Field>
          <Field label="Infill (%)"><input name="infillPercent" type="number" defaultValue={ps.infillPercent ?? ""} className={input} /></Field>
          <Field label="Print time (hours)"><input name="printTimeHours" type="number" step="0.1" defaultValue={ps.printTimeHours ?? ""} className={input} /></Field>
          <Field label="Filament (grams)"><input name="filamentGrams" type="number" defaultValue={ps.filamentGrams ?? ""} className={input} /></Field>
          <Field label="Bed size needed (mm)"><input name="bedSizeMm" defaultValue={ps.bedSizeMm} placeholder="e.g. 180 x 120" className={input} /></Field>
        </div>
      </fieldset>

      <button className="rounded-md bg-zinc-900 text-white px-5 py-2 text-sm font-medium">{submitLabel}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-zinc-600">{label}</span>
      {children}
    </label>
  );
}
