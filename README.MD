# UniLocker UFRJ

Plataforma digital de aluguel de guarda-volumes (*lockers*) voltada à comunidade universitária da UFRJ — trabalho da disciplina de **Empreendedorismo**.

---

## Síntese
O **UniLocker** conecta **ofertadores de espaços** no campus (laboratórios, centros acadêmicos, cantinas, restaurantes e departamentos) a **estudantes, professores e funcionários** que precisam armazenar pertences (notebooks, mochilas, materiais) com segurança, conveniência e flexibilidade (**diário, semanal ou mensal**).

---

## Personas e Histórias de Usuário
- **Prof. Guilherme (Ofertador):** Coordena o *Laboratório de Artes Modernas (EBA)* e disponibiliza compartimentos em espaço ocioso para arrecadar recursos para materiais dos alunos (recebendo 90% da receita gerada).
- **Cintra (Estudante — Uso Recorrente):** Mora longe do campus e aluga um locker semanal/mensal no *CT* para não transportar o notebook da empresa diariamente no trajeto.
- **Joaquim (Estudante — Uso Pontual):** Vai participar de um evento/festa universitária na *Letras*, contrata uma diária pelo celular, destrava o compartimento pelo app e retira seus pertences ao final.
- **Administração UniLocker:** Curadoria institucional que aprova novos ofertadores e pontos antes da publicação e atende ocorrências operacionais.

---

## Casos de Uso Principais (MVP Demonstrável)
1. **Estudante / Usuário:** Explorar pontos por campus/tamanho, visualizar detalhes e preços, reservar com ativação imediata, destravar o locker pelo app, localizar o compartimento no prédio, prorrogar/encerrar aluguel e acionar suporte.
2. **Parceiro / Ofertador:** Solicitar credenciamento, cadastrar pontos em 4 etapas (local, compartimentos, preços e regras), gerenciar manutenção/bloqueio de lockers e acompanhar receitas (modelo **90% Parceiro / 10% Taxa UniLocker**).
3. **Administrador:** Visão executiva de ocupação e GMV, aprovação de parceiros e pontos, auditoria de reservas e central de ocorrências.

---

## Estrutura do Repositório e Desenvolvimento Paralelo

```text
UniLocker/
├── .agents/                         # Documentação e Planos de Implementação
│   ├── agents.md                    # Visão geral de produto e regras de negócio
│   ├── backend.md                   # Diretrizes de arquitetura Backend
│   ├── frontend.md                  # Diretrizes de arquitetura Frontend
│   ├── implementation.md            # Plano 1 (CONCLUÍDO): Base + Contratos Congelados + Casca
│   ├── implementation_frontend.md   # Plano 2 (PARALELO): Evolução autônoma em /frontend
│   ├── implementation_backend.md    # Plano 3 (PARALELO): Evolução autônoma em /backend
│   └── tasks.md                     # Checklist mestre de acompanhamento
├── backend/                         # API NestJS + TypeScript (http://localhost:3000/api)
└── frontend/                        # Web App React + Vite + Tailwind (http://localhost:5173)
```

> **Para a equipe / agentes de IA:**
> A fundação e os contratos de API (`backend/src/common/contracts/api.contracts.ts` e `frontend/src/types/api.ts`) já estão prontos e congelados.
> - Quem for desenvolver o **Frontend** deve seguir [`.agents/implementation_frontend.md`](./.agents/implementation_frontend.md) atuando apenas em `/frontend`.
> - Quem for desenvolver o **Backend** deve seguir [`.agents/implementation_backend.md`](./.agents/implementation_backend.md) atuando apenas em `/backend`.

---

## Como Executar Localmente

Pré-requisitos: **Node.js 20 ou mais novo** e **Git**. No PowerShell do Windows com restrição de scripts, use `npm.cmd` no lugar de `npm`.

### 1. Backend (`http://localhost:3000/api`)
```bash
cd backend
npm install        # também gera o cliente do Prisma
npm run setup      # cria o .env, o banco SQLite e os dados de demonstração
npm run start:dev
```
O `npm run setup` pode ser rodado de novo a qualquer momento (por exemplo, depois de um `git pull` que traga migrações novas). Pare o backend antes, porque o banco fica travado enquanto ele roda.
Também troque os .env.example para ter como nome .env

### 2. Frontend (`http://localhost:5173`)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```


### Problemas comuns
- **Backend fecha com "Configure JWT_SECRET"**: falta o `backend/.env`. Rode `npm run setup`.
- **Erros de TypeScript sobre `@prisma/client`** ou **"Erro interno do servidor"**: o cliente do Prisma ou o banco estão desatualizados. Pare o backend e rode `npm run setup`.
- **"database is locked"**: o backend ainda está rodando. Pare com Ctrl+C e repita o comando.
- **Tela sem estilo** depois de instalar pacotes: pare o `npm run dev` e rode de novo.
- **Porta 3000 ou 5173 ocupada**: feche o outro processo que usa a porta.

### Acesso rápido (apresentação) — senha padrão `123456`
Na tela inicial, o menu ⋮ no canto do login entra direto como:
- **Aluno (Cintra):** `cintra@poli.ufrj.br`
- **Professor/Parceiro (Prof. Guilherme):** `guilherme@eba.ufrj.br`

Outras contas para testes: `joaquim@letras.ufrj.br` (aluno) e `admin@unilocker.ufrj.br` (administrador).
