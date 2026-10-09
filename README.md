# Nexo Filmes

Portal de filmes com React 19, TypeScript strict, Module Federation, Axios, styled-components e npm workspaces.

## Requisitos

- Node.js 22.12 ou superior. Versão recomendada: Node.js 24, indicada em `.nvmrc`.
- npm 10 ou superior.

## Execução

Na raiz do repositório:

Copie `.env.example` para `.env` e preencha `TMDB_READ_ACCESS_TOKEN` com o **API Read Access Token** da TMDB. Se o `.env` já existir, mantenha os valores locais. O token é lido apenas pelo servidor.

```bash
npm install
npm run dev
```

| Aplicação  | Endereço              | Execução independente |
| ---------- | --------------------- | --------------------- |
| Shell      | http://127.0.0.1:4100 | `npm run dev:shell`   |
| Catálogo   | http://127.0.0.1:4101 | `npm run dev:catalog` |
| Filme      | http://127.0.0.1:4102 | `npm run dev:movie`   |
| Minha área | http://127.0.0.1:4103 | `npm run dev:area`    |
| BFF        | http://127.0.0.1:4200 | `npm run dev:bff`     |

`npm run dev` inicia o BFF e as quatro aplicações. `Ctrl+C` encerra os servidores. As portas do portal são fixas; uma porta ocupada interrompe a inicialização. Para rodar um remote separadamente com dados, inicie também o BFF. Os servidores Vite encaminham `/api` para ele.

`npm run dev:bff` observa mudanças no código do servidor. Na execução conjunta, reinicie `npm run dev` após alterar o BFF.

## Estrutura

```text
apps/
  shell/       # Entrada do portal
  catalog/     # Catálogo
  movie/       # Detalhes do filme
  area/        # Favoritos e painel
  bff/         # API de filmes e ambiente do servidor
packages/
  contracts/   # Tipos compartilhados
  http/        # Cliente HTTP com Axios
  movies/      # Cliente do BFF para as telas
  tmdb/        # Adapter da TMDB, exclusivo do servidor
  user-data/   # Repositório local e estado compartilhado de favoritos
  ui/          # Componentes e estilos comuns
scripts/       # Execução e verificação de arquitetura
tooling/       # Configuração de Vite e remotes
tests/         # Configuração de testes
```

O Shell carrega os três remotes com Module Federation. Cada aplicação possui configuração e build próprios, e pode executar de forma independente. React, React DOM, React Router e styled-components são compartilhados como singletons. Apenas as entradas independentes montam o router e o `UIProvider`; os componentes expostos utilizam os contextos do Shell.

Os pacotes compartilhados fornecem UI, contratos e infraestrutura HTTP. `npm run architecture` verifica importações estáticas, reexports e imports dinâmicos com caminho literal, impedindo dependências diretas entre aplicações e a importação do adapter da TMDB pelo navegador. As dependências são gerenciadas por um único `package-lock.json`.

Os estilos são definidos com styled-components, tema tipado e estilos globais aplicados pelo `UIProvider`. O pacote `@nexo/http` disponibiliza uma fábrica de clientes Axios com base URL configurável, timeout de 15 segundos e cabeçalho `Accept: application/json`. `@nexo/movies` consulta o BFF e valida os contratos retornados com Zod. `@nexo/tmdb` usa Axios com timeout de 12 segundos, `language=pt-BR` e autenticação Bearer. O navegador não recebe o token.

## Comandos

| Comando                 | Descrição                                          |
| ----------------------- | -------------------------------------------------- |
| `npm run check`         | Arquitetura, tipos, lint, formato, testes e builds |
| `npm run architecture`  | Verificação das importações entre aplicações       |
| `npm run typecheck`     | Verificação de tipos sem emitir arquivos           |
| `npm run lint`          | ESLint sem avisos                                  |
| `npm run format`        | Formatação com Prettier                            |
| `npm run build`         | Builds do BFF e das quatro aplicações em `dist/`   |
| `npm run preview`       | Prévia dos builds e BFF com ambiente de produção   |
| `npm run start:bff`     | Executa o build do BFF                             |
| `npm test`              | Testes com Vitest                                  |
| `npm run test:coverage` | Relatório de cobertura V8                          |

