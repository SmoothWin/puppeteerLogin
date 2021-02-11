const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;
const fs = require('fs');

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

    fs.writeFileSync('./test.html',body.toString());
    const dom = new JSDOM(body.toString());
    var jSON = convert(dom);
    console.log(dom);


    function convert(html){
  
        const fullDay = new Map([
        ['Mon', 'Monday'],
        ['Tue', 'Tuesday'],
        ['Wed', 'Wednesday'],
        ['Thu', 'Thursday'],
        ['Fri', 'Friday'],
    ]);
    
        const courses = [...dom.window.document.querySelectorAll('TABLE')].pop().innerText.split(/\s\n/).filter(n => n.length && !/free block/gi.test(n));
        const schedule = {classes:[]}
        for(const course of courses){
    
            let [name, teacher, ...when] = course.split`\n`;
    
            name = name.split('\t').pop();
            teacher = teacher.match(/(?<=teacher: ).*/).pop();
            when = when.join``.trimStart().trimEnd()
            .match(/[A-Za-z]{3}\s+\d{2}:\d{2}\s+-\s+\d{2}:\d{2}/g).map(n=>{ const bits = n.replace('-','').replace(/\s+/g, ' ').split` `;
             return [ fullDay.get(bits[0]), [bits[1], bits[2]], ['zoomID', 'zoomPWD', 'zoomURL'] ] });
            schedule.classes.push({ name, teacher, when });
        }
        console.log(JSON.stringify(schedule))
    };

        fs.writeFileSync('./schedule.json', jSON);
   
  

    
   

};

module.exports = getSchedule;