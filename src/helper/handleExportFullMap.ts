import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import toast from "react-hot-toast";

export const handleExportFullMap = async () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    await toast.promise(
        htmlToImage.toPng(mapElement, {
            backgroundColor: 'white',
            quality: 1,
        })
            .then((dataUrl) => {
                download(dataUrl, 'map.png');
            }),
        {
            loading: 'Exporting map...',
            success: 'Map exported!',
            error: 'Failed to export map',
        }
    );
};