## Estado atual

O workspace inclui Shell e três remotes integrados, navegação por URL, cabeçalho compartilhado e página 404. Cada região remota possui estado de carregamento, limite de espera de dez segundos e tratamento de erro com botão de nova tentativa. O contador do cabeçalho tem uma região de recuperação separada do conteúdo.

O catálogo consulta a TMDB pelo BFF e exibe até 20 filmes por página, com pôster, título, ano, nota e gêneros. Busca, gênero, ordenação e página ficam na URL. A busca aguarda 400 ms após a última alteração e cancela consultas anteriores. A página de favoritos permite listar e remover filmes, com contador sincronizado no cabeçalho. Detalhes, avaliações pessoais e métricas ainda apresentam telas iniciais.

Os testes usam respostas simuladas e não acessam a TMDB. Verificam remotes, contratos, conversão de dados, cache, validação, rotas HTTP, consultas pela URL, debounce, cancelamento, limite de requisições, persistência e reversão de favoritos. `npm run test:coverage` exige pelo menos 70% de linhas em `tmdb`, `movies`, `user-data` e na normalização da consulta do catálogo. Os testes não leem o token local.

## Catálogo e favoritos

Exemplos de URLs compartilháveis: `/filmes?page=2&genreId=18&sort=rating` e `/filmes?search=Matrix`. Gênero e ordenação reiniciam a paginação. A busca usa relevância; limpe o título para habilitar gênero e ordenação. Valores inválidos da URL são normalizados, e voltar ou avançar no navegador recupera a consulta.

`@nexo/user-data` centraliza o acesso ao `localStorage`, valida os dados com Zod e oferece operações assíncronas. O estado é compartilhado como singleton pelo Module Federation e observado com `useSyncExternalStore`. O evento tipado `nexo:user-data-changed` notifica carregamentos, alterações otimistas, gravações e reversões. Adicionar ou remover um favorito atualiza imediatamente as telas e o contador, exibe o estado de salvamento e restaura apenas o filme afetado se a escrita falhar.

Por padrão, cada leitura ou escrita aguarda de 300 a 1.500 ms. Gravações de filmes cujo ID termina em `13` falham, inclusive remoções. A simulação pode ser configurada por `VITE_USER_DATA_DELAY_MIN_MS`, `VITE_USER_DATA_DELAY_MAX_MS` e `VITE_USER_DATA_FAIL_WRITES`; em modo de teste ela fica desativada. Reinicie o desenvolvimento ou gere novo build após alterar essas variáveis.

Favoritos persistem no navegador, por origem, e mudanças em outras abas da mesma origem atualizam o estado. Aplicações independentes em portas distintas têm armazenamento separado. Seus links para outras aplicações usam `VITE_PORTAL_URL`, com padrão `http://127.0.0.1:4100`. Dados corrompidos ou armazenamento indisponível apresentam erro sem sobrescrever o conteúdo existente.

## URLs dos remotes

O Shell obtém `/runtime-config.json` pelo cliente Axios. Os endereços podem ser modificados sem recompilar o Shell:

```json
{
  "remotes": {
    "catalog": "http://127.0.0.1:4101/remoteEntry.js",
    "movie": "http://127.0.0.1:4102/remoteEntry.js",
    "area": "http://127.0.0.1:4103/remoteEntry.js"
  }
}
```

Em desenvolvimento, o arquivo está em `apps/shell/public/runtime-config.json`. Após o build, edite `dist/shell/runtime-config.json`. Nos servidores Vite, as variáveis `NEXO_CATALOG_REMOTE_URL`, `NEXO_MOVIE_REMOTE_URL` e `NEXO_AREA_REMOTE_URL` em `.env` sobrescrevem os endereços; reinicie os servidores após modificar essas variáveis. O arquivo `.env.example` contém os nomes disponíveis.

Uma nova tentativa busca novamente a configuração e invalida a entrada do remote. Em hospedagem estática, sirva o JSON sem cache, habilite CORS para os arquivos dos remotes e configure fallback de navegação para `index.html` em cada aplicação.

