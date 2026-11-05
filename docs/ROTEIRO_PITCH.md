# Roteiro Executivo de Apresentação — UniLocker UFRJ
## Pitch para Investidores (Duração: 5 a 7 minutos)

> **Proposta de Valor Central:** O primeiro marketplace descentralizado de guarda-volumes inteligentes para comunidades universitárias. Conectamos quem tem espaço ocioso no campus (laboratórios, centros acadêmicos e cantinas) a quem precisa de conveniência e segurança para seus pertences (estudantes e pesquisadores), sem custos com aquisição de imóveis.

---

### Visão Geral dos Tempos do Pitch

| Bloco | Tema | Persona / Tela | Duração Estimada |
| :--- | :--- | :--- | :--- |
| **1. A Dor & Oportunidade** | O problema da mobilidade e segurança no campus | Slide inicial ou Home `/` | 00:00 – 01:00 (1 min) |
| **2. A Solução & Modelo** | Como funciona o marketplace (divisão 90/10) | Home `/` e mapa | 01:00 – 02:00 (1 min) |
| **3. Demonstração: Estudante Recorrente** | Caso Cintra — Acesso rápido e destravamento | Cintra (`/app/explore` e `/app/reservations/...`) | 02:00 – 03:00 (1 min) |
| **4. Demonstração: Estudante Pontual** | Caso Joaquim — Reserva instantânea e devolução | Joaquim (`/app/explore` e `/app/checkout`) | 03:00 – 04:00 (1 min) |
| **5. Demonstração: Ofertador Parceiro** | Caso Prof. Guilherme — Painel, lockers e repasse 90% | Guilherme (`/partner/financial`) | 04:00 – 05:00 (1 min) |
| **6. Demonstração: Governança Admin** | Supervisão de GMV e aprovação institucional | Admin (`/admin/dashboard` e `/admin/partners`) | 05:00 – 06:00 (1 min) |
| **7. Escala, Métricas & Perguntas** | Expansão multi-campus e encerramento | Conclusão | 06:00 – 07:00 (1 min) |

---

## Roteiro Passo a Passo

### Bloco 1: A Dor e a Oportunidade (0:00 – 1:00)
- **O que falar:**
  > *"Quantos de vocês já tiveram que passar o dia inteiro na universidade carregando uma mochila pesada com notebook de trabalho, casaco, livros e equipamentos? Na Ilha do Fundão e na Praia Vermelha, mais de 60 mil pessoas circulam diariamente. Alunos que trabalham em estágio precisam levar máquinas da empresa e ficam expostos a furtos, chuva e desconforto entre aulas, laboratórios e festas acadêmicas.*
  > *Ao mesmo tempo, dezenas de laboratórios e centros acadêmicos possuem áreas ociosas e buscam desesperadamente fontes de recursos para comprar insumos e materiais para seus projetos."*
- **O que mostrar:**
  - Página inicial do UniLocker (`http://localhost:5173/`) destacando os pilares: **Perto da sua aula**, **Acesso pelo celular** e **Renda para espaços parceiros**.

---

### Bloco 2: O Modelo de Negócios (1:00 – 2:00)
- **O que falar:**
  > *"A UniLocker resolve isso com um modelo de **Marketplace de Espaços sem CAPEX Imobiliário**. Nós não compramos imóveis e nem arcamos com reformas caras. Nós empoderamos os próprios ofertadores locais — como professores, chefias de departamento e grêmios estudantis — a monetizarem seus espaços.*
  > *A cada aluguel contratado, **90% da receita fica diretamente com o ofertador** e **10% é retido pela UniLocker** como taxa de tecnologia e governança da plataforma. O modelo incentiva o parceiro a cuidar do espaço enquanto nós garantimos a rede, o software e a segurança."*
- **O que mostrar:**
  - Explicar o seletor de personas no topo direito da tela, demonstrando como a plataforma atende aos diferentes papéis.

---

### Bloco 3: Persona 1 — Cintra: Aluguel Recorrente (2:00 – 3:00)
- **Perfil:** Estudante de Engenharia que faz estágio remoto e precisa deixar o computador seguro no campus.
- **Passos na tela:**
  1. No seletor de personas, clique em **Cintra**.
  2. O sistema entra automaticamente na área do aluno (`/app/explore`).
  3. Destaque o **Mapa Esquemático Interativo da UFRJ** em SVG puro (100% offline), mostrando os polos do CT, Reitoria/EBA, Letras e CCMN com pins dinâmicos de vagas livres.
  4. Mostre o **Banner Flutuante** de reserva ativa na base da tela com o tempo restante ao vivo.
  5. Clique no banner ou na reserva: entra em `/app/reservations/...`.
  6. Mostre o **cronômetro regressivo com segundos ao vivo**.
  7. Clique no botão de destravamento:
     > *"Com apenas um toque, o aluno comanda a abertura eletrônica do armário. Vejam a animação de destravamento instantâneo e o registro de auditoria no servidor."*
  8. Clique em **Como chegar** para mostrar o guia de localização indoor passo a passo (Prédio, Bloco, Andar, Sala e Ponto de Referência).

