# Plano de Implementação 3 — Desenvolvimento Completo do Backend (Autônomo e Paralelo)

> **Foco Estratégico do MVP (Apresentação para Investidores):**
> Este plano guia a evolução do servidor em `/backend` após o [Plano 1 — Base (`.agents/implementation.md`)](./implementation.md), trocando o armazenamento em memória por **SQLite + Prisma** e consolidando as regras de negócio essenciais do marketplace de lockers — **sem integrações externas complexas** (sem gateways de pagamento/webhooks, sem hardware físico real e sem serviços de nuvem).
> - **Diretório de atuação exclusivo:** `/backend`
> - **Isolamento:** **NÃO** edite nem dependa de leitura do código de `/frontend`. Preserve estritamente todas as rotas REST e formatos JSON definidos em `backend/src/common/contracts/api.contracts.ts`.

---

## 1. Escopo Técnico Enxuto deste Plano 3

1. **Persistência Local SQLite (`prisma/dev.db`):** Substituir `MockDbService` por 8 tabelas relacionais enxutas no Prisma ORM + script de *seed* com os cenários da UFRJ.
2. **Autenticação JWT + RBAC:** Substituir o token opaco da Fase 1 por JWT assinado (`@nestjs/jwt`) e senhas com hash `bcrypt`, mantendo os mesmos decorators `@Public()`, `@Roles()` e `@CurrentUser()`.
3. **Regras Centrais do Negócio:**
   - Controle de disponibilidade e prevenção de reserva duplicada no mesmo locker (`prisma.$transaction`).
   - Ativação imediata da reserva na contratação (`Active` + locker `OCCUPIED`) para fluidez na demonstração.
   - Simulação limpa de abertura pelo app com auditoria em `AccessEvent`.
   - Retenção segura de compartimentos em aluguéis vencidos (`Expired` não libera o locker automaticamente sem vistoria).
   - Cálculo dinâmico de receita bruta, comissão da plataforma (`10%`) e ganho líquido do parceiro (`90%`) diretamente sobre as reservas.

---

## 2. Modelagem Relacional Enxuta (`backend/prisma/schema.prisma`)

Apenas **8 entidades essenciais** (sem tabelas complexas de pagamentos externos ou conciliação bancária):

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                    String          @id @default(uuid())
  name                  String
  email                 String          @unique
  passwordHash          String
  universityAffiliation String
  rolesJson             String          @default("[\"USER\"]")
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  partner               Partner?
  reservations          Reservation[]
  accessEvents          AccessEvent[]
  supportTickets        SupportTicket[]
}

model Partner {
  id               String     @id @default(uuid())
  userId           String     @unique
  organizationName String
  organizationType String
  responsibleName  String
  contactPhone     String
  status           String     @default("PENDING") // PENDING | APPROVED | REJECTED
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  user             User       @relation(fields: [userId], references: [id])
  locations        Location[]
}

model Location {
  id                 String        @id @default(uuid())
  partnerId          String
  name               String
  campus             String
  building           String
  block              String
  floor              String
  roomOrCorridor     String
  reference          String
  latitude           Float
  longitude          Float
  openingHours       String
  accessInstructions String
  usageRules         String
  photoUrlsJson      String        @default("[]")
  status             String        @default("PENDING_APPROVAL") // DRAFT | PENDING_APPROVAL | ACTIVE | INACTIVE | REJECTED
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  partner            Partner       @relation(fields: [partnerId], references: [id])
  lockers            Locker[]
  pricingPlans       PricingPlan[]
  reservations       Reservation[]
}

model Locker {
  id           String        @id @default(uuid())
  locationId   String
  code         String
  size         String        // SMALL | MEDIUM | LARGE
  status       String        @default("AVAILABLE") // AVAILABLE | OCCUPIED | MAINTENANCE | BLOCKED
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  location     Location      @relation(fields: [locationId], references: [id])
  reservations Reservation[]
  accessEvents AccessEvent[]

  @@unique([locationId, code])
}

model PricingPlan {
  id         String   @id @default(uuid())
  locationId String
  size       String   // SMALL | MEDIUM | LARGE
  period     String   // DAILY | WEEKLY | MONTHLY
  priceCents Int

  location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([locationId, size, period])
}

model Reservation {
  id              String          @id @default(uuid())
  userId          String
  locationId      String
  lockerId        String
  size            String
  period          String
  startTime       DateTime
  endTime         DateTime
  status          String          @default("Active") // Active | Completed | Cancelled | Expired | Incident
  totalPriceCents Int
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  user            User            @relation(fields: [userId], references: [id])
  location        Location        @relation(fields: [locationId], references: [id])
  locker          Locker          @relation(fields: [lockerId], references: [id])
  accessEvents    AccessEvent[]
  supportTickets  SupportTicket[]
}

model AccessEvent {
  id            String      @id @default(uuid())
  reservationId String
  lockerId      String
  userId        String
  action        String      // UNLOCK_REQUEST | EMERGENCY_UNLOCK
  result        String      // CONFIRMED | UNAUTHORIZED | LOCKER_MAINTENANCE
  message       String
  createdAt     DateTime    @default(now())

  reservation   Reservation @relation(fields: [reservationId], references: [id])
  locker        Locker      @relation(fields: [lockerId], references: [id])
  user          User        @relation(fields: [userId], references: [id])
}

