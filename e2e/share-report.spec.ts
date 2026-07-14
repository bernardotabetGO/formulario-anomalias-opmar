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
    window.__openedUrls = [];
    window.__downloadCount = 0;
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

test("botões de compartilhamento aparecem somente na revisão", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Compartilhar no WhatsApp" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Enviar por e-mail" })).toHaveCount(
    0,
  );

  await goToReview(page);

  await expect(
    page.getByRole("heading", { name: "Compartilhar informe" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Compartilhe um resumo textual completo do informe pelo WhatsApp ou e-mail.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Compartilhar no WhatsApp" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar por e-mail" }),
  ).toBeVisible();
});

test("WhatsApp abre wa.me com texto e não dispara download", async ({
  page,
}) => {
  await goToReview(page);
  const recordNumber = await page
    .locator("dd")
    .filter({ hasText: /^OPMAR-/ })
    .first()
    .textContent();

  await page.getByRole("button", { name: "Compartilhar no WhatsApp" }).click();

  await expect(
    page.getByText("WhatsApp aberto com o resumo do informe."),
  ).toBeVisible();
  await expect(page.getByText("João Auditor")).toBeVisible();
  await expect(page.getByText(/arquivo Excel/i)).toHaveCount(0);

  const opened = await page.evaluate(() => window.__openedUrls ?? []);
  expect(opened.some((url) => url.includes("https://wa.me/?text="))).toBe(true);
  expect(
    opened.some((url) =>
      decodeURIComponent(url).includes("INFORME DE ANOMALIA DA OPMAR"),
    ),
  ).toBe(true);

  const downloads = await page.evaluate(() => window.__downloadCount ?? 0);
  expect(downloads).toBe(0);
  expect(recordNumber).toContain("OPMAR-");
});

test("e-mail abre mailto com assunto e corpo sem download", async ({ page }) => {
  await goToReview(page);

  await page.getByRole("button", { name: "Enviar por e-mail" }).click();

  await expect(
    page.getByText("Aplicativo de e-mail aberto com o resumo do informe."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Revisão do informe" }),
  ).toBeVisible();
  await expect(page.getByText(/arquivo Excel/i)).toHaveCount(0);

  const opened = await page.evaluate(() => window.__openedUrls ?? []);
  expect(opened.some((url) => url.startsWith("mailto:?subject="))).toBe(true);
  expect(
    opened.some((url) =>
      decodeURIComponent(url).includes(
        "Informe de Anomalia OPMAR - OPMAR-",
      ),
    ),
  ).toBe(true);
  expect(
    opened.some((url) =>
      decodeURIComponent(url).includes(
        "Descrição objetiva do que aconteceu no local.",
      ),
    ),
  ).toBe(true);

  const downloads = await page.evaluate(() => window.__downloadCount ?? 0);
  expect(downloads).toBe(0);
});

test("Exportar para Excel dispara download e permanece separado", async ({
  page,
}) => {
  await goToReview(page);

  await page.getByRole("button", { name: "Exportar para Excel" }).click();

  await expect(
    page.getByText("Exportação concluída com sucesso."),
  ).toBeVisible({ timeout: 10000 });

  const downloads = await page.evaluate(() => window.__downloadCount ?? 0);
  expect(downloads).toBeGreaterThan(0);
  await expect(page.getByText("João Auditor")).toBeVisible();
});

test("botões de compartilhamento permanecem utilizáveis no mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/informe-anomalias");
  await dismissDraftIfPresent(page);
  await goToReview(page);

  const whatsapp = page.getByRole("button", {
    name: "Compartilhar no WhatsApp",
  });
  const email = page.getByRole("button", { name: "Enviar por e-mail" });

  await expect(whatsapp).toBeVisible();
  await expect(email).toBeVisible();
  await expect(whatsapp).toBeEnabled();
  await expect(email).toBeEnabled();
});

declare global {
  interface Window {
    __openedUrls?: string[];
    __downloadCount?: number;
  }
}
