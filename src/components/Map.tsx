import {useRef, useState} from 'react';
import {ImageOverlay, MapContainer, Marker, Popup, useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from "react-hot-toast";
import {Button, Input, Modal, Select} from "antd";
import type {Poi} from "../App.tsx";
import {formatDateDDMMMYYYY} from "../helper/formatDate.ts";
import {poiTypeKey, poiTypes} from "../data/poiTypes.ts";
import Territories from "./Territory.tsx";
import {supabase} from "../config/supabase.ts";


interface NewPOIState {
    poiName: string;
    poiType: poiTypeKey;
    adderName: string;
    poiGang: string;
    latLng: [number, number];
}

const Map = ({
                 isClick,
                 setIsClick,
                 poiList,
                 setPoiList,
                 showTerritory,
                 isDevMode,
                 showDropPoints,
                 filteredGangs,
                 gangs,
             }: {
    isClick: boolean,
    setIsClick: React.Dispatch<React.SetStateAction<boolean>>,
    poiList: Poi[],
    setPoiList: React.Dispatch<React.SetStateAction<Poi[]>>
    showTerritory: boolean
    isDevMode: boolean
    showDropPoints: boolean
    filteredGangs: string
    gangs: any[]
}) => {
    const [deletePw, setDeletePw] = useState("");
    const mapRef = useRef<any>(null);

    const [{poiName, poiType, adderName, latLng, poiGang}, setNewPOI] = useState<NewPOIState>({
        adderName: "",
        poiType: "drug",
        poiName: "",
        poiGang: "",
        latLng: [0, 0],
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [poiToDelete, setPoiToDelete] = useState<number | null>(null);

    const [poiId, setPoiId] = useState<string | null>(null);

    const imageUrl = '/ecrp-map-poi/images/map.png';
    const imageWidth = 5000;
    const imageHeight = 5000;
    const bounds: [[number, number], [number, number]] = [
        [0, 0],
        [imageHeight, imageWidth]
    ];


    const showModal = () => setIsModalOpen(true);
    const handlePwDelete = (e: React.ChangeEvent<HTMLInputElement>) => setDeletePw(e.target.value);
    const showDeleteModal = (index: number) => {
        setPoiToDelete(index);
        setIsDeleteModalOpen(true);
    };

    const handleOk = async () => {
        if (!poiName || !adderName) return toast.error("Please fill in all fields");

        const todayDate = formatDateDDMMMYYYY(new Date());
        const poiDetails: Poi = {
            poiType,
            poiName,
            adderName,
            latLng,
            todayDate,
            poiGang: poiGang || "null",
        };

        try {
            await supabase
                .from('pois')
                .insert([
                    poiDetails,
                ])
                .select()

            setPoiList(prev => [...prev, poiDetails]);

            setIsModalOpen(false);
            setIsClick(false);
console.log(poiDetails);
            toast.success("POI saved!");

        } catch {
            toast.error("Error saving POI");
        }
    };

    const handleDelete = async () => {
        const {data: pw} = await supabase.from('pw').select('pw');

        //@ts-ignore
        if (pw[0].pw !== deletePw) {
            setDeletePw("");
            setIsDeleteModalOpen(false);
            return toast.error("Incorrect password");
        }

        await supabase
            .from('pois')
            .delete()
            .eq('id', poiId)

        if (poiToDelete !== null) {
            setPoiList(poiList.filter((_, i) => i !== poiToDelete));
            toast.success("POI removed!");
        }
        setIsDeleteModalOpen(false);
        setPoiToDelete(null);
        setPoiId(null);
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setPoiToDelete(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | poiTypeKey) => {
        if (typeof e === 'string') {
            setNewPOI(prev => ({...prev, poiType: e}));
        } else {
            const {name, value} = e.target;
            setNewPOI(prev => ({...prev, [name]: value} as NewPOIState));
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setIsClick(false);
    };

    const MapClickHandler = () => {
        useMapEvents({
            click: (e: any) => {
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
        const filteredPoiList = poiList.filter(poi =>
            poi.poiType === "dropPoints" ? showDropPoints : true
        );
        return (
            <>
                {filteredPoiList.map((poi, index) => {
                    const dealerType = poi.poiType as poiTypeKey;
                    // @ts-ignore
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
                            //@ts-ignore
                            icon={emojiIcon}
                        >
                            <Popup>
                                <div className="p-2 flex flex-col gap-2">
                                    <p className='!m-0'><span className='font-bold'>POI name:</span> {poi.poiName}</p>
                                    <p className='!m-0'><span className='font-bold'>POI type: </span>
                                        {poiTypes[dealerType]?.icon} {poiTypes[dealerType]?.name}
                                    </p>
                                    <p className='!m-0'><span className='font-bold'>Added by:</span> {poi.adderName}</p>
                                    <p className='!m-0'><span className='font-bold'>Added on:</span> {poi.todayDate}</p>
                                    {Boolean(poi.poiGang) && (
                                        <p className='!m-0'><span
                                            className='font-bold'>Gang:</span> {gangs.find(gangDetails => gangDetails.id === 1)?.name || ""}
                                        </p>
                                    )}
                                    {(poi.poiType !== "dropPoints" || isDevMode) && (<Button
                                            className="text-sm w-full"
                                            type="primary"
                                            danger
                                            onClick={() => {
                                                //@ts-ignore
                                                setPoiId(poi.id);
                                                showDeleteModal(index)
                                            }}
                                            icon={<span>🗑️</span>}
                                        >
                                            remove poi
                                        </Button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )

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
            <div style={{width: '100%', height: '85vh'}}>


                <MapContainer
                    ref={mapRef}
                    //@ts-ignore
                    center={[imageHeight / 2, imageWidth / 2]}
                    zoom={-2}
                    minZoom={-2}
                    maxZoom={2}
                    //@ts-ignore
                    crs={L.CRS.Simple}
                    style={{height: '100%', width: '100%'}}
                    maxBounds={bounds}
                    maxBoundsViscosity={1.0}
                    //@ts-ignore
                    whenCreated={(mapInstance) => {
                        mapInstance.fitBounds(bounds, {padding: [0, 0]});
                    }}
                    id='map'
                >
                    <ImageOverlay url={imageUrl} bounds={bounds}/>
                    <MapClickHandler/>
                    <PoiMarkers/>
                    {showTerritory && <Territories filteredGangs={filteredGangs} isDevMode={isDevMode}/>}
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
                                <label className="text-sm font-medium text-gray-700">Added By</label>
                                <Input name="adderName" onChange={handleInputChange} placeholder="e.g. Cole Lawless"/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">POI Name</label>
                                <Input name="poiName" onChange={handleInputChange} placeholder="e.g. Matthews"/>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">POI's Gang</label>
                                <Select
                                    placeholder="Select a gang"
                                    defaultValue="null"
                                    onChange={(value) => {
                                        setNewPOI(prev => ({...prev, "poiGang": value} as NewPOIState));
                                    }}
                                    style={{width: 200}}
                                >
                                    <Select.Option value="null">None</Select.Option>
                                    {gangs.map((gang) => (
                                        <Select.Option value={gang.id}
                                                       style={{color: gang.color}}>{gang.name}</Select.Option>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">POI Type</label>
                                <Select
                                    onChange={(value: poiTypeKey) => handleInputChange(value)}
                                    defaultValue="drug"
                                    options={(Object.keys(poiTypes) as poiTypeKey[])
                                        .filter((key) => isDevMode || key !== "dropPoints")
                                        .map((key) => ({
                                            value: key,
                                            label: <span>{poiTypes[key].icon} {poiTypes[key].name}</span>
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Delete Modal */}
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
                        <div className="mt-4 p-2 bg-gray-100 rounded flex flex-col gap-5">
                            <p><strong>Name:</strong> {poiList[poiToDelete].poiName}</p>
                            <p><strong>Type:</strong> {poiTypes[poiList[poiToDelete].poiType as poiTypeKey]?.name}</p>
                            <p className="flex items-center gap-2">
                                <strong>Password:</strong>
                                <Input type="password" onChange={handlePwDelete} placeholder="Enter password"/>
                            </p>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default Map;
