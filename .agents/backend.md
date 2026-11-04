# **2\. Arquitetura Backend**

### **2.1. Objetivo**

O backend será responsável pelo funcionamento interno da plataforma, concentrando as regras de negócio, o processamento de reservas, a integração com pagamentos e o controle de acesso aos equipamentos físicos.

Ele deverá servir três interfaces:

* Aplicativo do usuário.  
* Painel do parceiro.  
* Painel administrativo.

A responsabilidade do backend é garantir que os dados e operações permaneçam consistentes, mesmo quando vários usuários acessam a plataforma simultaneamente.

### **2.2. Estrutura geral da arquitetura**

Para o MVP, recomenda-se um backend modular, com uma API centralizada e módulos separados por responsabilidade.

**Componentes:**

**API**

Ponto de comunicação entre frontend e servidor.

Recebe solicitações do aplicativo, valida permissões, executa regras de negócio e retorna os resultados.

**Serviço de autenticação**

Gerencia contas, sessões e permissões de acesso.

**Serviço de pontos e lockers**

Armazena informações sobre locais físicos, compartimentos e suas características.

**Serviço de reservas**

Controla disponibilidade, períodos de aluguel, criação, ativação, extensão e encerramento de reservas.

**\#Serviço de pagamentos**

Integra a plataforma com o provedor de pagamentos e registra transações.

**\#Serviço de acesso físico**

Valida autorizações e comunica comandos de abertura às fechaduras.

**Serviço de notificações**

Gerencia avisos sobre reservas, pagamentos, vencimentos e ocorrências.

**\#Serviço financeiro**

Registra receitas, comissões e valores destinados aos parceiros.

**Serviço de suporte**

Registra problemas e acompanha solicitações dos usuários.

A separação lógica desses módulos não exige microsserviços. Um monólito modular tende a ser mais simples e econômico para a primeira versão.

### **2.3. Arquitetura do banco de dados**

Recomenda-se utilizar um banco de dados relacional, pois o sistema terá relacionamentos claros entre usuários, pontos, lockers, reservas e pagamentos.

**Entidades principais**

| Entidade | Dados principais |
| :---- | :---- |
| **Users** | ID, nome, e-mail, autenticação, vínculo universitário |
| **Partners** | ID, organização, responsável, situação da aprovação |
| **Locations** | ID, parceiro, campus, prédio, andar, coordenadas, fotos e horários |
| **Lockers** | ID, ponto, identificação física, tamanho, estado operacional, dispositivo |
| **PricingPlans** | ID, categoria, período, valor, condições comerciais |
| **Reservations** | ID, usuário, locker, início, término, status e preço total |
| **Payments** | ID, reserva, valor, método, status e referência externa |
| **AccessEvents** | ID, reserva, locker, ação, resultado e data |
| **SupportTickets** | ID, usuário, reserva, categoria, descrição e status |
| **FinancialTransactions** | ID, pagamento, comissão, valor do parceiro e situação do repasse |

**Relacionamentos principais:**

* Um parceiro poderá gerenciar vários pontos.  
* Cada ponto terá vários lockers.  
* Cada locker poderá possuir várias reservas ao longo do tempo.  
* Cada reserva pertence a um usuário.  
* Uma reserva poderá possuir várias tentativas de pagamento.  
* Cada tentativa de abertura gera um evento de acesso.  
* Uma reserva poderá estar vinculada a ocorrências de suporte.

Fotografias e outros arquivos deverão ficar em armazenamento de objetos, mantendo-se no banco somente os metadados e endereços necessários.

### **2.4. Sistema de autenticação e permissões**

O backend deverá diferenciar os três perfis principais.

**Usuário:**

* Consultar lockers ofertados.  
* Criar e gerenciar as próprias reservas.  
* Consultar os próprios pagamentos.  
* Solicitar abertura de lockers autorizados.

**Parceiro:**

