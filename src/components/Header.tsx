import {Button, Switch} from "antd";
import toast from "react-hot-toast";
import {PlusOutlined} from "@ant-design/icons";
import {poiTypeKey} from "../data/poiTypes.ts";
import Filter from "./Filter.tsx";

const Header = ({isClick, setIsClick, filterDealerType, setFilterDealerType, setShowTerritory }: {
    isClick: boolean,
    setIsClick: React.Dispatch<React.SetStateAction<boolean>>
    filterDealerType: poiTypeKey | 'all',
    setFilterDealerType: React.Dispatch<React.SetStateAction<poiTypeKey | 'all'>>
    setShowTerritory: React.Dispatch<React.SetStateAction<boolean>>
    showTerritory: boolean

}) => {


    return <header className="flex justify-between items-center p-5 gap-5 bg-[var(--bg-color)]">
        <div className="flex justify-between items-center gap-5 text-[var(--text-color)]">
            <img src="/ecrp-map-poi/images/gnd.png" alt="logo" className="w-[48px]"/>
            <h1 className="text-2xl">Points of interest</h1>
        </div>
        <div className="flex gap-5 items-center">
            <div className='flex items-center gap-2'>
                <label className="text-[18px]">Territories</label>
                <Switch defaultChecked onChange={setShowTerritory}/>

            </div>
            <Filter filterDealerType={filterDealerType} setFilterDealerType={setFilterDealerType}/>
            <Button type="primary" variant="solid" loading={isClick} icon={<PlusOutlined/>}
                    color={isClick ? "purple" : "primary"} onClick={() => {
                toast('Click on the map to add your POI',
                    {
                        icon: '❗',
                        style: {
                            borderRadius: '10px',
                        },
                    }
                );
                setIsClick(true)
            }}>{!isClick ? "Add new POI" : "Click on the map"}</Button>
        </div>
    </header>

}
export default Header;