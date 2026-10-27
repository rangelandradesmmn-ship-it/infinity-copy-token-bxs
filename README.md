# NextScale Pro — SaaS de Landing Pages Clonadas & Personalizadas

Aplicativo web SaaS moderno, responsivo e seguro para criação, distribuição e sincronização de landing pages clonadas com template centralizado e personalização restrita por parceiro.

---

## 🌟 Principais Características do Sistema

1. **Landing Page Principal (Master):**
   - Controlada exclusivamente pelo **Super Admin**.
   - Seções dinâmicas: Hero com player de vídeo (16:9 widescreen ou 9:16 vertical), galeria de vídeos, benefícios, cartão do parceiro credenciado, depoimentos, perguntas frequentes (FAQ), banner de CTA e rodapé em conformidade com a LGPD.
   - Editor visual com controle de rascunhos, histórico de versões, restauração e prévia ao vivo (Desktop vs Mobile 390px).

2. **Template Dinâmico Centralizado (Single Template):**
   - Não cria páginas estáticas individuais no código para cada usuário.
   - Uma única rota dinâmica (`/p/[slug]`) resolve os dados em tempo de execução consultando o banco de dados.

3. **Personalização Restrita aos 4 Campos Permitidos:**
   - **Campo 1 — Nome de Exibição:** validado e exibido nos locais determinados pelo administrador.
   - **Campo 2 — Foto de Perfil:** upload com prévia, validação de tamanho (até 5MB) e formato (JPG, PNG, WEBP).
   - **Campo 3 — Link Pessoal de Cadastro:** validação rigorosa de URL HTTPS; substitui automaticamente todos os botões de cadastro da landing page.
   - **Campo 4 — WhatsApp de Atendimento:** código do país + número com DDD, gerador do link oficial `https://wa.me/` e mensagem inicial configurável.

4. **Regra de Sincronização Global Automática:**
   - Quando o Super Admin edita e publica uma nova versão no Editor Master (ex: troca um vídeo institucional, altera títulos ou identidade visual), **todas as landing pages dos parceiros refletem a mudança imediatamente**, sem perder o nome, foto, link de cadastro e WhatsApp individuais de cada usuário.

5. **Segurança & Controle de Acesso (RLS):**
   - Restrições aplicadas no front-end e no banco de dados (Row Level Security).
   - Tratamento amigável de links inexistentes e contas bloqueadas pelo administrador.
   - Nenhum segredo ou chave privada exposta no navegador.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js**: v18+ (testado no Node.js v24)
- **npm** ou **pnpm** / **yarn**

### 1. Instalação das dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente (Opcional para modo local)
O projeto conta com um **Dual Database Provider**. Ele funciona imediatamente em modo demonstração/local com dados simulados e persistência local, ou conectado diretamente ao Supabase.

Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