* Gerenciar pontos vinculados à sua organização.  
* Consultar aluguéis associados aos seus pontos.  
* Editar dados permitidos.  
* Consultar informações financeiras de sua organização.

**Administrador:**

* Aprovar parceiros e instalações.  
* Gerenciar os recursos autorizados da plataforma.  
* Consultar informações operacionais e registros de auditoria.  
* Executar procedimentos excepcionais de suporte.

A autorização deverá ser validada no servidor, independentemente dos botões ou telas disponíveis no frontend.

### **2.5. Sistema de disponibilidade**

Antes de apresentar um locker como disponível para determinada contratação, o backend verificará:

1. Se o ponto está ativo e autorizado.  
2. Se o locker está operacional.  
3. Se o compartimento está livre para o período solicitado.  
4. Se não existe uma reserva ou bloqueio temporário conflitante.  
5. Se o horário de acesso permite a utilização pretendida.

O sistema de reservas precisará utilizar transações e mecanismos de concorrência para evitar reservas simultâneas incompatíveis.

A disponibilidade mostrada no aplicativo será consultada novamente antes da confirmação da contratação.

### **2.6. Sistema de reservas**

**Fluxo de criação:**

1. O frontend envia locker ou categoria, período e identificação do usuário.  
2. O backend valida os dados.  
3. Verifica disponibilidade.  
4. Calcula o preço final.  
5. Cria uma reserva pendente e um bloqueio temporário.  
6. Solicita o pagamento.  
7. Recebe a confirmação do provedor.  
8. Ativa a reserva.  
9. Libera o acesso ao compartimento no período autorizado.

**Estados possíveis:**

| Estado | Significado |
| :---- | :---- |
| **PendingPayment** | Aguardando pagamento |
| **Active** | Aluguel ativo |
| **Completed** | Aluguel encerrado |
| **Cancelled** | Reserva cancelada |
| **Expired** | Reserva vencida |
| **PaymentFailed** | Pagamento não confirmado |
| **Incident** | Reserva com ocorrência que exige tratamento |

O backend deverá definir regras explícitas de transição entre esses estados.

### **2.7. Integração com pagamentos**

O aplicativo poderá aceitar Pix e cartão utilizando um provedor de pagamentos.

**Funcionamento:**

1. Backend cria a tentativa de cobrança.  
2. Provedor disponibiliza as informações necessárias ao pagamento.  
3. Frontend apresenta a interface apropriada.  
4. Usuário realiza a operação.  
5. Provedor envia a confirmação ao backend por webhook autenticado.  
6. Backend atualiza a transação e a reserva.

A confirmação deve ocorrer a partir de uma notificação validada do provedor ou de uma consulta segura ao seu serviço, e não apenas da mensagem exibida no celular do usuário.

O processamento deverá ser idempotente para evitar ativações ou cobranças duplicadas.

O backend também registrará taxas, comissões, estornos e repasses, quando aplicáveis.

### **2.8. Controle de acesso aos lockers**

Esta será uma das integrações mais importantes do projeto.

O objetivo é garantir que somente usuários autorizados possam solicitar a abertura do compartimento correspondente.

**Fluxo proposto:**

1. Usuário seleciona Abrir locker no aplicativo.  
2. Frontend envia a solicitação ao backend.  
3. Backend autentica o usuário.  
4. Verifica se a reserva está ativa.  
5. Confirma que o compartimento solicitado corresponde à reserva.  
6. Valida o equipamento e suas condições de operação.  
7. Envia o comando ao controlador físico.  
8. Recebe a resposta do dispositivo.  
9. Registra o resultado no histórico.  
10. Retorna o resultado ao aplicativo.

O backend deverá tratar separadamente a autorização enviada, a confirmação do controlador e a confirmação física de abertura, quando essa última estiver disponível.

**Segurança do acesso:**

