import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {poiTypeKey} from "./data/poiTypes";

export interface Poi {
    poiName: string;
    adderName: string;
    latLng: number[];
    poiType: poiTypeKey;
    todayDate: string;
    poiGang: string;
    id?: string;
}

export interface Track {
    id: string;
    name: string;
    boxes: [number, number][];
    addedBy: string;
    color: string;
}

interface AppState {
    isClick: boolean;
    setIsClick: (val: boolean) => void;

    isAddingTrack: boolean;
    setIsAddingTrack: (val: boolean) => void;

    showTerritory: boolean;
    setShowTerritory: (val: boolean) => void;

    showDropPoints: boolean;
    setShowDropPoints: (val: boolean) => void;

    showRaceTracks: boolean;
    setShowRaceTracks: (val: boolean) => void;

    gangs: any[];
    setGangs: (val: any[] | ((prev: any[]) => any[])) => void;

    filteredGangs: string;
    setFilteredGangs: (val: string) => void;

    poiList: Poi[];
    setPoiList: (val: Poi[] | ((prev: Poi[]) => Poi[])) => void;

    tracks: Track[];
    setTracks: (val: Track[] | ((prev: Track[]) => Track[])) => void;

    isModalVisible: boolean;
    setIsModalVisible: (val: boolean) => void;

    enteredPassword: string;
    setEnteredPassword: (val: string) => void;

    allowed: boolean;
    setAllowed: (val: boolean) => void;

    loading: boolean;
    setLoading: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
    devtools(
        (set) => ({
            isClick: false,
            setIsClick: (val) => set({isClick: val}),

            isAddingTrack: false,
            setIsAddingTrack: (val) => set({isAddingTrack: val}),

            showTerritory: true,
            setShowTerritory: (val) => set({showTerritory: val}),

            showDropPoints: true,
            setShowDropPoints: (val) => set({showDropPoints: val}),

            showRaceTracks: true,
            setShowRaceTracks: (val) => set({showRaceTracks: val}),

            gangs: [],
            setGangs: (val) =>
                set((state) => ({
                    gangs: typeof val === "function" ? val(state.gangs) : val,
                })),

            filteredGangs: "all",
            setFilteredGangs: (val) => set({filteredGangs: val}),

            poiList: [],
            setPoiList: (val) =>
                set((state) => ({
                    poiList: typeof val === "function" ? val(state.poiList) : val,
                })),

            tracks: [],
            setTracks: (val) =>
                set((state) => ({
                    tracks: typeof val === "function" ? val(state.tracks) : val,
                })),

            isModalVisible: true,
            setIsModalVisible: (val) => set({isModalVisible: val}),

            enteredPassword: "",
            setEnteredPassword: (val) => set({enteredPassword: val}),

            allowed: false,
            setAllowed: (val) => set({allowed: val}),

            loading: false,
            setLoading: (val) => set({loading: val}),
        }),
        {name: "AppStore"}
    )
);
