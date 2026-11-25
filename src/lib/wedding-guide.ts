export const guestGuidePages = {
  vestimenta: { label: "Dress inspo", title: "Inspiración de vestimenta", description: "Aquí compartiremos ideas para el look de cada celebración." },
  actividades: { label: "Things to do", title: "Qué hacer en Santa Cruz", description: "Pronto compartiremos nuestras recomendaciones para disfrutar la ciudad." },
  restaurantes: { label: "Restaurantes", title: "Dónde comer en Santa Cruz", description: "Una pequeña guía para descubrir los sabores de la ciudad entre celebraciones." },
  regalos: { label: "Registry", title: "Lista de regalos", description: "Aquí encontrarás nuestra lista de regalos cuando esté lista." },
  faq: { label: "FAQ", title: "Preguntas frecuentes", description: "" },
};

export type GuidePage = keyof typeof guestGuidePages;
export function isGuidePage(slug: string | undefined): slug is GuidePage {
  return Boolean(slug && Object.hasOwn(guestGuidePages, slug));
}

export type FaqEntry = { id: string; question: string; answer: string; published: boolean };

export const defaultWeddingFaq: FaqEntry[] = [
  { id: "confirmacion", question: "¿Cómo confirmo o cambio mi asistencia?", answer: "Completa la confirmación en tu invitación. Si tienes un enlace personal, vuelve a abrirlo y elige «Editar confirmación» para cambiar tus respuestas.", published: true },
  { id: "vestimenta", question: "¿Dónde veo el código de vestimenta?", answer: "Abre los detalles de cada evento en el itinerario de tu invitación.", published: true },
  { id: "transporte", question: "¿Cómo aviso si necesitamos transporte?", answer: "Indica en la confirmación si necesitan transporte para cada día que asistan. El enlace «Info» junto a la pregunta lleva a los detalles de ese día.", published: true },
  { id: "comida", question: "¿Cómo aviso si tenemos una restricción alimentaria?", answer: "Después de confirmar tu asistencia, abre la sección «Comida» y cuéntanos qué debemos tener en cuenta y para quién.", published: true },
  { id: "vuelos", question: "¿En qué horario debo indicar mis vuelos?", answer: "Usa la hora local de Santa Cruz, Bolivia. Después de confirmar tu asistencia, puedes registrar tu llegada y salida en «Vuelos».", published: true },
];
