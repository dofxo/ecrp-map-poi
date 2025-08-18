export type poiTypeKey = 'drug' | 'smuggler' | 'launderer' | 'dropPoints' | 'gangHQ' | 'mechanic';

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
    },
    gangHQ: {
        icon: "💀",
        name: "Gang HQ",
        value: "gangHQ"
    },
    drug: {
        name: "Drug dealer",
        icon: "💊",
        value: "drug"
    },
    launderer: {
        name: "Launderer",
        icon: "💰",
        value: "launderer"
    },
    smuggler: {
        name: "Smuggler",
        icon: "🕶",
        value: "smuggler"
    },
    mechanic: {
        name: "Mechanic",
        icon: "🔧",
        value: "mechanic"
    }
};