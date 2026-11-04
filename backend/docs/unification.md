# Registro da unificação e validação — 04/11/2026

## Diagnóstico e sincronização

- Branch inicial: `main`, commit `0083f4e`.
- `git fetch origin` executado. `HEAD...origin/main` retornou **0 / 0**:
  o repositório já estava integrado, sem commits divergentes ou conflitos.
- Não havia modificações rastreadas locais. Havia o SQLite legado em `backend/data/`
  e compilados do backend anterior em `backend/dist/`.
- Antes de substituir implementações, foi criado um snapshot em um temporário
  isolado do sandbox. Esse temporário não persistiu entre as execuções; por isso,
  o backup definitivo foi arquivado dentro do projeto.
- `backend/data/pre-unification.zip` contém os fontes originais de backend,
  `.agents` e README do commit `0083f4e`, mais o SQLite legado preservado com seus
  arquivos WAL/SHM. Os compilados anteriores não integram esse arquivo definitivo;
  as regras úteis foram adaptadas e testadas na nova implementação.
- O banco legado não foi convertido nem sobrescrito. Seus hashes SHA-256 estão
  em `backend/data/backup-manifest.json`. Backup e manifesto são ignorados pelo Git.
- A comparação Git com HEAD confirmou que os fontes do frontend e o contrato
  congelado não foram alterados.

## Reaproveitamento e adaptação

Preservados os módulos e todas as rotas oficiais, contratos TypeScript congelados,
IDs/cenários UFRJ e formato de mapeamento das respostas. Reaproveitadas as regras
da implementação anterior de verificação transacional de disponibilidade,
validação por recurso, auditoria de acesso, soma de preços no servidor e
retenção de compartimentos vencidos.

A persistência SQLite nativa foi substituída por Prisma, as sessões opacas por
JWT e o hash scrypt por bcrypt. O fluxo PendingPayment e as tabelas de pagamento/
financeiro da base anterior não fazem parte do novo escopo: a reserva ativa na
contratação e os relatórios financeiros derivam diretamente das reservas.
O header Idempotency-Key da implementação anterior deixou de ser obrigatório,
pois não integra o contrato congelado nem o cliente existente.

Os arrays do MockDbService viraram fixtures exclusivas do seed. Nenhum serviço
operacional utiliza armazenamento em memória. Na unificação, a alteração fora
de backend foi a marcação da Fase 2B em `.agents/tasks.md`. A revisão documental
posterior, solicitada pelo usuário, acrescentou `STATUS_PROJETO.md` e atualizou
os critérios de conclusão no plano de backend.

## Evidências

- `npx prisma migrate dev`: migrations aplicadas, schema em sincronia.
- `npx prisma db seed`: 7 usuários, 4 parceiros, 3 pontos, 18 lockers, 27 planos,
  3 reservas, 1 evento de acesso e 1 chamado inicial; reexecução idempotente.
- `npm run build` em backend e frontend: ambos aprovados.
- `npm test`: **18 testes aprovados**, incluindo exercício bem-sucedido de todos
  os **35 endpoints**, corrida por um mesmo locker, alocação automática em lockers
  distintos, JWT/RBAC/ownership, vencimento sem liberação e divisão financeira.
- `npm run test:browser`: Chrome real, backend **3000** e frontend **5173**.
  Login Cintra e reserva CT; Joaquim reserva/abre/encerra; Guilherme consulta
  painel, lockers, reservas e financeiro; admin consulta usuários/reservas/
  suporte e aprova cantina e ponto Letras.
- Relatório de navegador aprovado:
  `test-results/browser-NCe6gH/report.json`; **0 erros de API, 0 exceções de página**
  e CORS confirmado para `http://localhost:5173`.
- Capturas no mesmo diretório: `01-cintra-explore.png`, `02-joaquim-unlock.png`,
  `03-guilherme-financial.png`, `04-admin-dashboard.png`.

Nenhum commit ou push foi executado.

## Revisão posterior do backend e documento de status

Criado `STATUS_PROJETO.md` na raiz, separando entregas concluídas, refinamentos
pendentes do frontend, homologação final do pitch e evoluções fora do escopo.

Corrigidas duas lacunas encontradas na revisão: checagem de vigência dentro das
transações de prorrogação/conclusão/cancelamento, incluindo o instante exato do
término; e limite de 72 bytes UTF-8 nas senhas para evitar truncamento pelo bcrypt.

Validação atualizada: **21 testes aprovados**, build do backend aprovado e novo
teste de navegador com as quatro personas aprovado. Evidência:
`test-results/browser-gfbdgr/report.json`, sem erros de API ou exceções de página.
