/**
 * EHR — Medical Record Layout
 * Adapted from TanStack Router template → plain React component.
 * To use inside Next.js App Router, import and render from a page.tsx.
 * To restore TanStack routing, wrap with createFileRoute("/")({ component: Index }).
 */
import {
  Bot,
  Check,
  CircleUserRound,
  Clock3,
  FilePlus2,
  Mail,
  NotebookPen,
  Pencil,
  Phone,
  Pill,
  Plus,
  Stethoscope,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────── */
type Patient = {
  id: string;
  name: string;
  age: number;
  status: "Stable" | "Critical" | "Observation";
  allergies: string[];
  alerts: number;
  risk: "Low" | "Moderate" | "High";
  phone: string;
  email: string;
  history: string;
};

/* ─── Static data ────────────────────────────────────────────────── */
const patients: Patient[] = [
  {
    id: "P-1042",
    name: "Amelia Carter",
    age: 46,
    status: "Stable",
    allergies: ["Penicillin"],
    alerts: 1,
    risk: "Moderate",
    phone: "(11) 99876-3210",
    email: "amelia.carter@email.com",
    history: "HAS + DM2",
  },
  {
    id: "P-1097",
    name: "Noah Williams",
    age: 62,
    status: "Observation",
    allergies: ["Aspirin"],
    alerts: 2,
    risk: "Moderate",
    phone: "(11) 99751-9048",
    email: "noah.williams@email.com",
    history: "DPOC",
  },
  {
    id: "P-1123",
    name: "Mia Thompson",
    age: 31,
    status: "Critical",
    allergies: ["Sulfa"],
    alerts: 3,
    risk: "High",
    phone: "(11) 98900-4422",
    email: "mia.thompson@email.com",
    history: "Asma",
  },
  {
    id: "P-1150",
    name: "Oliver Lee",
    age: 54,
    status: "Stable",
    allergies: [],
    alerts: 0,
    risk: "Low",
    phone: "(11) 99112-8834",
    email: "oliver.lee@email.com",
    history: "Dislipidemia",
  },
  {
    id: "P-1166",
    name: "Sophia Brown",
    age: 72,
    status: "Observation",
    allergies: ["Iodine"],
    alerts: 1,
    risk: "Moderate",
    phone: "(11) 99421-7309",
    email: "sophia.brown@email.com",
    history: "Insuficiência venosa",
  },
];

const interactionRules: Record<string, string[]> = {
  Penicillin: ["Amoxicillin"],
  Aspirin: ["Ibuprofen"],
  Sulfa: ["Sulfamethoxazole"],
  Iodine: ["Contrast Dye"],
};

const tabs = ["Atendimento", "Prontuário", "Relacionamento", "Arquivos"] as const;

const templates = [
  "Selecione um modelo de anamnese",
  "Modelo de anamnese geral",
  "Retorno cardiologia",
  "Acompanhamento diabetes",
  "Queixa respiratória",
];

const quickSnippets = ["QP", "HDA", "Exame", "Dx", "Plano"];

/* ─── Component ──────────────────────────────────────────────────── */
export default function Index() {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0].id);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Atendimento");
  const [template, setTemplate] = useState(templates[0]);
  const [notes, setNotes] = useState(
    "QP:\n- Dyspnea on exertion, improved since last visit.\n\nHDA:\n- Better sleep and medication adherence this week.\n- No chest pain, no syncope.\n\nExam:\n- Lungs clear, no edema, regular rhythm.\n\nDx:\n- Hypertension, Type 2 Diabetes.\n\nPlan:\n- Continue current treatment and reassess in 2 weeks.",
  );
  const [saveState, setSaveState] = useState<"idle" | "editing" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string>("Just now");
  const [selectionActive, setSelectionActive] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) ?? patients[0],
    [selectedPatientId],
  );

  /* Autosave simulation */
  useEffect(() => {
    if (saveState !== "editing") return;
    const toSaving = window.setTimeout(() => setSaveState("saving"), 250);
    const toSaved = window.setTimeout(() => {
      setSaveState("saved");
      setLastSavedAt(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    }, 820);
    return () => {
      window.clearTimeout(toSaving);
      window.clearTimeout(toSaved);
    };
  }, [notes, saveState]);

  const aiAssist = () => {
    setNotes((prev) => `${prev}\n- IA: reforçar educação em saúde e sinais de alarme.`);
    setSaveState("editing");
  };

  const checkSelection = () => {
    const editor = notesRef.current;
    if (!editor) return setSelectionActive(false);
    setSelectionActive(editor.selectionStart !== editor.selectionEnd);
  };

  const applyFormat = (wrapper: string) => {
    const editor = notesRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return;
    const selectedText = notes.slice(start, end);
    const formatted = `${wrapper}${selectedText}${wrapper}`;
    const next = `${notes.slice(0, start)}${formatted}${notes.slice(end)}`;
    setNotes(next);
    setSaveState("editing");
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + formatted.length, start + formatted.length);
    });
  };

  const insertSnippet = (field: string) => {
    const editor = notesRef.current;
    const snippet = `\n${field}: `;
    if (!editor) {
      setNotes((prev) => `${prev}${snippet}`);
      setSaveState("editing");
      return;
    }
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const next = `${notes.slice(0, start)}${snippet}${notes.slice(end)}`;
    setNotes(next);
    setSaveState("editing");
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  const manualSave = () => {
    setSaveState("saving");
    window.setTimeout(() => {
      setSaveState("saved");
      setLastSavedAt(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    }, 450);
  };

  const hasInteraction = selectedPatient.allergies.some((allergy) =>
    (interactionRules[allergy] ?? []).some((drug) =>
      notes.toLowerCase().includes(drug.toLowerCase()),
    ),
  );

  const statusTone: Record<Patient["status"], string> = {
    Stable: "bg-info/15 text-info",
    Observation: "bg-accent text-accent-foreground",
    Critical: "bg-destructive/15 text-destructive",
  };

  const saveLabel =
    saveState === "saving"
      ? "Salvando..."
      : saveState === "editing"
        ? "Editando"
        : `Salvo às ${lastSavedAt}`;

  /* ── suppress unused warning — patient selector ── */
  void setSelectedPatientId;

  return (
    <div className="ehr-shell grid min-h-screen grid-cols-1 bg-muted/40 xl:grid-cols-[205px_minmax(0,1fr)_355px]">

      {/* ── Left sidebar ── */}
      <aside className="premium-sidebar group border-b border-border/60 bg-gradient-to-b from-muted/80 via-muted/60 to-background px-4 py-5 xl:sticky xl:top-0 xl:h-screen xl:border-b-0 xl:border-r">
        <section className="px-2">
          <div className="mx-auto flex h-[136px] w-[136px] items-center justify-center rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/20 shadow-lg transition-transform duration-200 hover:scale-105">
            <CircleUserRound className="h-20 w-20 text-primary/80" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-base font-bold tracking-tight text-foreground">{selectedPatient.name}</p>
            <p className="text-sm text-muted-foreground font-medium">{selectedPatient.age} Anos e 10 meses</p>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm border ${statusTone[selectedPatient.status]}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {selectedPatient.status}
            </span>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow hover:bg-muted">
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          </div>

          <div className="mt-6 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Dados do paciente:</p>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 text-foreground/80">
                <Phone className="h-4 w-4 text-primary/70" />
                {selectedPatient.phone}
              </p>
              <p className="flex items-center gap-2 text-foreground/80">
                <Mail className="h-4 w-4 text-primary/70" />
                {selectedPatient.email}
              </p>
              <p className="flex items-center gap-2 text-foreground/80">
                <Stethoscope className="h-4 w-4 text-primary/70" />
                {selectedPatient.history}
              </p>
            </div>
          </div>
        </section>
      </aside>

      {/* ── Main content ── */}
      <main className="px-4 pb-28 pt-3 lg:px-6">
        {/* Sticky tab header */}
        <header className="sticky top-0 z-20 bg-background/80 pb-3 backdrop-blur-md">
          <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`
                    inline-flex items-center px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150
                    ${activeTab === tab
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* AI banner */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-info/20 bg-gradient-to-r from-info/10 via-info/5 to-transparent shadow-sm">
          <div className="border-b border-info/20 bg-info/8 px-4 py-2 text-center text-sm font-semibold text-info">
            Você tem 5 usos restantes para testes do Scribe AI da Doctor Assistant!
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-info">
              <Bot className="h-4 w-4" />
              Assistente de IA
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex items-center rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow hover:bg-muted">
                Generalista
              </button>
              <button type="button" onClick={aiAssist} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md">
                <NotebookPen className="h-4 w-4" />
                Iniciar Registro
              </button>
            </div>
          </div>
        </section>

        {/* Notes editor */}
        <section className="mt-4 rounded-2xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border/60">
            <h1 className="text-lg font-bold text-foreground">Registro interno</h1>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              >
                {templates.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {saveLabel}
              </div>
            </div>

            {/* Snippet chips */}
            <div className="flex flex-wrap items-center gap-2">
              {quickSnippets.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => insertSnippet(field)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-muted hover:text-primary"
                >
                  <WandSparkles className="h-3.5 w-3.5" />
                  {field}
                </button>
              ))}
              <button type="button" onClick={() => applyFormat("**")} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:bg-muted">
                B
              </button>
              <button type="button" onClick={() => applyFormat("_")} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-xs font-bold text-foreground italic transition-all hover:border-primary/40 hover:bg-muted">
                I
              </button>
            </div>

            {/* Textarea with floating toolbar */}
            <div className="relative mt-3">
            {selectionActive && (
              <div className="ehr-editor-toolbar absolute left-1/2 top-3 z-10 -translate-x-1/2">
                <button type="button" onClick={() => applyFormat("**")} className="ehr-chip">
                  B
                </button>
                <button type="button" onClick={() => applyFormat("_")} className="ehr-chip">
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("- ")}
                  className="ehr-chip"
                >
                  Lista
                </button>
              </div>
            )}

            <textarea
              ref={notesRef}
              value={notes}
              onSelect={checkSelection}
              onKeyUp={checkSelection}
              onMouseUp={checkSelection}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaveState("editing");
              }}
              className="min-h-[355px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
              placeholder="Escolha um modelo de anamnese acima ou digite a sua aqui..."
            />

            <button
              type="button"
              onClick={aiAssist}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:scale-105"
              title="Assistente de IA"
            >
              <Bot className="h-4 w-4" />
              IA
            </button>
          </div>

          {hasInteraction && (
            <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Atenção: possível interação com alergia cadastrada.
            </p>
          )}
        </section>

        {/* Bottom spacer so fixed bar doesn't overlap last content */}
        <div className="h-6" />
      </main>

      {/* ── Right sidebar ── */}
      <aside className="border-t border-border bg-muted/45 px-4 py-5 xl:sticky xl:top-0 xl:h-screen xl:border-l xl:border-t-0 xl:overflow-y-auto">
        {/* Documents */}
        <section className="ehr-panel px-4 py-3">
          <h2 className="text-sm font-semibold">Documentos</h2>
          <div className="mt-3 space-y-2">
            {[
              { label: "Prescrição Rápida", icon: <Pill className="h-4 w-4" /> },
              { label: "Prescrições", icon: <FilePlus2 className="h-4 w-4" /> },
              { label: "Solicitações de Procedimento", icon: <FilePlus2 className="h-4 w-4" /> },
              { label: "Encaminhamentos", icon: <FilePlus2 className="h-4 w-4" /> },
              { label: "Atestados", icon: <FilePlus2 className="h-4 w-4" /> },
              { label: "Outros Documentos", icon: <FilePlus2 className="h-4 w-4" /> },
            ].map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="inline-flex items-center gap-2">
                  {icon}
                  {label}
                </span>
                <span className="ehr-mini-icon">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Charts & sheets */}
        <section className="ehr-panel mt-4 px-4 py-3">
          <h2 className="text-sm font-semibold">Planilhas e Gráficos</h2>
          <div className="mt-3 space-y-2">
            {[
              ["Gráficos", `${selectedPatient.risk} risk`],
              ["Planilhas", `${selectedPatient.alerts} alertas`],
            ].map(([label, hint]) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="inline-flex flex-col items-start">
                  <span>{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </span>
                <span className="ehr-mini-icon">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      {/* ── Fixed bottom action bar ── */}
      <div className="ehr-bottom-bar">
        <button type="button" className="ehr-action-secondary">
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button type="button" onClick={manualSave} className="ehr-action-secondary">
          <Check className="h-4 w-4" />
          Salvar e continuar
        </button>
        <button type="button" className="ehr-action-primary">
          Finalizar atendimento
        </button>
      </div>
    </div>
  );
}
