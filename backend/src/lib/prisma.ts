import { PrismaClient } from '@prisma/client';

/**
 * Prisma Singleton Pattern
 * Prevents "Too many clients" errors and Windows file locks (EPERM)
 * during 'tsx watch' reloads in development.
 */

const prismaClientSingleton = () => {
    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
