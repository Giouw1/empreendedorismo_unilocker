# Quadro Estruturado de Tarefas — MVP UniLocker (Foco Pitch Investidores)

> **Diretriz do MVP:** Aplicativo enxuto, 100% local e demonstrável para investidores, **sem integrações externas complexas** (sem gateways/webhooks de pagamento, sem hardware real e sem APIs pagas de nuvem/mapas).

1. **Fase 1 (Concluída — Base Integrada):** [`.agents/implementation.md`](./implementation.md)
2. **Fase 2A (Paralela — Frontend):** [`.agents/implementation_frontend.md`](./implementation_frontend.md) — *Exclusivo em `/frontend`*
3. **Fase 2B (Paralela — Backend):** [`.agents/implementation_backend.md`](./implementation_backend.md) — *Exclusivo em `/backend`*

---

## Fase 1 — Fundação, Casca de Telas e Contratos de API (`implementation.md`) ✅

### 1.1. Setup e Contratos Compartilhados
- [x] Inicializar projeto Backend NestJS + TypeScript em `/backend` (porta `3000`, prefixo `/api`, CORS ativo).
- [x] Inicializar projeto Frontend React + Vite + TypeScript + Tailwind CSS em `/frontend` (porta `5173`).
- [x] Atualizar contratos enxutos em `backend/src/common/contracts/api.contracts.ts` e espelhar em `frontend/src/types/api.ts`.

### 1.2. Backend Base (Controllers + Stubs em Memória)
- [x] Configurar `MockDbService` com personas UFRJ (*Guilherme*, *Cintra*, *Joaquim*, *Admin*) e cálculo direto de receitas.
- [x] Módulos `AuthModule`, `UsersModule` e `LocationsModule`.
- [x] Módulo `ReservationsModule` com ativação imediata da reserva no checkout (`Active`).
- [x] Módulos `AccessModule`, `PartnersModule`, `SupportModule` e `AdminModule` completando os 35 endpoints essenciais.

### 1.3. Frontend Base (Cliente HTTP + Layouts + 23 Páginas-Casca)
- [x] Ajustar serviços HTTP em `src/services/` (7 serviços enxutos conectados aos 35 endpoints).
- [x] Layouts `UserMobileLayout`, `PartnerLayout`, `AdminWebLayout` + `DemoPersonaSwitcher`.
- [x] Páginas-casca de **Autenticação** (*Welcome*, *Login*, *Register*).
- [x] Páginas-casca de **Usuário** (*Explore*, *LocationDetail*, *Checkout c/ ativação direta*, *MyReservations*, *ActiveReservation*, *LockerLocate*, *Support*, *Profile*).
- [x] Páginas-casca de **Parceiro** (*Apply*, *Dashboard*, *CreateLocation*, *ManageLockers*, *PartnerReservations*, *PartnerFinancial*).
- [x] Páginas-casca de **Administrador** (*Dashboard*, *Users*, *Partners*, *Locations*, *Reservations*, *Incidents*).
- [x] Validar `build` limpo no Backend e no Frontend + teste de integração ponta a ponta.

---

## Fase 2A — Desenvolvimento Completo do Frontend (`implementation_frontend.md`) ✅
> **Escopo Exclusivo:** `/frontend`

- [x] Criar biblioteca de componentes do domínio (`LocationCard`, `LockerCard`, `AvailabilityBadge`, `PriceSummary`, `ReservationCard`, `AccessButton` animado, `ConfirmationDialog`).
- [x] Implementar `CampusVisualMap` em SVG interativo (100% offline-safe para apresentações).
- [x] Implementar hooks `useCountdown` (tempo restante ao vivo) e `useLocalStorageDraft` (rascunho do wizard).
- [x] Adicionar Banner Flutuante global de *Reserva Ativa* em `UserMobileLayout`.
- [x] Refinar todas as telas da jornada do Estudante (filtros combinados, galeria do ponto, animação de destravamento e guia indoor).
- [x] Refinar todas as telas do Ofertador (Wizard de 4 etapas, grade visual dos armários com trava quando ocupados e gráficos/barras de monetização 90%/10%).
- [x] Refinar o Painel Administrativo Web (curadoria de parceiros/pontos, visão de GMV/comissão e central de incidentes).

