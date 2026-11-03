// Page scenes for jugadadeldia and pingalto (owner 2026-11-03: bases jdd-girl-r3-10 and pa-girl-r3-09, data/art/base/<site>/).
// One scene per page, edited from the base hosted at https://<domain>/_ref/girl-base.jpg; same face, hair and outfit; standing,
// full body, same camera distance (scale is normalised later by figure height and head size). Props are held by her and their
// colours are named, never green (chroma key). No help, author or service pages. No money, alcohol, celebration of winning, text or logos.
// node data/art/scenes.mjs -> data/art/<site>/scene-jobs.json
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

const PHONE = 'a black smartphone in a plain matte black case seen from the back (screen not visible, no logo)';
const TICKET = 'a blank pale cream paper slip with only thin grey printed lines and empty boxes, no numbers and no readable text';
const PENCIL = 'a plain yellow wooden pencil';
const BACKS = 'plain dark blue backs with a thin white border, no pattern and no logo';
const CARDS = `Spanish playing cards held with their backs toward the viewer (${BACKS})`;
const BALL = 'a plain white ball the size of a ping-pong ball, without any number';
const GRID = 'a pale cream cardboard card printed with an empty grid of squares, no numbers and no text';
const DICE = 'white dice with black pips';
const NOTEPAD = 'a small white spiral notepad whose page shows only short pencil tally strokes, no numbers';
const HEADSET = 'plain matte black over-ear headphones without logos or lights';
const PAD = 'a generic plain matte black game controller with a smooth rounded shape, no logos, no lights, no visible buttons, letters or symbols';
const MOUSE = 'a plain matte black computer mouse with no logo and no lights';

