import type { Metadata } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OPMAR — Informe de Anomalias",
  description:
    "Formulário de Informe de Anomalias da OPMAR com classificação progressiva e exportação para Excel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${sourceSans.variable} ${libreBaskerville.variable} antialiased`}
      >
        <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-lg font-semibold text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
            >
              OPMAR
            </Link>
            <nav aria-label="Menu principal">
              <ul className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
                <li>
                  <Link
                    href="/"
                    className="hover:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
                  >
                    Início
                  </Link>
                </li>
                <li>
                  <Link
                    href="/informe-anomalias"
                    className="rounded-md bg-teal-800 px-3 py-1.5 text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
                  >
                    Informe de Anomalias
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
