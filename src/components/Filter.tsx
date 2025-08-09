import {Select} from "antd";

const Filter = () => {

    return (
        <div>
            <Select
                value="all"
                onChange={() => {
                }}
                style={{width: 200}}
            >
                <Select.Option value="all">All Gangs</Select.Option>
            </Select>
        </div>
    );
};

export default Filter;
