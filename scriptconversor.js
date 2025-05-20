let tipoOrigem = null;
let tipoDestino = null;

const getTarifa = (tipo, qtd) => {
  const tabelas = {
    ligacao: [
      [1000, 0.250], [4999, 0.22], [9999, 0.20], [19999, 0.15],
      [49999, 0.14], [99999, 0.13], [Infinity, 0.12]
    ],
    sms: [
      [1000, 0.110], [4999, 0.091], [9999, 0.081], [19999, 0.071],
      [49999, 0.069], [99999, 0.067], [249999, 0.065], [Infinity, 0.063]
    ],
    sms_flash: [
      [1000, 0.171], [4999, 0.152], [9999, 0.142], [19999, 0.132],
      [49999, 0.131], [99999, 0.129], [Infinity, 0.126]
    ]
  };

  for (const [limite, preco] of tabelas[tipo]) {
    if (qtd <= limite) return preco;
  }
};

const calcular = () => {
  const qtd = parseInt(document.getElementById('quantidade').value);
  if (!tipoOrigem || !tipoDestino || isNaN(qtd)) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  const precoOrigem = getTarifa(tipoOrigem, qtd);
  const valorTotal = qtd * precoOrigem;

  const tabelaDestino = {
    ligacao: [
      [1000, 0.250], [4999, 0.22], [9999, 0.20], [19999, 0.15],
      [49999, 0.14], [99999, 0.13], [Infinity, 0.12]
    ],
    sms: [
      [1000, 0.110], [4999, 0.091], [9999, 0.081], [19999, 0.071],
      [49999, 0.069], [99999, 0.067], [249999, 0.065], [Infinity, 0.063]
    ],
    sms_flash: [
      [1000, 0.171], [4999, 0.152], [9999, 0.142], [19999, 0.132],
      [49999, 0.131], [99999, 0.129], [Infinity, 0.126]
    ]
  }[tipoDestino];

  let novaQtd = 0;
  let precoDestino = 0;

  for (const [limite, preco] of tabelaDestino) {
    const estimativaQtd = valorTotal / preco;
    if (estimativaQtd <= limite) {
      novaQtd = estimativaQtd;
      precoDestino = preco;
      break;
    }
  }

  const novoValorTotal = novaQtd * precoDestino;

  let html = `
    <div class="resultado-linha"><strong>Nova quantidade estimada:</strong> <span class="valor">${novaQtd.toFixed(0)} créditos</span></div>
    <div class="resultado-linha"><strong>Valor estimado no destino:</strong> R$${novoValorTotal.toFixed(2)}</div>
  `;

  document.getElementById('resultado').innerHTML = html;
};

document.querySelectorAll('#origem-group button').forEach(btn => {
  btn.onclick = () => {
    tipoOrigem = btn.getAttribute('data-type');
    document.querySelectorAll('#origem-group button').forEach(b => b.style.background = '#fff');
    btn.style.background = '#ccc';
  };
});

document.querySelectorAll('#destino-group button').forEach(btn => {
  btn.onclick = () => {
    tipoDestino = btn.getAttribute('data-type');
    document.querySelectorAll('#destino-group button').forEach(b => b.style.background = '#fff');
    btn.style.background = '#ccc';
  };
});

const limpar = () => {
  tipoOrigem = null;
  tipoDestino = null;
  document.getElementById('quantidade').value = '';
  document.getElementById('resultado').innerHTML = '';
  document.querySelectorAll('#origem-group button').forEach(b => b.style.background = '#fff');
  document.querySelectorAll('#destino-group button').forEach(b => b.style.background = '#fff');
};
