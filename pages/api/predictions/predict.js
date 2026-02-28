import {GoogleGenerativeAI} from '@google/generative-ai';
import {PrismaClient} from '@/app/generated/prisma';
import http from 'http';

let genAI = null;
const prisma = new PrismaClient();

const GENDER_MAP = {0: 'Female', 1: 'Male', 2: 'Other'};
const PART_TIME_JOB_MAP = {0: 'No', 1: 'Yes'};
const DIET_QUALITY_MAP = {0: 'Fair', 1: 'Good', 2: 'Poor'};
const PARENTAL_EDUCATION_MAP = {0: 'Bachelor', 1: 'High School', 2: 'Master', 3: 'Unknown'};
const INTERNET_QUALITY_MAP = {0: 'Average', 1: 'Good', 2: 'Poor'};
const EXTRACURRICULAR_MAP = {0: 'No', 1: 'Yes'};

function initializeGemini() {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

async function predictAndSuggestWithGemini(inputData) {
    try {
        const gemini = initializeGemini();
        const geminiModel = gemini.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            Bertindaklah sebagai sistem prediksi kinerja siswa yang cerdas.
            Analisis profil siswa berikut dan lakukan dua hal:
            1. Prediksi nilai ujian siswa dalam skala 0-100 (float).
            2. Berikan saran yang dapat ditindaklanjuti untuk membantu siswa meningkatkan nilainya.

            Profil Siswa:
            - Nama: ${inputData.studentName}
            - Usia: ${inputData.age}
            - Jam Belajar Per Hari: ${inputData.study_hours_per_day}
            - Jam Media Sosial Per Hari: ${inputData.social_media_hours}
            - Jam Menonton Netflix Per Hari: ${inputData.netflix_hours}
            - Memiliki Pekerjaan Paruh Waktu: ${PART_TIME_JOB_MAP[inputData.part_time_job_code]}
            - Persentase Kehadiran: ${inputData.attendance_percentage}%
            - Jam Tidur Per Hari: ${inputData.sleep_hours}
            - Kualitas Diet: ${DIET_QUALITY_MAP[inputData.diet_quality_code]}
            - Frekuensi Olahraga: ${inputData.exercise_frequency} (0-7 hari/minggu)
            - Tingkat Pendidikan Orang Tua: ${PARENTAL_EDUCATION_MAP[inputData.parental_education_level_code]}
            - Kualitas Internet: ${INTERNET_QUALITY_MAP[inputData.internet_quality_code]}
            - Peringkat Kesehatan Mental: ${inputData.mental_health_rating} (1-5)
            - Kegiatan Ekstrakurikuler: ${EXTRACURRICULAR_MAP[inputData.extracurricular_participation_code]}

            Berikan output HANYA dalam format JSON dengan struktur berikut:
            {
                "predicted_score": number,
                "suggestion": "string"
            }
            
            Pastikan saran bersifat spesifik, ringkas, dan bermanfaat.
        `;

        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();
        
        const parsed = JSON.parse(responseText);
        return {
            score: parsed.predicted_score,
            suggestion: parsed.suggestion
        };

    } catch (error) {
        console.error("Error generating prediction with Gemini:", error);
        throw new Error("Gagal menghasilkan prediksi dengan Gemini.");
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const inputData = req.body;
            const {
                userId,
                studentName,
                age, gender_code, study_hours_per_day, social_media_hours,
                netflix_hours, part_time_job_code, attendance_percentage,
                sleep_hours, diet_quality_code, exercise_frequency,
                parental_education_level_code, internet_quality_code,
                mental_health_rating, extracurricular_participation_code
            } = inputData;

            if (!userId) {
                const code = 400;
                return res.status(code).json({
                    message: "userId diperlukan dalam body permintaan.",
                    data: null,
                    statusCode: code,
                    statusMessage: http.STATUS_CODES[code] || 'Bad Request'
                });
            }
            if (!studentName) {
                const code = 400;
                return res.status(code).json({
                    message: "studentName diperlukan dalam body permintaan.",
                    data: null,
                    statusCode: code,
                    statusMessage: http.STATUS_CODES[code] || 'Bad Request'
                });
            }

            const userExists = await prisma.user.findUnique({where: {userId}});
            if (!userExists) {
                const code = 404;
                return res.status(code).json({
                    message: "User tidak ditemukan.",
                    data: null,
                    statusCode: code,
                    statusMessage: http.STATUS_CODES[code] || 'Not Found'
                });
            }

            const rawInput = [
                age, gender_code, study_hours_per_day, social_media_hours,
                netflix_hours, part_time_job_code, attendance_percentage,
                sleep_hours, diet_quality_code, exercise_frequency,
                parental_education_level_code, internet_quality_code,
                mental_health_rating, extracurricular_participation_code
            ];

            if (rawInput.some(val => typeof val === 'undefined')) {
                const code = 400;
                return res.status(code).json({
                    message: "Satu atau lebih kolom input (selain studentName dan userId) hilang dalam body permintaan.",
                    data: null,
                    statusCode: code,
                    statusMessage: http.STATUS_CODES[code] || 'Bad Request'
                });
            }
            if (rawInput.length !== 14) {
                const code = 400;
                return res.status(code).json({
                    message: `Diharapkan 14 fitur input (selain studentName dan userId), tetapi menerima ${rawInput.length}.`,
                    data: null,
                    statusCode: code,
                    statusMessage: http.STATUS_CODES[code] || 'Bad Request'
                });
            }

            const { score, suggestion } = await predictAndSuggestWithGemini(inputData);

            const savedPrediction = await prisma.prediction.create({
                data: {
                    userId: userId,
                    studentName: studentName,
                    age: parseInt(age),
                    gender_code: parseInt(gender_code),
                    study_hours_per_day: parseFloat(study_hours_per_day),
                    social_media_hours: parseFloat(social_media_hours),
                    netflix_hours: parseFloat(netflix_hours),
                    part_time_job_code: parseInt(part_time_job_code),
                    attendance_percentage: parseFloat(attendance_percentage),
                    sleep_hours: parseFloat(sleep_hours),
                    diet_quality_code: parseInt(diet_quality_code),
                    exercise_frequency: parseInt(exercise_frequency),
                    parental_education_level_code: parseInt(parental_education_level_code),
                    internet_quality_code: parseInt(internet_quality_code),
                    mental_health_rating: parseInt(mental_health_rating),
                    extracurricular_participation_code: parseInt(extracurricular_participation_code),
                    exam_score: parseFloat(score),
                    generatedSuggestion: suggestion,
                }
            });

            const code = 200;
            res.status(code).json({
                message: "Prediksi dan saran berhasil dibuat dan disimpan.",
                data: {
                    ...inputData,
                    exam_score: score,
                    generatedSuggestion: suggestion,
                    predictionId: savedPrediction.predictionId
                },
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'OK'
            });

        } catch (err) {
            console.error("Error di handler:", err.message);
            if (err.cause) {
                console.error("Penyebab error handler:", err.cause);
            }

            if (err.code === 'P2025') { 
                const code = 404;
                return res.status(code).json({
                    message: "Gagal menyimpan prediksi: User terkait tidak ditemukan.",
                    data: null,
                    statusCode: code,
                    statusMessage: http.STATUS_CODES[code] || 'Not Found'
                });
            }
            const code = 500;
            res.status(code).json({
                message: err.message || "Terjadi kesalahan server internal.",
                data: null,
                statusCode: code,
                statusMessage: http.STATUS_CODES[code] || 'Internal Server Error'
            });
        } finally {
            await prisma.$disconnect();
        }
    } else {
        const code = 405;
        res.setHeader('Allow', ['POST']);
        res.status(code).json({
            message: `Metode ${req.method} Tidak Diizinkan`,
            data: null,
            statusCode: code,
            statusMessage: http.STATUS_CODES[code] || 'Method Not Allowed'
        });
    }
}
