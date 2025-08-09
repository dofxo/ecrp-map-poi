export type poiTypeKey = 'drug' | 'businessman' | 'car' | 'restaurant' | 'police' | 'dropPoints';

export interface DealerType {
    name: string;
    icon: string;
    value: poiTypeKey;
}

export const poiTypes: Record<poiTypeKey, DealerType> = {
    dropPoints: {
        icon: "🟠",
        name: "Drop Points",
        value: "dropPoints"
    }
    ,
    drug: {
        name: "Drug dealer",
        icon: "💊",
        value: "drug"
    },
    businessman: {
        name: "Businessman",
        icon: "💼",
        value: "businessman"
    },
    car: {
        name: "Car",
        icon: "🚗",
        value: "car"
    },
    restaurant: {
        name: "Restaurant",
        icon: "🍔",
        value: "restaurant"
    },
    police: {
        name: "Police",
        icon: "🚓",
        value: "police"
    },
};
