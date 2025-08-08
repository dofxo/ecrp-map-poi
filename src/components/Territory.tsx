import { LayerGroup, Rectangle, Tooltip, Marker, useMapEvents, Popup } from 'react-leaflet';
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

    // <-- Added: Calculate center of territory by averaging all boxes' bounds points
    const getTerritoryCenter = (territory: PixelTerritory): [number, number] => {
        const allPoints = territory.boxes.flatMap(box => box.bounds);
        if (allPoints.length === 0) return [0, 0];
        const lats = allPoints.map(p => p[0]);
        const lngs = allPoints.map(p => p[1]);
        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        return [avgLat, avgLng];
    };

    return (
        <>
            {territories.map((territory) => {
                const middleBoxIndex = Math.floor(territory.boxes.length / 2);

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

                        {territory.boxes.length > 0 && (
                            <Marker position={getTerritoryCenter(territory)}>
                                <Popup>
                                    <div>
                                        <h3 className="text-center text-2xl font-bold" style={{color:territory.color}}>{territory.name}</h3>
                                        <hr/>
                                        <p><strong>Gang:</strong> {territory.gang}</p>
                                        <p><strong>Extra Details:</strong> <span>extra details</span></p>
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
                                </Popup>
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
