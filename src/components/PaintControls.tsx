import { PixelTerritory, PaintMode } from './Territory.tsx';

interface PaintControlsProps {
    paintMode: PaintMode;
    setPaintMode: React.Dispatch<React.SetStateAction<PaintMode>>;
    selectedTerritoryId: string | null;
    territories: PixelTerritory[];
    startPainting: (mode: 'add' | 'remove' | 'edit') => void;
    stopPainting: () => void;
    createNewTerritory: () => void;
    generateStaticData: () => void;
    setTerritories: React.Dispatch<React.SetStateAction<PixelTerritory[]>>;
    setSelectedTerritoryId: React.Dispatch<React.SetStateAction<string | null>>;
}

const PaintControls: React.FC<PaintControlsProps> = ({
                                                         paintMode,
                                                         setPaintMode,
                                                         selectedTerritoryId,
                                                         territories,
                                                         startPainting,
                                                         stopPainting,
                                                         createNewTerritory,
                                                         generateStaticData,
                                                         setTerritories,
                                                         setSelectedTerritoryId
                                                     }) => {
    const selectedTerritory = selectedTerritoryId
        ? territories.find(t => t.id === selectedTerritoryId)
        : null;

    const handlePropertyChange = (property: keyof PixelTerritory, value: string) => {
        if (!selectedTerritoryId || !selectedTerritory) return;

        if (property === 'id') {
            if (!value.trim() || value === selectedTerritory.id) return;
            if (territories.some(t => t.id === value)) {
                alert('This ID is already in use!');
                return;
            }

            setTerritories(prev =>
                prev.map(t =>
                    t.id === selectedTerritoryId ? { ...t, id: value } : t
                )
            );
            setSelectedTerritoryId(value);
            return;
        }

        setTerritories(prev =>
            prev.map(t =>
                t.id === selectedTerritoryId ? { ...t, [property]: value } : t
            )
        );
    };

    return (
        <div className="leaflet-top leaflet-right" style={{ top: '100px', width: '300px' }}>
            <div className="leaflet-control leaflet-bar bg-white p-3 rounded shadow-lg">
                {paintMode.active ? (
                    <div className="space-y-3">
                        <h3 className="font-bold text-center">
                            {paintMode.mode === 'add'
                                ? 'Adding Pixels'
                                : paintMode.mode === 'remove'
                                    ? 'Removing Pixels'
                                    : 'Editing Territory'}
                        </h3>

                        {selectedTerritory && (
                            <div className="bg-gray-100 p-2 rounded">
                                <div className="text-sm">
                                    <strong>Editing:</strong> {selectedTerritory.name}
                                </div>
                                <div className="text-xs text-gray-600">ID: {selectedTerritory.id}</div>
                            </div>
                        )}

                        {paintMode.mode === 'edit' && selectedTerritory && (
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <label className="text-sm mr-2">Color:</label>
                                    <input
                                        type="color"
                                        defaultValue={selectedTerritory.color}
                                        onChange={e => handlePropertyChange('color', e.target.value)}
                                        className="w-8 h-8"
                                    />
                                </div>
                            </div>
                        )}

                        {paintMode.mode !== 'edit' && (
                            <>
                                <div className="flex items-center">
                                    <input
                                        type="color"
                                        value={paintMode.color}
                                        onChange={e => setPaintMode(prev => ({ ...prev, color: e.target.value }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">
                    {paintMode.mode === 'add' ? 'Paint Color' : 'Remove Color'}
                  </span>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Gang Name:</label>
                                    <input
                                        type="text"
                                        value={paintMode.gangName}
                                        onChange={e => setPaintMode(prev => ({ ...prev, gangName: e.target.value }))}
                                        className="w-full p-1 border text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Pixel Size:</label>
                                    <select
                                        value={paintMode.boxSize}
                                        onChange={e =>
                                            setPaintMode(prev => ({ ...prev, boxSize: Number(e.target.value) }))
                                        }
                                        className="w-full p-1 border text-sm"
                                    >
                                        <option value="5">5px</option>
                                        <option value="10">10px</option>
                                        <option value="15">15px</option>
                                        <option value="20">20px</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setPaintMode(prev => ({ ...prev, active: true, mode: 'add' }))}
                                className={`p-1 text-sm ${
                                    paintMode.mode === 'add' ? 'bg-green-500 text-white' : 'bg-gray-200'
                                }`}
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setPaintMode(prev => ({ ...prev, active: true, mode: 'remove' }))}
                                className={`p-1 text-sm ${
                                    paintMode.mode === 'remove' ? 'bg-red-500 text-white' : 'bg-gray-200'
                                }`}
                            >
                                Remove
                            </button>
                            <button
                                onClick={() => {
                                    if (!selectedTerritoryId) {
                                        alert('Please select a territory first by clicking its "Select" button');
                                        return;
                                    }
                                    setPaintMode({
                                        active: true,
                                        mode: 'edit',
                                        color: selectedTerritory?.color || '#FF0000',
                                        boxSize: 10,
                                        gangName: selectedTerritory?.gang || 'New Gang'
                                    });
                                }}
                                className={`p-1 text-sm ${
                                    paintMode.mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                }`}
                                disabled={!selectedTerritoryId}
                            >
                                Edit
                            </button>
                        </div>

                        {!selectedTerritoryId && paintMode.mode !== 'edit' && (
                            <button
                                onClick={createNewTerritory}
                                className="w-full bg-blue-500 text-white p-1 text-sm mt-2"
                            >
                                Create New Territory
                            </button>
                        )}

                        {selectedTerritoryId && (
                            <div className="text-sm mt-2 p-1 bg-yellow-100">
                                {paintMode.mode === 'edit' ? 'Editing: ' : 'Selected: '}
                                {territories.find(t => t.id === selectedTerritoryId)?.name}
                            </div>
                        )}

                        <button
                            onClick={stopPainting}
                            className="w-full bg-red-500 text-white p-1 text-sm mt-2"
                        >
                            Exit Edit Mode
                        </button>

                        <button
                            onClick={generateStaticData}
                            className="w-full bg-purple-500 text-white p-1 text-sm"
                        >
                            Generate Static Data
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <button
                            onClick={() => startPainting('add')}
                            className="w-full bg-green-500 text-white p-1 text-sm"
                        >
                            Enter Edit Mode
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaintControls;
