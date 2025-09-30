const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchPinned(){
  try{
    const res = await fetch('https://github.com/Shu-AFK');
    const html = await res.text();
    const $ = cheerio.load(html);
    const pinned = [];
    $('.pinned-item-list-item').each((i, el)=>{
      const name = $(el).find('.repo').text().trim();
      const desc = $(el).find('.pinned-item-desc').text().trim() || '';
      const lang = $(el).find('[itemprop=programmingLanguage]').text().trim() || '';
      const url = 'https://github.com' + $(el).find('a').attr('href');
      if(name) pinned.push({ name, description: desc, lang, url });
    });
    if(!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/projects.json', JSON.stringify(pinned, null, 2));
    console.log('Wrote data/projects.json with', pinned.length, 'items');
  }catch(e){
    console.error('Failed to fetch pinned repos:', e.message);
  }
}
fetchPinned();
