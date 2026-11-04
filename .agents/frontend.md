
# **3\. Arquitetura Frontend**

### **3.1. Objetivo**

O frontend será responsável pela interação dos usuários com a plataforma.

Deverá permitir que as jornadas principais sejam realizadas de forma simples, especialmente a localização, a reserva e o acesso a um locker.

A arquitetura será organizada em três experiências:

1. Aplicativo do usuário.  
2. Área do parceiro.  
3. Painel administrativo web.

Para o MVP, as experiências de usuário e parceiro poderão coexistir no mesmo aplicativo, com navegação e permissões diferentes.

## **3.2. Estrutura de navegação**

**Aplicativo — Usuário**

Barra de navegação inferior:

* Explorar  
* Minhas reservas  
* Ajuda  
* Perfil

**Aplicativo — Parceiro**

Barra ou menu específico:

* Painel  
* Meus pontos  
* Financeiro  
* Perfil

Usuários que possuam os dois perfis poderão alternar entre as áreas por um seletor de perfil.

**Administração**

Interface web com menu lateral:

* Visão geral  
* Usuários  
* Parceiros  
* Pontos e lockers  
* Reservas  
* Pagamentos  
* Ocorrências  
* Configurações

### **3.3. Tela de boas-vindas e autenticação**

**Objetivo:** identificar o usuário e iniciar sua experiência.

**Elementos:**

* Logotipo.  
* Mensagem introdutória.  
* Botão Entrar.  
* Botão Criar conta.  
* Recuperação de senha.

O cadastro deverá solicitar as informações mínimas necessárias, evitando etapas desnecessárias.

Após a autenticação, o aplicativo verifica as permissões da conta e apresenta a navegação correspondente.

### **3.4. Tela inicial do usuário — Explorar**

Esta será a principal tela de descoberta de lockers.

**Componentes:**

* Seletor de campus.  
* Campo de busca.  
* Filtros de preço, tamanho e duração.  
* Alternância Mapa / Lista.  
* Marcadores de pontos.  
* Cards com resumo dos locais.

**Card de ponto:**

> Laboratório A — Bloco B

> 5 lockers disponíveis  
> A partir de R\$ X/dia  
> Térreo — Próximo à entrada

> Ver detalhes

Os cards deverão destacar principalmente localização, disponibilidade e preço.

Os resultados poderão ser filtrados conforme as preferências do usuário.

### **3.5. Tela de mapa**

A visualização em mapa permitirá identificar a distribuição dos pontos no campus.

**Funcionamento:**

* Cada marcador representa um ponto físico.  
* Ao tocar no marcador, o usuário visualiza um resumo.  
* Ao selecionar o resumo, abre os detalhes completos.  
* Pontos sem disponibilidade poderão ser diferenciados visualmente.

**Informações de localização:**

* Campus.  
* Prédio e bloco.  
* Andar.  
* Sala ou corredor.  
* Referência visual.  
* Fotografias da entrada.  
* Orientações para chegar.

O MVP poderá utilizar um mapa externo para identificar os prédios e complementar com instruções textuais para localizar os compartimentos dentro deles.

### **3.6. Tela de detalhes do ponto**

**Objetivo:** fornecer as informações necessárias antes da contratação.

**Elementos:**

* Galeria de fotografias.  
* Nome do ponto.  
* Organização responsável.  
* Descrição da localização.  
* Horários de acesso.  
* Lista de tamanhos disponíveis.  
* Preços por período.  
* Quantidade de compartimentos livres.  
* Regras de utilização.  
* Botão Reservar locker.

**Seleção do compartimento:**

O usuário escolhe o tamanho e a duração do aluguel.

O sistema poderá atribuir automaticamente um compartimento compatível, simplificando a experiência inicial.

### **3.7. Tela de reserva**

**Objetivo:** permitir que o usuário revise as condições antes de efetuar o pagamento.

**Informações exibidas:**

* Ponto selecionado.  
* Identificação ou categoria do locker.  
* Tamanho.  
* Modalidade de aluguel.  
* Data e horário de início.  
* Data e horário de término.  
* Valor total.  
* Regras de cancelamento.  
* Condições de acesso.

**Ação principal:** Confirmar e pagar.

O aplicativo deverá apresentar indicadores de carregamento durante a verificação da disponibilidade e evitar o envio duplicado da mesma operação.

*Por hora, vai ser MOCK, não vai fazer o pagamento de fato: aceita o pagamento de qualquer forma*

### **3.8. Tela de pagamento**

Após a confirmação dos dados, o frontend apresenta as formas de pagamento disponíveis.

**Pix:**

* QR Code ou código de pagamento.  
* Valor da transação.  
* Identificação da reserva.  
* Indicador de aguardando confirmação.

**Cartão:**

* Interface segura disponibilizada pelo provedor.  
* Resumo do valor.  
* Confirmação do resultado.

**Estados da interface:**

