/**
 * Vercel Serverless Function — ConvertKit Subscriber Proxy
 * Uses v3 API with public api_key for form subscriptions.
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

    const { email, first_name, utm, referrer } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!CONVERTKIT_API_KEY) {
        console.error('CONVERTKIT_API_KEY not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const ALLOWED_UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const fields = {};
    if (utm && typeof utm === 'object') {
        for (const key of ALLOWED_UTM_KEYS) {
            if (typeof utm[key] === 'string' && utm[key]) {
                fields[key] = utm[key].slice(0, 200);
            }
        }
    }
    if (typeof referrer === 'string' && referrer) {
        fields.referrer = referrer.slice(0, 500);
    }

    try {
        const ckBody = {
            api_key: CONVERTKIT_API_KEY,
            email,
            first_name: first_name || ''
        };
        if (Object.keys(fields).length > 0) {
            ckBody.fields = fields;
        }

        const ckResponse = await fetch(
            `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ckBody)
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
