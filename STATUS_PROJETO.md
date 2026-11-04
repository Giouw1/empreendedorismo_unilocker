# UniLocker — o que foi feito e o que falta

Atualizado em **04/11/2026**. Referência: escopo do MVP para apresentação a
investidores, conforme os planos de `.agents/`.

## 1. Situação geral

| Frente | Estado | O que isso significa |
| --- | --- | --- |
| Fundação e contratos — Plano 1 | Concluída | Estrutura, tipos, rotas e interfaces base estão disponíveis. |
| Backend — Fase 2B / Plano 3 | Concluído para o MVP | Prisma/SQLite, autenticação, regras, 35 endpoints e testes implementados. |
| Frontend — Fase 2A / Plano 2 | Base funcional; refinamento pendente | As telas existentes consomem a API; o acabamento previsto no plano ainda falta. |
| Integração técnica | Validada na interface atual | As quatro personas foram testadas no navegador com os dois servidores reais. |
| Homologação final do pitch — Fase 3 | Pendente | Depende de concluir o frontend e ensaiar a apresentação final. |

**Não foram encontradas pendências funcionais conhecidas do plano enxuto de
backend após esta revisão.** Isso se refere ao MVP local; não representa uma
validação para operação comercial em produção.

## 2. O que já foi feito

### 2.1. Unificação e preservação

- Inspecionados branch, commits, alterações e artefatos locais antes da unificação.
- Executado `git fetch origin`; naquele momento `main` e `origin/main` estavam
  no mesmo commit, `0083f4e`, sem divergências a mesclar.
- Mantidos os módulos oficiais e o contrato congelado em
  `backend/src/common/contracts/api.contracts.ts`.
- Reaproveitadas as regras úteis de disponibilidade transacional, autorização
  por recurso, auditoria, preços calculados no servidor e retenção após vencimento.
- Preservado o SQLite anterior em `backend/data/unilocker.sqlite`.
- Guardado backup definitivo da base original versionada e do banco legado em
  `backend/data/pre-unification.zip`, acompanhado de manifesto com hashes.
  Esse ZIP não contém os compilados anteriores; os detalhes estão no registro
  de unificação. O snapshot temporário inicial ficou isolado no sandbox.
- Nenhum fonte do frontend foi modificado nesta implementação de backend.
- Nenhum commit ou push foi executado automaticamente.

### 2.2. Persistência e cenários de demonstração

- SQLite local com Prisma ORM, `PrismaService` e migrations versionadas.
- Oito entidades: `User`, `Partner`, `Location`, `Locker`, `PricingPlan`,
  `Reservation`, `AccessEvent` e `SupportTicket`.
- Transações serializáveis, disputa controlada de escrita e índice único parcial
  para impedir duas reservas retidas no mesmo locker.
- Seed idempotente, sem apagar alterações ou redefinir senhas existentes.
- Cenários UFRJ com 7 usuários, 4 parceiros, 3 pontos, 18 lockers, 27 planos,
  3 reservas, 1 acesso e 1 chamado na criação de um banco novo.
- Cintra com reserva ativa no CT e histórico concluído; Guilherme com ponto EBA
  ativo; cantina pendente e ponto Letras aguardando aprovação.

### 2.3. Autenticação, API e regras de negócio

- JWT assinado, validade de 7 dias, hash bcrypt, perfis e verificação de propriedade.
- Cadastro, login, consulta e edição do perfil.
- ValidationPipe global, DTOs aninhados, validação de enums/inteiros e rejeição
  de campos extras e de valores inválidos.
- Catálogo público com filtros de campus, texto, tamanho, período, preço e vagas.
- Reserva com escolha explícita ou alocação automática de compartimento livre.
- Ativação imediata: `Active` na reserva e `OCCUPIED` no locker.
- Prorrogação com cálculo de preço no servidor e períodos de 24 h, 7 ou 30 dias.
- Conclusão com `confirmedEmptyAndClosed: true` e liberação transacional.
- Cancelamento antes da primeira abertura confirmada; após uso, exige conclusão
  confirmada ou atendimento de suporte.
- Vencimento em `Expired`, mantendo o locker ocupado e criando ocorrência HIGH.
- Abertura exclusivamente simulada, com autorização, vigência e AccessEvent.
- Parceiro gerencia apenas seus pontos e lockers; locker ocupado não aceita
  alteração operacional e responde com `409 Conflict`.
- Receita calculada sobre reservas não canceladas: 10% de taxa e líquido igual
  ao bruto menos a taxa, com arredondamento em centavos por reserva.
- Aprovação administrativa de parceiros/pontos e priorização de suporte.
- Liberação após vistoria pelo admin, com proteção para impedir que um chamado
  antigo libere um compartimento ocupado por uma nova reserva.
- CORS para `http://localhost:5173`, prefixo `/api`, datas ISO 8601 e dinheiro em centavos.

### 2.4. Complementos feitos nesta revisão

- **Vencimento durante a operação:** prorrogar, concluir e cancelar reconferem a
  vigência dentro da transação. Se o aluguel vencer entre a reconciliação inicial
  e a mutação, a operação é recusada e o locker permanece ocupado.
- **Limite exato de vigência:** o instante de término já é considerado vencido,
  em conformidade com a autorização de abertura.
- **Senhas Unicode:** validação adicional de 72 bytes UTF-8, evitando que o bcrypt
  ignore silenciosamente o final de uma senha com acentos ou emojis.
- Adicionados testes de regressão e atualizada a documentação do backend.

## 3. O que foi validado

