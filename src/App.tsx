import Map from "./components/Map.tsx";
import Header from "./components/Header.tsx";
import {useState} from "react";
import {Toaster} from "react-hot-toast";
import {poiTypeKey} from "./data/poiTypes.ts";
import {dropPoints} from "./data/dropPoints.ts";


export interface Poi {
    poiName: string,
    adderName: string,
    latLng: number[],
    poiType: poiTypeKey,
    todayDate: string
}

const isDevMode = true;

const App = () => {

    const [isClick, setIsClick] = useState(false)
    //@ts-ignore
    const [poiList, setPoiList] = useState<Poi[]>([...dropPoints])
    const [filterDealerType, setFilterDealerType] = useState<poiTypeKey | 'all'>('all');
    const [showTerritory, setShowTerritory] = useState<boolean>(true);



    return (
        <main>
            <Header showTerritory={showTerritory}  setShowTerritory={setShowTerritory} filterDealerType={filterDealerType} setFilterDealerType={setFilterDealerType} setIsClick={setIsClick} isClick={isClick}/>
            <Map isDevMode={isDevMode} showTerritory={showTerritory} filterDealerType={filterDealerType} setFilterDealerType={setFilterDealerType} poiList={poiList} setPoiList={setPoiList} setIsClick={setIsClick} isClick={isClick}/>
            <Toaster
                position="top-center"
                reverseOrder={false}
            />
        </main>
    )
}

export default App
