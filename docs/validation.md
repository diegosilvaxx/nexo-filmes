# Verificação do Nexo Filmes

## Requisitos

| Requisito                                         | Implementação                                                                                     | Verificação                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| React 19 e TypeScript strict                      | React 19, `strict`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`                     | `npm run typecheck`                                                     |
| Shell e três remotes                              | Shell com cabeçalho, navegação e 404; catálogo, filme e minha área expostos por Module Federation | Testes do Shell e E2E                                                   |
| Execução integrada e independente, com singletons | Configurações próprias por aplicação; React, React DOM e router compartilhados                    | E2E do portal e das portas 4301 a 4303                                  |
| Falhas isoladas e nova tentativa                  | Boundary por conteúdo remoto e outro para o contador; nova montagem e recarga da configuração     | Testes de erro de download, renderização e contador; E2E de recuperação |
| Sem importações entre aplicações                  | Comunicação por URL, eventos tipados e pacotes compartilhados                                     | `npm run architecture`                                                  |
| Componentes sem formato da TMDB                   | Adapter no servidor, contratos próprios e validação das respostas do BFF                          | Testes de `tmdb`, `movies` e BFF                                        |
| Validação por schema                              | Zod valida a nota e o comentário ao salvar; mensagens por campo e foco no primeiro erro           | Testes de formulário, Storybook e E2E                                   |
| Carregamento, vazio, erro, celular e teclado      | Estados por recurso, layout responsivo e foco visível                                             | E2E em 360 e 1440 px, axe e revisão manual                              |
| Pelo menos 70% de linhas nas regras de negócio    | Limites de cobertura nas consultas, adapter, cliente, repositório, formulário e estatísticas      | `npm run test:coverage`                                                 |
| Inicialização com até dois comandos               | Após configurar o ambiente: `npm install` e `npm run dev`                                         | BFF e quatro aplicações iniciados pela raiz                             |

Favoritos e avaliações passam pelo repositório assíncrono; as aplicações não acessam o `localStorage` diretamente. Por padrão, cada operação aguarda de 300 a 1.500 ms e toda escrita em um ID terminado em `13` falha. As variáveis do ambiente configuram a simulação, e o modo de testes unitários desliga atraso e falhas. Os E2E utilizam atraso fixo e falhas ativadas para verificar rollback.

## Diferenciais

| Diferencial           | Local de verificação                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| Ordenação             | Seletor do catálogo e parâmetro `sort` na URL                                        |
| Exclusão de avaliação | Botão no formulário de uma avaliação existente                                       |
| Painel pessoal        | `/painel`, incluindo média com uma casa decimal e desempate alfabético de gênero     |
| E2E                   | `npm run test:e2e`                                                                   |
| URLs em runtime       | `/runtime-config.json`, recarregado ao tentar recuperar um remote                    |
| BFF                   | Token apenas no servidor; navegador acessa `/api`                                    |
| Docker                | `docker compose up --build --wait`, saúde dos cinco serviços e `npm run test:docker` |
| CI                    | `.github/workflows/ci.yml`                                                           |
| Storybook             | `npm run storybook`, `npm run test:storybook` e `npm run build:storybook`            |

## Verificação automatizada

Após instalar as dependências, execute na raiz:

```bash
npm run architecture
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm run build
npm run build:storybook
npx playwright install chromium
npm run test:storybook
npm run test:e2e
```

Em Linux, use `npx playwright install --with-deps chromium`. O CI executa essas verificações sem token real da TMDB. Os testes utilizam dados simulados, builds reais das aplicações e armazenamento isolado por contexto de navegador. `npm test` executa somente os testes unitários; `npm run check` reúne as verificações de código, os testes unitários e os builds do portal.

Para verificar a execução em containers, encerre servidores locais nas portas 4100 a 4103, abra o Docker e execute:

```bash
docker compose config --quiet
docker compose up --build --wait
npm run test:docker
docker compose down
```

O teste Docker verifica o Nginx, o proxy para o BFF real, a saúde, o JSON runtime sem cache, CORS dos remotes e 404 de assets ausentes. Também verifica as rotas profundas, integração dos remotes, favorito, avaliação, recarga, painel e aplicações independentes com respostas de filmes simuladas no navegador. O CI repete essa execução em Linux e verifica a recriação do Shell com uma URL de remote alterada, sem novo build.

Os relatórios Docker ficam em `playwright-report-docker/` e os diagnósticos em `test-results-docker/`, separados das saídas do E2E. Abra o relatório com `npx playwright show-report playwright-report-docker`. O README inclui capturas das telas e dos relatórios da verificação local.

Os relatórios ficam em `coverage/` e `playwright-report/`; screenshots, vídeos e traces de falhas ficam em `test-results/`. Esses diretórios são ignorados pelo Git. Para abrir o relatório de navegador, use `npm run test:e2e:report`.

## Verificação manual

Com o `.env` configurado e `npm run dev` em execução, abra `http://127.0.0.1:4100`.