Preencha com suas credenciais do Supabase (se for utilizar o banco na nuvem):
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse a aplicação no navegador:
- **Página Master Oficial:** [http://localhost:3000](http://localhost:3000)
- **Landing Page do João Silva:** [http://localhost:3000/p/joao](http://localhost:3000/p/joao)
- **Landing Page da Maria Santos:** [http://localhost:3000/p/maria](http://localhost:3000/p/maria)
- **Página de Conta Bloqueada (Carlos Mendes):** [http://localhost:3000/p/carlos](http://localhost:3000/p/carlos)
- **Painel do Parceiro:** [http://localhost:3000/painel](http://localhost:3000/painel)
- **Painel do Super Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Editor Visual Master:** [http://localhost:3000/admin/editor](http://localhost:3000/admin/editor)

---

## 🗄️ Configuração do Banco de Dados Supabase

Para utilizar o Supabase PostgreSQL em produção, execute as migrações SQL localizadas na pasta `supabase/migrations/` no **SQL Editor** do Supabase na seguinte ordem:

1. **`supabase/migrations/01_schema.sql`**:
   - Criação das tabelas `profiles`, `user_landing_settings`, `landing_page_versions`, `landing_events` e `admin_audit_logs`.
   - Índices para performance e integridade referencial.
   - Políticas completas de **Row Level Security (RLS)**.
   - Gatilho automático `handle_new_user()` que cria o perfil, gera o slug único e inicia as configurações no momento do cadastro no Supabase Auth.

2. **`supabase/migrations/02_storage.sql`**:
   - Criação do bucket público `avatars`.
   - Limite de 5MB por arquivo e permissões de leitura pública.
   - Políticas RLS restringindo uploads, alterações e deleções para a pasta individual do usuário autenticado (`avatars/{user_id}/*`).

3. **`supabase/migrations/03_seed.sql`**:
   - Versão inicial publicada da Landing Page Master com todas as seções e textos oficiais.

---

## 🧪 Bateria de Testes Automatizados

O projeto possui um script de verificação automatizada que testa todas as regras de consistência, segurança, sanitização e sincronização global:

```bash
npm run test:verify
```

### Checklist dos 18 Testes Obrigatórios Concluídos:

- [x] **1. Cadastro e login de usuários:** Criação de conta com slug único automático e login seguro.
- [x] **2. Proteção das páginas administrativas:** Rota `/admin` isolada com controle de permissão e auditoria.
- [x] **3. Criação e publicação da landing page principal:** Editor master com rascunhos, publicação e histórico.
- [x] **4. Criação de duas ou mais páginas individuais:** Testadas com João Silva (`/p/joao`) e Maria Santos (`/p/maria`).
- [x] **5. Personalização dos quatro campos autorizados:** Nome, foto, link de cadastro e WhatsApp.
- [x] **6. Funcionamento dos links individuais de cadastro:** Botões de CTA direcionam para o link pessoal do parceiro.
- [x] **7. Funcionamento dos botões de WhatsApp:** Geração do link `https://wa.me/` sanitizado com mensagem inicial.
- [x] **8. Atualização global após nova publicação:** Novas versões publicadas no Master propagam instantaneamente.
- [x] **9. Preservação das personalizações após atualização global:** Os 4 campos individuais permanecem intocados.
- [x] **10. Impossibilidade de alterar campos não autorizados:** Usuário comum não possui acesso aos textos, vídeos ou layout.
- [x] **11. Impossibilidade de editar dados de outros usuários:** Políticas de segurança e RLS garantem isolamento.
- [x] **12. Bloqueio de contas e tratamento de URLs inválidas:** Carlos Mendes exibe tela de conta suspensa; slugs inválidos exibem tela de erro amigável.
- [x] **13. Responsividade em celulares, tablets e computadores:** Mobile-first com prévia dual no editor.
- [x] **14. Validação das políticas RLS:** Políticas SQL declaradas em `01_schema.sql` e `02_storage.sql`.
- [x] **15. Segurança dos arquivos enviados:** Validação de tamanho (máx 5MB) e tipo MIME (JPEG/PNG/WEBP).
- [x] **16. Correção das métricas de visualização e cliques:** Deduplicação de visualizações em sessão e contagem de cliques.
- [x] **17. Recuperação de senha e tratamento de erros:** Formulário com feedback claro de erro e sucesso.
- [x] **18. Ausência de chaves secretas no código entregue ao navegador:** Uso exclusivo de chaves públicas `NEXT_PUBLIC_` para clientes.

---

## 🌐 Implantação em Produção (Vercel / Netlify / VPS)

### Na Vercel
1. Conecte o repositório Git ao painel da Vercel.
2. Defina as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Execute o Deploy. A Vercel executará automaticamente `npm run build`.

---

## ⚖️ Conformidade e Privacidade (LGPD)
O sistema foi desenvolvido respeitando a Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
- Exibe apenas dados públicos necessários (nome, foto e contato do parceiro credenciado).
- E-mails e credenciais administrativas nunca são expostos nas páginas públicas.
- Rodapé institucional com aviso de privacidade e links legais.
