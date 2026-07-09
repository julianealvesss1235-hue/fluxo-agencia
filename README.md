# Fluxo — Gestão da agência

App de gestão de clientes e tarefas, pronto para virar um "app" instalável no celular.

## Como colocar no ar (grátis, ~10 minutos)

### 1. Crie uma conta no GitHub (se ainda não tiver)
https://github.com/signup

### 2. Suba este projeto para um repositório no GitHub
Descompacte este zip em uma pasta no seu computador e, dentro dela, rode no terminal:

```
git init
git add .
git commit -m "primeira versão do Fluxo"
```

Depois crie um repositório vazio em https://github.com/new (ex: `fluxo-agencia`) e rode os comandos que o GitHub mostrar na tela (algo como):

```
git remote add origin https://github.com/SEU-USUARIO/fluxo-agencia.git
git branch -M main
git push -u origin main
```

### 3. Crie uma conta na Vercel
https://vercel.com/signup — escolha "Continuar com GitHub" (é gratuito para uso pessoal).

### 4. Importe o projeto
Na Vercel, clique em **Add New → Project**, selecione o repositório `fluxo-agencia` e clique em **Deploy**. Não precisa mudar nenhuma configuração — a Vercel já reconhece que é um projeto Next.js.

Em cerca de 1 minuto você recebe um link tipo `https://fluxo-agencia.vercel.app`.

### 5. Instale no celular

**Android (Chrome):** abra o link → toque nos três pontinhos (⋮) → **"Adicionar à tela inicial" / "Instalar app"**.

**iPhone (Safari):** abra o link → toque no ícone de compartilhar (□↑) → **"Adicionar à Tela de Início"**.

Pronto — o ícone roxo do Fluxo aparece na tela do seu celular, abre em tela cheia, sem barra de navegador, como um app de verdade.

## Sobre os dados

Os dados (clientes e tarefas) ficam salvos no armazenamento local do navegador de cada aparelho (`localStorage`). Isso significa:
- Rápido e funciona offline depois do primeiro carregamento.
- **Não sincroniza sozinho entre o computador e o celular** — cada aparelho tem sua própria cópia dos dados.

Se no futuro você quiser que os dados sejam os mesmos em todos os aparelhos (ex: você e sua equipe acessando o mesmo painel), o próximo passo é ligar um banco de dados real (ex: Supabase) — é uma etapa que podemos fazer depois, sem precisar refazer a interface.

## Integrações (Google Agenda e Trello)

Dentro do app, no menu lateral, tem uma seção **"Integrações"**.

### Google Agenda (sincronia nos dois sentidos)
Como o app não tem servidor próprio, a conexão é feita direto do navegador com sua conta Google. Você precisa:
1. Publicar o app na Vercel primeiro (passo 4 acima) — a conexão só funciona em um domínio publicado, não em `localhost`.
2. Criar uma credencial OAuth gratuita no Google Cloud (o passo a passo completo, com links, aparece dentro do próprio app quando você clica em "Onde eu pego o Client ID?").
3. Colar o Client ID dentro do Fluxo e clicar em "Conectar".

Depois de conectado, os prazos das suas tarefas viram eventos na sua agenda automaticamente, e o botão "Sincronizar agora" traz de volta qualquer mudança feita direto na agenda. Como o Google expira o acesso a cada sessão, é normal precisar clicar em "Sincronizar" de novo depois de um tempo sem usar o app.

### Trello (importação única)
Gere uma chave e um token gratuitos do Trello (o link certo também aparece dentro do app), cole os dois, escolha o quadro, revise em qual categoria cada lista vai cair, e importe. Isso traz cards, prazos e checklists de uma vez só para dentro de um cliente do Fluxo — não fica sincronizado depois, é só para trazer o histórico existente.

## Rodar localmente (opcional, para testar antes de publicar)

Com Node.js instalado:

```
npm install
npm run dev
```

Abra http://localhost:3000
