import { expect, type Page, test } from "@playwright/test";

async function dismissDraftIfPresent(page: Page) {
  const discard = page.getByRole("button", {
    name: "Descartar e iniciar novo",
  });
  if (await discard.isVisible().catch(() => false)) {
    await discard.click();
  }
}

async function goToReview(page: Page) {
  await page.getByRole("radio", { name: /^Pessoas$/ }).click();
  await page.getByRole("radio", { name: "Houve lesão", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("radio", { name: "Não", exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("#occurrenceDate").fill("2026-07-10");
  await page.locator("#occurrenceTime").fill("08:30:00");
  await page.locator("#informant").fill("João Auditor");
  await page.locator("#informantRole").fill("Operador");
  await page.locator("#location").fill("Área Operacional 3");
  await page.locator("#company").fill("Empresa OPMAR");
  await page.locator("#management").fill("Gerência de Segurança");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page
    .locator("#occurrenceDescription")
    .fill("Descrição objetiva do que aconteceu no local.");
  await page
    .locator("#immediateActions")
    .fill("Medidas tomadas imediatamente após a identificação.");
  await page.getByRole("button", { name: "Revisar informe" }).click();
  await expect(
    page.getByRole("heading", { name: "Revisão do informe" }),
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__clipboardText = "";
    window.__downloadCount = 0;
    window.__openedUrls = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          window.__clipboardText = text;
        },
      },
    });
    window.open = ((url?: string | URL) => {
      window.__openedUrls?.push(String(url ?? ""));
      return { focus: () => undefined } as Window;
    }) as typeof window.open;
    HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement) {
      if (this.download) {
        window.__downloadCount = (window.__downloadCount ?? 0) + 1;
      }
    };
  });
  await page.goto("/informe-anomalias");
  await dismissDraftIfPresent(page);
});

test("botões de WhatsApp e e-mail não existem mais", async ({ page }) => {
  await goToReview(page);
  await expect(
    page.getByRole("button", { name: "Compartilhar no WhatsApp" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Enviar por e-mail" })).toHaveCount(
    0,
  );
});

test("botão Copiar texto do informe aparece somente na revisão", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Copiar texto do informe" }),
  ).toHaveCount(0);

  await goToReview(page);

  await expect(page.getByRole("heading", { name: "Copiar informe" })).toBeVisible();
  await expect(
    page.getByText(
      "Copie o informe completo e cole diretamente no WhatsApp, e-mail ou outro aplicativo.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copiar texto do informe" }),
  ).toBeVisible();
});

test("clique copia texto com registro, classificação, descrição e ações", async ({
  page,
}) => {
  await goToReview(page);
  const recordNumber = await page
    .locator("dd")
    .filter({ hasText: /^OPMAR-/ })
    .first()
    .textContent();

  await page.getByRole("button", { name: "Copiar texto do informe" }).click();

  await expect(
    page.getByText("Informe copiado. Agora é só colar no WhatsApp."),
  ).toBeVisible();

  const copiedText = await page.evaluate(() => window.__clipboardText ?? "");
  expect(copiedText).toContain("*INFORME DE ANOMALIA — OPMAR*");
  expect(copiedText).toContain(recordNumber ?? "");
  expect(copiedText).toContain("Acidente pessoal");
  expect(copiedText).toContain(
    "Descrição objetiva do que aconteceu no local.",
  );
  expect(copiedText).toContain(
    "Medidas tomadas imediatamente após a identificação.",
  );

  const opened = await page.evaluate(() => window.__openedUrls ?? []);
  expect(opened).toHaveLength(0);

  const downloads = await page.evaluate(() => window.__downloadCount ?? 0);
  expect(downloads).toBe(0);

  await expect(page.getByText("João Auditor")).toBeVisible();
  expect(recordNumber).toContain("OPMAR-");
});

test("visualização do texto abre e fecha", async ({ page }) => {
  await goToReview(page);

  await page.getByRole("button", { name: "Visualizar texto" }).click();
  await expect(page.getByText("*INFORME DE ANOMALIA — OPMAR*")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copiar novamente" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Ocultar texto" }).click();
  await expect(page.getByRole("button", { name: "Copiar novamente" })).toHaveCount(
    0,
  );
});

test("Exportar para Excel continua funcionando", async ({ page }) => {
  await goToReview(page);

  await page.getByRole("button", { name: "Exportar para Excel" }).click();

  await expect(
    page.getByText("Exportação concluída com sucesso."),
  ).toBeVisible({ timeout: 10000 });

  const downloads = await page.evaluate(() => window.__downloadCount ?? 0);
  expect(downloads).toBeGreaterThan(0);
  await expect(page.getByText("João Auditor")).toBeVisible();
});

test("botão de copiar funciona em viewport mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/informe-anomalias");
  await dismissDraftIfPresent(page);
  await goToReview(page);

  const copyButton = page.getByRole("button", {
    name: "Copiar texto do informe",
  });
  await expect(copyButton).toBeVisible();
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await expect(
    page.getByText("Informe copiado. Agora é só colar no WhatsApp."),
  ).toBeVisible();
});

declare global {
  interface Window {
    __clipboardText?: string;
    __downloadCount?: number;
    __openedUrls?: string[];
  }
}
