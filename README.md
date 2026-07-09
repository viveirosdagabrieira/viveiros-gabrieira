# 🌳 Viveiros da Gabrieira — Guia de Instalação Completo

Guia passo a passo para colocar a loja online com pagamentos MB Way e Multibanco reais.

---

## O que vai precisar

- Um computador (Windows, Mac ou Linux)
- 30 a 60 minutos
- Cartão de crédito/débito para criar conta no Stripe (não cobra nada para testar)

---

## PASSO 1 — Instalar o Node.js

O Node.js é o motor que corre o código do backend.

1. Abra o browser e vá a **https://nodejs.org**
2. Clique no botão verde **"LTS"** (versão recomendada)
3. Faça download e instale normalmente (Next, Next, Finish)
4. Para confirmar que ficou instalado:
   - No Windows: abra o **Prompt de Comando** (pesquise "cmd" no menu iniciar)
   - No Mac: abra o **Terminal**
   - Escreva: `node --version`
   - Deve aparecer algo como: `v20.11.0` ✅

---

## PASSO 2 — Instalar o Git

O Git serve para enviar os ficheiros para o Netlify.

1. Vá a **https://git-scm.com**
2. Clique em **Download** e instale normalmente
3. Para confirmar: escreva `git --version` no terminal
   - Deve aparecer: `git version 2.x.x` ✅

---

## PASSO 3 — Criar conta no GitHub

O GitHub é onde os ficheiros ficam guardados na nuvem.

1. Vá a **https://github.com**
2. Clique **Sign up** e crie uma conta gratuita
3. Confirme o email

---

## PASSO 4 — Criar conta no Netlify

O Netlify é onde o site fica alojado (grátis).

1. Vá a **https://netlify.com**
2. Clique **Sign up** → escolha **Continue with GitHub**
3. Autorize o acesso

---

## PASSO 5 — Criar conta no Stripe

O Stripe processa os pagamentos MB Way e Multibanco.

1. Vá a **https://stripe.com/pt**
2. Clique **Começar agora** e crie uma conta
3. Confirme o email
4. Ative a conta (precisará de dados da empresa ou NIF pessoal)

### Ativar MB Way e Multibanco no Stripe:
1. No painel do Stripe, vá a **Settings → Payment methods**
2. Procure **MB Way** → clique **Enable**
3. Procure **Multibanco** → clique **Enable**

### Obter as chaves do Stripe:
1. No painel do Stripe, vá a **Developers → API keys**
2. Copie a **Publishable key** (começa com `pk_test_...`)
3. Copie a **Secret key** (começa com `sk_test_...`)
4. Guarde-as num bloco de notas — vai precisar delas

---

## PASSO 6 — Preparar os ficheiros do projeto

1. Crie uma pasta no seu computador chamada `viveiros-gabrieira`
2. Coloque dentro desta pasta todos os ficheiros que recebeu:
   ```
   viveiros-gabrieira/
   ├── index.html
   ├── package.json
   ├── netlify.toml
   └── netlify/
       └── functions/
           ├── create-payment.js
           └── stripe-webhook.js
   ```

---

## PASSO 7 — Colocar o projeto no GitHub

Abra o terminal (ou Prompt de Comando) dentro da pasta `viveiros-gabrieira`:

```bash
# Inicializar o projeto Git
git init

# Adicionar todos os ficheiros
git add .

# Guardar uma versão
git commit -m "Primeiro deploy - Viveiros da Gabrieira"

# Criar repositório no GitHub e enviar
# (siga as instruções que o GitHub mostra após criar um novo repositório)
```

**Forma mais fácil (sem terminal):**
1. Vá ao GitHub → clique **New repository**
2. Dê o nome `viveiros-gabrieira`
3. Clique **Create repository**
4. Clique **uploading an existing file**
5. Arraste todos os ficheiros da pasta para a página
6. Clique **Commit changes**

---

## PASSO 8 — Ligar o GitHub ao Netlify

1. No Netlify, clique **Add new site → Import an existing project**
2. Escolha **GitHub**
3. Selecione o repositório `viveiros-gabrieira`
4. Deixe as configurações como estão (o netlify.toml já trata disso)
5. Clique **Deploy site**
6. Aguarde 1-2 minutos → o site fica online com um endereço tipo `https://viveiros-abc123.netlify.app`

