# Roma 2027 🏁

**PWA de periodização de musculação para a Maratona de Roma — sub-4h em 14/03/2027.**

Desenvolvido para Renan · iPhone 15 · offline-first · sem backend.

---

## O que é este app

Monitoramento das 42 semanas de periodização de musculação integrada à preparação para a Maratona de Roma. O plano cobre 5 blocos:

| Bloco | Nome | Semanas | Período |
|-------|------|---------|---------|
| 1 | Fundação Anatômica | 1–8 | 25/05–19/07/2026 |
| 2 | Construção de Volume | 9–14 | 20/07–30/08/2026 |
| 3 | Força Máxima | 15–24 | 31/08–08/11/2026 |
| 4 | Potência e Conversão | 25–32 | 09/11/2026–03/01/2027 |
| 5 | Específico Maratona + Taper | 33–42 | 04/01–14/03/2027 |

**Evento especial:** 🏁 Terra da Luz 21k — 06/09/2026 (semana 15)

---

## Como rodar localmente

### Opção 1 — Python (recomendado)

```bash
cd "APP TREINO MARATONA"
python3 -m http.server 8080
# Abre http://localhost:8080 no navegador
```

### Opção 2 — VS Code Live Server

1. Instale a extensão **Live Server** (Ritwick Dey)
2. Clique com o botão direito em `index.html` → **Open with Live Server**

### Opção 3 — Ruby (nativo no macOS)

```bash
cd "APP TREINO MARATONA"
ruby -run -e httpd . -p 8080
```

> ⚠️ Não abra `index.html` diretamente como arquivo (`file://`). O Service Worker exige um servidor HTTP.

---

## Como instalar no iPhone 15

### Via rede local (Wi-Fi)

1. Mac e iPhone na **mesma rede Wi-Fi**
2. No Mac: abra o Terminal e execute:
   ```bash
   ipconfig getifaddr en0
   # Exemplo de saída: 192.168.1.42
   ```
3. Suba o servidor local:
   ```bash
   cd "APP TREINO MARATONA"
   python3 -m http.server 8080
   ```
4. No iPhone, abra o **Safari** e acesse:
   ```
   http://192.168.1.42:8080
   ```
5. Toque no botão **Compartilhar** (quadrado com seta) → **"Adicionar à Tela de Início"**
6. Confirme o nome **"Roma 2027"** → **Adicionar**

O app aparece na tela inicial como um app nativo — sem barra do Safari, sem barra de endereços.

---

## Como subir no GitHub Pages (deploy permanente)

### Passo a passo

1. **Crie um repositório** em [github.com](https://github.com) (ex: `roma2027`)

2. **Faça upload dos arquivos** via interface web ou Git:
   ```bash
   git init
   git add .
   git commit -m "Roma 2027 PWA — deploy inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/roma2027.git
   git push -u origin main
   ```

3. No GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: main → / (root) → Save**

4. Aguarde ~1 minuto. A URL será:
   ```
   https://SEU_USUARIO.github.io/roma2027
   ```

5. **No iPhone**, abra o Safari na URL acima → Compartilhar → **Adicionar à Tela de Início**

> O Service Worker garante que após a primeira abertura o app funciona **100% offline**.

---

## Backup de dados

Todos os treinos ficam no **IndexedDB local do iPhone**. Para não perder dados ao resetar o celular:

### Exportar
1. Abra o app → **Config** (engrenagem)
2. Toque em **Exportar backup**
3. Compartilhe via AirDrop, iMessage ou E-mail
4. Salve o arquivo `.json` em segurança

### Importar
1. Abra o app → **Config** → **Importar backup**
2. Selecione o arquivo `.json` exportado anteriormente
3. Todos os dados são restaurados

---

## Estrutura de arquivos

```
/
├── index.html              ← Entry point único (PWA shell)
├── manifest.json           ← Configuração do PWA
├── sw.js                   ← Service Worker (cache offline)
├── README.md
└── assets/
    ├── css/
    │   └── app.css         ← Design system completo
    ├── js/
    │   ├── app.js          ← Router, telas e lógica principal
    │   ├── data.js         ← Periodização completa (42 semanas, 5 blocos)
    │   ├── db.js           ← Wrapper IndexedDB (workout_logs, exercise_logs, settings)
    │   └── timer.js        ← Timer de descanso + Wake Lock + Haptic
    └── icons/
        ├── icon-180.png    ← apple-touch-icon
        ├── icon-192.png    ← PWA icon
        └── icon-512.png    ← PWA splash icon
```

---

## Funcionalidades

- ⏱ **Contagem regressiva** para Roma em destaque na Home
- 📋 **Treino do dia** baseado no dia da semana — com pliometria, ativação, força e core
- ✅ **Checkboxes por série** com timer de descanso automático e vibração háptica
- ⚖️ **Campo de carga (kg)** por série — histórico salvo localmente
- 📅 **Calendário semanal** com badges de deload, prova, taper e Natal/Réveillon
- 📊 **Histórico** com gráfico de aderência semanal
- 🔍 **Detalhe do exercício** — progressão de carga ao longo do tempo
- 🌙 **Tema escuro/claro** persistido no dispositivo
- 📤 **Backup JSON** exportável via AirDrop / iMessage
- 📵 **100% offline** após primeira visita (Service Worker)
- 🔋 **Wake Lock** mantém a tela acesa durante o treino

---

## Dados do atleta

| Campo | Valor |
|-------|-------|
| Nome | Renan, 31 anos, Fortaleza/CE |
| Objetivo | Maratona de Roma sub-4h (5:41/km) |
| Garmin | Forerunner 265 · LTHR 181 bpm |
| Peso atual | 80,2 kg · 14,62% gordura |
| Meta | 76–77 kg · 10–11% gordura |

---

*Gerado com Claude Code · Anthropic*
