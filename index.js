const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

async function scrapeMediaHub(songName) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://mediahub-info.vercel.app', { waitUntil: 'networkidle2' });

        // Hacer clic en Herramientas
        await page.waitForSelector('button', { visible: true });
        await page.evaluate(() => {
            document.querySelectorAll('button').forEach(btn => {
                if (btn.innerText.includes('Herramientas')) btn.click();
            });
        });
        await page.waitForTimeout(2000);

        // Ingresar la canción en el campo de búsqueda
        await page.waitForSelector("input[placeholder='Ingresa el nombre de la canción o palabra c']");
        await page.type("input[placeholder='Ingresa el nombre de la canción o palabra c']", songName);
        await page.keyboard.press('Enter');

        // Esperar a que aparezca el botón de descargar
        await page.waitForSelector("a", { timeout: 10000 });

        // Extraer datos
        const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll("a").forEach(link => {
                if (link.innerText.includes("Descargar")) {
                    items.push({
                        title: link.closest(".result-item")?.querySelector(".title")?.innerText || "Desconocido",
                        download_link: link.href
                    });
                }
            });
            return items;
        });

        await browser.close();
        return { status: "success", data: results };

    } catch (error) {
        await browser.close();
        return { status: "error", message: error.message };
    }
}

app.get('/search', async (req, res) => {
    const songName = req.query.song || "";
    if (!songName.trim()) {
        return res.status(400).json({ status: "error", message: "No song name provided" });
    }

    const result = await scrapeMediaHub(songName);
    res.json(result);
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
