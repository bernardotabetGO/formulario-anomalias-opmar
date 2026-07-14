import { describe, expect, it } from "vitest";
import {
  calculateClassifications,
  formatClassifications,
} from "./classification";

describe("calculateClassifications", () => {
  it("classifica pessoas com lesão como Acidente pessoal", () => {
    expect(
      calculateClassifications({
        primaryImpact: "pessoas",
        additionalImpacts: [],
        peopleAnswer: "houve_lesao",
        materialAnswer: null,
        environmentAnswer: null,
      }),
    ).toEqual(["Acidente pessoal"]);
  });

  it("classifica pessoas sem lesão como Incidente", () => {
    expect(
      calculateClassifications({
        primaryImpact: "pessoas",
        additionalImpacts: [],
        peopleAnswer: "nao_houve_lesao",
        materialAnswer: null,
        environmentAnswer: null,
      }),
    ).toEqual(["Incidente"]);
  });

  it("classifica pessoas como Ocorrência de Saúde", () => {
    expect(
      calculateClassifications({
        primaryImpact: "pessoas",
        additionalImpacts: [],
        peopleAnswer: "ocorrencia_saude",
        materialAnswer: null,
        environmentAnswer: null,
      }),
    ).toEqual(["Ocorrência de Saúde"]);
  });

  it("classifica material com dano como Acidente com dano ao patrimônio", () => {
    expect(
      calculateClassifications({
        primaryImpact: "material",
        additionalImpacts: [],
        peopleAnswer: null,
        materialAnswer: "sim",
        environmentAnswer: null,
      }),
    ).toEqual(["Acidente com dano ao patrimônio"]);
  });

  it("classifica material sem dano como Incidente", () => {
    expect(
      calculateClassifications({
        primaryImpact: "material",
        additionalImpacts: [],
        peopleAnswer: null,
        materialAnswer: "nao",
        environmentAnswer: null,
      }),
    ).toEqual(["Incidente"]);
  });

  it("classifica meio ambiente com vazamento como Acidente ambiental", () => {
    expect(
      calculateClassifications({
        primaryImpact: "meio_ambiente",
        additionalImpacts: [],
        peopleAnswer: null,
        materialAnswer: null,
        environmentAnswer: "sim",
      }),
    ).toEqual(["Acidente ambiental"]);
  });

  it("classifica meio ambiente sem vazamento como Incidente ambiental", () => {
    expect(
      calculateClassifications({
        primaryImpact: "meio_ambiente",
        additionalImpacts: [],
        peopleAnswer: null,
        materialAnswer: null,
        environmentAnswer: "nao",
      }),
    ).toEqual(["Incidente ambiental"]);
  });

  it("suporta múltiplos impactos", () => {
    expect(
      calculateClassifications({
        primaryImpact: "pessoas",
        additionalImpacts: ["material", "meio_ambiente"],
        peopleAnswer: "houve_lesao",
        materialAnswer: "sim",
        environmentAnswer: "sim",
      }),
    ).toEqual([
      "Acidente pessoal",
      "Acidente com dano ao patrimônio",
      "Acidente ambiental",
    ]);
  });

  it("remove classificações duplicadas", () => {
    expect(
      calculateClassifications({
        primaryImpact: "pessoas",
        additionalImpacts: ["material"],
        peopleAnswer: "nao_houve_lesao",
        materialAnswer: "nao",
        environmentAnswer: null,
      }),
    ).toEqual(["Incidente"]);
  });

  it("preserva a classificação do impacto principal antes das adicionais", () => {
    const result = calculateClassifications({
      primaryImpact: "meio_ambiente",
      additionalImpacts: ["pessoas"],
      peopleAnswer: "houve_lesao",
      materialAnswer: null,
      environmentAnswer: "sim",
    });
    expect(result[0]).toBe("Acidente ambiental");
    expect(result[1]).toBe("Acidente pessoal");
    expect(formatClassifications(result)).toBe(
      "Acidente ambiental; Acidente pessoal",
    );
  });
});
