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

interface EditPOIState {
    poiName: string;
    poiType: poiTypeKey;
    adderName: string;
    poiGang: string;
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

    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [deletePw, setDeletePw] = useState("");
// Add these state variables
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editPw, setEditPw] = useState("");
    const [editPoiState, setEditPoiState] = useState<EditPOIState>({
        poiName: "",
        poiType: "drug",
        adderName: "",
        poiGang: "",
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const mapRef = useRef<any>(null);

    const [{poiName, poiType, adderName, latLng, poiGang}, setNewPOI] = useState<NewPOIState>({
        adderName: "",
        poiType: "drug",
        poiName: "",
        poiGang: "",
        latLng: [0, 0],
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [poiId, setPoiId] = useState<string | null>(null);

    const imageUrl = '/ecrp-map-poi/images/map.png';
    const imageWidth = 5000;
    const imageHeight = 5000;
    const bounds: [[number, number], [number, number]] = [
        [0, 0],
        [imageHeight, imageWidth]
    ];

// Update the sendWebhookNotification function for better formatting
    const sendWebhookNotification = async (
        username: string,
        action: "add" | "edit" | "delete",
        details: any
    ) => {
        const webhookUrl =
            "https://discord.com/api/webhooks/1408448012132548730/m8zoSy8dpprtanuwm01WtI7Wh7VV-bKdFij6xYZkMrOZlmHdEniaiy5urlz0HF2j7W1B";

        // Define colors for different actions
        const colors: Record<typeof action, number> = {
            add: 0x00ff00, // Green
            edit: 0xffa500, // Orange
            delete: 0xff0000, // Red
        };

        try {
            // Properly typed fields
            let fields: Array<{ name: string; value: string; inline?: boolean }> = [];

            if (action === "add") {
                fields = [
                    { name: "POI Name", value: String(details.poiName), inline: true },
                    {
                        name: "POI Type",
                        //@ts-ignore
                        value: String(poiTypes[details.poiType]?.name ?? "Unknown"),
                        inline: true,
                    },
                    {
                        name: "Gang",
                        value:
                            details.poiGang === "null"
                                ? "None"
                                : String(gangs.find((g) => g.id === details.poiGang)?.name || "None"),
                        inline: true,
                    },
                    { name: "Added By", value: String(details.adderName) },
                ];
            } else if (action === "edit") {
                fields = details.changes.map((change: any) => ({
                    name: String(change.field),
                    value: `**From:** ${String(change.from)}\n**To:** ${String(change.to)}`,
                    inline: true,
                }));

                // Add POI ID at the start
                fields.unshift({
                    name: "POI ID",
                    value: String(details.poiId),
                    inline: false,
                });
            } else if (action === "delete") {
                fields = [
                    { name: "POI ID", value: String(details.poiId), inline: true },
                    { name: "POI Name", value: String(details.poiName), inline: true },
                    {
                        name: "POI Type",
                        //@ts-ignore
                        value: String(poiTypes[details.poiType]?.name ?? "Unknown"),
                        inline: true,
                    },
                    {
                        name: "Gang",
                        value:
                            details.poiGang === "null"
                                ? "None"
                                : String(gangs.find((g) => g.id === details.poiGang)?.name || "None"),
                        inline: true,
                    },
                ];
            }

            const embed = {
                title: `POI ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                color: colors[action],
                fields,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Action by ${username}`,
                },
            };

            await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    embeds: [embed],
                }),
            });
        } catch (error) {
            console.error("Failed to send webhook notification:", error);
        }
    };


    const showModal = () => setIsModalOpen(true);
    const showDeleteModal = () => {
        setIsDeleteModalOpen(true);
    };

// Modify the showEditModal function
    const showEditModal = (poi: Poi) => {
        setEditPoiState({
            poiName: poi.poiName,
            poiType: poi.poiType as poiTypeKey,
            adderName: poi.adderName,
            poiGang: poi.poiGang || "",
        });

        //@ts-ignore
        setPoiId(poi.id);
        setIsEditModalOpen(true);
    };