model SupportTicket {
  id            String       @id @default(uuid())
  userId        String
  reservationId String?
  category      String
  priority      String       @default("MEDIUM") // LOW | MEDIUM | HIGH
  description   String
  status        String       @default("OPEN")   // OPEN | IN_PROGRESS | RESOLVED | CLOSED
  adminNotes    String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  user          User         @relation(fields: [userId], references: [id])
  reservation   Reservation? @relation(fields: [reservationId], references: [id])
}
```

### 2.1. Seed de Demonstração (`prisma/seed.ts`)
Popular o SQLite (`npx.cmd prisma db seed`) com as mesmas contas e senhas (`123456`) já esperadas pelo seletor de personas do Frontend:
- `admin@unilocker.ufrj.br` (*Admin UFRJ*)
- `guilherme@eba.ufrj.br` (*Prof. Guilherme — Laboratório de Artes Modernas EBA*)
- `cintra@poli.ufrj.br` (*Cintra — aluguel semanal ativo no Bloco A do CT + histórico concluído*)
- `joaquim@letras.ufrj.br` (*Joaquim — pronto para demonstrar contratação diária ao vivo*)
- `cantina@ccmn.ufrj.br` (*Solicitação de parceiro pendente*) e ponto *Centro Acadêmico — Letras* (`PENDING_APPROVAL`) para demonstrar curadoria do Admin ao vivo.

---

## 3. Regras de Negócio por Módulo

1. **`AuthModule` & `UsersModule`:**
   - Hash com `bcrypt`, token JWT Bearer válido por 7 dias, `ValidationPipe` global e verificação de roles (`USER`, `PARTNER`, `ADMIN`).
2. **`LocationsModule`:**
   - `GET /locations` lista apenas pontos `ACTIVE` cujo parceiro esteja `APPROVED`, aplicando filtros (`campus`, `search`, `size`, `period`, `maxPriceCents`, `onlyAvailable`).
3. **`ReservationsModule`:**
   - `POST /reservations` dentro de `prisma.$transaction`: valida ponto ativo, seleciona compartimento `AVAILABLE` compatível (ou o `lockerId` solicitado), calcula `totalPriceCents` pelo `PricingPlan`, marca o locker como `OCCUPIED` e grava a reserva diretamente como `Active`.
   - `POST /reservations/:id/extend`: soma o período adicional (`24h`, `7d` ou `30d`) ao `endTime` e soma o preço do plano ao `totalPriceCents`.
   - `POST /reservations/:id/complete`: exige `confirmedEmptyAndClosed === true`, encerra como `Completed` e devolve o locker para `AVAILABLE`.
   - **Vencimento seguro:** Reservas `Active` cujo `endTime` já passou mudam para `Expired`, mantendo o locker `OCCUPIED` até regularização ou liberação administrativa.
4. **`AccessModule`:**
   - `POST /reservations/:id/unlock`: valida que o usuário é titular (ou `ADMIN`), que a reserva está `Active` e que o locker não está em `MAINTENANCE`, registrando `AccessEvent` (`CONFIRMED`) e retornando o DTO para feedback imediato na UI.
5. **`PartnersModule`:**
   - Cria e edita pontos/lockers validando propriedade do parceiro; impede colocar em `MAINTENANCE` ou `BLOCKED` um compartimento que esteja `OCCUPIED` (`409 Conflict`).
   - Calcula indicadores de `PartnerDashboardDto` e `PartnerFinancialSummaryDto` aplicando `PLATFORM_FEE_RATE = 0.10` (10% plataforma, 90% parceiro) sobre todas as reservas não canceladas dos pontos do ofertador.
6. **`SupportModule` & `AdminModule`:**
   - Prioriza automaticamente (`HIGH`) chamados de `LOCKER_WONT_OPEN`, `ITEMS_TRAPPED` e `EXPIRED_RENTAL`.
   - Valida na aprovação de ponto (`POST /admin/locations/:id/approve`) que o parceiro está `APPROVED` e que há lockers e preços cadastrados.
   - Permite ao Admin em `PATCH /admin/incidents/:id` com `releaseLocker: true` encerrar a reserva retida e liberar o locker para `AVAILABLE`.

---

## 4. Testes Automatizados (`/backend/test`)

1. **Testes Unitários (`*.spec.ts`):** Cálculo de preços, divisão de comissão (10% / 90%), regras de transição de reserva e trava de manutenção em locker ocupado.
2. **Teste E2E (`test/mvp-flow.e2e-spec.ts`):** Fluxo completo HTTP (`Login -> Listar Pontos -> Reservar -> Conflito em dupla reserva -> Destravar Locker -> Ver Receita Parceiro -> Finalizar Aluguel`).

---

## 5. Critérios de Conclusão do Plano Backend

- [ ] Nenhum arquivo fora de `/backend` foi modificado.
- [ ] `npx.cmd prisma migrate dev` e `npx.cmd prisma db seed` criam e populam o SQLite local sem erros.
- [ ] Todos os 35 endpoints respeitam 100% os tipos de `api.contracts.ts`.
- [ ] `npm.cmd run build` e testes automatizados passam sem falhas.
