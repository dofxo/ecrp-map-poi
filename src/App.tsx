import Map from "./components/Map.tsx";
import Header from "./components/Header.tsx";
import {useState} from "react";
import {Toaster} from "react-hot-toast";


export interface Poi {
    dealerName: string,
    adderName: string,
    latLng: number[],
    dealerType: string
}

const App = () => {

    const [isClick, setIsClick] = useState(false)
    const [poiList, setPoiList] = useState<Poi[]>([])


    return (
        <main>
            <Header setIsClick={setIsClick} isClick={isClick}/>
            <Map poiList={poiList} setPoiList={setPoiList} setIsClick={setIsClick} isClick={isClick}/>
            <Toaster
                position="top-center"
                reverseOrder={false}
            />
        </main>
    )
}

export default App
