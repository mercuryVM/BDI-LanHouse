const crypto = require('crypto');

class SessionManager {
    constructor() {
        this.sessions = new Map();
    }

    createToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    createSession(userType, userId, date) {
        const token = this.createToken();
        this.sessions.set(token, {
            userType,
            userId,
            createAt: date,
            lastUse: date
        });

        return token;
    }

    getSession(token) {
        if (!this.sessions.has(token)) {
            return null;
        }

        const session = this.sessions.get(token);
        session.lastUse = new Date();
        this.sessions.set(token, session);

        return session;
    }

    deleteSession(token) {
        return this.sessions.delete(token);
    }
}

module.exports = new SessionManager();