import {useRef, useState} from 'react';
import {ImageOverlay, MapContainer, Marker, Popup, useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from "react-hot-toast";
import {Button, Input, Modal, Select} from "antd";
import type {Poi} from "../App.tsx";
import {formatDateDDMMMYYYY} from "../helper/formatDate.ts";
import {poiTypeKey, poiTypes} from "../data/poiTypes.ts";
import Territories from "./Territory.tsx";

interface NewPOIState {
    poiName: string;
    poiType: poiTypeKey;
    adderName: string;
    latLng: [number, number];
}

const Map = ({isClick, setIsClick, poiList, setPoiList, filterDealerType }: {
    isClick: boolean,
    setIsClick: React.Dispatch<React.SetStateAction<boolean>>,
    poiList: Poi[],
    setPoiList: React.Dispatch<React.SetStateAction<Poi[]>>
    filterDealerType: poiTypeKey | 'all',
    setFilterDealerType: React.Dispatch<React.SetStateAction<poiTypeKey | 'all'>>
}) => {
    const mapRef = useRef(null);

    const [{poiName, poiType, adderName, latLng}, setNewPOI] = useState<NewPOIState>({
        adderName: "",
        poiType: "drug",
        poiName: "",
        latLng: [0, 0]
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [poiToDelete, setPoiToDelete] = useState<number | null>(null);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const showDeleteModal = (index: number) => {
        setPoiToDelete(index);
        setIsDeleteModalOpen(true);
    };

    const handleOk = () => {
        if (!poiName || !adderName) return toast.error("Please fill in all fields");

        const todayDate = formatDateDDMMMYYYY(new Date());
        const poiDetails: Poi = {
            poiType,
            poiName,
            adderName,
            latLng,
            todayDate,
        };
        setPoiList(prev => [...prev, poiDetails]);

        setIsModalOpen(false);
        setIsClick(false);

        toast.success("POI saved!");
    };

    const handleDelete = () => {
        if (poiToDelete !== null) {
            const filteredPoiList = poiList.filter((_, i) => i !== poiToDelete);
            setPoiList(filteredPoiList);
            toast.success("POI removed!");
        }
        setIsDeleteModalOpen(false);
        setPoiToDelete(null);
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setPoiToDelete(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | poiTypeKey) => {
        if (typeof e === 'string') {
            setNewPOI(prev => ({
                ...prev,
                poiType: e
            }));
        } else {
            const {name, value} = e.target;
            setNewPOI(prev => ({
                ...prev,
                [name]: value
            } as NewPOIState));
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setIsClick(false);
    };

    const imageUrl = '/images/map.png';
    const imageWidth = 5000;
    const imageHeight = 5000;
    const bounds = [
        [0, 0],
        [imageHeight, imageWidth]
    ];

    const MapClickHandler = () => {
        useMapEvents({
            click: (e) => {
                if (isClick) {
                    showModal();
                    setNewPOI(prev => ({
                        ...prev,
                        latLng: [e.latlng.lat, e.latlng.lng]
                    }));
                }
            }
        });
        return null;
    };

    const PoiMarkers = () => {
        return (
            <>
                {poiList.filter(poi => filterDealerType === 'all' || poi.poiType === filterDealerType).map((poi, index) => {
                    const dealerType = poi.poiType as poiTypeKey;
                    const emojiIcon = L.divIcon({
                        html: `<div style="font-size: 24px">${poiTypes[dealerType]?.icon}</div>`,
                        className: 'emoji-marker',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                        popupAnchor: [0, -12]
                    });

                    return (
                        <Marker
                            key={index}
                            position={[poi.latLng[0], poi.latLng[1]]}
                            icon={emojiIcon}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3><span className='font-bold'>POI name:</span> {poi.poiName}</h3>
                                    <p><span className='font-bold'>POI type: </span>
                                        {poiTypes[dealerType]?.icon} {poiTypes[dealerType]?.name}
                                    </p>
                                    <p><span className='font-bold'>Added by:</span> {poi.adderName}</p>
                                    <p><span className='font-bold'>Added on:</span> {poi.todayDate}</p>
                                    <Button
                                        className="text-sm w-full"
                                        type="primary"
                                        danger
                                        onClick={() => showDeleteModal(index)}
                                        icon={<span>🗑️</span>}
                                    >
                                        remove poi
                                    </Button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </>
        );
    };

    return (
        <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div style={{
                width: '100%',
                height: '90vh',
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
                    <MapClickHandler/>
                    <PoiMarkers/>
                    <Territories />
                </MapContainer>

                {/* Add POI Modal */}
                <Modal
                    title="Point of interest details"
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    closable
                >
                    <div className="flex flex-col gap-2">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label htmlFor="adder-name" className="text-sm font-medium text-gray-700">
                                    Added By
                                </label>
                                <Input
                                    name="adderName"
                                    onChange={handleInputChange}
                                    placeholder="e.g. Cole Lawless"
                                    className="w-full"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label htmlFor="dealer-name" className="text-sm font-medium text-gray-700">
                                    POI Name
                                </label>
                                <Input
                                    name="poiName"
                                    onChange={handleInputChange}
                                    placeholder="e.g. Matthews"
                                    className="w-full"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label htmlFor="icon-select" className="text-sm font-medium text-gray-700">
                                    POI Type
                                </label>
                                <Select
                                    id="icon-select"
                                    onChange={(value: poiTypeKey) => handleInputChange(value)}
                                    defaultValue="drug"
                                    options={(Object.keys(poiTypes) as poiTypeKey[]).map((key) => ({
                                        value: key,
                                        label: (
                                            <span>
                                                {poiTypes[key].icon} {poiTypes[key].name}
                                            </span>
                                        ),
                                    }))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    title="Confirm Delete"
                    open={isDeleteModalOpen}
                    onOk={handleDelete}
                    onCancel={handleCancelDelete}
                    okText="Delete"
                    okButtonProps={{danger: true}}
                    cancelText="Cancel"
                >
                    <p>Are you sure you want to delete this point of interest?</p>
                    {poiToDelete !== null && (
                        <div className="mt-4 p-2 bg-gray-100 rounded">
                            <p><strong>Dealer:</strong> {poiList[poiToDelete].poiName}</p>
                            <p>
                                <strong>Type:</strong> {poiTypes[poiList[poiToDelete].poiType as poiTypeKey]?.name}
                            </p>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default Map;