// Update handleOk function
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
            setIsAdding(true);

            // Send webhook with new format
            await sendWebhookNotification(
                adderName,
                'add',
                {
                    poiName,
                    poiType,
                    poiGang,
                    adderName
                }
            );

            const {data, error} = await supabase
                .from('pois')
                .insert([poiDetails])
                .select();

            if (error) throw error;

            const newPoi = data[0];
            setPoiList(prev => [...prev, newPoi]);


            setIsModalOpen(false);
            setIsClick(false);
            toast.success("POI saved!");
        } catch {
            toast.error("Error saving POI");
        } finally {
            setIsAdding(false);
        }
    };

// Update handleEdit function
    const handleEdit = async () => {
        const {data: pw} = await supabase.from('pw').select('pw');

        setIsEditing(true);
        //@ts-ignore
        if (pw[0].pw !== editPw) {
            setEditPw("");
            return toast.error("Incorrect password");
        }

        if (!editPoiState.poiName || !editPoiState.adderName) {
            return toast.error("Please fill in all required fields");
        }

        try {
            const originalPoi = poiList.find(poi => poi.id === poiId);
            const changes = [];

            if (originalPoi) {
                if (originalPoi.poiName !== editPoiState.poiName) {
                    changes.push({
                        field: 'Name',
                        from: originalPoi.poiName,
                        to: editPoiState.poiName
                    });
                }
                if (originalPoi.poiType !== editPoiState.poiType) {
                    changes.push({
                        field: 'Type',
                        from: poiTypes[originalPoi.poiType].name,
                        to: poiTypes[editPoiState.poiType].name
                    });
                }
                if (originalPoi.adderName !== editPoiState.adderName) {
                    changes.push({
                        field: 'Added By',
                        from: originalPoi.adderName,
                        to: editPoiState.adderName
                    });
                }
                if (originalPoi.poiGang !== editPoiState.poiGang) {
                    const oldGang = gangs.find(g => g.id === originalPoi.poiGang)?.name || "None";
                    const newGang = gangs.find(g => g.id === editPoiState.poiGang)?.name || "None";
                    changes.push({
                        field: 'Gang',
                        from: oldGang,
                        to: newGang
                    });
                }
            }

            // Send webhook with new format
            await sendWebhookNotification(
                editPoiState.adderName,
                'edit',
                {
                    poiId,
                    changes
                }
            );

            await supabase
                .from('pois')
                .update({
                    poiName: editPoiState.poiName,
                    poiType: editPoiState.poiType,
                    adderName: editPoiState.adderName,
                    poiGang: editPoiState.poiGang || "null",
                })
                .eq('id', poiId);

            setPoiList(poiList.map(poi =>
                poi.id === poiId
                    ? {
                        ...poi,
                        poiName: editPoiState.poiName,
                        poiType: editPoiState.poiType,
                        adderName: editPoiState.adderName,
                        poiGang: editPoiState.poiGang || "null",
                    }
                    : poi
            ));


            toast.success("POI updated successfully!");
            setIsEditModalOpen(false);
            setPoiId(null);
            setEditPw("");
        } catch {
            toast.error("Error updating POI");
        } finally {
            setIsEditing(false);
        }
    };

