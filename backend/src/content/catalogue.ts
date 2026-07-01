/**
 * Read-only content catalogue (BACKEND_TODO #5).
 *
 * The trilingual services catalogue and the seeded testimonials list — copied
 * verbatim from the frontend i18n tables (content/i18n/{ru,ro,en}.ts). Served
 * per-locale by routes/content.ts. Kept self-contained (the backend has no path
 * alias to the frontend); the shapes mirror frontend/lib/types.ts.
 */
import type { Locale } from "../constants";

export interface ServiceGroup {
  title: string;
  items: string[];
}

export interface ServiceCategory {
  title: string;
  items: string[];
}

export interface ServicesData {
  wedding: {
    title: string;
    desc: string;
    note: string;
    groups: ServiceGroup[];
  };
  others: ServiceCategory[];
}

export interface Review {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
}

/** Services catalogue per locale (mirrors dictionary.services.{wedding,others}). */
export const SERVICES: Record<Locale, ServicesData> = {
  ru: {
    wedding: {
      title: "Свадьбы",
      desc: "Мы создаём не просто свадебный декор — мы помогаем воплотить в жизнь целое событие.",
      note: "Мы можем помочь организовать как отдельные элементы свадьбы, так и мероприятие под ключ.",
      groups: [
        {
          title: "Декор и оформление",
          items: [
            "Арки из шаров",
            "Цветочные композиции",
            "Оформление зала",
            "Фотозоны",
            "Welcome-зоны",
            "Украшение столов",
            "Свадебные инсталляции",
            "Декор церемонии",
          ],
        },
        {
          title: "Фото и видео",
          items: ["Фотографы", "Видеографы", "Аэросъёмка (дрон)"],
        },
        {
          title: "Развлекательная программа",
          items: ["Ведущий", "DJ", "Живая музыка", "Шоу-программы", "Аниматоры"],
        },
        {
          title: "Подготовка",
          items: ["Визажисты", "Стилисты", "Свадебные координаторы"],
        },
        {
          title: "Организация",
          items: [
            "Трансфер",
            "Аренда автомобилей",
            "Подбор площадки",
            "Координация мероприятия",
            "Составление тайминга",
          ],
        },
        {
          title: "Дополнительные услуги",
          items: [
            "Свадебный торт",
            "Кейтеринг",
            "Световое оформление",
            "Фейерверки",
            "Персонализированные элементы декора",
          ],
        },
      ],
    },
    others: [
      { title: "🎂 Дни рождения", items: ["Детские", "Взрослые", "Юбилеи"] },
      { title: "🎉 Частные мероприятия", items: ["Вечеринки"] },
      {
        title: "🏢 Корпоративные мероприятия",
        items: ["Открытия", "Презентации", "Бизнес-события"],
      },
    ],
  },
  ro: {
    wedding: {
      title: "Nunți",
      desc: "Nu creăm doar decor de nuntă — te ajutăm să dai viață întregului eveniment.",
      note: "Putem organiza atât elemente separate ale nunții, cât și evenimentul la cheie.",
      groups: [
        {
          title: "Decor și amenajare",
          items: [
            "Arcade din baloane",
            "Aranjamente florale",
            "Amenajarea sălii",
            "Foto-zone",
            "Zone de welcome",
            "Decorarea meselor",
            "Instalații de nuntă",
            "Decorul ceremoniei",
          ],
        },
        {
          title: "Foto și video",
          items: ["Fotografi", "Videografi", "Filmare aeriană (dronă)"],
        },
        {
          title: "Program de divertisment",
          items: [
            "Prezentator",
            "DJ",
            "Muzică live",
            "Programe de show",
            "Animatori",
          ],
        },
        {
          title: "Pregătire",
          items: ["Make-up artiști", "Styliști", "Coordonatori de nuntă"],
        },
        {
          title: "Organizare",
          items: [
            "Transfer",
            "Închiriere auto",
            "Alegerea locației",
            "Coordonarea evenimentului",
            "Întocmirea timingului",
          ],
        },
        {
          title: "Servicii suplimentare",
          items: [
            "Tort de nuntă",
            "Catering",
            "Iluminat decorativ",
            "Artificii",
            "Elemente de decor personalizate",
          ],
        },
      ],
    },
    others: [
      {
        title: "🎂 Zile de naștere",
        items: ["Pentru copii", "Pentru adulți", "Aniversări"],
      },
      { title: "🎉 Evenimente private", items: ["Petreceri"] },
      {
        title: "🏢 Evenimente corporate",
        items: ["Deschideri", "Prezentări", "Evenimente de business"],
      },
    ],
  },
  en: {
    wedding: {
      title: "Weddings",
      desc: "We create more than wedding décor — we help bring the whole event to life.",
      note: "We can arrange either individual wedding elements or the entire event turnkey.",
      groups: [
        {
          title: "Décor & styling",
          items: [
            "Balloon arches",
            "Floral arrangements",
            "Hall styling",
            "Photo zones",
            "Welcome zones",
            "Table decoration",
            "Wedding installations",
            "Ceremony décor",
          ],
        },
        {
          title: "Photo & video",
          items: ["Photographers", "Videographers", "Aerial filming (drone)"],
        },
        {
          title: "Entertainment",
          items: ["Host", "DJ", "Live music", "Show programs", "Animators"],
        },
        {
          title: "Preparation",
          items: ["Makeup artists", "Stylists", "Wedding coordinators"],
        },
        {
          title: "Organization",
          items: [
            "Transfer",
            "Car rental",
            "Venue selection",
            "Event coordination",
            "Timing planning",
          ],
        },
        {
          title: "Additional services",
          items: [
            "Wedding cake",
            "Catering",
            "Light design",
            "Fireworks",
            "Personalized décor elements",
          ],
        },
      ],
    },
    others: [
      { title: "🎂 Birthdays", items: ["Kids", "Adults", "Anniversaries"] },
      { title: "🎉 Private events", items: ["Parties"] },
      {
        title: "🏢 Corporate events",
        items: ["Openings", "Presentations", "Business events"],
      },
    ],
  },
};

/**
 * Seeded testimonials per locale, from dictionary.reviews.list, stamped with a
 * stable id by position (rev-1, rev-2, …) matching the frontend accessor. The
 * shipped tables carry no seeded testimonials (they're visitor-submitted via the
 * reviews store), so every locale is currently empty — kept for parity/fallback.
 */
const TESTIMONIAL_COPY: Record<Locale, Omit<Review, "id">[]> = {
  ru: [],
  ro: [],
  en: [],
};

export const TESTIMONIALS: Record<Locale, Review[]> = {
  ru: TESTIMONIAL_COPY.ru.map((r, i) => ({ id: `rev-${i + 1}`, ...r })),
  ro: TESTIMONIAL_COPY.ro.map((r, i) => ({ id: `rev-${i + 1}`, ...r })),
  en: TESTIMONIAL_COPY.en.map((r, i) => ({ id: `rev-${i + 1}`, ...r })),
};
