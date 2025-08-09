import {Button, Switch} from "antd";
import toast from "react-hot-toast";
import {PlusOutlined} from "@ant-design/icons";
import Filter from "./Filter.tsx";

const Header = ({isClick, setIsClick, setShowTerritory, setShowDropPoints}: {
    isClick: boolean,
    setIsClick: React.Dispatch<React.SetStateAction<boolean>>
    setShowTerritory: React.Dispatch<React.SetStateAction<boolean>>
    showTerritory: boolean
    setShowDropPoints: React.Dispatch<React.SetStateAction<boolean>>

}) => {


    return <header className="flex justify-between items-center p-5 gap-5 bg-[var(--bg-color)]">
        <div className="flex justify-between items-center gap-5 text-[var(--text-color)]">
            <img src="/ecrp-map-poi/images/gnd.png" alt="logo" className="w-[48px]"/>
            <h1 className="text-2xl">Points of interest</h1>
        </div>
        <div className="flex gap-5 items-center">
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
            <Filter/>
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