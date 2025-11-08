const SessionManager = require('../sessions'); 

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            err: 'Token de autenticação não fornecido, inválido ou mal formatado',
        });
    }
    const token = authHeader.split(' ')[1];

    const sessionData = SessionManager.getSession(token); 
    
    if (!sessionData) {
        return res.status(401).json({
            err: 'Sessão inválida',
        });
    }

    req.session = { 
        type: sessionData.userType, 
        id: sessionData.userId 
    };

    next();
}

function authRequireType(types) {
    return (req, res, next) => {
        if (!req.sessao) {
            return res.status(401).json({ 
                errors: ['Não autenticado'],
                success: false,
            });
        }

        if (!types.includes(req.sessao.tipo)) {
            return res.status(403).json({
                errors: ['Acesso negado'],
                success: false,
            });
        }

        next();
    };
}

module.exports = {authMiddleware, authRequireType}; 