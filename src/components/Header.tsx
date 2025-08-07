import {Button} from "antd";
import toast from "react-hot-toast";
import {PlusOutlined} from "@ant-design/icons";

const Header = ({isClick, setIsClick}: {
    isClick: boolean,
    setIsClick: React.Dispatch<React.SetStateAction<boolean>>
}) => {

    return <header className="flex justify-between items-center p-5 gap-5 bg-[var(--bg-color)]">
        <div className="flex justify-between items-center gap-5 text-[var(--text-color)]">
            <img src="/images/gnd.png" alt="logo" className="w-[48px]"/>
            <h1 className="text-2xl">Points of interest</h1>
        </div>
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
    </header>

}
export default Header;