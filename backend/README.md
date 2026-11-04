# Backend UniLocker — MVP para apresentação

NestJS + TypeScript + Prisma 6 + SQLite local. Contratos preservados em
`src/common/contracts/api.contracts.ts`; API em `http://localhost:3000/api`.
Frontend autorizado por CORS em `http://localhost:5173`.

## Executar a partir de backend/

Requisitos: Node.js 22.12+ (validado com 24.16) e npm.

```powershell
npm ci
Copy-Item .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Se `.env` já existir, preserve sua configuração. `JWT_SECRET` precisa de pelo
menos 32 caracteres. `DATABASE_URL="file:./dev.db"` aponta para `prisma/dev.db`.
O arquivo `.env` local já foi preparado nesta entrega.

Em outro terminal, a partir de `frontend/`, execute `npm run dev`. As dependências
do frontend já foram instaladas pelo lockfile, preservando todos os seus fontes.

## Personas e seed

Todas as contas de demonstração usam **123456**, armazenada com bcrypt.

| E-mail | Perfis / cenário |
| --- | --- |
| `cintra@poli.ufrj.br` | USER; reserva semanal ativa no CT e histórico concluído |
| `joaquim@letras.ufrj.br` | USER; pronto para contratar diárias |
| `guilherme@eba.ufrj.br` | USER + PARTNER; EBA aprovada e ativa |
| `admin@unilocker.ufrj.br` | USER + ADMIN |
| `cantina@ccmn.ufrj.br` | USER; parceiro PENDING |

Também há os parceiros CAEng/CALet, o CT ativo e o ponto **Centro Acadêmico — Letras**
em PENDING_APPROVAL. Os IDs e cenários originais do Plano 1 foram preservados.
O seed usa upserts e não apaga dados, redefine senhas ou reabre reservas encerradas.
Em um banco novo, os períodos são calculados em relação ao momento do seed.

## Regras implementadas

- Contratação ativa imediatamente a reserva e ocupa o locker; sem cobrança externa.
- Prisma `$transaction` serializável, seleção por tamanho e compare-and-set do
  status do locker; índice único parcial impede duas reservas retidas por locker.
- Preços em centavos obtidos no servidor; diário 24 h, semanal 7 dias, mensal 30 dias.
- Prorrogação soma o plano vigente ao total e ao fim do aluguel.
- Prorrogação, conclusão e cancelamento reconferem a vigência dentro da transação,
  impedindo execução se o aluguel vencer após a reconciliação inicial.
- Conclusão exige `confirmedEmptyAndClosed: true` e libera o locker atomicamente.
- Cancelamento é permitido para aluguel Active antes da primeira abertura confirmada;
  após utilização, é necessário concluir com confirmação ou solicitar suporte.
- Vencimento transforma Active em Expired **sem liberar o compartimento**, criando
  uma ocorrência HIGH no painel do admin. A reconciliação acontece nas consultas
  e ações relevantes, sem depender de serviços externos ou scheduler.
- Abertura simulada valida titular/admin, vigência e estado operacional e grava
  AccessEvent. Recusas de terceiros também são auditadas antes do erro HTTP.
- Resposta de abertura preserva o DTO oficial: CONFIRMED, UNAUTHORIZED ou
  LOCKER_MAINTENANCE. A mensagem identifica explicitamente a simulação.
- JWT HS256 com expiração de 7 dias, issuer/audience, validação de assinatura e
  roles relidas do banco por requisição. Perfis de admin/parceiro não são aceitos
  no cadastro público.
- Senhas aceitam de 6 a 72 caracteres, com teto adicional de 72 bytes UTF-8 para
  impedir truncamento silencioso pelo bcrypt em senhas Unicode.
- Ownership em reservas e recursos do parceiro; prévia de pontos não publicados
  restrita ao proprietário aprovado e ao admin.
- Aprovação de ponto exige parceiro aprovado, locker operacional e preços dos
  três períodos para cada tamanho cadastrado.
- Receita calculada diretamente sobre reservas não canceladas, com 10% de taxa
  arredondada por reserva e líquido igual a bruto menos taxa. Relatórios por
  ponto/período mostram o líquido, conforme o frontend.
- Chamados críticos são HIGH; ITEMS_TRAPPED retém a reserva em Incident.
  `releaseLocker: true` exige ocorrência RESOLVED/CLOSED e aluguel ainda retido,
  impedindo que um chamado antigo libere uma nova ocupação.
- ValidationPipe global com classes DTO, validação aninhada, enums, inteiros e
  rejeição de campos extras. Senhas e dados internos nunca aparecem nos mappers.

Horários de acesso permanecem texto informativo, conforme o contrato congelado.
Não há gateways, webhooks, pagamento/cartão real, hardware, push ou nuvem.

## Verificar

```powershell
npm run build
npm test
npm run test:browser
```

`npm test` executa 21 testes unitários/E2E usando SQLite isolado em
`test-results/`, cobrindo os 35 endpoints, concorrência, autorização, vencimento,
liberação administrativa, seed idempotente e financeiro.

`npm run test:browser` usa Playwright com Chrome/Edge local (ou `CHROME_PATH`),
inicia backend em 3000 e frontend em 5173 sobre outro banco isolado e testa as
quatro personas pela interface. As portas precisam estar livres. Requer builds
e dependências de ambos já disponíveis. Os processos iniciados pelo teste são
encerrados ao final. Relatório JSON, logs e capturas ficam em `test-results/`.
Em outros sistemas, instale Chromium com `npx playwright install chromium`.

O banco de apresentação `prisma/dev.db` não é alterado pelos testes. O SQLite
legado de `data/unilocker.sqlite` continua preservado; ele tem outro modelo e não
é utilizado pela aplicação Prisma. Detalhes em [docs/unification.md](docs/unification.md).