* Aguardando pagamento.  
* Pagamento confirmado.  
* Pagamento não concluído.  
* Pagamento expirado.  
* Erro de comunicação.

A tela deverá consultar ou receber a atualização de status do backend, sem assumir que a operação foi concluída apenas porque o usuário retornou da interface de pagamento.

### **3.9. Tela de reserva ativa**

Esta será uma das telas mais importantes do aplicativo.

**Cabeçalho:**

> Seu locker está ativo

> Laboratório A — Bloco B  
> Compartimento B-05  
> Plano diário  
> Tempo restante: 15h 30min

**Ações principais:**

* Abrir locker.  
* Como chegar.  
* Prorrogar aluguel, quando disponível.  
* Finalizar aluguel.  
* Preciso de ajuda.

**Comportamento do botão Abrir:**

Ao pressionar o botão:

1. A interface apresenta estado de processamento.  
2. Envia o comando ao backend.  
3. Aguarda a confirmação do serviço.  
4. Exibe o resultado.

Mensagens possíveis:

* Abertura confirmada.  
* Não foi possível contatar o equipamento.  
* Sua reserva não permite esta ação.  
* Não foi possível confirmar a abertura. Consulte o suporte.

O aplicativo não deverá afirmar que a porta abriu antes de receber uma confirmação adequada.

### **3.10. Tela de localização do locker**

Esta tela permitirá que o usuário encontre o equipamento após a contratação.

**Elementos:**

* Nome do ponto.  
* Localização no mapa.  
* Edifício, bloco e andar.  
* Número do compartimento.  
* Fotografia do local.  
* Instruções de acesso.

**Exemplo:**

> Laboratório A — Bloco B

> Vá até a entrada principal do bloco. No térreo, siga pelo corredor à direita da recepção. Os lockers estão próximos ao laboratório de informática.

> Seu compartimento: B-05

Também poderá existir um botão para abrir orientações de rota até o prédio em um aplicativo de mapas.

### **3.11. Tela de encerramento do aluguel**

Ao selecionar Finalizar aluguel, o frontend deverá apresentar uma confirmação.

**Mensagem sugerida:**

> Deseja finalizar seu aluguel?

> Confirme que retirou todos os seus pertences e fechou a porta do compartimento.

Depois da solicitação:

1. Aplicativo envia a ação ao backend.  
2. Servidor executa as verificações necessárias.  
3. O aluguel é encerrado quando as condições forem atendidas.  
4. A interface apresenta a confirmação.  
5. A reserva é movida para o histórico.

Se não for possível confirmar o fechamento, o aplicativo deverá orientar o usuário em vez de informar uma finalização inexistente.

### **3.12. Tela Minhas reservas**

Organizada em duas áreas.

**Reservas ativas:**

* Nome do ponto.  
* Compartimento.  
* Situação.  
* Tempo restante.  
* Acesso rápido às ações.

**Histórico:**

* Local utilizado.  
* Período.  
* Valor pago.  
* Situação final.  
* Comprovante.

A reserva ativa poderá receber destaque na página inicial, permitindo acesso rápido ao controle do locker.

### **3.13. Área do parceiro — Dashboard**

A área do parceiro deverá apresentar indicadores operacionais e financeiros.

**Cards principais:**

* Total de lockers cadastrados.  
* Compartimentos ocupados.  
* Compartimentos disponíveis.  
* Aluguéis ativos.  
* Receita do período.  
* Ocorrências pendentes.

Abaixo dos indicadores, o parceiro visualizará os pontos cadastrados e seus respectivos estados.

**Ações principais:**

* Criar novo ponto.  
* Gerenciar lockers.  
* Visualizar aluguéis.  
* Consultar receitas.

### **3.14. Tela Criar ponto de lockers**

O cadastro será organizado em etapas.

**Etapa 1 — Localização**

* Nome.  
* Campus.  
* Prédio.  
* Bloco.  
* Andar.  
* Sala ou corredor.  
* Coordenadas.  
* Fotografias.  
* Instruções de acesso.

**Etapa 2 — Equipamentos**

* Número de compartimentos.  
* Identificadores.  
* Tamanhos.  
* Tipos de fechadura.  
* Informações de integração.

**Etapa 3 — Preços**

* Valor diário.  
* Valor semanal.  
* Valor mensal.  
* Horários disponíveis.  
* Regras de utilização.

**Etapa 4 — Revisão**

* Prévia da página do ponto.  
* Conferência das informações.  
* Envio para aprovação.

O formulário poderá salvar um rascunho para evitar perda de dados durante o cadastro.

### **3.15. Tela de gerenciamento dos lockers**

O parceiro seleciona um ponto e visualiza seus compartimentos.

**Exemplo:**

| Compartimento | Tamanho | Situação |
| ----- | ----- | ----- |
| A-01 | Pequeno | Disponível |
| A-02 | Médio | Ocupado |
| A-03 | Médio | Disponível |
| A-04 | Grande | Manutenção |

