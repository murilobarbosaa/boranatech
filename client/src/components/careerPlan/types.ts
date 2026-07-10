import type {
  CareerPlanCertification,
  CareerPlanResult,
  CareerPlanScheduleBlock,
  CareerPlanStep,
} from "@/services/careerPlanService";

// View model da trilha horizontal do Plano de Carreira (componentes
// presentacionais; a integracao com a pagina e da Fase 4).
//
// As ancoras stepId/stepIds existem no server desde a Fase 1
// (server/lib/careerPlan/generate.ts, tipo de leitura CareerPlanStoredResult),
// mas ainda nao nos tipos do careerPlanService. Nao ha alias do client para o
// server, entao os shapes abaixo estendem os tipos do service com os campos
// opcionais, espelhando o tipo de leitura do server.

export interface AnchoredCertification extends CareerPlanCertification {
  stepId?: string | null;
}

export interface AnchoredScheduleBlock extends CareerPlanScheduleBlock {
  stepIds?: string[];
}

export interface AnchoredCareerPlanResult
  extends Omit<CareerPlanResult, "certifications" | "schedule"> {
  certifications: AnchoredCertification[];
  schedule: AnchoredScheduleBlock[];
}

// Entrada minima do buildTrailVM: um CareerPlanResult completo (com checklist)
// e atribuivel a este Pick.
export type TrailSourceResult = Pick<
  AnchoredCareerPlanResult,
  "steps" | "certifications" | "schedule"
>;

// done null = progresso indisponivel (padrao progressFailed do projeto),
// distinto de "nao concluido". NUNCA colapsar null em false/0 na UI.
export interface StationItemVM {
  // item_key do checklist: step:<stepId>:<index>
  itemId: string;
  label: string;
  catalogId: string | null;
  done: boolean | null;
}

export interface StationCertVM {
  // item_key do checklist: cert:<catalogId>
  itemId: string;
  catalogId: string;
  whenLabel: string;
  optional: boolean;
  rationale: string;
  done: boolean | null;
}

export type TrailStationState =
  | "complete"
  | "current"
  | "upcoming"
  | "indeterminate";

export interface TrailStationVM {
  step: CareerPlanStep;
  items: StationItemVM[];
  anchoredCerts: StationCertVM[];
  // monthsLabel do PRIMEIRO bloco do cronograma cujo stepIds contem o degrau;
  // null quando nenhum bloco ancora a estacao.
  scheduleLabel: string | null;
  progress: { done: number | null; total: number };
  state: TrailStationState;
}

export interface TrailVM {
  stations: TrailStationVM[];
  // Certificacoes transversais (stepId null/ausente) e, em planos antigos ou
  // com ref invalida, todas as demais. Renderizadas na GeneralShelf.
  generalCerts: StationCertVM[];
  // true = plano gerado antes da ancoragem (nenhum stepId/stepIds presente).
  unanchored: boolean;
  // Primeira estacao com progresso incompleto (marcador "voce esta aqui");
  // null quando o progresso esta indisponivel ou tudo esta completo.
  currentStationIndex: number | null;
}

function certToVM(
  cert: AnchoredCertification,
  doneItemIds: ReadonlySet<string> | null,
): StationCertVM {
  const itemId = `cert:${cert.catalogId}`;
  return {
    itemId,
    catalogId: cert.catalogId,
    whenLabel: cert.whenLabel,
    optional: cert.optional,
    rationale: cert.rationale,
    done: doneItemIds ? doneItemIds.has(itemId) : null,
  };
}

// Pura: monta o view model da trilha a partir do result persistido e do estado
// do checklist (Set de itemIds concluidos; null = progresso indisponivel).
export function buildTrailVM(
  result: TrailSourceResult,
  doneItemIds: ReadonlySet<string> | null,
): TrailVM {
  const stepIdSet = new Set(result.steps.map((step) => step.id));

  const anchoredByStep = new Map<string, StationCertVM[]>();
  const generalCerts: StationCertVM[] = [];
  for (const cert of result.certifications) {
    const vm = certToVM(cert, doneItemIds);
    // stepId null/ausente e transversal; ref invalida (plano antigo ou fora do
    // contrato pos-Fase 1) tambem cai na prateleira geral, nunca some.
    if (typeof cert.stepId === "string" && stepIdSet.has(cert.stepId)) {
      const list = anchoredByStep.get(cert.stepId) ?? [];
      list.push(vm);
      anchoredByStep.set(cert.stepId, list);
    } else {
      generalCerts.push(vm);
    }
  }

  const unanchored =
    result.certifications.every((cert) => cert.stepId === undefined) &&
    result.schedule.every((block) => block.stepIds === undefined);

  const stations: TrailStationVM[] = result.steps.map((step) => {
    const items: StationItemVM[] = step.items.map((item, index) => {
      const itemId = `step:${step.id}:${index}`;
      return {
        itemId,
        label: item.label,
        catalogId: item.catalogId,
        done: doneItemIds ? doneItemIds.has(itemId) : null,
      };
    });

    const anchoredCerts = anchoredByStep.get(step.id) ?? [];

    const scheduleBlock = result.schedule.find(
      (block) => Array.isArray(block.stepIds) && block.stepIds.includes(step.id),
    );

    const total = items.length + anchoredCerts.length;
    const done = doneItemIds
      ? items.filter((item) => item.done === true).length +
        anchoredCerts.filter((cert) => cert.done === true).length
      : null;

    return {
      step,
      items,
      anchoredCerts,
      scheduleLabel: scheduleBlock?.monthsLabel ?? null,
      progress: { done, total },
      // Estado final derivado abaixo, quando currentStationIndex e conhecido.
      state: "upcoming" as TrailStationState,
    };
  });

  let currentStationIndex: number | null = null;
  if (doneItemIds) {
    const firstIncomplete = stations.findIndex(
      (station) =>
        station.progress.done !== null &&
        station.progress.done < station.progress.total,
    );
    currentStationIndex = firstIncomplete === -1 ? null : firstIncomplete;
  }

  stations.forEach((station, index) => {
    if (station.progress.done === null) {
      station.state = "indeterminate";
    } else if (
      station.progress.total > 0 &&
      station.progress.done >= station.progress.total
    ) {
      station.state = "complete";
    } else if (index === currentStationIndex) {
      station.state = "current";
    } else {
      station.state = "upcoming";
    }
  });

  return { stations, generalCerts, unanchored, currentStationIndex };
}