---

## PASSO 9 — Adicionar as chaves do Stripe ao Netlify

As chaves secretas **nunca** ficam nos ficheiros — ficam nas variáveis de ambiente do Netlify.

1. No Netlify, vá ao seu site → **Site configuration → Environment variables**
2. Clique **Add a variable** e adicione:

| Nome da variável | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (a sua chave secreta do Stripe) |
| `STRIPE_WEBHOOK_SECRET` | (ver Passo 10) |

3. Clique **Save**
4. Vá a **Deploys → Trigger deploy** para o site recarregar com as novas variáveis

---

## PASSO 10 — Configurar o Webhook do Stripe

O Webhook avisa o seu site quando um pagamento é confirmado.

1. No Stripe, vá a **Developers → Webhooks**
2. Clique **Add endpoint**
3. No campo **Endpoint URL** coloque:
   ```
   https://SEU-SITE.netlify.app/.netlify/functions/stripe-webhook
   ```
   (substitua `SEU-SITE` pelo endereço que o Netlify lhe deu)
4. Em **Events to send** selecione:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Clique **Add endpoint**
6. Copie o **Signing secret** (começa com `whsec_...`)
7. Volte ao Netlify → Environment variables → adicione:
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...`
8. Faça novo deploy

---

## PASSO 11 — Testar os pagamentos

O Stripe tem um modo de teste onde pode simular pagamentos sem dinheiro real.

### Testar MB Way:
1. No site, adicione um produto ao cesto
2. Finalize a encomenda
3. Escolha MB Way
4. Use o número: `+351 910 000 000` (número de teste do Stripe)
5. O pagamento é aprovado automaticamente em modo de teste

### Testar Multibanco:
1. Escolha Multibanco
2. Uma referência de teste é gerada
3. No painel do Stripe pode ver o PaymentIntent criado

### Ver pagamentos no Stripe:
- Vá a **Stripe → Payments** para ver todas as transações

---

## PASSO 12 — Passar para produção (dinheiro real)

Quando estiver satisfeito com os testes:

1. No Stripe, clique no toggle **Test mode → Live mode**
2. Obtenha as chaves de produção (começam com `pk_live_` e `sk_live_`)
3. No Netlify, substitua as variáveis de ambiente pelas chaves de produção
4. Faça novo deploy
5. ✅ Pronto — o site aceita pagamentos reais!

---

## PASSO 13 — Domínio próprio (opcional mas recomendado)

Para ter `www.viveirogabrieira.pt` em vez de `viveiros-abc123.netlify.app`:

### Registar o domínio .pt:
1. Vá a **https://www.dns.pt**
2. Pesquise `viveirogabrieira.pt`
3. Se estiver disponível, registe (~8€/ano)
4. Precisará de criar uma conta e fornecer dados de contacto

### Ligar o domínio ao Netlify:
1. No Netlify → **Domain management → Add custom domain**
2. Escreva `viveirogabrieira.pt`
3. O Netlify dá-lhe servidores DNS (ex: `dns1.p01.nsone.net`)
4. No painel do dns.pt, substitua os servidores de nome pelos do Netlify
5. Aguarde até 24h para propagar
6. O Netlify adiciona HTTPS automaticamente e de graça

---

## Resumo de custos

| Serviço | Custo |
|---|---|
| Netlify (alojamento) | Grátis |
| GitHub | Grátis |
| Stripe (plataforma) | Grátis |
| Stripe (por transação) | 1,5% + 0,25€ por pagamento |
| Domínio .pt | ~8€/ano |
| **Total para começar** | **~8€/ano** |

---

## Problemas comuns

**"Module not found: stripe"**
→ Abra o terminal na pasta do projeto e escreva: `npm install`

**"Invalid API Key"**
→ Verifique se copiou a chave correta nas variáveis de ambiente do Netlify

**MB Way não funciona**
→ Confirme que ativou o MB Way no painel do Stripe em Settings → Payment methods

**O site não atualiza após mudanças**
→ No Netlify, vá a Deploys → Trigger deploy

---

## Precisar de ajuda?

Se ficou preso em algum passo, partilhe o erro que aparece e eu ajudo a resolver.

---

*Viveiros da Gabrieira — Ceira, Coimbra*
