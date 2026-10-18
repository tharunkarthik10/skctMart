import React, { useState } from 'react';
import apiClient from '../api/client';
import { compressImage } from '../utils/imageCompressor';

export const PostEventModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'hackathon',
    date: '2026-10-29',
    time: '09:30 AM - 04:30 PM',
    college: 'Sri Krishna College of Technology (SKCT), Coimbatore',
    department: 'Dept. of Computer Science & Engineering',
    location: '',
    desc: '',
    organizer: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    posterUrl: '',
    link: '',
    prize: '',
    perk: '',
    stallsTotal: '20',
  });

  if (!isOpen) return null;

  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompressingImage(true);
      try {
        // Automatically compress camera/poster image to web-optimized WebP/JPEG
        const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 });
        
        // Try uploading to R2 if available
        let finalUrl = null;
        try {
          const presignRes = await apiClient.post('/upload/presigned-url', { prefix: 'events' });
          const { uploadUrl, publicUrl } = presignRes.data;

          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: compressed.file,
            headers: {
              'Content-Type': compressed.file.type || 'image/webp'
            }
          });
          if (uploadRes.ok) {
            finalUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.warn("R2 presigned upload unavailable, using optimized data URL:", uploadErr);
        }

        if (!finalUrl) {
          finalUrl = compressed.dataUrl;
        }

        setFormData(prev => ({ ...prev, posterUrl: finalUrl }));
      } catch (err) {
        console.error("Compression error:", err);
        alert("Failed to process image. Please try a different photo.");
      } finally {
        setCompressingImage(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please provide the event title.");
      return;
    }
    if (!formData.location.trim()) {
      alert("Please provide the event venue / location.");
      return;
    }
    if (!formData.college?.trim()) {
      alert("Please specify the college or institution name.");
      return;
    }
    if (!formData.department?.trim()) {
      alert("Please specify the department details.");
      return;
    }
    if (!formData.organizer.trim()) {
      alert("Please specify the organizing department or student club.");
      return;
    }

    setLoading(true);
    try {
      // Format human-readable date
      const dateObj = new Date(formData.date);
      let formattedDate = formData.date;
      let day = 29;
      let month = 10;
      let year = 2026;

      if (!isNaN(dateObj.getTime())) {
        day = dateObj.getDate();
        month = dateObj.getMonth() + 1;
        year = dateObj.getFullYear();
        formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      const payload = {
        ...formData,
        date: formattedDate,
        day,
        month,
        year
      };

      const res = await apiClient.post('/events/proposals', payload);
      setSuccessData(res.data.proposal);
      if (onSuccess) {
        onSuccess(res.data.proposal);
      }
    } catch (err) {
      console.error("Error submitting event proposal:", err);
      alert("Failed to submit event proposal. " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    setFormData({
      title: '',
      category: 'hackathon',
      date: '2026-10-29',
      time: '09:30 AM - 04:30 PM',
      college: 'Sri Krishna College of Technology (SKCT), Coimbatore',
      department: 'Dept. of Computer Science & Engineering',
      location: '',
      desc: '',
      organizer: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      posterUrl: '',
      link: '',
      prize: '',
      perk: '',
      stallsTotal: '20',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-standard w-full max-w-2xl max-h-[92vh] flex flex-col p-6 sm:p-7 relative shadow-2xl rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-fadeIn my-auto">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5 rounded-full hover:bg-[var(--color-border)] transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Success Screen */}
        {successData ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-3xl shadow-sm">
              <span className="material-symbols-outlined text-4xl">task_alt</span>
            </div>
            
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
                Event Query Sent to Admin!
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mt-1.5">
                Your proposal for <strong className="text-[var(--color-text-primary)]">"{successData.title}"</strong> has been forwarded to the MakerMart Admin review queue.
              </p>
            </div>

            <div className="p-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
                <span className="font-bold text-[var(--color-text-secondary)]">Query Reference ID</span>
                <span className="font-mono font-bold text-[var(--color-primary)]">{successData.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-secondary)]">Assigned Section</span>
                <span className="font-bold uppercase tracking-wider text-[var(--color-text-primary)]">{successData.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-secondary)]">Review Status</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold text-[10px]">
                  Pending Admin Approval
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)] italic">
                The admin can accept, reject, or suggest edits. Once permitted, your event will automatically appear in the respective events section and campus calendar.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClose}
                className="btn-primary py-2.5 px-8 text-xs font-bold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <>
            <div className="flex items-center gap-3.5 mb-5 border-b border-[var(--color-border)] pb-4">
              <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">campaign</span>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[var(--color-text-primary)]">
                  Post New Campus Event
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Submit details, posters & links for admin review and publication
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              
              {/* Event Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TechSprint 2026: 24hr Campus Hackathon"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                    Event Section *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] font-semibold"
                  >
                    <option value="hackathon">🏆 Hackathon</option>
                    <option value="expo">🏭 Tech Expo</option>
                    <option value="workshop">🤖 Robotics Workshop</option>
                    <option value="campus">🎤 Campus Event</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                    Time Window
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM - 04:30 PM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
              </div>

              {/* Host College & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                    Host College / Campus *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Krishna College of Technology (SKCT)"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                    Hosting Department *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dept. of Computer Science & Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
              </div>

              {/* Event Venue */}
              <div>
                <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                  Event Venue / Hall / Lab (Where Event Takes Place) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Auditorium, Hall 1 / Hardware Robotics Lab 2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                  Description & Agenda *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Outline what participants will do, key topics, eligibility, and what makers will take away..."
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                ></textarea>
              </div>

              {/* Poster Upload & URL */}
              <div className="p-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] space-y-3">
                <span className="font-bold text-[var(--color-text-primary)] block">
                  Event Poster / Banner Image *
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-semibold flex items-center justify-between">
                      <span>Upload from Device (Auto-Compressed)</span>
                      {compressingImage && (
                        <span className="text-[var(--color-primary)] font-bold text-[10px] animate-pulse flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
                          Compressing...
                        </span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      disabled={compressingImage}
                      className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--color-primary)]/15 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/25 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-semibold">
                      Or Paste Image / Poster URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/poster.jpg"
                      value={formData.posterUrl.startsWith('data:') ? '' : formData.posterUrl}
                      onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                      className="w-full px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {formData.posterUrl && (
                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)]">
                    <img
                      src={formData.posterUrl}
                      alt="Poster Preview"
                      className="w-20 h-14 object-cover rounded-xl border border-[var(--color-border)] shadow-sm"
                    />
                    <div className="text-[11px] text-[var(--color-text-secondary)] flex-1">
                      <span className="font-bold text-emerald-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Poster Loaded
                      </span>
                      <span>This poster will be shown on the event card and admin preview.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Official Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                    Registration / External Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://unstop.com/ or Google Form"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                  />
                </div>

                {/* Dynamic Category Specific Field */}
                {formData.category === 'hackathon' && (
                  <div>
                    <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                      Prize Pool
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹50,000 Cash Prizes + Swag"
                      value={formData.prize}
                      onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                )}

                {formData.category === 'workshop' && (
                  <div>
                    <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                      Hardware Kit / Perk Included
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Free ESP32 Dev Board + Sensor Kit"
                      value={formData.perk}
                      onChange={(e) => setFormData({ ...formData, perk: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                )}

                {formData.category === 'expo' && (
                  <div>
                    <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                      Available Stalls Count
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={formData.stallsTotal}
                      onChange={(e) => setFormData({ ...formData, stallsTotal: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                )}

                {formData.category === 'campus' && (
                  <div>
                    <label className="block font-bold text-[var(--color-text-secondary)] mb-1">
                      Target Audience / Capacity
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 200+ Students & Faculty"
                      value={formData.prize}
                      onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                )}
              </div>

              {/* Organizer / Contact Info */}
              <div className="pt-2 border-t border-[var(--color-border)]">
                <span className="font-bold text-[var(--color-text-primary)] block mb-2.5">
                  Organizer & Contact Information
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">
                      Club / Department *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GDG SKCT or ECE Club"
                      value={formData.organizer}
                      onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tharun (Event Lead)"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">
                      Contact Email / Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 727824tuio046@skct.edu.in"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary py-2.5 px-5 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-2.5 px-6 font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="material-symbols-outlined text-base">send</span>
                  )}
                  Submit Event to Admin
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
