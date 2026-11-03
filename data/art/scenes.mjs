// Page scenes for jugadadeldia and pingalto, round 2 (owner 2026-11-03: "scenes are boring, the girls can sit and do something
// while sitting, more movement; the jacket is only half on in two images"). Bases jdd-girl-r3-10 and pa-girl-r3-09
// (data/art/base/<site>/, hosted at https://<domain>/_ref/girl-base.jpg). One scene per page, edited from the base: same face,
// hair and the complete outfit worn correctly; varied poses (stool, chair, table edge, floor cushion, kneeling, walking, turning,
// a light jump) with an action that fits the page. Seats and props are white, black or wood, never green (chroma key).
// Seated poses in a mini dress or skirt stay modest (knees together or legs crossed, camera at eye level).
// Scale is normalised later by head size (build-scenes.mjs). keepAll: the scene has a separate prop (dice in mid-air, cards on
// the floor) that the cut must keep. No help, author or service pages. No money, alcohol, text or logos.
// Round 3 (owner 2026-11-03: "scenes are great, always make this kind"; pingalto /kit/sensibilidad redone, one scene for every
// live page that had none): the same standard, the round is set per scene ({ round: 'r3' }), so the job id says which round made it.
// alt: es-AR text for the page (data/art/publish-scenes.mjs puts it in sites/<site>/content/scenes.json).
// node data/art/scenes.mjs -> data/art/<site>/scene-<round>-jobs.json (one file per round)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROUND = 'r2';

const PHONE = 'a black smartphone in a plain matte black case seen from the back (screen not visible, no logo)';
const TICKET = 'a blank pale cream paper slip with only thin grey printed lines and empty boxes, no numbers and no readable text';
const PENCIL = 'a plain yellow wooden pencil';
const BACKS = 'plain dark blue backs with a thin white border, no pattern and no logo';
const CARDS = `Spanish playing cards held with their backs toward the viewer (${BACKS})`;
const BALL = 'a plain white ball the size of a ping-pong ball, without any number';
const GRID = 'a pale cream cardboard card printed with an empty grid of squares, no numbers and no text';
const DICE = 'large white dice with black pips';
const NOTEPAD = 'a small white spiral notepad whose page shows only short pencil tally strokes, no numbers';
const HEADSET = 'plain matte black over-ear headphones without logos or lights';
const PAD = 'a generic plain matte black game controller with a smooth rounded shape, no logos, no lights, no visible buttons, letters or symbols';
const MOUSE = 'a plain matte black computer mouse with no logo and no lights';
const MOUSEPAD = 'a large plain matte black cloth gaming mouse pad with no logo, no print and no visible pattern';

const SEATS = {
  stool: 'a plain white round stool with four thin white legs',
  wstool: 'a plain light natural wood stool with four legs',
  chair: 'a simple plain white chair with a straight back and four thin white legs',
  table: 'a plain white rectangular table with four thin white legs',
  cushion: 'a flat square plain white floor cushion on the floor',
  kneel: null,
};
const S = SEATS;

