import {LayerGroup, Popup, Rectangle, useMapEvents} from 'react-leaflet';
import {useEffect, useState} from 'react';
import PaintControls from './PaintControls';
import {supabase} from "../config/supabase.ts";
import toast from "react-hot-toast";
import {Button, Input, Modal} from "antd";
// @ts-ignore
import Cookies from 'js-cookie';

export interface PixelTerritory {
    id: string;
    name: string;
    color: string;
    boxes: {
        bounds: [[number, number], [number, number]];
    }[];
}

export type PaintModeType = 'add' | 'remove' | 'edit';

export interface PaintMode {
    active: boolean;
    color: string;
    boxSize: number;
    gangName: string;
    mode: PaintModeType;
}

const Territories = ({isDevMode, filteredGangs}: { isDevMode: boolean, filteredGangs: string }) => {
    const [territories, setTerritories] = useState<PixelTerritory[]>([]);
    const [paintMode, setPaintMode] = useState<PaintMode>({
        active: false,
        color: '#FF0000',
        boxSize: 10,
        gangName: 'New Gang',
        mode: 'add'
    });

    const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
    const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [lastClickedPos, setLastClickedPos] = useState<{ x: number | null, y: number | null }>({x: null, y: null});

    // Add these new states near the top of the component where other states are declared
    const [enteredPassword, setEnteredPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Add new state for the edit modal
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingTerritory, setEditingTerritory] = useState<{ name: string; color: string }>({
        name: '',
        color: ''
    });

    useEffect(() => {
        (async () => {
            const {data: gangs} = await supabase
                .from('gangs')
                .select('*')
            //@ts-ignore
            setTerritories(gangs)
        })()
    }, []);

    const generateStaticData = async () => {
        if (!selectedTerritoryId) {
            toast.error('No territory selected!');
            return;
        }
        const territory = territories.find(t => t.id === selectedTerritoryId);

        if (!territory) {
            toast.error('Selected territory not found!');
            return;
        }

        try {
            const {data: gangs} = await supabase.from('gangs').select('*').eq('id', territory.id);

            if (!gangs) {
                // Prepare the data object for update
                const dataToAdd = {
                    color: territory.color,
                    boxes: territory.boxes,
                    name: territory.name.replace(/'/g, "\\'"),
                };

                await supabase
                    .from('gangs')
                    .insert([
                        dataToAdd,
                    ])
            } else {
                // Prepare the data object for update
                const dataToUpdate = {
                    name: territory.name.replace(/'/g, "\\'"),
                    color: territory.color,
                    boxes: territory.boxes,
                };
                console.log(dataToUpdate);

                await supabase
                    .from('gangs')
                    .update(dataToUpdate)
                    .eq('id', territory.id)

            }
            toast.success("Territory updated/added!");
        } catch {
            toast.error("Failed to update territory!");
        }

    };

    // Helper: Add multiple boxes in a horizontal line from startX to endX at fixed y
    const addBoxesInHorizontalLine = (startX: number, endX: number, y: number, territory: PixelTerritory) => {
        const boxesToAdd = [];
        for (let x = startX; x <= endX; x += paintMode.boxSize) {
            const exists = territory.boxes.some(b =>
                b.bounds[0][0] === y &&
                b.bounds[0][1] === x
            );
            if (!exists) {
                boxesToAdd.push({
                    bounds: [
                        [y, x],
                        [y + paintMode.boxSize, x + paintMode.boxSize]
                    ] as [[number, number], [number, number]]
                });
            }
        }
        if (boxesToAdd.length > 0) {
            const updatedTerritory = {
                ...territory,
                boxes: [...territory.boxes, ...boxesToAdd]
            };
            setTerritories(prev =>
                prev.map(t => t.id === updatedTerritory.id ? updatedTerritory : t)
            );
        }
    };

    // Helper: Add multiple boxes in a vertical line from startY to endY at fixed x
    const addBoxesInVerticalLine = (startY: number, endY: number, x: number, territory: PixelTerritory) => {
        const boxesToAdd = [];
        for (let y = startY; y <= endY; y += paintMode.boxSize) {
            const exists = territory.boxes.some(b =>
                b.bounds[0][0] === y &&
                b.bounds[0][1] === x
            );
            if (!exists) {
                boxesToAdd.push({
                    bounds: [
                        [y, x],
                        [y + paintMode.boxSize, x + paintMode.boxSize]
                    ] as [[number, number], [number, number]]
                });
            }
        }
        if (boxesToAdd.length > 0) {
            const updatedTerritory = {
                ...territory,
                boxes: [...territory.boxes, ...boxesToAdd]
            };
            setTerritories(prev =>
                prev.map(t => t.id === updatedTerritory.id ? updatedTerritory : t)
            );
        }
    };

    useMapEvents({
        click: (e: any) => {
            if (!paintMode.active || !selectedTerritoryId) return;

            const {lat, lng} = e.latlng;
            const snappedLat = Math.floor(lat / paintMode.boxSize) * paintMode.boxSize;
            const snappedLng = Math.floor(lng / paintMode.boxSize) * paintMode.boxSize;

            const clickedBox = {
                bounds: [
                    [snappedLat, snappedLng],
                    [snappedLat + paintMode.boxSize, snappedLng + paintMode.boxSize]
                ] as [[number, number], [number, number]]
            };

            const territory = territories.find(t => t.id === selectedTerritoryId);
            if (!territory) return;

            if (paintMode.mode === 'add') {
                if (e.originalEvent.shiftKey && lastClickedPos.x !== null && lastClickedPos.y !== null) {
                    if (lastClickedPos.y === snappedLat) {
                        // Horizontal line fill
                        const startX = Math.min(lastClickedPos.x, snappedLng);
                        const endX = Math.max(lastClickedPos.x, snappedLng);
                        addBoxesInHorizontalLine(startX, endX, snappedLat, territory);
                    } else if (lastClickedPos.x === snappedLng) {
                        // Vertical line fill
                        const startY = Math.min(lastClickedPos.y, snappedLat);
                        const endY = Math.max(lastClickedPos.y, snappedLat);
                        addBoxesInVerticalLine(startY, endY, snappedLng, territory);
                    } else {
                        // Neither x nor y match, just add single box
                        const exists = territory.boxes.some(b =>
                            b.bounds[0][0] === clickedBox.bounds[0][0] &&
                            b.bounds[0][1] === clickedBox.bounds[0][1]
                        );
                        if (!exists) {
                            const updatedTerritory = {
                                ...territory,
                                boxes: [...territory.boxes, clickedBox]
                            };
                            setTerritories(prev =>
                                prev.map(t => t.id === updatedTerritory.id ? updatedTerritory : t)
                            );
                        }
                    }
                } else {
                    // Single box add
                    const exists = territory.boxes.some(b =>
                        b.bounds[0][0] === clickedBox.bounds[0][0] &&
                        b.bounds[0][1] === clickedBox.bounds[0][1]
                    );
                    if (!exists) {
                        const updatedTerritory = {
                            ...territory,
                            boxes: [...territory.boxes, clickedBox]
                        };
                        setTerritories(prev =>
                            prev.map(t => t.id === updatedTerritory.id ? updatedTerritory : t)
                        );
                    }
                }
                setLastClickedPos({x: snappedLng, y: snappedLat});
            } else if (paintMode.mode === 'remove') {
                const updatedBoxes = territory.boxes.filter(b => {
                    const [topLeft, bottomRight] = b.bounds;
                    return !(lat >= topLeft[0] &&
                        lat <= bottomRight[0] &&
                        lng >= topLeft[1] &&
                        lng <= bottomRight[1]);
                });

                const updatedTerritory = {...territory, boxes: updatedBoxes};
                setTerritories(prev =>
                    prev.map(t => t.id === updatedTerritory.id ? updatedTerritory : t)
                );

                setLastClickedPos({x: lng, y: lat});
            }
        }
    });


    const stopPainting = () => {
        setPaintMode(prev => ({...prev, active: false}));
        setSelectedTerritoryId(null);
        setPopupPosition(null);
        setLastClickedPos({x: null, y: null});
    };

    const createNewTerritory = () => {
        const newId = `custom-${Date.now()}`;
        const newTerritory: PixelTerritory = {
            id: newId,
            name: paintMode.gangName,
            color: paintMode.color,
            boxes: []
        };
        setTerritories(prev => [...prev, newTerritory]);
        setSelectedTerritoryId(newId);
        setLastClickedPos({x: null, y: null});
    };

    // Add the password check handler
    const handleCheckPassword = async () => {
        if (!enteredPassword.trim()) {
            toast.error("Please enter the password.");
            return;
        }

        setLoading(true);

        const {data, error} = await supabase
            .from("pw")
            .select("pw")
            .single();

        setLoading(false);

        if (error) {
            toast.error("Error fetching password from server.");
            console.error(error);
            return;
        }

        //@ts-ignore
        if (data?.pw === enteredPassword) {
            toast.success("Access granted!");
            setIsModalVisible(false);
            setIsEditModalVisible(true);

            // Set initial values for editing
            const territory = territories.find(t => t.id === selectedTerritoryId);
            if (territory) {
                setEditingTerritory({
                    name: territory.name,
                    color: territory.color
                });
            }

            Cookies.set("accessGranted", "true", {expires: 30}); // Expires in 30 days
        } else {
            toast.error("Incorrect password!");
        }
    };

    // Add handler for updating territory
    const handleUpdateTerritory = async () => {
        if (!selectedTerritoryId) return;

        try {
            const {error} = await supabase
                .from('gangs')
                .update({
                    name: editingTerritory.name,
                    color: editingTerritory.color
                })
                .eq('id', selectedTerritoryId);

            if (error) throw error;

            // Update local state
            setTerritories(prev =>
                prev.map(t => t.id === selectedTerritoryId
                    ? {...t, ...editingTerritory}
                    : t
                )
            );

            toast.success("Territory updated successfully!");
            setIsEditModalVisible(false);
            setPopupPosition(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update territory!");
        }
    };


    return (
        <>
            {territories.filter(t =>
                filteredGangs === 'all' || Number(t.id) === Number(filteredGangs)
            ).map((territory) => (
                <LayerGroup key={territory.id}>
                    {territory.boxes.map((box, index) => (
                        <Rectangle
                            key={`${territory.id}-${index}`}
                            bounds={box.bounds}
                            pathOptions={{
                                fillColor: territory.color,
                                color: territory.color,
                                fillOpacity: territory.id === selectedTerritoryId ? 0.9 : 0.7,
                                weight: territory.id === selectedTerritoryId ? 1 : 0.5
                            }}
                            eventHandlers={{
                                click: () => {
                                    if (paintMode.active) return;

                                    setSelectedTerritoryId(territory.id);
                                    const bounds = box.bounds;
                                    const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
                                    const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
                                    setPopupPosition([centerLat, centerLng]);
                                },
                            }}
                        />
                    ))}

                    {selectedTerritoryId === territory.id && popupPosition && paintMode.mode !== 'edit' && (
                        <Popup
                            position={popupPosition}
                            //@ts-ignore
                            onClose={() => {
                                setSelectedTerritoryId(null);
                                setPopupPosition(null);
                            }}
                        >
                            <div className="flex flex-col gap-2 p-2">
                                <h3
                                    className="text-center text-2xl font-bold"
                                    style={{color: territory.color}}
                                >
                                    {territory.name}
                                </h3>
                                <hr/>
                                {/*<p><strong>Extra details:</strong> details here</p>*/}
                                <Button type="primary" onClick={() => setIsModalVisible(true)}>Edit Gang</Button>
                            </div>

                        </Popup>
                    )}
                </LayerGroup>
            ))}

            <Modal
                title="Enter Access Password"
                open={isModalVisible}
                closable={false}
                maskClosable={false}
                footer={[
                    <Button
                        key="submit"
                        type="primary"
                        loading={loading}
                        onClick={handleCheckPassword}
                    >
                        Submit
                    </Button>,
                ]}
            >
                <Input.Password
                    placeholder="Password"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    onPressEnter={handleCheckPassword}
                />
            </Modal>

            {/* Add this modal component after the password modal */}
            <Modal
                title="Edit Gang"
                open={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleUpdateTerritory}
                    >
                        Update
                    </Button>
                ]}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2">Gang Name</label>
                        <Input
                            value={editingTerritory.name}
                            onChange={(e) => setEditingTerritory(prev => ({
                                ...prev,
                                name: e.target.value
                            }))}
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Gang Color</label>
                        <Input
                            type="color"
                            value={editingTerritory.color}
                            onChange={(e) => setEditingTerritory(prev => ({
                                ...prev,
                                color: e.target.value
                            }))}
                            style={{width: '100%', height: '40px'}}
                        />
                    </div>
                </div>
            </Modal>


            {isDevMode && (
                <PaintControls
                    paintMode={paintMode}
                    setPaintMode={setPaintMode}
                    stopPainting={stopPainting}
                    createNewTerritory={createNewTerritory}
                    generateStaticData={generateStaticData}
                    territories={territories}
                    setTerritories={setTerritories}
                    selectedTerritoryId={selectedTerritoryId}
                    setSelectedTerritoryId={setSelectedTerritoryId}
                />
            )}
        </>
    );
};

export default Territories;