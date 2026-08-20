export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export interface CuringGuideStep {
  stepNumber: number;
  title: string;
  desc: string;
}

export interface CuringGuideItem {
  id: 'calabaza' | 'madera' | 'acero';
  name: string;
  subtitle: string;
  description: string;
  requiresCuring: boolean;
  curingTime: string;
  shopLink: string;
  shopLinkText: string;
  steps: CuringGuideStep[];
  proTip: string;
  warning: string;
}

export interface RuleItem {
  id: number;
  ruleNumber: number;
  title: string;
  description: string;
}

export const materoFaqs: FAQItem[] = [
  {
    id: 1,
    category: 'Salud y Digestión',
    question: '¿Por qué el mate me da acidez o me cae pesado?',
    answer:
      'La principal culpable suele ser el polvillo fino de la yerba sumado al agua demasiado caliente. Al entrar en contacto directo con el estómago, estimula los jugos gástricos. Tip clave: usá un despolvillador o sacudí bien el mate boca abajo antes de cebar, y asegurate de que el agua nunca pase de los 80°C.',
  },
  {
    id: 2,
    category: 'Cuidado y Sanidad',
    question: '¿Qué hago si mi mate tiene manchas verdes o pelusa blanca? ¿Son hongos?',
    answer:
      'Si la mancha es verde oscura o negra uniforme, suele ser la tintura natural de la yerba penetrando la calabaza (¡es normal!). Si ves pelusa blanca en relieve, sí es hongo. Para solucionarlo: echale agua hirviendo unos minutos, raspá bien con una cucharita, limpialo con alcohol etílico y dejalo secar completamente al sol.',
  },
  {
    id: 3,
    category: 'Técnica de Cebado',
    question: '¿Por qué se me lava el mate tan rápido en 2 o 3 cebadas?',
    answer:
      'Pasa cuando mojás toda la yerba de golpe o cebás con agua hirviendo. El secreto está en armar una buena montañita seca al costado y cebar siempre en el hueco de la bombilla, dejando yerba virgen para ir alimentando la ronda.',
  },
  {
    id: 4,
    category: 'Higiene de Accesorios',
    question: '¿Cómo limpiar y desinfectar la bombilla para sacarle el sarro interno?',
    answer:
      'Herví las bombillas en una ollita con agua y dos cucharadas soperas de bicarbonato de sodio durante 10 a 15 minutos. Vas a ver cómo se desprenden todos los restos acumulados. Después, enjuagá con agua fría y pasale un cepillito limpiador.',
  },
  {
    id: 5,
    category: 'Temperatura del Agua',
    question: '¿Por qué nunca hay que usar agua hirviendo a 100°C?',
    answer:
      'El agua a 100°C quema las hojas de yerba al instante, arruina los antioxidantes y le saca un sabor amargo y áspero insoportable. Además, te quemás la boca y lavás el mate en dos cebadas. La temperatura ideal es de 75°C a 80°C.',
  },
  {
    id: 6,
    category: 'Mantenimiento del Mate',
    question: '¿Se puede endulzar un mate de calabaza o se arruina?',
    answer:
      'La calabaza es porosa y absorbe el azúcar en sus paredes para siempre. Si te gusta el mate dulce, lo ideal es tener un mate exclusivo para dulces (de madera o acero) y dejar tu calabaza solo para amargos.',
  },
  {
    id: 7,
    category: 'Propiedades y Consumo',
    question: '¿Tomar mate de noche quita el sueño?',
    answer:
      'La yerba contiene mateína (cafeína natural) que activa la mente. Si sos sensible a la cafeína y tomás después de las 20 hs, te puede costar dormir. Tip: a la noche agregale yuyitos relajantes como manzanilla, tilo o melisa.',
  },
  {
    id: 8,
    category: 'Guardado y Secado',
    question: '¿Cómo se guarda el mate después de usarlo?',
    answer:
      'Tirá la yerba usada apenas termines de tomar. Enjuagá el interior con agua tibia, secalo con una servilleta de papel y guardalo siempre boca arriba en un lugar aireado. Nunca lo dejes boca abajo ni húmedo en un mueble cerrado.',
  },
];

