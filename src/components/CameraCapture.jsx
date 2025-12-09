import React, { useState, useRef } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Upload, Camera as CameraIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';

const CameraCapture = ({ onImageCapture }) => {
    const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);

    const takePicture = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl
            });
            setImage(image.dataUrl);
            onImageCapture(image.dataUrl);
        } catch (error) {
            console.error("Camera error:", error);
            // Fallback to file input if camera fails or is cancelled
            fileInputRef.current?.click();
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                onImageCapture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setImage(null);
        onImageCapture(null);
    };

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {!image ? (
                    <div className="p-8 text-center bg-gray-50/50">
                        <div className="mb-6 flex justify-center">
                            <div className="p-4 bg-blue-50 rounded-full">
                                <CameraIcon className="w-12 h-12 text-blue-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Snap your meal</h3>
                        <p className="text-gray-500 mb-8">Take a photo or upload to track your macros instantly</p>

                        <div className="space-y-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={takePicture}
                                className="w-full py-3.5 px-6 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <CameraIcon className="w-5 h-5" />
                                Take Photo
                            </motion.button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3.5 px-6 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                Upload from Gallery
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <img src={image} alt="Food capture" className="w-full h-80 object-cover" />
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={clearImage}
                                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
                                aria-label="Remove image"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;