export const SITES = {
  jugadadeldia: {
    prefix: 'jdd-sc',
    ref: 'https://jugadadeldia.com/_ref/girl-base.jpg',
    who: 'She is a beautiful young Argentine woman of Syrian-Lebanese descent from Tucuman, 22 years old (adult), light olive skin, long thick dark brown hair in soft waves with curtain bangs, dark expressive eyes with long lashes, light natural makeup, slim natural adult figure.',
    outfit: 'the same fitted cherry-red ribbed-knit mini dress with long sleeves and a modest square neckline, ending mid-thigh, worn neatly and completely; the same black leather ankle boots with a block heel on both feet; no jacket, no tights, no other garments',
    garment: 'dress',
    extra: 'No lottery logos, no real lottery ticket designs.',
    scenes: {
      '/': ['stool', `She sits on ${S.stool}, legs crossed at the knee, and shuffles a deck of Spanish playing cards between her hands at chest height in a bridge shuffle, the cards arching between her hands, only their backs visible (${BACKS})`, 'warm welcoming smile, looking at the viewer'],
      '/quiniela/': ['walk', `She walks toward the camera mid-step, one heel lifted off the ground, looking down at ${PHONE} held in one hand, the other arm swinging naturally`, 'curious, attentive half smile'],
      '/quiniela/nacional-y-provincia/': ['wstool', `She sits on ${S.wstool}, legs crossed at the knee, body turned three-quarters to the side, and holds two blank pale cream paper slips with only thin grey lines (no numbers, no text), one in each hand, comparing them`, 'focused comparing look, head slightly tilted'],
      '/quiniela/horarios/': ['turn', 'She is caught mid-turn: her body turns away to one side while she looks back over her shoulder at the viewer, her long hair swinging; she raises her left forearm and taps a plain silver wristwatch with one finger', 'playful in-a-hurry look, bright smile'],
      '/quiniela/cuanto-paga/': ['table', `She sits perched on the edge of ${S.table}, ankles crossed, knees together, one hand holding ${TICKET} flat on her knee while she writes on it with ${PENCIL}`, 'concentrated, small smile'],
      '/quiniela/significado-de-los-numeros/': ['kneel', 'She kneels on the floor sitting back on her heels, knees together, hugging a small closed pale blue notebook with a blank cover to her chest with one arm, one fingertip on her chin, eyes looking up dreamily as if remembering a dream', 'dreamy thoughtful smile'],
      '/quiniela/nacional/': ['walk', 'She strides briskly to one side mid-step, a rolled plain cream paper sheet tucked under one arm, pointing ahead with the other hand', 'laughing, cheerful'],
      '/quiniela/provincia/': ['chair', `She sits sideways on ${S.chair}, legs crossed at the knee, one forearm resting on the top of the chair back, holding ${TICKET} up next to her face with the other hand`, 'playful smile, looking at the viewer'],
      '/quiniela/tucuman/': ['stand', 'She leans forward a little from the hips, offering a fresh yellow lemon without leaves toward the camera in both cupped hands, one boot lifted playfully behind her', 'proud warm laughing smile'],
      '/quiniela/mendoza/': ['wstool', `She sits on ${S.wstool}, ankles crossed, knees together, holding a small bunch of dark purple grapes without leaves up by its brown stem and picking one grape off with her other hand`, 'cheerful smile'],
      '/quiniela/catamarca/': ['kneel', 'She kneels upright on both knees on the floor, cracking a whole walnut in its light brown shell between her hands, a few more walnuts in a small plain light wooden bowl on the floor touching her knees', 'gentle amused smile', { keepAll: true }],
      '/quiniela/san-juan/': ['walk', `She walks toward the camera mid-step as if into bright sunshine, shading her eyes with one hand, the other hand holding ${TICKET} down by her side`, 'squinting cheerful smile'],
      '/quiniela/cordoba/': ['table', `She sits on the edge of ${S.table}, legs crossed at the knee, about to bite into a round chocolate-covered alfajor cookie held half out of a plain white paper wrapper`, 'playful, delighted'],
      '/quini-6/': ['cushion', `She sits on ${S.cushion} with her legs folded together to one side, knees together, a small plain white ceramic bowl in her lap holding six balls, each ${BALL}; she lifts one ball out with her fingertips and looks at it`, 'bright smile'],
      '/quini-6/controlar/': ['stand', `She stands with her weight on one leg, hips tilted, holding ${TICKET} in one hand and ${PHONE} in the other, her eyes going from the slip to the phone, checking`, 'focused look, lips pressed together'],
      '/quini-6/como-se-juega/': ['chair', `She sits on the front edge of ${S.chair}, leaning forward toward the viewer, knees together, holding up ${BALL} between thumb and index finger, the other hand open with the palm up as if explaining`, 'teacher-like friendly smile'],
      '/loto-plus/': ['stand', 'She tosses a plain orange ball the size of a tennis ball, without any number, lightly from one hand to the other: the ball is in mid-air a little above and between her hands; one knee is bent playfully', 'curious playful smile, eyes on the ball', { keepAll: true }],
      '/quiniela-plus/': ['stool', `She sits on ${S.stool}, legs crossed at the knee, leaning forward, raising one index finger as if saying one more, the other hand holding ${TICKET} on her knee`, 'cheeky smile'],
      '/telekino/': ['walk', `She walks toward the camera mid-step carrying ${GRID} in both hands in front of her waist, looking down at it`, 'cheerful smile'],
      '/telekino/controlar/': ['cushion', `She sits on ${S.cushion} with her legs folded together to one side, a pure white cardboard card printed with an empty grid of thin light grey squares (no numbers, no text) resting on her lap, tapping one square on it with ${PENCIL}`, 'concentrated look'],
      '/tombola/santiaguena/': ['kneel', 'She kneels on the floor sitting back on her heels, knees together, turning the small crank of a little bolillero (a small spinning cage of thin copper-coloured wire on a light wooden base) that stands on the floor touching her knees', 'amused laughing smile', { keepAll: true }],
      '/tombola/jujena/': ['stand', 'She stands bending forward a little, peeking curiously into a small woven cloth pouch with bright red, orange, purple and yellow stripes (no green) held open in one hand, the other hand dipping into it', 'curious smile'],
      '/truco/': ['cushion', `She sits on ${S.cushion} with her legs folded together to one side and deals Spanish playing cards face down onto the floor in front of her: three cards already lie face down on the floor next to the cushion (${BACKS}), she places a fourth, the rest of the deck in her other hand`, 'sly confident half smile, one eyebrow slightly raised', { keepAll: true }],
      '/truco/valores-de-las-cartas/': ['walk', `She walks mid-step, holding up a single Spanish playing card beside her face with its back toward the viewer (${BACKS}) and counting on the fingers of the other hand`, 'quizzical look'],
      '/truco/senas/': ['chair', `She sits on ${S.chair} leaning forward, forearms resting on her knees, knees together, holding three ${CARDS} fanned close to her chest`, 'playful wink with one eye, closed lips'],
      '/truco/anotador/': ['table', `She sits on the edge of ${S.table}, legs crossed at the knee, ${NOTEPAD} resting on her knee, drawing a short stroke on it with ${PENCIL}`, 'concentrated smile'],
      '/truco/reglas/': ['stand', 'She stands mid-gesture, explaining: a small closed plain dark red book with a blank cover tucked under one arm, the index finger of the other hand raised, leaning slightly toward the viewer', 'friendly laughing explaining look'],
      '/burako/': ['wstool', `She sits on ${S.wstool}, knees together, a small light wooden tile rack resting on her knees with a row of plain ivory tiles standing on it, their blank backs toward the viewer; she slides one tile along the rack with a fingertip`, 'thinking look'],
      '/generala/': ['stand', 'She shakes a brown leather dice cup held up beside her shoulder, the palm of the other hand covering its top, her hair swinging with the motion, one knee bent', 'excited focused smile'],
      '/dados/': ['kneel', `She kneels upright on both knees on the floor and has just rolled two ${DICE} from her hand: the dice tumble in mid-air just in front of her open hand, a little below it`, 'playful excited smile', { keepAll: true }],
      '/chinchon/': ['chair', `She sits on ${S.chair}, legs crossed at the knee, holding a fan of seven ${CARDS} in one hand and sipping from a traditional mate (a small round brown calabash gourd with a silver metal straw) held in the other hand`, 'thoughtful look over the cards', { mate: true }],
      '/quiniela/redoblona/': ['wstool', `She sits on ${S.wstool}, legs crossed at the knee, leaning toward the viewer and showing two balls held together between the thumb and fingers of one hand, each ${BALL}, the other hand resting on her knee`, 'cheeky smile, one eyebrow raised', { round: 'r3' }],
      '/brinco/': ['jump', `She does a light playful jump, both feet just off the ground, knees bent and boots kicked back, holding ${TICKET} up in one hand, the other arm out for balance, her hair flying`, 'joyful laughing open smile', { round: 'r3' }],
      '/poceada/': ['kneel', `She kneels upright on both knees on the floor and drops one ball into a small clear glass jar half full of the same balls, each ${BALL}; the jar stands on the floor touching her knees`, 'hopeful playful smile, eyes on the ball', { keepAll: true, round: 'r3' }],
      '/truco/jugar/': ['table', `She sits on the edge of ${S.table}, legs crossed at the knee, and flicks one Spanish playing card forward with a snap of her wrist as if throwing it on the table, its back toward the viewer (${BACKS}); her other hand holds two more cards close to her chest`, 'confident daring grin, as if calling truco', { round: 'r3' }],
      '/truco/envido/': ['stool', `She sits on ${S.stool}, ankles crossed, knees together, holding two ${CARDS} fanned in one hand near her chin and counting on the fingers of the other hand`, 'thinking look, eyes up, lips pressed in a small smile', { round: 'r3' }],
      '/juegos-de-cartas/': ['chair', `She sits on ${S.chair}, legs crossed at the knee, holding a wide fan of ${CARDS} in one hand and a brown leather dice cup in the other hand resting on her knee`, 'warm inviting smile, looking at the viewer', { round: 'r3' }],
      '/generala/jugar/': ['stool', `She sits on ${S.stool}, ankles crossed, knees pressed together, leaning a little to one side and pouring dice out of a brown leather dice cup held out beside her knees: five ${DICE} tumble in mid-air just below the mouth of the cup`, 'excited open-mouthed smile, eyes on the dice', { keepAll: true, round: 'r3' }],
      '/generala/probabilidades/': ['table', `She sits on the edge of ${S.table}, knees together, holding one of the ${DICE} up between thumb and index finger and studying it closely, ${NOTEPAD} resting on her knee`, 'curious analytical look, small smile', { round: 'r3' }],
      '/chinchon/jugar/': ['stand', `She stands with her weight on one leg and her hip tilted, holding a fan of seven ${CARDS} in one hand and pulling one card out of the middle of the fan with the other hand, rearranging her hand`, 'focused look, lips pursed', { round: 'r3' }],
      '/escoba-de-15/jugar/': ['kneel', `She kneels on the floor sitting back on her heels, knees together, and sweeps four Spanish playing cards lying face down on the floor in front of her knees together with the side of one hand (${BACKS}), the other hand on her thigh`, 'triumphant playful smile', { keepAll: true, round: 'r3' }],
      '/escoba-de-15/': ['table', `She sits on the edge of ${S.table}, body turned three-quarters to the side, legs crossed at the knee, sweeping a few Spanish playing cards together into a neat stack in her hands, only their backs visible (${BACKS})`, 'calm satisfied small smile'],
    },
  },
  pingalto: {
    prefix: 'pa-sc',
    ref: 'https://pingalto.com/_ref/girl-base.jpg',
    who: 'She is a young adult woman, 22 years old (adult), light olive skin, pastel pink shoulder-length shag haircut with curtain bangs, defined black winged eyeliner, a small silver septum ring, silver ear cuffs, black-ink tattoos on her forearms, natural adult proportions.',
    outfit: 'the same purple-and-black tartan mini skirt; the same fitted black cropped t-shirt; the same oversized washed-black denim jacket, worn properly: pulled fully up onto BOTH shoulders, both arms all the way inside both sleeves, the collar sitting around her neck, the jacket open at the front; it does not slip off either shoulder (unlike the reference, where it hangs off one shoulder); the sleeves pushed up to just below the elbows so her forearm tattoos show; the same black chunky platform sandals; bare legs, no tights, no stockings, no socks above the ankle',
    garment: 'skirt',
    extra: 'Any headphones, mouse, keyboard or game controller is plain matte black with no logos, no lights and no visible buttons, letters or symbols; generic shapes that do not resemble any brand. No weapons, no game characters, no skins, no loot boxes, no monitors, no screens.',
    scenes: {
      '/': ['stool', `She sits on ${S.stool}, legs crossed at the knee, ${HEADSET} around her neck, playing on ${PAD} held in both hands, leaning forward into the game`, 'excited concentrated grin'],
      '/kit/ping': ['walk', `She walks toward the camera mid-step, holding a small white home wifi router with two short white antennas and no lights up at shoulder height in one hand, frowning at it, ${PHONE} in the other hand`, 'skeptical curious look, one eyebrow raised'],
      '/kit/sensibilidad': ['chair', `She sits on ${S.chair}, knees pressed together, with a large flat rigid mouse pad lying across her lap and covering her thighs; the pad is completely plain matte black on top, with no logo, no mark, no print, no stitching and no symbol in any corner. There is exactly one mouse in the image: her right hand grips ${MOUSE} on the pad, sliding it to the side mid-motion; her left hand steadies the edge of the pad and holds nothing. No table. No paper and no white sheets anywhere; her bare legs have natural matte skin with no shine and no bright highlights`, 'focused look down at her hand on the mouse', { round: 'r3' }],
      '/kit/dpi': ['table', `She sits on the edge of ${S.table}, body turned three-quarters to the side, legs crossed at the knee, holding a plain light blue plastic card the size of a bank card, completely smooth and flat (no chip, no stripe, no text, no pattern), in one hand and pressing ${MOUSE} against the short edge of the card with the other hand, lining them up`, 'concentrated look'],
      '/tier-list': ['stand', 'She stands holding a small white board against her hip with five white horizontal rows separated by thin grey lines, each row with one small coloured square at its left end (red, orange, yellow, light blue, purple from top to bottom), the rows otherwise empty, no letters; with the other hand she slaps a small plain pink square sticky note into one row, mid-motion, her hair bouncing', 'playful decisive grin'],
      '/ff/sensibilidad': ['chair', `She sits on ${S.chair}, body turned three-quarters to the side, legs crossed at the knee, leaning forward, holding ${PHONE} horizontally in both hands like a handheld game, both thumbs pressing on the side facing her`, 'intense focus, slight smile'],
      '/ff/nombres': ['kneel', `She kneels on the floor sitting back on her heels, knees together, typing on ${PHONE} with both thumbs, the phone held in both hands`, 'thinking playful look, small smile'],
      '/ff/espacio-invisible': ['turn', `She is mid-step, turning toward the viewer, wearing the denim jacket with both arms fully inside both sleeves and the jacket on both shoulders, ${PHONE} in one hand, the other hand raised and pinching the air between thumb and index finger as if holding something invisible, looking at that tiny gap`, 'amused mysterious smile'],
      '/valorant/rangos': ['jump', `She jumps lightly, both feet just off the ground, celebrating a great game moment with a fist pump, ${HEADSET} around her neck`, 'joyful open-mouthed cheer'],
      '/valorant/agentes': ['wstool', `She sits on ${S.wstool} turned partly sideways, legs crossed at the knee, wearing ${HEADSET} on her head, one hand adjusting an ear cup while she talks to her team`, 'animated, mouth open mid-sentence'],
      '/cs2/mira': ['stand', 'She stands upright with her weight on one leg and her head tilted, one hand on her hip, making a small circle with the thumb and index finger of the other hand and holding it up to one eye like a playful spyglass', 'one eye closed, concentrated half smile'],
      '/lol/rangos': ['chair', `She sits on ${S.chair}, knees together, a compact plain black keyboard with blank keys (no letters, no symbols, no lights) resting on her lap, typing on it with both hands`, 'calm focused smile'],
      '/ff': ['walk', `She runs toward the camera in a light jog mid-stride, holding ${PHONE} in one hand, looking back over her shoulder with her hair swinging; both platform sandals stay close to the ground, and her bare legs are evenly lit from the front with natural skin colour down to the ankles, with no green light reflected on them`, 'excited thrilled grin', { round: 'r3' }],
      '/ff/codigos': ['wstool', `She sits on ${S.wstool}, legs crossed at the knee, holding ${PHONE} in one hand and raising the other hand with the palm out toward the viewer in a stop gesture`, 'wary skeptical look, one eyebrow raised, lips pressed', { round: 'r3' }],
      '/valorant': ['walk', `She walks toward the camera mid-step, putting ${HEADSET} on her head with both hands`, 'confident ready-to-play smile', { round: 'r3' }],
      '/cs2': ['table', `She sits on the edge of ${S.table}, legs crossed at the knee, holding a small white board with five light blue horizontal bars of different lengths, the longest at the top (a simple bar chart, no letters, no numbers), and pointing at the top bar with one finger`, 'impressed smile', { round: 'r3' }],
      '/cs2/major': ['cushion', `She sits on ${S.cushion} with her legs folded together to one side, a small open plain black notebook on her lap, its white pages showing only thin grey lines (no words), tracing a line on the page with one fingertip while reading`, 'concentrated reading look', { round: 'r3' }],
      '/lol': ['wstool', `She sits on ${S.wstool}, legs crossed at the knee, ${HEADSET} around her neck, holding a fan of small blank pastel cards (pink, lilac and light blue, no pictures, no text) in one hand and pulling one card out with the other; both of her arms are fully inside the sleeves of the denim jacket, which sits on both shoulders`, 'playful choosing look', { round: 'r3' }],
      '/esports': ['chair', `She sits on ${S.chair}, knees together, leaning forward, ${HEADSET} around her neck, clapping her hands enthusiastically as if watching a great match; both of her arms are fully inside the sleeves of the denim jacket, which sits on both shoulders`, 'thrilled cheering smile, mouth open', { round: 'r3' }],
      '/esports/series': ['chair', `She sits on ${S.chair}, legs crossed at the knee, ${NOTEPAD} resting on her knee, holding up three fingers of one hand toward the viewer as if saying best of three, ${PENCIL} in the other hand`, 'explaining friendly smile', { round: 'r3' }],
      '/fortnite/nube': ['walk', `She walks mid-step, looking up and pointing excitedly up at the sky with one hand, ${PHONE} in the other hand`, 'excited delighted smile'],
    },
  },
};

