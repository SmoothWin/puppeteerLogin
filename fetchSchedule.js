const puppeteer = require('puppeteer');
const fs = require('fs');

 async function findSchedule(){
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    if(Object.keys(cookies).length){
        await page.setCookie(...cookies);

        await page.goto('https://champlaincollege-st-lambert.omnivox.ca/', {waitUntil: 'networkidle2'});

    } else{

        await page.goto('https://champlaincollege-st-lambert.omnivox.ca/', {waitUntil: 'networkidle0'});

        await page.type('#Identifiant',studentID,{delay: 30});
        await page.type('#Password',password,{delay: 30});

        await page.click('button[type="submit"]');

        try{
            await page.waitFor('#headerNavbarQuitter');
        } catch(error){
            console.log('Failed to login.');
            process.exit(0);
        }

        let currentCookies = await page.cookies();
        fs.writeFileSync('./cookies.json', JSON.stringify(currentCookies));

    }
};