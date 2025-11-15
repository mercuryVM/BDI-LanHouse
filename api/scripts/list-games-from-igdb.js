const axios = require('axios');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let accessToken = null;

async function getAccessToken() {
    if (accessToken) return accessToken;

    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: TWITCH_CLIENT_ID,
            client_secret: TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
        }
    });

    accessToken = response.data.access_token;
    return accessToken;
}

async function listGames(limit = 20) {
    const token = await getAccessToken();

    const response = await axios.post(
        'https://api.igdb.com/v4/games',
        `fields name, summary, age_ratings.rating, multiplayer_modes, cover.url, platforms.name, rating, rating_count;
         where rating > 70 & rating_count > 100;
         sort rating desc;
         limit ${limit};`,
        {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        }
    );

    return response.data;
}

async function main() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     Listador de Jogos da IGDB API         ║');
    console.log('╚════════════════════════════════════════════╝\n');

    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
        console.error('❌ Erro: Credenciais da Twitch não configuradas!');
        console.log('Configure TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET no arquivo .env');
        process.exit(1);
    }

    try {
        console.log('🎮 Buscando jogos da IGDB...\n');
        const games = await listGames(30);

        games.forEach((game, index) => {
            console.log(`${index + 1}. ${game.name}`);
            console.log(`   Rating: ${game.rating ? game.rating.toFixed(1) : 'N/A'} (${game.rating_count || 0} avaliações)`);
            
            if (game.platforms) {
                const platforms = game.platforms.map(p => p.name).join(', ');
                console.log(`   Plataformas: ${platforms}`);
            }
            
            if (game.multiplayer_modes) {
                console.log(`   Multiplayer: Sim`);
            }
            
            if (game.cover && game.cover.url) {
                const imageUrl = 'https:' + game.cover.url.replace('t_thumb', 't_cover_big');
                console.log(`   Imagem: ${imageUrl}`);
            }
            
            console.log('');
        });

        console.log(`\n✓ Total: ${games.length} jogos listados`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

main();
