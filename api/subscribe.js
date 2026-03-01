/**
 * Vercel Serverless Function — ConvertKit Subscriber Proxy
 * Hides API key server-side.
 */

const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID || '9135329';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, first_name, fields, tags } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!CONVERTKIT_API_KEY) {
        console.error('CONVERTKIT_API_KEY not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const ckResponse = await fetch(
            `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_secret: CONVERTKIT_API_KEY,
                    email,
                    first_name: first_name || '',
                    fields: fields || {},
                    tags: tags || []
                })
            }
        );

        if (!ckResponse.ok) {
            const errorData = await ckResponse.json();
            console.error('ConvertKit error:', errorData);
            return res.status(ckResponse.status).json({
                success: false,
                error: errorData
            });
        }

        const ckData = await ckResponse.json();

        return res.status(200).json({
            success: true,
            data: ckData
        });
    } catch (error) {
        console.error('Subscribe endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
