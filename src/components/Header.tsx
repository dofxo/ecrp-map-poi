import {Button, Switch} from "antd";
import toast from "react-hot-toast";
import {PlusOutlined} from "@ant-design/icons";
import Filter from "./Filter.tsx";
import {handleExportFullMap} from "../helper/handleExportFullMap.ts";

const Header = ({gangs, isClick, setIsClick,setShowTerritory, setShowDropPoints, setFilteredGangs}: {
    isClick: boolean,
    setIsClick: React.Dispatch<React.SetStateAction<boolean>>
    setShowTerritory: React.Dispatch<React.SetStateAction<boolean>>
    showTerritory: boolean
    setShowDropPoints: React.Dispatch<React.SetStateAction<boolean>>
    gangs: any[]
    setFilteredGangs: React.Dispatch<React.SetStateAction<string>>

}) => {


    return <header className="flex justify-between items-center p-5 gap-5 bg-[var(--bg-color)]">
        <div className="flex justify-between items-center gap-5 text-[var(--text-color)]">
            <img src="/ecrp-map-poi/images/gnd.png" alt="logo" className="w-[48px]"/>
            <h1 className="text-2xl">Points of interest</h1>
        </div>
        <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                    <div className='flex items-center gap-2'>
                        <Switch size='small' defaultChecked onChange={setShowTerritory}/>
                        <label className="text-[13px]">Territories</label>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Switch size="small" defaultChecked onChange={setShowDropPoints}/>
                        <label className="text-[13px]">Drop points</label>
                    </div>

                </div>

                <Filter gangs={gangs}  setFilteredGangs={setFilteredGangs}/>

            </div>
            <div className="flex flex-col gap-2 justify-between">
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

                <Button type="primary" onClick={handleExportFullMap}>
                    📸 Export Visible Map Area
                </Button>


            </div>
        </div>
    </header>

}
export default Header;