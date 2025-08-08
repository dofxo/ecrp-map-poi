import { LayerGroup, Rectangle, Tooltip, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import PaintControls from './PaintControls';
import { defaultTerritories } from "../data/gangTerritories/gangTerritories.ts";

export interface PixelTerritory {
    id: string;
    name: string;
    gang: string;
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

const isDevMode = true;

const Territories = () => {
    const [territories, setTerritories] = useState<PixelTerritory[]>(defaultTerritories);
    const [paintMode, setPaintMode] = useState<PaintMode>({
        active: false,
        color: '#FF0000',
        boxSize: 10,
        gangName: 'New Gang',
        mode: 'add'
    });

    const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);

    const generateStaticData = () => {
        const staticData = territories.map(territory => {
            return `{
    id: '${territory.id}',
    name: '${territory.name.replace(/'/g, "\\'")}',
    gang: '${territory.gang.replace(/'/g, "\\'")}',
    color: '${territory.color}',
    boxes: ${JSON.stringify(territory.boxes, null, 4).replace(/"bounds"/g, 'bounds')}
}`;
        }).join(',\n\n');

        navigator.clipboard.writeText(staticData).then(() => {
            alert('Static data copied to clipboard! Paste it into your territories file.');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy data');
        });
    };

    useMapEvents({
        click: (e) => {
            if (!paintMode.active || !selectedTerritoryId) return;

            const { lat, lng } = e.latlng;
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
            } else if (paintMode.mode === 'remove') {
                const updatedBoxes = territory.boxes.filter(b =>
                    !(b.bounds[0][0] === clickedBox.bounds[0][0] &&
                        b.bounds[0][1] === clickedBox.bounds[0][1])
                );

                if (updatedBoxes.length === 0) {
                    setTerritories(prev => prev.filter(t => t.id !== territory.id));
                    setSelectedTerritoryId(null);
                } else {
                    const updatedTerritory = {
                        ...territory,
                        boxes: updatedBoxes
                    };
                    setTerritories(prev =>
                        prev.map(t => t.id === updatedTerritory.id ? updatedTerritory : t)
                    );
                }
            }
        }
    });

    const startPainting = (mode: PaintModeType) => {
        if (mode === 'edit' && !selectedTerritoryId) {
            alert('Please select a territory first by clicking its "Select" button');
            return;
        }

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
        setPaintMode(prev => ({ ...prev, active: false }));
        setSelectedTerritoryId(null);
    };

    const deleteTerritory = (id: string) => {
        setTerritories(prev => prev.filter(t => t.id !== id));
        if (selectedTerritoryId === id) {
            setSelectedTerritoryId(null);
        }
    };

    const createNewTerritory = () => {
        const newId = `custom-${Date.now()}`;
        const newTerritory: PixelTerritory = {
            id: newId,
            name: paintMode.gangName,
            gang: paintMode.gangName,
            color: paintMode.color,
            boxes: []
        };
        setTerritories(prev => [...prev, newTerritory]);
        setSelectedTerritoryId(newId);
    };

    return (
        <>
            {territories.map((territory) => {
                const middleBoxIndex = Math.floor(territory.boxes.length / 2);
                const middlePos: [number, number] = [
                    territory.boxes[middleBoxIndex].bounds[0][0],
                    territory.boxes[middleBoxIndex].bounds[0][1]
                ];

                return (
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
                                    contextmenu: (e) => {
                                        e.originalEvent.preventDefault();
                                        deleteTerritory(territory.id);
                                    }
                                }}
                            />
                        ))}

                        {/* Invisible marker to hold the tooltip */}
                        {territory.boxes.length > 0 && (
                            <Marker position={middlePos} opacity={0}>
                                <Tooltip
                                    direction="center"
                                    permanent
                                    className="gang-tooltip !z-[10000000000]"
                                >
                                    <div className="text-center">
                                        <strong>{territory.name}</strong>
                                        <br />
                                        {territory.gang}
                                        <div className="mt-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTerritoryId(
                                                        selectedTerritoryId === territory.id ? null : territory.id
                                                    );
                                                }}
                                                className={`text-xs p-1 mb-1 w-full ${
                                                    selectedTerritoryId === territory.id
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-200'
                                                }`}
                                            >
                                                {selectedTerritoryId === territory.id ? 'Selected' : 'Select'}
                                            </button>
                                        </div>
                                    </div>
                                </Tooltip>
                            </Marker>
                        )}
                    </LayerGroup>
                );
            })}

            {isDevMode && (
                <PaintControls
                    paintMode={paintMode}
                    setPaintMode={setPaintMode}
                    selectedTerritoryId={selectedTerritoryId}
                    territories={territories}
                    startPainting={startPainting}
                    stopPainting={stopPainting}
                    createNewTerritory={createNewTerritory}
                    generateStaticData={generateStaticData}
                    setTerritories={setTerritories}
                    setSelectedTerritoryId={setSelectedTerritoryId}
                />
            )}
        </>
    );
};

export default Territories;
