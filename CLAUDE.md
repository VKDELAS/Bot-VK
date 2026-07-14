# Bot-VK

Bot Discord para verificação de membros usando Components V2.

## Estrutura

```
src/
├── bot/
│   ├── commands/
│   │   └── setup.js          # Comando /setup
│   ├── events/
│   │   ├── interactionCreate.js  # Handler de botões e comandos
│   │   └── ready.js             # Evento de inicialização
│   ├── services/
│   │   ├── youtube-monitor.js   # Monitor de vídeos novos YouTube
│   │   └── twitch-monitor.js    # Monitor de lives Twitch
│   ├── utils/
│   │   ├── sendPainel.js        # Lógica do painel de verificação
│   │   ├── video-notify-container.js  # Container notificação YouTube
│   │   └── live-notify-container.js   # Container notificação Twitch
│   ├── client.js             # Configuração do cliente Discord
│   └── index.js              # Entry point do bot
└── lib/
    └── ids.js                # IDs de canais e cargos
```

## Dependências

- discord.js ^14.16.3
- dotenv ^16.4.5
- next ^14.2.15 (não utilizado pelo bot)
- react ^18.3.1 (não utilizado pelo bot)

## Configuração

Criar arquivo `.env` na raiz:

```
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_GUILD_ID=id_do_servidor
TWITCH_CLIENT_ID=seu_twitch_client_id
TWITCH_CLIENT_SECRET=seu_twitch_client_secret
```

## Comandos

- `/setup` - Envia ou atualiza o painel de verificação (apenas administradores)

## Funcionalidades

- Painel de verificação com Components V2
- Botão "Verificar-se" que adiciona cargos Inscrito e Verificado
- Remove cargo Não Inscrito após verificação
- Logs de verificação em canal específico
- Armazenamento de ID da mensagem em `data/verification.json`
- Monitor de vídeos novos YouTube (polling RSS a cada 3 min)
- Monitor de lives Twitch (polling Helix API a cada 90s)
- Notificações via Components V2 (nunca embeds)

## Rodar

```bash
npm install
npm run start
```

## Deploy

```bash
npm run deploy  # Registra comandos slash
npm run start   # Inicia o bot
```

## Notas

- O bot usa Components V2 (ContainerBuilder, SectionBuilder, etc)
- IDs de canais e cargos estão em `src/lib/ids.js`
- O bot envia o painel automaticamente ao iniciar
- Mensagens de verificação são ephemeral
