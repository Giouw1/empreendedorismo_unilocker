# Plano de Implementação 2 — Desenvolvimento Completo do Frontend (Autônomo e Paralelo)

> **Foco Estratégico do MVP (Pitch para Investidores):**
> Este plano guia o acabamento completo da interface do **UniLocker** após o [Plano 1 — Base (`.agents/implementation.md`)](./implementation.md), focando em **clareza visual, fluidez de demonstração e zero dependência de APIs externas**.
> - **Diretório de atuação exclusivo:** `/frontend`
> - **Isolamento:** **NÃO** edite nem dependa de leitura do código interno de `/backend`. Utilize exclusivamente os contratos congelados em `frontend/src/types/api.ts` e os clientes em `frontend/src/services/*.service.ts`.
> - **Sem fricção de pagamento ou mapas externos:** A contratação ativa o aluguel em 1 clique no Checkout; o mapa do campus deve ser um **Mapa Visual Interativo do Campus UFRJ em SVG/React puro** (100% offline-safe para apresentações ao vivo, sem depender de tiles externos ou chaves de API).

---

## 1. Arquitetura e Premissas do Frontend

### 1.1. Base Recebida do Plano 1
1. Projeto Vite + React 18 + TypeScript + Tailwind CSS v4 configurado em `/frontend`.
2. Contratos completos em `src/types/api.ts` e serviços REST em `src/services/` (`auth`, `locations`, `reservations`, `access`, `partner`, `support`, `admin`).
3. `AuthContext.tsx` com login e `DemoPersonaSwitcher` (alternância em 1 clique entre *Cintra*, *Joaquim*, *Prof. Guilherme* e *Admin* durante o pitch).
4. Layouts (`UserMobileLayout`, `PartnerLayout`, `AdminWebLayout`) e as 23 páginas-casca já conectadas à API.

### 1.2. Princípios Visuais para Apresentação a Investidores
- **Storytelling imediato:** Quem assiste à demonstração deve bater o olho e entender em segundos: (1) onde há lockers livres no campus, (2) quão simples é reservar e destravar pelo celular, e (3) quanto o ofertador e a plataforma ganham em cada aluguel.
- **Feedback visual rico:** Animação clara do cadeado abrindo ao clicar em *Abrir Locker*, contadores animados, badges semânticos de ocupação e confirmação modal antes de ações destrutivas.
- **Anti-duplo envio:** Botões de mutação ficam `disabled` com *spinner* durante chamadas de rede.

---

## 2. Organização Interna Alvo em `/frontend/src`

```text
frontend/src/
├── types/
│   └── api.ts                       # (Congelado no Plano 1 — NÃO alterar propriedades)
├── utils/
│   ├── formatters.ts                # Moeda BRL (centavos), datas, tempo restante e labels PT-BR
│   └── validators.ts                # Validações de formulários e etapas do wizard
├── hooks/
│   ├── useAsync.ts                  # Carregamento e mutações c/ tratamento de erro
│   ├── useCountdown.ts              # Cronômetro regressivo em tempo real para Reserva Ativa
│   └── useLocalStorageDraft.ts      # Salvamento automático de rascunho no Wizard de Criar Ponto
├── components/
│   ├── DemoPersonaSwitcher.tsx      # Seletor rápido de Persona p/ demonstração
│   ├── RequireAuth.tsx              # Proteção de rotas por perfil
│   ├── ui.tsx                       # Primitivos visuais (Badge, StatCard, Toast, Modal, Skeleton)
│   └── domain/                      # Componentes reutilizáveis do domínio UniLocker (Seção 3)
│       ├── LocationCard.tsx
│       ├── LockerCard.tsx
│       ├── AvailabilityBadge.tsx
│       ├── PriceSummary.tsx
│       ├── ReservationCard.tsx
│       ├── LockerStatusBadge.tsx
│       ├── AccessButton.tsx
│       ├── CampusVisualMap.tsx      # Mapa interativo ilustrado da UFRJ em SVG puro (sem API externa)
│       └── ConfirmationDialog.tsx
├── layouts/                         # UserMobileLayout, PartnerLayout, AdminWebLayout
├── services/                        # Clientes HTTP do Plano 1
└── pages/                           # Páginas refinadas (auth/, user/, partner/, admin/)
```

---

## 3. Componentes de Domínio Essenciais (`components/domain/`)

1. **`LocationCard`**: Card atrativo com foto de capa, nome do espaço, prédio/bloco/andar, `AvailabilityBadge` (`X livres` ou `Lotado`), menor preço (`A partir de R$ X/dia`) e CTA *Ver detalhes*.
2. **`CampusVisualMap`**:
   - Mapa esquemático interativo em SVG representando os prédios da Cidade Universitária / Campi UFRJ (Reitoria/EBA, CT, Letras, CCMN, Praia Vermelha) posicionando os pontos cadastrados sem exigir internet ou chaves de terceiros.
   - Marcadores coloridos conforme disponibilidade (`availableCount > 0` em verde/azul, esgotados em cinza); clicar no pino exibe card flutuante de resumo com botão *Ver Ponto*.
3. **`PriceSummary`**: Detalhamento claro de Tamanho, Modalidade (`Diário 24h`, `Semanal 7d`, `Mensal 30d`), início, término previsto e Valor Total.
4. **`AccessButton`**:
   - Botão central da tela de Reserva Ativa com transição visual de destravamento:
     - *Repouso:* Ícone de cadeado fechado (*"Toque para Abrir Locker B-05"*).
     - *Processando:* Pulso animado (*"Validando autorização..."*).
     - *Aberto:* Card verde vibrante com cadeado aberto (*"Porta destravada! Guarde ou retire seus pertences"*), retornando ao estado pronto após alguns segundos para novas aberturas durante o período.
