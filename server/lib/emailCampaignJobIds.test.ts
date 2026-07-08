import { describe, expect, it } from "vitest";

import { batchJobId, recipientJobId } from "./emailCampaignJobIds";

const SAMPLE_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("emailCampaignJobIds", () => {
  // Regra do BullMQ: jobId customizado nao pode conter ":" (Job.validateOptions
  // lanca "Custom Id cannot contain :" na criacao).
  it("nunca contem dois-pontos", () => {
    expect(batchJobId(SAMPLE_UUID)).not.toContain(":");
    expect(recipientJobId(SAMPLE_UUID)).not.toContain(":");
  });

  it("e deterministico por id", () => {
    expect(batchJobId(SAMPLE_UUID)).toBe(batchJobId(SAMPLE_UUID));
    expect(recipientJobId(SAMPLE_UUID)).toBe(recipientJobId(SAMPLE_UUID));
  });

  it("distingue gatilho de lote de job por destinatario com o mesmo id", () => {
    expect(batchJobId(SAMPLE_UUID)).not.toBe(recipientJobId(SAMPLE_UUID));
  });

  it("prefixa o id sem alterar o uuid", () => {
    expect(batchJobId(SAMPLE_UUID)).toBe(`batch-${SAMPLE_UUID}`);
    expect(recipientJobId(SAMPLE_UUID)).toBe(`recipient-${SAMPLE_UUID}`);
  });
});
