import crypto from 'crypto';

export function sha256(message: string): string {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = crypto.createHash('sha256').update(msgBuffer);

    // convert bytes to hex string
    const hashHex = hashBuffer.digest('base64');
    return hashHex;
}