export const curingGuidesData: CuringGuideItem[] = [
  {
    id: 'calabaza',
    name: 'Mate de Calabaza',
    subtitle: 'Modelos Torpedo, Camionero, Imperial y Copita',
    description:
      'La calabaza es un fruto natural. El curado sella los poros, remueve los hollejos blandos y prepara las paredes para impregnarse con el sabor auténtico de la yerba.',
    requiresCuring: true,
    curingTime: '2 a 3 días (3 ciclos de 24 hs)',
    shopLink: '/shop?category=mate',
    shopLinkText: 'Ver Mates de Calabaza en la Tienda',
    steps: [
      {
        stepNumber: 1,
        title: 'Primer enjuague tibio',
        desc: 'Enjuagá el interior del mate solo con agua tibia de la canilla para sacar cualquier resto de polvillo suelto. Nada de detergente ni esponjas de alambre.',
      },
      {
        stepNumber: 2,
        title: 'Llenalo con yerba húmeda',
        desc: 'Llená todo el mate con yerba usada tibia de una cebada anterior (o yerba nueva humedecida) hasta llegar a la virola.',
      },
      {
        stepNumber: 3,
        title: 'Hidratá con agua caliente (75° a 80°C)',
        desc: 'Agregale chorritos de agua tibia o caliente (máximo 80°C) para que la yerba absorba bien. Dejalo reposar 24 horas en un lugar seco y ventilado.',
      },
      {
        stepNumber: 4,
        title: 'Raspá suave el hollejo',
        desc: 'Al día siguiente, vaciá la yerba y raspá suavemente las paredes internas con una cucharita de té para retirar los restos leñosos y hollejos blandos.',
      },
      {
        stepNumber: 5,
        title: 'Repetí y dejá secar',
        desc: 'Repetí este proceso 2 o 3 veces. Para terminar, secalo bien con una servilleta de papel y dejalo secar a la sombra o con un sol suave.',
      },
    ],
    proTip:
      'Para un mate exclusivo de amargos, curalo siempre con yerba tradicional. Secarlo bien con papel absorbente evita cualquier humedad residual.',
    warning:
      'Nunca dejes el mate con yerba húmeda durante varios días en lugares cerrados o sin ventilar para que no junte moho.',
  },
  {
    id: 'madera',
    name: 'Mate de Madera',
    subtitle: 'Algarrobo torneado, caldén y maderas nobles',
    description:
      'La madera es un material vivo que se dilata con el calor. El curado inicial con una capita grasa nutre la fibra, impermeabiliza la superficie y previene rajaduras.',
    requiresCuring: true,
    curingTime: '24 a 48 horas',
    shopLink: '/shop?category=mate',
    shopLinkText: 'Ver Mates de Algarrobo en la Tienda',
    steps: [
      {
        stepNumber: 1,
        title: 'Untalo con manteca o aceite neutro',
        desc: 'Pincelá todo el interior con una capa fina de manteca, aceite de girasol o aceite de coco neutro.',
      },
      {
        stepNumber: 2,
        title: 'Dejalo absorber 24 horas',
        desc: 'Dejalo reposar un día entero para que la madera absorba la materia grasa y selle cualquier microporo.',
      },
      {
        stepNumber: 3,
        title: 'Llenalo con yerba húmeda',
        desc: 'Cargalo con yerba usada tibia y un chorrito de agua a 75°C. Dejalo reposar otras 24 horas.',
      },
      {
        stepNumber: 4,
        title: 'Enjuagá y listo para estrenar',
        desc: 'Tirá la yerba, enjuagá con agua tibia y secalo bien con un repasador. ¡Ya podés cebar!',
      },
    ],
    proTip:
      'El algarrobo es súper noble y no transmite sabores raros. Es ideal para llevarlo al trabajo o de viaje.',
    warning:
      'Nunca dejes mates de madera sumergidos en agua ni los metas al lavavajillas porque el agua estancada debilita la madera.',
  },
  {
    id: 'acero',
    name: 'Mate de Acero Inoxidable y Vidrio',
    subtitle: 'Modelos térmicos doble capa y materiales no porosos',
    description:
      'Los recipientes de acero inoxidable y vidrio templado son higiénicos y no porosos: no absorben olores ni humedad. No requieren ningún tipo de curado.',
    requiresCuring: false,
    curingTime: 'Inmediato (Listo al instante)',
    shopLink: '/shop?category=mate',
    shopLinkText: 'Ver Mates de Acero en la Tienda',
    steps: [
      {
        stepNumber: 1,
        title: 'Lavado inicial simple',
        desc: 'Lavalo con agua tibia y una gota de detergente común usando una esponja suave.',
      },
      {
        stepNumber: 2,
        title: 'Enjuagá y secalo',
        desc: 'Enjuagalo con abundante agua y secalo bien con un paño limpio o servilleta.',
      },
      {
        stepNumber: 3,
        title: '¡Cebá desde el minuto cero!',
        desc: 'Cargá tu yerba preferida y disfrutá de un mate con sabor 100% puro desde el primer segundo.',
      },
    ],
    proTip:
      'Son la opción más práctica para la oficina, viajes largos o para armar tereré con jugos frutales en verano.',
    warning:
      'No uses esponjas de alambre ni limpiadores abrasivos en el exterior para cuidar la pintura y los grabados láser.',
  },
];

