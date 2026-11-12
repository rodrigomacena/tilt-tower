# Tilt Tower

Pinball vertical para celular em pé. Jogue em https://tilt-tower.vercel.app/ Suba a torre andar por andar, pelas rampas, até a saída.

- 50 fases em 5 eras (anos 60, 70, 80, 90 e futuro), com 2 sub-chefes e 1 chefe por era
- Oficina: troque fichas por melhorias
- Peças de assinatura e sequências com prêmio em todas as eras
- Desafio do Dia, Torre Infinita e 17 conquistas
- Trilha sonora e efeitos sintetizados em tempo real (Web Audio)
- Um único arquivo HTML, sem build: abra `index.html` no navegador

## Arquivos

- `index.html` — o jogo (versão atual)
- `classico.html` — versão clássica da Era 1
- `prototipos/` — conceitos e protótipos antigos
- `tools/bot.js` — robô de teste: joga as fases sozinho, com reflexo perfeito ou humano (`TTBot.run({ human:"medio", loadout:"era" })`)
- `mobile/` — app Capacitor (Android e iOS); `mobile/store/` tem os textos e as capturas das lojas

## Publicar no Vercel

Importe este repositório no Vercel como projeto estático (Framework Preset: Other, sem comando de build). A raiz serve o `index.html`.

## Instalar no celular (PWA)

Depois de publicado, abra o site no celular e use "Adicionar à tela inicial". O jogo abre em tela cheia e funciona offline.
