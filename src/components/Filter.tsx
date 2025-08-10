import {Select} from "antd";

const Filter = ({gangs,setFilteredGangs}: {
    gangs: any[],
    setFilteredGangs: React.Dispatch<React.SetStateAction<string>>
}) => {

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
                {gangs.map((gang) => (
                    <Select.Option value={gang.id} style={{color: gang.color}}>{gang.name}</Select.Option>
                ))}
            </Select>
        </div>
    );
};

export default Filter;
