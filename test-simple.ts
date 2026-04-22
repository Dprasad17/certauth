import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing raw Prisma upsert...');
        const user = await prisma.user.upsert({
            where: { email: 'simple-test@example.com' },
            update: {},
            create: {
                email: 'simple-test@example.com',
                authenticators: {
                    create: {
                        secret: 'test-secret',
                        label: 'Test Auth',
                    }
                }
            },
        });
        console.log('Upsert success:', user.id);
    } catch (err: any) {
        console.log('UPSERT FAILED');
        console.log('Code:', err.code);
        console.log('Message:', err.message);
        console.log('Meta:', JSON.stringify(err.meta));
    } finally {
        await prisma.$disconnect();
    }
}

main();
