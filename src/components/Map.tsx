import {useRef, useState} from 'react';
import {ImageOverlay, MapContainer, useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from "react-hot-toast";
import {Input, Modal, Select} from "antd";
import {dealerTypes} from "../data/dealerTypes.ts";
import type {Poi} from "../App.tsx";


const Map = ({isClick, setIsClick, poiList, setPoiList}: {
    isClick: boolean,
    setIsClick: React.Dispatch<React.SetStateAction<boolean>>
    poiList: Poi[],
    setPoiList: React.Dispatch<React.SetStateAction<Poi[]>>
}) => {
    const mapRef = useRef(null);

    const [{dealerName, dealerType, adderName, latLng}, setNewPOI] = useState({
        dealerName: "",
        dealerType: "drug_dealer",
        adderName: "",
        latLng: []
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {

        if (!dealerName || !dealerType || !adderName) return toast.error("Please fill in all fields")

        const poiDetails = {dealerType, dealerName, adderName, latLng}
        setPoiList(prev => [...prev, poiDetails])

        setIsModalOpen(false);
        setIsClick(false);

        toast.success("POI saved!")
        //TODO: add promise
        // toast.promise(
        //     // add promise,
        //     {
        //         loading: 'Adding POI...',
        //         success: <b>POI saved!</b>,
        //         error: <b>Could not save.</b>,
        //     }
        // );

    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
        if (typeof e === 'string') {
            // Handle Select component case
            setNewPOI(prev => ({
                ...prev,
                dealerType: e
            }));
        } else {
            // Handle Input component case
            const {name, value} = e.target;
            setNewPOI(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };


    const handleCancel = () => {
        setIsModalOpen(false);
        setIsClick(false);
    };

    const imageUrl = '/images/map.png';

    // Image dimensions
    const imageWidth = 5000;
    const imageHeight = 5000;

    const bounds = [
        [0, 0],
        [imageHeight, imageWidth]
    ];

    const MapClickHandler = ({setIsClick}: {
        setIsClick: React.Dispatch<React.SetStateAction<boolean>>
    }) => {
        if (!isClick) return
        useMapEvents({
            click: (e) => {
                showModal()
                setNewPOI(prev => ({
                    ...prev,
                    latLng: [e.latlng.lat, e.latlng.lng]
                }))
            }
        });
        return null;
    }


    return (
        <div style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div style={{
                width: '100%',
                height: '100vh',
            }}>
                <MapContainer
                    ref={mapRef}
                    center={[imageHeight / 2, imageWidth / 2]}
                    zoom={0}
                    minZoom={-2}
                    maxZoom={2}
                    crs={L.CRS.Simple}
                    style={{height: '100%', width: '100%'}}
                    maxBounds={bounds}
                    maxBoundsViscosity={1.0}
                    whenCreated={(mapInstance) => {
                        mapInstance.fitBounds(bounds, {padding: [0, 0]});
                    }}
                >
                    <ImageOverlay
                        url={imageUrl}
                        bounds={bounds}
                    />
                    <MapClickHandler setIsClick={setIsClick}/>
                </MapContainer>

                <Modal
                    title="Point of interest details"
                    closable={{'aria-label': 'Custom Close Button'}}
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={handleCancel}
                >
                    <div className="flex flex-col gap-2"
                    >
                        <div className="space-y-4">
                            {/* Adder Name Input */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="adder-name" className="text-sm font-medium text-gray-700">
                                    Added By
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        name="adderName"
                                        onChange={handleInputChange}
                                        placeholder="e.g. Cole Lawless"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Dealer Name Input */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="dealer-name" className="text-sm font-medium text-gray-700">
                                    Dealer Name
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        name="dealerName"
                                        onChange={handleInputChange}
                                        placeholder="e.g. Matthews"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Icon Selection */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="icon-select" className="text-sm font-medium text-gray-700">
                                    Dealer Type
                                </label>
                                <div className="flex items-center gap-2">
                                    <Select
                                        id="icon-select"
                                        onChange={handleInputChange}
                                        defaultValue="drug_dealer"
                                        options={dealerTypes.map((item) => ({
                                            value: item.value,
                                            label: (
                                                <span>
                                                {item.icon} {item.name}
                                                </span>
                                            ),
                                        }))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Map;
