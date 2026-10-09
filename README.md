# Nexo Filmes

Portal de filmes com React 19, TypeScript strict, Module Federation, Axios, styled-components e npm workspaces.

## Requisitos

- Node.js 22.12 ou superior. Versão recomendada: Node.js 24, indicada em `.nvmrc`.
- npm 10 ou superior.

## Execução

Na raiz do repositório:

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

`Ctrl+C` encerra os servidores. As portas são fixas; uma porta ocupada interrompe a inicialização.

## Estrutura

```text
apps/
  shell/       # Entrada do portal
  catalog/     # Catálogo
  movie/       # Detalhes do filme
  area/        # Favoritos e painel
packages/
  contracts/   # Tipos compartilhados
  http/        # Cliente HTTP com Axios
  ui/          # Componentes e estilos comuns
scripts/       # Execução e verificação de arquitetura
tooling/       # Configuração de Vite e remotes
tests/         # Configuração de testes
```

O Shell carrega os três remotes com Module Federation. Cada aplicação possui configuração e build próprios, e pode executar de forma independente. React, React DOM, React Router e styled-components são compartilhados como singletons. Apenas as entradas independentes montam o router e o `UIProvider`; os componentes expostos utilizam os contextos do Shell.

Os pacotes compartilhados fornecem UI, contratos e infraestrutura HTTP. `npm run architecture` verifica importações estáticas, reexports e imports dinâmicos com caminho literal, impedindo dependências diretas entre aplicações. As dependências são gerenciadas por um único `package-lock.json`.

Os estilos são definidos com styled-components, tema tipado e estilos globais aplicados pelo `UIProvider`. O pacote `@nexo/http` disponibiliza uma fábrica de clientes Axios com base URL configurável, timeout de 15 segundos e cabeçalho `Accept: application/json`. As requisições do navegador utilizarão o BFF, sem acesso ao token da TMDB.

## Comandos

| Comando                 | Descrição                                          |
| ----------------------- | -------------------------------------------------- |
| `npm run check`         | Arquitetura, tipos, lint, formato, testes e builds |
| `npm run architecture`  | Verificação das importações entre aplicações       |
| `npm run typecheck`     | Verificação de tipos sem emitir arquivos           |
| `npm run lint`          | ESLint sem avisos                                  |
| `npm run format`        | Formatação com Prettier                            |
| `npm run build`         | Builds das quatro aplicações em `dist/`            |
| `npm run preview`       | Prévia dos builds das quatro aplicações            |
| `npm test`              | Testes com Vitest                                  |
| `npm run test:coverage` | Relatório de cobertura V8                          |

## Estado atual

O workspace inclui Shell e três remotes integrados, navegação por URL, cabeçalho compartilhado e página 404. Cada região remota possui estado de carregamento, limite de espera de dez segundos e tratamento de erro com botão de nova tentativa. O contador do cabeçalho tem uma região de recuperação separada do conteúdo.

As páginas apresentam telas iniciais; o contador permanece em zero. Os dados da TMDB, favoritos, avaliações e métricas ainda não estão implementados. Os testes atuais verificam configuração, carregamento, timeout e recuperação dos remotes. A cobertura das regras de negócio será medida quando essas regras estiverem implementadas.

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

A integração utilizará um BFF com o **API Read Access Token** configurado em `.env`, sem exposição ao navegador. Arquivos de ambiente estão excluídos do Git. A execução atual não exige token.
