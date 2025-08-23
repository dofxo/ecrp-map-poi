export type poiTypeKey = 'drug' | 'smuggler' | 'launderer' | 'dropPoints' | 'gangHQ' | 'mechanic';

export interface DealerType {
    name: string;
    icon: string;
    value: poiTypeKey;
}

export const poiTypes: Record<poiTypeKey, DealerType> = {
    dropPoints: {
        icon: "/ecrp-map-poi/images/Drop_Point_Icon.svg",
        name: "Drop Points",
        value: "dropPoints"
    },
    gangHQ: {
        icon: "/ecrp-map-poi/images/HQ_Icon.svg",
        name: "Gang HQ",
        value: "gangHQ"
    },
    drug: {
        name: "Drug dealer",
        icon: "/ecrp-map-poi/images/Pharmacist_Icon.svg",
        value: "drug"
    },
    launderer: {
        name: "Launderer",
        icon: "/ecrp-map-poi/images/Launderer_Icon.svg",
        value: "launderer"
    },
    smuggler: {
        name: "Smuggler",
        icon: "/ecrp-map-poi/images/Smuggler_Icon.svg",
        value: "smuggler"
    },
    mechanic: {
        name: "Mechanic",
        icon: "/ecrp-map-poi/images/Mechanic_Icon.svg",
        value: "mechanic"
    }
};