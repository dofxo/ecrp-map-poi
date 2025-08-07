import {Select} from "antd";
import {dealerTypeKey, dealerTypes} from "../data/dealerTypes.ts";

const Filter = (({filterDealerType, setFilterDealerType}: {
    filterDealerType: dealerTypeKey | 'all',
    setFilterDealerType: React.Dispatch<React.SetStateAction<dealerTypeKey | 'all'>>
}) => {

    return <div>
        <Select
            value={filterDealerType}
            onChange={(value: dealerTypeKey | 'all') => setFilterDealerType(value)}
            style={{width: 200}}
        >
            <Select.Option value="all">All Types</Select.Option>
            {(Object.keys(dealerTypes) as dealerTypeKey[]).map((key) => (
                <Select.Option key={key} value={key}>
                    {dealerTypes[key].icon} {dealerTypes[key].name}
                </Select.Option>
            ))}
        </Select>
    </div>

})

export default Filter