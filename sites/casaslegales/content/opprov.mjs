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
];