* Comunicação autenticada com o dispositivo.  
* Comandos limitados temporalmente.  
* Registro das tentativas.  
* Proteção contra repetição de comandos.  
* Impedimento de acesso após o encerramento da autorização.  
* Procedimentos controlados para acesso emergencial.

Para o MVP, recomenda-se integrar inicialmente um único modelo de fechadura, facilitando os testes e a manutenção.

### **2.9. Gerenciamento dos pontos de lockers**

O backend disponibilizará recursos para:

* Criar pontos.  
* Atualizar informações.  
* Adicionar compartimentos.  
* Configurar preços.  
* Registrar equipamentos.  
* Atualizar status operacional.  
* Ativar ou desativar instalações.  
* Aprovar solicitações de publicação.

Um ponto não poderá ser publicado enquanto não tiver autorização administrativa e equipamentos adequadamente configurados.

### **2.10. Notificações**

O sistema deverá gerar notificações relacionadas a eventos relevantes.

Exemplos:

* Pagamento confirmado.  
* Reserva ativada.  
* Aluguel próximo do vencimento.  
* Aluguel vencido.  
* Problema detectado no locker.  
* Solicitação de suporte respondida.

As notificações poderão ser enviadas por push e e-mail, conforme o evento e as preferências do usuário.

### **2.11. API — Principais endpoints**

Exemplo de estrutura inicial:

**Autenticação**

* `POST /auth/register`  
* `POST /auth/login`  
* `GET /users/me`

**Pontos e lockers**

* `GET /locations`  
* `GET /locations/{id}`  
* `GET /locations/{id}/lockers`  
* `GET /lockers/{id}/availability`

**Reservas**

* `POST /reservations`  
* `GET /reservations/me`  
* `GET /reservations/{id}`  
* `POST /reservations/{id}/complete`  
* `POST /reservations/{id}/extend`

**Pagamentos**

* `POST /payments`  
* `GET /payments/{id}`  
* `POST /webhooks/payments`

**Acesso**

* `POST /reservations/{id}/unlock`  
* `GET /reservations/{id}/access-events`

**Parceiros**

* `POST /partners/applications`  
* `POST /partner/locations`  
* `PATCH /partner/locations/{id}`  
* `GET /partner/dashboard`

**Administração**

* `GET /admin/partners/pending`  
* `POST /admin/locations/{id}/approve`  
* `GET /admin/incidents`

Esses endpoints representam uma proposta inicial e poderão ser refinados durante a modelagem da API.

### **2.12. Infraestrutura e tecnologias sugeridas**

Uma opção de stack para o MVP seria:

* **Backend:** Node.js com TypeScript e NestJS.  
* **Banco de dados:** SQLite.  
* **Autenticação:** serviço de identidade gerenciado ou autenticação segura implementada no backend.

\#Todo armazenamento deve ser, no momento, local, e todo pagamento e comunicação com fechaduras deve ser “Mock”, ser apenas um exemplo, sem implicações na vida real

* **Armazenamento de imagens:** armazenamento de objetos compatível com S3.  
* **Infraestrutura:** serviço de hospedagem em nuvem.  
* **Notificações:** serviço de push.  
* **Pagamento:** provedor com suporte a Pix e cartão.  
* **Comunicação com fechaduras:** API ou gateway compatível com o hardware escolhido.

A seleção definitiva das tecnologias de controle de acesso dependerá do equipamento físico adquirido.

### **2.13. Requisitos técnicos essenciais**

* HTTPS e autenticação para todas as operações protegidas.  
* Controle de acesso por perfil e por recurso.  
* Validação de dados no servidor.  
* Prevenção de conflitos de reserva.  
* Logs de pagamentos, alterações administrativas e acessos físicos.  
* Tratamento de falhas de rede e indisponibilidade dos dispositivos.  
* Backups e monitoramento da infraestrutura.  
* Proteção de informações pessoais.  
* Testes automatizados das regras de reserva e acesso.  
* Processamento seguro de webhooks.  
* Monitoramento de erros e disponibilidade dos serviços.

