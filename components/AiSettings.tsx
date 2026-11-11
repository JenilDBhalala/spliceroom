import { useId, useState } from "react";
import { ownAiHeaders, setOwnAi, useOwnAi } from "@/lib/aiKey";
import SelectField from "./fields/SelectField";

type Model = { id: string; name: string };

/** The model a new key starts with: a Flash-Lite one (fast, with the largest free quota), else the first listed. */
const pickDefault = (models: Model[]) => (models.find((m) => /flash-lite/.test(m.id) && !/preview|exp/.test(m.id)) ?? models[0])?.id ?? "";

/**
 * One line saying whose AI writes the posts; opens to let a visitor use their own Gemini key and pick its model.
 * The key stays in this browser and goes to our server only with their requests.
 */
export default function AiSettings() {
  const own = useOwnAi();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [models, setModels] = useState<Model[] | null>(null);
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edit = () => {
    setKey(own?.key ?? "");
    setModels(null);
    setModel(own?.model ?? "");
    setError(null);
    setOpen(true);
  };

  const check = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/news/models", { method: "POST", headers: ownAiHeaders({ key: key.trim(), model: "" }) });
      const data = (await res.json()) as { models?: Model[]; error?: string };
      if (!res.ok || !data.models) return setError(data.error ?? "Couldn't check that key.");
      if (!data.models.length) return setError("That key works, but has no text models. Try a key from Google AI Studio.");
      setModels(data.models);
      setModel((m) => (data.models!.some((x) => x.id === m) ? m : pickDefault(data.models!)));
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  if (!open)
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
        <span>{own ? <>AI: your Gemini key{own.model ? ` · ${own.model}` : ""}</> : "AI: ours, free, up to 20 posts a day"}</span>
        <button type="button" className="cursor-pointer font-semibold text-accent underline-offset-2 hover:underline" onClick={edit}>
          {own ? "Change" : "Use my own Gemini key"}
        </button>
      </div>
    );

  return (
    <form
      className="flex flex-col gap-2.5 rounded-xl border border-line bg-raise p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!models) return check();
        setOwnAi({ key: key.trim(), model });
        setOpen(false);
      }}
    >
      <p className="m-0 text-sm font-semibold">Your own Gemini key</p>
      <p className="m-0 text-[12.5px] leading-snug text-muted">
        No daily limit from us, and you pick the model. Get a free key at{" "}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-accent">
          Google AI Studio
        </a>
        . It&apos;s saved only in this browser and sent to our server just to write your posts; we never store it.
      </p>
      <label htmlFor={id} className="sr-only">
        Gemini API key
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste your Gemini API key"
          className="input min-w-0 flex-1"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setModels(null);
          }}
        />
        {!models && (
          <button type="submit" className="btn btn-primary flex-none" disabled={busy || key.trim().length < 20}>
            {busy ? "Checking…" : "Check key"}
          </button>
        )}
      </div>
      {models && <SelectField label="Model" value={model} options={models.map((m) => [m.id, `${m.name} (${m.id})`] as const)} onChange={setModel} />}
      {error && (
        <p role="alert" className="m-0 text-[12.5px] text-[#ff8a80]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {models && (
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        )}
        {own && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              setOwnAi(null);
              setOpen(false);
            }}
          >
            Remove my key
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
