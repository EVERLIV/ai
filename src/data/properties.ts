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
  photos: number; // placeholder count
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
    area: 120,
    price: 180000,
    pricePerM2: 1500,
    address: "Москва, Пресненская наб., 10",
    district: "Пресненский",
    metro: "Выставочная",
    metroMinutes: 5,
    icon: Building2,
    floor: "12",
    totalFloors: 27,
    ceilingHeight: 3.2,
    parking: "Подземный, 2 м/м",
    condition: "Дизайнерский ремонт",
    layout: "Open-space + 3 кабинета",
    dealType: "Аренда",
    deposit: "2 месяца",
    contractTerm: "от 1 года",
    description: "Современный офис класса А в башне «Федерация» Москва-Сити. Панорамные окна с видом на центр города, система «умный офис», скоростные лифты, круглосуточная охрана. Идеально для IT-компании или финансовой организации.",
    features: ["Панорамные окна", "Кондиционирование", "Охрана 24/7", "Скоростные лифты", "Переговорные", "Серверная", "Fiber-оптика", "Ресепшн"],
    photos: 8,
    publishedDate: "2 дня назад",
    views: 342,
    agent: { name: "Алексей Смирнов", company: "Knight Frank", phone: "+7 (495) 777-12-34" },
  },
  {
    id: 2,
    type: "Торговая",
    class: "B+",
    area: 85,
    price: 250000,
    pricePerM2: 2941,
    address: "Москва, ул. Тверская, 22",
    district: "Тверской",
    metro: "Тверская",
    metroMinutes: 2,
    icon: Store,
    floor: "1",
    totalFloors: 7,
    ceilingHeight: 4.5,
    parking: "Нет",
    condition: "Под чистовую отделку",
    layout: "Свободная планировка",
    dealType: "Аренда",
    deposit: "3 месяца",
    contractTerm: "от 3 лет",
    description: "Торговое помещение на первой линии Тверской улицы с высоким пешеходным трафиком. Отдельный вход, витринные окна. Подходит для бутика, шоурума, салона красоты или общепита.",
    features: ["Первая линия", "Отдельный вход", "Витринные окна", "Высокий трафик", "Вытяжка", "Мокрая точка", "Электричество 50 кВт", "Рекламная вывеска"],
    photos: 6,
    publishedDate: "5 дней назад",
    views: 567,
    agent: { name: "Мария Козлова", company: "CBRE", phone: "+7 (495) 555-67-89" },
  },
  {
    id: 3,
    type: "Склад",
    class: "B",
    area: 450,
    price: 135000,
    pricePerM2: 300,
    address: "Москва, Дмитровское ш., 163",
    district: "Бескудниковский",
    metro: "Селигерская",
    metroMinutes: 12,
    icon: Warehouse,
    floor: "1",
    totalFloors: 1,
    ceilingHeight: 8.0,
    parking: "Открытая, 10 м/м",
    condition: "Рабочее состояние",
    layout: "Единое пространство + офис 30 м²",
    dealType: "Аренда",
    deposit: "1 месяц",
    contractTerm: "от 6 мес",
    description: "Складское помещение с удобным подъездом для грузового транспорта. Рядом МКАД и Дмитровское шоссе. Ворота на уровне земли, пол — бетон с покрытием. Офисный блок, санузел, охрана территории.",
    features: ["Рампа", "Ворота 4×4м", "Отопление", "Охрана территории", "Грузовой подъезд", "Офисный блок", "Электричество 100 кВт", "Пожарная сигнализация"],
    photos: 5,
    publishedDate: "1 день назад",
    views: 198,
    agent: { name: "Дмитрий Волков", company: "JLL", phone: "+7 (495) 333-44-55" },
  },
  {
    id: 4,
    type: "Офис",
    class: "A",
    area: 200,
    price: 320000,
    pricePerM2: 1600,
    address: "Москва, Ленинский пр-т, 15",
    district: "Якиманка",
    metro: "Октябрьская",
    metroMinutes: 3,
    icon: Building2,
    floor: "5",
    totalFloors: 12,
    ceilingHeight: 3.5,
    parking: "Наземный, 4 м/м",
    condition: "Евроремонт",
    layout: "5 кабинетов + переговорная + ресепшн",
    dealType: "Аренда",
    deposit: "2 месяца",
    contractTerm: "от 1 года",
    description: "Представительский офис на Ленинском проспекте вблизи Парка Горького. Качественный ремонт, высокие потолки, охраняемая территория. Удобная транспортная доступность, 3 минуты пешком от метро.",
    features: ["Евроремонт", "Охрана", "Ресепшн", "Переговорная", "Кухня", "Серверная", "Wi-Fi", "Кондиционирование"],
    photos: 7,
    publishedDate: "3 дня назад",
    views: 423,
    agent: { name: "Елена Иванова", company: "Colliers", phone: "+7 (495) 222-33-44" },
  },
  {
    id: 5,
    type: "Земля",
    class: "-",
    area: 1200,
    price: 95000,
    pricePerM2: 79,
    address: "МО, Одинцовский р-н, д. Жуковка",
    district: "Одинцовский",
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
    deposit: "6 месяцев",
    contractTerm: "от 5 лет",
    description: "Земельный участок на Рублёво-Успенском шоссе в престижном месте. Все коммуникации по границе. Разрешённое использование — коммерческое строительство. Идеально для торгового объекта или автосервиса.",
    features: ["Электричество", "Газ", "Водопровод", "Канализация", "Асфальтированный подъезд", "Ровный рельеф", "ИЖС/Коммерция", "Охраняемый посёлок"],
    photos: 4,
    publishedDate: "неделю назад",
    views: 156,
    agent: { name: "Игорь Петров", company: "Penny Lane", phone: "+7 (495) 111-22-33" },
  },
  {
    id: 6,
    type: "Торговая",
    class: "A",
    area: 310,
    price: 480000,
    pricePerM2: 1548,
    address: "Москва, Кутузовский пр-т, 48",
    district: "Дорогомилово",
    metro: "Кутузовская",
    metroMinutes: 4,
    icon: Store,
    floor: "1–2",
    totalFloors: 5,
    ceilingHeight: 5.0,
    parking: "Подземный, 6 м/м",
    condition: "Shell & Core",
    layout: "2 этажа, свободная планировка",
    dealType: "Аренда",
    deposit: "3 месяца",
    contractTerm: "от 5 лет",
    description: "Двухуровневое торговое помещение на Кутузовском проспекте. Фасадное остекление, высокая проходимость. Подойдёт для ресторана, фитнес-клуба, крупного ритейлера. Мощности для любого бизнеса.",
    features: ["Два уровня", "Фасадное остекление", "Вентиляция", "Электричество 150 кВт", "Грузовой лифт", "Подземный паркинг", "Рекламная вывеска", "Мокрая точка"],
    photos: 9,
    publishedDate: "сегодня",
    views: 89,
    agent: { name: "Ольга Новикова", company: "Savills", phone: "+7 (495) 444-55-66" },
  },
];

export function getPropertyById(id: number): Property | undefined {
  return properties.find((p) => p.id === id);
}
