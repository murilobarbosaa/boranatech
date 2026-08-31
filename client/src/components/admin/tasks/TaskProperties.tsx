import type { ReactNode } from "react";

import { BntSelect } from "@/components/shared/BntSelect";

import { LabelPicker } from "./LabelPicker";
import { PRIORITY_OPTIONS, TYPE_OPTIONS } from "./taskBoardStyles";
import { formatIsoDay } from "./relativeTime";
import { LAYER_IN_DIALOG } from "./taskLayers";
import type {
  Task,
  TaskAssignee,
  TaskColumn,
  TaskLabel,
  TaskPriority,
  TaskType,
} from "./types";

// Coluna lateral do modal, no formato do Notion: rotulo a esquerda, valor
// editavel a direita.
//
// Toda alteracao daqui grava NA HORA, sem debounce: sao valores discretos
// escolhidos num select ou num date picker, nao texto sendo digitado. Debounce
// aqui so atrasaria o feedback sem economizar requisicao.

const SEM_RESPONSAVEL = "__sem_responsavel__";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-center gap-2 py-1.5">
      <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-center gap-2 py-1.5">
      <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="min-w-0 truncate text-xs font-semibold text-slate-600">
        {value}
      </span>
    </div>
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export type TaskPropertiesProps = {
  task: Task;
  columns: TaskColumn[];
  admins: TaskAssignee[];
  labels: TaskLabel[];
  selectedLabelIds: string[];
  estimateDraft: string;
  onChangeColumn: (columnId: string) => void;
  onChangeAssignee: (assigneeId: string | null) => void;
  onChangePriority: (priority: TaskPriority) => void;
  onChangeType: (type: TaskType) => void;
  onChangeDueDate: (dueDate: string | null) => void;
  onChangeEstimate: (value: string) => void;
  onCommitEstimate: () => void;
  onToggleLabel: (labelId: string, selected: boolean) => void;
  onCreateLabel: (name: string, color: string) => void;
};

export function TaskProperties({
  task,
  columns,
  admins,
  labels,
  selectedLabelIds,
  estimateDraft,
  onChangeColumn,
  onChangeAssignee,
  onChangePriority,
  onChangeType,
  onChangeDueDate,
  onChangeEstimate,
  onCommitEstimate,
  onToggleLabel,
  onCreateLabel,
}: TaskPropertiesProps) {
  const author = admins.find((admin) => admin.user_id === task.created_by);

  return (
    <div className="divide-y divide-slate-200">
      <Row label="Etapa">
        <BntSelect
          size="sm"
          accent="gold"
          fullWidth
          contentClassName={LAYER_IN_DIALOG}
          label="Etapa da tarefa"
          value={task.column_id}
          onValueChange={onChangeColumn}
          options={columns.map((column) => ({
            value: column.id,
            label: column.name,
          }))}
        />
      </Row>

      <Row label="Responsável">
        <BntSelect
          size="sm"
          accent="gold"
          fullWidth
          contentClassName={LAYER_IN_DIALOG}
          label="Responsável pela tarefa"
          value={task.assignee_id ?? SEM_RESPONSAVEL}
          onValueChange={(value) =>
            onChangeAssignee(value === SEM_RESPONSAVEL ? null : value)
          }
          options={[
            { value: SEM_RESPONSAVEL, label: "Sem responsável" },
            ...admins.map((admin) => ({
              value: admin.user_id,
              label: admin.name ?? admin.email ?? admin.user_id,
            })),
          ]}
        />
      </Row>

      <Row label="Prioridade">
        <BntSelect
          size="sm"
          accent="gold"
          fullWidth
          contentClassName={LAYER_IN_DIALOG}
          label="Prioridade"
          value={task.priority}
          onValueChange={(value) => onChangePriority(value as TaskPriority)}
          options={PRIORITY_OPTIONS}
        />
      </Row>

      <Row label="Tipo">
        <BntSelect
          size="sm"
          accent="gold"
          fullWidth
          contentClassName={LAYER_IN_DIALOG}
          label="Tipo"
          value={task.type}
          onValueChange={(value) => onChangeType(value as TaskType)}
          options={TYPE_OPTIONS}
        />
      </Row>

      <Row label="Etiquetas">
        <LabelPicker
          allLabels={labels}
          selectedIds={selectedLabelIds}
          onToggle={onToggleLabel}
          onCreate={onCreateLabel}
        />
      </Row>

      <Row label="Vencimento">
        {/* due_date e coluna `date` no banco e o endpoint valida AAAA-MM-DD.
            O valor do <input type="date"> JA esta nesse formato, entao vai
            direto: converter para ISO com hora (como faz o dateInputToIso do
            Admin.tsx, escrito para colunas timestamptz) seria rejeitado pelo
            zod da rota. */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={task.due_date ?? ""}
            aria-label="Data de vencimento"
            onChange={(event) => onChangeDueDate(event.target.value || null)}
            className="min-w-0 flex-1 rounded-lg border-2 border-slate-300 px-2 py-1 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
          />
          {/* O input nativo mostra a ordem dos campos conforme a LOCALE do
              navegador (mm/dd/yyyy num Chrome em en-US), e isso nao e
              controlavel de forma confiavel por atributo HTML. O valor gravado e
              sempre AAAA-MM-DD, entao nao ha risco de dado errado; o risco e a
              pessoa inverter dia e mes ao digitar. Este eco em portugues mostra
              o que foi entendido, na hora. */}
          {task.due_date ? (
            <span
              aria-live="polite"
              className="shrink-0 rounded-md bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] font-black text-slate-700"
            >
              {formatIsoDay(task.due_date)}
            </span>
          ) : null}
        </div>
      </Row>

      <Row label="Estimativa">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            step="0.5"
            value={estimateDraft}
            placeholder="-"
            aria-label="Estimativa em horas"
            onChange={(event) => onChangeEstimate(event.target.value)}
            onBlur={onCommitEstimate}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onCommitEstimate();
              }
            }}
            className="w-20 rounded-lg border-2 border-slate-300 px-2 py-1 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
          />
          <span className="text-[11px] font-black text-slate-400">horas</span>
        </div>
      </Row>

      <ReadOnlyRow
        label="Criado por"
        value={author?.name ?? author?.email ?? "-"}
      />
      <ReadOnlyRow label="Criado em" value={formatDateTime(task.created_at)} />
      <ReadOnlyRow
        label="Atualizado"
        value={formatDateTime(task.updated_at)}
      />
      {task.completed_at ? (
        <ReadOnlyRow
          label="Concluído em"
          value={formatDateTime(task.completed_at)}
        />
      ) : null}
    </div>
  );
}
