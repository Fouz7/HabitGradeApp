import { PrismaClient } from '@/app/generated/prisma';
import http from 'http';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { predictionId } = req.query;

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

    if (!predictionId) {
        const code = 400;
        return res.status(code).json({
            message: 'Prediction ID is required in the URL path.',
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Bad Request',
        });
    }

    try {
        const prediction = await prisma.prediction.findUnique({
            where: {
                predictionId: predictionId,
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                    },
                },
            },
        });

        if (!prediction) {
            const code = 404;
            return res.status(code).json({
                message: `Prediction with ID ${predictionId} not found.`,
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Not Found',
            });
        }

        const responseData = {
            predictionId: prediction.predictionId,
            studentName: prediction.studentName,
            age: prediction.age,
            gender_code: prediction.gender_code,
            study_hours_per_day: prediction.study_hours_per_day,
            social_media_hours: prediction.social_media_hours,
            netflix_hours: prediction.netflix_hours,
            part_time_job_code: prediction.part_time_job_code,
            attendance_percentage: prediction.attendance_percentage,
            sleep_hours: prediction.sleep_hours,
            diet_quality_code: prediction.diet_quality_code,
            exercise_frequency: prediction.exercise_frequency,
            parental_education_level_code: prediction.parental_education_level_code,
            internet_quality_code: prediction.internet_quality_code,
            mental_health_rating: prediction.mental_health_rating,
            extracurricular_participation_code: prediction.extracurricular_participation_code,
            exam_score: prediction.exam_score,
            generatedSuggestion: prediction.generatedSuggestion,
            createdAt: prediction.createdAt,
            user: prediction.user ? {
                userId: prediction.user.userId,
                username: prediction.user.username,
            } : null,
        };

        const code = 200;
        return res.status(code).json({
            message: 'Prediction details retrieved successfully.',
            data: responseData,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'OK',
        });

    } catch (error) {
        console.error(`Error fetching prediction ${predictionId}:`, error);
        if (error.code === 'P2023' || (error.message && error.message.toLowerCase().includes("malformed uuid"))) {
            const code = 400;
            return res.status(code).json({
                message: `Invalid Prediction ID format: ${predictionId}.`,
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Bad Request',
            });
        }
        if (error.message && error.message.toLowerCase().includes("invalid input syntax for type uuid")) {
             const code = 400;
             return res.status(code).json({
                 message: `Invalid Prediction ID format: ${predictionId}. Must be a valid UUID.`,
                 data: null,
                 statusCode: code,
                 statusMessage: http.STATUS_CODES[code] || 'Bad Request',
             });
        }
        const code = 500;
        return res.status(code).json({
            message: 'Internal server error while fetching prediction details.',
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Internal Server Error',
        });
    } finally {
        await prisma.$disconnect();
    }
}