---

### Bloco 4: Persona 2 — Joaquim: Aluguel Pontual (3:00 – 4:00)
- **Perfil:** Estudante de Letras que veio para um evento/festa universitária e só precisa de 24h para guardar a mochila.
- **Passos na tela:**
  1. No seletor de personas, selecione **Joaquim**.
  2. Vá em **Explorar** (`/app/explore`) e selecione o ponto **Ateliê Aberto EBA**.
  3. Veja a galeria, regras de uso e a seleção de tamanho (Médio) e período (Diário — 24h).
  4. Clique no botão **Reservar por R$ 8,00**.
  5. Na tela de Checkout, destaque a transparência do resumo de preços e clique em **Confirmar e Ativar Locker**.
  6. A reserva é ativada instantaneamente sem fricção:
     > *"O aluno não precisa de cartão físico ou fila de guichê; o locker é alocado, ele destrava no celular e, ao final do evento, finaliza o aluguel confirmando que retirou seus pertences."*
  7. Demonstre a finalização com o modal de confirmação.

---

### Bloco 5: Persona 3 — Prof. Guilherme: Ofertador Parceiro (4:00 – 5:00)
- **Perfil:** Professor responsável pelo Laboratório de Artes Modernas da EBA.
- **Passos na tela:**
  1. No seletor de personas, selecione **Prof. Guilherme**.
  2. O sistema redireciona para o **Painel do Parceiro** (`/partner/dashboard`).
  3. Aponte para os KPIs operacionais: Total de lockers, Ocupação em tempo real e Aluguéis ativos.
  4. Clique em **Gerenciar lockers**: mostre a **grade física interativa de armários**, destacando que armários em uso por estudantes têm suas portas bloqueadas contra manutenção acidental.
  5. Acesse a aba **Financeiro** (`/partner/financial`):
     > *"Aqui está o motor do negócio. O professor visualiza exatamente quanto o laboratório arrecadou, os 10% da UniLocker e os 90% líquidos que ele recebe para investir em tintas, telas e equipamentos para as aulas dos alunos. A transparência é total."*
  6. Mostre os gráficos comparativos por ponto e por modalidade (`Diário`, `Semanal`, `Mensal`).

---

### Bloco 6: Persona 4 — Administrador: Governança & Escala (5:00 – 6:00)
- **Perfil:** Gestor da plataforma UniLocker.
- **Passos na tela:**
  1. No seletor de personas, selecione **Admin**.
  2. O sistema abre o layout corporativo com menu lateral (`/admin/dashboard`).
  3. Aponte os números executivos: GMV transacionado, comissão acumulada de 10% da UniLocker e chamados de suporte.
  4. Vá em **Curadoria de Parceiros** (`/admin/partners`): aprove uma nova solicitação (ex.: Cantina do CCMN) com 1 clique.
  5. Vá em **Pontos e Compartimentos** (`/admin/locations`): publique um novo ponto aguardando revisão.
  6. Vá em **Central de Ocorrências** (`/admin/incidents`): mostre a auditoria de chamados com capacidade de liberar com segurança compartimentos retidos após vistoria humana.

---

### Bloco 7: Tração, Expansão e Encerramento (6:00 – 7:00)
- **O que falar:**
  > *"O MVP da UniLocker comprova a viabilidade técnica e financeira do marketplace na comunidade acadêmica. O software opera 100% integrado, modular e seguro.*
  > *Nossa rota de crescimento prevê a expansão da Cidade Universitária para o campus da Praia Vermelha, e posteriormente para outras universidades públicas e privadas do Rio de Janeiro (UFF, UERJ, PUC-Rio).*
  > *Estamos abrindo espaço para parceiros investidores que desejam viabilizar a implantação dos kits eletrônicos de fechaduras nos primeiros 10 polos autorizados. Muito obrigado!"*

---

### Dicas para o Apresentador
1. **Zero dependência de rede:** O mapa em SVG e os dados rodam 100% no servidor local. Caso o auditório fique sem Wi-Fi, tudo continua funcionando.
2. **Senha padrão:** Todas as contas de teste usam a senha `123456`.
3. **Seletor rápido:** Use o `DemoPersonaSwitcher` no topo da tela para trocar de usuário instantaneamente sem precisar passar pela tela de login.
4. **Resoluções:** O aplicativo foi otimizado tanto para proporção mobile (como no celular de um estudante) quanto para telas amplas de notebook e projetor (como no painel do administrador).
