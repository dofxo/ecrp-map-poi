export type dealerTypeKey = 'drug' | 'businessman' | 'car' | 'restaurant' | 'police';

export interface DealerType {
    name: string;
    icon: string;
    value: dealerTypeKey;
}

export const dealerTypes: Record<dealerTypeKey, DealerType> = {
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
    }
};