**Ações permitidas:**

* Consultar detalhes.  
* Alterar informações autorizadas.  
* Solicitar manutenção.  
* Bloquear novas reservas.  
* Consultar histórico operacional.

A interface deverá deixar claro quando uma alteração não pode ser realizada devido à existência de uma reserva ativa.

### **3.16. Tela financeira do parceiro**

Deverá disponibilizar informações sobre o desempenho dos pontos administrados.

**Indicadores:**

* Arrecadação total.  
* Comissão da plataforma.  
* Valor previsto para repasse.  
* Valores já repassados.  
* Quantidade de aluguéis.  
* Receita por ponto.  
* Receita por modalidade.

Uma listagem permitirá consultar o histórico de transações e a situação dos repasses.

### **3.17. Painel administrativo web**

A interface administrativa será orientada à operação diária.

**Dashboard geral:**

* Número de usuários.  
* Parceiros ativos.  
* Pontos cadastrados.  
* Lockers operacionais.  
* Aluguéis ativos.  
* Receita e incidentes.

**Gestão de parceiros:**

* Solicitações pendentes.  
* Dados institucionais.  
* Aprovação ou rejeição.  
* Histórico de alterações.

**Gestão dos pontos:**

* Instalações cadastradas.  
* Equipamentos vinculados.  
* Estado operacional.  
* Manutenções.

**Gestão de reservas e pagamentos:**

* Busca por usuário, ponto e período.  
* Status.  
* Histórico de transações.  
* Ocorrências.

**Suporte:**

* Lista de chamados.  
* Prioridade.  
* Locker associado.  
* Situação do atendimento.  
* Histórico de ações.

### **3.18. Organização técnica do frontend**

**Tecnologias sugeridas:**

* React Native com Expo para o aplicativo mobile.  
* TypeScript como linguagem.  
* React ou Next.js para o painel administrativo.  
* Biblioteca de componentes para padronização visual.  
* Integração com API REST.  
* Serviço de mapas compatível com o público e a região atendida.

**Organização de módulos:**

* `auth` — Autenticação e cadastro.  
* `explore` — Busca, filtros e mapa.  
* `locations` — Detalhes dos pontos.  
* `reservations` — Criação e acompanhamento de aluguéis.  
* `payments` — Pagamento e confirmação.  
* `access` — Controle de abertura.  
* `partner` — Área de parceiros.  
* `support` — Suporte e ocorrências.  
* `profile` — Perfil e configurações.

Cada módulo poderá conter suas telas, componentes, serviços de API, tipos e validações.

### **3.19. Componentes reutilizáveis**

Para manter consistência visual, recomenda-se criar componentes compartilhados.

**Exemplos:**

* `LockerCard`: resumo de um compartimento.  
* `LocationCard`: informações de um ponto.  
* `AvailabilityBadge`: indicação de disponibilidade.  
* `PriceSummary`: detalhamento do preço.  
* `ReservationCard`: resumo de uma reserva.  
* `LockerStatus`: situação operacional.  
* `AccessButton`: ação de abertura.  
* `LocationMap`: mapa dos pontos.  
* `PaymentStatus`: situação do pagamento.  
* `ConfirmationDialog`: confirmação de ações.

### **3.20. Requisitos de experiência do usuário**

O frontend deverá seguir alguns princípios.

**Clareza**

Preços, disponibilidade, períodos e condições de acesso precisam ser compreensíveis.

**Poucas etapas**

O usuário deverá conseguir encontrar e reservar um locker com o mínimo de interações necessárias.

**Feedback imediato**

Toda operação importante deverá apresentar carregamento, confirmação ou erro.

**Acesso rápido**

O botão de abertura do locker precisa estar facilmente acessível durante uma reserva ativa.

**Confiabilidade**

O frontend nunca deverá apresentar uma operação como concluída sem confirmação do backend.

**Responsividade e acessibilidade**

Os componentes deverão funcionar em diferentes tamanhos de tela, com textos legíveis, contraste adequado e controles acessíveis.

### **3.21. Escopo frontend para o MVP**

**Telas prioritárias do usuário:**

1. Login e cadastro.  
2. Explorar lockers.  
3. Mapa e lista.  
4. Detalhes do ponto.  
5. Reserva.  
6. Pagamento.  
7. Reserva ativa e abertura.  
8. Localização do locker.  
9. Histórico e perfil.  
10. Suporte.

**Telas prioritárias do parceiro:**

1. Dashboard.  
2. Cadastro de ponto.  
3. Gerenciamento dos lockers.  
4. Listagem de aluguéis.  
5. Resumo financeiro.

**Telas prioritárias administrativas:**

1. Dashboard.  
2. Aprovação de parceiros.  
3. Gestão de pontos e equipamentos.  
4. Consulta de reservas e pagamentos.  
5. Controle de ocorrências.