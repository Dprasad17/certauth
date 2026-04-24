import { PrismaClient } from '@prisma/client';
import { encryptSecret } from './src/utils/encryption.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Encryption...');
        const testData = 'test-blockchain-id';
        const encrypted = encryptSecret(testData);
        console.log(`Encryption successful: ${encrypted}`);

        console.log('Testing Prisma find/create...');
        const testEmail = 'test@example.com';
        const user = await prisma.user.upsert({
            where: { email: testEmail },
            update: {},
            create: {
                email: testEmail,
                password: 'test-password-hash',
                certificates: {
                    create: {
                        blockchainId: encrypted,
                        content: JSON.stringify({ id: 'test-blockchain-id' }),
                    }
                },
                authenticators: {
                    create: {
                        secret: 'test-secret',
                        label: 'Default Auth',
                    }
                }
            },
        });
        console.log(`Upsert successful. User ID: ${user.id}`);

    } catch (error) {
        console.error('Operation failed:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
