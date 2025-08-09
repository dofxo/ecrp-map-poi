import Map from "./components/Map.tsx";
import Header from "./components/Header.tsx";
import {useEffect, useState} from "react";
import {Toaster} from "react-hot-toast";
import {poiTypeKey} from "./data/poiTypes.ts";
import {supabase} from "./config/supabase.ts";

export interface Poi {
    poiName: string,
    adderName: string,
    latLng: number[],
    poiType: poiTypeKey,
    todayDate: string
}

const isDevMode = import.meta.env.MODE === 'development';

const App = () => {


    const [isClick, setIsClick] = useState(false)
    //@ts-ignore
    const [poiList, setPoiList] = useState<Poi[]>([])
    const [showTerritory, setShowTerritory] = useState<boolean>(true);
    const [showDropPoints, setShowDropPoints] = useState(true);

    useEffect(() => {
        (async () => {
            const {data: pois} = await supabase
                .from('pois')
                .select('*')

            //@ts-ignore
            setPoiList(pois)
        })()
    }, [poiList])


    return (
        <main>
            <Header setShowDropPoints={setShowDropPoints} showTerritory={showTerritory}
                    setShowTerritory={setShowTerritory} setIsClick={setIsClick} isClick={isClick}/>
            <Map showDropPoints={showDropPoints} isDevMode={isDevMode} showTerritory={showTerritory} poiList={poiList}
                 setPoiList={setPoiList} setIsClick={setIsClick} isClick={isClick}/>
            <Toaster
                position="top-center"
                reverseOrder={false}
            />
        </main>
    )
}

export default App
