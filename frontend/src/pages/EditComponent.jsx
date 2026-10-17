import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';

export const EditComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Development Boards',
    isFree: false,
    price: '',
    condition: 'NEW',
    techSpecs: '',
    whySell: '',
    projectLinks: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchComponent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to edit a listing.');
        navigate('/login');
        return;
      }

      let data;
      try {
        const res = await apiClient.get(`/components/${id}`);
        data = res.data;
      } catch (err) {
        alert('Error fetching listing: ' + (err.response?.data?.error || err.message));
        navigate('/profile');
        return;
      }

      if (data.seller_id !== user.id) {
        alert('You do not have permission to edit this listing.');
        navigate('/profile');
        return;
      }

      setFormData({
        title: data.title || '',
        category: data.category || 'Development Boards',
        isFree: data.is_free || false,
        price: data.price ? data.price.toString() : '',
        condition: data.condition || 'NEW',
        techSpecs: data.tech_specs || '',
        whySell: data.why_sell || '',
        projectLinks: data.project_links || '',
        status: data.status || 'ACTIVE'
      });
      setExistingImages(data.images || []);
      setLoading(false);
    };

    fetchComponent();
  }, [id, navigate]);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (idxToRemove) => {
    setImages((prev) => prev.filter((img, idx) => {
      if (idx === idxToRemove) {
        URL.revokeObjectURL(img.previewUrl);
        return false;
      }
      return true;
    }));
  };

  const handleUpdate = async () => {
    try {
      setIsPosting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to edit a listing.');
        setIsPosting(false);
        return;
      }

      // Upload new images to Cloudflare R2
      const uploadedImageUrls = [...existingImages];

      for (const img of images) {
        // 1. Get presigned URL
        const presignRes = await apiClient.post('/upload/presigned-url', { prefix: 'components' });
        const { uploadUrl, publicUrl } = presignRes.data;

        // 2. Upload file directly to R2
        await fetch(uploadUrl, {
          method: 'PUT',
          body: img.file,
          headers: {
            'Content-Type': img.file.type || 'image/webp'
          }
        });
        
        uploadedImageUrls.push(publicUrl);
      }

      // Update in Express backend
      await apiClient.put(`/components/${id}`, {
        title: formData.title,
        category: formData.category,
        is_free: formData.isFree,
        price: formData.isFree ? 0 : parseFloat(formData.price),
        condition: formData.condition,
        tech_specs: formData.techSpecs,
        why_sell: formData.whySell,
        images: uploadedImageUrls,
        status: formData.status,
        project_links: formData.projectLinks
      });

      alert('Listing updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing: ' + error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages(existingImages.filter((_, idx) => idx !== indexToRemove));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans">Loading...</div>;
  }

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24">
      
      {/* TopAppBar */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Edit Your Hardware</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-[88vw] 2xl:max-w-[1200px] mx-auto px-3 md:px-[22px] py-8">
        <div className="space-y-8">
          
          {/* Image Upload Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Product Photos</label>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Manage existing & add new</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {existingImages.map((imgUrl, idx) => (
                <div key={`existing-${idx}`} className="aspect-square bg-[var(--color-background)] relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm group">
                  <img className="w-full h-full object-cover" src={imgUrl} alt={`Existing ${idx + 1}`} />
                  <button onClick={() => removeExistingImage(idx)} className="absolute top-2 right-2 bg-[var(--color-danger)] text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))}
               {images.map((img, idx) => (
                <div key={`new-${idx}`} className="aspect-square bg-[var(--color-background)] relative rounded-2xl overflow-hidden border-2 border-[var(--color-primary)] shadow-sm group">
                  <img className="w-full h-full object-cover" src={img.previewUrl} alt={`New upload preview ${idx + 1}`} />
                  <div className="absolute inset-0 bg-[var(--color-primary)]/10 pointer-events-none"></div>
                  <span className="absolute bottom-2 left-2 text-[10px] bg-[var(--color-primary)] text-white px-2 py-1 rounded-md font-bold shadow-sm">NEW</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all shadow-md active:scale-90"
                    title="Remove image"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
              <label className="aspect-square bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group cursor-pointer shadow-sm">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-sm font-bold text-[var(--color-text-secondary)]">Add More</span>
              </label>
            </div>
          </section>

          {/* Listing Details */}
          <section className="card-standard p-6 md:p-8 space-y-8">
            
            {/* Status Toggle */}
            <div className="space-y-4 col-span-full border-b border-[var(--color-border)] pb-6">
              <label className="input-label block">Listing Status</label>
              <div className="flex gap-4">
                <button className={`py-2 px-6 rounded-full font-bold text-sm transition-all border-2 ${formData.status === 'ACTIVE' || formData.status === 'AVAILABLE' ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm' : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'}`} onClick={(e) => { e.preventDefault(); setFormData({...formData, status: 'ACTIVE'}); }}>ACTIVE</button>
                <button className={`py-2 px-6 rounded-full font-bold text-sm transition-all border-2 ${formData.status === 'SOLD' ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm' : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'}`} onClick={(e) => { e.preventDefault(); setFormData({...formData, status: 'SOLD'}); }}>SOLD / COMPLETED</button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-full">
                <label className="input-label block">Listing Title</label>
                <input className="input-standard" placeholder="What are you selling?" type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="input-label block">Category</label>
                <div className="relative">
                  <select className="input-standard appearance-none bg-none pr-10" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Development Boards</option>
                    <option>Robotics Components</option>
                    <option>Sensors</option>
                    <option>Communication Modules</option>
                    <option>Motors & Actuators</option>
                    <option>Power & Batteries</option>
                    <option>Displays</option>
                    <option>Electronic Components</option>
                    <option>Refurbished Gear</option>
                    <option>Cameras & Vision</option>
                    <option>Mechanical Parts</option>
                    <option>3D Printing</option>
                    <option>Drone Components</option>
                    <option>AI Hardware</option>
                    <option>Networking</option>
                    <option>Lab Equipment</option>
                    <option>Project Assets</option>
                    <option>Project Kits</option>
                    <option>Driver Modules</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="input-label block">Price</label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[var(--color-text-secondary)]">Free / Donate</span>
                    <button className={`w-12 h-6 rounded-full p-[3px] transition-colors relative shadow-inner ${formData.isFree ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}`} onClick={() => setFormData({...formData, isFree: !formData.isFree, price: !formData.isFree ? '0.00' : formData.price})}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.isFree ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)]">₹</span>
                  <input className={`input-standard pl-10 ${formData.isFree ? 'opacity-50 cursor-not-allowed bg-[var(--color-background)]' : ''}`} placeholder="0.00" type="number" disabled={formData.isFree} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Condition Toggle */}
            <div className="space-y-3">
              <label className="input-label block">Condition</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['NEW', 'NOT USED', 'USED', 'MINOR DAMAGE'].map(cond => (
                  <button 
                    key={cond}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${formData.condition === cond ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'}`} 
                    onClick={() => setFormData({...formData, condition: cond})}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="input-label block">Technical Specs</label>
                <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-sm">precision_manufacturing</span>
              </div>
              <textarea className="input-standard resize-none" placeholder="Input voltage, data protocols, dimensions, or specific chip models..." rows="4" value={formData.techSpecs} onChange={e => setFormData({...formData, techSpecs: e.target.value})}></textarea>
            </div>

            {/* Why Sell Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="input-label block">Why You Want To Sell</label>
                <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-sm">help_outline</span>
              </div>
              <textarea className="input-standard resize-none" placeholder="Upgrading, finished project, extra parts..." rows="3" value={formData.whySell} onChange={e => setFormData({...formData, whySell: e.target.value})}></textarea>
            </div>
            
            {/* Project Links */}
            <div className="space-y-2">
              <label className="input-label block">Project Links</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">link</span>
                <input className="input-standard pl-12" placeholder="GitHub, schematic URL, or documentation..." type="text" value={formData.projectLinks} onChange={e => setFormData({...formData, projectLinks: e.target.value})} />
              </div>
            </div>
          </section>

          {/* Post Action */}
          <div className="flex flex-col gap-4 pt-4 pb-8">
            <button className="btn-primary w-full py-4 text-lg justify-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleUpdate} disabled={isPosting}>
              <span className="material-symbols-outlined" >save</span>
              {isPosting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