---

## Fase 2B — Desenvolvimento Completo do Backend (`implementation_backend.md`)
> **Escopo Exclusivo:** `/backend`

- [x] Configurar Prisma ORM + SQLite (`prisma/schema.prisma` com as 8 tabelas essenciais) e `prisma/seed.ts`.
- [x] Implementar autenticação JWT real (`@nestjs/jwt` + `bcrypt`), `ValidationPipe` e guards RBAC + *Ownership*.
- [x] Migrar `LocationsService` e `ReservationsService` para Prisma com transação anti-concorrência (`prisma.$transaction`) e retenção segura em `Expired`.
- [x] Migrar `AccessService`, `PartnersService`, `SupportService` e `AdminService` preservando 100% dos contratos JSON.
- [x] Criar testes unitários e teste E2E (`mvp-flow.e2e-spec.ts`) validando todo o ciclo de aluguel.

---

## Fase 3 — Homologação Final para o Pitch ✅
- [x] Conectar Frontend (Fase 2A) e Backend SQLite (Fase 2B) e validar roteiro completo de demonstração (*Joaquim*, *Cintra*, *Prof. Guilherme* e *Admin*) via `npm run test:browser` (0 falhas).
- [x] Roteiro executivo completo em [`docs/ROTEIRO_PITCH.md`](../docs/ROTEIRO_PITCH.md) e Guia do Apresentador in-app no seletor de personas.

---

## Fase 4 — Execução da ADR 0001: Limpa de Mecanismos Mock ✅
- [x] **Remoção de Hardware Eletrônico:** Exclusão do `AccessModule`, `AccessController`, `AccessService`, rotas `/api/reservations/:id/unlock` e `/access-events`, componente `AccessButton` e `access.service.ts`.
- [x] **Persistência de Candidaturas de Parceiros:** Garantida e verificada a gravação de candidaturas no SQLite via `POST /api/partners/applications` mantendo o status `PENDING` para processo seletivo externo.
- [x] **Limpeza de Textos de Pagamento Simulado:** Ajuste do botão de checkout para "Confirmar Reserva" e destaque de que a cobrança e a entrega de chave/acesso ocorrem diretamente com o parceiro no local.
- [x] **Atualização e Validação dos Testes:** Suíte de testes unitários e E2E ajustada para os 33 endpoints oficiais e teste de fumaça automatizado do navegador (Playwright) 100% verde com 0 erros.

---

## Fase 5 — Execução da ADR 0002: Redirecionamento e Logout de Parceiro ✅
- [x] **Redirecionamento no Login:** Função `homePathFor` direciona usuários com perfil `PARTNER` diretamente para `/partner/dashboard` no login e no seletor de personas.
- [x] **Botão de Logout Dedicado:** Cabeçalho de `PartnerLayout` com botão "Sair" funcional conectado ao `logout()` e redirecionando para `/login`.
- [x] **Flexibilidade Preservada:** Sem restrições excessivas ao parceiro para visualização de telas comuns, mantendo intactas as proteções de estudante para parceiro e não-admin para admin.
- [x] **Validação nos Testes:** Teste Playwright atualizado com transição direta do Guilherme para o painel de parceiro (0 falhas).

---

## Fase 6 — Execução da ADR 0003: Simplificação da Estrutura de Pitch ✅
- [x] **Logins de 1 Clique:** Botões das 4 personas integrados diretamente na tela de login (`/login`) para autenticação e redirecionamento instantâneo.
- [x] **Eliminação de Modais e Switchers Artificiais:** Remoção da gaveta de pitch e exclusão definitiva de `DemoPersonaSwitcher.tsx`, limpando os layouts de usuário, parceiro e administrador.
- [x] **Roteiro e Testes Atualizados:** Documentação de pitch alinhada ao fluxo real e teste de fumaça automatizado Playwright 100% verde validando a alternância via `/login`.
