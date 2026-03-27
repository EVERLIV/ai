import { Building2, Store, Warehouse, TreePine, type LucideIcon } from "lucide-react";

export interface Property {
  id: number;
  type: string;
  class: string;
  area: number;
  price: number;
  pricePerM2: number;
  address: string;
  district: string;
  metro: string;
  metroMinutes: number;
  icon: LucideIcon;
  floor: string;
  totalFloors: number;
  ceilingHeight: number;
  parking: string;
  condition: string;
  layout: string;
  dealType: string;
  deposit: string;
  contractTerm: string;
  description: string;
  features: string[];
  photos: number;
  publishedDate: string;
  views: number;
  agent: {
    name: string;
    company: string;
    phone: string;
  };
}

export const properties: Property[] = [
  {
    id: 1,
    type: "Офис",
    class: "A",
    area: 95,
    price: 65000,
    pricePerM2: 684,
    address: "Иркутск, ул. Ленина, 18",
    district: "Кировский",
    metro: "-",
    metroMinutes: 0,
    icon: Building2,
    floor: "4",
    totalFloors: 8,
    ceilingHeight: 3.0,
    parking: "Наземный, 3 м/м",
    condition: "Евроремонт",
    layout: "Open-space + 2 кабинета",
    dealType: "Аренда",
    deposit: "1 месяц",
    contractTerm: "от 1 года",
    description: "Современный офис в деловом центре на ул. Ленина в центре Иркутска. Панорамные окна, качественный ремонт, высокоскоростной интернет. Идеально для IT-компании или консалтинговой фирмы.",
    features: ["Кондиционирование", "Охрана", "Интернет", "Переговорная", "Кухня", "Ресепшн", "Парковка", "Видеонаблюдение"],
    photos: 6,
    publishedDate: "2 дня назад",
    views: 187,
    agent: { name: "Аренда Сити", company: "АрендаСити Иркутск", phone: "+7 (3952) 55-12-34" },
  },
  {
    id: 2,
    type: "Торговая",
    class: "B+",
    area: 120,
    price: 150000,
    pricePerM2: 1250,
    address: "Иркутск, ул. Карла Маркса, 30",
    district: "Кировский",
    metro: "-",
    metroMinutes: 0,
    icon: Store,
    floor: "1",
    totalFloors: 5,
    ceilingHeight: 4.2,
    parking: "Нет",
    condition: "Под чистовую отделку",
    layout: "Свободная планировка",
    dealType: "Аренда",
    deposit: "2 месяца",
    contractTerm: "от 2 лет",
    description: "Торговое помещение на первой линии ул. Карла Маркса — главной торговой улице Иркутска. Высокий пешеходный трафик, отдельный вход, большие витрины. Подходит для бутика, кафе или салона.",
    features: ["Первая линия", "Отдельный вход", "Витрины", "Высокий трафик", "Вытяжка", "Мокрая точка", "Электричество 40 кВт", "Вывеска"],
    photos: 5,
    publishedDate: "1 день назад",
    views: 312,
    agent: { name: "Аренда Сити", company: "АрендаСити Иркутск", phone: "+7 (3952) 55-12-34" },
  },
  {
    id: 3,
    type: "Склад",
    class: "B",
    area: 380,
    price: 76000,
    pricePerM2: 200,
    address: "Иркутск, ул. Трактовая, 18",
    district: "Свердловский",
    metro: "-",
    metroMinutes: 0,
    icon: Warehouse,
    floor: "1",
    totalFloors: 1,
    ceilingHeight: 7.5,
    parking: "Открытая, 8 м/м",
    condition: "Рабочее состояние",
    layout: "Единое пространство + офис 25 м²",
    dealType: "Аренда",
    deposit: "1 месяц",
    contractTerm: "от 6 мес",
    description: "Складское помещение на ул. Трактовой с удобным подъездом для грузового транспорта. Рядом объездная дорога. Ворота на уровне земли, бетонный пол, отопление. Офисный блок, охрана.",
    features: ["Рампа", "Ворота 4×4м", "Отопление", "Охрана территории", "Грузовой подъезд", "Офисный блок", "Электричество 80 кВт", "Пожарная сигнализация"],
    photos: 4,
    publishedDate: "3 дня назад",
    views: 98,
    agent: { name: "Аренда Сити", company: "АрендаСити Иркутск", phone: "+7 (3952) 55-12-34" },
  },
  {
    id: 4,
    type: "Офис",
    class: "B",
    area: 55,
    price: 35000,
    pricePerM2: 636,
    address: "Ангарск, 12-й мкр., 7а",
    district: "Ангарск",
    metro: "-",
    metroMinutes: 0,
    icon: Building2,
    floor: "2",
    totalFloors: 4,
    ceilingHeight: 2.8,
    parking: "Наземный, 2 м/м",
    condition: "Хороший ремонт",
    layout: "2 кабинета + приёмная",
    dealType: "Аренда",
    deposit: "1 месяц",
    contractTerm: "от 1 года",
    description: "Компактный офис в центре Ангарска. Подходит для небольшой компании или филиала. Рядом остановки общественного транспорта, банки, почта. Мебель включена в стоимость.",
    features: ["Мебель", "Интернет", "Кондиционер", "Охрана", "Парковка", "Санузел", "Кухня"],
    photos: 5,
    publishedDate: "5 дней назад",
    views: 134,
    agent: { name: "Аренда Сити", company: "АрендаСити Иркутск", phone: "+7 (3952) 55-12-34" },
  },
  {
    id: 5,
    type: "Земля",
    class: "-",
    area: 800,
    price: 40000,
    pricePerM2: 50,
    address: "Шелехов, ул. Привокзальная, уч. 15",
    district: "Шелехов",
    metro: "-",
    metroMinutes: 0,
    icon: TreePine,
    floor: "-",
    totalFloors: 0,
    ceilingHeight: 0,
    parking: "-",
    condition: "Без строений",
    layout: "Прямоугольный участок",
    dealType: "Аренда",
    deposit: "3 месяца",
    contractTerm: "от 3 лет",
    description: "Земельный участок в Шелехове рядом с ж/д станцией. Коммуникации по границе. Подходит для размещения автосервиса, шиномонтажа или торговой точки. 20 минут от Иркутска.",
    features: ["Электричество", "Водопровод", "Асфальтированный подъезд", "Ровный рельеф", "Коммерческое назначение", "Ограждение"],
    photos: 3,
    publishedDate: "неделю назад",
    views: 76,
    agent: { name: "Аренда Сити", company: "АрендаСити Иркутск", phone: "+7 (3952) 55-12-34" },
  },
  {
    id: 6,
    type: "Торговая",
    class: "A",
    area: 210,
    price: 189000,
    pricePerM2: 900,
    address: "Иркутск, ул. Байкальская, 202",
    district: "Октябрьский",
    metro: "-",
    metroMinutes: 0,
    icon: Store,
    floor: "1",
    totalFloors: 3,
    ceilingHeight: 4.0,
    parking: "Наземный, 10 м/м",
    condition: "Shell & Core",
    layout: "Единое пространство",
    dealType: "Аренда",
    deposit: "2 месяца",
    contractTerm: "от 3 лет",
    description: "Просторное торговое помещение на ул. Байкальской — одной из главных магистралей Иркутска. Высокий автомобильный и пешеходный трафик. Подойдёт для магазина, ресторана или фитнес-клуба.",
    features: ["Фасадное остекление", "Вентиляция", "Электричество 100 кВт", "Парковка", "Вывеска", "Мокрая точка", "Кондиционирование", "Погрузка"],
    photos: 7,
    publishedDate: "сегодня",
    views: 45,
    agent: { name: "Аренда Сити", company: "АрендаСити Иркутск", phone: "+7 (3952) 55-12-34" },
  },
];

export function getPropertyById(id: number): Property | undefined {
  return properties.find((p) => p.id === id);
}