1. Em `/filmes`, avance a página, escolha gênero e ordenação, recarregue e abra a URL em outra aba. A consulta deve ser preservada. Digite um título: a busca aguarda 400 ms e desabilita gênero e ordenação, conforme o endpoint da TMDB. Limpar o título habilita os filtros novamente.
2. Favorite um filme cujo ID não termine em `13`. A seleção e o contador mudam imediatamente; o botão indica salvamento e depois volta a ficar disponível. Abra o detalhe e os favoritos para conferir a mesma seleção, inclusive após recarregar.
3. Em `/filme/550`, tente salvar sem nota, com `11`, com `1.6` e com um comentário de 501 caracteres. Os campos mantêm o que foi digitado; ao salvar, Zod impede a gravação, mostra cada erro e foca o primeiro. Salve com `8.5` e até 500 caracteres, edite e depois exclua. Há no máximo uma avaliação por filme; a exclusão permite avaliar novamente.
4. Abra `/filme/13`. A consulta do filme deve funcionar. Ao favoritar ou salvar uma avaliação, a escrita falha após o atraso: o favorito e o contador voltam ao valor anterior, há uma mensagem de erro e o rascunho da avaliação permanece. Abrir a rota, por si só, não provoca esse erro de gravação.
5. Confira `/painel` após favoritar e avaliar filmes. Remover um favorito preserva a avaliação; excluir a avaliação preserva o favorito. Outra aba da mesma origem deve refletir as alterações. Aplicações independentes em portas diferentes usam armazenamentos separados.
6. Navegue com `Tab`, `Shift+Tab` e `Enter`. O link inicial permite ir para o conteúdo, o elemento focado tem contorno visível e os campos são associados aos seus rótulos e mensagens. Teste também em uma largura de 360 px. Na revisão com leitor de tela, confira títulos, navegação, nomes dos botões, carregamento e mensagens do formulário.
7. Para simular um remote indisponível, encerre os servidores iniciados em conjunto e inicie o BFF, o Shell e minha área em terminais separados, deixando o catálogo parado. O cabeçalho e o painel continuam funcionando; apenas o conteúdo do catálogo apresenta erro. Inicie o catálogo e use **Tentar novamente** para recuperar a tela. Os comandos independentes estão no README.

## Builds e hospedagem

`npm run build` gera o BFF e as quatro aplicações em `dist/`. `npm run preview` inicia essas prévias e o BFF, com as mesmas portas do desenvolvimento; encerre os servidores anteriores antes de usar a prévia.

Na hospedagem, configure os endereços dos remotes no `runtime-config.json`, sirva esse JSON sem cache, habilite CORS nos assets dos remotes e forneça fallback para `index.html` em cada aplicação. Encaminhe `/api` ao BFF e configure o token no ambiente do servidor. Os builds do navegador não contêm a credencial.