export const SITES = {
  jugadadeldia: {
    prefix: 'jdd-sc',
    ref: 'https://jugadadeldia.com/_ref/girl-base.jpg',
    who: 'She is a beautiful young Argentine woman of Syrian-Lebanese descent from Tucuman, 22 years old (adult), light olive skin, long thick dark brown hair in soft waves with curtain bangs, dark expressive eyes with long lashes, light natural makeup, slim natural adult figure.',
    outfit: 'a fitted cherry-red ribbed-knit mini dress with long sleeves and a modest square neckline, ending mid-thigh; black leather ankle boots with a block heel',
    extra: 'No lottery logos, no real lottery ticket designs.',
    scenes: {
      '/': [`She holds a fan of ${CARDS} in one hand at chest height and waves hello with the other hand`, 'warm welcoming smile, looking at the viewer'],
      '/quiniela/': [`She looks at ${PHONE} held in one hand, the other hand resting on her hip`, 'curious, attentive half smile'],
      '/quiniela/nacional-y-provincia/': ['She holds two blank pale cream paper slips with only thin grey lines (no numbers, no text), one in each hand, raised side by side at shoulder height, comparing them', 'focused comparing look'],
      '/quiniela/horarios/': [`She raises her left forearm and checks a plain silver wristwatch, the other hand holding ${PHONE} down by her side`, 'attentive look at the watch'],
      '/quiniela/cuanto-paga/': [`She holds ${TICKET} in one hand at chest height and writes on it with ${PENCIL} in the other hand`, 'concentrated, small smile'],
      '/quiniela/significado-de-los-numeros/': ['She stands with one finger on her chin, eyes looking up dreamily as if remembering a dream, holding a small closed pale blue notebook with a blank cover against her chest', 'dreamy, thoughtful'],
      '/quiniela/nacional/': ['She has a rolled plain cream paper sheet tucked under one arm and points to the side with the other hand', 'friendly explaining smile'],
      '/quiniela/provincia/': [`She holds ${TICKET} up next to her face with one hand, the other hand on her hip`, 'playful smile, looking at the viewer'],
      '/quiniela/tucuman/': ['She presents a fresh yellow lemon without leaves in her open palm at chest height, the other hand on her heart', 'proud warm smile'],
      '/quiniela/mendoza/': ['She holds a small bunch of dark purple grapes without leaves by its brown stem at shoulder height', 'cheerful smile'],
      '/quiniela/catamarca/': ['She holds a handful of whole walnuts in their light brown shells in both cupped hands at waist height', 'gentle smile, looking at the viewer'],
      '/quiniela/san-juan/': [`She shades her eyes with one hand as if looking into bright sunshine, the other hand holding ${TICKET} by her side`, 'squinting cheerful smile'],
      '/quiniela/cordoba/': ['She holds a round chocolate-covered alfajor cookie in a plain white paper wrapper near her smile, the other hand on her hip', 'playful smile'],
      '/quini-6/': [`She holds a small plain white ceramic bowl with six balls in it, each ${BALL}, at waist height with both hands`, 'bright smile, looking at the viewer'],
      '/quini-6/controlar/': [`She holds ${TICKET} in one hand and ${PHONE} in the other, looking from one to the other, checking`, 'focused look'],
      '/quini-6/como-se-juega/': [`She holds up ${BALL} between thumb and index finger at shoulder height, the other hand open with the palm up as if explaining`, 'teacher-like friendly smile'],
      '/loto-plus/': ['She holds a plain orange ball the size of a tennis ball, without any number, in her raised palm, looking at it', 'curious smile'],
      '/quiniela-plus/': [`She raises one index finger as if saying one more, the other hand holding ${TICKET} at her waist`, 'cheeky smile'],
      '/telekino/': [`She holds ${GRID} in both hands in front of her waist`, 'cheerful smile, looking at the viewer'],
      '/telekino/controlar/': [`She holds a pure white cardboard card printed with an empty grid of thin light grey squares (no numbers, no text) in one hand at chest height and taps one square on it with ${PENCIL}`, 'concentrated look'],
      '/tombola/santiaguena/': ['She holds a small bolillero (a little spinning cage of thin copper-coloured wire on a light wooden base with a small crank) against her hip with one arm and turns the crank with the other hand', 'amused smile'],
      '/tombola/jujena/': ['She holds a small woven cloth pouch with bright red, orange, purple and yellow stripes (no green) in front of her, one hand dipping into it as if drawing something out', 'curious smile'],
      '/truco/': [`She holds three ${CARDS} fanned close to her chest, the other hand on her hip`, 'sly confident half smile, one eyebrow slightly raised'],
      '/truco/valores-de-las-cartas/': [`She holds up a single Spanish playing card beside her face with its back toward the viewer (${BACKS}) and counts on the fingers of the other hand`, 'quizzical look'],
      '/truco/senas/': [`She winks with one eye while holding three ${CARDS} at chest height`, 'playful wink, closed lips'],
      '/truco/anotador/': [`She holds ${NOTEPAD} in one hand and draws a short stroke on it with ${PENCIL}`, 'concentrated smile'],
      '/truco/reglas/': ['She holds a small closed plain dark red book with a blank cover against her chest with one arm and raises the index finger of the other hand as if explaining a rule', 'friendly explaining look'],
      '/burako/': ['She holds a small light wooden tile rack in both hands at chest height with a row of plain ivory tiles standing on it, their blank backs toward the viewer', 'thinking look'],
      '/generala/': [`She shakes a brown leather dice cup held in one hand, the palm of the other hand covering its top`, 'excited focused smile'],
      '/dados/': [`She holds two ${DICE} in her cupped hands raised at chest height, about to roll them`, 'playful smile'],
      '/chinchon/': [`She holds a fan of seven ${CARDS} at chest height and touches the top edge of one card with a finger`, 'thoughtful look'],
      '/escoba-de-15/': [`She gathers a small neat stack of ${CARDS} into one hand with the other hand, as if collecting cards`, 'calm satisfied small smile'],
    },
  },
  pingalto: {
    prefix: 'pa-sc',
    ref: 'https://pingalto.com/_ref/girl-base.jpg',
    who: 'She is a young adult woman, 22 years old (adult), light olive skin, pastel pink shoulder-length shag haircut with curtain bangs, defined black winged eyeliner, a small silver septum ring, silver ear cuffs, black-ink tattoos on her arms, natural adult proportions.',
    outfit: 'a purple-and-black tartan mini skirt, a fitted black cropped t-shirt, an oversized washed-black denim jacket worn off the shoulders, black chunky platform sandals; bare legs, no tights, no stockings, no socks above the ankle; she always wears the denim jacket',
    extra: `Any headphones, mouse, keyboard or game controller is plain matte black with no logos, no lights and no visible buttons, letters or symbols; generic shapes that do not resemble any brand. No weapons, no game characters, no skins, no loot boxes, no monitors, no screens.`,
    scenes: {
      '/': [`She wears ${HEADSET} around her neck and holds ${PAD} in one hand at her hip, the other hand giving a small wave`, 'friendly confident smile, looking at the viewer'],
      '/kit/ping': [`She holds a small white home wifi router with two short white antennas and no lights in one hand at chest height, looking at it, ${PHONE} in the other hand`, 'skeptical curious look, one eyebrow raised'],
      '/kit/sensibilidad': [`She holds ${MOUSE} in her raised palm and adjusts it with the fingertips of the other hand; a rolled-up plain black mouse pad is tucked under her arm`, 'focused look'],
      '/kit/dpi': [`She holds a plain light blue plastic card the size of a bank card, completely smooth and flat (no chip, no stripe, no text, no pattern), in one hand at chest height and presses ${MOUSE} against the short edge of the card with the other hand, lining them up`, 'concentrated look'],
      '/tier-list': ['She holds a small white board against her hip with five white horizontal rows separated by thin grey lines, each row with one small coloured square at its left end (red, orange, yellow, light blue, purple from top to bottom), the rows otherwise empty, no letters; with the other hand she sticks a small plain pink square sticky note into one row', 'playful decisive smile'],
      '/ff/sensibilidad': [`She holds ${PHONE} horizontally in both hands like a handheld game at chest height, thumbs on the side facing her, playing`, 'focused, slight smile'],
      '/ff/nombres': [`She types on ${PHONE} with one thumb, looking at it, the other hand touching her chin`, 'thinking playful look'],
      '/ff/espacio-invisible': [`She holds ${PHONE} in one hand and with the other hand pinches the air between thumb and index finger as if holding something invisible, looking at that tiny gap`, 'amused mysterious smile'],
      '/valorant/rangos': [`She points upward with one index finger, the other hand on her hip, ${HEADSET} around her neck`, 'determined smile'],
      '/valorant/agentes': [`She stands in a confident pose with arms crossed, ${HEADSET} on her head`, 'cool confident look at the viewer'],
      '/cs2/mira': ['She makes a small circle with her thumb and index finger and holds it up to one eye like a playful spyglass, the other hand on her hip', 'one eye closed, concentrated half smile'],
      '/lol/rangos': [`She holds a compact plain black keyboard with blank keys (no letters, no symbols, no lights) under one arm and ${MOUSE} in the other hand`, 'calm proud smile'],
      '/fortnite/nube': [`She holds ${PHONE} in one hand and points up toward the sky with the other hand, looking up`, 'curious smile'],
    },
  },
};

