const axios = require('axios');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

require('dotenv').config();

// Configuração do PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Configuração da IGDB API
// Você precisa obter credenciais em: https://dev.twitch.tv/console/apps
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let accessToken = null;

/**
 * Obtém token de acesso da Twitch para usar a IGDB API
 */
async function getAccessToken() {
    if (accessToken) return accessToken;

    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });

        accessToken = response.data.access_token;
        console.log('✓ Token de acesso obtido com sucesso');
        return accessToken;
    } catch (error) {
        console.error('Erro ao obter token de acesso:', error.message);
        throw error;
    }
}

/**
 * Busca jogos populares da IGDB
 */
async function fetchGamesFromIGDB(limit = 50, offset = 0) {
    const token = await getAccessToken();

    try {
        const response = await axios.post(
            'https://api.igdb.com/v4/games',
            `fields name, summary, age_ratings.*, multiplayer_modes, cover.url, platforms.name, first_release_date;
             where rating > 70 & rating_count > 100;
             sort rating desc;
             limit ${limit};
             offset ${offset};`,
            {
                headers: {
                    'Client-ID': TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Erro ao buscar jogos da IGDB:', error.message);
        throw error;
    }
}

/**
 * Mapeia plataformas da IGDB para as plataformas do banco
 */
function mapPlatforms(igdbPlatforms) {
    if (!igdbPlatforms) return [];

    const platformMap = {
        // PCs (tipo 0)
        'PC (Microsoft Windows)': { nome: 'PC Gamer High-End', tipo: 0 },
        'Linux': { nome: 'PC Gamer High-End', tipo: 0 },
        'Mac': { nome: 'PC Gamer High-End', tipo: 0 },
        
        // Consoles (tipo 1)
        'PlayStation 5': { nome: 'PlayStation 5', tipo: 1 },
        'PlayStation 4': { nome: 'PlayStation 4', tipo: 1 },
        'Xbox Series X|S': { nome: 'Xbox Series X', tipo: 1 },
        'Xbox One': { nome: 'Xbox One', tipo: 1 },
        'Nintendo Switch': { nome: 'Nintendo Switch', tipo: 1 },
    };

    const mappedPlatforms = new Set();
    igdbPlatforms.forEach(platform => {
        const mapped = platformMap[platform.name];
        if (mapped) {
            mappedPlatforms.add(mapped.nome);
        }
    });

    return Array.from(mappedPlatforms);
}

/**
 * Extrai idade recomendada dos age ratings
 */
function getAgeRating(ageRatings) {
    if (!ageRatings || ageRatings.length === 0) return 0;

    // Filtra apenas ratings válidos que têm a propriedade rating_category
    const validRatings = ageRatings.filter(r => r.rating_category !== undefined);
    if (validRatings.length === 0) return 0;

    // IGDB Age Rating Category Enum (baseado na API real)
    // Organization 1 = ESRB, 2 = PEGI
    // Rating Categories variam por organização
    const ratingMap = {
        // PEGI (organization: 2)
        1: 3,   // PEGI 3
        2: 7,   // PEGI 7
        3: 12,  // PEGI 12
        4: 16,  // PEGI 16
        5: 18,  // PEGI 18
        
        // ESRB (organization: 1)
        6: 0,   // ESRB RP (Rating Pending)
        7: 3,   // ESRB EC (Early Childhood)
        8: 0,   // ESRB E (Everyone)
        9: 10,  // ESRB E10+ (Everyone 10+)
        10: 13, // ESRB T (Teen)
        11: 17, // ESRB M (Mature 17+)
        12: 18, // ESRB AO (Adults Only 18+)
        
        // ACB (organization: 3) - Australian Classification Board
        13: 0,  // G (General)
        14: 8,  // PG (Parental Guidance)
        15: 15, // M (Mature)
        16: 15, // MA15+ (Mature Accompanied)
        17: 18, // R18+ (Restricted)
        18: 18, // RC (Refused Classification)
        
        // USK (organization: 4) - Germany
        19: 0,  // 0
        20: 6,  // 6
        21: 12, // 12
        22: 16, // 16
        23: 18, // 18
        
        // GRAC (organization: 5) - South Korea
        24: 0,  // All
        25: 12, // Twelve
        26: 15, // Fifteen
        27: 18, // Eighteen
        28: 18, // Testing
        
        // CLASS_IND (organization: 6) - Brazil
        29: 0,  // L (Livre)
        30: 10, // Ten
        31: 12, // Twelve
        32: 14, // Fourteen
        33: 16, // Sixteen
        34: 18, // Eighteen
        
        // CERO (organization: 7) - Japan
        35: 0,  // CERO A (All ages)
        36: 12, // CERO B (12+)
        37: 15, // CERO C (15+)
        38: 17, // CERO D (17+)
        39: 18, // CERO Z (18+)
    };

    // Pega o maior rating (mais restritivo)
    let maxAge = 0;
    for (const ageRating of validRatings) {
        const age = ratingMap[ageRating.rating_category] || 0;
        if (age > maxAge) maxAge = age;
    }

    console.log(`    Idade recomendada determinada: ${maxAge}+`);

    return maxAge;
}

/**
 * Verifica e cria plataformas no banco se não existirem
 */
async function ensurePlatformsExist(platforms) {
    const client = await pool.connect();
    try {
        for (const platformName of platforms) {
            // Determina o tipo baseado no nome
            let tipo = 0; // PC por padrão
            if (platformName.includes('PlayStation') || platformName.includes('Xbox') || platformName.includes('Nintendo')) {
                tipo = 1; // Console
            }

            const result = await client.query(
                'SELECT nome FROM plataforma WHERE nome = $1',
                [platformName]
            );

            if (result.rows.length === 0) {
                await client.query(
                    'INSERT INTO plataforma (nome, tipo) VALUES ($1, $2) ON CONFLICT (nome) DO NOTHING',
                    [platformName, tipo]
                );
                console.log(`  ✓ Plataforma criada: ${platformName}`);
            }
        }
    } finally {
        client.release();
    }
}

/**
 * Baixa a imagem do jogo e salva localmente
 */
async function downloadGameImage(imageUrl, gameId) {
    if (!imageUrl) return null;

    try {
        // Define o diretório de destino
        const gamesDir = path.join(__dirname, '..', 'src', 'public', 'games');
        
        // Cria o diretório se não existir
        if (!fs.existsSync(gamesDir)) {
            fs.mkdirSync(gamesDir, { recursive: true });
        }

        // Define o nome do arquivo
        const ext = path.extname(imageUrl.split('?')[0]) || '.jpg';
        const fileName = `game-${gameId}${ext}`;
        const filePath = path.join(gamesDir, fileName);

        // Baixa a imagem
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'stream'
        });

        await streamPipeline(response.data, fs.createWriteStream(filePath));
        
        return `games/${fileName}`;
    } catch (error) {
        console.error(`    ⚠ Erro ao baixar imagem: ${error.message}`);
        return null;
    }
}

/**
 * Insere um jogo no banco de dados
 */
async function insertGame(game, gameId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const platforms = mapPlatforms(game.platforms);
        if (platforms.length === 0) {
            console.log(`  ⊘ Jogo ignorado (sem plataformas compatíveis): ${game.name}`);
            await client.query('ROLLBACK');
            return false;
        }

        // Garante que as plataformas existem
        await ensurePlatformsExist(platforms);

        // Extrai e baixa a imagem
        let localImagePath = null;
        if (game.cover && game.cover.url) {
            let imageUrl = game.cover.url.replace('t_thumb', 't_cover_big');
            if (!imageUrl.startsWith('http')) {
                imageUrl = 'https:' + imageUrl;
            }
            
            localImagePath = await downloadGameImage(imageUrl, gameId);
        }

        // Insere o jogo
        const insertGameQuery = `
            INSERT INTO jogo (id, nome, descricao, urlImagem, idadeRecomendada, multiplayer, inicializacao)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
                nome = EXCLUDED.nome,
                descricao = EXCLUDED.descricao,
                urlImagem = EXCLUDED.urlImagem,
                idadeRecomendada = EXCLUDED.idadeRecomendada,
                multiplayer = EXCLUDED.multiplayer
        `;

        await client.query(insertGameQuery, [
            gameId,
            game.name,
            game.summary || 'Sem descrição disponível',
            localImagePath,
            getAgeRating(game.age_ratings),
            game.multiplayer_modes ? game.multiplayer_modes.length > 0 : false,
            null // inicializacao será configurado manualmente
        ]);

        // Insere as relações jogo-plataforma
        for (const platformName of platforms) {
            await client.query(
                `INSERT INTO jogoPlataforma (idJogo, nomePlataforma)
                 VALUES ($1, $2)
                 ON CONFLICT (idJogo, nomePlataforma) DO NOTHING`,
                [gameId, platformName]
            );
        }

        await client.query('COMMIT');
        const imageStatus = localImagePath ? '🖼️' : '⚠️ sem imagem';
        console.log(`  ✓ Jogo inserido: ${game.name} (ID: ${gameId}) [${platforms.join(', ')}] ${imageStatus}`);
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  ✗ Erro ao inserir jogo ${game.name}:`, error.message);
        return false;
    } finally {
        client.release();
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  Importador de Jogos IGDB → PostgreSQL    ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Valida credenciais
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
        console.error('❌ Erro: Credenciais da Twitch não configuradas!');
        console.log('\nComo obter as credenciais:');
        console.log('1. Acesse: https://dev.twitch.tv/console/apps');
        console.log('2. Crie uma nova aplicação');
        console.log('3. Configure as variáveis de ambiente:');
        console.log('   - TWITCH_CLIENT_ID');
        console.log('   - TWITCH_CLIENT_SECRET');
        process.exit(1);
    }

    try {
        // Testa conexão com o banco
        console.log('📊 Testando conexão com o banco de dados...');
        await pool.query('SELECT NOW()');
        console.log('✓ Conexão com o banco estabelecida\n');

        // Busca jogos da IGDB
        console.log('🎮 Buscando jogos da IGDB...');
        const games = await fetchGamesFromIGDB(300, 0); // Busca 100 jogos
        console.log(`✓ ${games.length} jogos encontrados\n`);

        // Insere jogos no banco
        console.log('💾 Inserindo jogos no banco de dados...\n');
        let successCount = 0;
        let startId = 1000; // Começa do ID 1000 para evitar conflitos

        for (let i = 0; i < games.length; i++) {
            const game = games[i];
            const success = await insertGame(game, startId);
            if (success) {
                successCount++;
                startId++;
            }
        }

        // Conta quantas imagens foram baixadas
        const gamesDir = path.join(__dirname, '..', 'src', 'public', 'games');
        let imageCount = 0;
        if (fs.existsSync(gamesDir)) {
            imageCount = fs.readdirSync(gamesDir).filter(f => f.startsWith('game-')).length;
        }

        console.log('\n╔════════════════════════════════════════════╗');
        console.log(`║  ✓ Processo concluído!                     ║`);
        console.log(`║    ${successCount}/${games.length} jogos inseridos com sucesso       ║`);
        console.log(`║    ${imageCount} imagens baixadas                      ║`);
        console.log('╚════════════════════════════════════════════╝');

    } catch (error) {
        console.error('\n❌ Erro fatal:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executa o script
main();
