import * as tf from '@tensorflow/tfjs';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {PrismaClient} from '@/app/generated/prisma';
import http from 'http'; // Import http module for status messages

let model = null;
let genAI = null;
const prisma = new PrismaClient();

const GENDER_MAP = {0: 'Female', 1: 'Male', 2: 'Other'};
const PART_TIME_JOB_MAP = {0: 'No', 1: 'Yes'};
const DIET_QUALITY_MAP = {0: 'Fair', 1: 'Good', 2: 'Poor'};
const PARENTAL_EDUCATION_MAP = {0: 'Bachelor', 1: 'High School', 2: 'Master', 3: 'Unknown'};
const INTERNET_QUALITY_MAP = {0: 'Average', 1: 'Good', 2: 'Poor'};
const EXTRACURRICULAR_MAP = {0: 'No', 1: 'Yes'};

function getBaseUrl() {
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}`;
}

const MODEL_FILE_PATH = '/tfjs_model/model.json';

async function loadModel() {
    if (!model) {
        const baseUrl = getBaseUrl();
        const modelUrl = `${baseUrl}${MODEL_FILE_PATH}`;
        console.log(`Attempting to load model from: ${modelUrl}`);
        try {
            model = await tf.loadLayersModel(modelUrl);
            console.log("Model loaded successfully.");
        } catch (error) {
            console.error(`Error loading model from ${modelUrl}:`, error.message);
            if (error.cause) {
                console.error("Cause:", error.cause);
            }
            throw new Error(`Failed to load TensorFlow model from ${modelUrl}. Original error: ${error.message}`);
        }
    }
    return model;
}

function initializeGemini() {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

async function generateSuggestionWithGemini(inputData, examScore) {
    try {
        const gemini = initializeGemini();
        const geminiModel = gemini.getGenerativeModel({model: "gemini-1.5-flash"});

        const prompt = `
                        Seorang guru sedang melakukan survei terhadap murid-muridnya dan menggunakan aplikasi ini untuk mendapatkan saran.
                        Nama siswa adalah: ${inputData.studentName}.
                        Berdasarkan profil siswa berikut, berikan saran yang dapat ditindaklanjuti untuk membantu guru dalam meningkatkan nilai ujian siswa tersebut.
                        Prediksi nilai ujian siswa adalah: ${examScore.toFixed(2)}.
                        
                        Profil Siswa (berdasarkan hasil survei):
                        - Usia: ${inputData.age}
                        - Jam Belajar Per Hari: ${inputData.study_hours_per_day}
                        - Jam Media Sosial Per Hari: ${inputData.social_media_hours}
                        - Jam Menonton Netflix Per Hari: ${inputData.netflix_hours}
                        - Memiliki Pekerjaan Paruh Waktu: ${PART_TIME_JOB_MAP[inputData.part_time_job_code]}
                        - Persentase Kehadiran: ${inputData.attendance_percentage}%
                        - Jam Tidur Per Hari: ${inputData.sleep_hours}
                        - Kualitas Diet: ${DIET_QUALITY_MAP[inputData.diet_quality_code]}
                        - Frekuensi Olahraga (0-7 hari seminggu, di mana 0 tidak ada dan 7 setiap hari): ${inputData.exercise_frequency}
                        - Tingkat Pendidikan Orang Tua: ${PARENTAL_EDUCATION_MAP[inputData.parental_education_level_code]}
                        - Kualitas Internet: ${INTERNET_QUALITY_MAP[inputData.internet_quality_code]}
                        - Peringkat Kesehatan Mental (1-5, di mana 5 terbaik): ${inputData.mental_health_rating}
                        - Berpartisipasi dalam Kegiatan Ekstrakurikuler: ${EXTRACURRICULAR_MAP[inputData.extracurricular_participation_code]}
                        
                        Harap berikan saran yang spesifik, ringkas, dan bermanfaat yang dapat digunakan oleh guru untuk membantu siswa meningkatkan nilai ujiannya. Jangan sertakan jenis kelamin dalam saran Anda.
                        Fokus pada langkah-langkah yang dapat ditindaklanjuti terkait kebiasaan belajar, manajemen waktu, kesejahteraan, dan pemanfaatan sumber daya yang dapat disampaikan atau difasilitasi oleh guru.
                        Format saran sebagai paragraf singkat atau beberapa poin.
                                    `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating suggestion with Gemini:", error);
        return "Tidak dapat menghasilkan saran saat ini.";
    }
}

const INPUT_FEATURE_MEANS = [
    20.48375, 3.557875, 2.485, 1.82075, 84.256375, 6.464875, 3.06875, 5.4625,
    0.55625, 0.215, 0.7475, 1.01, 0.75125, 0.3225
];

const INPUT_FEATURE_STDS = [
    2.30102932, 1.48399393, 1.16715466, 1.09169338, 9.40908255, 1.2252464,
    2.01283965, 2.84931461, 0.5782179, 0.41082235, 0.74916203, 0.94069124,
    0.7066636, 0.46743315
];

function scaleInputFeatures(inputArray, means, stds) {
    return inputArray.map((value, index) => (value - means[index]) / stds[index]);
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

            const scaledInput = scaleInputFeatures(rawInput, INPUT_FEATURE_MEANS, INPUT_FEATURE_STDS);

            const loadedModel = await loadModel();
            const inputTensor = tf.tensor2d([scaledInput], [1, 14]);
            const output = loadedModel.predict(inputTensor);
            let predictionArray = Array.from(output.dataSync());
            let exam_score = 0;

            if (predictionArray && predictionArray.length > 0) {
                exam_score = predictionArray[0] - 35;
            }

            inputTensor.dispose();
            output.dispose();

            const generatedSuggestion = await generateSuggestionWithGemini(inputData, exam_score);

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
                    exam_score: parseFloat(exam_score),
                    generatedSuggestion: generatedSuggestion,
                }
            });

            const code = 200;
            res.status(code).json({
                message: "Prediksi dan saran berhasil dibuat dan disimpan.",
                data: {
                    ...inputData,
                    exam_score: exam_score,
                    generatedSuggestion: generatedSuggestion,
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

            if (err.code === 'P2025') { // Prisma specific error for record not found during relation write
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