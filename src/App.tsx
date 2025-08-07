import Map from "./components/Map.tsx";
import Header from "./components/Header.tsx";
import {useState} from "react";
import {Toaster} from "react-hot-toast";
import {dealerTypeKey} from "./data/dealerTypes.ts";


export interface Poi {
    dealerName: string,
    adderName: string,
    latLng: number[],
    dealerType: string
    todayDate: string
}

const App = () => {

    const [isClick, setIsClick] = useState(false)
    const [poiList, setPoiList] = useState<Poi[]>([])
    const [filterDealerType, setFilterDealerType] = useState<dealerTypeKey | 'all'>('all');



    return (
        <main>
            <Header filterDealerType={filterDealerType} setFilterDealerType={setFilterDealerType} setIsClick={setIsClick} isClick={isClick}/>
            <Map filterDealerType={filterDealerType} setFilterDealerType={setFilterDealerType} poiList={poiList} setPoiList={setPoiList} setIsClick={setIsClick} isClick={isClick}/>
            <Toaster
                position="top-center"
                reverseOrder={false}
            />
        </main>
    )
}

export default App
