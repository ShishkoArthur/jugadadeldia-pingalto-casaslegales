// Operator x province pages (/operador/<brand>/<jurisdiction>): only where the brand is in that province's verified list.
// Title, description and H1 follow data/plan/casaslegales.json; "host" is the address the copy relies on - the build stops when
// the registry says otherwise. Everything else on the page (other addresses, acts, help, dates) is read from the data.
export const OPPROV = [
  {
    brand: 'betsson', jur: 'buenos-aires', host: 'pba.betsson.bet.ar',
    title: 'Betsson en Provincia de Buenos Aires: licencia y dominio',
    description: 'Betsson en Provincia de Buenos Aires: la licencia del IPLyC, el dominio pba.betsson.bet.ar y en qué se diferencia de la versión de la Ciudad y de Córdoba.',
    h1: 'Betsson en PBA: la licencia del IPLyC y el dominio pba.betsson.bet.ar',
  },
  {
    brand: 'betsson', jur: 'caba', host: 'betsson.com.ar',
    title: 'Betsson en CABA: autorización de LOTBA y dominio',
    description: 'Betsson en la Ciudad de Buenos Aires: la autorización de LOTBA, por qué su dominio termina en .com.ar y qué cambia frente a la versión bonaerense.',
    h1: 'Betsson en la Ciudad: qué autorizó LOTBA',
  },
  {
    brand: 'betsson', jur: 'cordoba', host: 'cba.betsson.bet.ar',
    title: 'Betsson en Córdoba: licencia de la Lotería y dominio',
    description: 'Betsson en Córdoba: la licencia de la Lotería de Córdoba, el dominio cba.betsson.bet.ar y qué tiene distinto de las versiones de Buenos Aires y la Ciudad.',
    h1: 'Betsson en Córdoba: licencia y dominio cba.betsson.bet.ar',
  },
  {
    brand: 'betano', jur: 'buenos-aires', host: 'betano.bet.ar',
    title: 'Betano en Provincia de Buenos Aires: licencia y dominio',
    description: 'Betano en Provincia de Buenos Aires: qué licencia tiene del IPLyC, con qué dominio opera y en qué se diferencia de su versión en la Ciudad.',
    h1: 'Betano en PBA: qué licencia tiene',
  },
  {
    brand: 'bplay', jur: 'cordoba', host: 'cordoba.bplay.bet.ar',
    title: 'bplay en Córdoba: licencia y dominio',
    description: 'bplay en Córdoba: la licencia de la Lotería de Córdoba, el dominio cordobés de bplay y qué cambia frente a sus versiones en otras provincias argentinas.',
    h1: 'bplay en Córdoba: licencia de la Lotería de Córdoba',
  },
  {
    brand: 'bplay', jur: 'santa-fe', host: 'bplay.bet.ar',
    title: 'bplay en Santa Fe: licencia y dominio',
    description: 'bplay en Santa Fe: la dirección que publica la Lotería de Santa Fe, sin subdominio provincial, y en qué se diferencia de sus versiones en otras provincias.',
    h1: 'bplay en Santa Fe: la dirección que publica la Lotería',
  },
  {
    brand: 'betano', jur: 'mendoza', host: 'mza.betano.bet.ar',
    title: 'Betano en Mendoza: ¿tiene licencia del IPJyC?',
    description: 'Betano en Mendoza: qué dice la lista del IPJyC, el dominio mza.betano.bet.ar y en qué se diferencia de la dirección de Buenos Aires y la Ciudad.',
    h1: 'Betano en Mendoza: qué dice la lista del IPJyC',
  },
  {
    brand: 'betwarrior', jur: 'mendoza', host: 'mza.betwarrior.bet.ar',
    title: 'BetWarrior en Mendoza: licencia del IPJyC',
    description: 'BetWarrior en Mendoza: la dirección que figura en la lista del IPJyC, mza.betwarrior.bet.ar, y qué cambia frente a sus versiones en otras provincias.',
    h1: 'BetWarrior en Mendoza: la dirección que autoriza el IPJyC',
  },
  {
    brand: 'betano', jur: 'caba', host: 'betano.bet.ar',
    title: 'Betano en CABA: la resolución de LOTBA',
    description: 'Betano en la Ciudad de Buenos Aires: la resolución de LOTBA que lo autoriza, su dominio y qué cambia frente a la versión de Provincia de Buenos Aires.',
    h1: 'Betano en la Ciudad de Buenos Aires: autorización de LOTBA',
  },
  {
    brand: 'bplay', jur: 'buenos-aires', host: 'pba.bplay.bet.ar',
    title: 'bplay en Provincia de Buenos Aires: licencia y dominio',
    description: 'bplay en Provincia de Buenos Aires: la licencia del IPLyC, el dominio bonaerense y en qué se diferencia de la versión de bplay en la Ciudad o en Córdoba.',
    h1: 'bplay en PBA: licencia del IPLyC',
  },
  {
    brand: 'bplay', jur: 'caba', host: 'caba.bplay.bet.ar',
    title: 'bplay en CABA: disposición de LOTBA y dominio',
    description: 'bplay en la Ciudad de Buenos Aires: la disposición de LOTBA que figura en su lista, el dominio caba.bplay.bet.ar y qué cambia frente a otras provincias.',
    h1: 'bplay en la Ciudad: la disposición de LOTBA y caba.bplay.bet.ar',
  },
  {
    brand: 'betwarrior', jur: 'buenos-aires', host: 'betwarrior.bet.ar',
    title: 'BetWarrior en Provincia de Buenos Aires: licencia y dominio',
    description: 'BetWarrior en Provincia de Buenos Aires: la licencia del IPLyC, la dirección betwarrior.bet.ar y por qué en la Ciudad y en Mendoza figura con otra.',
    h1: 'BetWarrior en PBA: la licencia del IPLyC y su dirección',
  },
  {
    brand: 'jugadon', jur: 'caba', host: 'caba.jugadon.bet.ar',
    title: 'Jugadón en CABA: autorización de LOTBA',
    description: 'Jugadón en la Ciudad de Buenos Aires: la disposición de LOTBA que lo habilita, su dominio caba.jugadon.bet.ar y en qué se diferencia de otras provincias.',
    h1: 'Jugadón en la Ciudad: la disposición de LOTBA',
  },
  {
    brand: 'jugadon', jur: 'cordoba', host: 'cordoba.jugadon.bet.ar',
    title: 'Jugadón en Córdoba: licencia de la Lotería y dominio',
    description: 'Jugadón en Córdoba: la resolución de la Lotería de Córdoba, el dominio cordoba.jugadon.bet.ar y qué cambia frente a la Ciudad, La Rioja y Santa Fe.',
    h1: 'Jugadón en Córdoba: licencia y dominio cordoba.jugadon.bet.ar',
  },
  {
    brand: 'jugadon', jur: 'la-rioja', host: 'jugadon.bet.ar',
    title: 'Jugadón en La Rioja: ¿quién lo autoriza?',
    description: 'Jugadón en La Rioja: quién lo autoriza, qué dice el regulador riojano AJALAR, con qué dominio opera y cómo verificarlo si estás en la provincia.',
    h1: 'Jugadón en La Rioja: qué dice el regulador',
  },
  {
    brand: 'super7', jur: 'mendoza', host: 'mdz.super7.bet.ar',
    title: 'Super7 en Mendoza: licencia del IPJyC y dominio',
    description: 'Super7 en Mendoza: la dirección mdz.super7.bet.ar que publica el IPJyC y por qué en la Ciudad de Buenos Aires figura con un dominio .com.ar.',
    h1: 'Super7 en Mendoza: la dirección que publica el IPJyC',
  },
];
