export default function handler(req, res) {
    const url = process.env.VITE_SUPABASE_URL || 'NOT_FOUND';
    const key = process.env.VITE_SUPABASE_ANON_KEY || 'NOT_FOUND';

    const diag = {
        url: {
            length: url.length,
            prefix: url.substring(0, 8),
            suffix: url.substring(url.length - 5),
            hasWhitespace: /\s/.test(url),
            isHttp: url.startsWith('http')
        },
        key: {
            length: key.length,
            isPresent: key !== 'NOT_FOUND'
        },
        env_keys: Object.keys(process.env).filter(k => k.startsWith('VITE_'))
    };

    res.status(200).json(diag);
}
