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

module.exports = authMiddleware; 