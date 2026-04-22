import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- IDENTITY VAULT CLEANUP ---');

    // 1. Delete ghost records with 'Unnamed' label
    const deletedAuthenticators = await prisma.authenticator.deleteMany({
        where: {
            OR: [
                { label: 'Unnamed' },
                { uri: '' }
            ]
        }
    });

    console.log(`[Authenticators] Deleted ${deletedAuthenticators.count} ghost records.`);

    // 2. Identify and cleanup users without a valid email anchor
    // This is optional but helps keep the DB clean
    const deletedUsers = await prisma.user.deleteMany({
        where: {
            NOT: {
                email: { contains: '@' }
            }
        }
    });

    console.log(`[Users] Deleted ${deletedUsers.count} fragmented identities.`);
    console.log('--- CLEANUP COMPLETE ---');
}

main()
    .catch((e) => {
        console.error('[Cleanup Error]', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