5. **`ReservationCard`**, **`LockerCard`**, **`AvailabilityBadge`**, **`LockerStatusBadge`** e **`ConfirmationDialog`**.

---

## 4. Refinamento das Telas por Jornada

### 4.1. Boas-Vindas e Autenticação (`pages/auth/`)
- **`WelcomePage` (`/`)**: Hero executivo apresentando o problema e a proposta de valor da **UniLocker UFRJ**, botões *Entrar* / *Criar Conta* e **Cards de Demonstração Guiada (Personas)** explicando o cenário de *Cintra (Recorrente)*, *Joaquim (Pontual)*, *Prof. Guilherme (Ofertador)* e *Admin*.
- **`LoginPage` & `RegisterPage`**: Formulários validados com seleção prática de vínculo universitário UFRJ.

### 4.2. Jornada do Estudante / Usuário (`pages/user/`)
- **Banner Flutuante em `UserMobileLayout`:** Quando houver reserva `Active`, exibe barra rápida acima do menu inferior (*"Locker B-05 Ativo • Restam Xh Ym — Abrir"*).
- **`ExplorePage` (`/app/explore`)**: Busca instantânea, filtro por campus, tamanho, modalidade e *Apenas disponíveis*, além da alternância **Lista / Mapa do Campus (`CampusVisualMap`)**.
- **`LocationDetailPage` (`/app/locations/:id`)**: Galeria de imagens, informações completas do espaço, regras de uso e seletor visual de **Tamanho + Período** calculando o preço na hora.
- **`CheckoutPage` (`/app/checkout`)**: Revisão limpa da reserva com `PriceSummary`, termos de uso/horário do ponto e botão **Confirmar e Ativar Locker** (ativação imediata para o MVP, redirecionando direto para `/app/reservations/:id`).
- **`ActiveReservationPage` (`/app/reservations/:id`)**: Destaque do compartimento (`B-05`), `useCountdown` em tempo real, `AccessButton` animado, histórico de aberturas, modal para **Prorrogar Aluguel** (`+1 dia`, `+1 semana`, `+1 mês`), modal `ConfirmationDialog` para **Finalizar Aluguel** (com checkbox obrigatório confirmando retirada dos objetos) e botão **Como chegar**.
- **`LockerLocatePage` (`/app/reservations/:id/locate`)**: Guia visual passo a passo dentro do prédio (Edifício, Bloco, Andar, Referência, Instruções de chegada e número do locker em destaque).
- **`MyReservationsPage` (`/app/reservations`)**: Abas *Ativas* e *Histórico* com visualização de comprovante resumido do aluguel.
- **`SupportPage` & `ProfilePage`**: Abertura e acompanhamento de chamados; edição de perfil e **Alternador de Área (Usuário ↔ Parceiro ↔ Admin)**.

### 4.3. Jornada do Ofertador / Parceiro (`pages/partner/`)
- **`PartnerApplyPage` (`/partner/apply`)**: Formulário enxuto para laboratórios, centros acadêmicos e estabelecimentos solicitarem parceria.
- **`PartnerDashboardPage` (`/partner/dashboard`)**: 6 KPIs visuais (Total de Lockers, Taxa de Ocupação, Disponíveis, Aluguéis Ativos, Receita Gerada e Ocorrências) + cards de *Meus Pontos*.
- **`CreateLocationPage` (`/partner/locations/new`)**: Wizard fluido em **4 etapas** (*1. Localização -> 2. Compartimentos -> 3. Preços e Horários -> 4. Prévia e Envio*) com persistência de rascunho em `localStorage`.
- **`ManageLockersPage` (`/partner/locations/:id/lockers`)**: Grade visual dos armários física-símile (mostrando portas Verdes/Azuis/Roxas por status), adição rápida de compartimentos e botões de *Manutenção / Bloqueio* (desabilitados com explicação clara quando o armário estiver `OCCUPIED`).
- **`PartnerReservationsPage` & `PartnerFinancialPage`**: Visão clara da **Monetização para o Pitch**: cards destacando *Receita Bruta Gerada*, *Taxa da Plataforma UniLocker (10%)* e *Ganho Líquido do Parceiro (90%)*, barras comparativas por ponto e por modalidade (`Diário`, `Semanal`, `Mensal`) e extrato de aluguéis.

### 4.4. Painel Administrativo Web (`pages/admin/`)
- **`AdminDashboardPage` (`/admin/dashboard`)**: Indicadores globais da operação UFRJ, GMV (Volume Bruto Transacionado), Receita da Plataforma (10%) e alertas de aprovações pendentes.
- **`AdminPartnersPage` & `AdminLocationsPage`**: Fluxos claros de curadoria institucional (*Aprovar / Recusar* parceiros e publicar novos pontos na rede).
- **`AdminUsersPage`, `AdminReservationsPage` & `AdminIncidentsPage`**: Gestão operacional, busca rápida e resolução de chamados com opção de liberação controlada de compartimentos retidos.

---

## 5. Critérios de Conclusão do Plano Frontend

- [ ] Nenhum arquivo fora de `/frontend` foi modificado.
- [ ] `npm.cmd run build` em `/frontend` compila com zero erros TypeScript.
- [ ] Funciona 100% sem internet/APIs externas durante apresentações.
- [ ] Layouts responsivos validados (Mobile-First para Usuário/Parceiro e Desktop Sidebar para Admin).
- [ ] Fluxo completo de pitch (*Trocar Persona -> Explorar Mapa/Lista -> Reservar em 1 clique -> Destravar Locker -> Ver Receita no Painel do Parceiro -> Aprovar Ponto no Admin*) testado e polido visualmente.
