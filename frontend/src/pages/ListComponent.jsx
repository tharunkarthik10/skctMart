import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';
import { BottomNav } from '../components/BottomNav';
import { isProfileComplete } from '../utils/profileUtils';

export const ListComponent = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  
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

  const [formData, setFormData] = useState({
    title: '',
    category: 'Processing Units',
    listingType: 'SELL',
    auctionDuration: '3 Days',
    autoWinPrice: '',
    price: '',
    condition: 'NEW',
    techSpecs: '',
    whySell: '',
    projectLinks: ''
  });

  const handlePost = async () => {
    try {
      setIsPosting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to post a listing.');
        setIsPosting(false);
        return;
      }

      const { data: profile } = await apiClient.get(`/users/${user.id}`).catch(() => ({ data: {} }));
      if (!isProfileComplete(profile)) {
        alert('Please complete your profile details (Name, Register No, Department, Year, Mobile Number) and save them for verification before posting a listing.');
        navigate('/profile');
        setIsPosting(false);
        return;
      }

      const isAdminUser = profile?.is_admin || profile?.role === 'Admin' || user?.email === '727824tuio046@skct.edu.in';
      if (!isAdminUser && !profile?.is_profile_verified && !profile?.pending_profile_updates) {
        alert('Your profile details are pending admin verification. You can only list components once verified.');
        navigate('/profile');
        setIsPosting(false);
        return;
      }

      // Process user uploaded images
      const uploadedImageUrls = [];

      for (const img of images) {
        let uploadedUrl = null;
        
        try {
          const presignRes = await apiClient.post('/upload/presigned-url', { prefix: 'components' });
          const { uploadUrl, publicUrl } = presignRes.data;

          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: img.file,
            headers: {
              'Content-Type': img.file.type || 'image/webp'
            }
          });
          
          if (uploadRes.ok) {
            uploadedUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.warn("R2 presigned upload unavailable, converting file locally:", uploadErr);
        }

        // Compress and convert file to web-optimized data URL so exact image is saved
        if (!uploadedUrl && img.file) {
          uploadedUrl = await new Promise((resolve) => {
            const image = new Image();
            const reader = new FileReader();
            reader.onload = (e) => {
              image.src = e.target.result;
            };
            image.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_SIZE = 1000;
              let width = image.width;
              let height = image.height;
              if (width > height) {
                if (width > MAX_SIZE) {
                  height = Math.round((height * MAX_SIZE) / width);
                  width = MAX_SIZE;
                }
              } else {
                if (height > MAX_SIZE) {
                  width = Math.round((width * MAX_SIZE) / height);
                  height = MAX_SIZE;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(image, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            image.onerror = () => resolve(null);
            reader.readAsDataURL(img.file);
          });
        }

        if (uploadedUrl) {
          uploadedImageUrls.push(uploadedUrl);
        }
      }

      if (uploadedImageUrls.length === 0) {
        uploadedImageUrls.push('https://images.unsplash.com/photo-1618941709602-9c2af812069b?q=80&w=800&auto=format&fit=crop');
      }

      // Save to Express Backend
      await apiClient.post('/components', {
        title: formData.title,
        category: formData.category,
        is_free: false,
        price: parseFloat(formData.price || 0),
        condition: formData.condition,
        tech_specs: formData.techSpecs,
        why_sell: formData.whySell,
        images: uploadedImageUrls,
        status: 'ACTIVE',
        listing_type: formData.listingType,
        auction_duration: formData.auctionDuration,
        auto_win_price: parseFloat(formData.autoWinPrice || 0)
      });

      alert('Listing posted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error posting listing:', error);
      alert('Failed to post listing: ' + error.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24">
      
      {/* TopAppBar */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">List Your Hardware</h1>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="space-y-8">
          
          {/* Image Upload Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Product Photos</label>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Up to 10 photos</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <label className="aspect-square bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group cursor-pointer shadow-sm">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-sm font-bold text-[var(--color-text-secondary)]">Add Image</span>
              </label>
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-[var(--color-background)] relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm group">
                    <img className="w-full h-full object-cover" src={img.previewUrl} alt={`Uploaded preview ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all shadow-md active:scale-90"
                      title="Remove image"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="aspect-square bg-[var(--color-background)] relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm">
                  <div className="w-full h-full bg-[var(--color-border)] opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface)]/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">Sample</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Listing Details */}
          <section className="card-standard p-6 md:p-8 space-y-8">
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 col-span-full">
                <label className="input-label block">Listing Title</label>
                <input className="input-standard" placeholder="What are you selling?" type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2 col-span-1">
                <div className="h-6 flex items-center">
                  <label className="input-label block mb-0">Category</label>
                </div>
                <div className="relative">
                  <select className="input-standard appearance-none bg-none pr-10" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Processing Units</option>
                    <option>Sensors</option>
                    <option>Actuators and Displays</option>
                    <option>Communication Modules</option>
                    <option>Power Management Electronics</option>
                    <option>Discrete & Analog Components</option>
                    <option>Prototyping & Manufacturing Gear</option>
                    <option>Enclosures & Mechanical Shells</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Listing Type */}
              <div className="space-y-2 col-span-2">
                <div className="h-6 flex items-center">
                  <label className="input-label block mb-0">Listing Type</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['SELL', 'AUCTION'].map(type => (
                    <button 
                      key={type}
                      className={`py-3.5 rounded-xl font-bold text-sm transition-all border-2 ${formData.listingType === type ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'}`} 
                      onClick={() => setFormData({...formData, listingType: type})}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price / Starting Bid */}
              <div className="space-y-2 col-span-1">
                <div className="h-6 flex items-center">
                  <label className="input-label block mb-0">{formData.listingType === 'AUCTION' ? 'Starting Bid' : 'Price'}</label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)]">₹</span>
                  <input className="input-standard pl-10" placeholder="0.00" type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>

              {formData.listingType === 'AUCTION' && (
                <>
                  <div className="space-y-2 col-span-1">
                    <div className="h-6 flex items-center">
                      <label className="input-label block mb-0">Auction Duration</label>
                    </div>
                    <div className="relative">
                      <select className="input-standard appearance-none bg-none pr-10" value={formData.auctionDuration} onChange={e => setFormData({...formData, auctionDuration: e.target.value})}>
                        <option>1 Day</option>
                        <option>3 Days</option>
                        <option>5 Days</option>
                        <option>7 Days</option>
                        <option>10 Days</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 col-span-1">
                    <div className="h-6 flex items-center justify-between">
                      <label className="input-label block mb-0">Auto-Win Price</label>
                      <span className="text-[10px] bg-[var(--color-background)] px-2 py-0.5 rounded text-[var(--color-text-secondary)] font-bold">Buy it Now</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)]">₹</span>
                      <input className="input-standard pl-10" placeholder="e.g. 5000 (Optional)" type="number" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }} value={formData.autoWinPrice} onChange={e => setFormData({...formData, autoWinPrice: e.target.value})} />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">Auction automatically ends if a bid reaches this amount.</p>
                  </div>
                </>
              )}
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
            <button className="btn-primary w-full py-4 text-lg justify-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handlePost} disabled={isPosting}>
              <span className="material-symbols-outlined" >send</span>
              {isPosting ? 'Uploading...' : 'Post Listing'}
            </button>
            <p className="text-xs font-semibold text-center text-[var(--color-text-secondary)]">By posting, you agree to the MakerMart Sustainable Trading Policy.</p>
          </div>

        </div>
      </main>
      <BottomNav />
    </div>
  );
};
