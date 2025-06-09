import {PrismaClient} from '@/app/generated/prisma';
import http from 'http';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const {userId} = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    if (req.method !== 'GET') {
        const code = 405;
        res.setHeader('Allow', ['GET']);
        return res.status(code).json({
            message: `Method ${req.method} Not Allowed`,
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Method Not Allowed',
        });
    }

    if (!userId) {
        const code = 400;
        return res.status(code).json({
            message: 'User ID is required in the URL path.',
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Bad Request',
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                userId: userId,
            },
            select: {
                userId: true,
                username: true,
            },
        });

        if (!user) {
            const code = 404;
            return res.status(code).json({
                message: `User with ID ${userId} not found.`,
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Not Found',
            });
        }

        const totalPredictions = await prisma.prediction.count({
            where: {
                userId: userId,
            },
        });

        const predictionsData = await prisma.prediction.findMany({
            where: {
                userId: userId,
            },
            select: {
                predictionId: true,
                studentName: true,
                age: true,
                gender_code: true,
                exam_score: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: skip,
            take: limit,
        });

        const formattedPredictions = predictionsData.map(p => ({
            predictionId: p.predictionId,
            studentName: p.studentName,
            age: p.age,
            gender_code: p.gender_code,
            exam_score: p.exam_score,
            createdAt: p.createdAt,
        }));

        const totalPages = Math.ceil(totalPredictions / limit);

        const responseData = {
            user: {
                userId: user.userId,
                username: user.username,
            },
            predictions: formattedPredictions,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: totalPredictions,
                totalPages: totalPages,
            }
        };

        const message = formattedPredictions.length === 0 ?
            `No predictions found for user ${user.username} on page ${page}.` :
            'Predictions retrieved successfully.';

        const code = 200;
        return res.status(code).json({
            message: message,
            data: responseData,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'OK',
        });

    } catch (error) {
        console.error(`Error fetching predictions for user ${userId}:`, error);
        if (error.code === 'P2023' || (error.message && error.message.toLowerCase().includes("malformed uuid"))) {
            const code = 400;
            return res.status(code).json({
                message: `Invalid User ID format: ${userId}.`,
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Bad Request',
            });
        }
        const code = 500;
        return res.status(code).json({
            message: 'Internal server error while fetching predictions.',
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Internal Server Error',
        });
    } finally {
        await prisma.$disconnect();
    }
}