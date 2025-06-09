import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {PrismaClient} from '@/app/generated/prisma';
import http from 'http';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined');
    process.exit(1);
}

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
        const user = await prisma.user.findUnique({
            where: {username},
        });

        if (!user) {
            const code = 401;
            return res.status(code).json({
                message: 'Invalid credentials. User not found.',
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Unauthorized',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            const code = 401;
            return res.status(code).json({
                message: 'Invalid credentials. Password incorrect.',
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Unauthorized',
            });
        }

        const token = jwt.sign(
            {userId: user.userId, username: user.username},
            JWT_SECRET,
            {expiresIn: '24h'}
        );

        const code = 200;
        return res.status(code).json({
            message: 'Login successful.',
            data: {token, userId: user.userId, username: user.username},
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'OK',
        });

    } catch (error) {
        console.error('Login error:', error);
        const code = 500;
        return res.status(code).json({
            message: 'Internal server error during login.',
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Internal Server Error',
        });
    } finally {
        await prisma.$disconnect();
    }
}