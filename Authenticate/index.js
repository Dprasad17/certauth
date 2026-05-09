/**
 * @format
 */

import { Buffer } from 'buffer';
global.Buffer = Buffer;
global.process = { env: {} };
global.location = { protocol: 'https:' };

// Polyfill TextEncoder/TextDecoder for otplib and other modular libraries
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = class TextEncoder {
        encode(string) { return Buffer.from(string, 'utf8'); }
    };
}
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = class TextDecoder {
        decode(buffer) { return Buffer.from(buffer).toString('utf8'); }
    };
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