// Update handleDelete function
    const handleDelete = async () => {
        const {data: pw} = await supabase.from('pw').select('pw');

        setIsDeleting(true);

        //@ts-ignore
        if (pw[0].pw !== deletePw) {
            setDeletePw("");
            return toast.error("Incorrect password");
        }

        try {
            const poiToDelete = poiList.find(poi => poi.id === poiId);

            if (!poiToDelete) {
                throw new Error('POI not found');
            }

            // Send webhook with new format
            await sendWebhookNotification(
                poiToDelete.adderName,
                'delete',
                {
                    poiId,
                    poiName: poiToDelete.poiName,
                    poiType: poiToDelete.poiType,
                    poiGang: poiToDelete.poiGang
                }
            );

            await supabase
                .from('pois')
                .delete()
                .eq('id', poiId);


            setPoiList(poiList.filter((poi) => poi.id !== poiId));
            toast.success("POI removed!");
            setIsDeleteModalOpen(false);
            setPoiId(null);
        } catch {
            toast.error("Error deleting POI");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditCancel = () => {
        setIsEditModalOpen(false);
        setEditPw("");
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement> | poiTypeKey) => {
        if (typeof e === 'string') {
            setEditPoiState(prev => ({...prev, poiType: e}));
        } else {
            const {name, value} = e.target;
            setEditPoiState(prev => ({...prev, [name]: value}));
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
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
                                            className='font-bold'>Gang:</span> {gangs.find(gangDetails => +gangDetails.id === +poi.poiGang)?.name || "N/A"}
                                        </p>
                                    )}
                                    {((poi.poiType !== "dropPoints" && poi.poiType !== "gangHQ") || isDevMode) && (
                                        <div className="flex gap-2">
                                            <Button
                                                className="text-sm w-full"
                                                type="primary"
                                                onClick={() => {
                                                    showEditModal(poi);
                                                }}
                                                icon={<span>✏️</span>}
                                            >
                                                Edit poi
                                            </Button>
                                            <Button
                                                className="text-sm w-full"
                                                type="primary"
                                                danger
                                                onClick={() => {
                                                    //@ts-ignore
                                                    setPoiId(poi.id);
                                                    showDeleteModal();
                                                }}
                                                icon={<span>🗑️</span>}
                                            >
                                                Remove poi
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )

                })}
            </>
        );
    };

    const currentPoi = poiList.find(poi => poi.id === poiId);

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
                    okButtonProps={{loading: isAdding}}
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
                                        .filter(key => isDevMode || (key !== "dropPoints" && key !== "gangHQ"))
                                        .map(key => ({
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
                    cancelText="Cancel"
                    okButtonProps={{danger: true, loading: isDeleting}}
                >
                    <p>Are you sure you want to delete this point of interest?</p>
                    {poiId !== null && (
                        <div className="mt-4 p-2 bg-gray-100 rounded flex flex-col gap-5">
                            <p><strong>Name:</strong> {currentPoi?.poiName}</p>
                            <p><strong>Type:</strong> {poiTypes[currentPoi?.poiType as poiTypeKey]?.name}</p>
                            <p className="flex items-center gap-2">
                                <strong>Password:</strong>
                                <Input type="password" onChange={(e) => setDeletePw(e.target.value)}
                                       placeholder="Enter password"/>
                            </p>
                        </div>
                    )}
                </Modal>
                {/* Edit Modal */}
                <Modal
                    title="Edit Point of Interest"
                    open={isEditModalOpen}
                    onOk={handleEdit}
                    onCancel={handleEditCancel}
                    okText="Update"
                    cancelText="Cancel"
                    okButtonProps={{loading: isEditing}}
                >
                    {poiId !== null && (
                        <div className="flex flex-col gap-2">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Added By</label>
                                    <Input
                                        name="adderName"
                                        value={editPoiState.adderName}
                                        onChange={handleEditInputChange}
                                        placeholder="e.g. Cole Lawless"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">POI Name</label>
                                    <Input
                                        name="poiName"
                                        value={editPoiState.poiName}
                                        onChange={handleEditInputChange}
                                        placeholder="e.g. Matthews"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">POI's Gang</label>
                                    <Select
                                        value={gangs.find(gang => +gang.id === +editPoiState.poiGang)?.name ?? "null"}
                                        onChange={(value) => {
                                            setEditPoiState(prev => ({...prev, poiGang: value}));
                                        }}
                                        style={{width: 200}}
                                    >
                                        <Select.Option value="null">None</Select.Option>
                                        {gangs.map((gang) => (
                                            <Select.Option
                                                key={gang.id}
                                                value={gang.id}
                                                style={{color: gang.color}}
                                            >
                                                {gang.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">POI Type</label>
                                    <Select
                                        value={editPoiState.poiType}
                                        onChange={(value: poiTypeKey) => handleEditInputChange(value)}
                                        options={(Object.keys(poiTypes) as poiTypeKey[])
                                            .filter(key => isDevMode || (key !== "dropPoints" && key !== "gangHQ"))
                                            .map(key => ({
                                                value: key,
                                                label: <span>{poiTypes[key].icon} {poiTypes[key].name}</span>
                                            }))
                                        }
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <Input
                                        type="password"
                                        value={editPw}
                                        onChange={(e) => setEditPw(e.target.value)}
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default Map;