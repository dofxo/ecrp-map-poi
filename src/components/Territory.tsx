import {LayerGroup, Popup, Rectangle, useMapEvents} from 'react-leaflet';
import {useEffect, useState} from 'react';
import PaintControls from './PaintControls';
import {supabase} from "../config/supabase.ts";

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

const Territories = ({isDevMode}: { isDevMode: boolean }) => {
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

    const [lastClickedPos, setLastClickedPos] = useState<{ x: number | null, y: number | null }>({x: null, y: null});

    useEffect(() => {
        (async () => {
            const {data: gangs} = await supabase
                .from('gangs')
                .select('*')
            //@ts-ignore
            setTerritories(gangs)
        })()
    }, []);

    const generateStaticData = () => {
        if (!selectedTerritoryId) {
            alert('No territory selected!');
            return;
        }
        const territory = territories.find(t => t.id === selectedTerritoryId);

        if (!territory) {
            alert('Selected territory not found!');
            return;
        }

        const staticData = `{
    id: '${territory.id}',
    name: '${territory.name.replace(/'/g, "\\'")}',
    color: '${territory.color}',
    boxes: ${JSON.stringify(territory.boxes, null, 4).replace(/"bounds"/g, 'bounds')}
}`;

        navigator.clipboard.writeText(staticData).then(() => {
            alert('Static data for selected territory copied to clipboard! Paste it into your territories file.');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy data');
        });
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
                const updatedBoxes = territory.boxes.filter(b =>
                    !(b.bounds[0][0] === clickedBox.bounds[0][0] &&
                        b.bounds[0][1] === clickedBox.bounds[0][1])
                );

                if (updatedBoxes.length === 0) {
                    setTerritories(prev => prev.filter(t => t.id !== territory.id));
                    setSelectedTerritoryId(null);
                    setPopupPosition(null);
                } else {
                    const updatedTerritory = {
                        ...territory,
                        boxes: updatedBoxes
                    };
                    setTerritories(prev =>
                        prev.map(t => t.id === updatedTerritory.id ? updatedTerritory : t)
                    );
                }
                setLastClickedPos({x: snappedLng, y: snappedLat});
            }
        }
    });

    const startPainting = (mode: PaintModeType) => {
        setPaintMode(prev => ({
            ...prev,
            active: true,
            mode: mode,
            ...(mode === 'edit' && selectedTerritoryId ? {
                color: territories.find(t => t.id === selectedTerritoryId)?.color || prev.color
            } : {})
        }));
    };

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

    return (
        <>
            {territories.map((territory) => (
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
                            <div>
                                <h3
                                    className="text-center text-2xl font-bold"
                                    style={{color: territory.color}}
                                >
                                    {territory.name}
                                </h3>
                                <hr/>
                                <p><strong>Extra details:</strong> details here</p>
                            </div>
                        </Popup>
                    )}
                </LayerGroup>
            ))}

            {isDevMode && (
                <PaintControls
                    paintMode={paintMode}
                    setPaintMode={setPaintMode}
                    startPainting={startPainting}
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
