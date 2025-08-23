const fetch = require('node-fetch');
const FormData = require('form-data');
const formidable = require('formidable');
const fs = require('fs');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const IMGBB_API_KEY = '23dc9b791442ba3b79d7d364a9c770d2';

    const parseForm = (req) =>
        new Promise((resolve, reject) => {
            const form = new formidable.IncomingForm();
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });
        });

    try {
        const [fields, files] = await parseForm(req);
        const imageFile = files.image && files.image[0];

        if (!imageFile) {
            return res.status(400).json({ success: false, error: 'No image file uploaded' });
        }

        const imgbbFormData = new FormData();
        const fileStream = fs.createReadStream(imageFile.filepath);
        imgbbFormData.append('image', fileStream);

        // --- ПОЧАТОК ВИПРАВЛЕНОГО БЛОКУ ---

        // 1. Спочатку виконуємо запит до ImgBB
        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: imgbbFormData,
        });

        // 2. Потім читаємо відповідь як ТЕКСТ, щоб побачити HTML-помилку
        const responseText = await imgbbResponse.text();
        console.log('IMGbb Response:', responseText); // Виводимо текст помилки в лог на Vercel

        // 3. Тепер намагаємося перетворити цей текст на JSON
        const imgbbResult = JSON.parse(responseText);

        // --- КІНЕЦЬ ВИПРАВЛЕНОГО БЛОКУ ---

        if (!imgbbResult.success) {
            console.error('ImgBB API Error:', imgbbResult);
            return res.status(500).json({
                success: false,
                error: 'Failed to upload image to ImgBB',
                details: imgbbResult
            });
        }

        return res.status(200).json({ success: true, data: imgbbResult.data });

    } catch (error) {
        console.error('Unhandled error in /api/upload:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports.config = {
    api: {
        bodyParser: false,
    },
};