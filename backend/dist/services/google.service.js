"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = void 0;
const google_auth_library_1 = require("google-auth-library");
const env_1 = require("../config/env");
const client = new google_auth_library_1.OAuth2Client(env_1.env.GOOGLE_CLIENT_ID);
const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: env_1.env.GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    }
    catch (error) {
        console.error('Error verifying Google token:', error);
        throw new Error('Invalid Google token');
    }
};
exports.verifyGoogleToken = verifyGoogleToken;
