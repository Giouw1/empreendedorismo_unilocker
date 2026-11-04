# **Projeto Locker — Planejamento do MVP**

# **1\. Visão Geral do Projeto**

## **1.1. Descrição do projeto**

O projeto consiste no desenvolvimento de uma plataforma digital de aluguel de guarda-volumes (lockers), inicialmente voltada à comunidade universitária da UFRJ.

A proposta é conectar **ofertadores de lockers**, como laboratórios, professores, restaurantes, lanchonetes e organizações estudantis, a **usuários** que precisam armazenar seus pertences temporariamente.

Pelo aplicativo, será possível encontrar lockers disponíveis, consultar localização e preços, realizar reservas, efetuar pagamentos e acessar os compartimentos alugados. Os ofertadores poderão cadastrar seus espaços, gerenciar os lockers e acompanhar a receita gerada.

## **1.2. Problema e proposta de valor**

Estudantes e funcionários frequentemente passam longos períodos na universidade, transportando notebooks, mochilas e outros objetos pessoais. Em determinadas situações, como aulas, atividades esportivas e eventos, carregar esses pertences torna-se inconveniente ou arriscado.

A plataforma busca oferecer:

* **Segurança:** armazenamento em compartimentos com acesso controlado.  
* **Conveniência:** lockers próximos aos locais de estudo, trabalho e lazer.  
* **Flexibilidade:** aluguel diário, semanal ou mensal.  
* **Facilidade:** localização, reserva, pagamento e acesso pelo aplicativo.  
* **Oportunidade para ofertadores:** geração de receita por meio da disponibilização de espaços e equipamentos.

## **1.3. Perfis da plataforma**

| Perfil | Descrição | Principais funcionalidades |
| :---- | :---- | :---- |
| **Usuário** | Alunos, professores e funcionários que desejam armazenar pertences | Buscar, reservar, pagar, acessar lockers e acompanhar aluguéis |
| **Ofertador** | Organizações ou responsáveis por espaços e equipamentos | Cadastrar pontos, configurar preços, gerenciar disponibilidade e consultar receitas |
| **Administrador** | Responsável pela operação da plataforma | Aprovar ofertadores, supervisionar reservas, pagamentos, equipamentos e suporte |

## **1.4. Modelo de funcionamento**

A plataforma será organizada em dois elementos:

* **Ponto de lockers:** local físico onde os guarda-volumes estão instalados, como um laboratório ou restaurante. Contém localização, fotos, horários, regras e informações do responsável.  
* **Locker individual:** compartimento pertencente a um ponto, identificado por número, tamanho, preço e disponibilidade.

Cada ponto poderá oferecer diversos lockers, alugados individualmente.

O usuário poderá visualizar os pontos em um mapa, escolher um compartimento disponível e contratar um dos seguintes períodos:

| Modalidade | Duração |
| :---- | :---- |
| **Diário** | 24 horas |
| **Semanal** | 7 dias |
| **Mensal** | Período mensal definido |

Os preços poderão variar conforme tamanho, localização e infraestrutura. A plataforma poderá receber uma comissão sobre cada aluguel, repassando o valor restante ao ofertador.

## **1.5. Histórias de usuário**

### **Guilherme — Professor e ofertador**

Guilherme possui um laboratório de artes modernas com espaço disponível. Para arrecadar recursos destinados à compra de materiais para seus alunos, deseja disponibilizar lockers. Pelo aplicativo, poderá cadastrar o espaço, definir preços e acompanhar os aluguéis, mediante autorização da universidade.

### **Cintra — Estudante com necessidade recorrente**

Cintra mora longe da universidade e percorre um trajeto que considera perigoso. Como utiliza um computador da empresa, gostaria de evitar transportá-lo diariamente. Por isso, busca um locker próximo ao seu local de estudo para alugá-lo semanalmente ou mensalmente.

### **Joaquim — Estudante com necessidade pontual**

Joaquim participará de uma festa universitária e deseja guardar seus pertences durante o evento. Pelo aplicativo, encontra um locker próximo, contrata uma diária e retira seus objetos ao final da festa.

Essas histórias representam os três cenários centrais do projeto: **oferta de espaços, armazenamento recorrente e armazenamento pontual.**

## **1.6. Casos de uso**

