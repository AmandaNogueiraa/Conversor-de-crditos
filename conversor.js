
let tipoOrigem = null;
let tipoDestino = null;
let tipoDestinoDinheiro = null;
let modoAtual = "creditos"; // "creditos" | "dinheiro"

const TABELAS = {
  ligacao: [
    [999, 0.25],
    [4_999, 0.22],
    [9_999, 0.20],
    [19_999, 0.15],
    [49_999, 0.14],
    [99_999, 0.13],
    [Infinity, 0.12],
  ],
  sms: [
    [999, 0.11],
    [4_999, 0.091],
    [9_999, 0.081],
    [19_999, 0.071],
    [49_999, 0.069],
    [99_999, 0.067],
    [249_999, 0.065],
    [Infinity, 0.063],
  ],
  sms_flash: [
    [999, 0.171],
    [4_999, 0.152],
    [9_999, 0.142],
    [19_999, 0.132],
    [49_999, 0.131],
    [99_999, 0.129],
    [Infinity, 0.126],
  ],
};

const LABELS = { ligacao: "Ligação", sms: "SMS", sms_flash: "Flash" };


const fmtBRL = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtInt = (n) => Math.max(0, Math.floor(n)).toString();

function parseBRL(str) {
  if (typeof str !== "string") return NaN;
  const limpo = str.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const v = Number(limpo);
  return Number.isFinite(v) ? v : NaN;
}

function getTarifa(tipo, quantidade) {
  const faixas = TABELAS[tipo];
  for (const [max, tarifa] of faixas) {
    if (quantidade <= max) return tarifa;
  }
  return faixas[faixas.length - 1][1]; // fallback
}



function resolverQuantidadePorCusto(tipo, custo) {
  const faixas = TABELAS[tipo];
  let escolhido = null;

  for (let i = 0; i < faixas.length; i++) {
    const [max, tarifa] = faixas[i];
    const min = i === 0 ? 1 : faixas[i - 1][0] + 1; 

    const q = custo / tarifa;
    if (q >= min && q <= max) {
      escolhido = { quantidade: q, tarifa, min, max };
     
    }
  }

  // fallback teórico (por segurança)
  if (!escolhido) {
    const [, tarifaFinal] = faixas[faixas.length - 1];
    escolhido = { quantidade: custo / tarifaFinal, tarifa: tarifaFinal };
  }
  return escolhido;
}



function calcularCreditosPorDinheiro(tipo, valorBRL) {
  const faixas = TABELAS[tipo];
  let melhor = null;

  for (let i = 0; i < faixas.length; i++) {
    const [max, tarifa] = faixas[i];
    const min = i === 0 ? 1 : faixas[i - 1][0] + 1;

    const qtd = Math.floor(valorBRL / tarifa);
    if (qtd > 0 && qtd >= min && qtd <= max) {
      melhor = { quantidade: qtd, tarifa, custo: qtd * tarifa, min, max };

    }
  }

  if (!melhor) {
    // fallback: usa a 1ª faixa
    const [, tarifa0] = faixas[0];
    const q0 = Math.floor(valorBRL / tarifa0);
    melhor = { quantidade: q0, tarifa: tarifa0, custo: q0 * tarifa0 };
  }
  return melhor;
}

function renderErro(msg) {
  const el = document.getElementById("resultado");
  el.innerHTML = `<div class="erro">${msg}</div>`;
}

function renderResultado(html) {
  const el = document.getElementById("resultado");
  el.innerHTML = html;
}


function calcularPorCreditos() {
  const qtdInput = document.getElementById("quantidade");
  const quantidade = parseInt(qtdInput.value, 10);

  if (!tipoOrigem) return renderErro("Selecione o produto de origem.");
  if (!tipoDestino) return renderErro("Selecione o produto de destino.");
  if (!Number.isFinite(quantidade) || quantidade <= 0)
    return renderErro("Informe uma quantidade válida de créditos.");

  // custo total na origem
  const tarifaOrigem = getTarifa(tipoOrigem, quantidade);
  const custoTotal = quantidade * tarifaOrigem;

  if (tipoOrigem === tipoDestino) {
    return renderResultado(`
      <div class="resultado-linha">
        <strong>Nova quantidade estimada (${LABELS[tipoDestino] || tipoDestino}):</strong>
        <span class="valor">${fmtInt(quantidade)}</span> créditos
      </div>
      <div class="resultado-linha">
        <strong>Tarifa aplicada no destino:</strong>
        R$ ${tarifaOrigem.toFixed(3)} / crédito
      </div>
      <div class="resultado-linha">
        <strong>Valor estimado no destino (mesmo custo):</strong>
        ${fmtBRL(custoTotal)}
      </div>
    `);
  }


  const { quantidade: novaQtd, tarifa: tarifaDestino } =
    resolverQuantidadePorCusto(tipoDestino, custoTotal);

  renderResultado(`
    <div class="resultado-linha">
      <strong>Nova quantidade estimada (${LABELS[tipoDestino] || tipoDestino}):</strong>
      <span class="valor">${fmtInt(novaQtd)}</span> créditos
    </div>
    <div class="resultado-linha">
      <strong>Tarifa aplicada no destino:</strong>
      R$ ${tarifaDestino.toFixed(3)} / crédito
    </div>
    <div class="resultado-linha">
      <strong>Valor estimado no destino (mesmo custo):</strong>
      ${fmtBRL(novaQtd * tarifaDestino)}
    </div>
  `);
}

