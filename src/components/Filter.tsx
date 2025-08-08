import {Select} from "antd";
import {poiTypeKey, poiTypes} from "../data/poiTypes.ts";

const Filter = (({filterDealerType, setFilterDealerType}: {
    filterDealerType: poiTypeKey | 'all',
    setFilterDealerType: React.Dispatch<React.SetStateAction<poiTypeKey | 'all'>>
}) => {

    return <div>
        <Select
            value={filterDealerType}
            onChange={(value: poiTypeKey | 'all') => setFilterDealerType(value)}
            style={{width: 200}}
        >
            <Select.Option value="all">All Types</Select.Option>
            {(Object.keys(poiTypes) as poiTypeKey[]).map((key) => (
                <Select.Option key={key} value={key}>
                    {poiTypes[key].icon} {poiTypes[key].name}
                </Select.Option>
            ))}
        </Select>
    </div>

})

export default Filter