| Verificação | Resultado |
| --- | --- |
| Migrations e seed locais | Executados na unificação; schema em sincronia e seed idempotente. |
| Build do backend | Aprovado novamente nesta revisão. |
| Testes unitários e E2E do backend | **21 testes aprovados** nesta revisão. |
| Rotas oficiais | **35 endpoints exercitados com sucesso** nos testes HTTP. |
| Concorrência | Uma única reserva por locker; alocação simultânea em lockers distintos. |
| Segurança e retenção | JWT, perfis, ownership, expiração, vistoria e limites de senha verificados. |
| Build do frontend | Aprovado na unificação; seus fontes permanecem inalterados. |
| Navegador real | Fluxo das quatro personas com backend em 3000 e frontend em 5173. |

Os testes usam bancos isolados em `backend/test-results/`, sem alterar o banco de
apresentação `backend/prisma/dev.db`. Relatórios JSON, capturas e logs do navegador
ficam em subpastas `browser-*`. O resultado da última execução é registrado no
fim deste documento.

## 4. O que ainda falta fazer

### 4.1. Frontend — Fase 2A

Estas tarefas pertencem ao plano de acabamento da interface. A base já funciona;
os itens abaixo não devem ser confundidos com ausência dos fluxos da API.

- [ ] Criar os componentes reutilizáveis de domínio: cards de ponto/locker/
  reserva, disponibilidade, resumo de preços, botão de abertura e confirmações.
- [ ] Implementar `CampusVisualMap` em SVG interativo e funcionamento sem tiles
  ou APIs externas.
- [ ] Implementar `useCountdown` e atualizar o tempo restante continuamente.
- [ ] Implementar `useLocalStorageDraft` para preservar o rascunho do cadastro de ponto.
- [ ] Adicionar o banner de reserva ativa ao layout do usuário.
- [ ] Refinar busca/filtros, galeria, checkout, animação de abertura, confirmações
  de ações, histórico e guia interno de localização.
- [ ] Transformar o cadastro de ponto em wizard de quatro etapas com prévia.
- [ ] Refinar a grade de lockers, as explicações de bloqueio e os gráficos de receita.
- [ ] Refinar o painel administrativo e os estados de carregamento, erro e vazio.
- [ ] Validar acessibilidade, responsividade e usabilidade em telas móveis e desktop.
- [ ] Preparar os recursos visuais para demonstração totalmente offline. O seed
  atual ainda referencia imagens externas; elas precisam ser substituídas por
  recursos locais/embutidos ou por uma apresentação alternativa sem dependência de rede.

Referência: [Plano do frontend](.agents/implementation_frontend.md).

### 4.2. Homologação final — Fase 3

- [ ] Repetir os testes integrados após o acabamento da Fase 2A.
- [ ] Ensaiar a narrativa completa com Cintra, Joaquim, Guilherme e Admin.
- [ ] Verificar a demonstração sem internet e em resolução de apresentação.
- [ ] Preparar uma cópia dedicada do banco para o ensaio, preservando o banco de trabalho.
- [ ] Conferir que há lockers livres, uma reserva vigente e aprovações pendentes
  imediatamente antes do pitch. Reexecutar o seed preserva estados existentes;
  não reabre automaticamente uma reserva antiga nem desfaz aprovações.
- [ ] Fazer o aceite visual e operacional final com a equipe.

A integração técnica com a interface atual já foi feita. A Fase 3 continua
pendente porque inclui o produto visual final e o ensaio humano da apresentação.

### 4.3. Backend

**Nenhum item obrigatório do Plano 3 permanece pendente nesta entrega.**
As falhas identificadas nesta revisão foram corrigidas e testadas.

Limites assumidos do MVP: expiração reconciliada durante consultas/ações;
horários informados como texto; abertura simulada; seed com contas conhecidas;
autenticação e execução locais. Esses limites estão documentados e não exigem
integrações externas para a apresentação.

Evoluções para uma futura operação comercial, fora do escopo atual: recuperação/
verificação de contas, limitação de tentativas, política operacional de dados e
backups, observabilidade, paginação e testes de carga. Pagamentos reais, hardware,
webhooks e serviços de nuvem dependem de um novo escopo aprovado.

## 5. Como executar e continuar

Backend, a partir de `backend/`:

```powershell
npm ci
# Apenas se .env ainda não existir:
Copy-Item .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Frontend, em outro terminal a partir de `frontend/`:

```powershell
npm ci
npm run dev
```

Validação do backend, a partir de `backend/`:

```powershell
npm test
npm run build
npm run test:browser
```

O teste de navegador inicia os próprios servidores; execute-o com as portas
3000 e 5173 livres. Não é necessário manter servidores de teste em execução.

As personas usam senha **123456**: `cintra@poli.ufrj.br`,
`joaquim@letras.ufrj.br`, `guilherme@eba.ufrj.br` e `admin@unilocker.ufrj.br`.

## 6. Documentação de apoio

- [Guia do backend](backend/README.md)
- [Registro da unificação e backup](backend/docs/unification.md)
- [Checklist geral](.agents/tasks.md)
- [Plano de backend](.agents/implementation_backend.md)
- [Plano de frontend](.agents/implementation_frontend.md)

As alterações permanecem locais para revisão. Commit e push continuam dependendo
de uma instrução explícita do responsável pelo projeto.

## 7. Última validação desta revisão

- `npm test`: **21 aprovados, 0 falhas**; 35 endpoints exercitados.
- `npm run build` em backend: aprovado.
- `npm run test:browser`: aprovado novamente após as correções, com as quatro
  personas, **0 erros de API**, **0 exceções de página** e CORS confirmado para 5173.
- [Relatório da execução no navegador](backend/test-results/browser-gfbdgr/report.json)
  e [capturas de tela](backend/test-results/browser-gfbdgr/).
- Fontes de `/frontend` e contrato congelado preservados.

Os artefatos de `test-results/` são locais e ignorados pelo Git; podem ser
recriados com os comandos de validação acima.
