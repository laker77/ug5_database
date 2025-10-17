const fetch = require('node-fetch');
const FormData = require('form-data');
const formidable = require('formidable'); // Переконайтесь, що цей рядок є
const fs = require('fs');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const IMGBB_API_KEY = 'ce35f62fc096657f7b6d5aafacc2a2e3';

    const parseForm = (req) =>
        new Promise((resolve, reject) => {
            const form = new formidable.IncomingForm(); // Правильна ініціалізація
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

        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: imgbbFormData,
        });

        // Цей блок потрібен для діагностики, якщо ImgBB повертає помилку
        const responseText = await imgbbResponse.text();
        console.log('IMGbb Response:', responseText);
        const imgbbResult = JSON.parse(responseText);


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