Para verificar os builds localmente, execute `npm run build` e `npm run preview`.

## Escopo funcional

- `/filmes`: catálogo com 20 filmes por página, busca, gênero, ordenação e estado na URL.
- `/filme/:id`: informações do filme, direção, elenco, favoritos e avaliações.
- `/favoritos`: favoritos com nota pessoal e opção de remoção.
- `/painel`: totais, nota média e gênero mais frequente entre os favoritos.
- Contador de favoritos no cabeçalho, sincronizado entre telas.
- Avaliação única por filme: nota de 0,5 a 10 em passos de 0,5, comentário opcional de até 500 caracteres, edição e exclusão.

## Integração TMDB

O BFF oferece apenas rotas de leitura predefinidas; não recebe URLs externas nem encaminha cabeçalhos do navegador para a TMDB. Credenciais e detalhes internos das falhas não entram nas respostas JSON. O token fica em `TMDB_READ_ACCESS_TOKEN`, sem prefixo `VITE_`, e os arquivos de ambiente estão excluídos do Git.

| Rota                  | Parâmetros                          | Resposta                                     |
| --------------------- | ----------------------------------- | -------------------------------------------- |
| `GET /api/health`     | —                                   | Estado do processo                           |
| `GET /api/genres`     | —                                   | Gêneros: `id`, `name`                        |
| `GET /api/movies`     | `page`, `search`, `genreId`, `sort` | `items`, `page`, `totalPages`, `totalItems`  |
| `GET /api/movies/:id` | ID positivo                         | Filme com duração, sinopse, direção e elenco |

Exemplos: `/api/movies?page=2&genreId=18&sort=rating`, `/api/movies?search=Matrix&page=1` e `/api/movies/550`.

O catálogo usa `discover/movie`, enquanto a busca usa `search/movie`. Busca por título não é combinada com gênero ou ordenação: utiliza a relevância retornada pela TMDB. As opções de ordenação do catálogo são `popular`, `rating`, `newest` e `title`; a ordenação por nota considera pelo menos 200 votos. A paginação aceita páginas de 1 a 500. Gêneros são armazenados em memória por processo; uma consulta que falha não fica no cache.

Os dados são convertidos para os contratos do projeto: `posterUrl`, `year`, `tmdbRating` e gêneros completos. As imagens usam `w342` no catálogo e `w500` no detalhe. A direção considera profissionais com `job=Director`; o elenco segue a ordem dos créditos. Informações ausentes são representadas por `null`, texto vazio ou lista vazia conforme o contrato.

Erros têm o formato `{ "error": { "code": "...", "message": "..." } }`. Consultas inválidas retornam 400, filmes inexistentes 404, limite de requisições 429, indisponibilidade ou resposta externa inválida 502 e timeout 504. Em 429, o BFF preserva `Retry-After`, quando presente, e inclui `retryAfterSeconds`. O cliente retorna um erro tipado para que as telas apresentem a mensagem e uma nova tentativa; não há repetição automática de chamadas. Requisições do cliente aceitam `AbortSignal`.

`BFF_PORT` e `BFF_HOST` configuram o servidor, com valores padrão `4200` e `127.0.0.1`. `NEXO_BFF_URL` configura o destino do proxy Vite. Arquivos `.env.local`, `.env.<modo>` e `.env.<modo>.local` podem sobrescrever `.env`; variáveis do processo têm precedência. Alterações de ambiente exigem reiniciar os servidores. O comando `npm run start:bff` utiliza o modo indicado por `NODE_ENV`; `npm run preview` utiliza produção.

Em hospedagem, encaminhe `/api` ao BFF e forneça o token no ambiente do servidor. O build do BFF precisa de Node.js e das dependências instaladas. A saúde do processo não verifica credenciais nem disponibilidade externa.

Referências: [autenticação](https://developer.themoviedb.org/docs/authentication-application), [discover](https://developer.themoviedb.org/reference/discover-movie), [busca](https://developer.themoviedb.org/reference/search-movie), [créditos no detalhe](https://developer.themoviedb.org/docs/append-to-response) e [limite de requisições](https://developer.themoviedb.org/docs/rate-limiting).
