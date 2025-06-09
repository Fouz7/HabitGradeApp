import {PrismaClient} from '@/app/generated/prisma';
import bcrypt from 'bcryptjs';
import http from 'http';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        const code = 405;
        res.setHeader('Allow', ['POST']);
        return res.status(code).json({
            message: `Method ${req.method} Not Allowed`,
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Method Not Allowed',
        });
    }

    const {username, password} = req.body;

    if (!username || !password) {
        const code = 400;
        return res.status(code).json({
            message: 'Username and password are required.',
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Bad Request',
        });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: {username},
        });

        if (existingUser) {
            const code = 409;
            return res.status(code).json({
                message: 'Username already exists.',
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Conflict',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        const {password: _, ...userWithoutPassword} = user;
        const code = 201;
        return res.status(code).json({
            message: 'User created successfully.',
            data: {user: userWithoutPassword},
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Created',
        });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
            const code = 409;
            return res.status(code).json({
                message: 'Username already exists.',
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Conflict',
            });
        }
        const code = 500;
        return res.status(code).json({
            message: 'Internal server error during registration.',
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Internal Server Error',
        });
    } finally {
        await prisma.$disconnect();
    }
}