# Tilt Tower nas lojas (Android e iOS)

O app usa **Capacitor**: o mesmo `index.html` do site roda dentro de um app nativo. Os anúncios usam o **AdMob** e só aparecem no app.

## Estrutura

- `mobile/scripts/sync-web.mjs`: copia o jogo (`index.html`, `assets/`, `icons/`, `fonts/`) para `mobile/www/`.
- `mobile/android/`: projeto Android Studio.
- `mobile/ios/`: projeto Xcode.
- `mobile/assets/`: ícone e splash de origem. Depois de trocar algum deles, rode `npm run icons`.

Depois de qualquer mudança no jogo:

```bash
cd mobile
npm run sync
```

## Anúncios (AdMob)

Hoje o app usa os **IDs de teste do Google**. Antes de publicar:

1. Crie a conta em https://admob.google.com e cadastre dois apps: Tilt Tower Android e Tilt Tower iOS.
2. Em cada app, crie dois blocos de anúncio:
   - **Intersticial**
   - **Premiado**
3. Troque os IDs em quatro lugares:
   - `index.html`, objeto `UNITS` dentro de `const Ads`: coloque os 4 IDs dos blocos e mude `TESTING = true` para `false`.
   - `mobile/android/app/src/main/AndroidManifest.xml`: `com.google.android.gms.ads.APPLICATION_ID`, o ID do app Android (aquele com `~`).
   - `mobile/ios/App/App/Info.plist`: `GADApplicationIdentifier`, o ID do app iOS.
4. Publique o arquivo `app-ads.txt` na raiz do site (o AdMob mostra o conteúdo dele).
5. Configure a mensagem de consentimento (GDPR) em AdMob › Privacidade e mensagens.

Regras atuais dos anúncios:

- **Premiado:** é opcional. Nas telas de resultado e de fim de jogo, o botão "Ver anúncio: +N fichas" dobra as fichas da mesa.
- **Intersticial:** no máximo um a cada 3 mesas terminadas e a cada 3 minutos. Nunca aparece antes da mesa 3 nem logo depois de um premiado.

## Compra "Remover anúncios"

A compra é feita pelo plugin `@capgo/native-purchases`, direto no Google Play Billing e no StoreKit, sem servidor. Ela é única (não é assinatura) e desliga os anúncios de tela cheia para sempre. O botão premiado "+fichas" continua, porque é opcional.

1. Crie o produto com o ID **`remover_anuncios`** nas duas lojas:
   - **Play Console** › Monetizar › Produtos › Produtos no app: crie, defina o preço e ative.
   - **App Store Connect** › seu app › Compras no app: tipo **Não consumível**, mesmo ID, preço, captura de tela e envio junto com a versão.
2. No Xcode, adicione a capability **In-App Purchase** em Signing & Capabilities.
3. Para testar:
   - Android: use contas em Configuração › Teste de licença, com o app instalado pela faixa de teste.
   - iOS: use uma conta Sandbox.
4. Restauração: no Android a compra volta sozinha quando o app abre. No iPhone também aparece o botão "Restaurar compras", que a Apple exige.
5. O botão "Recomeçar campanha" não apaga a compra (ela fica guardada em `tilttower.noads`).

## Android (dá para fazer neste PC Windows)

1. Instale o **Android Studio** (ele já vem com o Java e o SDK).
2. Rode `npm run open:android`. Para testar, conecte o celular com a depuração USB ligada e aperte ▶.
3. Para gerar o arquivo da loja, use **Build › Generate Signed App Bundle** e crie uma *keystore*.
   **Guarde a keystore e a senha em lugar seguro.** Sem elas você não consegue atualizar o app.
4. Na **Google Play Console** (https://play.google.com/console, taxa única de US$ 25):
   - Crie o app e envie o `.aab`.
   - Preencha a classificação de conteúdo, o público-alvo (13+), o formulário de "Segurança dos dados" (o app coleta o ID de publicidade via AdMob) e marque "contém anúncios".
   - Política de privacidade: https://tilt-tower.vercel.app/privacidade.html
   - Contas pessoais novas precisam de um **teste fechado com 12 testadores por 14 dias** antes de liberar a produção.

## iOS (precisa de um Mac)

O app de iOS só pode ser compilado com **Xcode no macOS**. Se você não tiver um Mac, tem duas opções:

- Um serviço de build na nuvem, como Codemagic ou Ionic Appflow, que compila direto do GitHub.
- Um Mac alugado na nuvem, como o MacinCloud.

1. Crie a conta no **Apple Developer Program** (US$ 99 por ano).
2. No Mac:
   ```bash
   cd mobile && npm install && npm run sync && npx cap open ios
   ```
3. No Xcode, escolha o Team em Signing & Capabilities e depois use **Product › Archive › Distribute** para enviar ao App Store Connect.
4. No **App Store Connect**:
   - Preencha a privacidade do app (identificador de publicidade e dados de uso para publicidade de terceiros).
   - Indique a classificação etária.
   - Envie as capturas de tela (6,7" e 6,5") e a URL da política de privacidade.

## Identidade do app

- ID do pacote: `com.rodrigomacena.tilttower`. **Não dá para mudar depois de publicar.**
- Nome: Tilt Tower
- Orientação: somente vertical

## Material da loja

A pasta `mobile/store/` tem o que as duas lojas pedem além do app:

- `LOJA.md`: nome, subtítulo, descrições, palavras-chave e texto de novidades, prontos para colar.
- `iphone67-*.jpg`: capturas de 1290 x 2796 para o App Store Connect.
- `play-*.jpg`: capturas de 1080 x 1920 para a Google Play.

O ícone e a tela de abertura já estão em `mobile/assets/` e nos projetos nativos.