export const slug = (url) => url === '/' ? 'home' : url.replace(/^\/|\/$/g, '').replace(/\//g, '-');
export const jobId = (site, url) => `${SITES[site].prefix}-${slug(url)}`;

function prompt(s, scene, expr) {
  return `Full-length wide photo of the whole figure, from the top of the hair down to the soles of the shoes, nothing cropped. Use the woman from the reference image as the character: exactly the same woman, same face, same facial features, same hair, same outfit, same body proportions. ${s.who} Outfit exactly as in the reference: ${s.outfit}. Scene: ${scene}. Her face is clearly visible: ${expr}. She is standing upright. Wide full-length shot taken from the same camera distance as the reference image: her entire body from the top of her hair down to the soles of her shoes fits inside the frame, the figure takes about 85 percent of the frame height, with empty green margin above the head and below the feet; nothing cropped. Every prop is held by her or touches her body; nothing floats separately. Adult woman with natural adult proportions, tasteful, fully clothed, not revealing, not sexualized. Photorealistic photo, soft even studio lighting, sharp focus, natural skin texture, natural hands with five fingers. Background: flat solid pure bright chroma key green (#00FF00), evenly lit, no vignette, no gradient, no shadows on the background, no floor line, no room. No green color anywhere on her clothes, hair, skin, makeup, shoes or props. No logos, no brand marks, no flags, no numbers, no words or letters anywhere, no symbols on any prop. ${s.extra} No money, no banknotes, no coins, no gambling chips, no drinks or alcohol, no cigarettes, no visible phone screens, no celebration of winning. Final check: the whole body including both legs and both shoes is visible inside the frame, as small in the frame as in the reference image.`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [site, s] of Object.entries(SITES)) {
    const jobs = Object.entries(s.scenes).map(([url, [scene, expr]]) => ({
      id: jobId(site, url), page: url, aspectRatio: '2:3', resolution: '2K', refs: [s.ref],
      note: `page scene ${url}`, prompt: prompt(s, scene, expr),
    }));
    for (const j of jobs) if (j.prompt.length > 4980) throw new Error(`${j.id}: prompt ${j.prompt.length}`);
    writeFileSync(join(HERE, site, 'scene-jobs.json'), JSON.stringify(jobs, null, 1) + '\n');
    console.log(`${site}: ${jobs.length} jobs, longest prompt ${Math.max(...jobs.map(j => j.prompt.length))}`);
  }
}
