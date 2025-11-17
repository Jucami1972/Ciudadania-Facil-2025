// src/screens/VocabularioScreenModernoV2.tsx
// Rediseño moderno y atractivo de la pantalla de Vocabulario

import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  FlatList,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Speech from 'expo-speech';

import { NavigationProps } from '../types/navigation';
import WebLayout from '../components/layout/WebLayout';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface VocabularyWord {
  id: string;
  word: string;
  wordEs: string; // Palabra en español para búsqueda
  pronunciation: string;
  definition: string;
  example: string;
  category: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
}

const categories = [
  { id: 'government', name: 'Gobierno Americano', icon: 'bank', color: '#7C3AED' },
  { id: 'history', name: 'Historia Americana', icon: 'book-open-variant', color: '#9333EA' },
  { id: 'symbols_holidays', name: 'Educación Cívica', icon: 'school', color: '#8B5CF6' },
];

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const vocabularyWords: VocabularyWord[] = [
  // GOBIERNO AMERICANO - FÁCILES
  {
    id: '1',
    word: 'Constitution',
    wordEs: 'Constitución',
    pronunciation: 'con-sti-TU-shon',
    definition: 'El documento fundamental que establece el gobierno de los Estados Unidos.',
    example: 'La Constitución es la ley suprema del país.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '2',
    word: 'Congress',
    wordEs: 'Congreso',
    pronunciation: 'CON-gres',
    definition: 'El poder legislativo del gobierno federal, compuesto por el Senado y la Cámara de Representantes.',
    example: 'El Congreso escribe las leyes federales.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '3',
    word: 'President',
    wordEs: 'Presidente',
    pronunciation: 'PRE-si-dent',
    definition: 'El jefe del poder ejecutivo y líder de los Estados Unidos.',
    example: 'El Presidente firma los proyectos de ley para convertirlos en ley.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '4',
    word: 'Senate',
    wordEs: 'Senado',
    pronunciation: 'SE-net',
    definition: 'Una de las dos cámaras del Congreso, con dos senadores por estado.',
    example: 'El Senado tiene 100 senadores.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '5',
    word: 'House of Representatives',
    wordEs: 'Cámara de Representantes',
    pronunciation: 'jaus of re-pre-SEN-ta-tivs',
    definition: 'Una de las dos cámaras del Congreso, con representantes basados en la población.',
    example: 'La Cámara de Representantes tiene 435 miembros.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '6',
    word: 'Bill',
    wordEs: 'Proyecto de Ley',
    pronunciation: 'bil',
    definition: 'Una propuesta de ley presentada al Congreso.',
    example: 'El proyecto de ley fue aprobado por el Congreso.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '7',
    word: 'Vote',
    wordEs: 'Votar',
    pronunciation: 'vot',
    definition: 'Expresar una preferencia o elección en una elección.',
    example: 'Los ciudadanos votan para elegir a sus representantes.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '8',
    word: 'Citizen',
    wordEs: 'Ciudadano',
    pronunciation: 'SI-ti-zen',
    definition: 'Una persona que es miembro legal de un país.',
    example: 'Los ciudadanos tienen derechos y responsabilidades.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '9',
    word: 'Rights',
    wordEs: 'Derechos',
    pronunciation: 'raits',
    definition: 'Libertades y privilegios garantizados a los ciudadanos.',
    example: 'La Carta de Derechos protege los derechos básicos de los estadounidenses.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '10',
    word: 'Democracy',
    wordEs: 'Democracia',
    pronunciation: 'di-MO-cra-si',
    definition: 'Sistema de gobierno donde el poder reside en el pueblo.',
    example: 'Estados Unidos es una democracia representativa.',
    category: 'government',
    difficulty: 'medio',
  },
  // GOBIERNO AMERICANO - MEDIO/DIFÍCIL
  {
    id: '11',
    word: 'Amendment',
    wordEs: 'Enmienda',
    pronunciation: 'a-MEND-ment',
    definition: 'Una modificación o adición a la Constitución.',
    example: 'La Constitución tiene 27 enmiendas.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '12',
    word: 'Bill of Rights',
    wordEs: 'Carta de Derechos',
    pronunciation: 'bil of raits',
    definition: 'Las primeras diez enmiendas a la Constitución que protegen los derechos básicos.',
    example: 'La Carta de Derechos protege la libertad de expresión.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '13',
    word: 'Veto',
    wordEs: 'Veto',
    pronunciation: 'VI-to',
    definition: 'El poder del Presidente para rechazar un proyecto de ley.',
    example: 'El Presidente puede vetar proyectos de ley del Congreso.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '14',
    word: 'Cabinet',
    wordEs: 'Gabinete',
    pronunciation: 'CA-bi-net',
    definition: 'Un grupo de asesores del Presidente que encabezan los departamentos ejecutivos.',
    example: 'El Gabinete aconseja al Presidente.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '15',
    word: 'Supreme Court',
    wordEs: 'Corte Suprema',
    pronunciation: 'su-PRIM cort',
    definition: 'El tribunal más alto del sistema judicial federal.',
    example: 'La Corte Suprema tiene nueve jueces.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '16',
    word: 'Electoral College',
    wordEs: 'Colegio Electoral',
    pronunciation: 'i-LEK-to-ral CO-lich',
    definition: 'El sistema que elige al Presidente de los Estados Unidos.',
    example: 'El Colegio Electoral decide quién es elegido presidente.',
    category: 'government',
    difficulty: 'difícil',
  },
  {
    id: '17',
    word: 'Ratify',
    wordEs: 'Ratificar',
    pronunciation: 'RA-ti-fai',
    definition: 'Confirmar o aprobar formalmente, especialmente un tratado o enmienda.',
    example: 'Los estados ratificaron la Constitución en 1788.',
    category: 'government',
    difficulty: 'difícil',
  },
  {
    id: '18',
    word: 'Checks and Balances',
    wordEs: 'Controles y Equilibrios',
    pronunciation: 'cheks and BA-lan-ses',
    definition: 'Sistema que previene que una rama del gobierno se vuelva demasiado poderosa.',
    example: 'Los controles y equilibrios protegen contra el abuso de poder.',
    category: 'government',
    difficulty: 'difícil',
  },
  {
    id: '19',
    word: 'Separation of Powers',
    wordEs: 'Separación de Poderes',
    pronunciation: 'se-pa-REI-shon of PAU-ers',
    definition: 'La división del gobierno en tres ramas: legislativa, ejecutiva y judicial.',
    example: 'La separación de poderes es un principio fundamental del gobierno estadounidense.',
    category: 'government',
    difficulty: 'difícil',
  },
  {
    id: '20',
    word: 'Federal',
    wordEs: 'Federal',
    pronunciation: 'FE-de-ral',
    definition: 'Relacionado con el gobierno nacional de los Estados Unidos.',
    example: 'El gobierno federal tiene poderes específicos según la Constitución.',
    category: 'government',
    difficulty: 'medio',
  },
  // HISTORIA AMERICANA - FÁCILES
  {
    id: '21',
    word: 'Independence',
    wordEs: 'Independencia',
    pronunciation: 'in-di-PEN-dens',
    definition: 'La libertad de controlar el propio destino.',
    example: 'Estados Unidos declaró su independencia en 1776.',
    category: 'history',
    difficulty: 'fácil',
  },
  {
    id: '22',
    word: 'Declaration of Independence',
    wordEs: 'Declaración de Independencia',
    pronunciation: 'de-cla-REI-shon of in-di-PEN-dens',
    definition: 'El documento que declaró que las colonias americanas eran libres de Gran Bretaña.',
    example: 'La Declaración de Independencia fue firmada en 1776.',
    category: 'history',
    difficulty: 'fácil',
  },
  {
    id: '23',
    word: 'Colony',
    wordEs: 'Colonia',
    pronunciation: 'CO-lo-ni',
    definition: 'Un territorio controlado por otro país.',
    example: 'Las trece colonias originales estaban bajo control británico.',
    category: 'history',
    difficulty: 'fácil',
  },
  {
    id: '24',
    word: 'War',
    wordEs: 'Guerra',
    pronunciation: 'uor',
    definition: 'Un conflicto armado entre naciones o grupos.',
    example: 'La Guerra de Independencia duró de 1775 a 1783.',
    category: 'history',
    difficulty: 'fácil',
  },
  {
    id: '25',
    word: 'Revolution',
    wordEs: 'Revolución',
    pronunciation: 're-vo-LU-shon',
    definition: 'Un cambio fundamental en el poder político o la estructura organizativa.',
    example: 'La Revolución Americana estableció los Estados Unidos como nación independiente.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '26',
    word: 'Slavery',
    wordEs: 'Esclavitud',
    pronunciation: 'SLEI-vo-ri',
    definition: 'El sistema donde las personas son propiedad de otras.',
    example: 'La esclavitud fue abolida después de la Guerra Civil.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '27',
    word: 'Civil War',
    wordEs: 'Guerra Civil',
    pronunciation: 'SI-vol uor',
    definition: 'La guerra entre el Norte y el Sur de los Estados Unidos (1861-1865).',
    example: 'La Guerra Civil terminó la esclavitud en los Estados Unidos.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '28',
    word: 'Founding Fathers',
    wordEs: 'Padres Fundadores',
    pronunciation: 'FAUN-ding FA-thers',
    definition: 'Los líderes que establecieron los Estados Unidos y escribieron la Constitución.',
    example: 'Los Padres Fundadores incluyen a George Washington y Thomas Jefferson.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '29',
    word: 'Territory',
    wordEs: 'Territorio',
    pronunciation: 'TE-ri-to-ri',
    definition: 'Un área de tierra bajo la jurisdicción de un gobierno.',
    example: 'Estados Unidos adquirió nuevos territorios durante su expansión.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '30',
    word: 'Immigration',
    wordEs: 'Inmigración',
    pronunciation: 'i-mi-GREI-shon',
    definition: 'El acto de venir a vivir permanentemente en un país extranjero.',
    example: 'La inmigración ha sido importante en la historia de Estados Unidos.',
    category: 'history',
    difficulty: 'medio',
  },
  // HISTORIA AMERICANA - DIFÍCILES
  {
    id: '31',
    word: 'Abolition',
    wordEs: 'Abolición',
    pronunciation: 'a-bo-LI-shon',
    definition: 'El movimiento para poner fin a la esclavitud.',
    example: 'La abolición de la esclavitud fue un logro importante.',
    category: 'history',
    difficulty: 'difícil',
  },
  {
    id: '32',
    word: 'Emancipation',
    wordEs: 'Emancipación',
    pronunciation: 'i-man-si-PEI-shon',
    definition: 'El acto de liberar a alguien de la esclavitud.',
    example: 'La Proclamación de Emancipación liberó a los esclavos en los estados confederados.',
    category: 'history',
    difficulty: 'difícil',
  },
  {
    id: '33',
    word: 'Manifest Destiny',
    wordEs: 'Destino Manifiesto',
    pronunciation: 'MA-ni-fest DES-ti-ni',
    definition: 'La creencia de que Estados Unidos estaba destinado a expandirse hacia el oeste.',
    example: 'El Destino Manifiesto justificó la expansión territorial de Estados Unidos.',
    category: 'history',
    difficulty: 'difícil',
  },
  // EDUCACIÓN CÍVICA - FÁCILES
  {
    id: '34',
    word: 'Citizenship',
    wordEs: 'Ciudadanía',
    pronunciation: 'SI-ti-zen-ship',
    definition: 'El estado de ser ciudadano de un país con derechos y responsabilidades.',
    example: 'Obtuve la ciudadanía estadounidense el año pasado.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '35',
    word: 'Flag',
    wordEs: 'Bandera',
    pronunciation: 'flag',
    definition: 'Un símbolo nacional que representa un país.',
    example: 'La bandera estadounidense tiene 50 estrellas y 13 rayas.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '36',
    word: 'Holiday',
    wordEs: 'Día Festivo',
    pronunciation: 'JO-li-dei',
    definition: 'Un día especial de celebración o conmemoración.',
    example: 'El Día de la Independencia es un día festivo nacional.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '37',
    word: 'Pledge of Allegiance',
    wordEs: 'Juramento de Lealtad',
    pronunciation: 'plech of a-LI-chans',
    definition: 'Una promesa de lealtad a la bandera y a los Estados Unidos.',
    example: 'El Juramento de Lealtad es parte de la ceremonia de naturalización.',
    category: 'symbols_holidays',
    difficulty: 'medio',
  },
  {
    id: '38',
    word: 'Allegiance',
    wordEs: 'Lealtad',
    pronunciation: 'a-LI-chans',
    definition: 'Lealtad o devoción a una persona, país o causa.',
    example: 'Los ciudadanos juran lealtad a los Estados Unidos.',
    category: 'symbols_holidays',
    difficulty: 'difícil',
  },
  {
    id: '39',
    word: 'Naturalization',
    wordEs: 'Naturalización',
    pronunciation: 'na-chu-ra-li-ZEI-shon',
    definition: 'El proceso legal por el cual un extranjero se convierte en ciudadano.',
    example: 'La naturalización requiere pasar un examen de ciudadanía.',
    category: 'symbols_holidays',
    difficulty: 'medio',
  },
  {
    id: '40',
    word: 'Oath',
    wordEs: 'Juramento',
    pronunciation: 'oz',
    definition: 'Una promesa solemne, especialmente una promesa de lealtad.',
    example: 'Los nuevos ciudadanos hacen un juramento de lealtad.',
    category: 'symbols_holidays',
    difficulty: 'medio',
  },
  // MÁS PALABRAS - GOBIERNO
  {
    id: '41',
    word: 'Legislative',
    wordEs: 'Legislativo',
    pronunciation: 'LE-chis-lei-tiv',
    definition: 'La rama del gobierno que hace las leyes.',
    example: 'La rama legislativa incluye el Congreso.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '42',
    word: 'Executive',
    wordEs: 'Ejecutivo',
    pronunciation: 'ig-ZE-cu-tiv',
    definition: 'La rama del gobierno que aplica las leyes.',
    example: 'El Presidente encabeza la rama ejecutiva.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '43',
    word: 'Judicial',
    wordEs: 'Judicial',
    pronunciation: 'chu-DI-shal',
    definition: 'La rama del gobierno que interpreta las leyes.',
    example: 'La rama judicial incluye la Corte Suprema.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '44',
    word: 'Senator',
    wordEs: 'Senador',
    pronunciation: 'SE-na-ter',
    definition: 'Un miembro del Senado de los Estados Unidos.',
    example: 'Cada estado tiene dos senadores.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '45',
    word: 'Representative',
    wordEs: 'Representante',
    pronunciation: 're-pre-SEN-ta-tiv',
    definition: 'Un miembro de la Cámara de Representantes.',
    example: 'Los representantes son elegidos por distritos.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '46',
    word: 'Vice President',
    wordEs: 'Vicepresidente',
    pronunciation: 'vais PRE-si-dent',
    definition: 'El segundo cargo más alto en el poder ejecutivo.',
    example: 'El Vicepresidente asume si el Presidente no puede servir.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '47',
    word: 'Capital',
    wordEs: 'Capital',
    pronunciation: 'CA-pi-tal',
    definition: 'La ciudad donde se encuentra el gobierno de un estado o país.',
    example: 'Washington, D.C. es la capital de los Estados Unidos.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '48',
    word: 'Governor',
    wordEs: 'Gobernador',
    pronunciation: 'GO-ver-ner',
    definition: 'El jefe del poder ejecutivo de un estado.',
    example: 'El gobernador es elegido por los ciudadanos del estado.',
    category: 'government',
    difficulty: 'fácil',
  },
  {
    id: '49',
    word: 'Treaty',
    wordEs: 'Tratado',
    pronunciation: 'TRI-ti',
    definition: 'Un acuerdo formal entre países.',
    example: 'El Presidente puede hacer tratados con otros países.',
    category: 'government',
    difficulty: 'medio',
  },
  {
    id: '50',
    word: 'State',
    wordEs: 'Estado',
    pronunciation: 'steit',
    definition: 'Una de las 50 divisiones principales de los Estados Unidos.',
    example: 'Hay 50 estados en los Estados Unidos.',
    category: 'government',
    difficulty: 'fácil',
  },
  // MÁS PALABRAS - HISTORIA
  {
    id: '51',
    word: 'Revolutionary War',
    wordEs: 'Guerra Revolucionaria',
    pronunciation: 're-vo-LU-sho-ne-ri uor',
    definition: 'La guerra por la independencia de Estados Unidos (1775-1783).',
    example: 'La Guerra Revolucionaria estableció a Estados Unidos como nación independiente.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '52',
    word: 'Colonist',
    wordEs: 'Colono',
    pronunciation: 'CO-lo-nist',
    definition: 'Una persona que vive en una colonia.',
    example: 'Los colonos vinieron a América buscando libertad.',
    category: 'history',
    difficulty: 'fácil',
  },
  {
    id: '53',
    word: 'Freedom',
    wordEs: 'Libertad',
    pronunciation: 'FRI-dom',
    definition: 'El poder de actuar, hablar o pensar sin restricciones.',
    example: 'La libertad es un derecho fundamental en Estados Unidos.',
    category: 'history',
    difficulty: 'fácil',
  },
  {
    id: '54',
    word: 'Liberty',
    wordEs: 'Libertad',
    pronunciation: 'LI-ber-ti',
    definition: 'La libertad de restricciones o control.',
    example: 'La Estatua de la Libertad simboliza la libertad.',
    category: 'history',
    difficulty: 'fácil',
  },
  {
    id: '55',
    word: 'Equality',
    wordEs: 'Igualdad',
    pronunciation: 'i-CUA-lo-ti',
    definition: 'El estado de ser igual en derechos y oportunidades.',
    example: 'La igualdad es un principio fundamental de Estados Unidos.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '56',
    word: 'Abolish',
    wordEs: 'Abolir',
    pronunciation: 'a-BO-lish',
    definition: 'Poner fin formalmente a algo, especialmente una ley o sistema.',
    example: 'La 13.ª Enmienda abolió la esclavitud.',
    category: 'history',
    difficulty: 'difícil',
  },
  {
    id: '57',
    word: 'Suffrage',
    wordEs: 'Sufragio',
    pronunciation: 'SA-frich',
    definition: 'El derecho a votar en elecciones políticas.',
    example: 'El sufragio femenino fue otorgado en 1920.',
    category: 'history',
    difficulty: 'difícil',
  },
  {
    id: '58',
    word: 'Proclamation',
    wordEs: 'Proclamación',
    pronunciation: 'pro-cla-MEI-shon',
    definition: 'Un anuncio público oficial.',
    example: 'La Proclamación de Emancipación liberó a los esclavos.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '59',
    word: 'Union',
    wordEs: 'Unión',
    pronunciation: 'IUN-ion',
    definition: 'Los estados del Norte durante la Guerra Civil.',
    example: 'La Unión luchó contra la Confederación en la Guerra Civil.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '60',
    word: 'Confederacy',
    wordEs: 'Confederación',
    pronunciation: 'con-FE-de-ra-si',
    definition: 'Los estados del Sur que se separaron durante la Guerra Civil.',
    example: 'La Confederación se formó durante la Guerra Civil.',
    category: 'history',
    difficulty: 'difícil',
  },
  {
    id: '61',
    word: 'Great Depression',
    wordEs: 'Gran Depresión',
    pronunciation: 'greit di-PRE-shon',
    definition: 'El período de grave recesión económica en la década de 1930.',
    example: 'La Gran Depresión comenzó en 1929.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '62',
    word: 'World War',
    wordEs: 'Guerra Mundial',
    pronunciation: 'uorld uor',
    definition: 'Un conflicto global que involucra a muchas naciones.',
    example: 'Estados Unidos participó en la Primera y Segunda Guerra Mundial.',
    category: 'history',
    difficulty: 'fácil',
  },
  {
    id: '63',
    word: 'Cold War',
    wordEs: 'Guerra Fría',
    pronunciation: 'cold uor',
    definition: 'El período de tensión entre Estados Unidos y la Unión Soviética.',
    example: 'La Guerra Fría duró desde 1947 hasta 1991.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '64',
    word: 'Communism',
    wordEs: 'Comunismo',
    pronunciation: 'CO-mu-nis-m',
    definition: 'Un sistema político y económico donde el estado controla todo.',
    example: 'Estados Unidos luchó contra la propagación del comunismo.',
    category: 'history',
    difficulty: 'medio',
  },
  {
    id: '65',
    word: 'Civil Rights',
    wordEs: 'Derechos Civiles',
    pronunciation: 'SI-vol raits',
    definition: 'Los derechos de los ciudadanos a la igualdad política y social.',
    example: 'El movimiento por los derechos civiles luchó contra la discriminación.',
    category: 'history',
    difficulty: 'medio',
  },
  // MÁS PALABRAS - EDUCACIÓN CÍVICA
  {
    id: '66',
    word: 'Symbol',
    wordEs: 'Símbolo',
    pronunciation: 'SIM-bol',
    definition: 'Algo que representa o significa otra cosa.',
    example: 'La bandera es un símbolo de la nación.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '67',
    word: 'Statue of Liberty',
    wordEs: 'Estatua de la Libertad',
    pronunciation: 'STA-chu of LI-ber-ti',
    definition: 'Un símbolo importante de libertad y democracia en Nueva York.',
    example: 'La Estatua de la Libertad fue un regalo de Francia.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '68',
    word: 'Independence Day',
    wordEs: 'Día de la Independencia',
    pronunciation: 'in-di-PEN-dens dei',
    definition: 'El día festivo que celebra la independencia de Estados Unidos (4 de julio).',
    example: 'El Día de la Independencia se celebra el 4 de julio.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '69',
    word: 'Memorial Day',
    wordEs: 'Día de los Caídos',
    pronunciation: 'me-MO-ri-al dei',
    definition: 'Un día festivo para honrar a los soldados que murieron en servicio.',
    example: 'El Día de los Caídos se celebra en mayo.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '70',
    word: 'Veterans Day',
    wordEs: 'Día de los Veteranos',
    pronunciation: 'VE-te-rans dei',
    definition: 'Un día festivo para honrar a todos los veteranos militares.',
    example: 'El Día de los Veteranos se celebra el 11 de noviembre.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '71',
    word: 'Thanksgiving',
    wordEs: 'Día de Acción de Gracias',
    pronunciation: 'zanks-GI-ving',
    definition: 'Un día festivo para dar gracias, celebrado en noviembre.',
    example: 'El Día de Acción de Gracias es una tradición estadounidense.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '72',
    word: 'Tax',
    wordEs: 'Impuesto',
    pronunciation: 'taks',
    definition: 'Un pago requerido al gobierno.',
    example: 'Es importante pagar impuestos federales.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
  {
    id: '73',
    word: 'Jury',
    wordEs: 'Jurado',
    pronunciation: 'CHU-ri',
    definition: 'Un grupo de ciudadanos que decide casos en un tribunal.',
    example: 'Los ciudadanos pueden servir en un jurado.',
    category: 'symbols_holidays',
    difficulty: 'medio',
  },
  {
    id: '74',
    word: 'Responsibility',
    wordEs: 'Responsabilidad',
    pronunciation: 'ri-spon-si-BI-lo-ti',
    definition: 'Un deber o obligación.',
    example: 'Los ciudadanos tienen responsabilidades cívicas.',
    category: 'symbols_holidays',
    difficulty: 'medio',
  },
  {
    id: '75',
    word: 'Duty',
    wordEs: 'Deber',
    pronunciation: 'DU-ti',
    definition: 'Una obligación moral o legal.',
    example: 'Es el deber de los ciudadanos votar.',
    category: 'symbols_holidays',
    difficulty: 'fácil',
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'fácil':
      return '#10B981';
    case 'medio':
      return '#F59E0B';
    case 'difícil':
      return '#EF4444';
    default:
      return '#7C3AED';
  }
};

const VocabularioScreenModernoV2 = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const isWebDesktop = useIsWebDesktop();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('government'); // government, history, symbols_holidays
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const filteredWords = useMemo(() => {
    return vocabularyWords.filter((word) => {
      // Búsqueda en español (wordEs) pero mostramos en inglés (word)
      const matchesSearch =
        searchQuery === '' ||
        word.wordEs.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.word.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro por categoría (ya no hay "all")
      const matchesCategory = word.category === selectedCategory;
      
      // Filtro por letra inicial
      const matchesLetter = selectedLetter === null || word.word.toUpperCase().startsWith(selectedLetter);
      
      return matchesSearch && matchesCategory && matchesLetter;
    });
  }, [searchQuery, selectedCategory, selectedLetter]);

  const handleSpeakWord = async (word: string) => {
    setIsSpeaking(true);
    try {
      await Speech.speak(word, {
        language: 'en',
        rate: 0.9,
      });
    } catch (error) {
      console.error('Error al reproducir palabra:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const renderCategory = ({ item }: { item: (typeof categories)[number] }) => {
    const isActive = selectedCategory === item.id;
    // Dividir el nombre en palabras para mostrar en dos líneas
    const words = item.name.split(' ');
    const firstWord = words[0] || '';
    const secondWord = words.slice(1).join(' ') || '';
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          isActive && { backgroundColor: item.color },
          !isActive && { backgroundColor: '#f3f4f6' },
        ]}
        onPress={() => {
          setSelectedCategory(item.id);
          setSelectedLetter(null); // Limpiar filtro de letra al cambiar categoría
        }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={item.icon as any} 
          size={18} 
          color={isActive ? '#FFFFFF' : item.color} 
        />
        <View style={styles.categoryButtonTextContainer}>
          <Text
            style={[
              styles.categoryButtonText,
              isActive && { color: '#FFFFFF' },
              !isActive && { color: '#6b7280' },
            ]}
            numberOfLines={1}
          >
            {firstWord}
          </Text>
          {secondWord ? (
            <Text
              style={[
                styles.categoryButtonText,
                isActive && { color: '#FFFFFF' },
                !isActive && { color: '#6b7280' },
              ]}
              numberOfLines={1}
            >
              {secondWord}
            </Text>
          ) : null}
        </View>
        {isActive && (
          <View style={[styles.categoryButtonIndicator, { backgroundColor: item.color }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderWord = ({ item }: { item: VocabularyWord }) => (
    <TouchableOpacity
      style={styles.wordCard}
      onPress={() => {
        setSelectedWord(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wordCardGradient}
      >
        <View style={styles.wordHeader}>
          <View style={styles.wordTitleContainer}>
            <Text style={styles.word}>{item.word}</Text>
            <Text style={styles.pronunciation}>{item.pronunciation}</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        </View>
        <Text style={styles.definition}>{item.definition}</Text>
        <View style={styles.exampleContainer}>
          <MaterialCommunityIcons name="format-quote-open" size={16} color="#7C3AED" />
          <Text style={styles.example}>{item.example}</Text>
        </View>
        <TouchableOpacity
          style={styles.audioButtonCard}
          onPress={(e) => {
            e.stopPropagation();
            handleSpeakWord(item.word);
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="volume-high" size={18} color="#7C3AED" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  const content = (
    <>
      {!isWeb && (
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Vocabulario</Text>
            <Text style={styles.headerSubtitle}>Palabras clave del examen</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <BlurView intensity={10} tint="light" style={styles.searchBlur}>
            <MaterialCommunityIcons name="magnify" size={20} color="#7C3AED" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en español (ej: enmienda, ciudadanía)..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <View style={styles.categoriesContent}>
            {categories.map((category) => (
              <React.Fragment key={category.id}>
                {renderCategory({ item: category })}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Alphabet Filter */}
        <View style={styles.alphabetContainer}>
          <Text style={styles.alphabetTitle}>Buscar por letra</Text>
          <View style={styles.alphabetGrid}>
            {alphabet.map((letter) => {
              const isActive = selectedLetter === letter;
              const hasWords = vocabularyWords.some(
                (w) => w.category === selectedCategory && w.word.toUpperCase().startsWith(letter)
              );
              return (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.alphabetButton,
                    isActive && styles.alphabetButtonActive,
                    !hasWords && styles.alphabetButtonDisabled,
                  ]}
                  onPress={() => setSelectedLetter(isActive ? null : letter)}
                  disabled={!hasWords}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.alphabetText, isActive && styles.alphabetTextActive, !hasWords && styles.alphabetTextDisabled]}>
                    {letter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedLetter && (
            <TouchableOpacity
              style={styles.clearLetterButton}
              onPress={() => setSelectedLetter(null)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close-circle" size={16} color="#7C3AED" />
              <Text style={styles.clearLetterText}>Limpiar filtro</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultText}>
            {filteredWords.length} palabra{filteredWords.length === 1 ? '' : 's'} encontrada
            {filteredWords.length === 1 ? '' : 's'}
          </Text>
        </View>

        {/* Words List */}
        <FlatList
          data={filteredWords}
          renderItem={renderWord}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          numColumns={isWeb ? 2 : 1}
          columnWrapperStyle={isWeb ? styles.wordRow : undefined}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="text-search" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No se encontraron palabras</Text>
              <Text style={styles.emptySubtext}>Intenta con otra búsqueda</Text>
            </View>
          }
        />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.modalCloseButton}>
              <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Detalle de palabra</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedWord && (
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <LinearGradient
                colors={['#A277FF', '#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalWordCard}
              >
                <View style={styles.modalWordHeader}>
                  <View style={styles.modalWordTitleContainer}>
                    <Text style={styles.modalWord}>{selectedWord.word}</Text>
                    <Text style={styles.modalPronunciation}>{selectedWord.pronunciation}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalSpeakButton}
                    onPress={() => handleSpeakWord(selectedWord.word)}
                    disabled={isSpeaking}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="volume-high" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.modalDifficultyBadge, { backgroundColor: getDifficultyColor(selectedWord.difficulty) }]}>
                  <Text style={styles.modalDifficultyText}>Dificultad: {selectedWord.difficulty}</Text>
                </View>
              </LinearGradient>

              <View style={styles.infoCard}>
                <View style={styles.sectionHeaderCard}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#7C3AED" />
                  <Text style={styles.sectionTitle}>Definición</Text>
                </View>
                <Text style={styles.sectionText}>{selectedWord.definition}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.sectionHeaderCard}>
                  <MaterialCommunityIcons name="format-quote-open" size={20} color="#7C3AED" />
                  <Text style={styles.sectionTitle}>Ejemplo</Text>
                </View>
                <View style={styles.exampleDetail}>
                  <Text style={styles.sectionText}>{selectedWord.example}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.sectionHeaderCard}>
                  <MaterialCommunityIcons name="tag" size={20} color="#7C3AED" />
                  <Text style={styles.sectionTitle}>Categoría</Text>
                </View>
                <Text style={styles.sectionText}>
                  {categories.find((c) => c.id === selectedWord.category)?.name || selectedWord.category}
                </Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );

  // Web de escritorio: usar WebLayout con sidebar
  if (isWeb && isWebDesktop) {
    return (
      <WebLayout headerTitle="Vocabulario">
        {content}
      </WebLayout>
    );
  }

  // Web móvil o app móvil: usar SafeAreaView (diseño idéntico)
  return (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  categoriesContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    marginBottom: 16,
  },
  categoriesContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    justifyContent: 'space-evenly',
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    minHeight: 70,
    justifyContent: 'center',
    maxWidth: (width - 48) / 3,
  },
  categoryButtonTextContainer: {
    alignItems: 'center',
    gap: 2,
  },
  categoryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryButtonIndicator: {
    position: 'absolute',
    bottom: -9,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  resultsContainer: {
    marginBottom: 12,
  },
  resultText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  wordCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    ...Platform.select({
      web: {
        flex: 1,
        marginHorizontal: 8,
        width: '48%',
        marginBottom: 16,
      },
    }),
  },
  wordCardGradient: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  wordTitleContainer: {
    flex: 1,
  },
  word: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  pronunciation: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  definition: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  exampleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    marginBottom: 8,
  },
  example: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  audioButtonCard: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  modalWordCard: {
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalWordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalWordTitleContainer: {
    flex: 1,
  },
  modalWord: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalPronunciation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalSpeakButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  modalDifficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  modalDifficultyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    fontWeight: '500',
  },
  exampleDetail: {
    gap: 8,
  },
  alphabetContainer: {
    marginBottom: 16,
  },
  alphabetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  alphabetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alphabetButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alphabetButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  alphabetButtonDisabled: {
    opacity: 0.3,
  },
  alphabetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  alphabetTextActive: {
    color: '#FFFFFF',
  },
  alphabetTextDisabled: {
    color: '#D1D5DB',
  },
  clearLetterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    gap: 6,
  },
  clearLetterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  wordRow: {
    ...Platform.select({
      web: {
        justifyContent: 'space-between',
        gap: 16,
      },
    }),
  },
});

export default VocabularioScreenModernoV2;