| Perfil | Casos de uso principais |
| :---- | :---- |
| **Usuário** | Cadastrar-se, buscar lockers, consultar ofertas, reservar, pagar, localizar e abrir compartimentos, prorrogar ou finalizar aluguéis e solicitar suporte |
| **Ofertador** | Cadastrar-se, criar pontos, registrar lockers, configurar preços, acompanhar disponibilidade, aluguéis e receitas e solicitar manutenção |
| **Administrador** | Aprovar ofertadores e pontos, gerenciar contas, monitorar equipamentos, pagamentos e reservas e resolver ocorrências |

### **Jornada de aluguel**

1. O usuário encontra um ponto de lockers pelo mapa ou lista.  
2. Consulta os preços, tamanhos, disponibilidade e horários.  
3. Seleciona o período e realiza o pagamento.  
4. Recebe a localização e identificação do compartimento.  
5. Abre o locker pelo aplicativo e guarda seus pertences.  
6. Pode acessá-lo novamente durante o aluguel.  
7. Retira os objetos e finaliza a utilização.

## **1.7. Regras gerais**

* Cada locker poderá ter apenas um aluguel ativo por vez.  
* As reservas serão ativadas após a confirmação do pagamento.  
* O acesso será permitido apenas a usuários autorizados, durante o período contratado.  
* Os ofertadores deverão informar horários, localização e condições de utilização.  
* Lockers em manutenção não poderão receber reservas.  
* Aluguéis vencidos deverão seguir um procedimento específico, sem liberação automática de compartimentos que possam conter objetos.  
* Ofertadores e pontos precisarão de aprovação antes da publicação.  
* O serviço deverá estabelecer regras de segurança, privacidade, responsabilidade pelos objetos e atendimento a incidentes.

## **1.8. Escopo do MVP**

O MVP deverá validar o ciclo completo de aluguel, contemplando:

* Cadastro e autenticação de usuários e ofertadores.  
* Cadastro e gerenciamento de pontos e lockers.  
* Busca por mapa ou lista, com informações de disponibilidade e preços.  
* Reserva diária, semanal e mensal.  
* Pagamento digital por Pix ou cartão.  
* Abertura de lockers por mecanismo eletrônico integrado.  
* Acompanhamento e encerramento dos aluguéis.  
* Painel básico para ofertadores e administradores.  
* Suporte para problemas operacionais.

A implementação começará com um número reduzido de pontos autorizados dentro da universidade, permitindo avaliar demanda, ocupação, receita e confiabilidade dos equipamentos.

Funcionalidades secundárias, como avaliações, promoções e relatórios avançados, ficarão para versões posteriores.

## **1.9. Objetivo final**

Criar uma plataforma que centralize a oferta e o aluguel de guarda-volumes universitários, proporcionando armazenamento acessível e conveniente aos usuários e geração de receita aos ofertadores.

O MVP deverá comprovar a viabilidade da solução por meio de uma experiência completa: **encontrar, reservar, pagar, acessar e devolver um locker**, estabelecendo a base para expansão a outros pontos e instituições.

## **2.0. Observações:**

Como estamos criando um MVP, não se atenha, por ora, à serviços de pagamento, nem de comunicação com lockers reais, por exemplo. Também, trabalhe, em termos de software, com sistemas “mock”, sem acesso à infraestrutura reais, como DMBS complexos, infraestrutura de nuvem, etc. A ideia é ter um aplicativo base funcionando

# **Direção do desenvolvimento**

A divisão do projeto segue três responsabilidades:

**Visão geral:** define o problema, os públicos, o modelo de negócio, as regras de utilização e a jornada que o produto deverá entregar.

**Backend:** implementa as regras de negócio, controla a disponibilidade, processa reservas e pagamentos, valida permissões e gerencia o acesso aos equipamentos físicos.

**Frontend:** transforma essas funcionalidades em interfaces intuitivas para usuários, parceiros e administradores.

A prioridade do MVP será colocar essas três áreas para funcionar em conjunto, validando um ciclo completo de aluguel em um ponto físico real antes de expandir a plataforma.



# Para o desenvolvimento:
Crie planos de implementação e tarefas, atuando de forma estruturada. Nos arquivos implementation.md e tasks.md. Separe-os em backend e frontend, também, para o desenvolvimento poder ser paralelo sem gargalos.