export const unwrittenRulesData: RuleItem[] = [
  {
    id: 1,
    ruleNumber: 1,
    title: 'La bombilla no se toca ni se mueve',
    description:
      'Jamás uses la bombilla como cuchara ni palanca de cambios: si la movés, desarmás la estructura de la yerba y se tapa al toque.',
  },
  {
    id: 2,
    ruleNumber: 2,
    title: 'El "Gracias" solo cuando no tomás más',
    description:
      'En la ronda, decir gracias al devolver el mate significa "no me sirvas más". Si querés seguir tomando, devolvelo en silencio o con una sonrisa.',
  },
  {
    id: 3,
    ruleNumber: 3,
    title: 'El primer mate es del cebador',
    description:
      'Es el más fuerte, amargo y desparejo. Quien ceba se lo toma a sí mismo por cortesía y para chequear que esté a punto.',
  },
  {
    id: 4,
    ruleNumber: 4,
    title: 'El orden de la ronda es sagrado',
    description:
      'El mate viaja en círculo, uno por uno. Saltear a alguien en la ronda es casi una declaración de guerra matera.',
  },
  {
    id: 5,
    ruleNumber: 5,
    title: 'El mate no es un micrófono',
    description:
      'No te quedes contando una anécdota de diez minutos con el mate en la mano mientras los demás esperan con sed. Tomá a ritmo fluido, devolvé y seguí la charla.',
  },
  {
    id: 6,
    ruleNumber: 6,
    title: 'La espuma es el alma del mate',
    description:
      'Una buena espuma demuestra que la yerba está viva y el agua a la temperatura justa. Si parece un charco plano, está lavado.',
  },
  {
    id: 7,
    ruleNumber: 7,
    title: 'Paciencia con el que ceba',
    description:
      'Cebar con cariño lleva unos segundos para no romper la montañita. El que apura al cebador, toma mate lavado.',
  },
  {
    id: 8,
    ruleNumber: 8,
    title: 'El mate siempre vuelve al cebador',
    description:
      'Nunca se lo pases al de al lado. El circuito siempre es: cebador ➔ tomador ➔ cebador.',
  },
  {
    id: 9,
    ruleNumber: 9,
    title: 'Prohibida el agua hervida',
    description:
      'A 100°C quemás la yerba, le sacás acidez y lavás el mate en dos cebadas. El agua siempre entre 75°C y 80°C.',
  },
  {
    id: 10,
    ruleNumber: 10,
    title: 'El mate une y comparte',
    description:
      'Más allá de cualquier técnica, el mate es la excusa perfecta para frenar el día, escucharse y compartir un buen momento.',
  },
];
