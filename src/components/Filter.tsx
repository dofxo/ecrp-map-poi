import {Select} from "antd";
import {useAppStore} from "../store.ts";

const Filter = () => {
    const {
        gangs,
        setFilteredGangs,
    } = useAppStore();

    return (
        <div>
            <Select
                placeholder="Select a gang"
                defaultValue="all"
                onChange={(e) => {
                    setFilteredGangs(e);
                }}
                style={{width: 200}}
            >
                <Select.Option value="all">All Gangs</Select.Option>
                <Select.Option value="">None</Select.Option>
                {gangs.map((gang) => (
                    <Select.Option value={gang.id} className="[text-shadow:.5px_.5px_0_black,-.5px_-.5px_0_black,.5px_-.5px_0_black,-.5px_.5px_0_black]" style={{color: gang.color}}>{gang.name}</Select.Option>
                ))}
            </Select>
        </div>
    );
};

export default Filter;
