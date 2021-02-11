const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;
const fs = require('fs');

const fullDay = new Map([
    ['Mon', 'Monday'],
    ['Tue', 'Tuesday'],
    ['Wed', 'Wednesday'],
    ['Thu', 'Thursday'],
    ['Fri', 'Friday'],
]);

const scheduleJSON = require('./schedule.json');

 async function getSchedule(studentID, password){
    const browser = await puppeteer.launch({defaultViewport: null});
    const page = await browser.newPage();

        await page.goto('https://champlaincollege-st-lambert.omnivox.ca/', {waitUntil: 'networkidle0'});

        await page.type('#Identifiant',studentID);
        await page.type('#Password',password);

        await page.click('button[type="submit"]');

        try{
            await page.waitForSelector('#headerNavbarQuitter');
        } catch(error){
            console.log('Failed to login.');
            process.exit();
        }
    
    //click on schedule page
    await page.click('#ctl00_partOffreServices_offreV2_HOR');
    try{
        await page.waitForSelector('input[type="submit"]');
    }catch(error){
        console.log('failed to click the course schedule link');
        process.exit();
    }
    //select the most recent schedule from the select list
    let value =
    await page.evaluate(()=>{
        var selectArray = document.querySelector('select[name="AnSession"]');

        var lastValue = selectArray[selectArray.length - 1].text;

        return lastValue;
    });
    console.log(value);

    await page.type('select[name="AnSession"]', value);
    //proceed to schedule page
    await page.click('input[type="submit"]');

    await page.waitForNavigation({waitUntil: 'networkidle0'});

    await page.click('a[title="Printer-friendly version"]');

    try{
        await page.waitForSelector('input[type="SUBMIT"]');
    }catch(error){
        console.log('failed to click the printable version link');
        process.exit();
    }

    await page.click('#rdoAbrege');
    let body = null;

    await page.on('response',async resp => {
        if(resp.headers()['content-type'] === 'text/html'){
            body = await resp.text();
        }
        

    });
    

    await page.click('input[type="submit"]');

    await page.waitForTimeout(3000);

    await page.close();

    await browser.close();

    const { document } = new JSDOM(body.toString()).window;

    const { textContent:table } = [...document.querySelectorAll`table`].pop().firstElementChild;
    const classes = 
        table.split``.filter(n => n.charCodeAt() !== 160).join``
        .replace(/\dfree block\w{3}\d{2}\:\d{2}-\d{2}\:\d{2}/ig, '')
        .split(/\)\d/)
        .map(n => n.trim())
        .map(n => {


            const [ _, name, teacher ] = n.match(
                /\d?([A-Za-z ]+).*teacher: (?:(?:[A-Z]{2}|[A-Z][a-z]+)\s)+(?:[A-Z]{2}|[A-Z][a-z]+)/
            );

            const when = [];

            const iterator = n.matchAll(/([A-Z][a-z]{2})(\d{2}:\d{2})-(\d{2}:\d{2})/g);
            while(true){

                const { value, done } = iterator.next();

                if(value === undefined)break;

                const [ __, day, start, end ] = value;

                when.push(
                    [ fullDay.get(day), [ start, end ], ['zoomID', 'zoomPWD', 'zoomURL'] ]
                );

                if(done)break;
            }

            return { name, teacher, when };
        });

    const asJSON = JSON.stringify({
        course: {
            classes
        }
    }, null, 2);

    fs.writeFileSync('./schedule.json', asJSON);

};

module.exports = getSchedule;
