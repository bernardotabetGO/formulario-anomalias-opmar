import { expect, type Page, test } from "@playwright/test";

async function dismissDraftIfPresent(page: Page) {
  const discard = page.getByRole("button", {
    name: "Descartar e iniciar novo",
  });
  if (await discard.isVisible().catch(() => false)) {
    await discard.click();
  }
}

async function fillGeneralInformation(page: Page) {
  await page.locator("#occurrenceDate").fill("2026-07-10");
  await page.locator("#occurrenceTime").fill("08:30:00");
  await page.locator("#informant").fill("João Auditor");
  await page.locator("#informantRole").fill("Operador");
  await page.locator("#location").fill("Área Operacional 3");
  await page.locator("#company").fill("Empresa OPMAR");
  await page.locator("#management").fill("Gerência de Segurança");
}

async function fillOccurrence(page: Page) {
  await page
    .locator("#occurrenceDescription")
    .fill("Descrição objetiva do que aconteceu no local.");
  await page
    .locator("#immediateActions")
    .fill("Medidas tomadas imediatamente após a identificação.");
}

async function goBackTimes(page: Page, times: number) {
  for (let index = 0; index < times; index += 1) {
    await page.getByRole("button", { name: "Voltar" }).click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/informe-anomalias");
  await dismissDraftIfPresent(page);
  await expect(
    page.getByRole("heading", {
      name: "Formulário de Informe de Anomalias da OPMAR",
    }),
  ).toBeVisible();
});

test("Fluxo 1 — Acidente pessoal até a revisão", async ({ page }) => {
  await page.getByRole("radio", { name: /^Pessoas$/ }).click();
  await page.getByRole("radio", { name: "Houve lesão", exact: true }).click();
  await expect(page.getByText("Acidente pessoal").first()).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("radio", { name: "Não", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await fillGeneralInformation(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await fillOccurrence(page);
  await page.getByLabel("Primeiros socorros").check();
  await page
    .getByLabel("Deslocamento para atendimento médico externo")
    .check();
  await page.getByRole("button", { name: "Revisar informe" }).click();

  await expect(
    page.getByRole("heading", { name: "Revisão do informe" }),
  ).toBeVisible();
  await expect(page.getByText("Acidente pessoal").first()).toBeVisible();
  await expect(page.getByText("Atendimento à pessoa")).toBeVisible();
  await expect(page.getByText("João Auditor")).toBeVisible();
});

test("Fluxo 2 — Acidente ambiental com campos e FDS", async ({ page }) => {
  await page.getByRole("radio", { name: /^Meio Ambiente$/ }).click();
  await page.getByRole("radio", { name: "Sim", exact: true }).click();
  await expect(page.getByText("Acidente ambiental").first()).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("radio", { name: "Não", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await fillGeneralInformation(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await fillOccurrence(page);
  await expect(page.getByText("Dados do vazamento")).toBeVisible();
  await expect(
    page.getByText("Ficha de Dados de Segurança — FDS"),
  ).toBeVisible();

  await page.locator("#spillEndTime").fill("10:15:00");
  await page.locator("#uncontainedVolume").fill("1,5");
  await page.locator("#containedVolume").fill("2.0");
  await page.locator("#spilledProduct").fill("Óleo diesel");

  await page.getByRole("button", { name: "Revisar informe" }).click();
  await expect(
    page.getByRole("heading", { name: "Revisão do informe" }),
  ).toBeVisible();
  await expect(page.getByText("Acidente ambiental").first()).toBeVisible();
  await expect(page.getByText("Óleo diesel")).toBeVisible();
  await expect(page.getByText("Dados ambientais")).toBeVisible();
});

test("Fluxo 3 — Limpeza condicional ambiental", async ({ page }) => {
  await page.getByRole("radio", { name: /^Meio Ambiente$/ }).click();
  await page.getByRole("radio", { name: "Sim", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("radio", { name: "Não", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await fillGeneralInformation(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await fillOccurrence(page);

  await page.locator("#spillEndTime").fill("11:00:00");
  await page.locator("#uncontainedVolume").fill("3");
  await page.locator("#containedVolume").fill("1");
  await page.locator("#spilledProduct").fill("Produto químico");

  await expect(page.getByText("Dados do vazamento")).toBeVisible();
  await expect(
    page.getByText("Ficha de Dados de Segurança — FDS"),
  ).toBeVisible();

  // Volta à etapa 0 e altera para incidente ambiental
  await goBackTimes(page, 3);
  await expect(
    page.getByRole("heading", { name: "Impacto principal" }),
  ).toBeVisible();
  await page.locator('#meio-ambiente-impacto input[value="nao"]').check();
  await expect(page.getByText("Incidente ambiental").first()).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator('#outros-impactos input[value="nao"]').check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByText("Dados do vazamento")).toHaveCount(0);
  await expect(
    page.getByText("Ficha de Dados de Segurança — FDS"),
  ).toBeVisible();

  // Remove impacto ambiental trocando o principal para Material
  await goBackTimes(page, 3);
  await expect(
    page.getByRole("heading", { name: "Impacto principal" }),
  ).toBeVisible();
  await page.locator('#impacto-principal input[value="material"]').check();
  await page.locator('#material-impacto input[value="nao"]').check();
  await expect(page.getByText("Tipo de ocorrência")).toBeVisible();
  await expect(page.getByText("Incidente", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator('#outros-impactos input[value="nao"]').check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByText("Dados do vazamento")).toHaveCount(0);
  await expect(
    page.getByText("Ficha de Dados de Segurança — FDS"),
  ).toHaveCount(0);
});

test("responsividade básica sem rolagem horizontal indevida", async ({
  page,
}) => {
  for (const width of [375, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/informe-anomalias");
    await dismissDraftIfPresent(page);
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    await expect(
      page.getByRole("heading", {
        name: "Formulário de Informe de Anomalias da OPMAR",
      }),
    ).toBeVisible();
  }
});
