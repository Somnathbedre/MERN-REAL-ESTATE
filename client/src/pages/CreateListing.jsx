import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // ======= Cloudinary credentials ========

  // ======= Cloudinary credentials from .env ========
   const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
   const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // 🔁 Replace with your Cloudinary cloud name
 // 🔁 Replace with your upload preset

  const handleImageSubmit = async () => {
    if (files.length > 0 && files.length + formData.imageUrls.length <= 6) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(uploadToCloudinary(files[i]));
      }

      try {
        const urls = await Promise.all(promises);
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...urls],
        }));
        setUploading(false);
      } catch (err) {
        console.error(err);
        setImageUploadError('Image upload failed (2 MB max per image)');
        setUploading(false);
      }
    } else {
      setImageUploadError('You can only upload up to 6 images per listing');
      setUploading(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed');
    return data.secure_url;
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    if (e.target.id === 'sale' || e.target.id === 'rent') {
      setFormData({ ...formData, type: e.target.id });
    } else if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setFormData({ ...formData, [e.target.id]: e.target.checked });
    } else {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.imageUrls.length < 1) {
      return setError('You must upload at least one image');
    }
    if (+formData.regularPrice < +formData.discountPrice) {
      return setError('Discount price must be lower than regular price');
    }

    try {
      setLoading(true);
      setError(false);
      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userRef: currentUser._id }),
      });

      const data = await res.json();
      setLoading(false);
      if (data.success === false) return setError(data.message);
      navigate(`/listing/${data._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className='p-3 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Create a Listing</h1>
      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
        {/* Left section */}
        <div className='flex flex-col gap-4 flex-1'>
          <input type='text' placeholder='Name' className='border p-3 rounded-lg' id='name' maxLength='62' minLength='10' required onChange={handleChange} value={formData.name} />
          <textarea placeholder='Description' className='border p-3 rounded-lg' id='description' required onChange={handleChange} value={formData.description} />
          <input type='text' placeholder='Address' className='border p-3 rounded-lg' id='address' required onChange={handleChange} value={formData.address} />

          <div className='flex gap-6 flex-wrap'>
            <Checkbox id='sale' label='Sell' checked={formData.type === 'sale'} onChange={handleChange} />
            <Checkbox id='rent' label='Rent' checked={formData.type === 'rent'} onChange={handleChange} />
            <Checkbox id='parking' label='Parking spot' checked={formData.parking} onChange={handleChange} />
            <Checkbox id='furnished' label='Furnished' checked={formData.furnished} onChange={handleChange} />
            <Checkbox id='offer' label='Offer' checked={formData.offer} onChange={handleChange} />
          </div>

          <div className='flex flex-wrap gap-6'>
            <NumberInput id='bedrooms' label='Beds' min={1} max={10} value={formData.bedrooms} onChange={handleChange} />
            <NumberInput id='bathrooms' label='Baths' min={1} max={10} value={formData.bathrooms} onChange={handleChange} />
            <NumberInput id='regularPrice' label='Regular price' min={50} max={10000000} value={formData.regularPrice} onChange={handleChange} extra={formData.type === 'rent' && '($ / month)'} />
            {formData.offer && (
              <NumberInput id='discountPrice' label='Discounted price' min={0} max={10000000} value={formData.discountPrice} onChange={handleChange} extra={formData.type === 'rent' && '($ / month)'} />
            )}
          </div>
        </div>

        {/* Right section */}
        <div className='flex flex-col flex-1 gap-4'>
          <p className='font-semibold'>Images: <span className='font-normal text-gray-600 ml-2'>The first image will be the cover (max 6)</span></p>
          <div className='flex gap-4'>
            <input type='file' accept='image/*' multiple className='p-3 border border-gray-300 rounded w-full' onChange={(e) => setFiles(e.target.files)} />
            <button type='button' onClick={handleImageSubmit} disabled={uploading} className='p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80'>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {imageUploadError && <p className='text-red-700 text-sm'>{imageUploadError}</p>}
          {formData.imageUrls.map((url, index) => (
            <div key={url} className='flex justify-between p-3 border items-center'>
              <img src={url} alt='listing image' className='w-20 h-20 object-contain rounded-lg' />
              <button type='button' onClick={() => handleRemoveImage(index)} className='p-3 text-red-700 rounded-lg uppercase hover:opacity-75'>Delete</button>
            </div>
          ))}
          <button type='submit' disabled={loading || uploading} className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80'>
            {loading ? 'Creating...' : 'Create listing'}
          </button>
          {error && <p className='text-red-700 text-sm'>{error}</p>}
        </div>
      </form>
    </main>
  );
}

// Reusable Components
const Checkbox = ({ id, label, checked, onChange }) => (
  <div className='flex gap-2'>
    <input type='checkbox' id={id} className='w-5' checked={checked} onChange={onChange} />
    <span>{label}</span>
  </div>
);

const NumberInput = ({ id, label, value, min, max, onChange, extra }) => (
  <div className='flex items-center gap-2'>
    <input type='number' id={id} min={min} max={max} className='p-3 border border-gray-300 rounded-lg' required value={value} onChange={onChange} />
    <div className='flex flex-col items-center'>
      <p>{label}</p>
      {extra && <span className='text-xs'>{extra}</span>}
    </div>
  </div>
);