function calcularPorDinheiro() {
  if (!tipoDestinoDinheiro) return renderErro("Selecione o produto de destino.");
  const raw = document.getElementById("valor-reais")?.value ?? "";
  const valor = parseBRL(raw);
  if (!Number.isFinite(valor) || valor <= 0)
    return renderErro("Informe um valor em reais válido (ex.: 705,00).");

  const { quantidade, tarifa, custo } = calcularCreditosPorDinheiro(
    tipoDestinoDinheiro,
    valor
  );

  renderResultado(`
    <div class="resultado-linha">
      <strong>Quantidade estimada (${LABELS[tipoDestinoDinheiro] || tipoDestinoDinheiro}):</strong>
      <span class="valor">${fmtInt(quantidade)}</span> créditos
    </div>
    <div class="resultado-linha">
      <strong>Tarifa aplicada:</strong>
      R$ ${tarifa.toFixed(3)} / crédito
    </div>
    <div class="resultado-linha">
      <strong>Custo efetivo:</strong>
      ${fmtBRL(custo)} ${
        valor - custo > 0
          ? `<small>(troco: ${fmtBRL(valor - custo)})</small>`
          : ""
      }
    </div>
  `);
}


function calcular() {
  if (modoAtual === "creditos") return calcularPorCreditos();
  return calcularPorDinheiro();
}

function limpar() {
  // estados
  tipoOrigem = null;
  tipoDestino = null;
  tipoDestinoDinheiro = null;

  // inputs
  const qtd = document.getElementById("quantidade");
  if (qtd) qtd.value = "";

  const vr = document.getElementById("valor-reais");
  if (vr) vr.value = "";

  // seleções
  document.querySelectorAll("#origem-group button").forEach((b) => b.classList.remove("selected"));
  document.querySelectorAll("#destino-group button").forEach((b) => b.classList.remove("selected"));
  document.querySelectorAll("#destino-group-dinheiro button").forEach((b) => b.classList.remove("selected"));

  // resultado
  renderResultado("");
}


function setupSeletores() {

  document.querySelectorAll("#origem-group button").forEach((btn) => {
    btn.addEventListener("click", () => {
      tipoOrigem = btn.getAttribute("data-type");
      document
        .querySelectorAll("#origem-group button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  document.querySelectorAll("#destino-group button").forEach((btn) => {
    btn.addEventListener("click", () => {
      tipoDestino = btn.getAttribute("data-type");
      document
        .querySelectorAll("#destino-group button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

 
  document.querySelectorAll("#destino-group-dinheiro button").forEach((btn) => {
    btn.addEventListener("click", () => {
      tipoDestinoDinheiro = btn.getAttribute("data-type");
      document
        .querySelectorAll("#destino-group-dinheiro button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  
  const tabs = document.querySelectorAll("#tabs-modo button");
  const sectionCred = document.querySelector('[data-section="creditos"]');
  const sectionDin = document.querySelector('[data-section="dinheiro"]');

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      modoAtual = btn.getAttribute("data-mode");

      if (modoAtual === "creditos") {
        sectionCred.classList.remove("hidden");
        sectionDin.classList.add("hidden");
      } else {
        sectionDin.classList.remove("hidden");
        sectionCred.classList.add("hidden");
      }

      
      renderResultado("");
    });
  });

  const vr = document.getElementById("valor-reais");
  if (vr) {
    vr.addEventListener("input", () => {
      
      vr.value = vr.value.replace(/[^\d.,]/g, "");
    });
  }
}

document.addEventListener("DOMContentLoaded", setupSeletores);


window.calcular = calcular;
window.limpar = limpar;