export const ALT = {
  jugadadeldia: {
    '/': 'Chica de vestido rojo sentada en un banquito blanco, mezclando un mazo de cartas españolas',
    '/quiniela/cuanto-paga/': 'Chica sentada en el borde de una mesa blanca, anotando en una boleta con un lápiz',
    '/quiniela/redoblona/': 'Chica sentada en un banquito de madera, mostrando dos bolillas blancas juntas',
    '/quini-6/': 'Chica sentada en un almohadón con un bol de seis bolillas, sacando una',
    '/loto-plus/': 'Chica tirando una pelotita naranja de una mano a la otra',
    '/brinco/': 'Chica dando un saltito con una boleta en la mano',
    '/telekino/': 'Chica caminando con un cartón de bingo en blanco en las manos',
    '/poceada/': 'Chica de rodillas tirando una bolilla en un frasco de vidrio con más bolillas',
    '/quiniela-plus/': 'Chica sentada con una boleta en la rodilla, levantando un dedo como diciendo «una más»',
    '/truco/': 'Chica sentada en un almohadón repartiendo cartas españolas boca abajo',
    '/truco/jugar/': 'Chica sentada en el borde de una mesa tirando una carta como quien canta truco',
    '/truco/anotador/': 'Chica sentada en una mesa anotando palitos en una libretita',
    '/truco/valores-de-las-cartas/': 'Chica caminando con una carta española en la mano, contando con los dedos',
    '/truco/senas/': 'Chica sentada con tres cartas contra el pecho, guiñando un ojo',
    '/truco/envido/': 'Chica sentada en un banquito con dos cartas, contando los tantos con los dedos',
    '/juegos-de-cartas/': 'Chica sentada en una silla con un abanico de cartas españolas y un cubilete',
    '/generala/': 'Chica sacudiendo un cubilete de cuero',
    '/generala/jugar/': 'Chica sentada en un almohadón volcando cinco dados de un cubilete',
    '/generala/probabilidades/': 'Chica sentada en una mesa mirando de cerca un dado, con una libretita en la rodilla',
    '/chinchon/jugar/': 'Chica acomodando las siete cartas de su mano de chinchón',
    '/escoba-de-15/jugar/': 'Chica de rodillas juntando cuatro cartas del piso con la mano',
    '/dados/': 'Chica de rodillas que acaba de tirar dos dados',
  },
  pingalto: {
    '/': 'Alt, la guía de pingalto, sentada en un banquito jugando con un joystick',
    '/kit/ping': 'Alt caminando con un router de wifi en la mano, mirándolo con desconfianza',
    '/kit/sensibilidad': 'Alt sentada al lado de una mesita, moviendo el mouse sobre un pad negro',
    '/kit/dpi': 'Alt sentada en una mesa alineando el mouse con una tarjeta de plástico',
    '/tier-list': 'Alt pegando un papelito en una tabla de tier list',
    '/ff': 'Alt corriendo con el celular en la mano',
    '/ff/sensibilidad': 'Alt sentada jugando con el celular en horizontal',
    '/ff/nombres': 'Alt de rodillas escribiendo en el celular',
    '/ff/espacio-invisible': 'Alt girándose y pellizcando el aire, como si agarrara un espacio invisible',
    '/ff/codigos': 'Alt sentada con el celular, haciendo un gesto de alto con la mano',
    '/valorant': 'Alt caminando mientras se pone los auriculares',
    '/valorant/rangos': 'Alt saltando y festejando con el puño en alto',
    '/valorant/agentes': 'Alt sentada con auriculares, hablando con su equipo',
    '/cs2': 'Alt sentada en una mesa señalando un gráfico de barras',
    '/cs2/major': 'Alt sentada en un almohadón leyendo un cuaderno',
    '/cs2/mira': 'Alt haciendo un círculo con los dedos frente a un ojo, como una mira',
    '/lol': 'Alt sentada eligiendo una carta de colores de un abanico',
    '/lol/rangos': 'Alt sentada con un teclado en las piernas',
    '/fortnite/nube': 'Alt caminando y señalando el cielo con el celular en la mano',
    '/esports': 'Alt sentada en un almohadón aplaudiendo como si mirara una partida',
    '/esports/series': 'Alt sentada mostrando tres dedos, con una libretita en la rodilla',
  },
};

