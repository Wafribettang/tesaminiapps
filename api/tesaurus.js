const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors()); // Izin agar web bisa akses API ini
app.use(express.json());

async function scrapeTesaurus(query) {
    try {
        const formData = new URLSearchParams();
        formData.append('user_input', query);
        formData.append('search_keyword', 'Cari');
        formData.append('postag', '0');
        
        const { data } = await axios.post('https://tesaurus.kemendikdasmen.go.id/tematis/index.php', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        const $ = cheerio.load(data);
        let results = [];

        $('.result-set').each((i, el) => {
            const label = $(el).find('.article-label').text().trim();
            const content = $(el).find('.one-par-content').text().trim();
            
            if (label && content) {
                results.push({
                    kelas_kata: label,
                    sinonim: content.split(',').map(s => s.trim())
                });
            }
        });

        return results;
    } catch (e) {
        throw new Error('Gagal terhubung ke pusat data Tesaurus.');
    }
}

// Endpoint API
app.get('/api/tesaurus', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Masukkan kata kunci.' });

    try {
        const data = await scrapeTesaurus(query);
        if (data.length === 0) {
            return res.status(404).json({ error: 'Kata tidak ditemukan.' });
        }
        res.json({ status: 'success', query, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Jalankan server jika lokal
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
