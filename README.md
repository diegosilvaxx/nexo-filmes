# Nexo Filmes

Catálogo de filmes com busca, favoritos e avaliações. React 19, TypeScript strict, Axios, styled-components e npm workspaces.

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
scripts/       # Execução do workspace
tests/         # Configuração de testes
```

As aplicações utilizam pacotes compartilhados de UI, contratos e infraestrutura HTTP. Importações entre aplicações não fazem parte da arquitetura. As dependências são gerenciadas por um único `package-lock.json`.

Os estilos são definidos com styled-components, tema tipado e estilos globais aplicados pelo `UIProvider`. O pacote `@nexo/http` disponibiliza uma fábrica de clientes Axios com base URL configurável, timeout de 15 segundos e cabeçalho `Accept: application/json`. As requisições do navegador utilizarão o BFF, sem acesso ao token da TMDB.

## Comandos

| Comando                 | Descrição                                |
| ----------------------- | ---------------------------------------- |
| `npm run check`         | TypeScript, lint, formatação e builds    |
| `npm run typecheck`     | Verificação de tipos sem emitir arquivos |
| `npm run lint`          | ESLint sem avisos                        |
| `npm run format`        | Formatação com Prettier                  |
| `npm run build`         | Builds das quatro aplicações em `dist/`  |
| `npm run preview`       | Prévia do build do Shell na porta 4100   |
| `npm test`              | Testes com Vitest                        |
| `npm run test:coverage` | Relatório de cobertura V8                |

## Estado atual

O workspace inclui quatro aplicações independentes e telas iniciais. A integração dos remotes, as rotas, a conexão com a TMDB e a persistência de dados ainda não estão implementadas.

Vitest, Testing Library e jsdom estão configurados. Ainda não há arquivos de testes nem medição de cobertura das regras de negócio.

## Escopo funcional

- `/filmes`: catálogo com 20 filmes por página, busca, gênero, ordenação e estado na URL.
- `/filme/:id`: informações do filme, direção, elenco, favoritos e avaliações.
- `/favoritos`: favoritos com nota pessoal e opção de remoção.
- `/painel`: totais, nota média e gênero mais frequente entre os favoritos.
- Contador de favoritos no cabeçalho, sincronizado entre telas.
- Avaliação única por filme: nota de 0,5 a 10 em passos de 0,5, comentário opcional de até 500 caracteres, edição e exclusão.

## Integração TMDB

A integração utilizará um BFF com o **API Read Access Token** configurado em `.env`, sem exposição ao navegador. Arquivos de ambiente estão excluídos do Git. A execução atual não exige token.