export const slug = (url) => url === '/' ? 'home' : url.replace(/^\/|\/$/g, '').replace(/\//g, '-');
export const sceneOpts = (site, url) => SITES[site].scenes[url][3] || {};
export const roundOf = (site, url) => sceneOpts(site, url).round || ROUND;
export const jobId = (site, url) => `${SITES[site].prefix}-${slug(url)}-${roundOf(site, url)}`;
export const isSeated = (site, url) => SITES[site].scenes[url][0] in SEATS;

const ASPECT = { stand: '2:3', walk: '2:3', turn: '2:3', jump: '2:3', stool: '3:4', wstool: '3:4', chair: '3:4', table: '3:4', kneel: '3:4', cushion: '4:5' };

function prompt(s, pose, scene, expr, o) {
  const seat = SEATS[pose];
  const seated = pose in SEATS;
  const frame = seated
    ? `her whole ${pose === 'kneel' ? 'kneeling' : 'seated'} figure from the top of her hair down to the soles of her shoes${seat ? `, including the whole ${pose === 'cushion' ? 'cushion' : 'seat down to the bottom of its legs'}` : ''}, fits inside the frame with empty green margin on every side`
    : 'her entire body from the top of her hair down to the soles of her shoes fits inside the frame, with empty green margin above the head and below the feet';
  const modest = seated
    ? ` Modest pose: knees kept together or legs crossed, the ${s.garment} hem stays in place on her thighs, nothing visible under the hem; the camera is at her eye level, straight on, never from below.`
    : '';
  const props = o.keepAll
    ? 'Every prop is held by her, touches her body or lies right next to her as described.'
    : 'Every prop is held by her or touches her body; nothing floats separately.';
  const drinks = o.mate ? 'no alcohol, no other drinks besides the mate' : 'no drinks or alcohol';
  return `Edit of the reference image: the same woman in a new pose and action. Use the woman from the reference image as the character: exactly the same woman, same face, same facial features, same hair, same body proportions. ${s.who} Outfit, complete and worn correctly, exactly as in the reference: ${s.outfit}. Pose and action: ${scene}. Lively, natural, dynamic body language, a candid moment in the middle of the action, not a stiff catalogue pose. Her face is clearly visible: ${expr}.${modest} Wide full-length shot taken from the same camera distance as the reference image, so her head is the same size in the frame as in the reference: ${frame}; nothing cropped. ${props} Adult woman with natural adult proportions, tasteful, fully clothed, not revealing, not sexualized. Photorealistic photo, soft even studio lighting, sharp focus, natural skin texture, natural hands with five fingers. Background: flat solid pure bright chroma key green (#00FF00), evenly lit, no vignette, no gradient, no shadows on the background or floor, no floor line, no room. No green color anywhere on her clothes, hair, skin, makeup, shoes, seat or props. No logos, no brand marks, no flags, no numbers, no words or letters anywhere, no symbols on any prop. ${s.extra} No money, no banknotes, no coins, no gambling chips, ${drinks}, no cigarettes, no visible phone screens, no trophies, no prizes, no celebration of winning money. Final check: the whole figure including both legs and both shoes${seat ? ' and the whole seat' : ''} is visible inside the frame, and the outfit is complete and worn correctly.`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [site, s] of Object.entries(SITES)) {
    const all = Object.entries(s.scenes).map(([url, [pose, scene, expr, o = {}]]) => ({
      id: jobId(site, url), page: url, pose, aspectRatio: ASPECT[pose], resolution: '2K', refs: [s.ref],
      note: `page scene ${url}, round ${roundOf(site, url)}, pose ${pose}`, prompt: prompt(s, pose, scene, expr, o),
    }));
    for (const j of all) if (j.prompt.length > 4980) throw new Error(`${j.id}: prompt ${j.prompt.length}`);
    for (const r of [...new Set(Object.keys(s.scenes).map(u => roundOf(site, u)))]) {
      const jobs = all.filter(j => j.id.endsWith('-' + r));
      const seated = jobs.filter(j => j.pose !== 'stand').length;
      writeFileSync(join(HERE, site, `scene-${r}-jobs.json`), JSON.stringify(jobs, null, 1) + '\n');
      console.log(`${site} ${r}: ${jobs.length} jobs, seated or in motion ${seated}, longest prompt ${Math.max(...jobs.map(j => j.prompt.length))}`);
    }
  }
}
