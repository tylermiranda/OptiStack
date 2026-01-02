import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://www.amazon.com/dp/B0DC69925N'; // Random product ID

const scrape = async () => {
    console.log(`Attempting to fetch: ${url}`);

    // Exact headers from server.js
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/'
    };

    try {
        const response = await axios.get(url, { headers });
        console.log(`Status: ${response.status}`);
        console.log(`Data Length: ${response.data.length}`);

        const html = response.data;
        const $ = cheerio.load(html);
        const title = $('#productTitle').text().trim();
        console.log(`Title found: ${title}`);

        if (!title) {
            console.log('WARNING: Title not found. Possible captcha page.');
            // Check for captcha specific text
            if (html.includes('api-services-support@amazon.com')) {
                console.log('DETECTED: Amazon Captcha/Bot Block');
            }
        }

    } catch (error) {
        console.error('Error fetching:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`StatusText: ${error.response.statusText}`);
            // console.log(error.response.data); // Too verbose
        } else {
            console.error(error.message);
        }
    }
};

scrape();
